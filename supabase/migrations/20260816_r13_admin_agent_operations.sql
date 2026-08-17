-- LELLEE R13 — ADMIN AGENT OPERATIONS
-- Admin-only control plane for agent enablement, capabilities, kill switches,
-- audit monitoring, and security alerts.
--
-- IMPORTANT:
-- 1) Do not grant admin status from browser code.
-- 2) Bootstrap the first admin only through a trusted server/service-role process.
-- 3) Ordinary users must never receive SELECT/UPDATE rights on these admin tables.

create table if not exists public.agent_admin_operators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_global_controls (
  control_key text primary key,
  bool_value boolean not null default false,
  updated_by uuid null references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.agent_global_controls(control_key, bool_value)
values ('emergency_stop', false)
on conflict (control_key) do nothing;

create table if not exists public.agent_admin_action_audit (
  id bigint generated always as identity primary key,
  admin_user_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  target_agent text null,
  target_capability text null,
  old_value jsonb null,
  new_value jsonb null,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_security_alerts (
  id bigint generated always as identity primary key,
  severity text not null check (severity in ('info','warning','critical')),
  alert_type text not null,
  agent_key text null,
  user_id uuid null references auth.users(id) on delete set null,
  summary text not null,
  details jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open','acknowledged','resolved')),
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz null,
  resolved_at timestamptz null
);

alter table public.agent_admin_operators enable row level security;
alter table public.agent_global_controls enable row level security;
alter table public.agent_admin_action_audit enable row level security;
alter table public.agent_security_alerts enable row level security;

-- No user-facing RLS policies are created for these tables.
-- Access should occur through admin-only server/Edge Function code.

revoke all on table public.agent_admin_operators from anon, authenticated;
revoke all on table public.agent_global_controls from anon, authenticated;
revoke all on table public.agent_admin_action_audit from anon, authenticated;
revoke all on table public.agent_security_alerts from anon, authenticated;

create index if not exists agent_security_alerts_status_created_idx
  on public.agent_security_alerts(status, created_at desc);

create index if not exists agent_security_alerts_agent_created_idx
  on public.agent_security_alerts(agent_key, created_at desc);

create index if not exists agent_admin_action_audit_created_idx
  on public.agent_admin_action_audit(created_at desc);

-- Helper function used only by server-side admin code.
create or replace function public.is_agent_admin(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.agent_admin_operators
    where user_id = p_user_id
      and is_active = true
  );
$$;

revoke all on function public.is_agent_admin(uuid) from public;
grant execute on function public.is_agent_admin(uuid) to service_role;

-- Global stop state helper for server-side enforcement.
create or replace function public.is_agent_emergency_stop_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select bool_value
     from public.agent_global_controls
     where control_key = 'emergency_stop'),
    false
  );
$$;

revoke all on function public.is_agent_emergency_stop_active() from public;
grant execute on function public.is_agent_emergency_stop_active() to service_role;