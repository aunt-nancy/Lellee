-- Tracks the live Supabase migration already applied.
-- Performance-only rewrite: direct auth.uid() calls are wrapped in SELECT.
-- Existing roles, actions, access conditions, and checks are preserved.

alter policy coach_business_owner_readwrite on public.coach_businesses
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

alter policy coach_members_business_read on public.coach_business_members
  using ((user_id = (select auth.uid())) or is_coach_business_member(business_id));

alter policy coach_relationship_participants on public.coach_client_relationships
  using ((client_user_id = (select auth.uid())) or is_coach_business_member(business_id));

alter policy consultation_user_insert on public.coach_consultation_requests
  with check (user_id = (select auth.uid()));

alter policy consultation_user_read on public.coach_consultation_requests
  using ((user_id = (select auth.uid())) or is_coach_business_member(business_id));

alter policy waitlist_user_insert on public.coach_waitlist
  with check (user_id = (select auth.uid()));

alter policy waitlist_participants_read on public.coach_waitlist
  using ((user_id = (select auth.uid())) or is_coach_business_member(business_id));

alter policy training_records_own on public.training_records
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
