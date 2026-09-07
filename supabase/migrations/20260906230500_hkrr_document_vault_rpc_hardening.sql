-- Canonical hkrr: the Document Vault summary is a signed-in user feature.
-- File uploads remain intentionally disabled; this only removes anonymous RPC execution.

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

revoke all on function public.get_my_document_vault_summary() from public,anon,authenticated;
grant execute on function public.get_my_document_vault_summary() to authenticated,service_role;

do $verify$
begin
  if has_function_privilege('anon','public.get_my_document_vault_summary()','EXECUTE') then
    raise exception 'Anonymous Document Vault summary execution remains';
  end if;
  if not has_function_privilege('authenticated','public.get_my_document_vault_summary()','EXECUTE') then
    raise exception 'Authenticated Document Vault summary execution missing';
  end if;
end $verify$;
