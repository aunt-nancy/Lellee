begin;

create table if not exists public.professional_course_review_requirements (
  course_id uuid not null references public.professional_courses(id) on delete cascade,
  review_type text not null check (review_type in ('source','curriculum','assessment','scope','capstone')),
  required_domains text[] not null,
  all_domains_required boolean not null default true,
  minimum_signoffs integer not null default 1 check (minimum_signoffs > 0),
  instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(course_id,review_type)
);

create table if not exists public.professional_course_review_signoffs (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.professional_courses(id) on delete cascade,
  review_type text not null check (review_type in ('source','curriculum','assessment','scope','capstone')),
  reviewer_name text not null,
  reviewer_qualification text not null,
  reviewer_domain text not null,
  reviewer_organization text,
  reviewer_evidence_ref text,
  decision text not null check (decision in ('approved','revisions_required')),
  notes text,
  attestation boolean not null default false,
  recorded_by uuid not null references auth.users(id),
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists professional_review_signoffs_course_idx
  on public.professional_course_review_signoffs(course_id,review_type,decision);
create index if not exists professional_review_signoffs_recorded_by_idx
  on public.professional_course_review_signoffs(recorded_by);

alter table public.professional_course_review_requirements enable row level security;
alter table public.professional_course_review_signoffs enable row level security;

revoke all on public.professional_course_review_requirements,public.professional_course_review_signoffs from anon,authenticated;

insert into public.professional_course_review_requirements(course_id,review_type,required_domains,all_domains_required,minimum_signoffs,instructions)
select c.id,'source',
  case c.course_key
    when 'coaching_foundations' then array['coaching_sme']
    when 'specialty_recovery' then array['recovery_sme']
    when 'specialty_reentry' then array['reentry_sme']
    when 'specialty_housing_stability' then array['housing_sme']
    when 'specialty_caregiving' then array['caregiving_sme']
    when 'specialty_grief_life_after_loss' then array['grief_sme']
    when 'specialty_workforce_new_beginnings' then array['workforce_sme']
  end,
  true,1,'Confirm source authority, currency, applicability, and that claims do not exceed the cited evidence.'
from public.professional_courses c
on conflict(course_id,review_type) do update
set required_domains=excluded.required_domains,instructions=excluded.instructions,updated_at=now();

insert into public.professional_course_review_requirements(course_id,review_type,required_domains,all_domains_required,minimum_signoffs,instructions)
select c.id,'curriculum',
  case c.course_key
    when 'coaching_foundations' then array['coaching_sme']
    when 'specialty_recovery' then array['recovery_sme']
    when 'specialty_reentry' then array['reentry_sme']
    when 'specialty_housing_stability' then array['housing_sme']
    when 'specialty_caregiving' then array['caregiving_sme']
    when 'specialty_grief_life_after_loss' then array['grief_sme']
    when 'specialty_workforce_new_beginnings' then array['workforce_sme']
  end,
  true,1,'Review content completeness, accuracy, sequencing, scope, terminology, and practical applicability.'
from public.professional_courses c
on conflict(course_id,review_type) do update
set required_domains=excluded.required_domains,instructions=excluded.instructions,updated_at=now();

insert into public.professional_course_review_requirements(course_id,review_type,required_domains,all_domains_required,minimum_signoffs,instructions)
select c.id,'assessment',array['instructional_design'],true,1,
  'Review question quality, distractors, scenario authenticity, answer rationales, cognitive rigor, bias, accessibility, and alignment to learning objectives.'
from public.professional_courses c
on conflict(course_id,review_type) do update
set required_domains=excluded.required_domains,instructions=excluded.instructions,updated_at=now();

insert into public.professional_course_review_requirements(course_id,review_type,required_domains,all_domains_required,minimum_signoffs,instructions)
select c.id,'scope',
  case c.course_key
    when 'coaching_foundations' then array['clinical_behavioral_health','legal_privacy']
    when 'specialty_recovery' then array['substance_use_recovery','clinical_behavioral_health']
    when 'specialty_reentry' then array['reentry_sme','legal']
    when 'specialty_housing_stability' then array['housing_sme','legal']
    when 'specialty_caregiving' then array['caregiving_sme','clinical_health']
    when 'specialty_grief_life_after_loss' then array['grief_sme','clinical_behavioral_health']
    when 'specialty_workforce_new_beginnings' then array['workforce_sme','employment_legal']
  end,
  true,2,'Qualified reviewers must confirm legal/clinical/professional boundaries, referral language, crisis escalation, and absence of unauthorized practice.'
from public.professional_courses c
on conflict(course_id,review_type) do update
set required_domains=excluded.required_domains,minimum_signoffs=excluded.minimum_signoffs,instructions=excluded.instructions,updated_at=now();

insert into public.professional_course_review_requirements(course_id,review_type,required_domains,all_domains_required,minimum_signoffs,instructions)
select c.id,'capstone',
  case c.course_key
    when 'coaching_foundations' then array['coaching_sme']
    when 'specialty_recovery' then array['recovery_sme']
    when 'specialty_reentry' then array['reentry_sme']
    when 'specialty_housing_stability' then array['housing_sme']
    when 'specialty_caregiving' then array['caregiving_sme']
    when 'specialty_grief_life_after_loss' then array['grief_sme']
    when 'specialty_workforce_new_beginnings' then array['workforce_sme']
  end,
  true,1,'Review capstone realism, scoring rubric, critical failures, passing standard, and alignment to course competencies.'
from public.professional_courses c
on conflict(course_id,review_type) do update
set required_domains=excluded.required_domains,instructions=excluded.instructions,updated_at=now();

create or replace function private.refresh_professional_review_domain(p_course_id uuid,p_review_type text)
returns text
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
declare
  req public.professional_course_review_requirements%rowtype;
  domain text;
  approved_count integer;
  missing_domain boolean := false;
  has_revisions boolean;
  result_status text;
begin
  select * into req
  from public.professional_course_review_requirements
  where course_id=p_course_id and review_type=p_review_type;

  if req.course_id is null then raise exception 'Review requirement not configured'; end if;

  select exists(
    select 1 from public.professional_course_review_signoffs s
    where s.course_id=p_course_id and s.review_type=p_review_type and s.decision='revisions_required'
  ) into has_revisions;

  if has_revisions then
    result_status:='revisions_required';
  else
    select count(distinct reviewer_name||'|'||reviewer_domain)
    into approved_count
    from public.professional_course_review_signoffs s
    where s.course_id=p_course_id and s.review_type=p_review_type
      and s.decision='approved' and s.attestation=true
      and char_length(trim(s.reviewer_qualification))>=10;

    if approved_count<req.minimum_signoffs then
      result_status:='internal_review';
    else
      if req.all_domains_required then
        foreach domain in array req.required_domains loop
          if not exists(
            select 1 from public.professional_course_review_signoffs s
            where s.course_id=p_course_id and s.review_type=p_review_type
              and s.reviewer_domain=domain and s.decision='approved' and s.attestation=true
              and char_length(trim(s.reviewer_qualification))>=10
          ) then missing_domain:=true; end if;
        end loop;
      end if;
      result_status:=case when missing_domain then 'internal_review' else 'approved' end;
    end if;
  end if;

  update public.professional_course_reviews
  set status=result_status,
      reviewed_at=case when result_status='approved' then now() else reviewed_at end,
      updated_at=now()
  where course_id=p_course_id and review_type=p_review_type;

  if p_review_type='assessment' then
    update public.professional_courses
    set assessment_review_status=case when result_status='approved' then 'approved' when result_status='revisions_required' then 'internal_review' else assessment_review_status end,
        updated_at=now()
    where id=p_course_id;

    if result_status='approved' then
      update public.professional_assessment_items a
      set review_status='approved',updated_at=now()
      from public.professional_course_modules m
      where a.module_id=m.id and m.course_id=p_course_id;
    elsif result_status='revisions_required' then
      update public.professional_assessment_items a
      set review_status='internal_review',updated_at=now()
      from public.professional_course_modules m
      where a.module_id=m.id and m.course_id=p_course_id;
    end if;
  end if;

  if p_review_type='curriculum' then
    update public.professional_courses
    set curriculum_review_status=case when result_status='approved' then 'approved' when result_status='revisions_required' then 'internal_review' else curriculum_review_status end,
        updated_at=now()
    where id=p_course_id;
  end if;

  if result_status='revisions_required' then
    update public.professional_courses set status='draft',checkout_enabled=false,updated_at=now() where id=p_course_id;
  end if;

  if exists(
    select 1 from public.professional_course_reviews r
    where r.course_id=p_course_id and r.review_type in ('source','curriculum','scope','capstone')
    group by r.course_id
    having count(*) filter(where r.status='approved')=4
  ) then
    update public.professional_course_modules
    set review_status='approved',reviewed_at=now(),updated_at=now()
    where course_id=p_course_id;
  else
    update public.professional_course_modules
    set review_status='internal_review',updated_at=now()
    where course_id=p_course_id;
  end if;

  return result_status;
end;
$$;
revoke all on function private.refresh_professional_review_domain(uuid,text) from public,anon,authenticated;

create or replace function private.admin_record_professional_review_signoff(
  p_course_key text,
  p_review_type text,
  p_reviewer_name text,
  p_reviewer_qualification text,
  p_reviewer_domain text,
  p_decision text,
  p_notes text default null,
  p_reviewer_organization text default null,
  p_reviewer_evidence_ref text default null,
  p_attestation boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
declare
  uid uuid:=auth.uid();
  c public.professional_courses%rowtype;
  req public.professional_course_review_requirements%rowtype;
  sid uuid;
  domain_status text;
begin
  if uid is null or not public.is_lellee_admin() then raise exception 'Admin access required'; end if;
  if p_review_type not in ('source','curriculum','assessment','scope','capstone') then raise exception 'Invalid review type'; end if;
  if p_decision not in ('approved','revisions_required') then raise exception 'Invalid decision'; end if;
  if char_length(trim(coalesce(p_reviewer_name,'')))<3 then raise exception 'Reviewer name is required'; end if;
  if char_length(trim(coalesce(p_reviewer_qualification,'')))<10 then raise exception 'Reviewer qualification is required'; end if;
  if not p_attestation then raise exception 'Reviewer attestation is required'; end if;

  select * into c from public.professional_courses where course_key=p_course_key;
  if c.id is null then raise exception 'Course not found'; end if;

  select * into req from public.professional_course_review_requirements
  where course_id=c.id and review_type=p_review_type;
  if req.course_id is null then raise exception 'Review requirement not configured'; end if;
  if not (p_reviewer_domain=any(req.required_domains)) then
    raise exception 'Reviewer domain % is not accepted for this review. Required: %',p_reviewer_domain,req.required_domains;
  end if;

  insert into public.professional_course_review_signoffs(
    course_id,review_type,reviewer_name,reviewer_qualification,reviewer_domain,
    reviewer_organization,reviewer_evidence_ref,decision,notes,attestation,recorded_by
  ) values(
    c.id,p_review_type,trim(p_reviewer_name),trim(p_reviewer_qualification),p_reviewer_domain,
    nullif(trim(coalesce(p_reviewer_organization,'')),''),
    nullif(trim(coalesce(p_reviewer_evidence_ref,'')),''),
    p_decision,nullif(trim(coalesce(p_notes,'')),''),true,uid
  ) returning id into sid;

  domain_status:=private.refresh_professional_review_domain(c.id,p_review_type);

  return jsonb_build_object(
    'signoff_id',sid,
    'course_key',c.course_key,
    'review_type',p_review_type,
    'review_status',domain_status
  );
end;
$$;
revoke all on function private.admin_record_professional_review_signoff(text,text,text,text,text,text,text,text,text,boolean) from public,anon;
grant execute on function private.admin_record_professional_review_signoff(text,text,text,text,text,text,text,text,text,boolean) to authenticated;

create or replace function public.admin_record_professional_review_signoff(
  p_course_key text,
  p_review_type text,
  p_reviewer_name text,
  p_reviewer_qualification text,
  p_reviewer_domain text,
  p_decision text,
  p_notes text default null,
  p_reviewer_organization text default null,
  p_reviewer_evidence_ref text default null,
  p_attestation boolean default false
)
returns jsonb
language sql
security invoker
set search_path=public,private,pg_catalog
as $$
  select private.admin_record_professional_review_signoff(
    p_course_key,p_review_type,p_reviewer_name,p_reviewer_qualification,p_reviewer_domain,
    p_decision,p_notes,p_reviewer_organization,p_reviewer_evidence_ref,p_attestation
  )
$$;
revoke all on function public.admin_record_professional_review_signoff(text,text,text,text,text,text,text,text,text,boolean) from public,anon;
grant execute on function public.admin_record_professional_review_signoff(text,text,text,text,text,text,text,text,text,boolean) to authenticated;

create or replace function private.get_admin_professional_training_review_center()
returns jsonb
language plpgsql
stable
security definer
set search_path=public,private,pg_catalog
as $$
declare uid uuid:=auth.uid();
begin
  if uid is null or not public.is_lellee_admin() then raise exception 'Admin access required'; end if;

  return jsonb_build_object(
    'summary',jsonb_build_object(
      'courses',(select count(*) from public.professional_courses),
      'modules',(select count(*) from public.professional_course_modules),
      'assessments',(select count(*) from public.professional_assessment_items),
      'enrollments',(select count(*) from public.professional_enrollments),
      'published',(select count(*) from public.professional_courses where status='published'),
      'checkout_enabled',(select count(*) from public.professional_courses where checkout_enabled)
    ),
    'courses',coalesce((
      select jsonb_agg(jsonb_build_object(
        'course_key',c.course_key,'title',c.title,'category',c.category,'price_cents',c.price_cents,
        'estimated_hours',c.estimated_hours,'status',c.status,'checkout_enabled',c.checkout_enabled,
        'issues',private.professional_course_release_issues(c.id),
        'modules',(select count(*) from public.professional_course_modules m where m.course_id=c.id),
        'assessments',(select count(*) from public.professional_assessment_items a join public.professional_course_modules m on m.id=a.module_id where m.course_id=c.id),
        'scenarios',(select count(*) from public.professional_assessment_items a join public.professional_course_modules m on m.id=a.module_id where m.course_id=c.id and a.item_type='scenario'),
        'reviews',coalesce((
          select jsonb_agg(jsonb_build_object(
            'review_type',r.review_type,'status',r.status,'findings',r.findings,
            'required_domains',req.required_domains,'minimum_signoffs',req.minimum_signoffs,
            'instructions',req.instructions,
            'signoffs',coalesce((
              select jsonb_agg(jsonb_build_object(
                'id',s.id,'reviewer_name',s.reviewer_name,'reviewer_qualification',s.reviewer_qualification,
                'reviewer_domain',s.reviewer_domain,'reviewer_organization',s.reviewer_organization,
                'reviewer_evidence_ref',s.reviewer_evidence_ref,'decision',s.decision,'notes',s.notes,
                'reviewed_at',s.reviewed_at
              ) order by s.reviewed_at desc)
              from public.professional_course_review_signoffs s
              where s.course_id=c.id and s.review_type=r.review_type
            ),'[]'::jsonb)
          ) order by r.review_type)
          from public.professional_course_reviews r
          join public.professional_course_review_requirements req
            on req.course_id=r.course_id and req.review_type=r.review_type
          where r.course_id=c.id
        ),'[]'::jsonb)
      ) order by case when c.category='foundation' then 0 else 1 end,c.title)
      from public.professional_courses c
    ),'[]'::jsonb),
    'recent_enrollments',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',e.id,'course_key',c.course_key,'title',c.title,'user_id',e.user_id,
        'status',e.status,'started_at',e.started_at,'completed_at',e.completed_at,
        'final_score',e.final_score
      ) order by e.created_at desc)
      from (select * from public.professional_enrollments order by created_at desc limit 100) e
      join public.professional_courses c on c.id=e.course_id
    ),'[]'::jsonb)
  );
end;
$$;
revoke all on function private.get_admin_professional_training_review_center() from public,anon;
grant execute on function private.get_admin_professional_training_review_center() to authenticated;

create or replace function public.get_admin_professional_training_review_center()
returns jsonb
language sql
security invoker
set search_path=public,private,pg_catalog
as $$ select private.get_admin_professional_training_review_center() $$;
revoke all on function public.get_admin_professional_training_review_center() from public,anon;
grant execute on function public.get_admin_professional_training_review_center() to authenticated;

commit;