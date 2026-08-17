-- LELLEE R11 — COACHING MESSAGE CONSENT LAYER
-- Adds explicit per-message/per-thread sharing records.
-- DOES NOT automatically enable coaching.shared_messages.

create table if not exists public.coaching_agent_message_shares (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  message_id text null,
  thread_id text null,
  is_granted boolean not null default false,
  granted_at timestamptz null,
  revoked_at timestamptz null,
  updated_at timestamptz not null default now(),
  check (message_id is not null or thread_id is not null)
);

create unique index if not exists coaching_agent_message_share_message_uq
  on public.coaching_agent_message_shares(user_id, message_id)
  where message_id is not null;

create unique index if not exists coaching_agent_message_share_thread_uq
  on public.coaching_agent_message_shares(user_id, thread_id)
  where thread_id is not null;

alter table public.coaching_agent_message_shares enable row level security;

drop policy if exists "users_read_own_coaching_message_shares"
on public.coaching_agent_message_shares;

create policy "users_read_own_coaching_message_shares"
on public.coaching_agent_message_shares
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users_insert_own_coaching_message_shares"
on public.coaching_agent_message_shares;

create policy "users_insert_own_coaching_message_shares"
on public.coaching_agent_message_shares
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users_update_own_coaching_message_shares"
on public.coaching_agent_message_shares;

create policy "users_update_own_coaching_message_shares"
on public.coaching_agent_message_shares
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Keep the capability OFF until R11 QA passes.
update public.agent_capability_grants
set is_allowed = false
where agent_key = 'coaching'
  and capability = 'coaching.shared_messages';