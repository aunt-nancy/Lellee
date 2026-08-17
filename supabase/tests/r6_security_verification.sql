-- LELLEE R6 SECURITY VERIFICATION
-- Run in a non-production test context using two test users.

-- 1) Confirm agents default disabled.
select agent_key, is_enabled
from public.agent_registry
order by agent_key;

-- 2) Confirm capabilities default denied unless explicitly enabled.
select agent_key, capability, is_allowed
from public.agent_capability_grants
order by agent_key, capability;

-- 3) Review consent state.
select user_id, agent_key, capability, is_granted, granted_at, revoked_at
from public.user_agent_consents
order by updated_at desc;

-- 4) Review audit activity.
select user_id, agent_key, capability, outcome, created_at, metadata
from public.agent_access_audit
order by created_at desc
limit 100;

-- 5) Cross-user RLS verification must be performed with two authenticated
-- user sessions. User A must receive zero User B private rows.
-- Do NOT perform the cross-user check with the service-role client because
-- service-role bypasses RLS by design.