-- Production-safe Professional Training foundation.
-- Adapts training entitlements to the normalized production commerce model:
-- user_entitlements.entitlement_id -> commerce_entitlements.entitlement_key.
-- Course checkout remains disabled until explicit release controls approve it.

begin;

create table if not exists public.professional_courses (
  id uuid primary key default gen_random_uuid(),
  course_key text not null unique,
  title text not null,
  category text not null check (category in ('foundation','specialty')),
  description text,
  audience text not null default 'professional',
  price_cents integer not null check (price_cents >= 0),
  billing_mode text not null default 'one_time' check (billing_mode in ('one_time','subscription','free')),
  entitlement_key text not null unique,
  payment_setting_key text not null unique,
  estimated_hours numeric(6,2) not null check (estimated_hours > 0),
  minimum_module_count integer not null default 6 check (minimum_module_count > 0),
  minimum_questions_per_module integer not null default 8 check (minimum_questions_per_module >= 5),
  minimum_scenario_items integer not null default 4 check (minimum_scenario_items >= 2),
  module_pass_score integer not null default 80 check (module_pass_score between 70 and 100),
  final_exam_pass_score integer not null default 80 check (final_exam_pass_score between 70 and 100),
  capstone_required boolean not null default true,
  capstone_review_required boolean not null default true,
  status text not null default 'draft' check (status in ('draft','internal_review','published','retired')),
  curriculum_review_status text not null default 'draft' check (curriculum_review_status in ('draft','internal_review','approved')),
  assessment_review_status text not null default 'draft' check (assessment_review_status in ('draft','internal_review','approved')),
  checkout_enabled boolean not null default false,
  certificate_title text not null,
  certificate_scope_note text not null default 'Lellee course-completion certificate. This is not a professional license, clinical credential, legal credential, or independent authorization to practice.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.professional_course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.professional_courses(id) on delete cascade,
  module_key text not null,
  sequence integer not null check (sequence > 0),
  title text not null,
  summary text,
  module_type text not null default 'instruction' check (module_type in ('instruction','practice','final_exam','capstone')),
  estimated_minutes integer not null default 45 check (estimated_minutes > 0),
  learning_objectives jsonb not null default '[]'::jsonb,
  practice_requirements jsonb not null default '[]'::jsonb,
  source_refs jsonb not null default '[]'::jsonb,
  content_md text,
  required boolean not null default true,
  minimum_score integer not null default 80 check (minimum_score between 70 and 100),
  requires_reflection boolean not null default true,
  requires_assignment boolean not null default false,
  requires_human_review boolean not null default false,
  review_status text not null default 'draft' check (review_status in ('draft','internal_review','approved')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_id,module_key),
  unique(course_id,sequence)
);

create table if not exists public.professional_assessment_items (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.professional_course_modules(id) on delete cascade,
  item_order integer not null check (item_order > 0),
  item_type text not null check (item_type in ('multiple_choice','multiple_select','true_false','scenario')),
  prompt text not null,
  choices jsonb not null default '[]'::jsonb,
  correct_answer jsonb not null,
  rationale text,
  source_note text,
  review_status text not null default 'draft' check (review_status in ('draft','internal_review','approved')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(module_id,item_order)
);

create table if not exists public.professional_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.professional_courses(id) on delete restrict,
  entitlement_key text not null,
  status text not null default 'active' check (status in ('pending','active','completed','withdrawn','suspended')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  verified_at timestamptz,
  verified_by uuid references auth.users(id),
  final_score numeric(6,2),
  training_record_id uuid references public.training_records(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,course_id)
);

create table if not exists public.professional_module_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.professional_enrollments(id) on delete cascade,
  module_id uuid not null references public.professional_course_modules(id) on delete cascade,
  status text not null default 'locked' check (status in ('locked','available','in_progress','needs_review','passed')),
  best_score numeric(6,2),
  attempts integer not null default 0 check (attempts >= 0),
  reflection_text text,
  assignment_text text,
  reviewer_status text not null default 'not_required' check (reviewer_status in ('not_required','pending','approved','revisions_required')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(enrollment_id,module_id)
);

create table if not exists public.professional_assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.professional_enrollments(id) on delete cascade,
  module_id uuid not null references public.professional_course_modules(id) on delete cascade,
  score numeric(6,2) not null check (score between 0 and 100),
  passed boolean not null,
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now()
);

create table if not exists public.professional_capstone_submissions (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.professional_enrollments(id) on delete cascade,
  attempt_number integer not null default 1 check (attempt_number > 0),
  response jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','submitted','approved','revisions_required')),
  reviewer_id uuid references auth.users(id),
  reviewer_notes text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(enrollment_id,attempt_number)
);

alter table public.training_records add column if not exists professional_course_id uuid references public.professional_courses(id);
alter table public.training_records add column if not exists professional_enrollment_id uuid references public.professional_enrollments(id);
create unique index if not exists training_records_professional_enrollment_uidx
  on public.training_records(professional_enrollment_id)
  where professional_enrollment_id is not null;

create index if not exists professional_course_modules_course_idx on public.professional_course_modules(course_id,sequence);
create index if not exists professional_assessment_items_module_idx on public.professional_assessment_items(module_id,active,review_status);
create index if not exists professional_enrollments_user_idx on public.professional_enrollments(user_id,status);
create index if not exists professional_enrollments_course_idx on public.professional_enrollments(course_id,status);
create index if not exists professional_module_progress_enrollment_idx on public.professional_module_progress(enrollment_id,status);
create index if not exists professional_module_progress_module_idx on public.professional_module_progress(module_id);
create index if not exists professional_assessment_attempts_enrollment_idx on public.professional_assessment_attempts(enrollment_id,module_id);
create index if not exists professional_capstone_submissions_enrollment_idx on public.professional_capstone_submissions(enrollment_id,status);

alter table public.professional_courses enable row level security;
alter table public.professional_course_modules enable row level security;
alter table public.professional_assessment_items enable row level security;
alter table public.professional_enrollments enable row level security;
alter table public.professional_module_progress enable row level security;
alter table public.professional_assessment_attempts enable row level security;
alter table public.professional_capstone_submissions enable row level security;

revoke all on public.professional_courses, public.professional_course_modules, public.professional_assessment_items,
  public.professional_enrollments, public.professional_module_progress, public.professional_assessment_attempts,
  public.professional_capstone_submissions from anon;
grant select,insert,update,delete on public.professional_courses, public.professional_course_modules,
  public.professional_assessment_items, public.professional_enrollments, public.professional_module_progress,
  public.professional_assessment_attempts, public.professional_capstone_submissions to authenticated;

drop policy if exists professional_courses_read on public.professional_courses;
create policy professional_courses_read on public.professional_courses
for select to authenticated
using (status='published' or public.is_lellee_admin());

drop policy if exists professional_courses_admin_write on public.professional_courses;
create policy professional_courses_admin_write on public.professional_courses
for all to authenticated
using (public.is_lellee_admin())
with check (public.is_lellee_admin());

drop policy if exists professional_modules_read on public.professional_course_modules;
create policy professional_modules_read on public.professional_course_modules
for select to authenticated
using (
  public.is_lellee_admin()
  or exists (
    select 1
    from public.professional_enrollments e
    join public.professional_courses c on c.id=e.course_id
    where e.course_id=professional_course_modules.course_id
      and e.user_id=(select auth.uid())
      and e.status in ('active','completed')
      and c.status='published'
  )
);

drop policy if exists professional_modules_admin_write on public.professional_course_modules;
create policy professional_modules_admin_write on public.professional_course_modules
for all to authenticated
using (public.is_lellee_admin())
with check (public.is_lellee_admin());

drop policy if exists professional_assessment_items_admin on public.professional_assessment_items;
create policy professional_assessment_items_admin on public.professional_assessment_items
for all to authenticated
using (public.is_lellee_admin())
with check (public.is_lellee_admin());

drop policy if exists professional_enrollments_read on public.professional_enrollments;
create policy professional_enrollments_read on public.professional_enrollments
for select to authenticated
using (user_id=(select auth.uid()) or public.is_lellee_admin());

drop policy if exists professional_enrollments_admin_write on public.professional_enrollments;
create policy professional_enrollments_admin_write on public.professional_enrollments
for all to authenticated
using (public.is_lellee_admin())
with check (public.is_lellee_admin());

drop policy if exists professional_progress_read on public.professional_module_progress;
create policy professional_progress_read on public.professional_module_progress
for select to authenticated
using (
  public.is_lellee_admin()
  or exists (
    select 1 from public.professional_enrollments e
    where e.id=professional_module_progress.enrollment_id
      and e.user_id=(select auth.uid())
  )
);

drop policy if exists professional_progress_admin_write on public.professional_module_progress;
create policy professional_progress_admin_write on public.professional_module_progress
for all to authenticated
using (public.is_lellee_admin())
with check (public.is_lellee_admin());

drop policy if exists professional_attempts_read on public.professional_assessment_attempts;
create policy professional_attempts_read on public.professional_assessment_attempts
for select to authenticated
using (
  public.is_lellee_admin()
  or exists (
    select 1 from public.professional_enrollments e
    where e.id=professional_assessment_attempts.enrollment_id
      and e.user_id=(select auth.uid())
  )
);

drop policy if exists professional_attempts_admin_write on public.professional_assessment_attempts;
create policy professional_attempts_admin_write on public.professional_assessment_attempts
for all to authenticated
using (public.is_lellee_admin())
with check (public.is_lellee_admin());

drop policy if exists professional_capstones_read on public.professional_capstone_submissions;
create policy professional_capstones_read on public.professional_capstone_submissions
for select to authenticated
using (
  public.is_lellee_admin()
  or exists (
    select 1 from public.professional_enrollments e
    where e.id=professional_capstone_submissions.enrollment_id
      and e.user_id=(select auth.uid())
  )
);

drop policy if exists professional_capstones_admin_write on public.professional_capstone_submissions;
create policy professional_capstones_admin_write on public.professional_capstone_submissions
for all to authenticated
using (public.is_lellee_admin())
with check (public.is_lellee_admin());

create or replace function public.sync_professional_training_enrollment(p_user_id uuid, p_entitlement_key text)
returns integer
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
declare
  c record;
  eid uuid;
  first_seq integer;
  created_count integer := 0;
begin
  if p_user_id is null or p_entitlement_key is null then return 0; end if;

  for c in
    select * from public.professional_courses
    where entitlement_key=p_entitlement_key and status='published'
  loop
    insert into public.professional_enrollments(user_id,course_id,entitlement_key,status)
    values (p_user_id,c.id,p_entitlement_key,'active')
    on conflict (user_id,course_id) do update
      set status=case when public.professional_enrollments.status='completed' then 'completed' else 'active' end,
          updated_at=now()
    returning id into eid;

    select min(sequence) into first_seq
    from public.professional_course_modules
    where course_id=c.id and required=true;

    insert into public.professional_module_progress(enrollment_id,module_id,status,reviewer_status)
    select eid,m.id,
      case when m.sequence=first_seq then 'available' else 'locked' end,
      case when m.requires_human_review then 'pending' else 'not_required' end
    from public.professional_course_modules m
    where m.course_id=c.id and m.required=true
    on conflict (enrollment_id,module_id) do nothing;

    created_count := created_count + 1;
  end loop;
  return created_count;
end;
$$;
revoke all on function public.sync_professional_training_enrollment(uuid,text) from public,anon,authenticated;
grant execute on function public.sync_professional_training_enrollment(uuid,text) to service_role;

create or replace function public.professional_training_entitlement_trigger()
returns trigger
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
begin
  if new.status in ('active','trialing') then
    perform public.sync_professional_training_enrollment(new.user_id,(select ce.entitlement_key from public.commerce_entitlements ce where ce.id=new.entitlement_id));
  end if;
  return new;
end;
$$;
revoke all on function public.professional_training_entitlement_trigger() from public,anon,authenticated;

drop trigger if exists trg_professional_training_entitlement on public.user_entitlements;
create trigger trg_professional_training_entitlement
after insert or update of status,entitlement_id on public.user_entitlements
for each row execute function public.professional_training_entitlement_trigger();

create or replace function public.admin_publish_professional_course(p_course_key text)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
declare
  c public.professional_courses%rowtype;
  module_count integer;
  unapproved_modules integer;
  missing_sources integer;
  missing_content integer;
  under_assessed integer;
  scenario_count integer;
  capstone_count integer;
begin
  if auth.uid() is null or not public.is_lellee_admin() then raise exception 'Admin access required'; end if;
  select * into c from public.professional_courses where course_key=p_course_key for update;
  if c.id is null then raise exception 'Course not found'; end if;
  if c.curriculum_review_status <> 'approved' then raise exception 'Curriculum review must be approved'; end if;
  if c.assessment_review_status <> 'approved' then raise exception 'Assessment review must be approved'; end if;

  select count(*) into module_count from public.professional_course_modules where course_id=c.id and required=true;
  if module_count < c.minimum_module_count then raise exception 'Course requires at least % required modules',c.minimum_module_count; end if;

  select count(*) into unapproved_modules
  from public.professional_course_modules
  where course_id=c.id and required=true and review_status<>'approved';
  if unapproved_modules>0 then raise exception '% required modules are not approved',unapproved_modules; end if;

  select count(*) into missing_sources
  from public.professional_course_modules
  where course_id=c.id and required=true and module_type<>'capstone'
    and jsonb_array_length(source_refs)=0;
  if missing_sources>0 then raise exception '% required instructional modules have no approved sources',missing_sources; end if;

  select count(*) into missing_content
  from public.professional_course_modules
  where course_id=c.id and required=true
    and (
      (module_type in ('instruction','practice') and char_length(coalesce(trim(content_md),'')) < 800)
      or (module_type='capstone' and char_length(coalesce(trim(content_md),'')) < 300)
    );
  if missing_content>0 then raise exception '% required modules do not yet contain sufficient reviewed lesson/capstone content',missing_content; end if;

  select count(*) into under_assessed
  from public.professional_course_modules m
  where m.course_id=c.id and m.required=true and m.module_type<>'capstone'
    and (
      select count(*) from public.professional_assessment_items ai
      where ai.module_id=m.id and ai.active=true and ai.review_status='approved'
    ) < c.minimum_questions_per_module;
  if under_assessed>0 then raise exception '% required modules do not meet the approved question-bank minimum',under_assessed; end if;

  select count(*) into scenario_count
  from public.professional_assessment_items ai
  join public.professional_course_modules m on m.id=ai.module_id
  where m.course_id=c.id and ai.active=true and ai.review_status='approved' and ai.item_type='scenario';
  if scenario_count < c.minimum_scenario_items then raise exception 'Course requires at least % approved scenario items',c.minimum_scenario_items; end if;

  select count(*) into capstone_count
  from public.professional_course_modules
  where course_id=c.id and required=true and module_type='capstone'
    and requires_human_review=true and review_status='approved';
  if c.capstone_required and capstone_count=0 then raise exception 'Approved human-reviewed capstone is required'; end if;

  update public.professional_courses set status='published',checkout_enabled=false,updated_at=now() where id=c.id;

  perform public.sync_professional_training_enrollment(e.user_id,ce.entitlement_key)
  from public.user_entitlements e
  join public.commerce_entitlements ce on ce.id=e.entitlement_id
  where ce.entitlement_key=c.entitlement_key and e.status in ('active','trialing');

  return jsonb_build_object('published',true,'course_key',c.course_key,'checkout_enabled',false);
end;
$$;
revoke all on function public.admin_publish_professional_course(text) from public,anon;
grant execute on function public.admin_publish_professional_course(text) to authenticated;

create or replace function public.admin_enable_professional_course_checkout(p_course_key text)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
declare
  c public.professional_courses%rowtype;
  payment_url text;
begin
  if auth.uid() is null or not public.is_lellee_admin() then raise exception 'Admin access required'; end if;
  select * into c from public.professional_courses where course_key=p_course_key for update;
  if c.id is null then raise exception 'Course not found'; end if;
  if c.status<>'published' then raise exception 'Course must be published before checkout can be enabled'; end if;
  select value into payment_url from public.app_public_settings where key=c.payment_setting_key;
  if payment_url is null or payment_url !~ '^https://buy\.stripe\.com/' then raise exception 'Approved Stripe Payment Link is not configured'; end if;
  update public.professional_courses set checkout_enabled=true,updated_at=now() where id=c.id;
  return jsonb_build_object('course_key',c.course_key,'checkout_enabled',true);
end;
$$;
revoke all on function public.admin_enable_professional_course_checkout(text) from public,anon;
grant execute on function public.admin_enable_professional_course_checkout(text) to authenticated;

create or replace function public.admin_review_professional_capstone(p_submission_id uuid,p_status text,p_notes text default null)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
declare
  s public.professional_capstone_submissions%rowtype;
  capstone_module uuid;
begin
  if auth.uid() is null or not public.is_lellee_admin() then raise exception 'Admin access required'; end if;
  if p_status not in ('approved','revisions_required') then raise exception 'Invalid review status'; end if;
  select * into s from public.professional_capstone_submissions where id=p_submission_id for update;
  if s.id is null then raise exception 'Submission not found'; end if;

  update public.professional_capstone_submissions
  set status=p_status,reviewer_id=auth.uid(),reviewer_notes=nullif(trim(coalesce(p_notes,'')),''),
      reviewed_at=now(),updated_at=now()
  where id=s.id;

  if p_status='approved' then
    select m.id into capstone_module
    from public.professional_course_modules m
    join public.professional_enrollments e on e.course_id=m.course_id
    where e.id=s.enrollment_id and m.module_type='capstone' and m.required=true
    order by m.sequence desc limit 1;

    if capstone_module is not null then
      update public.professional_module_progress
      set status='passed',reviewer_status='approved',reviewed_by=auth.uid(),reviewed_at=now(),completed_at=now(),updated_at=now()
      where enrollment_id=s.enrollment_id and module_id=capstone_module;
    end if;
  end if;
  return jsonb_build_object('submission_id',s.id,'status',p_status);
end;
$$;
revoke all on function public.admin_review_professional_capstone(uuid,text,text) from public,anon;
grant execute on function public.admin_review_professional_capstone(uuid,text,text) to authenticated;

create or replace function public.admin_verify_professional_course_completion(p_enrollment_id uuid)
returns uuid
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
declare
  e public.professional_enrollments%rowtype;
  c public.professional_courses%rowtype;
  required_count integer;
  passed_count integer;
  capstone_ok boolean;
  avg_score numeric(6,2);
  record_id uuid;
begin
  if auth.uid() is null or not public.is_lellee_admin() then raise exception 'Admin access required'; end if;
  select * into e from public.professional_enrollments where id=p_enrollment_id for update;
  if e.id is null then raise exception 'Enrollment not found'; end if;
  select * into c from public.professional_courses where id=e.course_id;
  if c.status<>'published' then raise exception 'Course is not published'; end if;

  select count(*) into required_count from public.professional_course_modules where course_id=c.id and required=true;
  select count(*) into passed_count
  from public.professional_module_progress p
  join public.professional_course_modules m on m.id=p.module_id
  where p.enrollment_id=e.id and m.required=true and p.status='passed';
  if passed_count<>required_count then raise exception 'All required modules must be passed before verification'; end if;

  if c.capstone_required then
    select exists(
      select 1 from public.professional_capstone_submissions
      where enrollment_id=e.id and status='approved'
    ) into capstone_ok;
    if not capstone_ok then raise exception 'Approved capstone is required'; end if;
  end if;

  select round(avg(p.best_score)::numeric,2) into avg_score
  from public.professional_module_progress p
  join public.professional_course_modules m on m.id=p.module_id
  where p.enrollment_id=e.id and m.required=true and m.module_type<>'capstone' and p.best_score is not null;

  select id into record_id from public.training_records where professional_enrollment_id=e.id limit 1;
  if record_id is null then
    insert into public.training_records(
      user_id,title,hours,status,completed_at,verified,professional_course_id,professional_enrollment_id
    ) values (
      e.user_id,c.title,c.estimated_hours,'completed',now(),true,c.id,e.id
    ) returning id into record_id;
  else
    update public.training_records
    set title=c.title,hours=c.estimated_hours,status='completed',completed_at=now(),verified=true,professional_course_id=c.id
    where id=record_id;
  end if;

  update public.professional_enrollments
  set status='completed',completed_at=now(),verified_at=now(),verified_by=auth.uid(),
      final_score=avg_score,training_record_id=record_id,updated_at=now()
  where id=e.id;

  return record_id;
end;
$$;
revoke all on function public.admin_verify_professional_course_completion(uuid) from public,anon;
grant execute on function public.admin_verify_professional_course_completion(uuid) to authenticated;

insert into public.professional_courses(
  course_key,title,category,description,price_cents,billing_mode,entitlement_key,payment_setting_key,
  estimated_hours,minimum_module_count,minimum_questions_per_module,minimum_scenario_items,
  module_pass_score,final_exam_pass_score,capstone_required,capstone_review_required,status,
  curriculum_review_status,assessment_review_status,checkout_enabled,certificate_title
) values
('coaching_foundations','Lellee Coaching Foundations','foundation','Core professional coaching training covering scope, ethics, privacy, communication, goals, documentation, risk recognition, referral, and applied judgment.',19900,'one_time','coaching_foundations','coaching_foundations_payment_link',12,8,8,6,80,80,true,true,'draft','draft','draft',false,'Lellee Course Completion: Coaching Foundations'),
('specialty_recovery','Recovery Specialty','specialty','Professional recovery-support specialty covering recovery pathways, substance-use awareness, recovery capital, recurrence risk, support systems, and referral boundaries.',7900,'one_time','specialty_recovery','specialty_recovery_payment_link',6,6,8,4,80,80,true,true,'draft','draft','draft',false,'Lellee Course Completion: Recovery Specialty'),
('specialty_reentry','Reentry Specialty','specialty','Professional reentry-support specialty covering systems navigation boundaries, documents, employment, housing, family reintegration, and applied planning.',7900,'one_time','specialty_reentry','specialty_reentry_payment_link',6,6,8,4,80,80,true,true,'draft','draft','draft',false,'Lellee Course Completion: Reentry Specialty'),
('specialty_housing_stability','Housing Stability Specialty','specialty','Professional housing-stability specialty covering readiness, budgeting, search, tenancy sustainability, fair-housing awareness, crisis referral, and scope limits.',7900,'one_time','specialty_housing_stability','specialty_housing_stability_payment_link',6,6,8,4,80,80,true,true,'draft','draft','draft',false,'Lellee Course Completion: Housing Stability Specialty'),
('specialty_caregiving','Caregiving Specialty','specialty','Professional caregiving-support specialty covering caregiver roles, burnout, routines, boundaries, family coordination, grief, resources, and referral limits.',7900,'one_time','specialty_caregiving','specialty_caregiving_payment_link',6,6,8,4,80,80,true,true,'draft','draft','draft',false,'Lellee Course Completion: Caregiving Specialty'),
('specialty_grief_life_after_loss','Grief & Life After Loss Specialty','specialty','Professional grief-support specialty covering grief variation, supportive communication, risk recognition, routines, identity, substance-use vulnerability, and referral.',7900,'one_time','specialty_grief_life_after_loss','specialty_grief_life_after_loss_payment_link',6,6,8,4,80,80,true,true,'draft','draft','draft',false,'Lellee Course Completion: Grief & Life After Loss Specialty'),
('specialty_workforce_new_beginnings','Workforce & New Beginnings Specialty','specialty','Professional workforce-support specialty covering strengths, job search, resumes, interviews, disclosure boundaries, workplace communication, retention, budgeting, and advancement.',7900,'one_time','specialty_workforce_new_beginnings','specialty_workforce_new_beginnings_payment_link',6,6,8,4,80,80,true,true,'draft','draft','draft',false,'Lellee Course Completion: Workforce & New Beginnings Specialty')
on conflict (course_key) do update set
  title=excluded.title,category=excluded.category,description=excluded.description,price_cents=excluded.price_cents,
  entitlement_key=excluded.entitlement_key,payment_setting_key=excluded.payment_setting_key,estimated_hours=excluded.estimated_hours,
  minimum_module_count=excluded.minimum_module_count,minimum_questions_per_module=excluded.minimum_questions_per_module,
  minimum_scenario_items=excluded.minimum_scenario_items,module_pass_score=excluded.module_pass_score,
  final_exam_pass_score=excluded.final_exam_pass_score,capstone_required=excluded.capstone_required,
  capstone_review_required=excluded.capstone_review_required,certificate_title=excluded.certificate_title,updated_at=now();

insert into public.professional_course_modules(
  course_id,module_key,sequence,title,summary,module_type,estimated_minutes,learning_objectives,practice_requirements,
  source_refs,content_md,required,minimum_score,requires_reflection,requires_assignment,requires_human_review,review_status
) values
((select id from public.professional_courses where course_key='coaching_foundations'),'scope_role_boundaries',1,'Scope, Role & Professional Boundaries','Distinguish coaching from therapy, case management, legal advice, and emergency services.','instruction',60,'["Distinguish coaching from therapy, case management, legal advice, and emergency services.","Identify when a request exceeds coaching scope and requires referral.","Use accurate scope language when describing Lellee coaching."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='coaching_foundations'),'ethics_privacy_consent',2,'Ethics, Privacy & Informed Consent','Apply informed-consent and privacy principles to coaching interactions.','instruction',75,'["Apply informed-consent and privacy principles to coaching interactions.","Recognize conflicts of interest, dual relationships, and boundary risks.","Use minimum-necessary information when documenting or sharing progress."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='coaching_foundations'),'trauma_cultural_responsiveness',3,'Trauma-Informed & Culturally Responsive Engagement','Use trauma-informed principles without diagnosing trauma.','instruction',75,'["Use trauma-informed principles without diagnosing trauma.","Adapt communication to culture, identity, language, and lived experience.","Avoid coercive or stigmatizing coaching practices."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='coaching_foundations'),'communication_skills',4,'Coaching Communication Skills','Use open questions, reflections, summaries, and affirmations.','instruction',90,'["Use open questions, reflections, summaries, and affirmations.","Differentiate supportive coaching communication from psychotherapy.","Respond to ambivalence without pressure or confrontation."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='coaching_foundations'),'goals_accountability',5,'Goals, Action Planning & Accountability','Translate broad goals into participant-led next steps.','instruction',75,'["Translate broad goals into participant-led next steps.","Use accountability without shaming or over-directing.","Review progress and revise goals collaboratively."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='coaching_foundations'),'documentation_shared_progress',6,'Documentation & Shared Progress','Document objective coaching activity without clinical conclusions.','instruction',75,'["Document objective coaching activity without clinical conclusions.","Separate private journal content from intentionally shared progress.","Recognize documentation that creates privacy, legal, or scope risk."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='coaching_foundations'),'risk_referral_escalation',7,'Risk Recognition, Referral & Escalation','Recognize crisis, overdose, abuse, medical, and safety red flags.','instruction',90,'["Recognize crisis, overdose, abuse, medical, and safety red flags.","Use emergency and professional referral pathways appropriately.","Stay within coaching scope during urgent or high-risk situations."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='coaching_foundations'),'foundations_capstone',8,'Foundations Applied Capstone','Integrate boundaries, communication, documentation, goals, and referral judgment.','capstone',180,'["Integrate boundaries, communication, documentation, goals, and referral judgment.","Demonstrate appropriate action across a multi-factor coaching scenario."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,true,true,'draft'),
((select id from public.professional_courses where course_key='specialty_recovery'),'recovery_orientation',1,'Recovery Orientation & Pathways','Describe multiple legitimate recovery pathways without prescribing one path.','instruction',50,'["Describe multiple legitimate recovery pathways without prescribing one path.","Use person-centered and non-stigmatizing recovery language.","Differentiate coaching support from treatment."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_recovery'),'sud_harm_reduction_awareness',2,'SUD, Harm Reduction & Medication Awareness','Explain core substance-use and recovery concepts in non-clinical language.','instruction',60,'["Explain core substance-use and recovery concepts in non-clinical language.","Recognize harm-reduction and medication-for-addiction-treatment approaches without practicing medicine.","Identify overdose and withdrawal situations requiring urgent professional care."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_recovery'),'readiness_recovery_capital',3,'Readiness, Change & Recovery Capital','Use stages/readiness concepts without labeling or grading a participant.','instruction',55,'["Use stages/readiness concepts without labeling or grading a participant.","Identify strengths and recovery-capital domains.","Turn participant priorities into practical recovery-support goals."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_recovery'),'recurrence_coping_support',4,'Recurrence Risk, Coping & Support Planning','Identify common warning signs and support-planning opportunities.','instruction',60,'["Identify common warning signs and support-planning opportunities.","Build participant-led coping and connection plans.","Use non-punitive language after recurrence or setback."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_recovery'),'family_peer_community',5,'Family, Peer & Community Support','Support healthy use of peer, family, mutual-help, and community resources.','instruction',50,'["Support healthy use of peer, family, mutual-help, and community resources.","Maintain privacy and consent when involving support people.","Recognize when family or peer dynamics require professional referral."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_recovery'),'recovery_capstone',6,'Recovery Specialty Capstone','Apply recovery coaching scope, risk recognition, and participant-led planning in a complex scenario.','capstone',85,'["Apply recovery coaching scope, risk recognition, and participant-led planning in a complex scenario."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,true,true,'draft'),
((select id from public.professional_courses where course_key='specialty_reentry'),'reentry_scope_systems',1,'Reentry Context, Systems & Coaching Scope','Identify common reentry barriers without acting as legal counsel or case manager.','instruction',50,'["Identify common reentry barriers without acting as legal counsel or case manager.","Clarify the coach''s role alongside probation, parole, courts, and service providers.","Use strengths-based language with justice-impacted participants."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_reentry'),'documents_benefits_referral',2,'Documents, Benefits & Referral Boundaries','Help participants organize document and benefits tasks without making eligibility determinations.','instruction',55,'["Help participants organize document and benefits tasks without making eligibility determinations.","Recognize when legal or benefits questions require qualified referral.","Create stepwise administrative action plans."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_reentry'),'employment_education_reentry',3,'Employment & Education After Reentry','Support job and education planning around realistic barriers.','instruction',60,'["Support job and education planning around realistic barriers.","Practice disclosure and interview planning without giving legal advice.","Identify transferable skills and short-term workforce goals."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_reentry'),'housing_financial_reentry',4,'Housing & Financial Stability After Reentry','Support housing-readiness and budgeting tasks without promising placement.','instruction',60,'["Support housing-readiness and budgeting tasks without promising placement.","Identify documentation and referral needs.","Plan around transportation, fees, debt, and competing reentry demands."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_reentry'),'family_social_reintegration',5,'Family & Social Reintegration','Support boundary-setting, trust rebuilding, and communication goals.','instruction',50,'["Support boundary-setting, trust rebuilding, and communication goals.","Recognize high-conflict or unsafe family situations requiring specialized help.","Plan healthy community and peer supports."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_reentry'),'reentry_capstone',6,'Reentry Specialty Capstone','Build a sequenced reentry plan while maintaining legal, housing, employment, and safety boundaries.','capstone',85,'["Build a sequenced reentry plan while maintaining legal, housing, employment, and safety boundaries."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,true,true,'draft'),
((select id from public.professional_courses where course_key='specialty_housing_stability'),'housing_scope_instability',1,'Housing Instability & Coaching Scope','Distinguish housing coaching from legal advice, property management, and placement services.','instruction',50,'["Distinguish housing coaching from legal advice, property management, and placement services.","Identify major housing-stability barriers and participant priorities.","Use housing language that is accurate and non-discriminatory."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_housing_stability'),'housing_readiness_budget',2,'Housing Readiness, Documents & Budgeting','Organize identification, income, references, and application materials.','instruction',55,'["Organize identification, income, references, and application materials.","Build a realistic housing budget and readiness checklist.","Recognize when benefits or financial counseling referrals are needed."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_housing_stability'),'search_applications_fair_housing',3,'Search, Applications & Fair-Housing Awareness','Support a structured housing search and application workflow.','instruction',60,'["Support a structured housing search and application workflow.","Recognize basic fair-housing concerns without giving legal conclusions.","Help participants document questions and seek qualified help when needed."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_housing_stability'),'tenancy_sustainability',4,'Tenancy Sustainability & Communication','Support routines for rent, utilities, maintenance requests, and documentation.','instruction',55,'["Support routines for rent, utilities, maintenance requests, and documentation.","Practice constructive landlord/tenant communication.","Recognize when conflict requires mediation, legal aid, or emergency assistance."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_housing_stability'),'housing_crisis_referral',5,'Housing Crisis, Eviction & Referral Boundaries','Recognize urgent housing-loss and safety situations.','instruction',55,'["Recognize urgent housing-loss and safety situations.","Use referral pathways without presenting coaching as legal representation.","Create immediate and short-term participant-led action plans."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_housing_stability'),'housing_capstone',6,'Housing Stability Specialty Capstone','Develop a housing-stability plan across readiness, search, tenancy, and crisis-referral scenarios.','capstone',85,'["Develop a housing-stability plan across readiness, search, tenancy, and crisis-referral scenarios."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,true,true,'draft'),
((select id from public.professional_courses where course_key='specialty_caregiving'),'caregiving_roles_scope',1,'Caregiving Roles, Needs & Coaching Scope','Clarify caregiving roles and limits without practicing medicine or case management.','instruction',50,'["Clarify caregiving roles and limits without practicing medicine or case management.","Identify competing needs of caregiver and care recipient.","Create participant-led priorities for daily caregiving demands."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_caregiving'),'stress_burnout_compassion',2,'Stress, Burnout & Compassion Fatigue','Recognize common caregiver strain and burnout warning signs.','instruction',55,'["Recognize common caregiver strain and burnout warning signs.","Build practical rest, support, and boundary strategies.","Recognize mental-health or safety concerns requiring referral."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_caregiving'),'routines_communication_boundaries',3,'Routines, Communication & Boundaries','Build manageable routines for appointments, medications, meals, and household tasks without clinical direction.','instruction',60,'["Build manageable routines for appointments, medications, meals, and household tasks without clinical direction.","Practice boundary-setting and difficult conversations.","Use shared plans that respect autonomy and consent."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_caregiving'),'family_systems_coordination',4,'Family Systems & Care Coordination Boundaries','Support family role clarification and shared-task planning.','instruction',55,'["Support family role clarification and shared-task planning.","Maintain privacy when multiple family members are involved.","Recognize when professional care coordination is required."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_caregiving'),'caregiving_grief_resources',5,'Grief, Anticipatory Grief & Resource Use','Recognize anticipatory grief and caregiving transitions.','instruction',55,'["Recognize anticipatory grief and caregiving transitions.","Support resource organization without making benefit or treatment determinations.","Identify when grief, crisis, or exhaustion requires professional help."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_caregiving'),'caregiving_capstone',6,'Caregiving Specialty Capstone','Create a balanced caregiving support plan while maintaining privacy, scope, and referral boundaries.','capstone',85,'["Create a balanced caregiving support plan while maintaining privacy, scope, and referral boundaries."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,true,true,'draft'),
((select id from public.professional_courses where course_key='specialty_grief_life_after_loss'),'grief_variation',1,'Understanding Grief & Individual Variation','Describe grief as varied and non-linear without prescribing a timetable.','instruction',50,'["Describe grief as varied and non-linear without prescribing a timetable.","Use culturally responsive and non-pathologizing language.","Differentiate supportive coaching from grief therapy."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_grief_life_after_loss'),'grief_risk_referral',2,'When Grief Needs Additional Support','Recognize safety, severe impairment, substance-use, and mental-health warning signs.','instruction',55,'["Recognize safety, severe impairment, substance-use, and mental-health warning signs.","Refer appropriately without diagnosing prolonged or complicated grief.","Respond safely to statements of hopelessness or self-harm."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_grief_life_after_loss'),'grief_communication_support',3,'Communication & Support After Loss','Use presence, reflective listening, and supportive questions.','instruction',55,'["Use presence, reflective listening, and supportive questions.","Avoid minimizing, fixing, or imposing meaning.","Help participants identify safe support people and communities."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_grief_life_after_loss'),'grief_routines_identity_meaning',4,'Routines, Identity & Meaning Reconstruction','Support gradual rebuilding of routines and roles.','instruction',55,'["Support gradual rebuilding of routines and roles.","Use participant-led meaning and remembrance practices.","Set realistic goals during periods of low energy or concentration."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_grief_life_after_loss'),'grief_substance_use_crisis',5,'Grief, Substance Use & Crisis Vulnerability','Recognize increased vulnerability to substance use and isolation after loss.','instruction',55,'["Recognize increased vulnerability to substance use and isolation after loss.","Build protective support and coping plans.","Use crisis and emergency referral pathways appropriately."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_grief_life_after_loss'),'grief_capstone',6,'Grief & Life After Loss Specialty Capstone','Demonstrate supportive grief coaching, boundaries, referral judgment, and participant-led planning.','capstone',90,'["Demonstrate supportive grief coaching, boundaries, referral judgment, and participant-led planning."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,true,true,'draft'),
((select id from public.professional_courses where course_key='specialty_workforce_new_beginnings'),'strengths_transferable_skills',1,'Strengths & Transferable Skills','Identify transferable skills from work, caregiving, lived experience, volunteering, and education.','instruction',50,'["Identify transferable skills from work, caregiving, lived experience, volunteering, and education.","Translate strengths into realistic occupational targets.","Set short-term workforce goals."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_workforce_new_beginnings'),'job_search_resume',2,'Job Search, Resume & Application Strategy','Build a targeted job-search routine.','instruction',60,'["Build a targeted job-search routine.","Translate experience into clear resume language.","Organize applications and follow-up without overwhelming the participant."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_workforce_new_beginnings'),'interviews_disclosure',3,'Interviews, Disclosure & Background Barriers','Practice interview responses and confidence-building.','instruction',60,'["Practice interview responses and confidence-building.","Discuss disclosure decisions without giving legal advice.","Identify when record-related or discrimination questions require qualified referral."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_workforce_new_beginnings'),'workplace_communication_accommodations',4,'Workplace Communication & Accommodation Awareness','Practice professional communication, feedback, and conflict-management skills.','instruction',55,'["Practice professional communication, feedback, and conflict-management skills.","Recognize accommodation topics without determining legal entitlement.","Plan appropriate referral for disability or employment-rights questions."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_workforce_new_beginnings'),'retention_budget_career',5,'Retention, Scheduling, Budgeting & Career Growth','Build routines for attendance, transportation, scheduling, and workplace stability.','instruction',55,'["Build routines for attendance, transportation, scheduling, and workplace stability.","Connect employment income to basic budgeting and goal planning.","Develop a next-step learning or advancement plan."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,false,false,'draft'),
((select id from public.professional_courses where course_key='specialty_workforce_new_beginnings'),'workforce_capstone',6,'Workforce & New Beginnings Specialty Capstone','Create an integrated employment plan addressing search, barriers, communication, retention, and referral boundaries.','capstone',80,'["Create an integrated employment plan addressing search, barriers, communication, retention, and referral boundaries."]'::jsonb,'[]'::jsonb,'[]'::jsonb,null,true,80,true,true,true,'draft')
on conflict (course_id,module_key) do update set
  sequence=excluded.sequence,title=excluded.title,summary=excluded.summary,module_type=excluded.module_type,
  estimated_minutes=excluded.estimated_minutes,learning_objectives=excluded.learning_objectives,
  requires_reflection=excluded.requires_reflection,requires_assignment=excluded.requires_assignment,
  requires_human_review=excluded.requires_human_review,updated_at=now();

commit;