begin;

-- PostgreSQL grants EXECUTE on new functions to PUBLIC by default. Keep the
-- Wave 1 journey RPCs available only to signed-in Lellee users.
revoke all on function public.get_my_journey_access_summary() from public, anon;
revoke all on function public.can_activate_my_journey(uuid) from public, anon;
revoke all on function public.set_my_journey_active(uuid, boolean) from public, anon;
revoke all on function public.start_selected_support_path(text) from public, anon;

grant execute on function public.get_my_journey_access_summary() to authenticated;
grant execute on function public.can_activate_my_journey(uuid) to authenticated;
grant execute on function public.set_my_journey_active(uuid, boolean) to authenticated;
grant execute on function public.start_selected_support_path(text) to authenticated;

-- Cache auth.uid() once per statement instead of recalculating it per row.
drop policy if exists legal_acceptances_self_read on public.legal_acceptances;
create policy legal_acceptances_self_read on public.legal_acceptances
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists legal_acceptances_self_insert on public.legal_acceptances;
create policy legal_acceptances_self_insert on public.legal_acceptances
  for insert to authenticated
  with check (user_id = (select auth.uid()) and adult_confirmed);

drop policy if exists user_entitlements_self_read on public.user_entitlements;
create policy user_entitlements_self_read on public.user_entitlements
  for select to authenticated using (user_id = (select auth.uid()));

commit;
