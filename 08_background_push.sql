-- LELLEE BACKGROUND PUSH SUPPORT
begin;

create table if not exists public.app_public_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user on public.push_subscriptions(user_id,enabled);

alter table public.app_public_settings enable row level security;
alter table public.push_subscriptions enable row level security;

drop policy if exists "app_public_settings_read" on public.app_public_settings;
create policy "app_public_settings_read" on public.app_public_settings
for select to authenticated
using (true);

drop policy if exists "push_subscriptions_own" on public.push_subscriptions;
create policy "push_subscriptions_own" on public.push_subscriptions
for all to authenticated
using ((select auth.uid())=user_id)
with check ((select auth.uid())=user_id);

grant select on public.app_public_settings to authenticated;
grant select,insert,update,delete on public.push_subscriptions to authenticated;

commit;
