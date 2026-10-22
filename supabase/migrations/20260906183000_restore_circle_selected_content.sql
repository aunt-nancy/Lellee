-- Restore missing approved Trusted Circle components without replaying old policies.
-- Requires the applied consent-boundary repair. No UI, billing, Auth, or private journal changes.
do $migration$
declare t text; k text; sig text; priv text;
begin
  perform set_config('lock_timeout','5s',true);
  if to_regprocedure('public.respond_trusted_circle_relationship(uuid,text)') is null then
    raise exception 'Apply/review the consent-boundary repair first';
  end if;
  foreach t in array array['trusted_circle_shared_tasks','trusted_circle_shared_appointments',
    'trusted_circle_checkins','trusted_circle_emergency_contacts','program_collaboration_settings','trusted_circle_guardrails'] loop
    if to_regclass('public.'||t) is not null then raise exception 'Unexpected existing component %; do not overwrite',t; end if;
  end loop;
  foreach sig in array array['public.circle_content_relationship_current(uuid,uuid,uuid,timestamptz,text)',
    'public.circle_supporter_can_read(uuid,uuid,uuid,timestamptz,text)',
    'public.guard_circle_selected_record()','public.guard_circle_emergency_record()',
    'public.respond_trusted_circle_item(text,uuid,text,text)'] loop
    if to_regprocedure(sig) is not null then raise exception 'Unexpected existing helper %',sig; end if;
  end loop;

  create table public.program_collaboration_settings(
    program_id uuid primary key references public.programs(id) on delete restrict,
    collaboration_enabled boolean not null default false,
    family_roles_enabled boolean not null default true,
    professional_support_roles_enabled boolean not null default false,
    shared_tasks_enabled boolean not null default true,
    shared_appointments_enabled boolean not null default true,
    selected_goals_enabled boolean not null default false,
    progress_snapshot_enabled boolean not null default false,
    document_metadata_enabled boolean not null default false,
    updated_at timestamptz not null default now()
  );
  -- Preserve the approved SUPER-build default only; do not activate other programs.
  insert into public.program_collaboration_settings(program_id,collaboration_enabled,professional_support_roles_enabled)
    select id,slug='recovery',slug='recovery' from public.programs;
  create table public.trusted_circle_guardrails(
    guardrail_key text primary key,label text not null,detail text not null,enabled boolean not null default true
  );
  insert into public.trusted_circle_guardrails values
    ('no_impersonation','No account impersonation','Supporters act only through their own verified accounts.',true),
    ('no_default_journal','No journal access','Private journals are not exposed by Trusted Circle.',true),
    ('no_default_messages','No private-message access','Private Inbox and coaching messages remain separate.',true),
    ('no_default_safety','No safety-activity access','Private safety selections are excluded.',true),
    ('no_automatic_emergency_contact','No automatic contact','Emergency contacts remain owner-only; no automatic contact is enabled.',true),
    ('user_revoke_control','Owner revoke control','Owners can revoke relationships and grants; supporters can leave.',true),
    ('time_limited_shares','Time-limited sharing','Future, expired, paused and revoked grants do not permit recipient reads.',true),
    ('program_scoped_access','Program-scoped access','Selected records must match the permitted relationship and program.',true),
    ('org_coach_separation','Separate workspaces','Trusted Circle does not inherit coaching or organization permissions.',true);

  create table public.trusted_circle_shared_tasks(
    id uuid primary key default gen_random_uuid(),
    owner_user_id uuid not null references auth.users(id) on delete cascade,
    relationship_id uuid not null references public.trusted_circle_relationships(id) on delete cascade,
    program_id uuid references public.programs(id) on delete restrict,
    title text not null check(length(btrim(title)) between 1 and 300),
    note text check(length(note)<=10000),due_on date,
    status text not null default 'open' check(status in('open','in_progress','completed','cancelled')),
    assigned_to text not null default 'shared' check(assigned_to in('owner','supporter','shared')),
    created_at timestamptz not null default clock_timestamp(),completed_at timestamptz
  );
  create table public.trusted_circle_shared_appointments(
    id uuid primary key default gen_random_uuid(),
    owner_user_id uuid not null references auth.users(id) on delete cascade,
    relationship_id uuid not null references public.trusted_circle_relationships(id) on delete cascade,
    program_id uuid references public.programs(id) on delete restrict,
    title text not null check(length(btrim(title)) between 1 and 300),starts_at timestamptz not null,
    location_label text check(length(location_label)<=1000),
    status text not null default 'scheduled' check(status in('scheduled','completed','cancelled')),
    created_at timestamptz not null default clock_timestamp()
  );
  create table public.trusted_circle_checkins(
    id uuid primary key default gen_random_uuid(),
    owner_user_id uuid not null references auth.users(id) on delete cascade,
    relationship_id uuid not null references public.trusted_circle_relationships(id) on delete cascade,
    program_id uuid references public.programs(id) on delete restrict,
    title text not null check(length(btrim(title)) between 1 and 300),note text check(length(note)<=10000),due_at timestamptz,
    status text not null default 'requested' check(status in('requested','acknowledged','completed','cancelled')),
    response_label text check(length(response_label)<=2000),
    created_at timestamptz not null default clock_timestamp(),completed_at timestamptz
  );
  comment on table public.trusted_circle_checkins is
    'Explicit owner-created practical check-in requests, NOT private daily_checkins, mood, journal, or safety records. Cancelling or ending consent stops supporter reads.';
  create table public.trusted_circle_emergency_contacts(
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    relationship_id uuid references public.trusted_circle_relationships(id) on delete set null,
    label text not null check(length(btrim(label)) between 1 and 200),
    relationship_label text check(length(relationship_label)<=200),phone_masked text check(length(phone_masked)<=100),
    priority_order integer not null default 100,
    status text not null default 'active' check(status in('active','inactive')),
    automatic_contact_allowed boolean not null default false check(automatic_contact_allowed=false),
    created_at timestamptz not null default clock_timestamp()
  );

  execute $ddl$
  create function public.circle_content_relationship_current(p_relationship_id uuid,p_owner_id uuid,p_program_id uuid,p_created_at timestamptz,p_kind text)
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
          select 1 from public.program_collaboration_settings c where c.program_id=p_program_id and c.collaboration_enabled
            and (case when ro.professional_role then c.professional_support_roles_enabled else c.family_roles_enabled end)
            and (case p_kind when 'task' then c.shared_tasks_enabled when 'appointment' then c.shared_appointments_enabled else true end)
        ))
    );
  $fn$ $ddl$;
  execute $ddl$
  create function public.circle_supporter_can_read(p_relationship_id uuid,p_owner_id uuid,p_program_id uuid,p_created_at timestamptz,p_kind text)
  returns boolean language sql stable security invoker set search_path=''
  as $fn$
    select auth.uid() is not null
      and public.circle_content_relationship_current(p_relationship_id,p_owner_id,p_program_id,p_created_at,p_kind)
      and exists(select 1 from public.trusted_circle_relationships r
        where r.id=p_relationship_id and r.supporter_user_id=auth.uid()
        and (p_kind='checkin' or exists(
          select 1 from public.trusted_circle_shares s
          join public.trusted_circle_share_scopes sc on sc.scope_key=s.scope_key and sc.status='active'
          where s.relationship_id=r.id and s.owner_user_id=p_owner_id
            and s.program_id is not distinct from p_program_id
            and s.scope_key=case p_kind when 'task' then 'shared_tasks' when 'appointment' then 'shared_appointments' end
            and s.status='active' and s.revoked_at is null and s.created_at>=r.accepted_at
            and s.starts_at<=statement_timestamp() and (s.expires_at is null or s.expires_at>statement_timestamp())
        )));
  $fn$ $ddl$;
  execute $ddl$
  create function public.guard_circle_selected_record()
  returns trigger language plpgsql security definer set search_path=''
  as $fn$
  declare r public.trusted_circle_relationships%rowtype; k text;
  begin
    k:=case TG_TABLE_NAME when 'trusted_circle_shared_tasks' then 'task' when 'trusted_circle_shared_appointments' then 'appointment' when 'trusted_circle_checkins' then 'checkin' end;
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
  end $fn$ $ddl$;
  execute $ddl$
  create function public.guard_circle_emergency_record()
  returns trigger language plpgsql security invoker set search_path=''
  as $fn$
  begin
    if TG_TABLE_SCHEMA<>'public' or TG_TABLE_NAME<>'trusted_circle_emergency_contacts' or TG_OP<>'INSERT' then raise exception 'Invalid emergency-contact trigger'; end if;
    if NEW.relationship_id is not null and not exists(select 1 from public.trusted_circle_relationships r
       where r.id=NEW.relationship_id and r.owner_user_id=NEW.user_id) then
      raise exception using errcode='42501',message='Emergency contact must belong to your own circle';
    end if;
    NEW.automatic_contact_allowed:=false; NEW.created_at:=clock_timestamp(); return NEW;
  end $fn$ $ddl$;

  foreach t in array array['trusted_circle_shared_tasks','trusted_circle_shared_appointments','trusted_circle_checkins',
    'trusted_circle_emergency_contacts','program_collaboration_settings','trusted_circle_guardrails'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('grant select,insert,update,delete on table public.%I to service_role',t);
  end loop;
  create policy circle_program_settings_read on public.program_collaboration_settings for select to authenticated using(true);
  create policy circle_program_settings_admin on public.program_collaboration_settings for all to authenticated
    using(public.is_lellee_admin()) with check(public.is_lellee_admin());
  grant insert,update,delete on public.program_collaboration_settings to authenticated;
  create policy circle_guardrails_read on public.trusted_circle_guardrails for select to authenticated using(true);
  foreach t in array array['trusted_circle_shared_tasks','trusted_circle_shared_appointments','trusted_circle_checkins'] loop
    k:=case t when 'trusted_circle_shared_tasks' then 'task' when 'trusted_circle_shared_appointments' then 'appointment' else 'checkin' end;
    execute format('create index %I on public.%I(owner_user_id)',t||'_owner_idx',t);
    execute format('create index %I on public.%I(relationship_id)',t||'_relationship_idx',t);
    execute format('create trigger circle_selected_record_guard before insert or update on public.%I for each row execute function public.guard_circle_selected_record()',t);
    execute format('create policy circle_content_owner_read on public.%I for select to authenticated using(owner_user_id=(select auth.uid()))',t);
    execute format('create policy circle_content_supporter_read on public.%I for select to authenticated using(status<>''cancelled'' and public.circle_supporter_can_read(relationship_id,owner_user_id,program_id,created_at,%L))',t,k);
    execute format('create policy circle_content_owner_insert on public.%I for insert to authenticated with check(owner_user_id=(select auth.uid()))',t);
    execute format('create policy circle_content_owner_update on public.%I for update to authenticated using(owner_user_id=(select auth.uid())) with check(owner_user_id=(select auth.uid()))',t);
    execute format('create policy circle_content_owner_delete on public.%I for delete to authenticated using(owner_user_id=(select auth.uid()))',t);
    execute format('grant delete on public.%I to authenticated',t);
  end loop;
  grant insert(id,owner_user_id,relationship_id,program_id,title,note,due_on,status,assigned_to),
    update(title,note,due_on,status,assigned_to) on public.trusted_circle_shared_tasks to authenticated;
  grant insert(id,owner_user_id,relationship_id,program_id,title,starts_at,location_label,status),
    update(title,starts_at,location_label,status) on public.trusted_circle_shared_appointments to authenticated;
  grant insert(id,owner_user_id,relationship_id,program_id,title,note,due_at,status),
    update(title,note,due_at,status) on public.trusted_circle_checkins to authenticated;
  create index circle_emergency_owner_idx on public.trusted_circle_emergency_contacts(user_id);
  create trigger circle_emergency_insert_guard before insert on public.trusted_circle_emergency_contacts
    for each row execute function public.guard_circle_emergency_record();
  create policy circle_emergency_owner on public.trusted_circle_emergency_contacts for all to authenticated
    using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
  grant insert(id,user_id,relationship_id,label,relationship_label,phone_masked,priority_order,status),
    update(label,relationship_label,phone_masked,priority_order,status),delete on public.trusted_circle_emergency_contacts to authenticated;

  -- Supporters may respond, not rewrite the owner's task/check-in content or consent.
  execute $ddl$
  create function public.respond_trusted_circle_item(p_item_kind text,p_item_id uuid,p_status text,p_response text default null)
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
    if p_item_kind='task' then select relationship_id into rid from public.trusted_circle_shared_tasks where id=p_item_id;
    else select relationship_id into rid from public.trusted_circle_checkins where id=p_item_id; end if;
    perform 1 from public.trusted_circle_relationships where id=rid and supporter_user_id=caller for update;
    if not found then return false; end if;
    if p_item_kind='task' then
      select * into x from public.trusted_circle_shared_tasks where id=p_item_id and relationship_id=rid for update;
    else
      select * into x from public.trusted_circle_checkins where id=p_item_id and relationship_id=rid for update;
    end if;
    if not found then return false; end if;
    if x.status in('completed','cancelled') or not public.circle_supporter_can_read(x.relationship_id,x.owner_user_id,x.program_id,x.created_at,p_item_kind) then return false; end if;
    if p_item_kind='task' then
      if x.assigned_to='owner' then return false; end if;
      update public.trusted_circle_shared_tasks set status=p_status where id=p_item_id;
    else
      update public.trusted_circle_checkins set status=p_status,response_label=nullif(btrim(p_response),'') where id=p_item_id;
    end if;
    return true;
  end $fn$ $ddl$;
  foreach sig in array array['public.circle_content_relationship_current(uuid,uuid,uuid,timestamptz,text)',
    'public.circle_supporter_can_read(uuid,uuid,uuid,timestamptz,text)','public.respond_trusted_circle_item(text,uuid,text,text)'] loop
    execute format('revoke all on function %s from public,anon,authenticated',sig);
    execute format('grant execute on function %s to authenticated,service_role',sig);
  end loop;
  revoke all on function public.guard_circle_selected_record(),public.guard_circle_emergency_record() from public,anon,authenticated;
  grant execute on function public.guard_circle_selected_record(),public.guard_circle_emergency_record() to service_role;
  foreach t in array array['trusted_circle_shared_tasks','trusted_circle_shared_appointments','trusted_circle_checkins',
    'trusted_circle_emergency_contacts','program_collaboration_settings','trusted_circle_guardrails'] loop
    if has_table_privilege('anon','public.'||t,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
      or has_any_column_privilege('anon','public.'||t,'SELECT,INSERT,UPDATE,REFERENCES')
      or has_table_privilege('authenticated','public.'||t,'TRUNCATE,REFERENCES,TRIGGER') then raise exception 'Unsafe privilege on %',t; end if;
    foreach priv in array array['SELECT','INSERT','UPDATE','DELETE'] loop
      if not has_table_privilege('service_role','public.'||t,priv) then raise exception 'Missing service privilege on %',t; end if;
    end loop;
  end loop;
  if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
     and p.prosecdef and has_function_privilege('anon',p.oid,'EXECUTE')) then raise exception 'Anonymous privileged RPC regression'; end if;
end $migration$;
