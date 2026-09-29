-- Tracks the live Supabase migration already applied.
-- Performance-only. No RLS or permission semantics are changed.

create index if not exists crm_followups_consultation_request_id_idx on public.crm_followups (consultation_request_id);
create index if not exists crm_followups_lead_id_idx on public.crm_followups (lead_id);
create index if not exists crm_followups_owner_user_id_idx on public.crm_followups (owner_user_id);
create index if not exists crm_followups_related_user_id_idx on public.crm_followups (related_user_id);
create index if not exists form_assignments_assigned_by_idx on public.form_assignments (assigned_by);
create index if not exists form_assignments_business_id_idx on public.form_assignments (business_id);
create index if not exists form_assignments_form_id_idx on public.form_assignments (form_id);
