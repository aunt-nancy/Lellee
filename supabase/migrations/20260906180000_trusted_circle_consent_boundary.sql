-- Bounded Trusted Circle permission/lifecycle repair. Not the full SUPER build.
-- Existing frontend/design, private content tables, billing and Auth settings are untouched.
-- Apply once to the inspected foundation; all changes are atomic and preserve existing data.
do $migration$
declare t text; sig text; priv text;
begin
  perform set_config('lock_timeout','5s',true);
  lock table public.trusted_circle_relationships, public.trusted_circle_shares,
             public.trusted_circle_roles, public.trusted_circle_share_scopes in access exclusive mode;
  if exists(select 1 from public.trusted_circle_relationships) or exists(select 1 from public.trusted_circle_shares) then
    raise exception 'This reviewed migration requires empty relationship/share tables; do not guess consent for existing records';
  end if;
  if to_regprocedure('public.invite_trusted_circle_member(text,text)') is not null
     or to_regprocedure('public.accept_trusted_circle_invitation(uuid)') is not null
     or to_regprocedure('public.revoke_trusted_circle_relationship(uuid)') is not null
     or to_regprocedure('public.respond_trusted_circle_relationship(uuid,text)') is not null
     or to_regprocedure('public.guard_trusted_circle_share_insert()') is not null then
    raise exception 'Unexpected existing lifecycle implementation; review instead of overwriting';
  end if;
  if exists(select 1 from pg_trigger where not tgisinternal and tgrelid in
      ('public.trusted_circle_relationships'::regclass,'public.trusted_circle_shares'::regclass)) then
    raise exception 'Unexpected existing Trusted Circle trigger';
  end if;
  if (select count(*) from pg_policies where schemaname='public' and tablename in('trusted_circle_relationships','trusted_circle_shares'))<>4
     or exists(select 1 from pg_policies where schemaname='public'
       and tablename in('trusted_circle_relationships','trusted_circle_shares')
       and policyname not in('circle_relationships_parties','circle_relationships_parties_write','circle_shares_owner_write','circle_shares_parties')) then
    raise exception 'Unexpected sharing policies; review before replacing';
  end if;

  -- NULL program IDs must not permit duplicate account-level invitations.
  create unique index circle_one_account_relationship
    on public.trusted_circle_relationships(owner_user_id,supporter_user_id,role_key) where program_id is null;
  -- Deleting a program must never turn program-scoped consent into account-wide consent.
  alter table public.trusted_circle_relationships drop constraint trusted_circle_relationships_program_id_fkey;
  alter table public.trusted_circle_relationships add constraint trusted_circle_relationships_program_id_fkey
    foreign key(program_id) references public.programs(id) on delete restrict;
  alter table public.trusted_circle_shares drop constraint trusted_circle_shares_program_id_fkey;
  alter table public.trusted_circle_shares add constraint trusted_circle_shares_program_id_fkey
    foreign key(program_id) references public.programs(id) on delete restrict;
  alter table public.trusted_circle_shares add constraint circle_valid_share_window
    check(expires_at is null or expires_at>starts_at);

  execute $ddl$
  create function public.invite_trusted_circle_member(p_email text,p_role_key text)
  returns uuid language plpgsql security definer set search_path=''
  as $fn$
  declare caller uuid:=auth.uid(); sid uuid; rel public.trusted_circle_relationships%rowtype; ts timestamptz;
  begin
    if caller is null or not exists(select 1 from auth.users where id=caller and email_confirmed_at is not null and deleted_at is null) then
      raise exception using errcode='42501',message='A verified signed-in account is required';
    end if;
    if p_email is null or length(btrim(p_email))=0 or length(p_email)>320
       or p_role_key is null or not exists(select 1 from public.trusted_circle_roles where role_key=p_role_key and status='active') then
      raise exception using errcode='22023',message='A valid email and active Trusted Circle role are required';
    end if;
    begin
      select id into strict sid from auth.users where lower(btrim(email))=lower(btrim(p_email))
        and email_confirmed_at is not null and deleted_at is null;
    exception when no_data_found or too_many_rows then
      raise exception using errcode='22023',message='Invitation requires an existing verified Lellee account';
    end;
    if sid=caller then raise exception using errcode='22023',message='You cannot invite yourself'; end if;
    perform pg_advisory_xact_lock(hashtextextended('lellee-circle:'||caller::text||':'||sid::text||':'||p_role_key,0));
    select * into rel from public.trusted_circle_relationships
      where owner_user_id=caller and supporter_user_id=sid and role_key=p_role_key and program_id is null for update;
    if found and rel.status in('invited','active') and rel.revoked_at is null then return rel.id; end if;
    ts:=clock_timestamp();
    if rel.id is null then
      insert into public.trusted_circle_relationships(owner_user_id,supporter_user_id,role_key,status,invited_by,invited_at)
        values(caller,sid,p_role_key,'invited',caller,ts) returning id into rel.id;
    else
      update public.trusted_circle_shares set status='revoked',revoked_at=coalesce(revoked_at,ts)
        where relationship_id=rel.id and (status<>'revoked' or revoked_at is null);
      update public.trusted_circle_relationships set status='invited',invited_by=caller,invited_at=ts,accepted_at=null,revoked_at=null
        where id=rel.id;
    end if;
    return rel.id;
  end $fn$
  $ddl$;

  -- All consent-state mutations use a locked row and the signed-in caller, never supplied user IDs.
  execute $ddl$
  create function public.respond_trusted_circle_relationship(p_relationship_id uuid,p_action text)
  returns boolean language plpgsql security definer set search_path=''
  as $fn$
  declare caller uuid:=auth.uid(); rel public.trusted_circle_relationships%rowtype; next_status text; ts timestamptz;
  begin
    if caller is null then raise exception using errcode='42501',message='Sign in required'; end if;
    if p_action is null or p_action not in('accept','decline','pause','revoke','leave') then
      raise exception using errcode='22023',message='Invalid relationship action';
    end if;
    select * into rel from public.trusted_circle_relationships where id=p_relationship_id
      and (owner_user_id=caller or supporter_user_id=caller) for update;
    if not found then return false; end if;
    ts:=clock_timestamp();
    if p_action='accept' then
      if caller<>rel.supporter_user_id or rel.status<>'invited' or rel.revoked_at is not null
         or rel.invited_by is distinct from rel.owner_user_id
         or not exists(select 1 from public.trusted_circle_roles where role_key=rel.role_key and status='active')
         or not exists(select 1 from auth.users where id=caller and email_confirmed_at is not null and deleted_at is null) then return false; end if;
      update public.trusted_circle_relationships set status='active',accepted_at=ts where id=rel.id;
      return true;
    elsif p_action='decline' then
      if caller<>rel.supporter_user_id or rel.status<>'invited' then return false; end if;
      next_status:='declined';
    elsif p_action='pause' then
      if caller<>rel.owner_user_id or rel.status<>'active' then return false; end if;
      update public.trusted_circle_relationships set status='paused' where id=rel.id;
      return true;
    elsif p_action='revoke' then
      if caller<>rel.owner_user_id or rel.status not in('invited','active','paused') then return false; end if;
      next_status:='revoked';
    else
      if caller<>rel.supporter_user_id or rel.status not in('active','paused') then return false; end if;
      next_status:='ended';
    end if;
    update public.trusted_circle_relationships set status=next_status,revoked_at=ts where id=rel.id;
    update public.trusted_circle_shares set status='revoked',revoked_at=coalesce(revoked_at,ts)
      where relationship_id=rel.id and (status<>'revoked' or revoked_at is null);
    return true;
  end $fn$
  $ddl$;
  execute $ddl$create function public.accept_trusted_circle_invitation(p_relationship_id uuid)
    returns boolean language sql security invoker set search_path=''
    as $fn$select public.respond_trusted_circle_relationship(p_relationship_id,'accept')$fn$ $ddl$;
  execute $ddl$create function public.revoke_trusted_circle_relationship(p_relationship_id uuid)
    returns boolean language sql security invoker set search_path=''
    as $fn$select public.respond_trusted_circle_relationship(p_relationship_id,'revoke')$fn$ $ddl$;

  -- INSERT-only compatibility: the owner still selects individual sharing scopes.
  -- This trigger serializes new grants with invitation/relationship revocation.
  execute $ddl$
  create function public.guard_trusted_circle_share_insert()
  returns trigger language plpgsql security definer set search_path=''
  as $fn$
  declare rel public.trusted_circle_relationships%rowtype;
  begin
    if TG_OP<>'INSERT' or TG_TABLE_SCHEMA<>'public' or TG_TABLE_NAME<>'trusted_circle_shares' then
      raise exception 'Invalid share trigger use';
    end if;
    select * into rel from public.trusted_circle_relationships where id=NEW.relationship_id for update;
    if not found or NEW.owner_user_id is distinct from rel.owner_user_id
       or rel.status<>'active' or rel.revoked_at is not null or rel.accepted_at is null
       or rel.invited_by is distinct from rel.owner_user_id
       or (rel.program_id is not null and NEW.program_id is distinct from rel.program_id)
       or not exists(select 1 from public.trusted_circle_roles where role_key=rel.role_key and status='active') then
      raise exception using errcode='42501',message='Sharing requires the matching owner and an accepted active relationship';
    end if;
    if NEW.status<>'active' or NEW.revoked_at is not null
       or NEW.scope_key not in('shared_tasks','shared_appointments','selected_goals','selected_milestones','progress_snapshot','resource_referrals','document_metadata')
       or not exists(select 1 from public.trusted_circle_share_scopes where scope_key=NEW.scope_key and status='active') then
      raise exception using errcode='42501',message='This sharing scope or initial state is not permitted';
    end if;
    NEW.created_at:=clock_timestamp();
    if NEW.starts_at is null then NEW.starts_at:=NEW.created_at; end if;
    if NEW.expires_at is not null and (NEW.expires_at<=NEW.starts_at or NEW.expires_at<=NEW.created_at) then
      raise exception using errcode='22023',message='Sharing expiration must be after its start and the current time';
    end if;
    return NEW;
  end $fn$
  $ddl$;
  create trigger circle_validate_new_share before insert on public.trusted_circle_shares
    for each row execute function public.guard_trusted_circle_share_insert();

  execute $ddl$
  create or replace function public.revoke_trusted_circle_share(p_share_id uuid)
  returns boolean language plpgsql security definer set search_path=''
  as $fn$
  declare caller uuid:=auth.uid(); rid uuid;
  begin
    if caller is null then raise exception using errcode='42501',message='Sign in required'; end if;
    select relationship_id into rid from public.trusted_circle_shares where id=p_share_id and owner_user_id=caller;
    if rid is null then return false; end if;
    perform 1 from public.trusted_circle_relationships where id=rid for update;
    update public.trusted_circle_shares set status='revoked',revoked_at=coalesce(revoked_at,clock_timestamp())
      where id=p_share_id and owner_user_id=caller and (status<>'revoked' or revoked_at is null);
    return found;
  end $fn$
  $ddl$;

  drop policy circle_relationships_parties_write on public.trusted_circle_relationships;
  -- Preserve existing owner/supporter/Admin relationship metadata reads only.
  drop policy circle_shares_owner_write on public.trusted_circle_shares;
  drop policy circle_shares_parties on public.trusted_circle_shares;
  create policy circle_share_owner_read on public.trusted_circle_shares for select to authenticated
    using(owner_user_id=(select auth.uid()) or public.is_lellee_admin());
  create policy circle_share_recipient_read on public.trusted_circle_shares for select to authenticated using(
    status='active' and revoked_at is null and starts_at<=statement_timestamp()
    and (expires_at is null or expires_at>statement_timestamp())
    and scope_key in('shared_tasks','shared_appointments','selected_goals','selected_milestones','progress_snapshot','resource_referrals','document_metadata')
    and exists(select 1 from public.trusted_circle_share_scopes sc where sc.scope_key=trusted_circle_shares.scope_key and sc.status='active')
    and exists(select 1 from public.trusted_circle_relationships r
      join public.trusted_circle_roles ro on ro.role_key=r.role_key and ro.status='active'
      where r.id=trusted_circle_shares.relationship_id and r.owner_user_id=trusted_circle_shares.owner_user_id
        and r.supporter_user_id=(select auth.uid()) and r.status='active' and r.revoked_at is null
        and r.accepted_at is not null and r.invited_by=r.owner_user_id and trusted_circle_shares.created_at>=r.accepted_at
        and (r.program_id is null or r.program_id=trusted_circle_shares.program_id)));
  create policy circle_share_owner_insert on public.trusted_circle_shares for insert to authenticated
    with check(owner_user_id=(select auth.uid()));
  create policy circle_share_owner_delete on public.trusted_circle_shares for delete to authenticated
    using(owner_user_id=(select auth.uid()));

  foreach t in array array['trusted_circle_relationships','trusted_circle_shares','trusted_circle_roles','trusted_circle_share_scopes'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public, anon, authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
  end loop;
  grant insert(id,owner_user_id,relationship_id,scope_key,program_id,starts_at,expires_at),delete
    on public.trusted_circle_shares to authenticated;
  -- No browser UPDATE of consent, identity, recipients, timestamps or permissions.
  -- Revoke through the owner-checked RPC; explicitly sharing again uses a fresh grant.
  foreach sig in array array[
    'public.invite_trusted_circle_member(text,text)','public.respond_trusted_circle_relationship(uuid,text)',
    'public.accept_trusted_circle_invitation(uuid)','public.revoke_trusted_circle_relationship(uuid)',
    'public.revoke_trusted_circle_share(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated',sig);
    execute format('grant execute on function %s to authenticated, service_role',sig);
    if has_function_privilege('anon',sig,'EXECUTE') then raise exception 'Anonymous lifecycle grant remains'; end if;
  end loop;
  revoke all on function public.guard_trusted_circle_share_insert() from public,anon,authenticated;
  grant execute on function public.guard_trusted_circle_share_insert() to service_role;
  foreach t in array array['trusted_circle_relationships','trusted_circle_shares','trusted_circle_roles','trusted_circle_share_scopes'] loop
    if has_table_privilege('anon',format('public.%I',t),'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
       or has_any_column_privilege('anon',format('public.%I',t),'SELECT,INSERT,UPDATE,REFERENCES')
       or has_any_column_privilege('authenticated',format('public.%I',t),'UPDATE')
       or has_table_privilege('authenticated',format('public.%I',t),'TRUNCATE,REFERENCES,TRIGGER') then
      raise exception 'Unexpected client privilege on %',t;
    end if;
    foreach priv in array array['SELECT','INSERT','UPDATE','DELETE'] loop
      if not has_table_privilege('service_role',format('public.%I',t),priv) then raise exception 'Service privilege missing'; end if;
    end loop;
  end loop;
  if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.prosecdef and has_function_privilege('anon',p.oid,'EXECUTE')) then
    raise exception 'Anonymous privileged execution regression';
  end if;
end $migration$;
