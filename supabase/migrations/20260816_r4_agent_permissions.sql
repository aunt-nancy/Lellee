-- LELLEE R4 AGENT PERMISSIONS
-- Staged migration. Review before production execution.
-- Default posture: deny.

create table if not exists public.agent_registry (
  id uuid primary key default gen_random_uuid(),
  agent_key text unique not null,
  display_name text not null,
  is_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_capability_grants (
  id uuid primary key default gen_random_uuid(),
  agent_key text not null references public.agent_registry(agent_key) on delete cascade,
  capability text not null,
  is_allowed boolean not null default false,
  created_at timestamptz not null default now(),
  unique(agent_key, capability)
);

create table if not exists public.agent_access_audit (
  id bigint generated always as identity primary key,
  user_id uuid null,
  agent_key text not null,
  capability text not null,
  outcome text not null check (outcome in ('allowed','denied')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.agent_registry enable row level security;
alter table public.agent_capability_grants enable row level security;
alter table public.agent_access_audit enable row level security;

-- No public/browser write policies are created here.
-- Server-side code must explicitly authorize agent actions and record audits.
-- Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.

insert into public.agent_registry (agent_key, display_name, is_enabled)
values
  ('housing','Housing Agent',false),
  ('resources','Resources Agent',false),
  ('coaching','Coaching Agent',false),
  ('reminders','Reminders Agent',false)
on conflict (agent_key) do update
set display_name = excluded.display_name;

insert into public.agent_capability_grants (agent_key, capability, is_allowed)
values
  ('housing','housing.search',false),
  ('housing','housing.save',false),
  ('housing','housing.preferences',false),
  ('resources','resources.search',false),
  ('resources','resources.save',false),
  ('resources','resources.preferences',false),
  ('coaching','coaching.schedule',false),
  ('coaching','coaching.shared_messages',false),
  ('coaching','coaching.shared_goals',false),
  ('reminders','reminders.read',false),
  ('reminders','reminders.create',false),
  ('reminders','reminders.update',false)
on conflict (agent_key, capability) do nothing;