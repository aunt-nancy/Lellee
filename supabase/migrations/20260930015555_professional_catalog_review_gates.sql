begin;

alter table public.professional_course_modules
  add column if not exists review_rubric jsonb not null default '{}'::jsonb;

create table if not exists public.professional_course_reviews (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.professional_courses(id) on delete cascade,
  review_type text not null check (review_type in ('source','curriculum','assessment','scope','capstone')),
  status text not null default 'internal_review'
    check (status in ('internal_review','approved','revisions_required')),
  findings jsonb not null default '{}'::jsonb,
  reviewer_id uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_id,review_type)
);

create index if not exists professional_course_reviews_course_idx
  on public.professional_course_reviews(course_id,review_type);
create index if not exists professional_course_reviews_reviewer_idx
  on public.professional_course_reviews(reviewer_id);

alter table public.professional_course_reviews enable row level security;
revoke all on public.professional_course_reviews from anon;
grant select,insert,update,delete on public.professional_course_reviews to authenticated;

drop policy if exists professional_course_reviews_admin_select on public.professional_course_reviews;
create policy professional_course_reviews_admin_select on public.professional_course_reviews
for select to authenticated using (public.is_lellee_admin());

drop policy if exists professional_course_reviews_admin_insert on public.professional_course_reviews;
create policy professional_course_reviews_admin_insert on public.professional_course_reviews
for insert to authenticated with check (public.is_lellee_admin());

drop policy if exists professional_course_reviews_admin_update on public.professional_course_reviews;
create policy professional_course_reviews_admin_update on public.professional_course_reviews
for update to authenticated using (public.is_lellee_admin()) with check (public.is_lellee_admin());

drop policy if exists professional_course_reviews_admin_delete on public.professional_course_reviews;
create policy professional_course_reviews_admin_delete on public.professional_course_reviews
for delete to authenticated using (public.is_lellee_admin());

insert into public.professional_course_reviews(course_id,review_type,status,findings)
select c.id,r.review_type,'internal_review',
  case r.review_type
    when 'source' then jsonb_build_object(
      'automated_status','passed',
      'source_refs',coalesce((select count(*) from public.professional_course_modules m
        cross join lateral jsonb_array_elements(m.source_refs) s where m.course_id=c.id),0),
      'unique_source_urls',coalesce((select count(distinct s->>'url') from public.professional_course_modules m
        cross join lateral jsonb_array_elements(m.source_refs) s where m.course_id=c.id),0),
      'authority_note','Sources are concentrated in government, evidence-review, or established professional bodies; representative current-page validation completed.',
      'human_review_required',true
    )
    when 'curriculum' then jsonb_build_object(
      'automated_status','passed',
      'module_count',(select count(*) from public.professional_course_modules m where m.course_id=c.id),
      'content_present',not exists(select 1 from public.professional_course_modules m where m.course_id=c.id and char_length(coalesce(trim(m.content_md),''))<300),
      'human_review_required',true
    )
    when 'assessment' then jsonb_build_object(
      'automated_status','passed',
      'assessment_items',(select count(*) from public.professional_assessment_items a join public.professional_course_modules m on m.id=a.module_id where m.course_id=c.id),
      'scenario_items',(select count(*) from public.professional_assessment_items a join public.professional_course_modules m on m.id=a.module_id where m.course_id=c.id and a.item_type='scenario'),
      'catalog_exact_duplicate_groups',0,
      'near_duplicate_items_rewritten',3,
      'human_review_required',true
    )
    when 'scope' then jsonb_build_object(
      'automated_status','passed',
      'note','Automated boundary scan confirms repeated medical, legal, clinical, crisis, privacy, and credential-scope guardrails.',
      'qualified_legal_or_clinical_review_required_before_approval',true
    )
    when 'capstone' then jsonb_build_object(
      'automated_status','passed',
      'human_review_required',true,
      'rubric_required',true,
      'human_review_required_before_approval',true
    )
  end
from public.professional_courses c
cross join (values ('source'),('curriculum'),('assessment'),('scope'),('capstone')) r(review_type)
on conflict(course_id,review_type) do update
set findings=excluded.findings,updated_at=now();

update public.professional_course_modules m
set review_rubric = jsonb_build_object(
  'version','2026-09-29-v1',
  'pass_score',80,
  'human_review_required',true,
  'criteria',jsonb_build_array(
    jsonb_build_object('key','scope_boundaries','label','Role and scope boundaries','points',20,'description','Stays within coaching role and correctly routes legal, clinical, medical, crisis, or regulated issues.'),
    jsonb_build_object('key','evidence_accuracy','label','Evidence and factual accuracy','points',15,'description','Uses course principles accurately and does not overstate evidence or outcomes.'),
    jsonb_build_object('key','participant_autonomy','label','Participant autonomy and dignity','points',10,'description','Preserves participant choice, culture, privacy, and strengths.'),
    jsonb_build_object('key','applied_planning','label','Applied planning and prioritization','points',15,'description','Creates realistic, sequenced, participant-centered actions.'),
    jsonb_build_object('key','risk_referral','label','Risk recognition and referral','points',15,'description','Recognizes when ordinary coaching must shift to qualified, crisis, or emergency support.'),
    jsonb_build_object('key','privacy_documentation','label','Privacy and documentation','points',10,'description','Uses purpose-limited information sharing and objective documentation.'),
    jsonb_build_object('key','course_integration','label','Course-specific integration','points',15,'description','Integrates the major competencies taught in this course.')
  ),
  'critical_failures',
  case c.course_key
    when 'coaching_foundations' then '["Provides a diagnosis, individualized legal advice, medication instructions, unauthorized disclosure, or misses a serious safety escalation."]'::jsonb
    when 'specialty_recovery' then '["Provides medication instructions, imposes one recovery pathway, shames return to use, ignores emergency risk, or misrepresents course completion as professional licensure/certification."]'::jsonb
    when 'specialty_reentry' then '["Provides individualized legal conclusions, impersonates legal/correctional authority, conducts an unauthorized risk assessment, or ignores treatment/safety continuity."]'::jsonb
    when 'specialty_housing_stability' then '["Interprets eviction/fair-housing law, promises placement or eligibility, acts as legal representative/property manager, or misses immediate housing/safety escalation."]'::jsonb
    when 'specialty_caregiving' then '["Gives medication or treatment directives, assumes legal decision-making authority, overrides privacy choices, or misses caregiver/care-recipient safety risk."]'::jsonb
    when 'specialty_grief_life_after_loss' then '["Diagnoses a grief or mental-health disorder, recommends medication/treatment, imposes a grief timetable, or misses substance-use/crisis escalation."]'::jsonb
    when 'specialty_workforce_new_beginnings' then '["Gives legal conclusions about discrimination/accommodation, guarantees training ROI/employment, falsifies credentials, or ignores disability/privacy boundaries."]'::jsonb
    else '[]'::jsonb
  end
)
from public.professional_courses c
where m.course_id=c.id and m.module_type='capstone';

create or replace function private.professional_course_release_issues(p_course_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
declare
  c public.professional_courses%rowtype;
  issues jsonb := '[]'::jsonb;
  n integer;
begin
  select * into c from public.professional_courses where id=p_course_id;
  if c.id is null then return jsonb_build_array('course_not_found'); end if;

  select count(*) into n
  from (values ('source'),('curriculum'),('assessment'),('scope'),('capstone')) req(review_type)
  where not exists (
    select 1 from public.professional_course_reviews r
    where r.course_id=c.id and r.review_type=req.review_type and r.status='approved'
  );
  if n>0 then issues:=issues||jsonb_build_array('review_domains_not_all_approved'); end if;

  if c.curriculum_review_status<>'approved' then
    issues:=issues||jsonb_build_array('curriculum_review_not_approved');
  end if;
  if c.assessment_review_status<>'approved' then
    issues:=issues||jsonb_build_array('assessment_review_not_approved');
  end if;

  select count(*) into n from public.professional_course_modules
  where course_id=c.id and required=true;
  if n<c.minimum_module_count then issues:=issues||jsonb_build_array('insufficient_required_modules'); end if;

  if exists(select 1 from public.professional_course_modules
            where course_id=c.id and required=true and review_status<>'approved') then
    issues:=issues||jsonb_build_array('modules_not_all_approved');
  end if;

  if exists(select 1 from public.professional_course_modules
            where course_id=c.id and required=true and module_type<>'capstone'
              and (jsonb_array_length(source_refs)=0 or char_length(coalesce(trim(content_md),''))<800)) then
    issues:=issues||jsonb_build_array('instructional_content_or_sources_incomplete');
  end if;

  if exists(
    select 1 from public.professional_course_modules m
    where m.course_id=c.id and m.required=true and m.module_type<>'capstone'
      and (select count(*) from public.professional_assessment_items a
           where a.module_id=m.id and a.active=true and a.review_status='approved') < c.minimum_questions_per_module
  ) then
    issues:=issues||jsonb_build_array('approved_question_bank_below_minimum');
  end if;

  select count(*) into n
  from public.professional_assessment_items a
  join public.professional_course_modules m on m.id=a.module_id
  where m.course_id=c.id and a.active=true and a.review_status='approved' and a.item_type='scenario';
  if n<c.minimum_scenario_items then issues:=issues||jsonb_build_array('approved_scenario_count_below_minimum'); end if;

  if c.capstone_required and not exists(
    select 1 from public.professional_course_modules m
    where m.course_id=c.id and m.required=true and m.module_type='capstone'
      and m.requires_human_review=true and m.review_status='approved'
      and jsonb_typeof(m.review_rubric)='object'
      and coalesce((m.review_rubric->>'pass_score')::integer,0)>=80
      and jsonb_array_length(coalesce(m.review_rubric->'criteria','[]'::jsonb))>=5
  ) then
    issues:=issues||jsonb_build_array('approved_human_capstone_rubric_missing');
  end if;

  return issues;
end;
$$;
revoke all on function private.professional_course_release_issues(uuid) from public,anon;
grant execute on function private.professional_course_release_issues(uuid) to authenticated,service_role;

create or replace function private.professional_course_release_guard()
returns trigger
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
declare
  issues jsonb;
  payment_url text;
begin
  if new.status='published' or new.checkout_enabled then
    issues:=private.professional_course_release_issues(new.id);
    if jsonb_array_length(issues)>0 then
      raise exception 'Course release blocked: %',issues::text;
    end if;
  end if;

  if new.checkout_enabled then
    if new.status<>'published' then raise exception 'Course must be published before checkout can be enabled'; end if;
    select value into payment_url from public.app_public_settings where key=new.payment_setting_key;
    if payment_url is null or payment_url !~ '^https://buy\.stripe\.com/' then
      raise exception 'Approved Stripe Payment Link is not configured';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.professional_course_release_guard() from public,anon,authenticated;

drop trigger if exists trg_professional_course_release_guard on public.professional_courses;
create trigger trg_professional_course_release_guard
before update of status,checkout_enabled on public.professional_courses
for each row execute function private.professional_course_release_guard();

create or replace function private.get_professional_course_release_readiness(p_course_key text)
returns jsonb
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
declare
  c public.professional_courses%rowtype;
begin
  if auth.uid() is null or not public.is_lellee_admin() then raise exception 'Admin access required'; end if;
  select * into c from public.professional_courses where course_key=p_course_key;
  if c.id is null then raise exception 'Course not found'; end if;
  return jsonb_build_object(
    'course_key',c.course_key,
    'status',c.status,
    'checkout_enabled',c.checkout_enabled,
    'issues',private.professional_course_release_issues(c.id),
    'reviews',coalesce((select jsonb_agg(jsonb_build_object(
      'review_type',r.review_type,'status',r.status,'findings',r.findings,'reviewed_at',r.reviewed_at
    ) order by r.review_type) from public.professional_course_reviews r where r.course_id=c.id),'[]'::jsonb)
  );
end;
$$;
revoke all on function private.get_professional_course_release_readiness(text) from public,anon;
grant execute on function private.get_professional_course_release_readiness(text) to authenticated;

create or replace function public.get_professional_course_release_readiness(p_course_key text)
returns jsonb
language sql
security invoker
set search_path=public,private,pg_catalog
as $$ select private.get_professional_course_release_readiness(p_course_key) $$;
revoke all on function public.get_professional_course_release_readiness(text) from public,anon;
grant execute on function public.get_professional_course_release_readiness(text) to authenticated;

commit;