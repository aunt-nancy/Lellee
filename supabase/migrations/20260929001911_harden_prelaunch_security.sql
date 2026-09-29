-- Pre-launch security hardening for Lellee.
--
-- Trigger functions are invoked by PostgreSQL triggers, not directly through
-- the Data API. Removing direct client EXECUTE privileges reduces the exposed
-- SECURITY DEFINER surface without changing trigger behavior.

revoke execute on function public.apply_consultation_followup_rule() from public, anon, authenticated;
revoke execute on function public.apply_group_start_followup_rule() from public, anon, authenticated;
revoke execute on function public.apply_session_followup_rule() from public, anon, authenticated;
revoke execute on function public.audit_admin_change() from public, anon, authenticated;
revoke execute on function public.guard_program_activation() from public, anon, authenticated;
revoke execute on function public.handle_new_coach_business_owner() from public, anon, authenticated;
revoke execute on function public.handle_new_lellee_program_enrollment() from public, anon, authenticated;
revoke execute on function public.handle_new_organization_owner() from public, anon, authenticated;
revoke execute on function public.handle_new_user_privacy_mode() from public, anon, authenticated;
revoke execute on function public.lellee_org_cohort_automation_event_v1() from public, anon, authenticated;
revoke execute on function public.lellee_org_invite_automation_event_v1() from public, anon, authenticated;

-- pg_net is used by trusted server-side automation. Ordinary application
-- roles do not need direct access to its outbound HTTP functions.
revoke usage on schema net from public, anon, authenticated;
revoke execute on all functions in schema net from public, anon, authenticated;

grant usage on schema net to service_role;
grant execute on all functions in schema net to service_role;

alter default privileges for role postgres in schema net
  revoke execute on functions from public;
