begin;

create table public.professional_review_reminder_settings (
  setting_key text primary key,
  reminders_enabled boolean not null default true,
  due_soon_days integer not null default 7 check (due_soon_days between 1 and 30),
  stalled_days integer not null default 7 check (stalled_days between 1 and 60),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

insert into public.professional_review_reminder_settings(
  setting_key,reminders_enabled,due_soon_days,stalled_days
) values('global',true,7,7);

alter table public.professional_review_reminder_settings enable row level security;
revoke all on public.professional_review_reminder_settings from anon;
grant select on public.professional_review_reminder_settings to authenticated;

create policy professional_review_reminder_settings_admin_read
on public.professional_review_reminder_settings
for select to authenticated
using (public.is_lellee_admin());

create table public.professional_review_reminders (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.professional_course_review_assignments(id) on delete cascade,
  reminder_type text not null check (reminder_type in ('due_soon','overdue','stalled')),
  status text not null default 'open' check (status in ('open','acknowledged','snoozed','resolved')),
  first_triggered_at timestamptz not null default now(),
  last_triggered_at timestamptz not null default now(),
  acknowledged_by uuid references auth.users(id),
  acknowledged_at timestamptz,
  snoozed_until timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(assignment_id,reminder_type)
);

create index professional_review_reminders_status_idx
  on public.professional_review_reminders(status,last_triggered_at);
create index professional_review_reminders_assignment_idx
  on public.professional_review_reminders(assignment_id);
create index professional_review_reminders_ack_by_idx
  on public.professional_review_reminders(acknowledged_by);

alter table public.professional_review_reminders enable row level security;
revoke all on public.professional_review_reminders from anon;
grant select on public.professional_review_reminders to authenticated;

create policy professional_review_reminders_admin_or_reviewer_read
on public.professional_review_reminders
for select to authenticated
using (
  public.is_lellee_admin()
  or exists(
    select 1
    from public.professional_course_review_assignments a
    join public.professional_reviewers r on r.id=a.reviewer_id
    where a.id=professional_review_reminders.assignment_id
      and r.linked_user_id=auth.uid()
      and r.active=true
      and r.verification_status='verified_in_house'
  )
);

create or replace function private.refresh_professional_review_reminders()
returns jsonb
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
declare
  cfg public.professional_review_reminder_settings%rowtype;
  open_count integer;
  resolved_count integer;
begin
  select * into cfg
  from public.professional_review_reminder_settings
  where setting_key='global';

  if cfg.setting_key is null or not cfg.reminders_enabled then
    return jsonb_build_object('enabled',false,'open',0,'resolved',0);
  end if;

  insert into public.professional_review_reminders(
    assignment_id,reminder_type,status,first_triggered_at,last_triggered_at,
    acknowledged_by,acknowledged_at,snoozed_until,resolved_at,updated_at
  )
  select a.id,'due_soon','open',now(),now(),null,null,null,null,now()
  from public.professional_course_review_assignments a
  where a.status in ('assigned','in_review')
    and a.due_date is not null
    and a.due_date between current_date and current_date+cfg.due_soon_days
  on conflict(assignment_id,reminder_type) do update
  set status=case
        when professional_review_reminders.status='resolved' then 'open'
        when professional_review_reminders.status='snoozed'
          and professional_review_reminders.snoozed_until<=now() then 'open'
        else professional_review_reminders.status end,
      first_triggered_at=case when professional_review_reminders.status='resolved' then now()
                              else professional_review_reminders.first_triggered_at end,
      last_triggered_at=now(),
      acknowledged_by=case when professional_review_reminders.status='resolved' then null
                            else professional_review_reminders.acknowledged_by end,
      acknowledged_at=case when professional_review_reminders.status='resolved' then null
                            else professional_review_reminders.acknowledged_at end,
      snoozed_until=case
        when professional_review_reminders.status='resolved'
          or (professional_review_reminders.status='snoozed' and professional_review_reminders.snoozed_until<=now())
        then null else professional_review_reminders.snoozed_until end,
      resolved_at=null,
      updated_at=now();

  insert into public.professional_review_reminders(
    assignment_id,reminder_type,status,first_triggered_at,last_triggered_at,
    acknowledged_by,acknowledged_at,snoozed_until,resolved_at,updated_at
  )
  select a.id,'overdue','open',now(),now(),null,null,null,null,now()
  from public.professional_course_review_assignments a
  where a.status in ('assigned','in_review')
    and a.due_date is not null
    and a.due_date<current_date
  on conflict(assignment_id,reminder_type) do update
  set status=case
        when professional_review_reminders.status='resolved' then 'open'
        when professional_review_reminders.status='snoozed'
          and professional_review_reminders.snoozed_until<=now() then 'open'
        else professional_review_reminders.status end,
      first_triggered_at=case when professional_review_reminders.status='resolved' then now()
                              else professional_review_reminders.first_triggered_at end,
      last_triggered_at=now(),
      acknowledged_by=case when professional_review_reminders.status='resolved' then null
                            else professional_review_reminders.acknowledged_by end,
      acknowledged_at=case when professional_review_reminders.status='resolved' then null
                            else professional_review_reminders.acknowledged_at end,
      snoozed_until=case
        when professional_review_reminders.status='resolved'
          or (professional_review_reminders.status='snoozed' and professional_review_reminders.snoozed_until<=now())
        then null else professional_review_reminders.snoozed_until end,
      resolved_at=null,
      updated_at=now();

  insert into public.professional_review_reminders(
    assignment_id,reminder_type,status,first_triggered_at,last_triggered_at,
    acknowledged_by,acknowledged_at,snoozed_until,resolved_at,updated_at
  )
  select a.id,'stalled','open',now(),now(),null,null,null,null,now()
  from public.professional_course_review_assignments a
  where (
    a.status='assigned'
    and coalesce(a.assigned_at,a.created_at)<=now()-make_interval(days=>cfg.stalled_days)
  ) or (
    a.status='in_review'
    and coalesce(a.started_at,a.assigned_at,a.created_at)<=now()-make_interval(days=>cfg.stalled_days)
  )
  on conflict(assignment_id,reminder_type) do update
  set status=case
        when professional_review_reminders.status='resolved' then 'open'
        when professional_review_reminders.status='snoozed'
          and professional_review_reminders.snoozed_until<=now() then 'open'
        else professional_review_reminders.status end,
      first_triggered_at=case when professional_review_reminders.status='resolved' then now()
                              else professional_review_reminders.first_triggered_at end,
      last_triggered_at=now(),
      acknowledged_by=case when professional_review_reminders.status='resolved' then null
                            else professional_review_reminders.acknowledged_by end,
      acknowledged_at=case when professional_review_reminders.status='resolved' then null
                            else professional_review_reminders.acknowledged_at end,
      snoozed_until=case
        when professional_review_reminders.status='resolved'
          or (professional_review_reminders.status='snoozed' and professional_review_reminders.snoozed_until<=now())
        then null else professional_review_reminders.snoozed_until end,
      resolved_at=null,
      updated_at=now();

  update public.professional_review_reminders r
  set status='resolved',resolved_at=now(),snoozed_until=null,updated_at=now()
  where r.status<>'resolved'
    and r.reminder_type='due_soon'
    and not exists(
      select 1 from public.professional_course_review_assignments a
      where a.id=r.assignment_id
        and a.status in ('assigned','in_review')
        and a.due_date is not null
        and a.due_date between current_date and current_date+cfg.due_soon_days
    );

  update public.professional_review_reminders r
  set status='resolved',resolved_at=now(),snoozed_until=null,updated_at=now()
  where r.status<>'resolved'
    and r.reminder_type='overdue'
    and not exists(
      select 1 from public.professional_course_review_assignments a
      where a.id=r.assignment_id
        and a.status in ('assigned','in_review')
        and a.due_date is not null
        and a.due_date<current_date
    );

  update public.professional_review_reminders r
  set status='resolved',resolved_at=now(),snoozed_until=null,updated_at=now()
  where r.status<>'resolved'
    and r.reminder_type='stalled'
    and not exists(
      select 1 from public.professional_course_review_assignments a
      where a.id=r.assignment_id
        and (
          (a.status='assigned' and coalesce(a.assigned_at,a.created_at)<=now()-make_interval(days=>cfg.stalled_days))
          or
          (a.status='in_review' and coalesce(a.started_at,a.assigned_at,a.created_at)<=now()-make_interval(days=>cfg.stalled_days))
        )
    );

  select count(*) into open_count
  from public.professional_review_reminders
  where status='open';

  select count(*) into resolved_count
  from public.professional_review_reminders
  where status='resolved';

  return jsonb_build_object(
    'enabled',true,
    'due_soon_days',cfg.due_soon_days,
    'stalled_days',cfg.stalled_days,
    'open',open_count,
    'resolved',resolved_count
  );
end;
$$;

revoke all on function private.refresh_professional_review_reminders()
from public,anon,authenticated;

create or replace function private.get_admin_professional_review_deadline_center()
returns jsonb
language plpgsql
stable
security definer
set search_path=public,private,pg_catalog
as $$
declare
  uid uuid:=auth.uid();
  cfg public.professional_review_reminder_settings%rowtype;
begin
  if uid is null or not public.is_lellee_admin() then
    raise exception 'Admin access required';
  end if;

  select * into cfg
  from public.professional_review_reminder_settings
  where setting_key='global';

  return jsonb_build_object(
    'is_key_administrator',private.is_professional_key_admin(uid),
    'settings',jsonb_build_object(
      'reminders_enabled',cfg.reminders_enabled,
      'due_soon_days',cfg.due_soon_days,
      'stalled_days',cfg.stalled_days
    ),
    'summary',jsonb_build_object(
      'open_alerts',(select count(*) from public.professional_review_reminders where status='open'),
      'due_soon',(select count(*) from public.professional_review_reminders where status='open' and reminder_type='due_soon'),
      'overdue',(select count(*) from public.professional_review_reminders where status='open' and reminder_type='overdue'),
      'stalled',(select count(*) from public.professional_review_reminders where status='open' and reminder_type='stalled'),
      'acknowledged',(select count(*) from public.professional_review_reminders where status='acknowledged'),
      'assignments_without_due_date',(
        select count(*) from public.professional_course_review_assignments
        where status in ('assigned','in_review') and due_date is null
      )
    ),
    'alerts',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',r.id,
        'reminder_type',r.reminder_type,
        'status',r.status,
        'first_triggered_at',r.first_triggered_at,
        'last_triggered_at',r.last_triggered_at,
        'snoozed_until',r.snoozed_until,
        'assignment_id',a.id,
        'review_type',a.review_type,
        'reviewer_domain',a.reviewer_domain,
        'assignment_status',a.status,
        'due_date',a.due_date,
        'days_until_due',case when a.due_date is null then null else a.due_date-current_date end,
        'course_key',c.course_key,
        'course_title',c.title,
        'reviewer_id',rv.id,
        'reviewer_name',rv.full_name
      ) order by
        case r.reminder_type when 'overdue' then 1 when 'stalled' then 2 else 3 end,
        a.due_date nulls last,
        c.title)
      from public.professional_review_reminders r
      join public.professional_course_review_assignments a on a.id=r.assignment_id
      join public.professional_courses c on c.id=a.course_id
      left join public.professional_reviewers rv on rv.id=a.reviewer_id
      where r.status in ('open','acknowledged','snoozed')
    ),'[]'::jsonb)
  );
end;
$$;

revoke all on function private.get_admin_professional_review_deadline_center()
from public,anon;
grant execute on function private.get_admin_professional_review_deadline_center()
to authenticated;

create or replace function public.get_admin_professional_review_deadline_center()
returns jsonb
language sql
stable
security invoker
set search_path=public,private,pg_catalog
as $$ select private.get_admin_professional_review_deadline_center() $$;

revoke all on function public.get_admin_professional_review_deadline_center()
from public,anon;
grant execute on function public.get_admin_professional_review_deadline_center()
to authenticated;

create or replace function private.admin_set_professional_review_reminder_settings(
  p_enabled boolean,
  p_due_soon_days integer,
  p_stalled_days integer
)
returns jsonb
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
declare uid uuid:=auth.uid();
begin
  if not private.is_professional_key_admin(uid) then
    raise exception 'Key administrator access required';
  end if;
  if p_due_soon_days not between 1 and 30 then raise exception 'Due-soon window must be between 1 and 30 days'; end if;
  if p_stalled_days not between 1 and 60 then raise exception 'Stalled threshold must be between 1 and 60 days'; end if;

  update public.professional_review_reminder_settings
  set reminders_enabled=p_enabled,
      due_soon_days=p_due_soon_days,
      stalled_days=p_stalled_days,
      updated_by=uid,
      updated_at=now()
  where setting_key='global';

  perform private.refresh_professional_review_reminders();

  insert into public.admin_audit_log(
    actor_user_id,entity_type,entity_id,action,
    changed_fields,action_label,workspace
  ) values(
    uid,'professional_review_reminder_settings','global','set_review_reminder_settings',
    array['reminders_enabled','due_soon_days','stalled_days'],
    'Updated professional review deadline/reminder settings',
    'professional_training'
  );

  return jsonb_build_object(
    'reminders_enabled',p_enabled,
    'due_soon_days',p_due_soon_days,
    'stalled_days',p_stalled_days
  );
end;
$$;

revoke all on function private.admin_set_professional_review_reminder_settings(boolean,integer,integer)
from public,anon;
grant execute on function private.admin_set_professional_review_reminder_settings(boolean,integer,integer)
to authenticated;

create or replace function public.admin_set_professional_review_reminder_settings(
  p_enabled boolean,
  p_due_soon_days integer,
  p_stalled_days integer
)
returns jsonb
language sql
security invoker
set search_path=public,private,pg_catalog
as $$ select private.admin_set_professional_review_reminder_settings(p_enabled,p_due_soon_days,p_stalled_days) $$;

revoke all on function public.admin_set_professional_review_reminder_settings(boolean,integer,integer)
from public,anon;
grant execute on function public.admin_set_professional_review_reminder_settings(boolean,integer,integer)
to authenticated;

create or replace function private.admin_update_professional_review_reminder(
  p_reminder_id uuid,
  p_action text,
  p_snooze_days integer default null
)
returns jsonb
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
declare uid uuid:=auth.uid(); r public.professional_review_reminders%rowtype;
begin
  if uid is null or not public.is_lellee_admin() then raise exception 'Admin access required'; end if;
  select * into r from public.professional_review_reminders where id=p_reminder_id for update;
  if r.id is null then raise exception 'Reminder not found'; end if;

  if p_action='acknowledge' then
    update public.professional_review_reminders
    set status='acknowledged',acknowledged_by=uid,acknowledged_at=now(),snoozed_until=null,updated_at=now()
    where id=r.id;
  elsif p_action='reopen' then
    update public.professional_review_reminders
    set status='open',acknowledged_by=null,acknowledged_at=null,snoozed_until=null,updated_at=now()
    where id=r.id;
  elsif p_action='snooze' then
    if p_snooze_days is null or p_snooze_days not between 1 and 30 then raise exception 'Snooze must be between 1 and 30 days'; end if;
    update public.professional_review_reminders
    set status='snoozed',snoozed_until=now()+make_interval(days=>p_snooze_days),updated_at=now()
    where id=r.id;
  else
    raise exception 'Invalid reminder action';
  end if;

  return jsonb_build_object('reminder_id',r.id,'action',p_action);
end;
$$;

revoke all on function private.admin_update_professional_review_reminder(uuid,text,integer)
from public,anon;
grant execute on function private.admin_update_professional_review_reminder(uuid,text,integer)
to authenticated;

create or replace function public.admin_update_professional_review_reminder(
  p_reminder_id uuid,
  p_action text,
  p_snooze_days integer default null
)
returns jsonb
language sql
security invoker
set search_path=public,private,pg_catalog
as $$ select private.admin_update_professional_review_reminder(p_reminder_id,p_action,p_snooze_days) $$;

revoke all on function public.admin_update_professional_review_reminder(uuid,text,integer)
from public,anon;
grant execute on function public.admin_update_professional_review_reminder(uuid,text,integer)
to authenticated;

create or replace function private.get_my_professional_review_reminders()
returns jsonb
language plpgsql
stable
security definer
set search_path=public,private,pg_catalog
as $$
declare uid uuid:=auth.uid();
begin
  if uid is null then raise exception 'Sign in required'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',r.id,'reminder_type',r.reminder_type,'status',r.status,
      'course_title',c.title,'review_type',a.review_type,
      'reviewer_domain',a.reviewer_domain,'due_date',a.due_date,
      'assignment_status',a.status
    ) order by
      case r.reminder_type when 'overdue' then 1 when 'stalled' then 2 else 3 end,
      a.due_date nulls last)
    from public.professional_review_reminders r
    join public.professional_course_review_assignments a on a.id=r.assignment_id
    join public.professional_reviewers rv on rv.id=a.reviewer_id
    join public.professional_courses c on c.id=a.course_id
    where rv.linked_user_id=uid
      and rv.active=true
      and rv.verification_status='verified_in_house'
      and r.status in ('open','acknowledged','snoozed')
  ),'[]'::jsonb);
end;
$$;

revoke all on function private.get_my_professional_review_reminders()
from public,anon;
grant execute on function private.get_my_professional_review_reminders()
to authenticated;

create or replace function public.get_my_professional_review_reminders()
returns jsonb
language sql
stable
security invoker
set search_path=public,private,pg_catalog
as $$ select private.get_my_professional_review_reminders() $$;

revoke all on function public.get_my_professional_review_reminders()
from public,anon;
grant execute on function public.get_my_professional_review_reminders()
to authenticated;

select private.refresh_professional_review_reminders();

select cron.schedule(
  'professional-review-reminder-refresh',
  '0 * * * *',
  $$select private.refresh_professional_review_reminders();$$
);

commit;