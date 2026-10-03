create or replace function public.update_my_coach_automation_rule(
  p_rule_id uuid,
  p_name text,
  p_description text default null,
  p_trigger_event text default null,
  p_delay_hours integer default 24,
  p_followup_title text default 'Coach follow-up',
  p_status text default null
)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
declare
  uid uuid:=auth.uid();
  r public.automation_rules%rowtype;
  next_status text;
  next_trigger text;
  cfg jsonb;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  select * into r from public.automation_rules where id=p_rule_id for update;
  if r.id is null then raise exception 'Automation rule not found'; end if;
  if r.scope_type<>'coach_business' or r.scope_id is null or not public.is_coach_business_member(r.scope_id) then
    raise exception 'Coach business automation access required';
  end if;
  if r.created_by is not null and r.created_by<>uid and not public.is_lellee_admin() then
    raise exception 'Only the rule creator can edit this automation rule';
  end if;
  if r.action_type<>'create_followup' then
    raise exception 'This coach automation action is not editable from the Coach Dashboard';
  end if;
  if char_length(trim(coalesce(p_name,'')))<2 then raise exception 'Rule name is required'; end if;
  next_trigger:=coalesce(p_trigger_event,r.trigger_event);
  if next_trigger not in ('consultation_requested','session_scheduled','group_start_due') then
    raise exception 'Invalid coach automation trigger';
  end if;
  if p_delay_hours<1 or p_delay_hours>720 then raise exception 'Follow-up delay must be between 1 and 720 hours'; end if;
  next_status:=coalesce(p_status,r.status);
  if next_status not in ('draft','active','paused','retired') then raise exception 'Invalid automation status'; end if;
  cfg:=case
    when next_trigger='group_start_due' then
      jsonb_build_object('days_before',greatest(0,least(30,round(p_delay_hours::numeric/24)::integer)),
                         'title',coalesce(nullif(trim(p_followup_title),''),'Prepare for group start'))
    else
      jsonb_build_object('due_hours',p_delay_hours,
                         'title',coalesce(nullif(trim(p_followup_title),''),'Coach follow-up'))
  end;
  update public.automation_rules
  set name=trim(p_name),description=nullif(trim(coalesce(p_description,'')),''),
      trigger_event=next_trigger,trigger_config='{}'::jsonb,conditions='[]'::jsonb,
      action_type='create_followup',action_config=cfg,status=next_status,updated_at=now()
  where id=r.id;
  return jsonb_build_object('rule_id',r.id,'status',next_status,'trigger_event',next_trigger);
end;
$$;
revoke all on function public.update_my_coach_automation_rule(uuid,text,text,text,integer,text,text) from public,anon;
grant execute on function public.update_my_coach_automation_rule(uuid,text,text,text,integer,text,text) to authenticated,service_role;
