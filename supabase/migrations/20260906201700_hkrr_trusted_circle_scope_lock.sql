-- Defense-in-depth: the current Trusted Circle release implements only selected tasks and selected appointments.
-- Keep the broader catalog for future product work, but do not allow browser-created grants for unimplemented scopes.

do $check$
begin
  if not exists(select 1 from public.platform_environment_baseline
    where environment_key='supabase_project_ref' and expected_value='hkrrxscyhtxmbvxevfkw') then
    raise exception 'Wrong Lellee runtime project';
  end if;
  if to_regprocedure('public.guard_trusted_circle_share_insert()') is null then
    raise exception 'Consent-boundary migration must run first';
  end if;
  if exists(select 1 from public.trusted_circle_shares) then
    raise exception 'Sharing records now exist; inspect them before narrowing release scopes';
  end if;
end $check$;

create or replace function public.guard_trusted_circle_share_insert()
returns trigger language plpgsql security definer set search_path=''
as $fn$
declare
  rel public.trusted_circle_relationships%rowtype;
  role_is_professional boolean;
begin
  if TG_OP<>'INSERT' or TG_TABLE_SCHEMA<>'public' or TG_TABLE_NAME<>'trusted_circle_shares' then
    raise exception 'Invalid share trigger use';
  end if;

  select * into rel from public.trusted_circle_relationships where id=NEW.relationship_id for update;
  if not found or NEW.owner_user_id is distinct from rel.owner_user_id
     or rel.status<>'active' or rel.revoked_at is not null or rel.accepted_at is null
     or rel.invited_by is distinct from rel.owner_user_id
     or (rel.program_id is not null and NEW.program_id is distinct from rel.program_id) then
    raise exception using errcode='42501',message='Sharing requires the matching owner and an accepted active relationship';
  end if;

  select professional_role into role_is_professional
  from public.trusted_circle_roles where role_key=rel.role_key and status='active';
  if not found then
    raise exception using errcode='42501',message='The Trusted Circle role is not active';
  end if;

  if NEW.scope_key not in('shared_tasks','shared_appointments')
     or not exists(select 1 from public.trusted_circle_share_scopes
                   where scope_key=NEW.scope_key and status='active') then
    raise exception using errcode='42501',message='This sharing category is not enabled in the current Lellee release';
  end if;

  if NEW.program_id is not null and not exists(
    select 1 from public.program_collaboration_settings c
    where c.program_id=NEW.program_id and c.collaboration_enabled
      and (case when role_is_professional then c.professional_support_roles_enabled else c.family_roles_enabled end)
      and (case NEW.scope_key
             when 'shared_tasks' then c.shared_tasks_enabled
             when 'shared_appointments' then c.shared_appointments_enabled
           end)
  ) then
    raise exception using errcode='42501',message='That sharing category is not enabled for the selected program and role';
  end if;

  if NEW.status<>'active' or NEW.revoked_at is not null then
    raise exception using errcode='42501',message='A new permission must begin active and unrevoked';
  end if;

  NEW.created_at:=clock_timestamp();
  if NEW.starts_at is null then NEW.starts_at:=NEW.created_at; end if;
  if NEW.expires_at is not null and (NEW.expires_at<=NEW.starts_at or NEW.expires_at<=NEW.created_at) then
    raise exception using errcode='22023',message='Sharing expiration must be after its start and the current time';
  end if;
  return NEW;
end
$fn$;

-- Recipient metadata visibility mirrors the same two implemented release scopes.
drop policy if exists circle_share_recipient_read on public.trusted_circle_shares;
create policy circle_share_recipient_read on public.trusted_circle_shares
for select to authenticated
using(
  status='active' and revoked_at is null and starts_at<=statement_timestamp()
  and (expires_at is null or expires_at>statement_timestamp())
  and scope_key in('shared_tasks','shared_appointments')
  and exists(select 1 from public.trusted_circle_share_scopes sc
             where sc.scope_key=trusted_circle_shares.scope_key and sc.status='active')
  and exists(
    select 1 from public.trusted_circle_relationships r
    join public.trusted_circle_roles ro on ro.role_key=r.role_key and ro.status='active'
    where r.id=trusted_circle_shares.relationship_id
      and r.owner_user_id=trusted_circle_shares.owner_user_id
      and r.supporter_user_id=(select auth.uid())
      and r.status='active' and r.revoked_at is null and r.accepted_at is not null
      and r.invited_by=r.owner_user_id and trusted_circle_shares.created_at>=r.accepted_at
      and (r.program_id is null or r.program_id=trusted_circle_shares.program_id)
      and (trusted_circle_shares.program_id is null or exists(
        select 1 from public.program_collaboration_settings c
        where c.program_id=trusted_circle_shares.program_id and c.collaboration_enabled
          and (case when ro.professional_role then c.professional_support_roles_enabled else c.family_roles_enabled end)
          and (case trusted_circle_shares.scope_key
                 when 'shared_tasks' then c.shared_tasks_enabled
                 when 'shared_appointments' then c.shared_appointments_enabled
               end)
      ))
  )
);

revoke all on function public.guard_trusted_circle_share_insert() from public,anon,authenticated;
grant execute on function public.guard_trusted_circle_share_insert() to service_role;

do $verify$
begin
  if has_function_privilege('anon','public.guard_trusted_circle_share_insert()','EXECUTE') then
    raise exception 'Anonymous share-guard execution remains';
  end if;
  if not exists(select 1 from pg_policies where schemaname='public'
    and tablename='trusted_circle_shares' and policyname='circle_share_recipient_read'
    and qual like '%shared_tasks%' and qual like '%shared_appointments%') then
    raise exception 'Release scope recipient policy missing';
  end if;
end $verify$;
