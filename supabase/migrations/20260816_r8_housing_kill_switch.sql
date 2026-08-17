-- LELLEE R8 HOUSING AGENT KILL SWITCH
-- Immediately disables Housing Agent and all Housing capabilities.

begin;

update public.agent_registry
set is_enabled = false,
    updated_at = now()
where agent_key = 'housing';

update public.agent_capability_grants
set is_allowed = false
where agent_key = 'housing';

commit;