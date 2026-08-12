
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}};
let coachBusiness=null,organization=null,isAdmin=false;

async function rpc(name,args={}){
 const {data,error}=await sb.rpc(name,args);
 if(error){console.warn(name,error);return null}
 return data;
}
function row(icon,title,detail,status='',id=''){
 return `<div class="automation-row"><div class="automation-icon">${icon}</div><div><b>${esc(title)}</b><small>${esc(detail||'')}</small></div>${id?`<button data-rule-toggle="${id}">${esc(status||'Toggle')}</button>`:`<em>${esc(status||'')}</em>`}</div>`;
}
function setStudioTab(tab){qa('[data-automation-tab]').forEach(b=>b.classList.toggle('active',b.dataset.automationTab===tab));['rules','templates','queue','history','guardrails'].forEach(x=>q('#automationPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}
async function loadUserAutomation(){
 const d=await rpc('get_my_automation_center');if(!d)return;
 const s=d.summary||{};
 q('#automationActiveCount').textContent=s.active_rules||0;q('#automationTodayCount').textContent=s.actions_today||0;q('#automationReminderCount').textContent=s.upcoming_reminders||0;q('#automationPausedCount').textContent=s.paused_rules||0;
 q('#automationUserRuleList').innerHTML=(d.rules||[]).map(x=>row('⚙',x.name,x.description,x.status,x.id)).join('')||'<div class="approved-resource-empty">No personal automations yet.</div>';
 q('#automationUserRunList').innerHTML=(d.runs||[]).map(x=>row('✓',x.rule_name,`${x.status} · ${new Date(x.created_at).toLocaleString()}`)).join('')||'<div class="approved-resource-empty">No automation history yet.</div>';
}
async function loadCoachAutomation(){
 const {data:b}=await sb.from('coach_businesses').select('id,business_name,public_name').eq('owner_user_id',currentUser.id).maybeSingle();coachBusiness=b||null;if(!b)return;
 q('#coachAutomationName').textContent=b.public_name||b.business_name;
 const d=await rpc('get_coach_automation_summary',{p_business_id:b.id});if(!d)return;
 const s=d.summary||{};
 q('#coachAutomationRules').textContent=s.active_rules||0;q('#coachAutomationDue').textContent=s.followups_due||0;q('#coachAutomationCreated').textContent=s.tasks_created||0;q('#coachAutomationRuns').textContent=s.recent_runs||0;
 q('#coachAutomationRuleList').innerHTML=(d.rules||[]).map(x=>row('◎',x.name,`${x.trigger_event} → ${x.action_type}`,x.status,x.id)).join('')||'<div class="approved-resource-empty">No coach automations.</div>';
 q('#coachAutomationRunList').innerHTML=(d.runs||[]).map(x=>row('✓',x.rule_name,`${x.status} · ${new Date(x.created_at).toLocaleString()}`)).join('')||'<div class="approved-resource-empty">No recent runs.</div>';
}
async function loadOrgAutomation(){
 const {data:o}=await sb.from('organizations').select('id,name,public_name').eq('owner_user_id',currentUser.id).maybeSingle();organization=o||null;if(!o)return;
 q('#orgAutomationName').textContent=o.public_name||o.name;
 const d=await rpc('get_organization_automation_summary',{p_organization_id:o.id});if(!d)return;
 const s=d.summary||{};
 q('#orgAutomationRules').textContent=s.active_rules||0;q('#orgAutomationInvites').textContent=s.pending_invites||0;q('#orgAutomationFollowups').textContent=s.followups_due||0;q('#orgAutomationRuns').textContent=s.recent_runs||0;
 q('#orgAutomationRuleList').innerHTML=(d.rules||[]).map(x=>row('▣',x.name,`${x.trigger_event} → ${x.action_type}`,x.status,x.id)).join('')||'<div class="approved-resource-empty">No organization automations.</div>';
 q('#orgAutomationRunList').innerHTML=(d.runs||[]).map(x=>row('✓',x.rule_name,`${x.status} · ${new Date(x.created_at).toLocaleString()}`)).join('')||'<div class="approved-resource-empty">No recent runs.</div>';
}
async function checkAdmin(){const {data}=await sb.from('admin_user_roles').select('role,active').eq('user_id',currentUser.id).maybeSingle();isAdmin=!!data?.active&&['admin','editor'].includes(data.role);return isAdmin}
async function loadStudio(){
 if(!await checkAdmin())return;
 const d=await rpc('get_automation_studio_summary');if(!d)return;
 const s=d.summary||{};
 q('#automationStudioRules').textContent=s.rules||0;q('#automationStudioActive').textContent=s.active||0;q('#automationStudioRuns').textContent=s.runs_30d||0;q('#automationStudioFailures').textContent=s.failures_30d||0;
 q('#automationRuleList').innerHTML=(d.rules||[]).map(x=>row('⚙',x.name,`${x.scope_type} · ${x.trigger_event} → ${x.action_type}`,x.status,x.id)).join('')||'<div class="approved-resource-empty">No automation rules.</div>';
 q('#automationTemplateList').innerHTML=(d.templates||[]).map(x=>`<article class="automation-template"><b>${esc(x.name)}</b><small>${esc(x.description||'')}</small><button data-template-id="${x.id}">Use Template</button></article>`).join('')||'<div class="approved-resource-empty">No templates.</div>';
 q('#automationQueueList').innerHTML=(d.queue||[]).map(x=>row('→',x.rule_name,`${x.status} · due ${new Date(x.run_after).toLocaleString()}`)).join('')||'<div class="approved-resource-empty">Queue is clear.</div>';
 q('#automationHistoryList').innerHTML=(d.history||[]).map(x=>row(x.status==='failed'?'!':'✓',x.rule_name,`${x.status} · ${new Date(x.created_at).toLocaleString()}`)).join('')||'<div class="approved-resource-empty">No history.</div>';
 q('#automationGuardrailList').innerHTML=(d.guardrails||[]).map(x=>`<article class="automation-guardrail"><b>${x.enabled?'✓ ':'! '}${esc(x.label)}</b><small>${esc(x.detail)}</small></article>`).join('');
 qa('[data-template-id]').forEach(b=>b.onclick=()=>instantiateTemplate(b.dataset.templateId));
 wireToggles();
}
async function toggleRule(id){
 const {data,error}=await sb.rpc('toggle_automation_rule',{p_rule_id:id});
 if(error)return toast(error.message,true);toast(data?'Automation updated.':'Unable to update.',!data);
 if(q('#page-automation-studio')?.classList.contains('active'))loadStudio();
 else if(q('#page-coach-automation')?.classList.contains('active'))loadCoachAutomation();
 else if(q('#page-organization-automation')?.classList.contains('active'))loadOrgAutomation();
 else loadUserAutomation();
}
function wireToggles(){qa('[data-rule-toggle]').forEach(b=>b.onclick=()=>toggleRule(b.dataset.ruleToggle))}
async function instantiateTemplate(id){
 const {error}=await sb.rpc('instantiate_automation_template',{p_template_id:id,p_scope_type:'platform',p_scope_id:null});
 if(error)return toast(error.message,true);toast('Template added as a draft rule.');loadStudio();
}
async function addRule(scopeType,scopeId){
 const name=prompt('Automation name:');if(!name)return;
 const trigger=prompt('Trigger event (example: milestone_due, consultation_requested, session_scheduled, sponsored_invite_created):','milestone_due');if(!trigger)return;
 const action=prompt('Action type (create_notification, create_followup, create_task, create_reminder):','create_notification');if(!action)return;
 const {error}=await sb.from('automation_rules').insert({name,scope_type:scopeType,scope_id:scopeId,trigger_event:trigger,action_type:action,status:'draft',created_by:currentUser.id});
 if(error)return toast(error.message,true);toast('Draft automation created.');
 if(scopeType==='coach_business')loadCoachAutomation();else if(scopeType==='organization')loadOrgAutomation();else loadStudio();
}
q('#automationAddRule')?.addEventListener('click',()=>addRule('platform',null));
q('#coachAutomationAddRule')?.addEventListener('click',()=>{if(coachBusiness)addRule('coach_business',coachBusiness.id)});
q('#orgAutomationAddRule')?.addEventListener('click',()=>{if(organization)addRule('organization',organization.id)});
qa('[data-automation-tab]').forEach(b=>b.onclick=()=>setStudioTab(b.dataset.automationTab));

if(typeof showPage==='function'){
 const old=showPage;showPage=function(name){old(name);if(name==='automation-center')loadUserAutomation().then(wireToggles);if(name==='coach-automation')loadCoachAutomation().then(wireToggles);if(name==='organization-automation')loadOrgAutomation().then(wireToggles);if(name==='automation-studio')loadStudio()};
}
})();
