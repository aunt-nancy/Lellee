
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}};
async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error){console.warn(name,error);return null}return data}
function row(icon,title,detail,status='',klass=''){return `<div class="agent-row ${klass}"><div class="agent-icon">${icon}</div><div><b>${esc(title)}</b><small>${esc(detail||'')}</small></div><em>${esc(status||'')}</em></div>`}
async function loadWorkbench(){
 const d=await rpc('get_my_agent_workbench');if(!d)return;const s=d.summary||{};
 q('#agentWorkbenchOpen').textContent=s.open_tasks||0;q('#agentWorkbenchReview').textContent=s.needs_review||0;q('#agentWorkbenchApproved').textContent=s.approved_outputs||0;q('#agentWorkbenchAgents').textContent=s.available_agents||0;
 q('#agentWorkbenchTaskList').innerHTML=(d.tasks||[]).map(x=>row('T',x.title,`${x.agent_name} · ${x.task_type} · ${x.status}`,x.review_status||'',x.status==='failed'?'fail':x.review_status==='pending'?'attention':'' )).join('')||'<div class="approved-resource-empty">No agent tasks assigned to you.</div>';
 q('#agentWorkbenchAgentList').innerHTML=(d.agents||[]).map(x=>row('A',x.name,x.description,x.status,x.status==='active'?'ok':'' )).join('');
}
async function newWorkbenchTask(){
 const d=await rpc('get_agent_picker');if(!d?.length)return toast('No agent definitions available.',true);
 const menu=d.map((x,i)=>`${i+1}. ${x.name} — ${x.description}`).join('\n');
 const n=Number(prompt('Choose agent:\n'+menu,'1'));if(!n||!d[n-1])return;
 const title=prompt('Task title:');if(!title)return;
 const objective=prompt('What should the agent research or draft?');if(!objective)return;
 const {error}=await sb.from('agent_tasks').insert({agent_id:d[n-1].id,title,objective,task_type:'draft',status:'queued',requested_by:currentUser.id,assigned_review_user_id:currentUser.id});
 if(error)return toast(error.message,true);toast('Agent task queued for controlled execution.');loadWorkbench();
}
function setTab(tab){qa('[data-agent-tab]').forEach(b=>b.classList.toggle('active',b.dataset.agentTab===tab));['agents','tasks','reviews','prospecting','prompts','evaluations','guardrails'].forEach(x=>q('#agentPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}
async function loadOps(){
 const d=await rpc('get_agent_operations_summary');if(!d)return;const s=d.summary||{};
 q('#agentOpsAgents').textContent=s.agents||0;q('#agentOpsQueued').textContent=s.queued||0;q('#agentOpsReview').textContent=s.review||0;q('#agentOpsProspects').textContent=s.prospects||0;
 q('#agentOpsAgentList').innerHTML=(d.agents||[]).map(x=>row('A',x.name,`${x.agent_type} · ${x.capability_count} capabilities`,x.status,x.status==='active'?'ok':'attention')).join('');
 q('#agentOpsTaskList').innerHTML=(d.tasks||[]).map(x=>row('T',x.title,`${x.agent_name} · ${x.task_type} · ${x.status}`,x.review_status||'',x.status==='failed'?'fail':x.review_status==='pending'?'attention':'' )).join('');
 q('#agentOpsReviewList').innerHTML=(d.reviews||[]).map(x=>row('R',x.task_title,`${x.agent_name} · ${x.review_status}`,x.reviewer_label||'',x.review_status==='pending'?'attention':'ok')).join('')||'<div class="approved-resource-empty">No outputs awaiting human review.</div>';
 q('#agentOpsProspectList').innerHTML=(d.prospects||[]).map(x=>row('P',x.organization_name,`${x.prospect_type} · ${x.status} · ${x.source_type}`,x.research_status,x.research_status==='ready_for_review'?'attention':'' )).join('')||'<div class="approved-resource-empty">No prospect targets.</div>';
 q('#agentOpsPromptList').innerHTML=(d.prompts||[]).map(x=>row('Q',x.name,`${x.prompt_type} · v${x.version_number}`,x.status)).join('');
 q('#agentOpsEvaluationList').innerHTML=(d.evaluations||[]).map(x=>row('E',x.suite_name,`${x.agent_name} · ${x.case_count} cases`,x.latest_status||'not run',x.latest_status==='pass'?'ok':'attention')).join('');
 q('#agentOpsGuardrailList').innerHTML=(d.guardrails||[]).map(x=>`<article class="agent-guardrail"><b>${x.enabled?'✓ ':'! '}${esc(x.label)}</b><small>${esc(x.detail)}</small></article>`).join('');
}
async function addAgent(){
 const name=prompt('Agent name:');if(!name)return;
 const type=prompt('Type: operations, content_qa, provider_research, prospect_research, support_triage, release_qa, program_builder','operations')||'operations';
 const desc=prompt('Short description:','')||'Controlled Lellee operational agent.';
 const {error}=await sb.from('agent_definitions').insert({name,agent_type:type,description:desc,status:'draft',human_review_required:true,created_by:currentUser.id});
 if(error)return toast(error.message,true);loadOps();
}
async function addProspect(){
 const name=prompt('Business/organization to research:');if(!name)return;
 const type=prompt('Prospect type: organization, provider, coach, sponsor, employer, nonprofit, county','organization')||'organization';
 const source=prompt('Source type: public_web, referral, manual, event','manual')||'manual';
 const {error}=await sb.from('agent_prospect_targets').insert({organization_name:name,prospect_type:type,source_type:source,status:'research',research_status:'not_started',created_by:currentUser.id});
 if(error)return toast(error.message,true);loadOps();
}
q('#agentWorkbenchNewTask')?.addEventListener('click',newWorkbenchTask);
qa('[data-agent-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.agentTab));
q('#agentOpsAddAgent')?.addEventListener('click',addAgent);
q('#agentOpsAddProspect')?.addEventListener('click',addProspect);
if(typeof showPage==='function'){const old=showPage;showPage=function(name){old(name);if(name==='agent-workbench')loadWorkbench();if(name==='agent-operations')loadOps()}}
})();
