-- LELLEE — STEP 2: ENABLE SEVEN CONTROLLED PILOTS + QUEUE WORK
-- Does NOT make the seven programs publicly enrollable.
-- Does NOT enable external AI execution yet.

begin;

do $$
declare
  v_admin uuid;
  v_missing integer;
begin
  select user_id into v_admin
  from public.admin_user_roles
  where active=true and role in('admin','editor')
  order by case role when 'admin' then 1 else 2 end,created_at
  limit 1;

  if v_admin is null then
    raise exception 'STOP: no active Lellee admin/editor exists';
  end if;

  select count(*) into v_missing
  from (values
   ('reentry'),('caregiving'),('independent-living'),('housing-stability'),
   ('grief'),('workforce-reentry'),('family-recovery')
  ) v(slug)
  left join public.programs p on p.slug=v.slug
  where p.id is null;

  if v_missing>0 then
    raise exception 'STOP: selected pilot program record(s) missing';
  end if;

  -- These seven are lower/moderate-risk future programs in the original
  -- architecture; place their safety profile into human REVIEW, not APPROVED.
  update public.program_safety_profiles_v2 s
  set status='review',
      private_notifications_required=true,
      coach_escalation_default=false,
      organization_escalation_default=false,
      user_data_logging_level='minimal',
      review_notes='Controlled pilot enabled while program-specific safety/content/resources are reviewed. Full public activation still requires approval.',
      updated_at=now()
  from public.programs p
  where s.program_id=p.id
    and p.slug in(
      'reentry','caregiving','independent-living','housing-stability',
      'grief','workforce-reentry','family-recovery'
    )
    and s.status='draft';

  update public.programs
  set status='pilot',updated_at=now()
  where slug in(
    'reentry','caregiving','independent-living','housing-stability',
    'grief','workforce-reentry','family-recovery'
  )
  and status in('planned','paused','pilot');

  insert into public.app_public_settings(key,value)
  values
   ('pilot_program_runtime_enabled','true'),
   ('program_builder_enabled','true'),
   ('content_studio_enabled','true'),
   ('public_multi_program_launch_enabled','false'),
   ('agent_worker_enabled','false'),
   ('agent_external_execution_enabled','false'),
   ('agent_external_research_execution_enabled','false'),
   ('agent_human_review_required','true')
  on conflict(key) do update set value=excluded.value,updated_at=now();

  -- Program Builder: scaffold each pilot.
  insert into public.agent_tasks(
    agent_id,title,objective,task_type,status,priority,source_type,
    source_reference,requested_by,assigned_review_user_id,
    human_review_required,external_execution_required,due_at
  )
  select
    a.id,
    'Pilot scaffold — '||p.name,
    'Prepare a practical Lellee pilot scaffold for '||p.name||
    ': audience needs, terminology, 4-8 stages/milestones, reusable Lellee modules, daily/weekly content needs, resource categories, privacy boundaries, safety-review questions, success measures and a 30-day build checklist. This is a draft for human review only.',
    'draft','queued','high','program',p.slug,v_admin,v_admin,true,true,
    now()+interval '2 days'
  from public.programs p
  join public.agent_definitions a on a.agent_key='program-builder-assistant'
  where p.slug in(
    'reentry','caregiving','independent-living','housing-stability',
    'grief','workforce-reentry','family-recovery'
  )
  and not exists(
    select 1 from public.agent_tasks t
    where t.title='Pilot scaffold — '||p.name
      and t.status in('queued','running','needs_review','approved','completed')
  );

  -- Content QA.
  insert into public.agent_tasks(
    agent_id,title,objective,task_type,status,priority,source_type,
    source_reference,requested_by,assigned_review_user_id,
    human_review_required,external_execution_required,due_at
  )
  select
    a.id,
    'Pilot content QA — '||p.name,
    'Review the current Lellee platform structure as a template for '||p.name||
    '. Identify what can be safely reused, what must be rewritten, missing guidance, reading-level needs, unsupported-claim risks, privacy boundaries and accessibility considerations. Produce QA findings only; do not publish.',
    'qa','queued','normal','program',p.slug,v_admin,v_admin,true,true,
    now()+interval '3 days'
  from public.programs p
  join public.agent_definitions a on a.agent_key='content-qa'
  where p.slug in(
    'reentry','caregiving','independent-living','housing-stability',
    'grief','workforce-reentry','family-recovery'
  )
  and not exists(
    select 1 from public.agent_tasks t
    where t.title='Pilot content QA — '||p.name
      and t.status in('queued','running','needs_review','approved','completed')
  );

  -- Provider/public resource research.
  insert into public.agent_tasks(
    agent_id,title,objective,task_type,status,priority,source_type,
    source_reference,requested_by,assigned_review_user_id,
    human_review_required,external_execution_required,due_at
  )
  select
    a.id,
    'Pilot resource research — '||p.name,
    'Research only current public information to identify the most useful resource categories, government/nonprofit/provider types, verification sources and freshness checks for '||p.name||
    '. Prioritize U.S. and California examples where useful. Cite sources. Do not contact anyone and do not mark any provider verified.',
    'research','queued','normal','program',p.slug,v_admin,v_admin,true,true,
    now()+interval '4 days'
  from public.programs p
  join public.agent_definitions a on a.agent_key='provider-research'
  where p.slug in(
    'reentry','caregiving','independent-living','housing-stability',
    'grief','workforce-reentry','family-recovery'
  )
  and not exists(
    select 1 from public.agent_tasks t
    where t.title='Pilot resource research — '||p.name
      and t.status in('queued','running','needs_review','approved','completed')
  );

  -- Cross-program operations.
  insert into public.agent_tasks(
    agent_id,title,objective,task_type,status,priority,source_type,
    source_reference,requested_by,assigned_review_user_id,
    human_review_required,external_execution_required,due_at
  )
  select a.id,
    'Seven-program pilot rollout checklist',
    'Prepare the coordinated rollout order for the seven Lellee pilots: dependencies, content creation, safety review, resource readiness, test cases, analytics, rollback and what can proceed in parallel while the Recovery site is finalized. Human review only.',
    'workflow','queued','high','platform','pilot-7',v_admin,v_admin,true,true,
    now()+interval '1 day'
  from public.agent_definitions a
  where a.agent_key='operations-copilot'
    and not exists(
      select 1 from public.agent_tasks
      where title='Seven-program pilot rollout checklist'
        and status in('queued','running','needs_review','approved','completed')
    );

  insert into public.agent_tasks(
    agent_id,title,objective,task_type,status,priority,source_type,
    source_reference,requested_by,assigned_review_user_id,
    human_review_required,external_execution_required,due_at
  )
  select a.id,
    'Pilot release readiness review',
    'Review the seven pilot program records, safety states, unresolved blockers, worker guardrails and public-launch protections. Return blockers/warnings and a recommended review sequence. Do not approve release or change settings.',
    'qa','queued','high','platform','pilot-7',v_admin,v_admin,true,true,
    now()+interval '2 days'
  from public.agent_definitions a
  where a.agent_key='release-qa'
    and not exists(
      select 1 from public.agent_tasks
      where title='Pilot release readiness review'
        and status in('queued','running','needs_review','approved','completed')
    );
end
$$;

commit;

select slug,name,status
from public.programs
where slug in(
 'reentry','caregiving','independent-living','housing-stability',
 'grief','workforce-reentry','family-recovery'
)
order by display_order;

select status,count(*) as tasks
from public.agent_tasks
group by status
order by status;
