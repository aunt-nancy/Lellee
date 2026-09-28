begin;

create table if not exists public.stripe_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  livemode boolean not null default false,
  object_id text,
  processing_status text not null default 'processing'
    check (processing_status in ('processing','processed','failed','ignored')),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text
);

alter table public.stripe_webhook_events enable row level security;
revoke all on public.stripe_webhook_events from anon, authenticated;

create table if not exists public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  terms_version text not null,
  privacy_version text not null,
  consumer_health_version text not null,
  safety_version text not null,
  adult_confirmed boolean not null default false,
  user_agent text,
  accepted_at timestamptz not null default now(),
  unique (user_id, terms_version, privacy_version, consumer_health_version, safety_version)
);

alter table public.legal_acceptances enable row level security;
drop policy if exists legal_acceptances_self_read on public.legal_acceptances;
create policy legal_acceptances_self_read on public.legal_acceptances
  for select to authenticated using (user_id = auth.uid());
drop policy if exists legal_acceptances_self_insert on public.legal_acceptances;
create policy legal_acceptances_self_insert on public.legal_acceptances
  for insert to authenticated with check (user_id = auth.uid() and adult_confirmed);

alter table public.user_entitlements
  drop constraint if exists user_entitlements_entitlement_key_check;
alter table public.user_entitlements
  add constraint user_entitlements_entitlement_key_check check (entitlement_key in (
    'plus','premium','journal_companion','coach',
    'coach_checkin','coaching_foundations',
    'specialty_recovery','specialty_reentry','specialty_housing_stability',
    'specialty_caregiving','specialty_grief_life_after_loss',
    'specialty_workforce_new_beginnings'
  ));

create or replace function public.get_stripe_webhook_signing_secret()
returns text
language sql
security definer
set search_path = vault, pg_catalog
stable
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'stripe_live_webhook_signing_secret'
  order by created_at desc
  limit 1;
$$;

revoke all on function public.get_stripe_webhook_signing_secret() from public, anon, authenticated;
grant execute on function public.get_stripe_webhook_signing_secret() to service_role;

create or replace function public.get_my_journey_access_summary()
returns jsonb
language sql
security definer
set search_path = public, pg_catalog
stable
as $$
  select jsonb_build_object(
    'active_journeys', coalesce(jsonb_agg(jsonb_build_object(
      'id', p.id,
      'slug', p.slug,
      'name', p.name,
      'status', pe.status,
      'is_primary', pe.is_primary,
      'plan_exempt', coalesce(p.journey_config->>'wave','') = 'wave_1'
    ) order by pe.is_primary desc, p.display_order) filter (where p.id is not null), '[]'::jsonb),
    'active_count', count(p.id),
    'wave_1_scope', 'coaching_only_controlled_beta'
  )
  from public.program_enrollments pe
  join public.programs p on p.id = pe.program_id
  where pe.user_id = auth.uid()
    and pe.status = 'active'
    and p.slug in ('recovery','caregiving','reentry','housing-stability','independent-living');
$$;

revoke all on function public.get_my_journey_access_summary() from public;
grant execute on function public.get_my_journey_access_summary() to authenticated;

create or replace function public.start_selected_support_path(p_topic_key text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_uid uuid := auth.uid();
  v_program public.programs%rowtype;
  v_has_primary boolean;
begin
  if v_uid is null then
    raise exception 'sign_in_required';
  end if;

  if p_topic_key not in ('recovery','caregiving','reentry','housing-stability','independent-living') then
    return jsonb_build_object('status','unsupported','program_slug',p_topic_key);
  end if;

  select * into v_program
  from public.programs
  where slug = p_topic_key and status in ('active','pilot');

  if not found then
    return jsonb_build_object('status','unavailable','program_slug',p_topic_key);
  end if;

  select exists(
    select 1 from public.program_enrollments
    where user_id = v_uid and is_primary and status = 'active'
  ) into v_has_primary;

  insert into public.program_enrollments(user_id, program_id, status, is_primary)
  values (v_uid, v_program.id, 'active', not v_has_primary)
  on conflict (user_id, program_id) do update
  set status = 'active';

  insert into public.user_program_state(user_id, active_program_id, updated_at)
  values (v_uid, v_program.id, now())
  on conflict (user_id) do update
  set active_program_id = excluded.active_program_id,
      updated_at = excluded.updated_at;

  return jsonb_build_object(
    'status','started',
    'program_id',v_program.id,
    'program_slug',v_program.slug,
    'program_name',v_program.name,
    'scope',case when v_program.slug = 'recovery' then 'recovery' else 'coaching_only_controlled_beta' end
  );
end;
$$;

revoke all on function public.start_selected_support_path(text) from public;
grant execute on function public.start_selected_support_path(text) to authenticated;

commit;
