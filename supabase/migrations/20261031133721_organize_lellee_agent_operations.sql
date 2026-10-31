-- Lellee agent organization repair. Existing authority and product approvals are preserved.

update public.agent_definitions set description='Accessibility and practical usability. Inputs: Supplied interface, document, or workbook version and relevant test results. Deliverable: Specific findings about keyboard and screen-reader use, headings, contrast, text resizing, motion, accessible alternatives, and worksheet writing space. Next owner: Content QA or implementation owner; Release QA tracks resolution. Draft only; human approval remains required.',updated_at=now() where agent_key='accessibility-qa';

update public.agent_definitions set description='Editorial quality, evidence wording, and companion-workbook consistency. Inputs: Supplied versioned journey, book, training, or workbook draft with references. Deliverable: Prioritized corrections, claim-to-source checks, duplication and reading-level findings, and consistency of exercises with their source; no claim of clinical validation. Next owner: Program Builder or publishing editor for revisions; Release QA for readiness findings. Draft only; human approval remains required.',updated_at=now() where agent_key='content-qa';

update public.agent_definitions set description='Instructions and help after product decisions. Inputs: Approved features, journey scopes, and changed user workflows. Deliverable: Clear Help Center, FAQ, onboarding, and workbook-use instructions; distinguish drafted, available, and planned features. Next owner: Content QA and Operations Copilot. Draft only; human approval remains required.',updated_at=now() where agent_key='knowledge-assistant';

update public.agent_definitions set description='Architecture across the full approved Lellee portfolio. Inputs: Approved opportunity brief and current program registry; identify conflicts between approved program count and database record count. Deliverable: Journey or module proposal with audience, scope, sequence, practical exercises, accessibility, progress, companion-workbook outline, evidence gaps, dependencies, and release criteria. Next owner: Content QA and Accessibility QA, then Operations Copilot for owner review. Draft only; human approval remains required.',updated_at=now() where agent_key='program-builder-assistant';

update public.agent_definitions set description='Release acceptance evidence and unresolved gates. Inputs: Actual QA results, proposed scope, approvals, and unresolved defects. Deliverable: Passed, failed, not-run, and waiting-for-approval checks with evidence; no invented pass and no release approval. Next owner: Operations Copilot for a concise owner decision. Draft only; human approval remains required.',updated_at=now() where agent_key='release-qa';

update public.agent_definitions set description='Independent-coach business development. Inputs: Approved independent-coaching business tools and supplied non-sensitive business metadata. Deliverable: Service and group-program proposals, capacity planning, onboarding improvements, and optional approved companion materials; no clinical judgments. Next owner: Coach Quality and Operations Copilot; Growth & Marketing after approval. Draft only; human approval remains required.',updated_at=now() where agent_key='coach-business-growth';

update public.agent_definitions set description='Consumer positioning and acquisition strategy. Inputs: Approved opportunity brief, verified product facts, approved offers, and supplied aggregate performance. Deliverable: Messaging, SEO and content themes, campaign concepts, and proposed conversion tests; link journey, book, and workbook when approved. Next owner: Operations Copilot for approval; Social Media Growth receives approved messaging. Draft only; human approval remains required.',updated_at=now() where agent_key='growth-marketing';

update public.agent_definitions set description='Organization and distribution partner discovery. Inputs: Approved target types and public organization information. Deliverable: Ranked public-business partner, sponsor, employer, nonprofit, or distribution prospects with sources and uncertainty. Next owner: Growth & Marketing and Operations Copilot; contact requires owner authorization. Draft only; human approval remains required.',updated_at=now() where agent_key='prospect-research';

update public.agent_definitions set description='Commercial viability and pricing scenarios. Inputs: Approved product scope, current authorized pricing, public comparables, and supplied aggregate revenue and cost data. Deliverable: Assumption-labelled pricing and packaging options, production cost considerations, and journey-book-workbook economics; do not change approved prices. Next owner: Operations Copilot for the owner decision; Growth & Marketing after approval. Draft only; human approval remains required.',updated_at=now() where agent_key='revenue-intelligence';

update public.agent_definitions set description='Social content execution drafts. Inputs: Approved messaging and supplied aggregate platform performance. Deliverable: Platform-specific draft posts and calendar; consumer and independent-coach tracks kept distinct; no automatic posting. Next owner: Growth & Marketing, then owner approval for each external action. Draft only; human approval remains required.',updated_at=now() where agent_key='social-media-growth';

update public.agent_definitions set description='Public demand, emerging needs, and journey and publishing opportunity discovery. Inputs: Current public demand signals, published research, full approved portfolio, and non-sensitive publishing research summaries. Deliverable: Ranked opportunity brief distinguishing measured demand, health need, research evidence, and untested ideas; compare existing journey, module, new journey, book, and companion workbook. Next owner: Operations Copilot for a decision brief; after owner approval, Program Builder Assistant. Draft only; human approval remains required.',updated_at=now() where agent_key='trend-demand-intelligence';

update public.agent_definitions set description='Independent-coach operational quality. Inputs: Approved credential and disclosure state, business capacity, and supplied aggregate feedback. Deliverable: Operational improvements and unresolved qualification gates; no clinical outcome ranking or automatic discipline. Next owner: Coach Business Growth and Operations Copilot. Draft only; human approval remains required.',updated_at=now() where agent_key='coach-quality';

update public.agent_definitions set description='Organization rollout, adoption, and recurring product friction. Inputs: Approved organization implementation records and supplied aggregate adoption metadata. Deliverable: Milestones, training needs, adoption risks, and unmet practical needs; never infer individual health conditions. Next owner: Support Triage, Knowledge Assistant, and Operations Copilot. Draft only; human approval remains required.',updated_at=now() where agent_key='customer-success-agent';

update public.agent_definitions set description='Coordination, missing inputs, review backlog, and handoff accountability. Inputs: Non-private roster, mission, task, output-review and handoff counts plus supplied approved project facts. Deliverable: One concise operating brief naming each blocker, responsible specialist, missing input, next action, and at most three essential owner decisions; identify stale work without approving it. Next owner: Relevant specialist for internal preparation; Leslie Hollis for essential approvals. Draft only; human approval remains required.',updated_at=now() where agent_key='operations-copilot';

update public.agent_definitions set description='Support routing and recurring friction. Inputs: Only support tickets explicitly supplied to the task; aggregate patterns must not identify participants. Deliverable: Recommended support routing, severity, repeated friction, and a de-identified product-needs summary. Next owner: Customer Success and Knowledge Assistant; aggregate opportunity suggestions to Trend & Demand through Operations Copilot. Draft only; human approval remains required.',updated_at=now() where agent_key='support-triage';

update public.agent_definitions set description='Initial public provider and service research. Inputs: A specific supplied provider or resource research queue. Deliverable: Sourced public identity, services, licensing references where relevant, and unresolved verification questions. Next owner: Human resource verifier; Resource Freshness handles subsequent change checks. Draft only; human approval remains required.',updated_at=now() where agent_key='provider-research';

update public.agent_definitions set description='Changes to already-listed resources and provider information. Inputs: A specific supplied resource list, prior source dates, and public pages. Deliverable: Changed links, hours, services, availability, and dates; mark discrepancies for human reverification. Next owner: Human resource verifier; Provider Research for unresolved initial facts. Draft only; human approval remains required.',updated_at=now() where agent_key='resource-freshness';

update public.agent_definitions set description='Professional training evidence and assessments. Inputs: Participant-availability event and an explicitly approved training and certification mapping. Deliverable: Sourced professional-training draft, objectives, applied assessments, mixed findings, and scope limits; no duplication of the consumer workbook. Next owner: Content QA and Release QA, through Operations Copilot. Draft only; human approval remains required.',updated_at=now() where agent_key='professional-training-evidence-builder';

insert into public.agent_team_memberships(agent_id,team_key,team_label,role_label,active)
select id,'build-quality','Build & Quality','Professional training evidence and assessments',true
from public.agent_definitions where agent_key='professional-training-evidence-builder'
on conflict(agent_id,team_key) do update set team_label=excluded.team_label,role_label=excluded.role_label,active=true;

update public.agent_mission_templates set objective='Owner: Accessibility QA Agent. Inputs required: Supplied interface, document, or workbook version and relevant test results. Required deliverable: Specific findings about keyboard and screen-reader use, headings, contrast, text resizing, motion, accessible alternatives, and worksheet writing space. Handoff: Content QA or implementation owner; Release QA tracks resolution. Trigger: New or revised surface; weekly review when inputs change. If an input is missing, report the missing input instead of inventing facts. Preserve all existing user approvals, pricing, program status and Recovery behavior. Do not publish, activate programs, contact anyone, change permissions, spend or move money, or access excluded private participant content. All output is a draft for human review.',updated_at=now() where mission_key='launch-accessibility-audit';

update public.agent_mission_templates set objective='Owner: Content QA Agent. Inputs required: Supplied versioned journey, book, training, or workbook draft with references. Required deliverable: Prioritized corrections, claim-to-source checks, duplication and reading-level findings, and consistency of exercises with their source; no claim of clinical validation. Handoff: Program Builder or publishing editor for revisions; Release QA for readiness findings. Trigger: New or revised supplied content; weekly review when inputs change. If an input is missing, report the missing input instead of inventing facts. Preserve all existing user approvals, pricing, program status and Recovery behavior. Do not publish, activate programs, contact anyone, change permissions, spend or move money, or access excluded private participant content. All output is a draft for human review.',updated_at=now() where mission_key='launch-content-consistency';

update public.agent_mission_templates set objective='Owner: Knowledge Assistant. Inputs required: Approved features, journey scopes, and changed user workflows. Required deliverable: Clear Help Center, FAQ, onboarding, and workbook-use instructions; distinguish drafted, available, and planned features. Handoff: Content QA and Operations Copilot. Trigger: Approved feature or workflow changes; weekly input review. If an input is missing, report the missing input instead of inventing facts. Preserve all existing user approvals, pricing, program status and Recovery behavior. Do not publish, activate programs, contact anyone, change permissions, spend or move money, or access excluded private participant content. All output is a draft for human review.',updated_at=now() where mission_key='launch-knowledge-priority';

update public.agent_mission_templates set objective='Owner: Program Builder Assistant. Inputs required: Approved opportunity brief and current program registry; identify conflicts between approved program count and database record count. Required deliverable: Journey or module proposal with audience, scope, sequence, practical exercises, accessibility, progress, companion-workbook outline, evidence gaps, dependencies, and release criteria. Handoff: Content QA and Accessibility QA, then Operations Copilot for owner review. Trigger: After an approved opportunity or a supplied program configuration change. If an input is missing, report the missing input instead of inventing facts. Preserve all existing user approvals, pricing, program status and Recovery behavior. Do not publish, activate programs, contact anyone, change permissions, spend or move money, or access excluded private participant content. All output is a draft for human review. The old seven-program restriction is superseded for planning. Consider the full approved portfolio, while distinguishing approved launch scope from planned records. Do not create a duplicate Family Recovery V2 or change Recovery. A database flag does not establish public availability.',updated_at=now() where mission_key='launch-program-builder-closeout';

update public.agent_mission_templates set objective='Owner: Release QA Agent. Inputs required: Actual QA results, proposed scope, approvals, and unresolved defects. Required deliverable: Passed, failed, not-run, and waiting-for-approval checks with evidence; no invented pass and no release approval. Handoff: Operations Copilot for a concise owner decision. Trigger: Daily eligibility review of changed release evidence; no empty rerun. If an input is missing, report the missing input instead of inventing facts. Preserve all existing user approvals, pricing, program status and Recovery behavior. Do not publish, activate programs, contact anyone, change permissions, spend or move money, or access excluded private participant content. All output is a draft for human review.',updated_at=now() where mission_key='launch-release-readiness';

update public.agent_mission_templates set objective='Owner: Coach Business Growth Agent. Inputs required: Approved independent-coaching business tools and supplied non-sensitive business metadata. Required deliverable: Service and group-program proposals, capacity planning, onboarding improvements, and optional approved companion materials; no clinical judgments. Handoff: Coach Quality and Operations Copilot; Growth & Marketing after approval. Trigger: Weekly with supplied business inputs. If an input is missing, report the missing input instead of inventing facts. Preserve all existing user approvals, pricing, program status and Recovery behavior. Do not publish, activate programs, contact anyone, change permissions, spend or move money, or access excluded private participant content. All output is a draft for human review.',updated_at=now() where mission_key='launch-coach-growth-plan';

update public.agent_mission_templates set objective='Owner: Trend & Demand Intelligence Agent. Inputs required: Current public demand signals, published research, full approved portfolio, and non-sensitive publishing research summaries. Required deliverable: Ranked opportunity brief distinguishing measured demand, health need, research evidence, and untested ideas; compare existing journey, module, new journey, book, and companion workbook. Handoff: Operations Copilot for a decision brief; after owner approval, Program Builder Assistant. Trigger: Daily eligibility check; a pending current review pauses the next run. If an input is missing, report the missing input instead of inventing facts. Preserve all existing user approvals, pricing, program status and Recovery behavior. Do not publish, activate programs, contact anyone, change permissions, spend or move money, or access excluded private participant content. All output is a draft for human review. Use live public web research and at least three distinct cited sources. Separate public demand signals from clinical prevalence or treatment evidence. Do not equate a common health problem with demonstrated willingness to buy. Assess Stress and Overwhelm and Sleep and Rest, including a possible Running on Empty companion workbook, as candidates only. Compare them with the full approved portfolio and flag program-count discrepancies for reconciliation. Include recommendation, supporting evidence, counterevidence, overlap, proposed format, workbook concept, next owner, and exact owner decision needed.',updated_at=now() where mission_key='launch-demand-intelligence';

update public.agent_mission_templates set objective='Owner: Growth & Marketing Agent. Inputs required: Approved opportunity brief, verified product facts, approved offers, and supplied aggregate performance. Required deliverable: Messaging, SEO and content themes, campaign concepts, and proposed conversion tests; link journey, book, and workbook when approved. Handoff: Operations Copilot for approval; Social Media Growth receives approved messaging. Trigger: Weekly when approved inputs change. If an input is missing, report the missing input instead of inventing facts. Preserve all existing user approvals, pricing, program status and Recovery behavior. Do not publish, activate programs, contact anyone, change permissions, spend or move money, or access excluded private participant content. All output is a draft for human review.',updated_at=now() where mission_key='launch-growth-plan';

update public.agent_mission_templates set objective='Owner: Prospect Research Agent. Inputs required: Approved target types and public organization information. Required deliverable: Ranked public-business partner, sponsor, employer, nonprofit, or distribution prospects with sources and uncertainty. Handoff: Growth & Marketing and Operations Copilot; contact requires owner authorization. Trigger: Weekly with an approved target brief. If an input is missing, report the missing input instead of inventing facts. Preserve all existing user approvals, pricing, program status and Recovery behavior. Do not publish, activate programs, contact anyone, change permissions, spend or move money, or access excluded private participant content. All output is a draft for human review.',updated_at=now() where mission_key='launch-prospect-revenue-list';

update public.agent_mission_templates set objective='Owner: Revenue Intelligence Agent. Inputs required: Approved product scope, current authorized pricing, public comparables, and supplied aggregate revenue and cost data. Required deliverable: Assumption-labelled pricing and packaging options, production cost considerations, and journey-book-workbook economics; do not change approved prices. Handoff: Operations Copilot for the owner decision; Growth & Marketing after approval. Trigger: Weekly when relevant inputs change. If an input is missing, report the missing input instead of inventing facts. Preserve all existing user approvals, pricing, program status and Recovery behavior. Do not publish, activate programs, contact anyone, change permissions, spend or move money, or access excluded private participant content. All output is a draft for human review.',updated_at=now() where mission_key='launch-revenue-scenarios';

update public.agent_mission_templates set objective='Owner: Social Media Growth Agent. Inputs required: Approved messaging and supplied aggregate platform performance. Required deliverable: Platform-specific draft posts and calendar; consumer and independent-coach tracks kept distinct; no automatic posting. Handoff: Growth & Marketing, then owner approval for each external action. Trigger: Approved campaign or changed performance; daily input review. If an input is missing, report the missing input instead of inventing facts. Preserve all existing user approvals, pricing, program status and Recovery behavior. Do not publish, activate programs, contact anyone, change permissions, spend or move money, or access excluded private participant content. All output is a draft for human review.',updated_at=now() where mission_key='launch-social-campaign';

update public.agent_mission_templates set objective='Owner: Coach Quality Agent. Inputs required: Approved credential and disclosure state, business capacity, and supplied aggregate feedback. Required deliverable: Operational improvements and unresolved qualification gates; no clinical outcome ranking or automatic discipline. Handoff: Coach Business Growth and Operations Copilot. Trigger: Weekly or supplied material operational change. If an input is missing, report the missing input instead of inventing facts. Preserve all existing user approvals, pricing, program status and Recovery behavior. Do not publish, activate programs, contact anyone, change permissions, spend or move money, or access excluded private participant content. All output is a draft for human review.',updated_at=now() where mission_key='launch-coach-quality-framework';

update public.agent_mission_templates set objective='Owner: Customer Success Agent. Inputs required: Approved organization implementation records and supplied aggregate adoption metadata. Required deliverable: Milestones, training needs, adoption risks, and unmet practical needs; never infer individual health conditions. Handoff: Support Triage, Knowledge Assistant, and Operations Copilot. Trigger: Weekly or an explicitly supplied organization event. If an input is missing, report the missing input instead of inventing facts. Preserve all existing user approvals, pricing, program status and Recovery behavior. Do not publish, activate programs, contact anyone, change permissions, spend or move money, or access excluded private participant content. All output is a draft for human review.',updated_at=now() where mission_key='launch-customer-success-playbook';

update public.agent_mission_templates set objective='Owner: Operations Copilot. Inputs required: Non-private roster, mission, task, output-review and handoff counts plus supplied approved project facts. Required deliverable: One concise operating brief naming each blocker, responsible specialist, missing input, next action, and at most three essential owner decisions; identify stale work without approving it. Handoff: Relevant specialist for internal preparation; Leslie Hollis for essential approvals. Trigger: Daily eligibility check with a real aggregate snapshot; pending current review pauses next run. If an input is missing, report the missing input instead of inventing facts. Preserve all existing user approvals, pricing, program status and Recovery behavior. Do not publish, activate programs, contact anyone, change permissions, spend or move money, or access excluded private participant content. All output is a draft for human review.',updated_at=now() where mission_key='launch-operations-priorities';

update public.agent_mission_templates set objective='Owner: Support Triage Agent. Inputs required: Only support tickets explicitly supplied to the task; aggregate patterns must not identify participants. Required deliverable: Recommended support routing, severity, repeated friction, and a de-identified product-needs summary. Handoff: Customer Success and Knowledge Assistant; aggregate opportunity suggestions to Trend & Demand through Operations Copilot. Trigger: A supplied ticket or aggregate support pattern; no unrelated private access. If an input is missing, report the missing input instead of inventing facts. Preserve all existing user approvals, pricing, program status and Recovery behavior. Do not publish, activate programs, contact anyone, change permissions, spend or move money, or access excluded private participant content. All output is a draft for human review.',updated_at=now() where mission_key='launch-support-patterns';

update public.agent_mission_templates set objective='Owner: Provider Research Agent. Inputs required: A specific supplied provider or resource research queue. Required deliverable: Sourced public identity, services, licensing references where relevant, and unresolved verification questions. Handoff: Human resource verifier; Resource Freshness handles subsequent change checks. Trigger: New or changed supplied provider queue; weekly input review. If an input is missing, report the missing input instead of inventing facts. Preserve all existing user approvals, pricing, program status and Recovery behavior. Do not publish, activate programs, contact anyone, change permissions, spend or move money, or access excluded private participant content. All output is a draft for human review.',updated_at=now() where mission_key='launch-provider-research-framework';

update public.agent_mission_templates set objective='Owner: Resource Freshness Agent. Inputs required: A specific supplied resource list, prior source dates, and public pages. Required deliverable: Changed links, hours, services, availability, and dates; mark discrepancies for human reverification. Handoff: Human resource verifier; Provider Research for unresolved initial facts. Trigger: Weekly when a defined resource queue is supplied; urgent public changes as surfaced. If an input is missing, report the missing input instead of inventing facts. Preserve all existing user approvals, pricing, program status and Recovery behavior. Do not publish, activate programs, contact anyone, change permissions, spend or move money, or access excluded private participant content. All output is a draft for human review.',updated_at=now() where mission_key='launch-resource-freshness';

insert into public.agent_mission_templates(mission_key,agent_id,team_key,title,objective,task_type,default_priority,external_execution_required,cadence_label,human_review_required,active)
select 'training-evidence-on-approved-journey-event',id,'build-quality','Professional training evidence after an approved journey event',
'Draft only after a verified participant-availability event and explicit approval of the training/certification mapping. Use current authoritative sources, preserve mixed findings, and hand drafts to Content QA and Release QA through Operations Copilot. No automatic course publication, certification approval, checkout, or requeue of cancelled work.',
'draft','normal',true,'event-driven: approved availability and training mapping',true,false
from public.agent_definitions where agent_key='professional-training-evidence-builder'
on conflict(mission_key) do nothing;

CREATE OR REPLACE FUNCTION public.lellee_agent_command_center_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  uid uuid:=auth.uid();
  admin_ok boolean:=false;
  missing text[];
begin
  if uid is null then raise exception 'Sign in required'; end if;
  if not public.has_agent_ops_access() then raise exception 'Agent Workbench access required'; end if;

  admin_ok:=public.is_lellee_admin();

  select array_agg(x.agent_key order by x.agent_key)
  into missing
  from (values
    ('operations-copilot'),('content-qa'),('provider-research'),('prospect-research'),
    ('support-triage'),('release-qa'),('program-builder-assistant'),('knowledge-assistant'),
    ('trend-demand-intelligence'),('social-media-growth'),('growth-marketing'),
    ('coach-business-growth'),('revenue-intelligence'),('resource-freshness'),
    ('accessibility-qa'),('customer-success-agent'),('coach-quality'),('professional-training-evidence-builder')
  ) x(agent_key)
  where not exists(
    select 1 from public.agent_definitions a
    where a.agent_key=x.agent_key and a.status='active'
  );

  return jsonb_build_object(
    'can_admin',admin_ok,
    'roster',jsonb_build_object(
      'active_count',(select count(*) from public.agent_definitions where status='active'),
      'expected_count',18,
      'missing',coalesce(to_jsonb(missing),'[]'::jsonb),
      'first_missions_queued',(
        select count(*) from public.agent_tasks
        where source_type='agent_mission'
          and source_reference like 'agent-command-center-v1:%'
          and status<>'cancelled'
      )
    ),
    'settings',jsonb_build_object(
      'worker_enabled',coalesce((select value='true' from public.app_public_settings where key='agent_worker_enabled'),false),
      'external_execution',coalesce((select value='true' from public.app_public_settings where key='agent_external_execution_enabled'),false),
      'external_research',coalesce((select value='true' from public.app_public_settings where key='agent_external_research_execution_enabled'),false),
      'human_review',coalesce((select value='true' from public.app_public_settings where key='agent_human_review_required'),true),
      'autonomous_outreach',coalesce((select value='true' from public.app_public_settings where key='agent_autonomous_outreach_enabled'),false),
      'autonomous_publishing',coalesce((select value='true' from public.app_public_settings where key='agent_autonomous_publishing_enabled'),false),
      'autonomous_finance',coalesce((select value='true' from public.app_public_settings where key='agent_autonomous_financial_actions_enabled'),false),
      'sensitive_data_access',coalesce((select value='true' from public.app_public_settings where key='agent_sensitive_user_data_access_enabled'),false)
    ),
    'summary',jsonb_build_object(
      'open_tasks',(
        select count(*) from public.agent_tasks t
        where (admin_ok or t.requested_by=uid or t.assigned_review_user_id=uid)
          and t.status not in('approved','rejected','completed','failed','cancelled')
      ),
      'needs_review',(
        select count(*)
        from public.agent_outputs o
        join public.agent_tasks t on t.id=o.task_id
        where (admin_ok or t.assigned_review_user_id=uid or t.requested_by=uid)
          and o.review_status='pending'
      ),
      'approved_outputs',(
        select count(*)
        from public.agent_outputs o
        join public.agent_tasks t on t.id=o.task_id
        where (admin_ok or t.requested_by=uid or t.assigned_review_user_id=uid)
          and o.review_status='approved'
      ),
      'open_handoffs',(
        select count(*)
        from public.agent_output_promotions p
        join public.agent_tasks t on t.id=p.task_id
        where (admin_ok or p.promoted_by=uid or t.requested_by=uid or t.assigned_review_user_id=uid)
          and p.status='ready_for_human_action'
      )
    ),
    'teams',coalesce((
      select jsonb_agg(jsonb_build_object(
        'team_key',c.team_key,
        'team_label',c.team_label,
        'purpose',c.purpose,
        'recommended_review_rhythm',c.recommended_review_rhythm,
        'agents',(
          select count(distinct m.agent_id)
          from public.agent_team_memberships m
          join public.agent_definitions a on a.id=m.agent_id
          where m.team_key=c.team_key and m.active=true and a.status='active'
        ),
        'open',(
          select count(*)
          from public.agent_tasks t
          join public.agent_team_memberships m on m.agent_id=t.agent_id and m.active=true
          where m.team_key=c.team_key
            and (admin_ok or t.requested_by=uid or t.assigned_review_user_id=uid)
            and t.status not in('approved','rejected','completed','failed','cancelled')
        ),
        'review',(
          select count(*)
          from public.agent_outputs o
          join public.agent_tasks t on t.id=o.task_id
          join public.agent_team_memberships m on m.agent_id=t.agent_id and m.active=true
          where m.team_key=c.team_key
            and (admin_ok or t.requested_by=uid or t.assigned_review_user_id=uid)
            and o.review_status='pending'
        ),
        'launch_missions',(
          select count(*)
          from public.agent_tasks t
          join public.agent_team_memberships m on m.agent_id=t.agent_id and m.active=true
          where m.team_key=c.team_key
            and t.source_type='agent_mission'
            and t.source_reference like 'agent-command-center-v1:%'
            and t.status<>'cancelled'
        )
      ) order by c.priority_order)
      from public.agent_team_operating_cadence c where c.active=true
    ),'[]'::jsonb),
    'agents',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',a.id,'agent_key',a.agent_key,'name',a.name,
        'description',a.description,'agent_type',a.agent_type,'status',a.status,
        'human_review_required',a.human_review_required,
        'external_execution_allowed',a.external_execution_allowed,
        'autonomous_action_allowed',a.autonomous_action_allowed,
        'team_key',m.team_key,'team_label',m.team_label,'role_label',m.role_label
      ) order by coalesce(m.team_key,'zz'),a.name)
      from public.agent_definitions a
      left join lateral(
        select team_key,team_label,role_label
        from public.agent_team_memberships mm
        where mm.agent_id=a.id and mm.active=true
        order by created_at limit 1
      ) m on true
      where a.status='active'
    ),'[]'::jsonb),
    'tasks',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',t.id,'agent_id',t.agent_id,'agent_name',a.name,
        'team_key',m.team_key,'title',t.title,'objective',t.objective,
        'task_type',t.task_type,'status',t.status,'priority',t.priority,
        'source_type',t.source_type,'source_reference',t.source_reference,
        'human_review_required',t.human_review_required,
        'external_execution_required',t.external_execution_required,
        'created_at',t.created_at,'updated_at',t.updated_at,
        'latest_output',(
          select jsonb_build_object(
            'id',o.id,'output_type',o.output_type,'output_text',o.output_text,
            'confidence_label',o.confidence_label,
            'citations_or_sources',o.citations_or_sources,
            'review_status',o.review_status,'created_at',o.created_at
          )
          from public.agent_outputs o
          where o.task_id=t.id
          order by o.created_at desc limit 1
        )
      ) order by t.updated_at desc)
      from public.agent_tasks t
      join public.agent_definitions a on a.id=t.agent_id
      left join lateral(
        select team_key from public.agent_team_memberships mm
        where mm.agent_id=t.agent_id and mm.active=true
        order by created_at limit 1
      ) m on true
      where admin_ok or t.requested_by=uid or t.assigned_review_user_id=uid
      limit 150
    ),'[]'::jsonb),
    'promotions',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',p.id,'output_id',p.output_id,'task_id',p.task_id,
        'task_title',t.title,'agent_name',a.name,
        'promotion_type',p.promotion_type,'promotion_note',p.promotion_note,
        'status',p.status,'promoted_at',p.promoted_at,'completed_at',p.completed_at
      ) order by p.promoted_at desc)
      from public.agent_output_promotions p
      join public.agent_tasks t on t.id=p.task_id
      join public.agent_definitions a on a.id=t.agent_id
      where admin_ok or p.promoted_by=uid or t.requested_by=uid or t.assigned_review_user_id=uid
      limit 100
    ),'[]'::jsonb)
  );
end $function$
;

insert into public.app_public_settings(key,value) values ('agent_recurring_missions_enabled','false') on conflict(key) do nothing;
insert into public.agent_audit_log(event_type,safe_metadata) values('agent_organization_corrected',jsonb_build_object('agents',18,'existing_missions_updated',17,'new_inactive_event_template',1,'authorization_expanded',false,'source','leslie-hollis-agent-organization-2026-10-31'));

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
    'pending_outputs',(select count(*) from public.agent_outputs where review_status='pending'),
    'queued_tasks',(select count(*) from public.agent_tasks where status='queued'),
    'blocked_tasks',(select count(*) from public.agent_tasks where status='blocked'),
    'open_handoffs',(select count(*) from public.agent_output_promotions where status='ready_for_human_action'),
    'portfolio_note','The database contains Recovery plus 20 additional program records. The user refers to 20 programs. Reconcile scope and naming before any count or activation change. Status flags do not prove public availability.'
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
