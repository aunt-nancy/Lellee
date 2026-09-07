create or replace function public.lellee_queue_automation_event_internal_v1(
  p_trigger_event text,
  p_payload jsonb default '{}'::jsonb,
  p_run_after timestamptz default now()
) returns integer
language plpgsql
security definer
set search_path='public'
as $$
declare
  v_count integer := 0;
  v_user_id uuid := nullif(p_payload->>'user_id','')::uuid;
  v_business_id uuid := nullif(p_payload->>'business_id','')::uuid;
  v_organization_id uuid := nullif(p_payload->>'organization_id','')::uuid;
  v_event_key text := nullif(p_payload->>'event_key','');
begin
  if coalesce((select value='true' from public.app_public_settings where key='automation_engine_enabled'),false) is not true then
    return 0;
  end if;

  if p_trigger_event not in ('session_scheduled','milestone_due','followup_due','operational_event') then
    return 0;
  end if;

  insert into public.automation_queue(rule_id,run_after,status,payload)
  select r.id,coalesce(p_run_after,now()),'queued',coalesce(p_payload,'{}'::jsonb)
  from public.automation_rules r
  where r.status='active'
    and r.trigger_event=p_trigger_event
    and (
      r.scope_type='platform'
      or (r.scope_type='personal' and v_user_id is not null and (r.created_by=v_user_id or r.scope_id=v_user_id))
      or (r.scope_type='coach_business' and v_business_id is not null and r.scope_id=v_business_id)
      or (r.scope_type='organization' and v_organization_id is not null and r.scope_id=v_organization_id)
    )
    and not exists(
      select 1 from public.automation_queue q
      where q.rule_id=r.id
        and v_event_key is not null
        and q.payload->>'event_key'=v_event_key
        and q.status in('queued','running','completed')
    );
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.lellee_queue_automation_event_internal_v1(text,jsonb,timestamptz) from public,anon,authenticated;

create or replace function public.lellee_process_automation_queue_v1(p_limit integer default 25)
returns integer
language plpgsql
security definer
set search_path='public'
as $$
declare
  rec record;
  cfg jsonb;
  v_run_id uuid;
  v_user_id uuid;
  v_owner_user_id uuid;
  v_program_id uuid;
  v_business_id uuid;
  v_organization_id uuid;
  v_related_user_id uuid;
  v_source_id uuid;
  v_due_at timestamptz;
  v_due_date date;
  v_workspace text;
  v_processed integer := 0;
begin
  if coalesce((select value='true' from public.app_public_settings where key='automation_engine_enabled'),false) is not true then
    return 0;
  end if;

  update public.automation_queue q
     set status='cancelled',updated_at=now()
   where q.status='queued'
     and exists(select 1 from public.automation_rules r where r.id=q.rule_id and r.status<>'active');

  for rec in
    select q.id as queue_id,q.payload,q.run_after,
           r.id as rule_id,r.name,r.scope_type,r.scope_id,r.action_type,r.action_config,r.created_by
    from public.automation_queue q
    join public.automation_rules r on r.id=q.rule_id
    where q.status='queued' and q.run_after<=now() and r.status='active'
    order by q.run_after,q.created_at
    limit greatest(1,least(coalesce(p_limit,25),100))
    for update of q skip locked
  loop
    begin
      update public.automation_queue set status='running',updated_at=now() where id=rec.queue_id;
      insert into public.automation_runs(rule_id,status,started_at,created_at)
      values(rec.rule_id,'running',now(),now()) returning id into v_run_id;

      cfg := coalesce(rec.action_config,'{}'::jsonb) || coalesce(rec.payload,'{}'::jsonb);
      v_user_id := nullif(cfg->>'user_id','')::uuid;
      v_owner_user_id := coalesce(nullif(cfg->>'owner_user_id','')::uuid,v_user_id,rec.created_by);
      v_program_id := nullif(cfg->>'program_id','')::uuid;
      v_business_id := nullif(cfg->>'business_id','')::uuid;
      v_organization_id := nullif(cfg->>'organization_id','')::uuid;
      v_related_user_id := nullif(cfg->>'related_user_id','')::uuid;
      v_source_id := nullif(cfg->>'source_id','')::uuid;
      v_due_at := coalesce(nullif(cfg->>'due_at','')::timestamptz,rec.run_after,now());
      v_due_date := nullif(cfg->>'due_date','')::date;

      if rec.action_type='create_notification' then
        if v_user_id is null then raise exception 'Automation notification requires user_id'; end if;
        insert into public.user_notifications(
          user_id,program_id,notification_type,title,preview_text,body_text,sender_label,
          source_table,source_id,action_page,action_payload,scheduled_for,push_requested,dedupe_key
        ) values(
          v_user_id,v_program_id,coalesce(nullif(cfg->>'notification_type',''),'automation'),
          coalesce(nullif(cfg->>'title',''),rec.name),nullif(cfg->>'preview_text',''),nullif(cfg->>'body_text',''),
          coalesce(nullif(cfg->>'sender_label',''),'Lellee'),
          'automation_queue',rec.queue_id,nullif(cfg->>'action_page',''),
          coalesce(cfg->'action_payload','{}'::jsonb),nullif(cfg->>'scheduled_for','')::timestamptz,false,
          'automation:'||rec.queue_id::text
        );

      elsif rec.action_type='create_reminder' then
        if v_user_id is null then raise exception 'Automation reminder requires user_id'; end if;
        insert into public.reminders(
          user_id,reminder_key,reminder_type,title,message,due_at,status,source_type,source_id
        ) values(
          v_user_id,'automation:'||rec.queue_id::text,
          coalesce(nullif(cfg->>'reminder_type',''),'automation'),
          coalesce(nullif(cfg->>'title',''),rec.name),nullif(cfg->>'message',''),v_due_at,'pending','automation_rule',rec.rule_id
        );

      elsif rec.action_type='create_task' then
        if v_user_id is null then raise exception 'Automation task requires user_id'; end if;
        insert into public.life_tasks(
          user_id,program_id,title,category,priority,due_date,status,notes
        ) values(
          v_user_id,v_program_id,coalesce(nullif(cfg->>'title',''),rec.name),
          coalesce(nullif(cfg->>'category',''),'automation'),
          coalesce(nullif(cfg->>'priority',''),'normal'),v_due_date,'open',nullif(cfg->>'notes','')
        );

      elsif rec.action_type='create_followup' then
        v_workspace := coalesce(nullif(cfg->>'workspace_type',''),
          case rec.scope_type when 'coach_business' then 'coach' when 'organization' then 'organization' else 'admin' end);
        if v_workspace not in('coach','organization','admin') then raise exception 'Invalid follow-up workspace'; end if;
        insert into public.crm_followups(
          owner_user_id,workspace_type,business_id,organization_id,related_user_id,lead_id,title,note,due_at,status
        ) values(
          v_owner_user_id,v_workspace,v_business_id,v_organization_id,v_related_user_id,
          nullif(cfg->>'lead_id','')::uuid,coalesce(nullif(cfg->>'title',''),rec.name),nullif(cfg->>'note',''),v_due_at,'open'
        );

      else
        raise exception 'Unsupported automation action: %',rec.action_type;
      end if;

      update public.automation_queue set status='completed',updated_at=now() where id=rec.queue_id;
      update public.automation_runs set status='completed',completed_at=now() where id=v_run_id;
      v_processed := v_processed+1;
    exception when others then
      update public.automation_queue set status='failed',updated_at=now() where id=rec.queue_id;
      if v_run_id is null then
        insert into public.automation_runs(rule_id,status,error_message,started_at,completed_at,created_at)
        values(rec.rule_id,'failed',left(sqlerrm,1000),now(),now(),now());
      else
        update public.automation_runs set status='failed',error_message=left(sqlerrm,1000),completed_at=now() where id=v_run_id;
      end if;
      v_run_id := null;
    end;
  end loop;
  return v_processed;
end;
$$;

revoke all on function public.lellee_process_automation_queue_v1(integer) from public,anon,authenticated;

create or replace function public.lellee_automation_on_coach_session_v1()
returns trigger
language plpgsql
security definer
set search_path='public'
as $$
declare
  rel record;
  run_at timestamptz;
begin
  update public.automation_queue q
     set status='cancelled',updated_at=now()
   where q.status='queued'
     and q.payload->>'source_type'='coach_session'
     and q.payload->>'source_id'=new.id::text;

  if new.status<>'scheduled' or new.relationship_id is null then return new; end if;
  select client_user_id,program_id,business_id into rel
  from public.coach_client_relationships
  where id=new.relationship_id and status='active';
  if rel.client_user_id is null then return new; end if;

  run_at := greatest(now(),new.scheduled_start-interval '24 hours');
  perform public.lellee_queue_automation_event_internal_v1(
    'session_scheduled',
    jsonb_build_object(
      'event_key','coach_session:'||new.id::text||':'||extract(epoch from new.scheduled_start)::bigint::text,
      'source_type','coach_session','source_id',new.id,
      'user_id',rel.client_user_id,'business_id',rel.business_id,'program_id',rel.program_id,
      'title','Coaching session reminder','message','You have a Lellee coaching session scheduled.',
      'due_at',new.scheduled_start
    ),run_at
  );
  return new;
end;
$$;

revoke all on function public.lellee_automation_on_coach_session_v1() from public,anon,authenticated;

drop trigger if exists trg_lellee_automation_coach_session_v1 on public.coach_sessions;
create trigger trg_lellee_automation_coach_session_v1
after insert or update of scheduled_start,status,relationship_id on public.coach_sessions
for each row execute function public.lellee_automation_on_coach_session_v1();

create or replace function public.lellee_automation_on_milestone_v1()
returns trigger
language plpgsql
security definer
set search_path='public'
as $$
begin
  perform public.lellee_queue_automation_event_internal_v1(
    'milestone_due',
    jsonb_build_object(
      'event_key','milestone:'||new.id::text,
      'source_type','milestone','source_id',new.id,
      'user_id',new.user_id,'program_id',new.program_id,
      'title',new.title,
      'preview_text','A Lellee milestone is ready to review.',
      'body_text',coalesce(new.note,'Your milestone has been recorded.'),
      'action_page','my-recovery'
    ),now()
  );
  return new;
end;
$$;

revoke all on function public.lellee_automation_on_milestone_v1() from public,anon,authenticated;

drop trigger if exists trg_lellee_automation_milestone_v1 on public.milestones;
create trigger trg_lellee_automation_milestone_v1
after insert on public.milestones
for each row execute function public.lellee_automation_on_milestone_v1();

create or replace function public.get_automation_studio_summary()
returns jsonb
language plpgsql
security definer
set search_path='public'
as $$
declare engine_on boolean:=coalesce((select value='true' from public.app_public_settings where key='automation_engine_enabled'),false);
begin
  if not public.is_lellee_admin() then raise exception 'Admin access required'; end if;
  return jsonb_build_object(
    'summary',jsonb_build_object(
      'rules',(select count(*) from public.automation_rules where status<>'archived'),
      'active',(select count(*) from public.automation_rules where status='active'),
      'runs_30d',(select count(*) from public.automation_runs where created_at>=now()-interval '30 days'),
      'failures_30d',(select count(*) from public.automation_runs where status='failed' and created_at>=now()-interval '30 days')
    ),
    'rules',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'scope_type',scope_type,'trigger_event',trigger_event,'action_type',action_type,'status',status) order by created_at desc) from public.automation_rules where status<>'archived'),'[]'::jsonb),
    'templates',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'description',description) order by name) from public.automation_templates where active=true),'[]'::jsonb),
    'queue',coalesce((select jsonb_agg(jsonb_build_object('rule_name',r.name,'status',q.status,'run_after',q.run_after) order by q.run_after) from public.automation_queue q join public.automation_rules r on r.id=q.rule_id where q.status in ('queued','running') limit 50),'[]'::jsonb),
    'history',coalesce((select jsonb_agg(jsonb_build_object('rule_name',r.name,'status',ar.status,'created_at',ar.created_at) order by ar.created_at desc) from public.automation_runs ar join public.automation_rules r on r.id=ar.rule_id limit 50),'[]'::jsonb),
    'guardrails',jsonb_build_array(
      jsonb_build_object('enabled',true,'label','Human review remains required','detail','Automation is limited to internal notifications, reminders, tasks and follow-ups. It does not execute external communications or financial actions.'),
      jsonb_build_object('enabled',true,'label','Scope permissions enforced','detail','Rules can be managed only by the owning user, authorized business/organization members, or Lellee Admin.'),
      jsonb_build_object('enabled',engine_on,'label','Execution engine','detail',case when engine_on then 'Internal automation worker is active.' else 'Rules can be configured, but the execution worker is off.' end)
    )
  );
end;
$$;

insert into public.app_public_settings(key,value,updated_at) values
  ('automation_engine_enabled','true',now()),
  ('coach_automation_enabled','true',now())
on conflict(key) do update set value=excluded.value,updated_at=excluded.updated_at;

do $$
begin
  if exists(select 1 from cron.job where jobname='lellee-automation-worker-v1') then
    perform cron.unschedule('lellee-automation-worker-v1');
  end if;
end$$;

select cron.schedule(
  'lellee-automation-worker-v1',
  '*/5 * * * *',
  'select public.lellee_process_automation_queue_v1(25);'
);
