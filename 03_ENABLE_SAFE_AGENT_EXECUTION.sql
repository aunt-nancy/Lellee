-- LELLEE — STEP 3: ENABLE SAFE AGENT EXECUTION
-- Run only after dynamic-worker HEALTH mode succeeds.

begin;

insert into public.app_public_settings(key,value)
values
 ('agent_worker_enabled','true'),
 ('agent_external_execution_enabled','true'),
 ('agent_external_research_execution_enabled','true'),
 ('agent_human_review_required','true'),
 ('agent_autonomous_outreach_enabled','false'),
 ('agent_autonomous_publishing_enabled','false'),
 ('agent_autonomous_financial_actions_enabled','false'),
 ('agent_account_permission_changes_enabled','false'),
 ('agent_sensitive_user_data_access_enabled','false'),
 ('agent_journal_access_enabled','false'),
 ('agent_private_message_access_enabled','false'),
 ('agent_safety_activity_access_enabled','false'),
 ('agent_secret_access_enabled','false'),
 ('agent_clinical_inference_enabled','false'),
 ('agent_clinical_decision_enabled','false'),
 ('agent_sensitive_marketing_targeting_enabled','false'),
 ('public_multi_program_launch_enabled','false')
on conflict(key) do update set value=excluded.value,updated_at=now();

update public.agent_definitions
set external_execution_allowed=true,
    autonomous_action_allowed=false,
    human_review_required=true,
    status='active',
    updated_at=now()
where agent_key in(
 'operations-copilot','content-qa','provider-research',
 'release-qa','program-builder-assistant','knowledge-assistant'
);

update public.agent_tool_registry
set enabled=true,
    requires_human_approval=true,
    blocked_reason=null,
    active=true
where tool_key='public_web_research';

update public.agent_tool_registry
set enabled=false,
    requires_human_approval=true,
    active=true
where tool_key in(
 'publish_content','send_email','send_sms','send_direct_message',
 'payment_write','account_permission_write','journal_read',
 'private_message_read','safety_activity_read','secret_read'
);

commit;

select key,value
from public.app_public_settings
where key in(
 'agent_worker_enabled',
 'agent_external_execution_enabled',
 'agent_external_research_execution_enabled',
 'agent_human_review_required',
 'agent_autonomous_outreach_enabled',
 'agent_autonomous_publishing_enabled',
 'public_multi_program_launch_enabled'
)
order by key;
