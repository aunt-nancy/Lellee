begin;

create table if not exists public.professional_course_payment_setup (
  course_id uuid primary key references public.professional_courses(id) on delete cascade,
  setup_status text not null default 'needed'
    check (setup_status in ('needed','prepared','active','disabled','error')),
  setup_method text not null default 'connected_stripe_manual_until_wave2_api',
  currency text not null default 'usd',
  desired_price_cents integer not null check (desired_price_cents >= 0),
  stripe_product_id text,
  stripe_price_id text,
  stripe_payment_link_id text,
  stripe_payment_link_url text,
  prepared_by uuid references auth.users(id),
  prepared_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists professional_course_payment_setup_prepared_by_idx
  on public.professional_course_payment_setup(prepared_by);

alter table public.professional_course_payment_setup enable row level security;
revoke all on public.professional_course_payment_setup from anon;
grant select on public.professional_course_payment_setup to authenticated;

drop policy if exists professional_course_payment_setup_admin_read
on public.professional_course_payment_setup;
create policy professional_course_payment_setup_admin_read
on public.professional_course_payment_setup
for select to authenticated
using (public.is_lellee_admin());

create or replace function private.ensure_professional_course_payment_setup()
returns trigger
language plpgsql
security definer
set search_path=public,private,pg_catalog
as $$
begin
  if new.auto_generated then
    insert into public.professional_course_payment_setup(
      course_id,setup_status,setup_method,currency,desired_price_cents,notes
    )
    select
      new.course_id,'needed','connected_stripe_manual_until_wave2_api','usd',
      c.price_cents,
      'Prepare Stripe Product/Price/Payment Link through the connected Stripe admin workflow. Do not enable Lellee checkout until release gates are approved.'
    from public.professional_courses c
    where c.id=new.course_id
    on conflict(course_id) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function private.ensure_professional_course_payment_setup()
from public,anon,authenticated;

drop trigger if exists trg_professional_course_payment_setup_needed
on public.professional_journey_training_links;
create trigger trg_professional_course_payment_setup_needed
after insert or update of auto_generated,course_id
on public.professional_journey_training_links
for each row
execute function private.ensure_professional_course_payment_setup();

insert into public.professional_course_payment_setup(
  course_id,setup_status,setup_method,currency,desired_price_cents,
  stripe_product_id,stripe_price_id,stripe_payment_link_id,
  stripe_payment_link_url,prepared_at,notes
)
select
  c.id,'prepared','connected_stripe_manual_until_wave2_api','usd',7900,
  'prod_VMIPicbBiLwpa8',
  'price_1ULZoqDpLc9a3tUuEvaJkW7T',
  'plink_1ULZpFDpLc9a3tUuqWIwpT4S',
  'https://buy.stripe.com/bJe6oH9E2cpE7Wz2IE0Fi0e',
  now(),
  'Live Stripe product, one-time $79 price, and Payment Link prepared. Lellee checkout remains disabled until separate release action.'
from public.professional_courses c
where c.course_key='specialty_independent_living'
on conflict(course_id) do update
set setup_status='prepared',
    setup_method=excluded.setup_method,
    currency=excluded.currency,
    desired_price_cents=excluded.desired_price_cents,
    stripe_product_id=excluded.stripe_product_id,
    stripe_price_id=excluded.stripe_price_id,
    stripe_payment_link_id=excluded.stripe_payment_link_id,
    stripe_payment_link_url=excluded.stripe_payment_link_url,
    prepared_at=excluded.prepared_at,
    notes=excluded.notes,
    updated_at=now();

insert into public.app_public_settings(key,value,updated_at)
values(
  'specialty_independent_living_payment_link',
  'https://buy.stripe.com/bJe6oH9E2cpE7Wz2IE0Fi0e',
  now()
)
on conflict(key) do update
set value=excluded.value,updated_at=excluded.updated_at;

commit;