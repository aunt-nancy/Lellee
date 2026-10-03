alter table public.coach_schedule_events
  add column if not exists operational_note text;

comment on table public.coach_sessions is
  'Legacy coach-session table retained for compatibility. New Coach Dashboard scheduling uses coach_schedule_events.';

create or replace function public.update_my_coach_schedule_event(
  p_event_id uuid,
  p_title text,
  p_session_scope text,
  p_scheduled_start timestamptz,
  p_duration_minutes integer,
  p_meeting_location text default null,
  p_meeting_url text default null,
  p_operational_note text default null,
  p_status text default null
)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
declare
  uid uuid:=auth.uid();
  e public.coach_schedule_events%rowtype;
  next_status text;
begin
  if uid is null then raise exception 'Sign in required'; end if;

  select * into e
  from public.coach_schedule_events
  where id=p_event_id
  for update;

  if e.id is null then raise exception 'Schedule event not found'; end if;
  if not public.is_coach_business_member(e.business_id) then
    raise exception 'Coach business access required';
  end if;
  if e.created_by<>uid and not public.is_lellee_admin() then
    raise exception 'Only the event creator can edit this schedule event';
  end if;

  if char_length(trim(coalesce(p_title,'')))<2 then
    raise exception 'Session title is required';
  end if;
  if p_session_scope not in ('consultation','one_to_one','group','admin') then
    raise exception 'Invalid session scope';
  end if;
  if p_duration_minutes<10 or p_duration_minutes>240 then
    raise exception 'Duration must be between 10 and 240 minutes';
  end if;

  next_status:=coalesce(p_status,e.status);
  if next_status not in ('scheduled','confirmed','completed','cancelled','no_show') then
    raise exception 'Invalid schedule status';
  end if;

  update public.coach_schedule_events
  set title=trim(p_title),
      session_scope=p_session_scope,
      scheduled_start=p_scheduled_start,
      duration_minutes=p_duration_minutes,
      meeting_location=nullif(trim(coalesce(p_meeting_location,'')),''),
      meeting_url=nullif(trim(coalesce(p_meeting_url,'')),''),
      operational_note=nullif(trim(coalesce(p_operational_note,'')),''),
      status=next_status,
      updated_at=now()
  where id=e.id;

  return jsonb_build_object('event_id',e.id,'status',next_status);
end;
$$;

revoke all on function public.update_my_coach_schedule_event(uuid,text,text,timestamptz,integer,text,text,text,text) from public,anon;
grant execute on function public.update_my_coach_schedule_event(uuid,text,text,timestamptz,integer,text,text,text,text) to authenticated,service_role;

create or replace function public.update_my_coach_availability(
  p_rule_id uuid,
  p_day_of_week integer,
  p_start_time time,
  p_end_time time,
  p_timezone text,
  p_active boolean
)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
declare
  uid uuid:=auth.uid();
  r public.coach_availability_rules%rowtype;
begin
  if uid is null then raise exception 'Sign in required'; end if;

  select * into r
  from public.coach_availability_rules
  where id=p_rule_id
  for update;

  if r.id is null then raise exception 'Availability rule not found'; end if;
  if r.user_id<>uid then
    raise exception 'You can edit only your own availability';
  end if;
  if not public.is_coach_business_member(r.business_id) then
    raise exception 'Coach business access required';
  end if;
  if p_day_of_week<0 or p_day_of_week>6 then
    raise exception 'Invalid day of week';
  end if;
  if p_end_time<=p_start_time then
    raise exception 'End time must be after start time';
  end if;

  update public.coach_availability_rules
  set day_of_week=p_day_of_week,
      start_time=p_start_time,
      end_time=p_end_time,
      timezone=coalesce(nullif(trim(p_timezone),''),'America/Los_Angeles'),
      active=p_active
  where id=r.id;

  return jsonb_build_object('rule_id',r.id,'active',p_active);
end;
$$;

revoke all on function public.update_my_coach_availability(uuid,integer,time,time,text,boolean) from public,anon;
grant execute on function public.update_my_coach_availability(uuid,integer,time,time,text,boolean) to authenticated,service_role;

create or replace function public.update_my_coach_consultation(
  p_request_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
declare
  uid uuid:=auth.uid();
  c public.coach_consultation_requests%rowtype;
begin
  if uid is null then raise exception 'Sign in required'; end if;

  select * into c
  from public.coach_consultation_requests
  where id=p_request_id
  for update;

  if c.id is null then raise exception 'Consultation request not found'; end if;
  if not public.is_coach_business_member(c.business_id) then
    raise exception 'Coach business access required';
  end if;
  if p_status not in ('new','contacted','scheduled','converted','closed') then
    raise exception 'Invalid consultation status';
  end if;

  if p_status='converted' and not exists(
    select 1
    from public.coach_client_relationships r
    where r.business_id=c.business_id
      and r.client_user_id=c.user_id
      and r.program_id=c.program_id
      and r.status in ('active','paused')
  ) then
    raise exception 'Consultation cannot be marked converted until the user accepts a coaching relationship';
  end if;

  update public.coach_consultation_requests
  set status=p_status,updated_at=now()
  where id=c.id;

  return jsonb_build_object('request_id',c.id,'status',p_status);
end;
$$;

revoke all on function public.update_my_coach_consultation(uuid,text) from public,anon;
grant execute on function public.update_my_coach_consultation(uuid,text) to authenticated,service_role;
