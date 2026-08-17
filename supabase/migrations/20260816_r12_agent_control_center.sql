-- LELLEE R12 — USER AGENT CONTROL CENTER
-- Adds safe user-facing access to the user's own consent + audit state.
-- Does NOT expose global agent enablement or platform-wide capability grants.

create or replace function public.get_my_agent_control_center()
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  result jsonb;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select jsonb_build_object(
    'consents',
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'agent_key', agent_key,
          'capability', capability,
          'is_granted', is_granted,
          'granted_at', granted_at,
          'revoked_at', revoked_at,
          'updated_at', updated_at
        )
        order by agent_key, capability
      )
      from public.user_agent_consents
      where user_id = uid
    ), '[]'::jsonb),
    'message_shares',
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'message_id', message_id,
          'thread_id', thread_id,
          'is_granted', is_granted,
          'granted_at', granted_at,
          'revoked_at', revoked_at,
          'updated_at', updated_at
        )
        order by updated_at desc
      )
      from public.coaching_agent_message_shares
      where user_id = uid
    ), '[]'::jsonb),
    'recent_activity',
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'agent_key', agent_key,
          'capability', capability,
          'outcome', outcome,
          'created_at', created_at
        )
        order by created_at desc
      )
      from (
        select agent_key, capability, outcome, created_at
        from public.agent_access_audit
        where user_id = uid
        order by created_at desc
        limit 50
      ) a
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.get_my_agent_control_center() from public;
grant execute on function public.get_my_agent_control_center() to authenticated;

create or replace function public.revoke_my_agent_consent(
  p_agent_key text,
  p_capability text
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  update public.user_agent_consents
  set is_granted = false,
      revoked_at = now(),
      updated_at = now()
  where user_id = uid
    and agent_key = p_agent_key
    and capability = p_capability;

  return found;
end;
$$;

revoke all on function public.revoke_my_agent_consent(text, text) from public;
grant execute on function public.revoke_my_agent_consent(text, text) to authenticated;

create or replace function public.revoke_all_my_agent_consents(
  p_agent_key text
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  affected integer := 0;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  update public.user_agent_consents
  set is_granted = false,
      revoked_at = now(),
      updated_at = now()
  where user_id = uid
    and agent_key = p_agent_key
    and is_granted = true;

  get diagnostics affected = row_count;

  if p_agent_key = 'coaching' then
    update public.coaching_agent_message_shares
    set is_granted = false,
        revoked_at = now(),
        updated_at = now()
    where user_id = uid
      and is_granted = true;
  end if;

  return affected;
end;
$$;

revoke all on function public.revoke_all_my_agent_consents(text) from public;
grant execute on function public.revoke_all_my_agent_consents(text) to authenticated;