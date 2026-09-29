-- Tracks the live Supabase migration already applied.
-- Performance-only. No RLS or permission semantics are changed.

create index if not exists coach_invitations_accepted_by_idx on public.coach_invitations (accepted_by);
create index if not exists coach_invitations_business_id_idx on public.coach_invitations (business_id);
create index if not exists coach_invitations_program_id_idx on public.coach_invitations (program_id);
create index if not exists coach_leads_business_id_idx on public.coach_leads (business_id);
create index if not exists coach_leads_interested_service_id_idx on public.coach_leads (interested_service_id);
create index if not exists coach_service_packages_business_id_idx on public.coach_service_packages (business_id);
create index if not exists coach_service_packages_program_id_idx on public.coach_service_packages (program_id);
