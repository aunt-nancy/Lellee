-- Tracks the live Supabase migration already applied.
-- Performance-only. No RLS or permission semantics are changed.

create index if not exists form_assignments_form_version_id_idx on public.form_assignments (form_version_id);
create index if not exists form_assignments_program_id_idx on public.form_assignments (program_id);
create index if not exists form_assignments_user_id_idx on public.form_assignments (user_id);
create index if not exists form_definitions_business_id_idx on public.form_definitions (business_id);
create index if not exists form_definitions_created_by_idx on public.form_definitions (created_by);
create index if not exists form_definitions_program_id_idx on public.form_definitions (program_id);
create index if not exists form_versions_created_by_idx on public.form_versions (created_by);
create index if not exists professional_credential_claims_business_id_idx on public.professional_credential_claims (business_id);
create index if not exists professional_credential_claims_user_id_idx on public.professional_credential_claims (user_id);
create index if not exists professional_credential_claims_verified_by_idx on public.professional_credential_claims (verified_by);
