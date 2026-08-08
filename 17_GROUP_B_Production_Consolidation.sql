-- LELLEE BIG BUILD B — PRODUCTION + LAUNCH CONSOLIDATION
-- Safe production hardening layer after Build A.
-- This does not by itself certify legal/regulatory compliance.
begin;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end $$;

-- Keep user_consents as an append-only consent history table.
create table if not exists public.user_consents(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 consent_type text not null,
 consent_version text not null,
 granted boolean not null,
 recorded_at timestamptz not null default now(),
 revoked_at timestamptz,
 metadata jsonb not null default '{}'::jsonb
);

-- Current privacy choices live separately, resolving the older schema conflict.
create table if not exists public.privacy_preferences(
 user_id uuid primary key references auth.users(id) on delete cascade,
 terms_acknowledged boolean not null default false,
 privacy_acknowledged boolean not null default false,
 personalization_allowed boolean not null default true,
 acknowledged_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

-- Recovery date changes preserve history.
create table if not exists public.recovery_date_history(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 previous_date date,
 new_date date not null,
 note text,
 changed_at timestamptz not null default now()
);

-- Account deletion is intentionally a request workflow; destructive deletion remains server/admin controlled.
create table if not exists public.account_deletion_requests(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 email text,
 reason text,
 status text not null default 'requested'
   check(status in('requested','reviewing','approved','completed','cancelled')),
 requested_at timestamptz not null default now(),
 processed_at timestamptz
);

-- Notifications.
create table if not exists public.notification_preferences(
 user_id uuid primary key references auth.users(id) on delete cascade,
 daily_enabled boolean not null default true,
 daily_time time not null default '09:00',
 meeting_enabled boolean not null default true,
 meeting_minutes_before integer not null default 30,
 milestone_enabled boolean not null default true,
 weekly_enabled boolean not null default true,
 weekly_day integer not null default 0,
 weekly_time time not null default '19:00',
 quiet_start time not null default '21:00',
 quiet_end time not null default '08:00',
 browser_notifications boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.reminders(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 reminder_key text not null,
 reminder_type text not null,
 title text not null,
 message text,
 due_at timestamptz not null,
 status text not null default 'pending',
 source_type text,
 source_id uuid,
 delivered_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(user_id,reminder_key)
);

create table if not exists public.app_public_settings(
 key text primary key,
 value text not null,
 updated_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions(
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
alter table public.push_subscriptions add column if not exists enabled boolean not null default true;

-- Schema compatibility.
alter table if exists public.support_contacts add column if not exists contact_name text;
alter table if exists public.support_contacts add column if not exists relationship_label text;
alter table if exists public.support_contacts add column if not exists preferred_method text;
alter table if exists public.support_contacts add column if not exists is_primary boolean not null default false;

create index if not exists idx_account_deletion_user on public.account_deletion_requests(user_id,requested_at desc);
create index if not exists idx_recovery_date_history_user on public.recovery_date_history(user_id,changed_at desc);
create index if not exists idx_push_subscriptions_user_enabled on public.push_subscriptions(user_id,enabled);
create index if not exists idx_reminders_user_status_due on public.reminders(user_id,status,due_at);

-- RLS
alter table public.user_consents enable row level security;
alter table public.privacy_preferences enable row level security;
alter table public.recovery_date_history enable row level security;
alter table public.account_deletion_requests enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.reminders enable row level security;
alter table public.app_public_settings enable row level security;
alter table public.push_subscriptions enable row level security;

drop policy if exists "user_consents_own" on public.user_consents;
create policy "user_consents_own" on public.user_consents
for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);

drop policy if exists "privacy_preferences_own" on public.privacy_preferences;
create policy "privacy_preferences_own" on public.privacy_preferences
for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);

drop policy if exists "recovery_date_history_own" on public.recovery_date_history;
create policy "recovery_date_history_own" on public.recovery_date_history
for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);

drop policy if exists "account_deletion_requests_select_own" on public.account_deletion_requests;
create policy "account_deletion_requests_select_own" on public.account_deletion_requests
for select to authenticated using((select auth.uid())=user_id);
drop policy if exists "account_deletion_requests_insert_own" on public.account_deletion_requests;
create policy "account_deletion_requests_insert_own" on public.account_deletion_requests
for insert to authenticated with check((select auth.uid())=user_id);

drop policy if exists "notification_preferences_own" on public.notification_preferences;
create policy "notification_preferences_own" on public.notification_preferences
for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);

drop policy if exists "reminders_own" on public.reminders;
create policy "reminders_own" on public.reminders
for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);

drop policy if exists "app_public_settings_read" on public.app_public_settings;
create policy "app_public_settings_read" on public.app_public_settings
for select to authenticated using(true);

drop policy if exists "push_subscriptions_own" on public.push_subscriptions;
create policy "push_subscriptions_own" on public.push_subscriptions
for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);

grant select,insert on public.user_consents to authenticated;
grant select,insert,update,delete on public.privacy_preferences,public.recovery_date_history,public.notification_preferences,public.reminders,public.push_subscriptions to authenticated;
grant select,insert on public.account_deletion_requests to authenticated;
grant select on public.app_public_settings to authenticated;

drop trigger if exists set_updated_at on public.privacy_preferences;
create trigger set_updated_at before update on public.privacy_preferences for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at on public.notification_preferences;
create trigger set_updated_at before update on public.notification_preferences for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at on public.reminders;
create trigger set_updated_at before update on public.reminders for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at on public.push_subscriptions;
create trigger set_updated_at before update on public.push_subscriptions for each row execute function public.set_updated_at();

insert into public.app_public_settings(key,value)
values('app_version','1.0.0-rc1')
on conflict(key) do update set value=excluded.value,updated_at=now();

commit;
