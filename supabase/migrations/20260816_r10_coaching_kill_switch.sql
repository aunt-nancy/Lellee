-- LELLEE R10 COACHING AGENT KILL SWITCH

begin;

update public.agent_registry
set is_enabled = false,
    updated_at = now()
where agent_key = 'coaching';

update public.agent_capability_grants
set is_allowed = false
where agent_key = 'coaching';

commit;