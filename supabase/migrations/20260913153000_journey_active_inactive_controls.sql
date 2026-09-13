-- LELLEE JOURNEY ACTIVE / INACTIVE CONTROLS
-- Product rule: Free=1, Plus=2, Premium=4, Premium+Coach=6 active plan journeys.
-- Controlled-beta access is temporary test access and does not consume a commercial plan slot.
-- The legacy database status value `paused` is intentionally retained for compatibility;
-- member-facing language is `Inactive`.
-- Making a journey inactive never deletes setup, goals, progress, history, or other journey data.

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
  v_plan_count integer := 0;
  v_beta_count integer := 0;
  v_total_count integer := 0;
  v_active_journeys jsonb := '[]'::jsonb;
  v_inactive_journeys jsonb := '[]'::jsonb;
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
      'beta_exempt_count', 0,
      'total_active_journey_count', 0,
      'remaining_slots', 1,
      'at_limit', false,
      'over_limit', false,
      'journey_activity_controls', false,
      'active_journeys', '[]'::jsonb,
      'inactive_journeys', '[]'::jsonb
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

  with beta_ids as (
    select distinct b.program_id
    from public.get_my_wave1_beta_access() b
  ),
  plan_rows as (
    select distinct p.id as program_id,p.slug,p.name
    from public.program_enrollments pe
    join public.programs p on p.id=pe.program_id
    left join beta_ids b on b.program_id=pe.program_id
    where pe.user_id=v_uid
      and pe.status='active'
      and b.program_id is null
  ),
  beta_rows as (
    select distinct p.id as program_id,p.slug,p.name
    from beta_ids b
    join public.programs p on p.id=b.program_id
  ),
  active_rows as (
    select program_id,slug,name,'plan'::text as access_type,true as can_make_inactive,true as slot_consuming
    from plan_rows
    union all
    select program_id,slug,name,'controlled_beta'::text as access_type,false as can_make_inactive,false as slot_consuming
    from beta_rows
  ),
  inactive_rows as (
    select distinct p.id as program_id,p.slug,p.name
    from public.program_enrollments pe
    join public.programs p on p.id=pe.program_id
    left join beta_ids b on b.program_id=pe.program_id
    where pe.user_id=v_uid
      and pe.status='paused'
      and b.program_id is null
      and not exists (
        select 1 from public.program_enrollments pe2
        where pe2.user_id=v_uid
          and pe2.program_id=pe.program_id
          and pe2.status='active'
      )
  )
  select
    (select count(*)::integer from plan_rows),
    (select count(*)::integer from beta_rows),
    (select count(*)::integer from active_rows),
    (select coalesce(jsonb_agg(
      jsonb_build_object(
        'program_id',program_id,
        'slug',slug,
        'name',name,
        'access_type',access_type,
        'can_make_inactive',can_make_inactive,
        'slot_consuming',slot_consuming
      ) order by case when slug='recovery' then 0 else 1 end,name
    ),'[]'::jsonb) from active_rows),
    (select coalesce(jsonb_agg(
      jsonb_build_object(
        'program_id',program_id,
        'slug',slug,
        'name',name,
        'access_type','plan',
        'can_make_active',true,
        'slot_consuming',true
      ) order by case when slug='recovery' then 0 else 1 end,name
    ),'[]'::jsonb) from inactive_rows)
  into v_plan_count,v_beta_count,v_total_count,v_active_journeys,v_inactive_journeys;

  v_remaining := greatest(v_limit-v_plan_count,0);

  return jsonb_build_object(
    'authenticated', true,
    'plan_key', v_plan,
    'plan_label', v_plan_label,
    'coach_addon', v_coach_addon,
    'active_journey_limit', v_limit,
    'active_journey_count', v_plan_count,
    'beta_exempt_count', v_beta_count,
    'total_active_journey_count', v_total_count,
    'remaining_slots', v_remaining,
    'at_limit', v_plan_count >= v_limit,
    'over_limit', v_plan_count > v_limit,
    'journey_activity_controls', true,
    'active_journeys', v_active_journeys,
    'inactive_journeys', v_inactive_journeys,
    'limit_rule', 'Controlled-beta journeys do not consume commercial plan slots. Making a plan journey inactive preserves its setup, goals, progress and history.'
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
  v_program_name text;
  v_program_slug text;
  v_beta boolean := false;
  v_active_enrollment boolean := false;
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
    select 1 from public.get_my_wave1_beta_access() b
    where b.program_id=p_program_id
  ) into v_beta;

  select exists(
    select 1 from public.program_enrollments pe
    where pe.user_id=v_uid
      and pe.program_id=p_program_id
      and pe.status='active'
  ) into v_active_enrollment;

  v_summary := public.get_my_journey_access_summary();

  if v_beta then
    v_allowed := true;
  elsif v_active_enrollment then
    v_allowed := true;
  else
    v_allowed := coalesce((v_summary->>'active_journey_count')::integer,0)
      < coalesce((v_summary->>'active_journey_limit')::integer,1);
  end if;

  return jsonb_build_object(
    'allowed',v_allowed,
    'already_active',(v_beta or v_active_enrollment),
    'plan_exempt',v_beta,
    'reason',case
      when v_beta then 'controlled_beta_exempt'
      when v_active_enrollment then 'already_active'
      when v_allowed then 'slot_available'
      else 'plan_limit_reached'
    end,
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

create or replace function public.set_my_journey_active(p_program_id uuid,p_active boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_program_name text;
  v_program_slug text;
  v_beta boolean := false;
  v_enrollment_id uuid;
  v_status text;
  v_gate jsonb;
  v_summary jsonb;
begin
  if v_uid is null then
    return jsonb_build_object('success',false,'changed',false,'reason','sign_in_required');
  end if;

  select p.name,p.slug into v_program_name,v_program_slug
  from public.programs p where p.id=p_program_id;
  if not found then
    return jsonb_build_object('success',false,'changed',false,'reason','program_not_found');
  end if;

  select exists(
    select 1 from public.get_my_wave1_beta_access() b
    where b.program_id=p_program_id
  ) into v_beta;

  -- Controlled-beta membership is administered by the beta program, not by a
  -- commercial plan-slot toggle. It is plan-exempt and is never changed here.
  if v_beta then
    return jsonb_build_object(
      'success',false,
      'changed',false,
      'reason','controlled_beta_managed',
      'plan_exempt',true,
      'program_id',p_program_id,
      'program_slug',v_program_slug,
      'program_name',v_program_name,
      'summary',public.get_my_journey_access_summary()
    );
  end if;

  select pe.id,pe.status
    into v_enrollment_id,v_status
  from public.program_enrollments pe
  where pe.user_id=v_uid
    and pe.program_id=p_program_id
  order by case when pe.status='active' then 0 when pe.status='paused' then 1 else 2 end,
           pe.enrolled_at desc nulls last
  limit 1;

  if v_enrollment_id is null then
    return jsonb_build_object(
      'success',false,'changed',false,'reason','not_enrolled',
      'program_id',p_program_id,'program_slug',v_program_slug,'program_name',v_program_name,
      'summary',public.get_my_journey_access_summary()
    );
  end if;

  if p_active then
    if v_status='active' then
      return jsonb_build_object(
        'success',true,'changed',false,'reason','already_active',
        'program_id',p_program_id,'program_slug',v_program_slug,'program_name',v_program_name,
        'summary',public.get_my_journey_access_summary()
      );
    end if;

    if v_status<>'paused' then
      return jsonb_build_object(
        'success',false,'changed',false,'reason','status_not_reactivatable',
        'program_id',p_program_id,'program_slug',v_program_slug,'program_name',v_program_name,
        'summary',public.get_my_journey_access_summary()
      );
    end if;

    v_gate := public.can_activate_my_journey(p_program_id);
    if not coalesce((v_gate->>'allowed')::boolean,false) then
      return jsonb_build_object(
        'success',false,'changed',false,'reason','plan_limit_reached',
        'program_id',p_program_id,'program_slug',v_program_slug,'program_name',v_program_name,
        'gate',v_gate,'summary',public.get_my_journey_access_summary()
      );
    end if;

    update public.program_enrollments
    set status='active'
    where id=v_enrollment_id and user_id=v_uid;

    v_summary := public.get_my_journey_access_summary();
    return jsonb_build_object(
      'success',true,'changed',true,'reason','activated',
      'program_id',p_program_id,'program_slug',v_program_slug,'program_name',v_program_name,
      'summary',v_summary
    );
  end if;

  if v_status='paused' then
    return jsonb_build_object(
      'success',true,'changed',false,'reason','already_inactive',
      'program_id',p_program_id,'program_slug',v_program_slug,'program_name',v_program_name,
      'summary',public.get_my_journey_access_summary()
    );
  end if;

  if v_status<>'active' then
    return jsonb_build_object(
      'success',false,'changed',false,'reason','status_not_deactivatable',
      'program_id',p_program_id,'program_slug',v_program_slug,'program_name',v_program_name,
      'summary',public.get_my_journey_access_summary()
    );
  end if;

  update public.program_enrollments
  set status='paused',is_primary=false
  where id=v_enrollment_id and user_id=v_uid;

  -- user_program_state is intentionally not rewritten here. It is view context,
  -- not ownership of journey data, and the next journey navigation will set a
  -- valid context without deleting or moving any member content.
  v_summary := public.get_my_journey_access_summary();
  return jsonb_build_object(
    'success',true,'changed',true,'reason','made_inactive',
    'program_id',p_program_id,'program_slug',v_program_slug,'program_name',v_program_name,
    'summary',v_summary
  );
end;
$$;

revoke all on function public.set_my_journey_active(uuid,boolean) from public;
grant execute on function public.set_my_journey_active(uuid,boolean) to authenticated;

comment on function public.get_my_journey_access_summary() is 'Returns commercial plan-slot usage plus controlled-beta exempt journeys and inactive saved journeys. Free=1, Plus=2, Premium=4, Premium+Coach=6.';
comment on function public.can_activate_my_journey(uuid) is 'Read-only plan gate. Controlled-beta access is exempt. A commercial journey requires an available active-journey slot unless already active.';
comment on function public.set_my_journey_active(uuid,boolean) is 'Member activity toggle for existing commercial journey enrollments. Uses legacy paused status internally for Inactive. Never deletes journey data and never changes controlled-beta membership.';
