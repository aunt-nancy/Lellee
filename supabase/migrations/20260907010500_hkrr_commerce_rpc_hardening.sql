-- Canonical hkrr launch hardening for commerce while billing/live checkout remain OFF.
-- Does not activate billing, Stripe, checkout, payouts, or payment collection.

do $check$
begin
  if not exists(select 1 from public.platform_environment_baseline where environment_key='supabase_project_ref' and expected_value='hkrrxscyhtxmbvxevfkw') then
    raise exception 'Wrong Lellee runtime project';
  end if;
end $check$;

-- User/member/ops functions are not anonymous endpoints.
revoke all on function public.create_commerce_request(text,uuid,integer,text) from public,anon,authenticated;
revoke all on function public.get_my_commerce_access() from public,anon,authenticated;
revoke all on function public.get_organization_commerce_summary(uuid) from public,anon,authenticated;
revoke all on function public.get_physical_commerce_summary() from public,anon,authenticated;
grant execute on function public.create_commerce_request(text,uuid,integer,text),
  public.get_my_commerce_access(),
  public.get_organization_commerce_summary(uuid),
  public.get_physical_commerce_summary()
  to authenticated,service_role;

-- Trigger-only auth bootstrap function should not be callable from REST.
revoke all on function public.handle_new_user_commerce_entitlements() from public,anon,authenticated;
grant execute on function public.handle_new_user_commerce_entitlements() to service_role;

-- Keep public.has_physical_commerce_access() unchanged because active RLS policies call it.

do $verify$
declare sig text;
begin
  foreach sig in array array[
    'public.create_commerce_request(text,uuid,integer,text)',
    'public.get_my_commerce_access()',
    'public.get_organization_commerce_summary(uuid)',
    'public.get_physical_commerce_summary()'
  ] loop
    if has_function_privilege('anon',sig,'EXECUTE') then raise exception 'Anonymous commerce RPC remains: %',sig; end if;
    if not has_function_privilege('authenticated',sig,'EXECUTE') then raise exception 'Authenticated commerce RPC grant missing: %',sig; end if;
  end loop;
  if has_function_privilege('anon','public.handle_new_user_commerce_entitlements()','EXECUTE')
     or has_function_privilege('authenticated','public.handle_new_user_commerce_entitlements()','EXECUTE') then
    raise exception 'Browser execution remains on commerce trigger helper';
  end if;
  if coalesce((select value from public.app_public_settings where key='billing_enabled'),'false')<>'false'
     or coalesce((select value from public.app_public_settings where key='commerce_live_checkout_enabled'),'false')<>'false' then
    raise exception 'Commerce hardening expected billing and live checkout to remain OFF';
  end if;
end $verify$;
