-- LELLEE R10 — COACHING AGENT LIMITED ACTIVATION
-- Enables scheduling + explicitly shared goals only.
-- Private coaching messages remain disabled.

begin;

-- Keep previously approved agents in their current modes.
update public.agent_registry
set is_enabled = true,
    updated_at = now()
where agent_key in ('resources','housing','reminders');

update public.agent_capability_grants
set is_allowed = (capability = 'resources.search')
where agent_key = 'resources';

update public.agent_capability_grants
set is_allowed = (capability = 'housing.search')
where agent_key = 'housing';

update public.agent_capability_grants
set is_allowed = capability in (
  'reminders.read',
  'reminders.create',
  'reminders.update'
)
where agent_key = 'reminders';

-- Enable Coaching Agent.
update public.agent_registry
set is_enabled = true,
    updated_at = now()
where agent_key = 'coaching';

-- Allow only scheduling and explicitly shared goals.
update public.agent_capability_grants
set is_allowed = capability in (
  'coaching.schedule',
  'coaching.shared_goals'
)
where agent_key = 'coaching';

-- Explicitly keep shared messages OFF.
update public.agent_capability_grants
set is_allowed = false
where agent_key = 'coaching'
  and capability = 'coaching.shared_messages';

commit;

select agent_key, is_enabled
from public.agent_registry
order by agent_key;

select agent_key, capability, is_allowed
from public.agent_capability_grants
order by agent_key, capability;