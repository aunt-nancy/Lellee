-- LELLEE AGENT WORKER — STEP 1
-- Additive worker support. Does NOT enable agent execution yet.

begin;

insert into public.app_public_settings(key,value)
values
 ('agent_worker_enabled','false'),
 ('agent_worker_batch_size','3'),
 ('agent_worker_version','1.0'),
 ('agent_external_execution_enabled','false'),
 ('agent_external_research_execution_enabled','false'),
 ('agent_human_review_required','true'),
 ('public_multi_program_launch_enabled','false')
on conflict(key) do update
set value=excluded.value,updated_at=now();

create or replace function public.lellee_claim_agent_tasks(p_limit integer default 3)
returns table(
  task_id uuid,
  agent_id uuid,
  agent_key text,
  agent_name text,
  agent_type text,
  agent_description text,
  title text,
  objective text,
  task_type text,
  priority text,
  source_type text,
  source_reference text,
  requested_by uuid,
  assigned_review_user_id uuid,
  human_review_required boolean,
  external_execution_required boolean
)
language plpgsql
security definer
set search_path=public,pg_temp
as $$
begin
  return query
  with picked as (
    select t.id
    from public.agent_tasks t
    join public.agent_definitions a on a.id=t.agent_id
    where t.status='queued'
      and a.status='active'
      and a.external_execution_allowed=true
    order by
      case t.priority
        when 'urgent' then 1
        when 'high' then 2
        when 'normal' then 3
        else 4
      end,
      t.created_at
    for update of t skip locked
    limit greatest(1,least(coalesce(p_limit,3),10))
  ),
  updated as (
    update public.agent_tasks t
    set status='running',updated_at=now()
    from picked p
    where t.id=p.id
    returning t.*
  )
  select
    u.id,
    a.id,
    a.agent_key,
    a.name,
    a.agent_type,
    a.description,
    u.title,
    u.objective,
    u.task_type,
    u.priority,
    u.source_type,
    u.source_reference,
    u.requested_by,
    u.assigned_review_user_id,
    u.human_review_required,
    u.external_execution_required
  from updated u
  join public.agent_definitions a on a.id=u.agent_id;
end
$$;

revoke all on function public.lellee_claim_agent_tasks(integer)
from public,anon,authenticated;
grant execute on function public.lellee_claim_agent_tasks(integer)
to service_role;

commit;

select
 to_regprocedure('public.lellee_claim_agent_tasks(integer)') is not null
   as worker_claim_function,
 (select value from public.app_public_settings
  where key='agent_worker_enabled') as worker_enabled,
 (select value from public.app_public_settings
  where key='agent_external_execution_enabled') as external_execution;
