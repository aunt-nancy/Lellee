-- Canonical hkrr security hardening for internal audit/coverage views.
-- Preserve authenticated/Admin access through the underlying RLS policies.
-- Remove anonymous direct view access and creator-permission execution.

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

alter view public.platform_dependency_status set (security_invoker=true);
alter view public.tap21_content_audit set (security_invoker=true);
alter view public.tap21_coverage_summary set (security_invoker=true);

revoke all on public.platform_dependency_status,public.tap21_content_audit,public.tap21_coverage_summary
  from public,anon,authenticated;
grant select on public.platform_dependency_status,public.tap21_content_audit,public.tap21_coverage_summary
  to authenticated,service_role;

do $verify$
declare v text;
begin
  foreach v in array array['platform_dependency_status','tap21_content_audit','tap21_coverage_summary'] loop
    if has_table_privilege('anon','public.'||v,'SELECT') then
      raise exception 'Anonymous audit-view SELECT remains: %',v;
    end if;
    if not has_table_privilege('authenticated','public.'||v,'SELECT') then
      raise exception 'Authenticated audit-view SELECT missing: %',v;
    end if;
    if not exists(
      select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname=v
        and exists(select 1 from unnest(coalesce(c.reloptions,'{}'::text[])) opt where opt='security_invoker=true')
    ) then
      raise exception 'security_invoker=true missing on %',v;
    end if;
  end loop;
end $verify$;
