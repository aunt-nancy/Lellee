create extension if not exists pgcrypto;

create table if not exists public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  scope_type text not null check (scope_type in ('personal','coach_business','organization','platform')),
  scope_id uuid,
  trigger_event text not null,
  action_type text not null,
  action_config jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','active','paused','archived')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  trigger_event text not null,
  action_type text not null,
  action_config jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_queue (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.automation_rules(id) on delete cascade,
  run_after timestamptz not null default now(),
  status text not null default 'queued' check (status in ('queued','running','completed','failed','cancelled')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.automation_rules(id) on delete cascade,
  status text not null default 'completed' check (status in ('running','completed','failed','cancelled')),
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists automation_rules_scope_idx on public.automation_rules(scope_type,scope_id,status);
create index if not exists automation_queue_status_idx on public.automation_queue(status,run_after);
create index if not exists automation_runs_rule_idx on public.automation_runs(rule_id,created_at desc);

alter table public.automation_rules enable row level security;
alter table public.automation_templates enable row level security;
alter table public.automation_queue enable row level security;
alter table public.automation_runs enable row level security;

create or replace function public.can_manage_automation_scope(p_scope_type text,p_scope_id uuid,p_created_by uuid default null)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
select case
  when public.is_lellee_admin() then true
  when p_scope_type='personal' then coalesce(p_created_by,auth.uid())=auth.uid()
  when p_scope_type='coach_business' then exists (
    select 1 from public.coach_businesses b
    where b.id=p_scope_id and (
      b.owner_user_id=auth.uid() or exists (
        select 1 from public.coach_business_members m
        where m.business_id=b.id and m.user_id=auth.uid() and m.status='active'
      )
    )
  )
  when p_scope_type='organization' then exists (
    select 1 from public.organizations o
    where o.id=p_scope_id and (
      o.owner_user_id=auth.uid() or exists (
        select 1 from public.organization_members m
        where m.organization_id=o.id and m.user_id=auth.uid() and m.status='active'
      )
    )
  )
  else false
end;
$$;

revoke all on function public.can_manage_automation_scope(text,uuid,uuid) from public, anon;
grant execute on function public.can_manage_automation_scope(text,uuid,uuid) to authenticated;

create policy automation_rules_select on public.automation_rules
for select to authenticated
using (public.can_manage_automation_scope(scope_type,scope_id,created_by));

create policy automation_rules_insert on public.automation_rules
for insert to authenticated
with check (created_by=auth.uid() and public.can_manage_automation_scope(scope_type,scope_id,created_by));

create policy automation_templates_select on public.automation_templates
for select to authenticated
using (active=true or public.is_lellee_admin());

create policy automation_queue_select on public.automation_queue
for select to authenticated
using (exists (
  select 1 from public.automation_rules r
  where r.id=rule_id and public.can_manage_automation_scope(r.scope_type,r.scope_id,r.created_by)
));

create policy automation_runs_select on public.automation_runs
for select to authenticated
using (exists (
  select 1 from public.automation_rules r
  where r.id=rule_id and public.can_manage_automation_scope(r.scope_type,r.scope_id,r.created_by)
));

grant select,insert on public.automation_rules to authenticated;
grant select on public.automation_templates,public.automation_queue,public.automation_runs to authenticated;

insert into public.automation_templates(name,description,trigger_event,action_type,action_config)
select * from (values
 ('Milestone reminder','Prepare a notification when a configured milestone becomes due.','milestone_due','create_notification','{}'::jsonb),
 ('Follow-up reminder','Create a follow-up item after a configured service event.','followup_due','create_followup','{}'::jsonb),
 ('Session reminder','Prepare a reminder around a scheduled session.','session_scheduled','create_reminder','{}'::jsonb),
 ('Operational task','Create a human-owned task when a configured event occurs.','operational_event','create_task','{}'::jsonb)
) v(name,description,trigger_event,action_type,action_config)
where not exists (select 1 from public.automation_templates t where t.name=v.name);

create or replace function public.get_my_automation_center()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare uid uuid:=auth.uid();
begin
  if uid is null then raise exception 'Authentication required'; end if;
  return jsonb_build_object(
    'summary',jsonb_build_object(
      'active_rules',(select count(*) from public.automation_rules where scope_type='personal' and created_by=uid and status='active'),
      'actions_today',(select count(*) from public.automation_runs ar join public.automation_rules r on r.id=ar.rule_id where r.scope_type='personal' and r.created_by=uid and ar.created_at::date=current_date),
      'upcoming_reminders',(select count(*) from public.automation_queue aq join public.automation_rules r on r.id=aq.rule_id where r.scope_type='personal' and r.created_by=uid and aq.status='queued' and aq.run_after<=now()+interval '7 days'),
      'paused_rules',(select count(*) from public.automation_rules where scope_type='personal' and created_by=uid and status='paused')
    ),
    'rules',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'description',description,'status',status) order by created_at desc) from public.automation_rules where scope_type='personal' and created_by=uid),'[]'::jsonb),
    'runs',coalesce((select jsonb_agg(jsonb_build_object('rule_name',r.name,'status',ar.status,'created_at',ar.created_at) order by ar.created_at desc) from public.automation_runs ar join public.automation_rules r on r.id=ar.rule_id where r.scope_type='personal' and r.created_by=uid limit 20),'[]'::jsonb)
  );
end $$;

create or replace function public.get_coach_automation_summary(p_business_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
begin
  if not public.can_manage_automation_scope('coach_business',p_business_id,auth.uid()) then raise exception 'Coach business access required'; end if;
  return jsonb_build_object(
    'summary',jsonb_build_object(
      'active_rules',(select count(*) from public.automation_rules where scope_type='coach_business' and scope_id=p_business_id and status='active'),
      'followups_due',0,
      'tasks_created',0,
      'recent_runs',(select count(*) from public.automation_runs ar join public.automation_rules r on r.id=ar.rule_id where r.scope_type='coach_business' and r.scope_id=p_business_id and ar.created_at>=now()-interval '30 days')
    ),
    'rules',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'trigger_event',trigger_event,'action_type',action_type,'status',status) order by created_at desc) from public.automation_rules where scope_type='coach_business' and scope_id=p_business_id),'[]'::jsonb),
    'runs',coalesce((select jsonb_agg(jsonb_build_object('rule_name',r.name,'status',ar.status,'created_at',ar.created_at) order by ar.created_at desc) from public.automation_runs ar join public.automation_rules r on r.id=ar.rule_id where r.scope_type='coach_business' and r.scope_id=p_business_id limit 20),'[]'::jsonb)
  );
end $$;

create or replace function public.get_organization_automation_summary(p_organization_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
begin
  if not public.can_manage_automation_scope('organization',p_organization_id,auth.uid()) then raise exception 'Organization access required'; end if;
  return jsonb_build_object(
    'summary',jsonb_build_object(
      'active_rules',(select count(*) from public.automation_rules where scope_type='organization' and scope_id=p_organization_id and status='active'),
      'pending_invites',0,
      'followups_due',0,
      'recent_runs',(select count(*) from public.automation_runs ar join public.automation_rules r on r.id=ar.rule_id where r.scope_type='organization' and r.scope_id=p_organization_id and ar.created_at>=now()-interval '30 days')
    ),
    'rules',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'trigger_event',trigger_event,'action_type',action_type,'status',status) order by created_at desc) from public.automation_rules where scope_type='organization' and scope_id=p_organization_id),'[]'::jsonb),
    'runs',coalesce((select jsonb_agg(jsonb_build_object('rule_name',r.name,'status',ar.status,'created_at',ar.created_at) order by ar.created_at desc) from public.automation_runs ar join public.automation_rules r on r.id=ar.rule_id where r.scope_type='organization' and r.scope_id=p_organization_id limit 20),'[]'::jsonb)
  );
end $$;

create or replace function public.get_automation_studio_summary()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
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
      jsonb_build_object('enabled',true,'label','Human review remains required','detail','This control layer prepares and records automation. It does not independently execute external communications or financial actions.'),
      jsonb_build_object('enabled',true,'label','Scope permissions enforced','detail','Rules can be managed only by the owning user, authorized business/organization members, or Lellee Admin.'),
      jsonb_build_object('enabled',true,'label','Execution engine remains off','detail','Rules may be configured before the production execution worker is activated.')
    )
  );
end $$;

create or replace function public.toggle_automation_rule(p_rule_id uuid)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare r public.automation_rules; new_status text;
begin
  select * into r from public.automation_rules where id=p_rule_id;
  if r.id is null then return false; end if;
  if not public.can_manage_automation_scope(r.scope_type,r.scope_id,r.created_by) then raise exception 'Automation access required'; end if;
  new_status:=case when r.status='active' then 'paused' when r.status in ('draft','paused') then 'active' else r.status end;
  update public.automation_rules set status=new_status,updated_at=now() where id=p_rule_id;
  return true;
end $$;

create or replace function public.instantiate_automation_template(p_template_id uuid,p_scope_type text,p_scope_id uuid)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare t public.automation_templates; new_id uuid;
begin
  select * into t from public.automation_templates where id=p_template_id and active=true;
  if t.id is null then raise exception 'Template not found'; end if;
  if not public.can_manage_automation_scope(p_scope_type,p_scope_id,auth.uid()) then raise exception 'Automation access required'; end if;
  insert into public.automation_rules(name,description,scope_type,scope_id,trigger_event,action_type,action_config,status,created_by)
  values(t.name,t.description,p_scope_type,p_scope_id,t.trigger_event,t.action_type,t.action_config,'draft',auth.uid()) returning id into new_id;
  return new_id;
end $$;

grant execute on function public.get_my_automation_center() to authenticated;
grant execute on function public.get_coach_automation_summary(uuid) to authenticated;
grant execute on function public.get_organization_automation_summary(uuid) to authenticated;
grant execute on function public.get_automation_studio_summary() to authenticated;
grant execute on function public.toggle_automation_rule(uuid) to authenticated;
grant execute on function public.instantiate_automation_template(uuid,text,uuid) to authenticated;
revoke all on function public.get_my_automation_center() from anon;
revoke all on function public.get_coach_automation_summary(uuid) from anon;
revoke all on function public.get_organization_automation_summary(uuid) from anon;
revoke all on function public.get_automation_studio_summary() from anon;
revoke all on function public.toggle_automation_rule(uuid) from anon;
revoke all on function public.instantiate_automation_template(uuid,text,uuid) from anon;
