-- Tracks the live Supabase migration already applied.
-- Performance-only. No RLS or permission semantics are changed.

create index if not exists coach_sessions_business_id_idx on public.coach_sessions (business_id);
create index if not exists coach_sessions_coach_user_id_idx on public.coach_sessions (coach_user_id);
create index if not exists coach_sessions_group_id_idx on public.coach_sessions (group_id);
create index if not exists coach_sessions_relationship_id_idx on public.coach_sessions (relationship_id);
create index if not exists coach_shared_items_client_user_id_idx on public.coach_shared_items (client_user_id);
create index if not exists coach_shared_items_program_id_idx on public.coach_shared_items (program_id);
create index if not exists coach_shared_items_relationship_id_idx on public.coach_shared_items (relationship_id);
