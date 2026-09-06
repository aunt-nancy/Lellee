-- Current Lellee entitlement model.
-- Keeps legacy user_subscriptions untouched for migration compatibility.

create table if not exists public.user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entitlement_key text not null check (entitlement_key in ('plus','premium','journal_companion','coach')),
  status text not null default 'active' check (status in ('active','trialing','past_due','paused','cancelled','expired')),
  source text not null default 'stripe' check (source in ('stripe','admin','organization','promotion','legacy_migration')),
  billing_interval text check (billing_interval is null or billing_interval in ('monthly','annual','one_time')),
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entitlement_key)
);

create index if not exists user_entitlements_user_status_idx
  on public.user_entitlements(user_id,status);
create unique index if not exists user_entitlements_stripe_subscription_uidx
  on public.user_entitlements(stripe_subscription_id)
  where stripe_subscription_id is not null;

alter table public.user_entitlements enable row level security;
revoke all on table public.user_entitlements from anon;
revoke all on table public.user_entitlements from authenticated;
grant select on table public.user_entitlements to authenticated;

drop policy if exists user_entitlements_self_read on public.user_entitlements;
create policy user_entitlements_self_read
on public.user_entitlements
for select
to authenticated
using (user_id = auth.uid());

create or replace function public.has_lellee_entitlement(p_entitlement_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_entitlement_key = 'free' then auth.uid() is not null
    when p_entitlement_key = 'plus' then exists (
      select 1 from public.user_entitlements e
      where e.user_id = auth.uid()
        and e.status in ('active','trialing')
        and e.entitlement_key in ('plus','premium')
    )
    when p_entitlement_key = 'premium' then exists (
      select 1 from public.user_entitlements e
      where e.user_id = auth.uid()
        and e.status in ('active','trialing')
        and e.entitlement_key = 'premium'
    )
    when p_entitlement_key in ('journal_companion','coach') then exists (
      select 1 from public.user_entitlements e
      where e.user_id = auth.uid()
        and e.status in ('active','trialing')
        and e.entitlement_key = p_entitlement_key
    )
    else false
  end;
$$;

revoke all on function public.has_lellee_entitlement(text) from public;
revoke all on function public.has_lellee_entitlement(text) from anon;
grant execute on function public.has_lellee_entitlement(text) to authenticated;

comment on table public.user_entitlements is
  'Canonical current Lellee paid-access state. Free is implicit; Plus and Premium are tiers; Journal Companion and Coach are separate add-ons.';
comment on function public.has_lellee_entitlement(text) is
  'Checks current signed-in user entitlement. Premium includes Plus access; add-ons remain independently granted.';
