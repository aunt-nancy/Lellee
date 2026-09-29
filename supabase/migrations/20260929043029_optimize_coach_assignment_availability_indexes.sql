-- Tracks the live Supabase migration already applied.
-- Performance-only. No RLS or permission semantics are changed.

create index if not exists coach_assignments_business_id_idx on public.coach_assignments (business_id);
create index if not exists coach_assignments_coach_user_id_idx on public.coach_assignments (coach_user_id);
create index if not exists coach_assignments_program_id_idx on public.coach_assignments (program_id);
create index if not exists coach_availability_rules_business_id_idx on public.coach_availability_rules (business_id);
create index if not exists coach_availability_rules_user_id_idx on public.coach_availability_rules (user_id);
create index if not exists coach_business_members_user_id_idx on public.coach_business_members (user_id);
create index if not exists coach_business_programs_program_id_idx on public.coach_business_programs (program_id);
