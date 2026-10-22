-- Security hardening: no SECURITY DEFINER RPC in public schema should be callable by anon.
-- Authenticated and service-role grants are preserved. Token-based invite acceptance functions
-- already depend on auth.uid(), so requiring a signed-in session is consistent with their logic.

do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure::text as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and has_function_privilege('anon', p.oid, 'EXECUTE')
  loop
    execute format('revoke execute on function %s from anon', r.sig);
  end loop;
end
$$;
