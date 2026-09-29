-- Tracks the live Supabase migration already applied.
-- Performance-only rewrite: direct auth.uid() calls are wrapped in SELECT.

alter policy coach_availability_business on public.coach_availability_rules
  using (is_coach_business_member(business_id))
  with check (is_coach_business_member(business_id) and user_id = (select auth.uid()));

alter policy coach_schedule_business on public.coach_schedule_events
  using (is_coach_business_member(business_id))
  with check (is_coach_business_member(business_id) and created_by = (select auth.uid()));

alter policy coach_crm_followups_business on public.crm_followups
  using (workspace_type = 'coach' and business_id is not null and is_coach_business_member(business_id))
  with check (workspace_type = 'coach' and business_id is not null and is_coach_business_member(business_id) and owner_user_id = (select auth.uid()));
