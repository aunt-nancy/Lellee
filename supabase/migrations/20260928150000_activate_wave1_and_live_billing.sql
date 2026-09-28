begin;

insert into public.app_public_settings(key,value,updated_at) values
  ('plus_payment_link_monthly','https://buy.stripe.com/8x27sLcQe89oa4H3MI0Fi00',now()),
  ('plus_payment_link_annual','https://buy.stripe.com/14AeVddUi1L06Svfvq0Fi01',now()),
  ('premium_payment_link_monthly','https://buy.stripe.com/dRm3cv9E29ds3Gj1EA0Fi02',now()),
  ('premium_payment_link_annual','https://buy.stripe.com/3cIbJ1eYmahw3Gjdni0Fi03',now()),
  ('journal_companion_payment_link','https://buy.stripe.com/4gM14n5nM75k2Cferm0Fi04',now()),
  ('coach_addon_payment_link','https://buy.stripe.com/aFaaEX6rQ9dsccP2IE0Fi05',now()),
  ('coach_checkin_payment_link','https://buy.stripe.com/00wfZh2bAgFU1ybdni0Fi06',now()),
  ('coaching_foundations_payment_link','https://buy.stripe.com/00wbJ15nM1L07Wz3MI0Fi07',now()),
  ('specialty_recovery_payment_link','https://buy.stripe.com/aFaaEXaI6cpE90Dgzu0Fi08',now()),
  ('specialty_reentry_payment_link','https://buy.stripe.com/5kQ28r5nM61g3Gjdni0Fi09',now()),
  ('specialty_housing_stability_payment_link','https://buy.stripe.com/8x2cN58zY89o6Sv3MI0Fi0a',now()),
  ('specialty_caregiving_payment_link','https://buy.stripe.com/28EeVdbMa9ds7Wzdni0Fi0b',now()),
  ('specialty_grief_life_after_loss_payment_link','https://buy.stripe.com/dRm14neYmblA90Ddni0Fi0c',now()),
  ('specialty_workforce_new_beginnings_payment_link','https://buy.stripe.com/00w3cv9E21L01ybgzu0Fi0d',now()),
  ('billing_enabled','true',now()),
  ('legal_launch_gate_enabled','true',now()),
  ('public_multi_program_launch_enabled','true',now())
on conflict (key) do update set value=excluded.value,updated_at=excluded.updated_at;

update public.programs
set journey_config = journey_config
  || jsonb_build_object(
    'internal_only',false,
    'execution_status','controlled_beta_live',
    'release_scope','coaching_only_controlled_beta',
    'activated_at','2026-09-28T00:00:00Z'
  )
where slug in ('caregiving','reentry','housing-stability','independent-living')
  and status='pilot';

create or replace function public.get_my_journey_access_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_catalog
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
  v_active jsonb := '[]'::jsonb;
  v_inactive jsonb := '[]'::jsonb;
begin
  if v_uid is null then
    return jsonb_build_object(
      'authenticated',false,'plan_key','free','plan_label','Lellee Free',
      'coach_addon',false,'active_journey_limit',1,'active_journey_count',0,
      'beta_exempt_count',0,'total_active_journey_count',0,'remaining_slots',1,
      'at_limit',false,'over_limit',false,'journey_activity_controls',false,
      'active_journeys','[]'::jsonb,'inactive_journeys','[]'::jsonb,
      'recovery_inactive_guard',true
    );
  end if;

  select coalesce(max(case entitlement_key when 'premium' then 2 when 'plus' then 1 else 0 end),0)
    into v_limit
  from public.user_entitlements
  where user_id=v_uid
    and entitlement_key in ('plus','premium')
    and status in ('active','trialing');

  if v_limit=2 then
    v_plan := 'premium'; v_plan_label := 'Lellee Premium'; v_limit := 4;
  elsif v_limit=1 then
    v_plan := 'plus'; v_plan_label := 'Lellee Plus'; v_limit := 2;
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
    'coach_addon',v_coach_addon,'active_journey_limit',v_limit,
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

revoke all on function public.get_my_journey_access_summary() from public;
grant execute on function public.get_my_journey_access_summary() to authenticated;

create or replace function public.can_activate_my_journey(p_program_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
declare
  v_uid uuid := auth.uid();
  v_program public.programs%rowtype;
  v_summary jsonb;
  v_beta boolean := false;
  v_active boolean := false;
  v_allowed boolean := false;
begin
  if v_uid is null then return jsonb_build_object('allowed',false,'reason','sign_in_required'); end if;
  select * into v_program from public.programs where id=p_program_id;
  if not found then return jsonb_build_object('allowed',false,'reason','program_not_found'); end if;
  v_beta := coalesce(v_program.journey_config->>'wave','')='wave_1'
    and coalesce(v_program.journey_config->>'execution_status','')='controlled_beta_live';
  select exists(select 1 from public.program_enrollments where user_id=v_uid and program_id=p_program_id and status='active') into v_active;
  v_summary := public.get_my_journey_access_summary();
  v_allowed := v_beta or v_active or coalesce((v_summary->>'active_journey_count')::integer,0) < coalesce((v_summary->>'active_journey_limit')::integer,1);
  return jsonb_build_object(
    'allowed',v_allowed,'already_active',v_active,'plan_exempt',v_beta,
    'reason',case when v_beta then 'controlled_beta_exempt' when v_active then 'already_active' when v_allowed then 'slot_available' else 'plan_limit_reached' end,
    'program_id',v_program.id,'program_slug',v_program.slug,'program_name',v_program.name,
    'plan_key',v_summary->>'plan_key','plan_label',v_summary->>'plan_label',
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
set search_path = public, pg_catalog
as $$
declare
  v_uid uuid := auth.uid();
  v_program public.programs%rowtype;
  v_enrollment public.program_enrollments%rowtype;
  v_beta boolean := false;
  v_gate jsonb;
begin
  if v_uid is null then return jsonb_build_object('success',false,'changed',false,'reason','sign_in_required'); end if;
  select * into v_program from public.programs where id=p_program_id;
  if not found then return jsonb_build_object('success',false,'changed',false,'reason','program_not_found'); end if;
  v_beta := coalesce(v_program.journey_config->>'wave','')='wave_1'
    and coalesce(v_program.journey_config->>'execution_status','')='controlled_beta_live';
  if v_beta then return jsonb_build_object('success',false,'changed',false,'reason','controlled_beta_managed','plan_exempt',true,'summary',public.get_my_journey_access_summary()); end if;
  if not p_active and v_program.slug='recovery' then return jsonb_build_object('success',false,'changed',false,'reason','recovery_inactive_guard','summary',public.get_my_journey_access_summary()); end if;
  select * into v_enrollment from public.program_enrollments where user_id=v_uid and program_id=p_program_id;
  if not found then return jsonb_build_object('success',false,'changed',false,'reason','not_enrolled','summary',public.get_my_journey_access_summary()); end if;
  if p_active then
    if v_enrollment.status='active' then return jsonb_build_object('success',true,'changed',false,'reason','already_active','summary',public.get_my_journey_access_summary()); end if;
    if v_enrollment.status<>'paused' then return jsonb_build_object('success',false,'changed',false,'reason','status_not_reactivatable','summary',public.get_my_journey_access_summary()); end if;
    v_gate := public.can_activate_my_journey(p_program_id);
    if not coalesce((v_gate->>'allowed')::boolean,false) then return jsonb_build_object('success',false,'changed',false,'reason','plan_limit_reached','gate',v_gate,'summary',public.get_my_journey_access_summary()); end if;
    update public.program_enrollments set status='active' where id=v_enrollment.id and user_id=v_uid;
    return jsonb_build_object('success',true,'changed',true,'reason','activated','summary',public.get_my_journey_access_summary());
  end if;
  if v_enrollment.status='paused' then return jsonb_build_object('success',true,'changed',false,'reason','already_inactive','summary',public.get_my_journey_access_summary()); end if;
  if v_enrollment.status<>'active' then return jsonb_build_object('success',false,'changed',false,'reason','status_not_deactivatable','summary',public.get_my_journey_access_summary()); end if;
  update public.program_enrollments set status='paused',is_primary=false where id=v_enrollment.id and user_id=v_uid;
  return jsonb_build_object('success',true,'changed',true,'reason','made_inactive','summary',public.get_my_journey_access_summary());
end;
$$;

revoke all on function public.set_my_journey_active(uuid,boolean) from public;
grant execute on function public.set_my_journey_active(uuid,boolean) to authenticated;

commit;
