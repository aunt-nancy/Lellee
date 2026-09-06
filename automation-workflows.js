
(()=>{
'use strict';

const q=s=>document.querySelector(s);
const qa=s=>[...document.querySelectorAll(s)];
const NOTICE='Automation is not enabled in the current Lellee release.';

function text(id,value){const el=q('#'+id);if(el)el.textContent=value}
function empty(id,message=NOTICE){const el=q('#'+id);if(el)el.innerHTML=`<div class="approved-resource-empty">${message}</div>`}
function disable(selector){qa(selector).forEach(el=>{el.disabled=true;el.hidden=true;el.setAttribute('aria-disabled','true')})}

function renderUser(){
  text('automationActiveCount','0');
  text('automationTodayCount','0');
  text('automationReminderCount','0');
  text('automationPausedCount','0');
  empty('automationUserRuleList');
  empty('automationUserRunList','Automation history is unavailable while Automation is off.');
  disable('#automationAddRule');
}

function renderCoach(){
  text('coachAutomationRules','0');
  text('coachAutomationDue','0');
  text('coachAutomationCreated','0');
  text('coachAutomationRuns','0');
  const rules=q('#coachAutomationRuleList');
  if(rules)rules.innerHTML=`<div class="coach-ops-warning"><b>Coach Automation OFF</b><br>${NOTICE}</div>`;
  const runs=q('#coachAutomationRunList');
  if(runs)runs.innerHTML='<div class="coach-ops-empty">Automation runs are unavailable while Coach Automation is off.</div>';
  disable('#coachAutomationAddRule');
}

function renderOrganization(){
  text('orgAutomationRules','0');
  text('orgAutomationInvites','0');
  text('orgAutomationFollowups','0');
  text('orgAutomationRuns','0');
  empty('orgAutomationRuleList');
  empty('orgAutomationRunList','Automation runs are unavailable while Automation is off.');
  disable('#orgAutomationAddRule');
}

function renderStudio(){
  text('automationStudioRules','0');
  text('automationStudioActive','0');
  text('automationStudioRuns','0');
  text('automationStudioFailures','0');
  empty('automationRuleList');
  empty('automationTemplateList','Automation templates are unavailable while Automation is off.');
  empty('automationQueueList','Automation queue is unavailable while Automation is off.');
  empty('automationHistoryList','Automation history is unavailable while Automation is off.');
  const guard=q('#automationGuardrailList');
  if(guard)guard.innerHTML=`<article class="automation-guardrail"><b>✓ Release guardrail active</b><small>${NOTICE}</small></article>`;
  disable('#automationAddRule,[data-template-id],[data-rule-toggle]');
}

function render(name){
  if(name==='automation-center')renderUser();
  if(name==='coach-automation')renderCoach();
  if(name==='organization-automation')renderOrganization();
  if(name==='automation-studio')renderStudio();
}

function blockAutomationAction(event){
  const target=event.target.closest('#automationAddRule,#coachAutomationAddRule,#orgAutomationAddRule,[data-template-id],[data-rule-toggle]');
  if(!target)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if(typeof window.alert==='function')window.alert(NOTICE);
}

document.addEventListener('click',blockAutomationAction,true);

if(typeof window.showPage==='function'){
  const prior=window.showPage;
  window.showPage=function(name){
    const result=prior.apply(this,arguments);
    setTimeout(()=>render(name),0);
    return result;
  };
}

function boot(){
  renderUser();
  renderCoach();
  renderOrganization();
  renderStudio();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

window.LelleeAutomationReleaseGuard={enabled:false,message:NOTICE,render};
})();
