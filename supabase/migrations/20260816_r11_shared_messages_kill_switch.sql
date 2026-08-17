-- LELLEE R11 — SHARED MESSAGE KILL SWITCH
-- Leaves Coaching scheduling/shared goals available but disables message access.

update public.agent_capability_grants
set is_allowed = false
where agent_key = 'coaching'
  and capability = 'coaching.shared_messages';