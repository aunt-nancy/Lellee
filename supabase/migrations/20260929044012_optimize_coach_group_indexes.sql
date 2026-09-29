-- Tracks the live Supabase migration already applied.
-- Performance-only. No RLS or permission semantics are changed.

create index if not exists coach_assignment_recipients_group_id_idx on public.coach_assignment_recipients (group_id);
create index if not exists coach_assignment_recipients_relationship_id_idx on public.coach_assignment_recipients (relationship_id);
create index if not exists coach_group_announcements_group_id_idx on public.coach_group_announcements (group_id);
create index if not exists coach_group_announcements_sender_user_id_idx on public.coach_group_announcements (sender_user_id);
create index if not exists coach_group_members_relationship_id_idx on public.coach_group_members (relationship_id);
create index if not exists coach_groups_business_id_idx on public.coach_groups (business_id);
create index if not exists coach_groups_program_id_idx on public.coach_groups (program_id);
create index if not exists coach_groups_service_package_id_idx on public.coach_groups (service_package_id);
