-- Tracks the live Supabase migration already applied.
-- Performance-only rewrite: direct auth.uid() calls are wrapped in SELECT.

alter policy coach_certificates_read on public.coach_certificates
  using ((user_id = (select auth.uid())) or is_coach_business_member(business_id) or is_lellee_admin());

alter policy credential_events_owner_admin on public.credential_verification_events
  using (
    is_lellee_admin()
    or exists (
      select 1 from public.professional_credential_claims c
      where c.id = credential_verification_events.credential_claim_id
        and c.user_id = (select auth.uid())
    )
  );

alter policy coach_credentials_owner_business on public.professional_credential_claims
  using ((user_id = (select auth.uid())) and business_id is not null and is_coach_business_member(business_id))
  with check ((user_id = (select auth.uid())) and business_id is not null and is_coach_business_member(business_id));

alter policy lellee_org_form_assignments_v1 on public.form_assignments
  using ((user_id = (select auth.uid())) or (organization_id is not null and is_organization_member(organization_id)));

alter policy coach_form_assignments_business on public.form_assignments
  using ((business_id is not null and is_coach_business_member(business_id)) or (user_id = (select auth.uid())))
  with check ((business_id is not null and is_coach_business_member(business_id)) or ((user_id = (select auth.uid())) and assigned_scope = 'self'));
