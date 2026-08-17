-- LELLEE R11 — ENABLE SHARED MESSAGES ONLY AFTER QA PASS

begin;

update public.agent_registry
set is_enabled = true,
    updated_at = now()
where agent_key = 'coaching';

update public.agent_capability_grants
set is_allowed = true
where agent_key = 'coaching'
  and capability = 'coaching.shared_messages';

commit;