-- In-place hardening of the already-existing Trusted Circle selected-content tables in the canonical hkrr runtime project.
-- Requires 20260906201600_hkrr_trusted_circle_consent_boundary.sql first.

do $check$
begin
  perform set_config('lock_timeout','5s',true);
  if not exists(select 1 from public.platform_environment_baseline
    where environment_key='supabase_project_ref' and expected_value='hkrrxscyhtxmbvxevfkw') then
    raise exception 'Wrong Lellee runtime project';
  end if;
  if to_regprocedure('public.respond_trusted_circle_relationship(uuid,text)') is null then
    raise exception 'Consent-boundary repair must run first';
  end if;
  if exists(select 1 from public.trusted_circle_shared_tasks)
     or exists(select 1 from public.trusted_circle_shared_appointments)
     or exists(select 1 from public.trusted_circle_checkins)
     or exists(select 1 from public.trusted_circle_emergency_contacts) then
    raise exception 'Selected-content tables are no longer empty; inspect records before changing access rules';
  end if;
  if to_regprocedure('public.circle_content_relationship_current(uuid,uuid,uuid,timestamptz,text)') is not null
     or to_regprocedure('public.circle_supporter_can_read(uuid,uuid,uuid,timestamptz,text)') is not null
     or to_regprocedure('public.respond_trusted_circle_item(text,uuid,text,text)') is not null then
    raise exception 'Selected-content helpers already exist; inspect rather than overwrite';
  end if;
end $check$;

lock table public.trusted_circle_shared_tasks,public.trusted_circle_shared_appointments,
  public.trusted_circle_checkins,public.trusted_circle_emergency_contacts,
  public.program_collaboration_settings,public.trusted_circle_guardrails in access exclusive mode;

alter table public.trusted_circle_shared_appointments add column if not exists program_id uuid;
alter table public.trusted_circle_checkins add column if not exists program_id uuid;

alter table public.trusted_circle_shared_tasks drop constraint if exists trusted_circle_shared_tasks_program_id_fkey;
alter table public.trusted_circle_shared_tasks add constraint trusted_circle_shared_tasks_program_id_fkey
  foreign key(program_id) references public.programs(id) on delete restrict;
alter table public.trusted_circle_shared_appointments drop constraint if exists trusted_circle_shared_appointments_program_id_fkey;
alter table public.trusted_circle_shared_appointments add constraint trusted_circle_shared_appointments_program_id_fkey
  foreign key(program_id) references public.programs(id) on delete restrict;
alter table public.trusted_circle_checkins drop constraint if exists trusted_circle_checkins_program_id_fkey;
alter table public.trusted_circle_checkins add constraint trusted_circle_checkins_program_id_fkey
  foreign key(program_id) references public.programs(id) on delete restrict;
alter table public.program_collaboration_settings drop constraint if exists program_collaboration_settings_program_id_fkey;
alter table public.program_collaboration_settings add constraint program_collaboration_settings_program_id_fkey
  foreign key(program_id) references public.programs(id) on delete restrict;

alter table public.trusted_circle_shared_tasks drop constraint if exists circle_task_title_length;
alter table public.trusted_circle_shared_tasks add constraint circle_task_title_length check(length(btrim(title)) between 1 and 300);
alter table public.trusted_circle_shared_tasks drop constraint if exists circle_task_note_length;
alter table public.trusted_circle_shared_tasks add constraint circle_task_note_length check(note is null or length(note)<=10000);
alter table public.trusted_circle_shared_appointments drop constraint if exists circle_appointment_title_length;
alter table public.trusted_circle_shared_appointments add constraint circle_appointment_title_length check(length(btrim(title)) between 1 and 300);
alter table public.trusted_circle_shared_appointments drop constraint if exists circle_appointment_location_length;
alter table public.trusted_circle_shared_appointments add constraint circle_appointment_location_length check(location_label is null or length(location_label)<=1000);
alter table public.trusted_circle_checkins drop constraint if exists circle_checkin_title_length;
alter table public.trusted_circle_checkins add constraint circle_checkin_title_length check(length(btrim(title)) between 1 and 300);
alter table public.trusted_circle_checkins drop constraint if exists circle_checkin_note_length;
alter table public.trusted_circle_checkins add constraint circle_checkin_note_length check(note is null or length(note)<=10000);
alter table public.trusted_circle_checkins drop constraint if exists circle_checkin_response_length;
alter table public.trusted_circle_checkins add constraint circle_checkin_response_length check(response_label is null or length(response_label)<=2000);
alter table public.trusted_circle_emergency_contacts drop constraint if exists circle_emergency_no_auto_contact;
alter table public.trusted_circle_emergency_contacts add constraint circle_emergency_no_auto_contact check(automatic_contact_allowed=false);
comment on table public.trusted_circle_checkins is
  'Explicit owner-created practical check-in requests only; private daily_checkins, mood, journal and safety records are not exposed.';

create or replace function public.circle_content_relationship_current(
  p_relationship_id uuid,p_owner_id uuid,p_program_id uuid,p_created_at timestamptz,p_kind text)
returns boolean language sql stable security invoker set search_path=''
as $fn$
  select p_kind in('task','appointment','checkin') and exists(
    select 1 from public.trusted_circle_relationships r
    join public.trusted_circle_roles ro on ro.role_key=r.role_key and ro.status='active'
    where r.id=p_relationship_id and r.owner_user_id=p_owner_id
      and r.status='active' and r.revoked_at is null and r.accepted_at is not null
      and r.invited_by=r.owner_user_id and p_created_at>=r.accepted_at
      and (r.program_id is null or r.program_id=p_program_id)
      and (p_program_id is null or exists(
        select 1 from public.program_collaboration_settings c
        where c.program_id=p_program_id and c.collaboration_enabled
          and (case when ro.professional_role then c.professional_support_roles_enabled else c.family_roles_enabled end)
          and (case p_kind when 'task' then c.shared_tasks_enabled when 'appointment' then c.shared_appointments_enabled else true end)
      ))
  )
$fn$;

create or replace function public.circle_supporter_can_read(
  p_relationship_id uuid,p_owner_id uuid,p_program_id uuid,p_created_at timestamptz,p_kind text)
returns boolean language sql stable security invoker set search_path=''
as $fn$
  select auth.uid() is not null
    and public.circle_content_relationship_current(p_relationship_id,p_owner_id,p_program_id,p_created_at,p_kind)
    and exists(
      select 1 from public.trusted_circle_relationships r
      where r.id=p_relationship_id and r.supporter_user_id=auth.uid()
        and (p_kind='checkin' or exists(
          select 1 from public.trusted_circle_shares s
          join public.trusted_circle_share_scopes sc on sc.scope_key=s.scope_key and sc.status='active'
          where s.relationship_id=r.id and s.owner_user_id=p_owner_id
            and s.program_id is not distinct from p_program_id
            and s.scope_key=case p_kind when 'task' then 'shared_tasks' when 'appointment' then 'shared_appointments' end
            and s.status='active' and s.revoked_at is null and s.created_at>=r.accepted_at
            and s.starts_at<=statement_timestamp() and (s.expires_at is null or s.expires_at>statement_timestamp())
        ))
    )
$fn$;

create or replace function public.guard_circle_selected_record()
returns trigger language plpgsql security definer set search_path=''
as $fn$
declare r public.trusted_circle_relationships%rowtype; k text;
begin
  k:=case TG_TABLE_NAME when 'trusted_circle_shared_tasks' then 'task'
    when 'trusted_circle_shared_appointments' then 'appointment'
    when 'trusted_circle_checkins' then 'checkin' end;
  if TG_TABLE_SCHEMA<>'public' or k is null or TG_OP not in('INSERT','UPDATE') then raise exception 'Invalid circle trigger'; end if;
  if TG_OP='INSERT' then
    select * into r from public.trusted_circle_relationships where id=NEW.relationship_id for update;
    if NEW.program_id is null then NEW.program_id:=r.program_id; end if;
    NEW.created_at:=clock_timestamp();
    if r.id is null or not public.circle_content_relationship_current(NEW.relationship_id,NEW.owner_user_id,NEW.program_id,NEW.created_at,k) then
      raise exception using errcode='42501',message='Select your own accepted active relationship and enabled program';
    end if;
  elsif NEW.id is distinct from OLD.id or NEW.owner_user_id is distinct from OLD.owner_user_id
     or NEW.relationship_id is distinct from OLD.relationship_id or NEW.program_id is distinct from OLD.program_id
     or NEW.created_at is distinct from OLD.created_at then
    raise exception using errcode='42501',message='Shared record ownership, recipient, program and creation time cannot change';
  end if;
  if k<>'appointment' then
    if NEW.status='completed' then
      if TG_OP='INSERT' then NEW.completed_at:=clock_timestamp();
      elsif OLD.status<>'completed' then NEW.completed_at:=clock_timestamp();
      else NEW.completed_at:=OLD.completed_at; end if;
    else NEW.completed_at:=null; end if;
  end if;
  return NEW;
end $fn$;

create or replace function public.guard_circle_emergency_record()
returns trigger language plpgsql security invoker set search_path=''
as $fn$
begin
  if TG_TABLE_SCHEMA<>'public' or TG_TABLE_NAME<>'trusted_circle_emergency_contacts' or TG_OP<>'INSERT' then
    raise exception 'Invalid emergency-contact trigger';
  end if;
  if NEW.relationship_id is not null and not exists(
    select 1 from public.trusted_circle_relationships r where r.id=NEW.relationship_id and r.owner_user_id=NEW.user_id
  ) then
    raise exception using errcode='42501',message='Emergency contact must belong to your own circle';
  end if;
  NEW.automatic_contact_allowed:=false; NEW.created_at:=clock_timestamp(); return NEW;
end $fn$;

create or replace function public.respond_trusted_circle_item(
  p_item_kind text,p_item_id uuid,p_status text,p_response text default null)
returns boolean language plpgsql security definer set search_path=''
as $fn$
declare rid uuid; x record; caller uuid:=auth.uid();
begin
  if caller is null then raise exception using errcode='42501',message='Sign in required'; end if;
  if p_item_kind is null or p_status is null or not(
     (p_item_kind='task' and p_status in('in_progress','completed')) or
     (p_item_kind='checkin' and p_status in('acknowledged','completed')))
     or length(coalesce(p_response,''))>2000 then
    raise exception using errcode='22023',message='Invalid response';
  end if;
  if p_item_kind='task' then
    select relationship_id into rid from public.trusted_circle_shared_tasks where id=p_item_id;
  else
    select relationship_id into rid from public.trusted_circle_checkins where id=p_item_id;
  end if;
  perform 1 from public.trusted_circle_relationships where id=rid and supporter_user_id=caller for update;
  if not found then return false; end if;
  if p_item_kind='task' then
    select * into x from public.trusted_circle_shared_tasks where id=p_item_id and relationship_id=rid for update;
  else
    select * into x from public.trusted_circle_checkins where id=p_item_id and relationship_id=rid for update;
  end if;
  if not found or x.status in('completed','cancelled')
     or not public.circle_supporter_can_read(x.relationship_id,x.owner_user_id,x.program_id,x.created_at,p_item_kind) then
    return false;
  end if;
  if p_item_kind='task' then
    if x.assigned_to='owner' then return false; end if;
    update public.trusted_circle_shared_tasks set status=p_status where id=p_item_id;
  else
    update public.trusted_circle_checkins set status=p_status,response_label=nullif(btrim(p_response),'') where id=p_item_id;
  end if;
  return true;
end $fn$;

do $policies$
declare t text; p record; k text;
begin
  foreach t in array array['trusted_circle_shared_tasks','trusted_circle_shared_appointments','trusted_circle_checkins'] loop
    for p in select policyname from pg_policies where schemaname='public' and tablename=t
    loop execute format('drop policy %I on public.%I',p.policyname,t); end loop;
    k:=case t when 'trusted_circle_shared_tasks' then 'task' when 'trusted_circle_shared_appointments' then 'appointment' else 'checkin' end;
    execute format('create policy circle_content_owner_read on public.%I for select to authenticated using(owner_user_id=(select auth.uid()))',t);
    execute format('create policy circle_content_supporter_read on public.%I for select to authenticated using(status<>''cancelled'' and public.circle_supporter_can_read(relationship_id,owner_user_id,program_id,created_at,%L))',t,k);
    execute format('create policy circle_content_owner_insert on public.%I for insert to authenticated with check(owner_user_id=(select auth.uid()))',t);
    execute format('create policy circle_content_owner_update on public.%I for update to authenticated using(owner_user_id=(select auth.uid())) with check(owner_user_id=(select auth.uid()))',t);
    execute format('create policy circle_content_owner_delete on public.%I for delete to authenticated using(owner_user_id=(select auth.uid()))',t);
  end loop;
  for p in select policyname from pg_policies where schemaname='public' and tablename='trusted_circle_emergency_contacts'
  loop execute format('drop policy %I on public.trusted_circle_emergency_contacts',p.policyname); end loop;
  for p in select policyname from pg_policies where schemaname='public' and tablename='program_collaboration_settings'
  loop execute format('drop policy %I on public.program_collaboration_settings',p.policyname); end loop;
  for p in select policyname from pg_policies where schemaname='public' and tablename='trusted_circle_guardrails'
  loop execute format('drop policy %I on public.trusted_circle_guardrails',p.policyname); end loop;
end $policies$;

create policy circle_emergency_owner on public.trusted_circle_emergency_contacts for all to authenticated
  using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy circle_program_settings_read on public.program_collaboration_settings for select to authenticated using(true);
create policy circle_program_settings_admin on public.program_collaboration_settings for all to authenticated
  using(public.is_lellee_admin()) with check(public.is_lellee_admin());
create policy circle_guardrails_read on public.trusted_circle_guardrails for select to authenticated using(true);

drop trigger if exists circle_selected_record_guard on public.trusted_circle_shared_tasks;
drop trigger if exists circle_selected_record_guard on public.trusted_circle_shared_appointments;
drop trigger if exists circle_selected_record_guard on public.trusted_circle_checkins;
create trigger circle_selected_record_guard before insert or update on public.trusted_circle_shared_tasks
  for each row execute function public.guard_circle_selected_record();
create trigger circle_selected_record_guard before insert or update on public.trusted_circle_shared_appointments
  for each row execute function public.guard_circle_selected_record();
create trigger circle_selected_record_guard before insert or update on public.trusted_circle_checkins
  for each row execute function public.guard_circle_selected_record();
drop trigger if exists circle_emergency_insert_guard on public.trusted_circle_emergency_contacts;
create trigger circle_emergency_insert_guard before insert on public.trusted_circle_emergency_contacts
  for each row execute function public.guard_circle_emergency_record();

create index if not exists trusted_circle_shared_tasks_owner_idx on public.trusted_circle_shared_tasks(owner_user_id);
create index if not exists trusted_circle_shared_tasks_relationship_idx on public.trusted_circle_shared_tasks(relationship_id);
create index if not exists trusted_circle_shared_appointments_owner_idx on public.trusted_circle_shared_appointments(owner_user_id);
create index if not exists trusted_circle_shared_appointments_relationship_idx on public.trusted_circle_shared_appointments(relationship_id);
create index if not exists trusted_circle_checkins_owner_idx on public.trusted_circle_checkins(owner_user_id);
create index if not exists trusted_circle_checkins_relationship_idx on public.trusted_circle_checkins(relationship_id);
create index if not exists circle_emergency_owner_idx on public.trusted_circle_emergency_contacts(user_id);

alter table public.trusted_circle_shared_tasks enable row level security;
alter table public.trusted_circle_shared_appointments enable row level security;
alter table public.trusted_circle_checkins enable row level security;
alter table public.trusted_circle_emergency_contacts enable row level security;
alter table public.program_collaboration_settings enable row level security;
alter table public.trusted_circle_guardrails enable row level security;
revoke all on table public.trusted_circle_shared_tasks,public.trusted_circle_shared_appointments,
  public.trusted_circle_checkins,public.trusted_circle_emergency_contacts,
  public.program_collaboration_settings,public.trusted_circle_guardrails from public,anon,authenticated;
grant select on table public.trusted_circle_shared_tasks,public.trusted_circle_shared_appointments,
  public.trusted_circle_checkins,public.trusted_circle_emergency_contacts,
  public.program_collaboration_settings,public.trusted_circle_guardrails to authenticated;
grant insert(id,owner_user_id,relationship_id,program_id,title,note,due_on,status,assigned_to),
  update(title,note,due_on,status,assigned_to),delete on public.trusted_circle_shared_tasks to authenticated;
grant insert(id,owner_user_id,relationship_id,program_id,title,starts_at,location_label,status),
  update(title,starts_at,location_label,status),delete on public.trusted_circle_shared_appointments to authenticated;
grant insert(id,owner_user_id,relationship_id,program_id,title,note,due_at,status),
  update(title,note,due_at,status),delete on public.trusted_circle_checkins to authenticated;
grant insert(id,user_id,relationship_id,label,relationship_label,phone_masked,priority_order,status),
  update(label,relationship_label,phone_masked,priority_order,status),delete on public.trusted_circle_emergency_contacts to authenticated;
grant insert,update,delete on public.program_collaboration_settings to authenticated;
grant select,insert,update,delete on table public.trusted_circle_shared_tasks,public.trusted_circle_shared_appointments,
  public.trusted_circle_checkins,public.trusted_circle_emergency_contacts,
  public.program_collaboration_settings,public.trusted_circle_guardrails to service_role;

revoke all on function public.circle_content_relationship_current(uuid,uuid,uuid,timestamptz,text),
  public.circle_supporter_can_read(uuid,uuid,uuid,timestamptz,text),
  public.respond_trusted_circle_item(text,uuid,text,text),
  public.guard_circle_selected_record(),public.guard_circle_emergency_record() from public,anon,authenticated;
grant execute on function public.circle_content_relationship_current(uuid,uuid,uuid,timestamptz,text),
  public.circle_supporter_can_read(uuid,uuid,uuid,timestamptz,text),
  public.respond_trusted_circle_item(text,uuid,text,text) to authenticated,service_role;
grant execute on function public.guard_circle_selected_record(),public.guard_circle_emergency_record() to service_role;

do $verify$
begin
  if has_function_privilege('anon','public.respond_trusted_circle_item(text,uuid,text,text)','EXECUTE') then
    raise exception 'Anonymous supporter response execution remains';
  end if;
  if not exists(select 1 from information_schema.columns where table_schema='public'
    and table_name='trusted_circle_shared_appointments' and column_name='program_id')
     or not exists(select 1 from information_schema.columns where table_schema='public'
    and table_name='trusted_circle_checkins' and column_name='program_id') then
    raise exception 'Program scoping columns missing';
  end if;
  if not exists(select 1 from pg_trigger where tgrelid='public.trusted_circle_shared_tasks'::regclass
    and tgname='circle_selected_record_guard' and not tgisinternal) then raise exception 'Selected-record guard missing'; end if;
end $verify$;
