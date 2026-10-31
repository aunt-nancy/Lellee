-- Only the existing authenticated worker may create these bounded draft assignments.
create or replace function public.lellee_queue_due_agent_missions_v2(p_dry_run boolean default true)
returns jsonb
language plpgsql
security invoker
set search_path=public,pg_temp
as $function$
declare
  m record; owner_id uuid; reviewer_id uuid; src text; bucket text;
  queued integer:=0; due integer:=0; today_count integer; enabled boolean;
  items jsonb:='[]'::jsonb; context_snapshot jsonb; tid uuid;
  day_start timestamptz:=date_trunc('day',now() at time zone 'America/Los_Angeles') at time zone 'America/Los_Angeles';
begin
  if current_user not in ('postgres','service_role') then raise exception 'Worker access required'; end if;
  select coalesce(value='true',false) into enabled from public.app_public_settings where key='agent_recurring_missions_enabled';
  enabled:=coalesce(enabled,false);
  if not p_dry_run and not enabled then return jsonb_build_object('enabled',false,'queued',0,'due',0); end if;
  if not pg_try_advisory_xact_lock(hashtext('lellee-agent-missions-v2')) then return jsonb_build_object('enabled',enabled,'queued',0,'busy',true); end if;
  bucket:=to_char(now() at time zone 'America/Los_Angeles','YYYY-MM-DD');
  select count(*) into today_count from public.agent_tasks where source_type='agent_mission' and source_reference like 'agent-command-center-v2:%' and created_at>=day_start;
  select jsonb_build_object(
    'as_of',now(),
    'program_registry',coalesce((select jsonb_agg(jsonb_build_object('name',name,'slug',slug,'status',status) order by display_order,name) from public.programs),'[]'::jsonb),
    'active_agents',(select count(*) from public.agent_definitions where status='active'),
    'specialist_roster',coalesce((select jsonb_agg(jsonb_build_object('agent_key',a.agent_key,'name',a.name,'team',tm.team_label,'role',tm.role_label) order by a.name) from public.agent_definitions a left join public.agent_team_memberships tm on tm.agent_id=a.id and tm.active where a.status='active'),'[]'::jsonb),
    'review_queue',coalesce((select jsonb_agg(row_to_json(q)) from (select a.agent_key,a.name,count(*) as pending_outputs,min(o.created_at) as oldest_output_at,max(o.created_at) as newest_output_at from public.agent_outputs o join public.agent_tasks t on t.id=o.task_id join public.agent_definitions a on a.id=t.agent_id where o.review_status='pending' group by a.agent_key,a.name order by min(o.created_at)) q),'[]'::jsonb),
    'pending_outputs',(select count(*) from public.agent_outputs where review_status='pending'),
    'queued_tasks',(select count(*) from public.agent_tasks where status='queued'),
    'blocked_tasks',(select count(*) from public.agent_tasks where status='blocked'),
    'open_handoffs',(select count(*) from public.agent_output_promotions where status='ready_for_human_action'),
    'portfolio_note','The database contains Recovery plus 20 additional program records. The user refers to 20 programs. Program Builder Assistant owns preparation of the scope and naming reconciliation before requesting an owner decision. Status flags do not prove public availability.',
    'coordination_guidance','Use the supplied roster and review timestamps to name next owners and calculate age. Do not ask Leslie to supply records already available here. Operations Copilot prepares review triage; Program Builder Assistant prepares portfolio reconciliation; Content QA prepares unsupported-claim and stale-draft findings. Age is a review-priority signal, not authority to approve, delete, or cancel work.'
  ) into context_snapshot;
  -- Other specialists are driven by approved handoffs or specific supplied inputs.
  -- Do not run empty provider, client, revenue, content, or campaign analyses.
  for m in
    select mt.*,a.agent_key from public.agent_mission_templates mt
    join public.agent_definitions a on a.id=mt.agent_id
    where mt.active and a.status='active' and a.external_execution_allowed
      and mt.mission_key in ('launch-demand-intelligence','launch-operations-priorities')
    order by case mt.mission_key when 'launch-demand-intelligence' then 1 else 2 end
  loop
    src:='agent-command-center-v2:'||m.mission_key||':'||bucket;
    if exists(select 1 from public.agent_tasks where source_type='agent_mission' and source_reference=src) then
      items:=items||jsonb_build_array(jsonb_build_object('mission',m.mission_key,'state','already_created_today'));continue;
    end if;
    -- Keep one current assignment outstanding. Failed/blocked assignments need explicit recovery.
    if exists(select 1 from public.agent_tasks t where t.agent_id=m.agent_id
      and (t.status in ('queued','running','blocked') or
        (t.source_reference like 'agent-command-center-v2:'||m.mission_key||':%' and t.status in ('needs_review','failed')))) then
      items:=items||jsonb_build_array(jsonb_build_object('mission',m.mission_key,'state','waiting_for_existing_work_or_review'));continue;
    end if;
    owner_id:=null;reviewer_id:=null;
    select t.requested_by,coalesce(t.assigned_review_user_id,t.requested_by) into owner_id,reviewer_id
      from public.agent_tasks t where t.agent_id=m.agent_id and t.source_type='agent_mission'
      and t.source_reference='agent-command-center-v1:'||m.mission_key and t.requested_by is not null
      and t.human_review_required order by t.created_at desc limit 1;
    if owner_id is null or reviewer_id is null then
      items:=items||jsonb_build_array(jsonb_build_object('mission',m.mission_key,'state','human_owner_missing'));continue;
    end if;
    if today_count+due>=2 then
      items:=items||jsonb_build_array(jsonb_build_object('mission',m.mission_key,'state','daily_assignment_limit'));continue;
    end if;
    due:=due+1;
    if not p_dry_run then
      insert into public.agent_tasks(agent_id,title,objective,task_type,status,priority,source_type,source_reference,requested_by,assigned_review_user_id,human_review_required,external_execution_required)
      values(m.agent_id,m.title||' - '||bucket,m.objective||E'\n\nNon-private operational context supplied for this assignment:\n'||context_snapshot::text,
        m.task_type,'queued',m.default_priority,'agent_mission',src,owner_id,reviewer_id,true,m.external_execution_required)
      returning id into tid;
      queued:=queued+1;
      insert into public.agent_audit_log(event_type,agent_id,task_id,safe_metadata)
      values('recurring_agent_draft_queued',m.agent_id,tid,jsonb_build_object('mission_key',m.mission_key,'bucket',bucket,'human_review_required',true,'daily_assignment_cap',2));
    end if;
    items:=items||jsonb_build_array(jsonb_build_object('mission',m.mission_key,'state',case when p_dry_run then 'due_preview' else 'queued' end));
  end loop;
  return jsonb_build_object('enabled',enabled,'dry_run',p_dry_run,'queued',queued,'due',due,'daily_assignment_cap',2,'missions',items);
end
$function$;
revoke all on function public.lellee_queue_due_agent_missions_v2(boolean) from public,anon,authenticated;
grant execute on function public.lellee_queue_due_agent_missions_v2(boolean) to service_role;

-- Enable only after the worker and transaction checks pass. Deployment itself stays inert.
insert into public.app_public_settings(key,value) values('agent_recurring_missions_enabled','false') on conflict(key) do nothing;
