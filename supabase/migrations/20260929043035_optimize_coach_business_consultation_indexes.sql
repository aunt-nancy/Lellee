-- Tracks the live Supabase migration applied on 2026-09-29 UTC.
-- Performance-only: indexes coaching business review and consultation foreign keys.
-- No RLS or permission semantics are changed.

create index if not exists coach_businesses_approved_by_idx
  on public.coach_businesses (approved_by);
create index if not exists coach_businesses_primary_program_id_idx
  on public.coach_businesses (primary_program_id);
create index if not exists coach_businesses_reviewed_by_idx
  on public.coach_businesses (reviewed_by);

create index if not exists coach_consultation_requests_business_id_idx
  on public.coach_consultation_requests (business_id);
create index if not exists coach_consultation_requests_user_id_idx
  on public.coach_consultation_requests (user_id);
create index if not exists coach_consultation_requests_program_id_idx
  on public.coach_consultation_requests (program_id);
create index if not exists coach_consultation_requests_service_package_id_idx
  on public.coach_consultation_requests (service_package_id);
