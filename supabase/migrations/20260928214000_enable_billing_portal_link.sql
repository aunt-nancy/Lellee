begin;

insert into public.app_public_settings(key, value, updated_at)
values (
  'billing_portal_link',
  'https://billing.stripe.com/p/login/8x27sLcQe89oa4H3MI0Fi00',
  now()
)
on conflict (key) do update
set value = excluded.value,
    updated_at = excluded.updated_at;

commit;
