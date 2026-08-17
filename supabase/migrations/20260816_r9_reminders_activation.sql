-- LELLEE R9 — REMINDER AGENT CONTROLLED ACTIVATION
-- Resources and Housing remain search-only.
-- Reminders becomes user-approved read/create/update.
-- Coaching remains disabled.

begin;

-- Resources remains search-only.
update public.agent_registry
set is_enabled = true,
    updated_at = now()
where agent_key = 'resources';

update public.agent_capability_grants
set is_allowed = (capability = 'resources.search')
where agent_key = 'resources';

-- Housing remains search-only.
update public.agent_registry
set is_enabled = true,
    updated_at = now()
where agent_key = 'housing';

update public.agent_capability_grants
set is_allowed = (capability = 'housing.search')
where agent_key = 'housing';

-- Enable Reminders with only its approved capabilities.
update public.agent_registry
set is_enabled = true,
    updated_at = now()
where agent_key = 'reminders';

update public.agent_capability_grants
set is_allowed = capability in (
  'reminders.read',
  'reminders.create',
  'reminders.update'
)
where agent_key = 'reminders';

-- Coaching stays OFF.
update public.agent_registry
set is_enabled = false,
    updated_at = now()
where agent_key = 'coaching';

update public.agent_capability_grants
set is_allowed = false
where agent_key = 'coaching';

commit;

select agent_key, is_enabled
from public.agent_registry
order by agent_key;

select agent_key, capability, is_allowed
from public.agent_capability_grants
order by agent_key, capability;