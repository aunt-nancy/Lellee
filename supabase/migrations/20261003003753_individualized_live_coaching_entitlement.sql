create or replace function public.has_lellee_entitlement(p_entitlement_key text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select case
    when p_entitlement_key = 'free' then auth.uid() is not null
    when p_entitlement_key = 'plus' then exists (
      select 1 from public.user_entitlements e
      where e.user_id = auth.uid()
        and e.status in ('active','trialing')
        and e.entitlement_key in ('plus','premium','live_coaching_425')
    )
    when p_entitlement_key = 'premium' then exists (
      select 1 from public.user_entitlements e
      where e.user_id = auth.uid()
        and e.status in ('active','trialing')
        and e.entitlement_key = 'premium'
    )
    when p_entitlement_key in ('journal_companion','coach','live_coaching_425') then exists (
      select 1 from public.user_entitlements e
      where e.user_id = auth.uid()
        and e.status in ('active','trialing')
        and e.entitlement_key = p_entitlement_key
    )
    else false
  end;
$$;

revoke all on function public.has_lellee_entitlement(text) from public, anon;
grant execute on function public.has_lellee_entitlement(text) to authenticated, service_role;

create or replace function public.get_my_journey_access_summary()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_uid uuid := auth.uid();
  v_plan text := 'free';
  v_plan_label text := 'Lellee Free';
  v_limit integer := 1;
  v_coach_addon boolean := false;
  v_live_coaching boolean := false;
  v_plan_rank integer := 0;
  v_plan_count integer := 0;
  v_beta_count integer := 0;
  v_total_count integer := 0;
  v_active jsonb := '[]'::jsonb;
  v_inactive jsonb := '[]'::jsonb;
begin
  if v_uid is null then
    return jsonb_build_object(
      'authenticated',false,'plan_key','free','plan_label','Lellee Free',
      'coach_addon',false,'individualized_live_coaching',false,
      'active_journey_limit',1,'active_journey_count',0,
      'beta_exempt_count',0,'total_active_journey_count',0,'remaining_slots',1,
      'at_limit',false,'over_limit',false,'journey_activity_controls',false,
      'active_journeys','[]'::jsonb,'inactive_journeys','[]'::jsonb,
      'recovery_inactive_guard',true
    );
  end if;

  select coalesce(max(case entitlement_key
    when 'premium' then 2
    when 'plus' then 1
    when 'live_coaching_425' then 1
    else 0 end),0)
  into v_plan_rank
  from public.user_entitlements
  where user_id=v_uid
    and entitlement_key in ('plus','premium','live_coaching_425')
    and status in ('active','trialing');

  select exists(
    select 1 from public.user_entitlements
    where user_id=v_uid
      and entitlement_key='live_coaching_425'
      and status in ('active','trialing')
  ) into v_live_coaching;

  if v_plan_rank=2 then
    v_plan := 'premium'; v_plan_label := 'Lellee Premium'; v_limit := 4;
  elsif v_plan_rank=1 then
    v_plan := 'plus';
    v_plan_label := case when v_live_coaching
      then 'Lellee Plus · Included with Individualized Live Coaching'
      else 'Lellee Plus' end;
    v_limit := 2;
  else
    v_plan := 'free'; v_plan_label := 'Lellee Free'; v_limit := 1;
  end if;

  if v_plan='premium' then
    select exists(
      select 1 from public.user_entitlements
      where user_id=v_uid and entitlement_key='coach' and status in ('active','trialing')
    ) into v_coach_addon;
    if v_coach_addon then
      v_limit := 6;
      v_plan_label := 'Lellee Premium + Lellee Coach';
    end if;
  end if;

  with enrolled as (
    select p.id as program_id,p.slug,p.name,p.display_order,pe.status,
      (coalesce(p.journey_config->>'wave','')='wave_1'
       and coalesce(p.journey_config->>'execution_status','')='controlled_beta_live') as beta_exempt
    from public.program_enrollments pe
    join public.programs p on p.id=pe.program_id
    where pe.user_id=v_uid and pe.status in ('active','paused')
  ), active_rows as (
    select *,case when beta_exempt then 'controlled_beta' else 'plan' end as access_type
    from enrolled where status='active'
  ), inactive_rows as (
    select * from enrolled where status='paused' and not beta_exempt
  )
  select
    count(*) filter (where not beta_exempt)::integer,
    count(*) filter (where beta_exempt)::integer,
    count(*)::integer,
    coalesce(jsonb_agg(jsonb_build_object(
      'program_id',program_id,'slug',slug,'name',name,'access_type',access_type,
      'can_make_inactive',(not beta_exempt and slug<>'recovery'),'slot_consuming',not beta_exempt,
      'plan_exempt',beta_exempt
    ) order by case when slug='recovery' then 0 else 1 end,display_order) filter (where program_id is not null),'[]'::jsonb),
    (select coalesce(jsonb_agg(jsonb_build_object(
      'program_id',program_id,'slug',slug,'name',name,'access_type','plan',
      'can_make_active',true,'slot_consuming',true
    ) order by case when slug='recovery' then 0 else 1 end,display_order),'[]'::jsonb) from inactive_rows)
  into v_plan_count,v_beta_count,v_total_count,v_active,v_inactive
  from active_rows;

  return jsonb_build_object(
    'authenticated',true,'plan_key',v_plan,'plan_label',v_plan_label,
    'coach_addon',v_coach_addon,'individualized_live_coaching',v_live_coaching,
    'active_journey_limit',v_limit,
    'active_journey_count',coalesce(v_plan_count,0),'beta_exempt_count',coalesce(v_beta_count,0),
    'total_active_journey_count',coalesce(v_total_count,0),
    'remaining_slots',greatest(v_limit-coalesce(v_plan_count,0),0),
    'at_limit',coalesce(v_plan_count,0)>=v_limit,'over_limit',coalesce(v_plan_count,0)>v_limit,
    'journey_activity_controls',true,'active_journeys',coalesce(v_active,'[]'::jsonb),
    'inactive_journeys',coalesce(v_inactive,'[]'::jsonb),'recovery_inactive_guard',true,
    'limit_rule','Wave 1 controlled-beta journeys do not consume commercial plan slots. Making a plan journey inactive preserves its setup, goals, progress and history.'
  );
end;
$$;

revoke all on function public.get_my_journey_access_summary() from public, anon;
grant execute on function public.get_my_journey_access_summary() to authenticated, service_role;
