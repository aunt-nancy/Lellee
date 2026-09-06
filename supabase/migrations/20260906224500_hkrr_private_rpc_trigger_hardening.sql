-- Canonical hkrr security hardening for older Admin/coaching/communications RPCs.
-- Preserve intentional public discovery functions and RLS helper execution.
-- No UI, pricing, billing activation, journal, or Auth configuration changes.

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

-- Signed-in/user/admin RPCs: remove the default PUBLIC/anon execution path.
revoke all on function public.admin_assign_staff_role(text,text) from public,anon,authenticated;
revoke all on function public.create_my_coach_referral_code(text,text) from public,anon,authenticated;
revoke all on function public.ensure_my_communication_defaults() from public,anon,authenticated;
revoke all on function public.get_admin_communications_summary() from public,anon,authenticated;
revoke all on function public.get_coach_business_analytics(uuid,integer) from public,anon,authenticated;
revoke all on function public.get_coach_credential_summary(uuid) from public,anon,authenticated;
revoke all on function public.get_coach_crm_summary(uuid) from public,anon,authenticated;
revoke all on function public.get_coach_quality_operations_summary() from public,anon,authenticated;
revoke all on function public.get_coach_revenue_summary(uuid) from public,anon,authenticated;
revoke all on function public.get_communications_operations_summary() from public,anon,authenticated;
revoke all on function public.get_lellee_admin_analytics(integer,uuid) from public,anon,authenticated;
revoke all on function public.get_my_coach_performance() from public,anon,authenticated;
revoke all on function public.get_my_communication_history() from public,anon,authenticated;
revoke all on function public.get_my_communication_preferences() from public,anon,authenticated;
revoke all on function public.get_my_organization_billing_summary() from public,anon,authenticated;
revoke all on function public.get_my_staff_work() from public,anon,authenticated;
revoke all on function public.get_staff_operations_summary() from public,anon,authenticated;
revoke all on function public.has_credential_review_access() from public,anon,authenticated;
revoke all on function public.refresh_coach_quality_snapshots(date,date) from public,anon,authenticated;
revoke all on function public.register_my_trusted_device(text) from public,anon,authenticated;
revoke all on function public.review_coach_public_profile(uuid,text,text,boolean) from public,anon,authenticated;
revoke all on function public.revoke_my_trusted_device(uuid) from public,anon,authenticated;
revoke all on function public.run_coach_quality_monitor(date,date) from public,anon,authenticated;
revoke all on function public.submit_coach_structured_feedback(uuid,integer,text[]) from public,anon,authenticated;
revoke all on function public.toggle_my_communication_channel(text) from public,anon,authenticated;
revoke all on function public.toggle_my_communication_topic(text) from public,anon,authenticated;

grant execute on function public.admin_assign_staff_role(text,text),
  public.create_my_coach_referral_code(text,text),
  public.ensure_my_communication_defaults(),
  public.get_admin_communications_summary(),
  public.get_coach_business_analytics(uuid,integer),
  public.get_coach_credential_summary(uuid),
  public.get_coach_crm_summary(uuid),
  public.get_coach_quality_operations_summary(),
  public.get_coach_revenue_summary(uuid),
  public.get_communications_operations_summary(),
  public.get_lellee_admin_analytics(integer,uuid),
  public.get_my_coach_performance(),
  public.get_my_communication_history(),
  public.get_my_communication_preferences(),
  public.get_my_organization_billing_summary(),
  public.get_my_staff_work(),
  public.get_staff_operations_summary(),
  public.has_credential_review_access(),
  public.refresh_coach_quality_snapshots(date,date),
  public.register_my_trusted_device(text),
  public.review_coach_public_profile(uuid,text,text,boolean),
  public.revoke_my_trusted_device(uuid),
  public.run_coach_quality_monitor(date,date),
  public.submit_coach_structured_feedback(uuid,integer,text[]),
  public.toggle_my_communication_channel(text),
  public.toggle_my_communication_topic(text)
  to authenticated,service_role;

-- Trigger-only functions do not need browser RPC execution privileges.
revoke all on function public.audit_admin_change() from public,anon,authenticated;
revoke all on function public.enforce_coach_documentation_session_identity() from public,anon,authenticated;
revoke all on function public.notify_coach_message() from public,anon,authenticated;
revoke all on function public.protect_coach_public_profile_review_fields() from public,anon,authenticated;
revoke all on function public.track_coach_response_metadata() from public,anon,authenticated;
grant execute on function public.audit_admin_change(),
  public.enforce_coach_documentation_session_identity(),
  public.notify_coach_message(),
  public.protect_coach_public_profile_review_fields(),
  public.track_coach_response_metadata()
  to service_role;

-- Advisor-flagged trigger helpers use only NEW/OLD and built-ins; pin an empty search path.
alter function public.set_updated_at() set search_path='';
alter function public.lellee_normalize_meeting() set search_path='';
alter function public.lellee_normalize_support_person() set search_path='';

do $verify$
declare sig text;
begin
  foreach sig in array array[
    'public.admin_assign_staff_role(text,text)',
    'public.create_my_coach_referral_code(text,text)',
    'public.ensure_my_communication_defaults()',
    'public.get_admin_communications_summary()',
    'public.get_coach_business_analytics(uuid,integer)',
    'public.get_coach_credential_summary(uuid)',
    'public.get_coach_crm_summary(uuid)',
    'public.get_coach_quality_operations_summary()',
    'public.get_coach_revenue_summary(uuid)',
    'public.get_communications_operations_summary()',
    'public.get_lellee_admin_analytics(integer,uuid)',
    'public.get_my_coach_performance()',
    'public.get_my_communication_history()',
    'public.get_my_communication_preferences()',
    'public.get_my_organization_billing_summary()',
    'public.get_my_staff_work()',
    'public.get_staff_operations_summary()',
    'public.has_credential_review_access()',
    'public.refresh_coach_quality_snapshots(date,date)',
    'public.register_my_trusted_device(text)',
    'public.review_coach_public_profile(uuid,text,text,boolean)',
    'public.revoke_my_trusted_device(uuid)',
    'public.run_coach_quality_monitor(date,date)',
    'public.submit_coach_structured_feedback(uuid,integer,text[])',
    'public.toggle_my_communication_channel(text)',
    'public.toggle_my_communication_topic(text)'
  ] loop
    if has_function_privilege('anon',sig,'EXECUTE') then
      raise exception 'Anonymous private RPC execution remains: %',sig;
    end if;
    if not has_function_privilege('authenticated',sig,'EXECUTE') then
      raise exception 'Authenticated private RPC execution missing: %',sig;
    end if;
  end loop;

  foreach sig in array array[
    'public.audit_admin_change()',
    'public.enforce_coach_documentation_session_identity()',
    'public.notify_coach_message()',
    'public.protect_coach_public_profile_review_fields()',
    'public.track_coach_response_metadata()'
  ] loop
    if has_function_privilege('anon',sig,'EXECUTE') or has_function_privilege('authenticated',sig,'EXECUTE') then
      raise exception 'Browser execution remains on trigger-only function: %',sig;
    end if;
  end loop;

  if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='set_updated_at' and p.proconfig @> array['search_path=']) then
    raise exception 'set_updated_at search_path was not pinned';
  end if;
  if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='lellee_normalize_meeting' and p.proconfig @> array['search_path=']) then
    raise exception 'lellee_normalize_meeting search_path was not pinned';
  end if;
  if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='lellee_normalize_support_person' and p.proconfig @> array['search_path=']) then
    raise exception 'lellee_normalize_support_person search_path was not pinned';
  end if;
end $verify$;
