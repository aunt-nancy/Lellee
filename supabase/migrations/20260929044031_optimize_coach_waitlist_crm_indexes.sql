-- Tracks the live Supabase migration already applied.
-- Performance-only. No RLS or permission semantics are changed.

create index if not exists coach_waitlist_group_id_idx on public.coach_waitlist (group_id);
create index if not exists coach_waitlist_program_id_idx on public.coach_waitlist (program_id);
create index if not exists coach_waitlist_service_package_id_idx on public.coach_waitlist (service_package_id);
create index if not exists coach_waitlist_user_id_idx on public.coach_waitlist (user_id);
create index if not exists crm_contact_history_actor_user_id_idx on public.crm_contact_history (actor_user_id);
create index if not exists crm_contact_history_business_id_idx on public.crm_contact_history (business_id);
create index if not exists crm_contact_history_related_user_id_idx on public.crm_contact_history (related_user_id);
