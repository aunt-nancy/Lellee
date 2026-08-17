-- LELLEE R5 — SERVER-SIDE AGENT ENFORCEMENT
-- Default posture: deny. This does not enable any agent or capability.

create table if not exists public.user_agent_consents (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_key text not null references public.agent_registry(agent_key) on delete cascade,
  capability text not null,
  is_granted boolean not null default false,
  granted_at timestamptz null,
  revoked_at timestamptz null,
  updated_at timestamptz not null default now(),
  unique(user_id, agent_key, capability)
);

alter table public.user_agent_consents enable row level security;

drop policy if exists "users_read_own_agent_consents" on public.user_agent_consents;
create policy "users_read_own_agent_consents" on public.user_agent_consents
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "users_insert_own_agent_consents" on public.user_agent_consents;
create policy "users_insert_own_agent_consents" on public.user_agent_consents
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "users_update_own_agent_consents" on public.user_agent_consents;
create policy "users_update_own_agent_consents" on public.user_agent_consents
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

revoke all on table public.agent_registry from anon, authenticated;
revoke all on table public.agent_capability_grants from anon, authenticated;

drop policy if exists "users_read_own_agent_audit" on public.agent_access_audit;
create policy "users_read_own_agent_audit" on public.agent_access_audit
for select to authenticated using (auth.uid() = user_id);

create index if not exists user_agent_consents_lookup_idx
  on public.user_agent_consents(user_id, agent_key, capability);
create index if not exists agent_access_audit_user_created_idx
  on public.agent_access_audit(user_id, created_at desc);
