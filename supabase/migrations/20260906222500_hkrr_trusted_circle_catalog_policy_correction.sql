-- Correct the temporary catalog-policy broadening introduced during rollback test diagnosis.
-- The original active/admin catalog read policies were already sufficient; the observed
-- supporter invisibility was caused by same-batch statement_timestamp vs clock_timestamp timing.
-- Preserve the narrower existing policies and remove the redundant using(true) policies.

do $check$
begin
  if not exists(
    select 1 from public.platform_environment_baseline
    where environment_key='supabase_project_ref'
      and expected_value='hkrrxscyhtxmbvxevfkw'
  ) then
    raise exception 'Wrong Lellee runtime project';
  end if;
end $check$;

drop policy if exists circle_roles_authenticated_read on public.trusted_circle_roles;
drop policy if exists circle_scopes_authenticated_read on public.trusted_circle_share_scopes;

do $verify$
begin
  if not exists(
    select 1 from pg_policies
    where schemaname='public' and tablename='trusted_circle_roles'
      and policyname='circle_roles_read' and cmd='SELECT'
      and qual like '%status%active%'
  ) then
    raise exception 'Narrow Trusted Circle role read policy is missing';
  end if;
  if not exists(
    select 1 from pg_policies
    where schemaname='public' and tablename='trusted_circle_share_scopes'
      and policyname='circle_scopes_read' and cmd='SELECT'
      and qual like '%status%active%'
  ) then
    raise exception 'Narrow Trusted Circle share-scope read policy is missing';
  end if;
end $verify$;
