-- LELLEE PRODUCTION READINESS: CONSENT + RECOVERY DATE HISTORY
begin;

create table if not exists public.user_consents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  support_tool_ack boolean not null default false,
  privacy_ack boolean not null default false,
  personalization_allowed boolean not null default true,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recovery_date_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  previous_date date,
  new_date date not null,
  note text,
  changed_at timestamptz not null default now()
);

alter table public.user_consents enable row level security;
alter table public.recovery_date_history enable row level security;

drop policy if exists "user_consents_own" on public.user_consents;
create policy "user_consents_own" on public.user_consents for all to authenticated
using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

drop policy if exists "recovery_date_history_own" on public.recovery_date_history;
create policy "recovery_date_history_own" on public.recovery_date_history for all to authenticated
using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

grant select,insert,update,delete on public.user_consents,public.recovery_date_history to authenticated;

drop trigger if exists set_updated_at on public.user_consents;
create trigger set_updated_at before update on public.user_consents
for each row execute function public.set_updated_at();

commit;
