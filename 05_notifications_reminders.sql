-- LELLEE NOTIFICATIONS + REMINDERS
begin;

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_enabled boolean not null default true,
  daily_time time not null default '09:00',
  meeting_enabled boolean not null default true,
  meeting_minutes_before integer not null default 30 check (meeting_minutes_before between 0 and 1440),
  milestone_enabled boolean not null default true,
  weekly_enabled boolean not null default true,
  weekly_day integer not null default 0 check (weekly_day between 0 and 6),
  weekly_time time not null default '19:00',
  quiet_start time not null default '21:00',
  quiet_end time not null default '08:00',
  browser_notifications boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_key text not null,
  reminder_type text not null check (reminder_type in ('daily_recovery','meeting','milestone','weekly_reflection','goal','recovery_action','custom')),
  title text not null,
  message text,
  due_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','snoozed','delivered','completed','dismissed')),
  source_type text,
  source_id uuid,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, reminder_key)
);

create index if not exists idx_reminders_user_due on public.reminders(user_id,due_at);
create index if not exists idx_reminders_user_status on public.reminders(user_id,status,due_at);

alter table public.notification_preferences enable row level security;
alter table public.reminders enable row level security;

drop policy if exists "notification_preferences_own" on public.notification_preferences;
create policy "notification_preferences_own"
on public.notification_preferences for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "reminders_own" on public.reminders;
create policy "reminders_own"
on public.reminders for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

revoke all on public.notification_preferences, public.reminders from anon;
grant select,insert,update,delete on public.notification_preferences, public.reminders to authenticated;

drop trigger if exists set_updated_at on public.notification_preferences;
create trigger set_updated_at before update on public.notification_preferences
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.reminders;
create trigger set_updated_at before update on public.reminders
for each row execute function public.set_updated_at();

commit;
