-- LELLEE FINAL HARDENING: ACCOUNT DELETION REQUESTS
begin;

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  reason text,
  status text not null default 'requested' check (status in ('requested','reviewing','approved','completed','cancelled')),
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists idx_account_deletion_requests_user
on public.account_deletion_requests(user_id,requested_at desc);

alter table public.account_deletion_requests enable row level security;

drop policy if exists "account_deletion_requests_own" on public.account_deletion_requests;
create policy "account_deletion_requests_own"
on public.account_deletion_requests for select to authenticated
using ((select auth.uid())=user_id);

drop policy if exists "account_deletion_requests_insert_own" on public.account_deletion_requests;
create policy "account_deletion_requests_insert_own"
on public.account_deletion_requests for insert to authenticated
with check ((select auth.uid())=user_id);

grant select,insert on public.account_deletion_requests to authenticated;

commit;
