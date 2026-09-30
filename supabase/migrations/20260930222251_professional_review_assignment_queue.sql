begin;

create table if not exists public.professional_course_review_assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.professional_courses(id) on delete cascade,
  review_type text not null check (review_type in ('source','curriculum','assessment','scope','capstone')),
  reviewer_domain text not null,
  reviewer_id uuid references public.professional_reviewers(id),
  status text not null default 'unassigned'
    check (status in ('unassigned','assigned','in_review','completed','cancelled')),
  due_date date,
  assignment_notes text,
  assigned_by uuid references auth.users(id),
  assigned_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_id,review_type,reviewer_domain)
);

create index if not exists professional_review_assignments_reviewer_idx
  on public.professional_course_review_assignments(reviewer_id,status);
create index if not exists professional_review_assignments_course_idx
  on public.professional_course_review_assignments(course_id,review_type,status);
create index if not exists professional_review_assignments_assigned_by_idx
  on public.professional_course_review_assignments(assigned_by);

alter table public.professional_course_review_assignments enable row level security;
revoke all on public.professional_course_review_assignments from anon;
grant select on public.professional_course_review_assignments to authenticated;

drop policy if exists professional_review_assignments_admin_read
on public.professional_course_review_assignments;
create policy professional_review_assignments_admin_read
on public.professional_course_review_assignments
for select to authenticated
using (public.is_lellee_admin());

insert into public.professional_course_review_assignments(
  course_id,review_type,reviewer_domain,status
)
select req.course_id,req.review_type,d.domain,'unassigned'
from public.professional_course_review_requirements req
cross join lateral unnest(req.required_domains) d(domain)
on conflict(course_id,review_type,reviewer_domain) do nothing;

create or replace function private.admin_assign_professional_reviewer(
  p_assignment_id uuid,
  p_reviewer_id uuid,
  p_due_date date default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
declare
  uid uuid:=auth.uid();
  a public.professional_course_review_assignments%rowtype;
  r public.professional_reviewers%rowtype;
begin
  if uid is null or not public.is_lellee_admin() then
    raise exception 'Admin access required';
  end if;

  select * into a
  from public.professional_course_review_assignments
  where id=p_assignment_id
  for update;
  if a.id is null then raise exception 'Review assignment not found'; end if;

  select * into r
  from public.professional_reviewers
  where id=p_reviewer_id;
  if r.id is null then raise exception 'Reviewer not found'; end if;
  if r.verification_status<>'verified_in_house' or not r.active then
    raise exception 'Reviewer must be Verified In-House and active';
  end if;
  if not (a.reviewer_domain=any(r.reviewer_domains)) then
    raise exception 'Reviewer is not verified for domain %',a.reviewer_domain;
  end if;

  if a.review_type='scope' and exists(
    select 1
    from public.professional_course_review_assignments other
    where other.course_id=a.course_id
      and other.review_type='scope'
      and other.id<>a.id
      and other.reviewer_id=p_reviewer_id
      and other.status in ('assigned','in_review','completed')
  ) then
    raise exception 'Scope domains require different reviewers';
  end if;

  update public.professional_course_review_assignments
  set reviewer_id=p_reviewer_id,
      status='assigned',
      due_date=p_due_date,
      assignment_notes=nullif(trim(coalesce(p_notes,'')),''),
      assigned_by=uid,
      assigned_at=now(),
      started_at=null,
      completed_at=null,
      updated_at=now()
  where id=a.id;

  return jsonb_build_object(
    'assignment_id',a.id,
    'reviewer_id',p_reviewer_id,
    'reviewer_domain',a.reviewer_domain,
    'status','assigned'
  );
end;
$$;
revoke all on function private.admin_assign_professional_reviewer(uuid,uuid,date,text) from public,anon;
grant execute on function private.admin_assign_professional_reviewer(uuid,uuid,date,text) to authenticated;

create or replace function public.admin_assign_professional_reviewer(
  p_assignment_id uuid,
  p_reviewer_id uuid,
  p_due_date date default null,
  p_notes text default null
)
returns jsonb
language sql
security invoker
set search_path=public,private,pg_catalog
as $$ select private.admin_assign_professional_reviewer(
  p_assignment_id,p_reviewer_id,p_due_date,p_notes
) $$;
revoke all on function public.admin_assign_professional_reviewer(uuid,uuid,date,text) from public,anon;
grant execute on function public.admin_assign_professional_reviewer(uuid,uuid,date,text) to authenticated;

create or replace function private.admin_start_professional_review_assignment(
  p_assignment_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
declare
  uid uuid:=auth.uid();
  a public.professional_course_review_assignments%rowtype;
begin
  if uid is null or not public.is_lellee_admin() then
    raise exception 'Admin access required';
  end if;

  select * into a
  from public.professional_course_review_assignments
  where id=p_assignment_id
  for update;
  if a.id is null then raise exception 'Review assignment not found'; end if;
  if a.status<>'assigned' or a.reviewer_id is null then
    raise exception 'Assignment must have a verified reviewer before it can start';
  end if;
  if not exists(
    select 1 from public.professional_reviewers r
    where r.id=a.reviewer_id
      and r.verification_status='verified_in_house'
      and r.active=true
  ) then
    raise exception 'Assigned reviewer is no longer Verified In-House and active';
  end if;

  update public.professional_course_review_assignments
  set status='in_review',
      started_at=coalesce(started_at,now()),
      updated_at=now()
  where id=a.id;

  return jsonb_build_object('assignment_id',a.id,'status','in_review');
end;
$$;
revoke all on function private.admin_start_professional_review_assignment(uuid) from public,anon;
grant execute on function private.admin_start_professional_review_assignment(uuid) to authenticated;

create or replace function public.admin_start_professional_review_assignment(
  p_assignment_id uuid
)
returns jsonb
language sql
security invoker
set search_path=public,private,pg_catalog
as $$ select private.admin_start_professional_review_assignment(p_assignment_id) $$;
revoke all on function public.admin_start_professional_review_assignment(uuid) from public,anon;
grant execute on function public.admin_start_professional_review_assignment(uuid) to authenticated;

create or replace function private.admin_record_verified_professional_review_signoff(
  p_course_key text,
  p_review_type text,
  p_reviewer_id uuid,
  p_decision text,
  p_notes text default null,
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
  rv public.professional_reviewers%rowtype;
  a public.professional_course_review_assignments%rowtype;
  sid uuid;
  domain_status text;
begin
  if uid is null or not public.is_lellee_admin() then raise exception 'Admin access required'; end if;
  if p_review_type not in ('source','curriculum','assessment','scope','capstone') then raise exception 'Invalid review type'; end if;
  if p_decision not in ('approved','revisions_required') then raise exception 'Invalid decision'; end if;
  if not p_attestation then raise exception 'Reviewer attestation is required'; end if;

  select * into c from public.professional_courses where course_key=p_course_key;
  if c.id is null then raise exception 'Course not found'; end if;

  select * into rv from public.professional_reviewers where id=p_reviewer_id;
  if rv.id is null then raise exception 'Reviewer not found'; end if;
  if rv.verification_status<>'verified_in_house' or not rv.active then
    raise exception 'Reviewer must be manually verified in-house before signoff';
  end if;

  select *
  into a
  from public.professional_course_review_assignments
  where course_id=c.id
    and review_type=p_review_type
    and reviewer_id=p_reviewer_id
    and status in ('assigned','in_review')
  order by case status when 'in_review' then 0 else 1 end,assigned_at desc
  limit 1
  for update;

  if a.id is null then
    raise exception 'Reviewer must be assigned to this exact course review slot before signoff';
  end if;

  insert into public.professional_course_review_signoffs(
    course_id,review_type,reviewer_id,reviewer_name,reviewer_qualification,reviewer_domain,
    reviewer_organization,reviewer_evidence_ref,decision,notes,attestation,recorded_by
  ) values(
    c.id,p_review_type,rv.id,rv.full_name,rv.qualification,a.reviewer_domain,
    rv.organization,rv.evidence_ref,p_decision,nullif(trim(coalesce(p_notes,'')),''),true,uid
  ) returning id into sid;

  update public.professional_course_review_assignments
  set status='completed',
      started_at=coalesce(started_at,assigned_at,now()),
      completed_at=now(),
      updated_at=now()
  where id=a.id;

  domain_status:=private.refresh_professional_review_domain(c.id,p_review_type);

  return jsonb_build_object(
    'signoff_id',sid,
    'assignment_id',a.id,
    'course_key',c.course_key,
    'review_type',p_review_type,
    'reviewer_id',rv.id,
    'reviewer_domain',a.reviewer_domain,
    'review_status',domain_status
  );
end;
$$;

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
      'checkout_enabled',(select count(*) from public.professional_courses where checkout_enabled),
      'reviewers_pending',(select count(*) from public.professional_reviewers where verification_status='pending' and active=true),
      'reviewers_verified',(select count(*) from public.professional_reviewers where verification_status='verified_in_house' and active=true),
      'review_slots',(select count(*) from public.professional_course_review_assignments),
      'review_slots_unassigned',(select count(*) from public.professional_course_review_assignments where status='unassigned'),
      'review_slots_active',(select count(*) from public.professional_course_review_assignments where status in ('assigned','in_review')),
      'review_slots_completed',(select count(*) from public.professional_course_review_assignments where status='completed')
    ),
    'reviewers',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',r.id,'full_name',r.full_name,'qualification',r.qualification,
        'reviewer_domains',r.reviewer_domains,'organization',r.organization,'evidence_ref',r.evidence_ref,
        'verification_status',r.verification_status,'verification_method',r.verification_method,
        'verification_notes',r.verification_notes,'verified_at',r.verified_at,'active',r.active
      ) order by case r.verification_status when 'pending' then 0 when 'verified_in_house' then 1 else 2 end,r.full_name)
      from public.professional_reviewers r
    ),'[]'::jsonb),
    'courses',coalesce((
      select jsonb_agg(jsonb_build_object(
        'course_key',c.course_key,'title',c.title,'category',c.category,'price_cents',c.price_cents,
        'estimated_hours',c.estimated_hours,'status',c.status,'checkout_enabled',c.checkout_enabled,
        'issues',private.professional_course_release_issues(c.id),
        'modules',(select count(*) from public.professional_course_modules m where m.course_id=c.id),
        'assessments',(select count(*) from public.professional_assessment_items ai join public.professional_course_modules m on m.id=ai.module_id where m.course_id=c.id),
        'scenarios',(select count(*) from public.professional_assessment_items ai join public.professional_course_modules m on m.id=ai.module_id where m.course_id=c.id and ai.item_type='scenario'),
        'assignments',coalesce((
          select jsonb_agg(jsonb_build_object(
            'id',a.id,'review_type',a.review_type,'reviewer_domain',a.reviewer_domain,
            'reviewer_id',a.reviewer_id,'reviewer_name',rv.full_name,'status',a.status,
            'due_date',a.due_date,'assignment_notes',a.assignment_notes,
            'assigned_at',a.assigned_at,'started_at',a.started_at,'completed_at',a.completed_at
          ) order by case a.review_type when 'source' then 1 when 'curriculum' then 2 when 'assessment' then 3 when 'scope' then 4 else 5 end,a.reviewer_domain)
          from public.professional_course_review_assignments a
          left join public.professional_reviewers rv on rv.id=a.reviewer_id
          where a.course_id=c.id
        ),'[]'::jsonb),
        'reviews',coalesce((
          select jsonb_agg(jsonb_build_object(
            'review_type',r.review_type,'status',r.status,'findings',r.findings,
            'required_domains',req.required_domains,'minimum_signoffs',req.minimum_signoffs,
            'distinct_reviewers_required',req.distinct_reviewers_required,'instructions',req.instructions,
            'signoffs',coalesce((
              select jsonb_agg(jsonb_build_object(
                'id',s.id,'reviewer_id',s.reviewer_id,'reviewer_name',s.reviewer_name,
                'reviewer_qualification',s.reviewer_qualification,'reviewer_domain',s.reviewer_domain,
                'reviewer_organization',s.reviewer_organization,'reviewer_evidence_ref',s.reviewer_evidence_ref,
                'decision',s.decision,'notes',s.notes,'reviewed_at',s.reviewed_at
              ) order by s.reviewed_at desc)
              from public.professional_course_review_signoffs s
              where s.course_id=c.id and s.review_type=r.review_type
            ),'[]'::jsonb)
          ) order by case r.review_type when 'source' then 1 when 'curriculum' then 2 when 'assessment' then 3 when 'scope' then 4 else 5 end)
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
        'status',e.status,'started_at',e.started_at,'completed_at',e.completed_at,'final_score',e.final_score
      ) order by e.created_at desc)
      from (select * from public.professional_enrollments order by created_at desc limit 100) e
      join public.professional_courses c on c.id=e.course_id
    ),'[]'::jsonb)
  );
end;
$$;

commit;