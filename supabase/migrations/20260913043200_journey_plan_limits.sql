create table if not exists public.lellee_journey_plan_limits (
  plan_key text primary key,
  display_name text not null,
  active_journey_limit integer not null check (active_journey_limit > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lellee_journey_plan_limits enable row level security;
revoke all on table public.lellee_journey_plan_limits from public, anon, authenticated;

insert into public.lellee_journey_plan_limits(plan_key,display_name,active_journey_limit,updated_at)
values
  ('free','Lellee Free',1,now()),
  ('plus','Lellee Plus',2,now()),
  ('premium','Lellee Premium',4,now())
on conflict (plan_key) do update
set display_name=excluded.display_name,
    active_journey_limit=excluded.active_journey_limit,
    updated_at=now();

create or replace function public.get_my_journey_access_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_plan text := 'free';
  v_plan_label text := 'Lellee Free';
  v_limit integer := 1;
  v_coach_addon boolean := false;
  v_count integer := 0;
  v_journeys jsonb := '[]'::jsonb;
  v_remaining integer := 0;
begin
  if v_uid is null then
    return jsonb_build_object(
      'authenticated', false,
      'plan_key', 'free',
      'plan_label', 'Lellee Free',
      'coach_addon', false,
      'active_journey_limit', 1,
      'active_journey_count', 0,
      'remaining_slots', 1,
      'at_limit', false,
      'over_limit', false,
      'active_journeys', '[]'::jsonb
    );
  end if;

  select x.tier into v_plan
  from (
    select um.tier::text as tier
    from public.user_memberships um
    where um.user_id = v_uid
      and um.status in ('active','trialing','free')
      and um.tier in ('free','plus','premium')
    union all
    select lm.service_tier::text as tier
    from public.lellee_memberships lm
    where lm.user_id = v_uid
      and lm.status in ('active','trialing')
      and lm.service_tier in ('free','plus','premium')
  ) x
  order by case x.tier when 'premium' then 3 when 'plus' then 2 else 1 end desc
  limit 1;

  v_plan := coalesce(v_plan,'free');

  select l.display_name,l.active_journey_limit
    into v_plan_label,v_limit
  from public.lellee_journey_plan_limits l
  where l.plan_key=v_plan;

  v_plan_label := coalesce(v_plan_label,'Lellee Free');
  v_limit := coalesce(v_limit,1);

  if v_plan='premium' then
    select exists(
      select 1
      from public.lellee_entitlements e
      where e.user_id=v_uid
        and e.entitlement_key in ('lellee_coach_addon','lellee_coach','coach_addon')
        and e.status in ('active','trialing')
        and (e.starts_at is null or e.starts_at <= now())
        and (e.ends_at is null or e.ends_at > now())
    ) into v_coach_addon;
  end if;

  if v_coach_addon then
    v_limit := 6;
    v_plan_label := 'Lellee Premium + Lellee Coach';
  end if;

  with active_ids as (
    select pe.program_id
    from public.program_enrollments pe
    where pe.user_id=v_uid and pe.status='active'
    union
    select c.program_id
    from public.pilot_cohort_members m
    join public.pilot_cohorts c on c.id=m.cohort_id
    join lateral (
      select r.*
      from public.pilot_readiness_reviews r
      where r.program_id=c.program_id
        and (r.cohort_id=c.id or r.cohort_id is null)
      order by (r.cohort_id=c.id) desc, r.created_at desc
      limit 1
    ) rr on true
    where m.user_id=v_uid
      and m.status='active'
      and c.status='active'
      and rr.content_ready
      and rr.safety_ready
      and rr.resources_ready
      and rr.accessibility_ready
      and rr.privacy_ready
      and rr.support_ready
      and rr.qa_ready
  ), rows as (
    select distinct p.id as program_id,p.slug,p.name
    from active_ids a
    join public.programs p on p.id=a.program_id
  )
  select count(*)::integer,
         coalesce(jsonb_agg(jsonb_build_object('program_id',program_id,'slug',slug,'name',name) order by case when slug='recovery' then 0 else 1 end,name),'[]'::jsonb)
    into v_count,v_journeys
  from rows;

  v_remaining := greatest(v_limit-v_count,0);

  return jsonb_build_object(
    'authenticated', true,
    'plan_key', v_plan,
    'plan_label', v_plan_label,
    'coach_addon', v_coach_addon,
    'active_journey_limit', v_limit,
    'active_journey_count', v_count,
    'remaining_slots', v_remaining,
    'at_limit', v_count >= v_limit,
    'over_limit', v_count > v_limit,
    'active_journeys', v_journeys,
    'limit_rule', 'Changing plans never deletes journey history. When an account is at or over its active-journey limit, existing journey work remains saved and another journey cannot be activated until a slot is available or the plan is upgraded.'
  );
end;
$$;

revoke all on function public.get_my_journey_access_summary() from public;
grant execute on function public.get_my_journey_access_summary() to authenticated;

create or replace function public.can_activate_my_journey(p_program_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_summary jsonb;
  v_exists boolean := false;
  v_program_name text;
  v_program_slug text;
  v_allowed boolean := false;
begin
  if v_uid is null then
    return jsonb_build_object('allowed',false,'reason','sign_in_required');
  end if;

  select p.name,p.slug into v_program_name,v_program_slug
  from public.programs p where p.id=p_program_id;
  if not found then
    return jsonb_build_object('allowed',false,'reason','program_not_found');
  end if;

  select exists(
    select 1 from public.program_enrollments pe
    where pe.user_id=v_uid and pe.program_id=p_program_id and pe.status='active'
    union all
    select 1
    from public.pilot_cohort_members m
    join public.pilot_cohorts c on c.id=m.cohort_id
    join lateral (
      select r.*
      from public.pilot_readiness_reviews r
      where r.program_id=c.program_id
        and (r.cohort_id=c.id or r.cohort_id is null)
      order by (r.cohort_id=c.id) desc, r.created_at desc
      limit 1
    ) rr on true
    where m.user_id=v_uid and m.status='active' and c.status='active'
      and c.program_id=p_program_id
      and rr.content_ready and rr.safety_ready and rr.resources_ready
      and rr.accessibility_ready and rr.privacy_ready and rr.support_ready and rr.qa_ready
  ) into v_exists;

  v_summary := public.get_my_journey_access_summary();
  v_allowed := v_exists or coalesce((v_summary->>'active_journey_count')::integer,0) < coalesce((v_summary->>'active_journey_limit')::integer,1);

  return jsonb_build_object(
    'allowed',v_allowed,
    'already_active',v_exists,
    'reason',case when v_exists then 'already_active' when v_allowed then 'slot_available' else 'plan_limit_reached' end,
    'program_id',p_program_id,
    'program_slug',v_program_slug,
    'program_name',v_program_name,
    'plan_key',v_summary->>'plan_key',
    'plan_label',v_summary->>'plan_label',
    'active_journey_limit',(v_summary->>'active_journey_limit')::integer,
    'active_journey_count',(v_summary->>'active_journey_count')::integer,
    'remaining_slots',(v_summary->>'remaining_slots')::integer
  );
end;
$$;

revoke all on function public.can_activate_my_journey(uuid) from public;
grant execute on function public.can_activate_my_journey(uuid) to authenticated;

comment on function public.get_my_journey_access_summary() is 'Returns the signed-in user active-journey allowance and current distinct active journeys. Free=1, Plus=2, Premium=4, Premium+Lellee Coach=6. Existing work is never deleted on downgrade.';
comment on function public.can_activate_my_journey(uuid) is 'Read-only journey activation gate. Reopening an already-active journey is always permitted; a new journey requires an available plan slot.';