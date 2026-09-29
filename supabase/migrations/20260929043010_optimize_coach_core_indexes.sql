-- Tracks the live Supabase migration applied on 2026-09-29 UTC.
-- Performance-only: indexes foreign-key columns used by coaching/certification workflows.
-- No RLS or permission semantics are changed.

create index if not exists coach_messages_business_id_idx
  on public.coach_messages (business_id);
create index if not exists coach_messages_relationship_id_idx
  on public.coach_messages (relationship_id);
create index if not exists coach_messages_group_id_idx
  on public.coach_messages (group_id);
create index if not exists coach_messages_sender_user_id_idx
  on public.coach_messages (sender_user_id);

create index if not exists coach_client_relationships_coach_user_id_idx
  on public.coach_client_relationships (coach_user_id);
create index if not exists coach_client_relationships_client_user_id_idx
  on public.coach_client_relationships (client_user_id);
create index if not exists coach_client_relationships_program_id_idx
  on public.coach_client_relationships (program_id);
create index if not exists coach_client_relationships_service_package_id_idx
  on public.coach_client_relationships (service_package_id);

create index if not exists coach_schedule_events_relationship_id_idx
  on public.coach_schedule_events (relationship_id);
create index if not exists coach_schedule_events_group_id_idx
  on public.coach_schedule_events (group_id);
create index if not exists coach_schedule_events_consultation_request_id_idx
  on public.coach_schedule_events (consultation_request_id);
create index if not exists coach_schedule_events_created_by_idx
  on public.coach_schedule_events (created_by);

create index if not exists coach_certificates_issued_by_idx
  on public.coach_certificates (issued_by);
create index if not exists coach_certificates_revoked_by_idx
  on public.coach_certificates (revoked_by);

create index if not exists training_records_user_id_idx
  on public.training_records (user_id);
create index if not exists credential_verification_events_credential_claim_id_idx
  on public.credential_verification_events (credential_claim_id);
create index if not exists credential_verification_events_verified_by_idx
  on public.credential_verification_events (verified_by);
