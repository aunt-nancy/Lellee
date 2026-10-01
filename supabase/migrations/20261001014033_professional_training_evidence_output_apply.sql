begin;

alter table public.professional_training_evidence_requirements
  add column if not exists mixed_evidence_note text,
  add column if not exists claim_strength_note text,
  add column if not exists source_audit jsonb not null default '{}'::jsonb,
  add column if not exists applied_output_id uuid references public.agent_outputs(id) on delete set null,
  add column if not exists applied_at timestamptz;

create index if not exists professional_training_evidence_output_idx
  on public.professional_training_evidence_requirements(applied_output_id);

create or replace function private.apply_approved_professional_training_output()
returns trigger
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
declare
  t public.agent_tasks%rowtype;
  a public.agent_definitions%rowtype;
  m public.professional_course_modules%rowtype;
  er public.professional_training_evidence_requirements%rowtype;
  payload jsonb;
  v_source_count integer;
  v_unique_urls integer;
  v_authoritative_count integer;
  v_current_count integer;
  v_scenario_count integer;
  v_bad_assessments integer;
  v_course_id uuid;
  v_program_id uuid;
  v_all_ready boolean;
begin
  if new.review_status is not distinct from old.review_status then
    return new;
  end if;

  select * into t
  from public.agent_tasks
  where id=new.task_id;

  if t.id is null or t.source_type<>'professional_training_module' then
    return new;
  end if;

  select * into a
  from public.agent_definitions
  where id=t.agent_id;

  if a.agent_key<>'professional-training-evidence-builder' then
    return new;
  end if;

  select * into m
  from public.professional_course_modules
  where id=t.source_reference::uuid;

  if m.id is null or m.module_type='capstone' then
    raise exception 'Evidence Builder task does not reference an instructional professional-training module';
  end if;

  select * into er
  from public.professional_training_evidence_requirements
  where module_id=m.id
  for update;

  if er.id is null then
    raise exception 'Evidence requirements are missing for this module';
  end if;

  if new.review_status='approved' then
    begin
      payload:=new.output_text::jsonb;
    exception when others then
      raise exception 'Approved Evidence Builder output must be valid structured JSON';
    end;

    if jsonb_typeof(payload)<>'object' then
      raise exception 'Evidence Builder output must be a JSON object';
    end if;

    if char_length(trim(coalesce(payload->>'content_md','')))<1800 then
      raise exception 'Evidence Builder lesson is below the 1,800-character internal-review minimum';
    end if;

    if jsonb_typeof(payload->'learning_objectives')<>'array'
       or jsonb_array_length(payload->'learning_objectives')<3 then
      raise exception 'Evidence Builder output requires at least 3 learning objectives';
    end if;

    if jsonb_typeof(payload->'practice_requirements')<>'array'
       or jsonb_array_length(payload->'practice_requirements')<2 then
      raise exception 'Evidence Builder output requires at least 2 practice requirements';
    end if;

    if jsonb_typeof(payload->'source_refs')<>'array' then
      raise exception 'Evidence Builder output requires source_refs';
    end if;

    select
      count(*),
      count(distinct nullif(trim(s->>'url'),'')),
      count(*) filter(
        where s->>'source_type' in ('systematic_review','government_guidance','professional_standard')
      ),
      count(*) filter(
        where lower(coalesce(s->>'current_or_recent','false'))='true'
      )
    into
      v_source_count,v_unique_urls,v_authoritative_count,v_current_count
    from jsonb_array_elements(payload->'source_refs') s;

    if v_source_count<er.minimum_sources or v_unique_urls<er.minimum_sources then
      raise exception 'Evidence Builder output requires at least % unique sources',er.minimum_sources;
    end if;

    if exists(
      select 1
      from jsonb_array_elements(payload->'source_refs') s
      where coalesce(s->>'url','') !~ '^https?://'
         or char_length(trim(coalesce(s->>'title','')))<3
         or char_length(trim(coalesce(s->>'claim_supported','')))<10
    ) then
      raise exception 'Every evidence source must have a valid URL, title, and supported-claim note';
    end if;

    if v_authoritative_count<er.minimum_authoritative_or_systematic then
      raise exception 'Evidence Builder output requires at least % authoritative/systematic sources',
        er.minimum_authoritative_or_systematic;
    end if;

    if v_current_count<1 then
      raise exception 'Evidence Builder output requires at least one source identified as current/recent';
    end if;

    if er.require_mixed_or_negative_findings
       and char_length(trim(coalesce(payload->>'mixed_evidence_note','')))<30 then
      raise exception 'Mixed/negative/uncertain evidence note is required';
    end if;

    if er.require_claim_strength_match
       and char_length(trim(coalesce(payload->>'claim_strength_note','')))<30 then
      raise exception 'Claim-strength note is required';
    end if;

    if jsonb_typeof(payload->'assessment_items')<>'array'
       or jsonb_array_length(payload->'assessment_items')<>8 then
      raise exception 'Evidence Builder output requires exactly 8 assessment items';
    end if;

    select
      count(*) filter(where item->>'item_type'='scenario'),
      count(*) filter(
        where item->>'item_type' not in ('multiple_choice','scenario')
           or jsonb_typeof(item->'choices')<>'array'
           or jsonb_array_length(item->'choices')<>4
           or coalesce((item->>'correct_index')::integer,-1) not between 0 and 3
           or char_length(trim(coalesce(item->>'prompt','')))<15
           or char_length(trim(coalesce(item->>'rationale','')))<15
           or char_length(trim(coalesce(item->>'source_note','')))<5
      )
    into v_scenario_count,v_bad_assessments
    from jsonb_array_elements(payload->'assessment_items') item;

    if v_scenario_count<3 then
      raise exception 'Evidence Builder output requires at least 3 scenario assessment items';
    end if;

    if v_bad_assessments>0 then
      raise exception 'One or more Evidence Builder assessment items failed structural validation';
    end if;

    update public.professional_course_modules
    set content_md=payload->>'content_md',
        learning_objectives=payload->'learning_objectives',
        practice_requirements=payload->'practice_requirements',
        source_refs=payload->'source_refs',
        review_status='internal_review',
        reviewed_by=null,
        reviewed_at=null,
        updated_at=now()
    where id=m.id;

    delete from public.professional_assessment_items
    where module_id=m.id;

    insert into public.professional_assessment_items(
      module_id,item_order,item_type,prompt,choices,correct_answer,
      rationale,source_note,review_status,active
    )
    select
      m.id,
      ordinality::integer,
      item->>'item_type',
      item->>'prompt',
      item->'choices',
      jsonb_build_object('index',(item->>'correct_index')::integer),
      item->>'rationale',
      item->>'source_note',
      'internal_review',
      true
    from jsonb_array_elements(payload->'assessment_items') with ordinality x(item,ordinality);

    update public.professional_training_evidence_requirements
    set status='internal_review',
        mixed_evidence_note=payload->>'mixed_evidence_note',
        claim_strength_note=payload->>'claim_strength_note',
        source_audit=jsonb_build_object(
          'source_count',v_source_count,
          'unique_urls',v_unique_urls,
          'authoritative_or_systematic',v_authoritative_count,
          'current_or_recent',v_current_count,
          'scenario_items',v_scenario_count,
          'validated_at',now()
        ),
        applied_output_id=new.id,
        applied_at=now(),
        updated_at=now()
    where id=er.id;

    v_course_id:=m.course_id;

    update public.professional_courses
    set status='draft',
        curriculum_review_status='internal_review',
        assessment_review_status='internal_review',
        checkout_enabled=false,
        updated_at=now()
    where id=v_course_id;

    update public.professional_course_reviews
    set findings=findings||jsonb_build_object(
      'auto_evidence_module_applied',true,
      'last_auto_evidence_apply_at',now()
    ),
    updated_at=now()
    where course_id=v_course_id
      and review_type in ('source','curriculum','assessment');

    select not exists(
      select 1
      from public.professional_training_evidence_requirements r
      where r.course_id=v_course_id
        and r.status not in ('internal_review','approved')
    )
    into v_all_ready;

    if v_all_ready then
      update public.professional_journey_training_links
      set build_status='internal_review',updated_at=now()
      where course_id=v_course_id;
    end if;

  elsif new.review_status in ('changes_requested','rejected') then
    update public.professional_training_evidence_requirements
    set status='revisions_required',
        reviewer_note=case
          when new.review_status='changes_requested'
            then 'Agent output changes requested during human review.'
          else 'Agent output rejected during human review.'
        end,
        updated_at=now()
    where id=er.id;

    update public.professional_journey_training_links
    set build_status='evidence_queued',updated_at=now()
    where course_id=m.course_id;
  end if;

  return new;
end;
$$;

revoke all on function private.apply_approved_professional_training_output()
from public,anon,authenticated;

drop trigger if exists trg_apply_approved_professional_training_output
on public.agent_outputs;

create trigger trg_apply_approved_professional_training_output
after update of review_status
on public.agent_outputs
for each row
execute function private.apply_approved_professional_training_output();

commit;