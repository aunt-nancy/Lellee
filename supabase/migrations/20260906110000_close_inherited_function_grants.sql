-- Follow-up to 20260906_revoke_anon_security_definer.sql.
-- REVOKE FROM anon alone does not remove EXECUTE inherited from PUBLIC.
-- Scope: public-schema, application-owned SECURITY DEFINER functions only.
-- No business rows, authentication settings, frontend assets, or prices change.
-- Apply as one migration transaction. Every assertion failure rolls it back.

do $hardening$
declare
  r record;
begin
  -- Do not silently break an anonymous RLS policy that calls one of these helpers.
  if exists (
    select 1
    from pg_policy pol
    join pg_depend d on d.classid='pg_policy'::regclass and d.objid=pol.oid
      and d.refclassid='pg_proc'::regclass
    join pg_proc p on p.oid=d.refobjid
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.prosecdef
      and (0=any(pol.polroles) or
        (select oid from pg_roles where rolname='anon')=any(pol.polroles))
  ) then
    raise exception 'STOP: review anonymous policy/function dependencies first';
  end if;

  for r in
    select p.oid,
      format('%I.%I(%s)',n.nspname,p.proname,pg_get_function_identity_arguments(p.oid)) as signature,
      has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_before,
      has_function_privilege('service_role',p.oid,'EXECUTE') as service_before,
      md5(pg_get_functiondef(p.oid)) as definition_before
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.prosecdef and p.prokind='f'
      and has_function_privilege('anon',p.oid,'EXECUTE')
      and not exists (
        select 1 from pg_depend d where d.classid='pg_proc'::regclass
          and d.objid=p.oid and d.deptype='e'
      )
  loop
    execute format('revoke execute on function %s from public, anon',r.signature);
    if has_function_privilege('anon',r.oid,'EXECUTE') then
      raise exception 'STOP: anonymous EXECUTE still present on %',r.signature;
    end if;
    if has_function_privilege('authenticated',r.oid,'EXECUTE') is distinct from r.authenticated_before
      or has_function_privilege('service_role',r.oid,'EXECUTE') is distinct from r.service_before then
      raise exception 'STOP: legitimate execution grant changed on %',r.signature;
    end if;
    if md5(pg_get_functiondef(r.oid)) is distinct from r.definition_before then
      raise exception 'STOP: function implementation changed on %',r.signature;
    end if;
  end loop;

  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.prosecdef and p.prokind='f'
      and has_function_privilege('anon',p.oid,'EXECUTE')
  ) then
    raise exception 'STOP: remaining anonymous SECURITY DEFINER requires manual review';
  end if;
end
$hardening$;

-- Reviewed internal queue helper: accepts arbitrary subject/scope IDs and has
-- no caller authorization. No direct client or database-function callers were
-- found in the audited version. Keep it callable only by trusted server/owner roles.
-- Do not grant authenticated here merely to suppress a client error.
revoke execute on function public.enqueue_automation_event(text,uuid,text,uuid,text,jsonb)
  from public, anon, authenticated;

do $queue_check$
begin
  if has_function_privilege('authenticated','public.enqueue_automation_event(text,uuid,text,uuid,text,jsonb)','EXECUTE')
    or has_function_privilege('anon','public.enqueue_automation_event(text,uuid,text,uuid,text,jsonb)','EXECUTE')
    or not has_function_privilege('service_role','public.enqueue_automation_event(text,uuid,text,uuid,text,jsonb)','EXECUTE') then
    raise exception 'STOP: internal queue-helper permission assertion failed';
  end if;
end
$queue_check$;

-- Both reviewed utility bodies only assign NEW.updated_at = now().
-- Resolve built-in functions against pg_catalog; preserve their bodies/triggers.
alter function public.update_updated_at() set search_path=pg_catalog;
alter function public.set_updated_at() set search_path=pg_catalog;
