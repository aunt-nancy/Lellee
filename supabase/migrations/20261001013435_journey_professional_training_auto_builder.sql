begin;

create table if not exists public.professional_journey_training_links (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  course_id uuid not null references public.professional_courses(id) on delete cascade,
  auto_generated boolean not null default false,
  generator_version text not null default 'journey-training-v1',
  build_status text not null default 'linked_existing'
    check (build_status in ('linked_existing','scaffold_created','evidence_queued','blocked_no_admin','internal_review','ready_for_human_review','published','retired')),
  program_status_at_build text,
  program_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(program_id),
  unique(course_id)
);

create index if not exists professional_journey_training_links_program_idx
  on public.professional_journey_training_links(program_id);
create index if not exists professional_journey_training_links_course_idx
  on public.professional_journey_training_links(course_id);

alter table public.professional_journey_training_links enable row level security;
revoke all on public.professional_journey_training_links from anon;
grant select on public.professional_journey_training_links to authenticated;

drop policy if exists professional_journey_training_links_admin_read
on public.professional_journey_training_links;
create policy professional_journey_training_links_admin_read
on public.professional_journey_training_links
for select to authenticated
using (public.is_lellee_admin());

create table if not exists public.professional_training_evidence_requirements (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.professional_courses(id) on delete cascade,
  module_id uuid not null references public.professional_course_modules(id) on delete cascade,
  status text not null default 'queued'
    check (status in ('queued','researching','draft_ready','internal_review','approved','revisions_required')),
  minimum_sources integer not null default 3 check (minimum_sources >= 3),
  minimum_authoritative_or_systematic integer not null default 2
    check (minimum_authoritative_or_systematic >= 1),
  recent_source_years integer not null default 5 check (recent_source_years between 1 and 10),
  allow_foundational_older_sources boolean not null default true,
  require_mixed_or_negative_findings boolean not null default true,
  require_scope_boundary_source boolean not null default true,
  require_claim_strength_match boolean not null default true,
  source_priority jsonb not null default
    '["systematic_review","government_guidance","professional_standard","peer_reviewed_research"]'::jsonb,
  research_topics jsonb not null default '[]'::jsonb,
  agent_task_id uuid references public.agent_tasks(id) on delete set null,
  reviewer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(module_id)
);

create index if not exists professional_training_evidence_course_idx
  on public.professional_training_evidence_requirements(course_id,status);
create index if not exists professional_training_evidence_task_idx
  on public.professional_training_evidence_requirements(agent_task_id);

alter table public.professional_training_evidence_requirements enable row level security;
revoke all on public.professional_training_evidence_requirements from anon;
grant select on public.professional_training_evidence_requirements to authenticated;

drop policy if exists professional_training_evidence_admin_read
on public.professional_training_evidence_requirements;
create policy professional_training_evidence_admin_read
on public.professional_training_evidence_requirements
for select to authenticated
using (public.is_lellee_admin());

insert into public.agent_definitions(
  agent_key,name,agent_type,description,status,
  human_review_required,external_execution_allowed,autonomous_action_allowed
)
values(
  'professional-training-evidence-builder',
  'Professional Training Evidence Builder',
  'program_builder',
  'Builds evidence-informed professional-training drafts when a Lellee Journey becomes participant-available. Research must use real authoritative sources, preserve mixed or negative findings, match claim strength to evidence, create applied assessments, and never publish or enable checkout.',
  'active',
  true,
  true,
  false
)
on conflict(agent_key) do update
set name=excluded.name,
    agent_type=excluded.agent_type,
    description=excluded.description,
    status='active',
    human_review_required=true,
    external_execution_allowed=true,
    autonomous_action_allowed=false,
    updated_at=now();

insert into public.agent_guardrails(guardrail_key,label,detail,enabled)
values
 ('professional_training_no_auto_publish','Professional training cannot auto-publish',
  'Journey-triggered training generation may research and draft content, assessments, and capstones, but must never approve review gates, publish a course, enable checkout, or issue credentials.',true),
 ('professional_training_real_sources_only','Professional training uses verifiable sources',
  'Never invent citations. Prefer systematic reviews, current government guidance, professional standards, and peer-reviewed research. Source links and claims must be reviewable by humans.',true),
 ('professional_training_mixed_evidence','Professional training preserves mixed evidence',
  'Do not cherry-pick favorable findings. Preserve important mixed, null, negative, or uncertain evidence and scale claims to the strength of the evidence.',true),
 ('professional_training_scope_boundaries','Professional training preserves role boundaries',
  'Drafts must distinguish coaching/education/support from diagnosis, treatment, medication advice, individualized legal advice, emergency services, and other regulated practice.',true)
on conflict(guardrail_key) do update
set label=excluded.label,detail=excluded.detail,enabled=true;

create or replace function private.seed_auto_professional_course_reviews(
  p_course_id uuid,
  p_domain_key text
)
returns void
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
begin
  insert into public.professional_course_reviews(course_id,review_type,status,findings)
  values
    (p_course_id,'source','internal_review',
      '{"auto_generated":true,"evidence_review":"pending"}'::jsonb),
    (p_course_id,'curriculum','internal_review',
      '{"auto_generated":true,"content_review":"pending"}'::jsonb),
    (p_course_id,'assessment','internal_review',
      '{"auto_generated":true,"assessment_review":"pending"}'::jsonb),
    (p_course_id,'scope','internal_review',
      '{"auto_generated":true,"scope_review":"pending"}'::jsonb),
    (p_course_id,'capstone','internal_review',
      '{"auto_generated":true,"capstone_review":"pending"}'::jsonb)
  on conflict(course_id,review_type) do nothing;

  insert into public.professional_course_review_requirements(
    course_id,review_type,required_domains,all_domains_required,
    minimum_signoffs,instructions,distinct_reviewers_required
  )
  values
    (p_course_id,'source',array[p_domain_key],true,1,
      'Confirm source authority, currency, applicability, mixed/negative findings, and that claims do not exceed the evidence.',false),
    (p_course_id,'curriculum',array[p_domain_key],true,1,
      'Review content completeness, accuracy, sequencing, participant autonomy, scope, terminology, and practical applicability.',false),
    (p_course_id,'assessment',array['instructional_design'],true,1,
      'Review alignment, cognitive rigor, scenario authenticity, distractors, answer rationales, accessibility, bias, and passing standard.',false),
    (p_course_id,'scope',array[p_domain_key,'legal_clinical_scope'],true,2,
      'Review professional, clinical, legal, safety, referral, privacy, crisis, and regulated-practice boundaries.',true),
    (p_course_id,'capstone',array[p_domain_key],true,1,
      'Review capstone realism, competency coverage, scoring rubric, critical failures, and passing standard.',false)
  on conflict(course_id,review_type) do nothing;

  insert into public.professional_course_review_assignments(
    course_id,review_type,reviewer_domain,status
  )
  select req.course_id,req.review_type,d.domain,'unassigned'
  from public.professional_course_review_requirements req
  cross join lateral unnest(req.required_domains) d(domain)
  where req.course_id=p_course_id
  on conflict(course_id,review_type,reviewer_domain) do nothing;
end;
$$;
revoke all on function private.seed_auto_professional_course_reviews(uuid,text)
from public,anon,authenticated;

create or replace function private.queue_professional_module_evidence_build(
  p_course_id uuid,
  p_module_id uuid,
  p_program_id uuid
)
returns uuid
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
declare
  v_program public.programs%rowtype;
  v_module public.professional_course_modules%rowtype;
  v_agent_id uuid;
  v_admin_id uuid;
  v_task_id uuid;
  v_topics jsonb;
  v_objective text;
begin
  select * into v_program from public.programs where id=p_program_id;
  select * into v_module from public.professional_course_modules where id=p_module_id;

  if v_program.id is null or v_module.id is null or v_module.module_type='capstone' then
    return null;
  end if;

  select id into v_agent_id
  from public.agent_definitions
  where agent_key='professional-training-evidence-builder'
    and status='active'
  limit 1;

  select user_id into v_admin_id
  from public.admin_user_roles
  where active=true and role='admin'
  order by created_at
  limit 1;

  v_topics := jsonb_build_array(
    v_program.name,
    coalesce(v_module.title,''),
    coalesce(v_module.summary,''),
    coalesce(v_program.short_description,''),
    coalesce(v_program.journey_config->'priorities','[]'::jsonb),
    coalesce(v_program.journey_config->'specialist_reviews','[]'::jsonb)
  );

  insert into public.professional_training_evidence_requirements(
    course_id,module_id,status,minimum_sources,
    minimum_authoritative_or_systematic,recent_source_years,
    allow_foundational_older_sources,require_mixed_or_negative_findings,
    require_scope_boundary_source,require_claim_strength_match,
    research_topics
  )
  values(
    p_course_id,p_module_id,'queued',3,2,5,
    true,true,true,true,v_topics
  )
  on conflict(module_id) do update
  set research_topics=excluded.research_topics,
      updated_at=now();

  if v_agent_id is null or v_admin_id is null then
    return null;
  end if;

  select t.id into v_task_id
  from public.agent_tasks t
  where t.agent_id=v_agent_id
    and t.source_type='professional_training_module'
    and t.source_reference=p_module_id::text
    and t.status not in ('cancelled','rejected','failed')
  order by t.created_at desc
  limit 1;

  if v_task_id is null then
    v_objective :=
      'Research and draft the professional-training module "'||v_module.title||
      '" for the Lellee Journey "'||v_program.name||'". '||
      'Use the Journey stage/priority context, but independently verify the instructional claims. '||
      'Minimum evidence standard: at least 3 verifiable sources, including at least 2 authoritative/systematic sources; '||
      'prefer systematic reviews, current government guidance, professional standards, and peer-reviewed research; '||
      'include at least one reasonably current source for changing topics while allowing justified foundational older sources. '||
      'Preserve mixed, null, negative, or uncertain findings. Match claim strength to evidence. '||
      'Do not describe the Lellee curriculum itself as evidence-based unless separately validated. '||
      'Draft a substantive lesson, learning objectives, practice activities, 8 assessment items with applied scenarios, rationales, '||
      'and explicit coaching/education versus clinical/legal/medical/safety boundaries. '||
      'Never publish the course, enable checkout, approve review gates, or create credentials. Human review is required.';

    insert into public.agent_tasks(
      agent_id,title,objective,task_type,status,priority,
      source_type,source_reference,requested_by,assigned_review_user_id,
      human_review_required,external_execution_required
    )
    values(
      v_agent_id,
      'Evidence build: '||v_program.name||' — '||v_module.title,
      v_objective,
      'research','queued','high',
      'professional_training_module',p_module_id::text,
      v_admin_id,v_admin_id,true,true
    )
    returning id into v_task_id;
  end if;

  update public.professional_training_evidence_requirements
  set agent_task_id=v_task_id,updated_at=now()
  where module_id=p_module_id;

  return v_task_id;
end;
$$;
revoke all on function private.queue_professional_module_evidence_build(uuid,uuid,uuid)
from public,anon,authenticated;

create or replace function private.ensure_professional_training_for_program(
  p_program_id uuid
)
returns uuid
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
declare
  p public.programs%rowtype;
  v_course_id uuid;
  v_existing_key text;
  v_course_key text;
  v_slug_key text;
  v_domain_key text;
  v_stage_count integer;
  v_instruction_count integer:=0;
  v_instruction_minutes integer;
  v_rec record;
  v_module_id uuid;
  v_seq integer:=0;
  v_admin_id uuid;
  v_snapshot jsonb;
  v_available boolean;
  v_priority_count integer;
  v_link_status text;
begin
  select * into p from public.programs where id=p_program_id;
  if p.id is null then return null; end if;

  v_available :=
    p.status='active'
    or (
      p.status='pilot'
      and lower(coalesce(p.journey_config->>'internal_only','false'))<>'true'
    );

  if not v_available then
    return null;
  end if;

  select course_id into v_course_id
  from public.professional_journey_training_links
  where program_id=p.id
  limit 1;
  if v_course_id is not null then
    return v_course_id;
  end if;

  v_existing_key := case p.slug
    when 'recovery' then 'specialty_recovery'
    when 'reentry' then 'specialty_reentry'
    when 'caregiving' then 'specialty_caregiving'
    when 'housing-stability' then 'specialty_housing_stability'
    when 'grief' then 'specialty_grief_life_after_loss'
    when 'workforce-reentry' then 'specialty_workforce_new_beginnings'
    else null
  end;

  if v_existing_key is not null then
    select id into v_course_id
    from public.professional_courses
    where course_key=v_existing_key;

    if v_course_id is not null then
      insert into public.professional_journey_training_links(
        program_id,course_id,auto_generated,generator_version,
        build_status,program_status_at_build,program_snapshot
      )
      values(
        p.id,v_course_id,false,'journey-training-v1',
        'linked_existing',p.status,
        jsonb_build_object(
          'slug',p.slug,'name',p.name,'status',p.status,
          'journey_config',p.journey_config,'linked_at',now()
        )
      )
      on conflict(program_id) do nothing;

      return v_course_id;
    end if;
  end if;

  v_slug_key := trim(both '_' from regexp_replace(lower(p.slug),'[^a-z0-9]+','_','g'));
  v_course_key := 'specialty_'||v_slug_key;
  v_domain_key := v_slug_key||'_sme';

  select count(*) into v_stage_count
  from public.program_journey_stages s
  where s.program_id=p.id
    and coalesce(s.status,'draft')<>'retired';

  select jsonb_array_length(
    case
      when jsonb_typeof(p.journey_config->'priorities')='array'
      then p.journey_config->'priorities'
      else '[]'::jsonb
    end
  ) into v_priority_count;

  if v_stage_count>0 then
    v_instruction_count:=v_stage_count;
  elsif v_priority_count>=3 then
    v_instruction_count:=least(v_priority_count,5);
  else
    v_instruction_count:=5;
  end if;

  v_instruction_minutes:=greatest(30,floor(300.0/v_instruction_count)::integer);

  insert into public.professional_courses(
    course_key,title,category,description,audience,
    price_cents,billing_mode,entitlement_key,payment_setting_key,
    estimated_hours,minimum_module_count,minimum_questions_per_module,
    minimum_scenario_items,module_pass_score,final_exam_pass_score,
    capstone_required,capstone_review_required,status,
    curriculum_review_status,assessment_review_status,checkout_enabled,
    certificate_title,certificate_scope_note
  )
  values(
    v_course_key,
    p.name||' Specialty',
    'specialty',
    'Evidence-informed professional training corresponding to the Lellee "'||p.name||
      '" Journey. Auto-generated draft; human evidence, curriculum, assessment, scope, and capstone review are required before release.',
    'professional',
    7900,'one_time',
    v_course_key,
    v_course_key||'_payment_link',
    6.00,
    v_instruction_count+1,
    8,
    greatest(4,v_instruction_count*2),
    80,80,true,true,
    'draft','draft','draft',false,
    p.name||' Specialty Completion',
    'Lellee course-completion certificate. This is not a professional license, clinical credential, legal credential, or independent authorization to practice.'
  )
  on conflict(course_key) do update
  set updated_at=now()
  returning id into v_course_id;

  v_snapshot:=jsonb_build_object(
    'slug',p.slug,
    'name',p.name,
    'status',p.status,
    'audience',p.audience,
    'short_description',p.short_description,
    'journey_config',p.journey_config,
    'stage_count',v_stage_count,
    'generator_version','journey-training-v1',
    'built_at',now()
  );

  insert into public.professional_journey_training_links(
    program_id,course_id,auto_generated,generator_version,
    build_status,program_status_at_build,program_snapshot
  )
  values(
    p.id,v_course_id,true,'journey-training-v1',
    'scaffold_created',p.status,v_snapshot
  )
  on conflict(program_id) do update
  set course_id=excluded.course_id,
      auto_generated=true,
      generator_version=excluded.generator_version,
      program_status_at_build=excluded.program_status_at_build,
      program_snapshot=excluded.program_snapshot,
      updated_at=now();

  if not exists(
    select 1 from public.professional_course_modules
    where course_id=v_course_id
  ) then
    if v_stage_count>0 then
      for v_rec in
        select s.stage_key,s.name,s.description,s.sequence
        from public.program_journey_stages s
        where s.program_id=p.id
          and coalesce(s.status,'draft')<>'retired'
        order by s.sequence
      loop
        v_seq:=v_seq+1;

        insert into public.professional_course_modules(
          course_id,module_key,sequence,title,summary,module_type,
          estimated_minutes,learning_objectives,practice_requirements,
          source_refs,content_md,required,minimum_score,
          requires_reflection,requires_assignment,requires_human_review,
          review_status
        )
        values(
          v_course_id,
          trim(both '_' from regexp_replace(lower(v_rec.stage_key),'[^a-z0-9]+','_','g')),
          v_seq,
          v_rec.name,
          v_rec.description,
          'instruction',
          v_instruction_minutes,
          jsonb_build_array(
            'Explain the evidence-informed principles relevant to '||lower(v_rec.name)||'.',
            'Apply the principles to realistic participant situations while preserving autonomy and scope.',
            'Identify when needs exceed coaching/educational support and require qualified referral or escalation.'
          ),
          jsonb_build_array(
            'Complete an applied scenario linked to this Journey stage.',
            'Document one scope boundary, referral point, or safety consideration relevant to the topic.'
          ),
          '[]'::jsonb,
          '# '||v_rec.name||E'\n\n**DRAFT EVIDENCE BUILD — NOT LEARNER READY**\n\nJourney context: '||
            coalesce(v_rec.description,p.short_description,'')||
            E'\n\nThis module was automatically scaffolded from the participant Journey. The Professional Training Evidence Builder must attach verifiable sources, preserve mixed or uncertain evidence, draft substantive instruction, and create approved assessments before this module can advance to Internal Review.',
          true,80,true,false,false,'draft'
        )
        returning id into v_module_id;

        perform private.queue_professional_module_evidence_build(
          v_course_id,v_module_id,p.id
        );
      end loop;

    elsif v_priority_count>=3 then
      for v_rec in
        select value as priority,ordinality::integer as seq
        from jsonb_array_elements_text(p.journey_config->'priorities') with ordinality
        order by ordinality
        limit 5
      loop
        v_seq:=v_seq+1;

        insert into public.professional_course_modules(
          course_id,module_key,sequence,title,summary,module_type,
          estimated_minutes,learning_objectives,practice_requirements,
          source_refs,content_md,required,minimum_score,
          requires_reflection,requires_assignment,requires_human_review,
          review_status
        )
        values(
          v_course_id,
          'priority_'||v_seq,
          v_seq,
          initcap(v_rec.priority),
          'Professional practice related to Journey priority: '||v_rec.priority||'.',
          'instruction',
          v_instruction_minutes,
          jsonb_build_array(
            'Explain evidence-informed principles relevant to '||v_rec.priority||'.',
            'Apply those principles in realistic participant-centered scenarios.',
            'Recognize scope, referral, privacy, accessibility, and safety boundaries.'
          ),
          jsonb_build_array(
            'Apply the topic to a realistic Journey scenario.',
            'Identify one appropriate referral or escalation boundary.'
          ),
          '[]'::jsonb,
          '# '||initcap(v_rec.priority)||E'\n\n**DRAFT EVIDENCE BUILD — NOT LEARNER READY**\n\nThis module was generated from a Journey priority. Evidence research, full instructional content, assessments, and human review are required before learner release.',
          true,80,true,false,false,'draft'
        )
        returning id into v_module_id;

        perform private.queue_professional_module_evidence_build(
          v_course_id,v_module_id,p.id
        );
      end loop;

    else
      for v_rec in
        select *
        from (values
          (1,'context_scope','Journey Context & Professional Scope','Understand the Journey context, participant needs, professional boundaries, and referral limits.'),
          (2,'evidence_practice','Evidence-Informed Practice','Apply current evidence and established guidance without overstating outcomes.'),
          (3,'planning_navigation','Planning & Navigation','Translate participant priorities into realistic, sequenced and measurable next steps.'),
          (4,'communication_coordination','Communication & Coordination','Use participant-centered communication, privacy-aware coordination, and appropriate resource navigation.'),
          (5,'sustainability_safety','Sustainability, Safety & Referral','Support sustainable progress while recognizing risk, limits, referral, and escalation.')
        ) x(seq,module_key,title,description)
      loop
        v_seq:=v_seq+1;

        insert into public.professional_course_modules(
          course_id,module_key,sequence,title,summary,module_type,
          estimated_minutes,learning_objectives,practice_requirements,
          source_refs,content_md,required,minimum_score,
          requires_reflection,requires_assignment,requires_human_review,
          review_status
        )
        values(
          v_course_id,v_rec.module_key,v_seq,v_rec.title,v_rec.description,
          'instruction',v_instruction_minutes,
          jsonb_build_array(
            'Explain evidence-informed principles relevant to this module.',
            'Apply those principles in participant-centered scenarios.',
            'Recognize scope, referral, privacy, accessibility, and safety boundaries.'
          ),
          jsonb_build_array(
            'Complete an applied scenario.',
            'Identify one evidence source and one scope/referral consideration.'
          ),
          '[]'::jsonb,
          '# '||v_rec.title||E'\n\n**DRAFT EVIDENCE BUILD — NOT LEARNER READY**\n\n'||
          v_rec.description||
          E'\n\nEvidence research, substantive lesson content, assessments, and human review are required before release.',
          true,80,true,false,false,'draft'
        )
        returning id into v_module_id;

        perform private.queue_professional_module_evidence_build(
          v_course_id,v_module_id,p.id
        );
      end loop;
    end if;

    insert into public.professional_course_modules(
      course_id,module_key,sequence,title,summary,module_type,
      estimated_minutes,learning_objectives,practice_requirements,
      source_refs,content_md,required,minimum_score,
      requires_reflection,requires_assignment,requires_human_review,
      review_status,review_rubric
    )
    values(
      v_course_id,
      'applied_capstone',
      v_instruction_count+1,
      p.name||' Specialty Applied Capstone',
      'Integrate the evidence-informed professional competencies from the full specialty.',
      'capstone',
      60,
      jsonb_build_array(
        'Integrate the major evidence-informed competencies from the specialty.',
        'Stay within professional scope and identify referral or escalation needs.',
        'Create a realistic participant-centered plan that preserves autonomy, privacy, and safety.'
      ),
      jsonb_build_array(
        'Submit a structured applied response integrating the full specialty.',
        'Explicitly identify role boundaries, evidence limitations, and referral/escalation decisions.'
      ),
      '[]'::jsonb,
      '# '||p.name||E' Specialty Applied Capstone\n\n**DRAFT — HUMAN REVIEW REQUIRED**\n\nThe Evidence Builder must draft a realistic integrative capstone scenario. The final capstone must be reviewed for evidence accuracy, professional scope, participant autonomy, applied planning, risk/referral, privacy, and course integration before learner release.',
      true,80,true,true,true,'draft',
      jsonb_build_object(
        'version','journey-training-v1',
        'pass_score',80,
        'human_review_required',true,
        'criteria',jsonb_build_array(
          jsonb_build_object('key','scope_boundaries','label','Role and scope boundaries','points',20,'description','Stays within role and correctly routes regulated or out-of-scope issues.'),
          jsonb_build_object('key','evidence_accuracy','label','Evidence and factual accuracy','points',15,'description','Uses course principles accurately and does not overstate evidence.'),
          jsonb_build_object('key','participant_autonomy','label','Participant autonomy and dignity','points',10,'description','Preserves participant choice, culture, privacy, access, and strengths.'),
          jsonb_build_object('key','applied_planning','label','Applied planning and prioritization','points',15,'description','Creates realistic, sequenced and participant-centered actions.'),
          jsonb_build_object('key','risk_referral','label','Risk recognition and referral','points',15,'description','Recognizes when coaching/education must shift to qualified, crisis, or emergency support.'),
          jsonb_build_object('key','privacy_documentation','label','Privacy and documentation','points',10,'description','Uses purpose-limited information sharing and objective documentation.'),
          jsonb_build_object('key','course_integration','label','Course-specific integration','points',15,'description','Integrates the major competencies taught in this specialty.')
        ),
        'critical_failures',jsonb_build_array(
          'Provides diagnosis, treatment or medication direction without authorization.',
          'Provides individualized legal conclusions or acts as legal authority.',
          'Guarantees outcomes, placement, eligibility, recovery, employment, safety, or another result.',
          'Overrides participant autonomy or privacy without an applicable safety/legal basis.',
          'Misses a serious safety escalation or materially exceeds the defined professional role.'
        )
      )
    );
  end if;

  perform private.seed_auto_professional_course_reviews(
    v_course_id,v_domain_key
  );

  select user_id into v_admin_id
  from public.admin_user_roles
  where active=true and role='admin'
  order by created_at
  limit 1;

  if v_admin_id is null then
    v_link_status:='blocked_no_admin';
  elsif exists(
    select 1 from public.professional_training_evidence_requirements er
    where er.course_id=v_course_id and er.agent_task_id is not null
  ) then
    v_link_status:='evidence_queued';
  else
    v_link_status:='scaffold_created';
  end if;

  update public.professional_journey_training_links
  set build_status=v_link_status,updated_at=now()
  where program_id=p.id;

  return v_course_id;
end;
$$;
revoke all on function private.ensure_professional_training_for_program(uuid)
from public,anon,authenticated;

create or replace function private.on_program_professional_training_sync()
returns trigger
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
begin
  if new.status='active'
     or (
       new.status='pilot'
       and lower(coalesce(new.journey_config->>'internal_only','false'))<>'true'
     ) then
    perform private.ensure_professional_training_for_program(new.id);
  end if;
  return new;
end;
$$;
revoke all on function private.on_program_professional_training_sync()
from public,anon,authenticated;

drop trigger if exists trg_program_professional_training_sync
on public.programs;
create trigger trg_program_professional_training_sync
after insert or update of status,journey_config
on public.programs
for each row
execute function private.on_program_professional_training_sync();

insert into public.professional_journey_training_links(
  program_id,course_id,auto_generated,generator_version,
  build_status,program_status_at_build,program_snapshot
)
select p.id,c.id,false,'journey-training-v1','linked_existing',p.status,
  jsonb_build_object(
    'slug',p.slug,'name',p.name,'status',p.status,
    'journey_config',p.journey_config,'linked_at',now()
  )
from (values
  ('recovery','specialty_recovery'),
  ('reentry','specialty_reentry'),
  ('caregiving','specialty_caregiving'),
  ('housing-stability','specialty_housing_stability'),
  ('grief','specialty_grief_life_after_loss'),
  ('workforce-reentry','specialty_workforce_new_beginnings')
) map(program_slug,course_key)
join public.programs p on p.slug=map.program_slug
join public.professional_courses c on c.course_key=map.course_key
on conflict(program_id) do nothing;

do $$
declare r record;
begin
  for r in
    select id
    from public.programs
    where status='active'
       or (
         status='pilot'
         and lower(coalesce(journey_config->>'internal_only','false'))<>'true'
       )
  loop
    perform private.ensure_professional_training_for_program(r.id);
  end loop;
end $$;

commit;