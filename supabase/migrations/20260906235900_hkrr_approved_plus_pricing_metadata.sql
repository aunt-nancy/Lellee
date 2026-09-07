-- Canonical hkrr pricing checkpoint: restore the already-approved Lellee Plus price.
-- Lellee Plus: $5.99/month or $59.99/year.
-- This migration does NOT activate billing, Stripe, purchases, coach payouts, or subscriptions.

do $check$
begin
  if not exists(
    select 1 from public.platform_environment_baseline
    where environment_key='supabase_project_ref' and expected_value='hkrrxscyhtxmbvxevfkw'
  ) then raise exception 'Wrong Lellee runtime project'; end if;
  if coalesce((select value='true' from public.app_public_settings where key='billing_enabled'),false)
     or coalesce((select value='true' from public.app_public_settings where key='billing_activation'),false) then
    raise exception 'Billing is already active; stop and review before changing price metadata';
  end if;
end $check$;

insert into public.app_public_settings(key,value,updated_at) values
  ('plus_monthly_price','5.99',clock_timestamp()),
  ('plus_annual_price','59.99',clock_timestamp()),
  ('lellee_plus_price_status','approved',clock_timestamp())
on conflict(key) do update set value=excluded.value,updated_at=excluded.updated_at;

update public.lellee_plan_catalog
set monthly_price=5.99,updated_at=clock_timestamp()
where plan_key='plus';

update public.commerce_plans
set price_amount=5.99,
    metadata=jsonb_set(coalesce(metadata,'{}'::jsonb),'{annual_price}','59.99'::jsonb,true),
    active_for_purchase=false,
    updated_at=clock_timestamp()
where plan_key='plus';

do $verify$
begin
  if not exists(select 1 from public.app_public_settings where key='plus_monthly_price' and value='5.99')
     or not exists(select 1 from public.app_public_settings where key='plus_annual_price' and value='59.99')
     or not exists(select 1 from public.app_public_settings where key='lellee_plus_price_status' and value='approved') then
    raise exception 'Approved Plus settings were not restored';
  end if;
  if not exists(select 1 from public.lellee_plan_catalog where plan_key='plus' and monthly_price=5.99) then
    raise exception 'Plan catalog Plus monthly price was not restored';
  end if;
  if exists(select 1 from public.commerce_plans where plan_key='plus' and active_for_purchase) then
    raise exception 'Plus purchase was activated unexpectedly';
  end if;
  if exists(select 1 from public.app_public_settings where key in('billing_enabled','billing_activation') and value='true') then
    raise exception 'Billing was activated unexpectedly';
  end if;
end $verify$;
