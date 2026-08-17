-- LELLEE R7 EMERGENCY KILL SWITCH
-- Immediately disables Resources Agent and all its capabilities.

begin;

update public.agent_registry
set is_enabled = false,
    updated_at = now()
where agent_key = 'resources';

update public.agent_capability_grants
set is_allowed = false
where agent_key = 'resources';

commit;