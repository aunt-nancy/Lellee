-- LELLEE R8 — HOUSING AGENT CONTROLLED ACTIVATION
-- Resources stays search-only.
-- Housing is enabled search-only.
-- Reminders and Coaching remain disabled.

begin;

-- Keep Resources enabled only for search.
update public.agent_registry
set is_enabled = true,
    updated_at = now()
where agent_key = 'resources';

update public.agent_capability_grants
set is_allowed = (capability = 'resources.search')
where agent_key = 'resources';

-- Enable Housing only for search.
update public.agent_registry
set is_enabled = true,
    updated_at = now()
where agent_key = 'housing';

update public.agent_capability_grants
set is_allowed = (capability = 'housing.search')
where agent_key = 'housing';

-- Explicitly keep Reminders and Coaching disabled.
update public.agent_registry
set is_enabled = false,
    updated_at = now()
where agent_key in ('reminders','coaching');

update public.agent_capability_grants
set is_allowed = false
where agent_key in ('reminders','coaching');

commit;

select agent_key, is_enabled
from public.agent_registry
order by agent_key;

select agent_key, capability, is_allowed
from public.agent_capability_grants
order by agent_key, capability;