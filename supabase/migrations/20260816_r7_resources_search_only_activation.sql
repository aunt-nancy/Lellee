-- LELLEE R7 — CONTROLLED AGENT ACTIVATION
-- Activate ONLY Resources Agent in SEARCH-ONLY mode.
-- All other agents/capabilities remain disabled.

begin;

update public.agent_registry
set is_enabled = false,
    updated_at = now();

update public.agent_capability_grants
set is_allowed = false;

update public.agent_registry
set is_enabled = true,
    updated_at = now()
where agent_key = 'resources';

update public.agent_capability_grants
set is_allowed = true
where agent_key = 'resources'
  and capability = 'resources.search';

-- Verify final state before commit.
-- Expected:
-- resources agent = enabled
-- resources.search = true
-- every other capability = false

commit;

select agent_key, is_enabled
from public.agent_registry
order by agent_key;

select agent_key, capability, is_allowed
from public.agent_capability_grants
order by agent_key, capability;