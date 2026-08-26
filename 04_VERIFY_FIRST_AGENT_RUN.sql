-- LELLEE — STEP 4: VERIFY FIRST AGENT RUN
-- READ ONLY.

select
 t.title,
 a.name as agent,
 t.status as task_status,
 t.priority,
 r.status as latest_run_status,
 r.model_provider_label,
 r.model_label,
 o.output_type,
 o.review_status,
 o.created_at as output_created_at
from public.agent_tasks t
join public.agent_definitions a on a.id=t.agent_id
left join lateral (
  select *
  from public.agent_runs r
  where r.task_id=t.id
  order by r.created_at desc
  limit 1
) r on true
left join lateral (
  select *
  from public.agent_outputs o
  where o.task_id=t.id
  order by o.created_at desc
  limit 1
) o on true
where t.source_reference in(
 'reentry','caregiving','independent-living','housing-stability',
 'grief','workforce-reentry','family-recovery','pilot-7'
)
order by t.updated_at desc
limit 20;

select status,count(*) as task_count
from public.agent_tasks
group by status
order by status;
