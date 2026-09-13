-- LELLEE RECOVERY INACTIVE GUARD
-- Recovery currently uses the canonical Recovery shell, whose direct routes do not yet
-- enforce inactive enrollment state. Until that route guard exists, Recovery must not
-- be allowed to free a commercial journey slot while remaining usable through direct navigation.
-- This migration is intentionally ordered after 20260913153000_journey_active_inactive_controls.sql.

-- Preserve the slot-summary implementation as an internal base, then expose a wrapper
-- that marks Recovery as not eligible for the member-facing Make Inactive control.
do $$
begin
  if to_regprocedure('public.get_my_journey_access_summary_base_20260913()') is null then
    alter function public.get_my_journey_access_summary()
      rename to get_my_journey_access_summary_base_20260913;
  end if;
end
$$;

revoke all on function public.get_my_journey_access_summary_base_20260913() from public;
revoke all on function public.get_my_journey_access_summary_base_20260913() from authenticated;

create or replace function public.get_my_journey_access_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_summary jsonb;
  v_active jsonb := '[]'::jsonb;
begin
  v_summary := public.get_my_journey_access_summary_base_20260913();

  if jsonb_typeof(v_summary->'active_journeys') = 'array' then
    select coalesce(
      jsonb_agg(
        case
          when item->>'slug' = 'recovery' and item->>'access_type' = 'plan'
            then jsonb_set(item,'{can_make_inactive}','false'::jsonb,true)
          else item
        end
      ),
      '[]'::jsonb
    )
    into v_active
    from jsonb_array_elements(v_summary->'active_journeys') item;

    v_summary := jsonb_set(v_summary,'{active_journeys}',v_active,true);
  end if;

  v_summary := jsonb_set(
    v_summary,
    '{recovery_inactive_guard}',
    'true'::jsonb,
    true
  );

  return v_summary;
end;
$$;

revoke all on function public.get_my_journey_access_summary() from public;
grant execute on function public.get_my_journey_access_summary() to authenticated;

-- Preserve the activity-toggle implementation as an internal base, then expose a wrapper
-- that blocks making Recovery inactive until the Recovery shell has a direct-route guard.
do $$
begin
  if to_regprocedure('public.set_my_journey_active_base_20260913(uuid,boolean)') is null then
    alter function public.set_my_journey_active(uuid,boolean)
      rename to set_my_journey_active_base_20260913;
  end if;
end
$$;

revoke all on function public.set_my_journey_active_base_20260913(uuid,boolean) from public;
revoke all on function public.set_my_journey_active_base_20260913(uuid,boolean) from authenticated;

create or replace function public.set_my_journey_active(p_program_id uuid,p_active boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug text;
  v_name text;
begin
  if auth.uid() is null then
    return jsonb_build_object('success',false,'changed',false,'reason','sign_in_required');
  end if;

  select p.slug,p.name
    into v_slug,v_name
  from public.programs p
  where p.id=p_program_id;

  if not found then
    return jsonb_build_object('success',false,'changed',false,'reason','program_not_found');
  end if;

  if not p_active and v_slug='recovery' then
    return jsonb_build_object(
      'success',false,
      'changed',false,
      'reason','recovery_inactive_guard',
      'program_id',p_program_id,
      'program_slug',v_slug,
      'program_name',v_name,
      'summary',public.get_my_journey_access_summary()
    );
  end if;

  return public.set_my_journey_active_base_20260913(p_program_id,p_active);
end;
$$;

revoke all on function public.set_my_journey_active(uuid,boolean) from public;
grant execute on function public.set_my_journey_active(uuid,boolean) to authenticated;

comment on function public.get_my_journey_access_summary() is
  'Journey slot summary with controlled-beta exemption and a temporary Recovery inactive guard until direct Recovery routes enforce inactive state.';
comment on function public.set_my_journey_active(uuid,boolean) is
  'Member journey activity toggle. Recovery deactivation is temporarily blocked until direct Recovery routes enforce inactive state.';
