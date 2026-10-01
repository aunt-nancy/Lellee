begin;

create table if not exists public.professional_reviewer_capacity (
  reviewer_id uuid primary key references public.professional_reviewers(id) on delete cascade,
  availability_status text not null default 'available'
    check (availability_status in ('available','limited','unavailable')),
  max_active_assignments integer
    check (max_active_assignments is null or max_active_assignments between 1 and 100),
  capacity_notes text,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists professional_reviewer_capacity_updated_by_idx
  on public.professional_reviewer_capacity(updated_by);

alter table public.professional_reviewer_capacity enable row level security;
revoke all on public.professional_reviewer_capacity from anon;
grant select on public.professional_reviewer_capacity to authenticated;

drop policy if exists professional_reviewer_capacity_admin_read
on public.professional_reviewer_capacity;
create policy professional_reviewer_capacity_admin_read
on public.professional_reviewer_capacity
for select to authenticated
using (public.is_lellee_admin());

create or replace function private.admin_set_professional_reviewer_capacity(
  p_reviewer_id uuid,
  p_availability_status text,
  p_max_active_assignments integer default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
declare
  uid uuid:=auth.uid();
  r public.professional_reviewers%rowtype;
begin
  if not private.is_professional_key_admin(uid) then
    raise exception 'Key administrator access required';
  end if;

  select * into r
  from public.professional_reviewers
  where id=p_reviewer_id;

  if r.id is null then raise exception 'Reviewer not found'; end if;

  if p_availability_status not in ('available','limited','unavailable') then
    raise exception 'Invalid availability status';
  end if;

  if p_max_active_assignments is not null
     and (p_max_active_assignments<1 or p_max_active_assignments>100) then
    raise exception 'Maximum active assignments must be between 1 and 100';
  end if;

  insert into public.professional_reviewer_capacity(
    reviewer_id,availability_status,max_active_assignments,
    capacity_notes,updated_by,updated_at
  )
  values(
    r.id,p_availability_status,p_max_active_assignments,
    nullif(trim(coalesce(p_notes,'')),''),uid,now()
  )
  on conflict(reviewer_id) do update
  set availability_status=excluded.availability_status,
      max_active_assignments=excluded.max_active_assignments,
      capacity_notes=excluded.capacity_notes,
      updated_by=uid,
      updated_at=now();

  insert into public.admin_audit_log(
    actor_user_id,entity_type,entity_id,action,
    changed_fields,action_label,workspace
  )
  values(
    uid,'professional_reviewer',r.id::text,'set_reviewer_capacity',
    array['availability_status','max_active_assignments','capacity_notes'],
    'Updated professional reviewer workload capacity',
    'professional_training'
  );

  return jsonb_build_object(
    'reviewer_id',r.id,
    'availability_status',p_availability_status,
    'max_active_assignments',p_max_active_assignments
  );
end;
$$;

revoke all on function private.admin_set_professional_reviewer_capacity(uuid,text,integer,text)
from public,anon;
grant execute on function private.admin_set_professional_reviewer_capacity(uuid,text,integer,text)
to authenticated;

create or replace function public.admin_set_professional_reviewer_capacity(
  p_reviewer_id uuid,
  p_availability_status text,
  p_max_active_assignments integer default null,
  p_notes text default null
)
returns jsonb
language sql
security invoker
set search_path=public,private,pg_catalog
as $$
  select private.admin_set_professional_reviewer_capacity(
    p_reviewer_id,p_availability_status,p_max_active_assignments,p_notes
  )
$$;

revoke all on function public.admin_set_professional_reviewer_capacity(uuid,text,integer,text)
from public,anon;
grant execute on function public.admin_set_professional_reviewer_capacity(uuid,text,integer,text)
to authenticated;

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
  cap public.professional_reviewer_capacity%rowtype;
  dual_allowed boolean:=false;
  active_count integer:=0;
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

  select * into cap
  from public.professional_reviewer_capacity
  where reviewer_id=r.id;

  if cap.reviewer_id is not null
     and cap.availability_status='unavailable' then
    raise exception 'Reviewer is currently marked unavailable';
  end if;

  select count(*) into active_count
  from public.professional_course_review_assignments x
  where x.reviewer_id=r.id
    and x.id<>a.id
    and x.status in ('assigned','in_review');

  if cap.reviewer_id is not null
     and cap.max_active_assignments is not null
     and active_count>=cap.max_active_assignments then
    raise exception 'Reviewer has reached the configured active-assignment capacity of %',
      cap.max_active_assignments;
  end if;

  dual_allowed :=
    private.professional_dual_review_override_enabled()
    and private.is_professional_key_admin(uid)
    and r.linked_user_id=uid;

  if a.review_type='scope' and exists(
    select 1
    from public.professional_course_review_assignments other
    where other.course_id=a.course_id
      and other.review_type='scope'
      and other.id<>a.id
      and other.reviewer_id=p_reviewer_id
      and other.status in ('assigned','in_review','completed')
  ) and not dual_allowed then
    raise exception 'Scope domains require different reviewers unless the key-administrator dual-review override is enabled';
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
    'status','assigned',
    'dual_review_override_used',dual_allowed,
    'active_assignments_after',active_count+1,
    'max_active_assignments',cap.max_active_assignments
  );
end;
$$;

create or replace function private.get_admin_professional_reviewer_workload()
returns jsonb
language plpgsql
stable
security definer
set search_path=public,private,pg_catalog
as $$
declare uid uuid:=auth.uid();
begin
  if uid is null or not public.is_lellee_admin() then
    raise exception 'Admin access required';
  end if;

  return jsonb_build_object(
    'is_key_administrator',private.is_professional_key_admin(uid),
    'summary',jsonb_build_object(
      'registered_reviewers',(select count(*) from public.professional_reviewers),
      'verified_reviewers',(select count(*) from public.professional_reviewers where active=true and verification_status='verified_in_house'),
      'active_assignments',(select count(*) from public.professional_course_review_assignments where status in ('assigned','in_review')),
      'unassigned_slots',(select count(*) from public.professional_course_review_assignments where status='unassigned'),
      'overdue_assignments',(select count(*) from public.professional_course_review_assignments where status in ('assigned','in_review') and due_date<current_date),
      'domains_without_available_reviewer',(
        select count(*)
        from (
          select distinct a.reviewer_domain
          from public.professional_course_review_assignments a
        ) d
        where not exists(
          select 1
          from public.professional_reviewers r
          left join public.professional_reviewer_capacity cap on cap.reviewer_id=r.id
          where r.active=true
            and r.verification_status='verified_in_house'
            and d.reviewer_domain=any(r.reviewer_domains)
            and coalesce(cap.availability_status,'available')<>'unavailable'
            and (
              cap.max_active_assignments is null
              or (
                select count(*)
                from public.professional_course_review_assignments ax
                where ax.reviewer_id=r.id
                  and ax.status in ('assigned','in_review')
              ) < cap.max_active_assignments
            )
        )
      )
    ),
    'reviewers',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',r.id,
        'full_name',r.full_name,
        'qualification',r.qualification,
        'reviewer_domains',r.reviewer_domains,
        'organization',r.organization,
        'verification_status',r.verification_status,
        'active',r.active,
        'availability_status',coalesce(cap.availability_status,'available'),
        'max_active_assignments',cap.max_active_assignments,
        'capacity_notes',cap.capacity_notes,
        'active_assignments',(
          select count(*)
          from public.professional_course_review_assignments a
          where a.reviewer_id=r.id and a.status in ('assigned','in_review')
        ),
        'assigned_not_started',(
          select count(*)
          from public.professional_course_review_assignments a
          where a.reviewer_id=r.id and a.status='assigned'
        ),
        'in_review',(
          select count(*)
          from public.professional_course_review_assignments a
          where a.reviewer_id=r.id and a.status='in_review'
        ),
        'completed_assignments',(
          select count(*)
          from public.professional_course_review_assignments a
          where a.reviewer_id=r.id and a.status='completed'
        ),
        'overdue_assignments',(
          select count(*)
          from public.professional_course_review_assignments a
          where a.reviewer_id=r.id
            and a.status in ('assigned','in_review')
            and a.due_date<current_date
        ),
        'due_next_7_days',(
          select count(*)
          from public.professional_course_review_assignments a
          where a.reviewer_id=r.id
            and a.status in ('assigned','in_review')
            and a.due_date between current_date and current_date+7
        ),
        'at_capacity',case
          when cap.max_active_assignments is null then false
          else (
            select count(*)
            from public.professional_course_review_assignments a
            where a.reviewer_id=r.id and a.status in ('assigned','in_review')
          )>=cap.max_active_assignments
        end
      ) order by
        case when r.verification_status='verified_in_house' and r.active then 0 else 1 end,
        r.full_name)
      from public.professional_reviewers r
      left join public.professional_reviewer_capacity cap on cap.reviewer_id=r.id
    ),'[]'::jsonb),
    'domains',coalesce((
      select jsonb_agg(jsonb_build_object(
        'reviewer_domain',d.reviewer_domain,
        'total_slots',(
          select count(*) from public.professional_course_review_assignments a
          where a.reviewer_domain=d.reviewer_domain
        ),
        'unassigned_slots',(
          select count(*) from public.professional_course_review_assignments a
          where a.reviewer_domain=d.reviewer_domain and a.status='unassigned'
        ),
        'active_slots',(
          select count(*) from public.professional_course_review_assignments a
          where a.reviewer_domain=d.reviewer_domain and a.status in ('assigned','in_review')
        ),
        'completed_slots',(
          select count(*) from public.professional_course_review_assignments a
          where a.reviewer_domain=d.reviewer_domain and a.status='completed'
        ),
        'verified_reviewers',(
          select count(*)
          from public.professional_reviewers r
          where r.active=true
            and r.verification_status='verified_in_house'
            and d.reviewer_domain=any(r.reviewer_domains)
        ),
        'available_verified_reviewers',(
          select count(*)
          from public.professional_reviewers r
          left join public.professional_reviewer_capacity cap on cap.reviewer_id=r.id
          where r.active=true
            and r.verification_status='verified_in_house'
            and d.reviewer_domain=any(r.reviewer_domains)
            and coalesce(cap.availability_status,'available')<>'unavailable'
            and (
              cap.max_active_assignments is null
              or (
                select count(*)
                from public.professional_course_review_assignments ax
                where ax.reviewer_id=r.id
                  and ax.status in ('assigned','in_review')
              ) < cap.max_active_assignments
            )
        )
      ) order by d.reviewer_domain)
      from (
        select distinct reviewer_domain
        from public.professional_course_review_assignments
      ) d
    ),'[]'::jsonb)
  );
end;
$$;

revoke all on function private.get_admin_professional_reviewer_workload()
from public,anon;
grant execute on function private.get_admin_professional_reviewer_workload()
to authenticated;

create or replace function public.get_admin_professional_reviewer_workload()
returns jsonb
language sql
stable
security invoker
set search_path=public,private,pg_catalog
as $$
  select private.get_admin_professional_reviewer_workload()
$$;

revoke all on function public.get_admin_professional_reviewer_workload()
from public,anon;
grant execute on function public.get_admin_professional_reviewer_workload()
to authenticated;

commit;