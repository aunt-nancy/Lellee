-- Canonical hkrr Lellee runtime: allow signed-in Trusted Circle policy helpers to read
-- the non-private role and share-scope catalogs required for consent enforcement.
-- No user content, billing, pricing, journal, or Auth configuration changes.

do $check$
begin
  if not exists(
    select 1 from public.platform_environment_baseline
    where environment_key='supabase_project_ref'
      and expected_value='hkrrxscyhtxmbvxevfkw'
  ) then
    raise exception 'Wrong Lellee runtime project';
  end if;
  if to_regprocedure('public.respond_trusted_circle_relationship(uuid,text)') is null
     or to_regprocedure('public.circle_supporter_can_read(uuid,uuid,uuid,timestamptz,text)') is null then
    raise exception 'Trusted Circle prerequisite migrations are missing';
  end if;
end $check$;

alter table public.trusted_circle_roles enable row level security;
alter table public.trusted_circle_share_scopes enable row level security;

drop policy if exists circle_roles_authenticated_read on public.trusted_circle_roles;
create policy circle_roles_authenticated_read
  on public.trusted_circle_roles
  for select to authenticated
  using (true);

drop policy if exists circle_scopes_authenticated_read on public.trusted_circle_share_scopes;
create policy circle_scopes_authenticated_read
  on public.trusted_circle_share_scopes
  for select to authenticated
  using (true);

grant select on table public.trusted_circle_roles,public.trusted_circle_share_scopes to authenticated;

do $verify$
begin
  if not has_table_privilege('authenticated','public.trusted_circle_roles','SELECT')
     or not has_table_privilege('authenticated','public.trusted_circle_share_scopes','SELECT') then
    raise exception 'Authenticated Trusted Circle catalog SELECT grant is missing';
  end if;
  if not exists(
    select 1 from pg_policies
    where schemaname='public' and tablename='trusted_circle_roles'
      and policyname='circle_roles_authenticated_read' and cmd='SELECT'
  ) then
    raise exception 'Trusted Circle role read policy is missing';
  end if;
  if not exists(
    select 1 from pg_policies
    where schemaname='public' and tablename='trusted_circle_share_scopes'
      and policyname='circle_scopes_authenticated_read' and cmd='SELECT'
  ) then
    raise exception 'Trusted Circle share-scope read policy is missing';
  end if;
end $verify$;
