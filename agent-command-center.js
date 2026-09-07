(() => {
'use strict';
const TEAM_ORDER=['growth-revenue','build-quality','operations-success','research-resources'];
const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=v=>String(v||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const state={data:{},agents:[],tasks:[],promotions:[],teams:[],selectedTeam:'all',loading:false};
const ctx=()=>window.LelleeAuthContext?.client?window.LelleeAuthContext:null;

function ensureUI(){
  const page=document.querySelector('#page-agent-workbench .approved-inner');
  const summary=document.querySelector('#page-agent-workbench .agent-summary-grid');
  if(!page||!summary)return false;
  if(!document.getElementById('agentCommandCenter')){
    const box=document.createElement('section');box.id='agentCommandCenter';box.className='agent-command-center';
    box.innerHTML=`<div class="agent-command-head"><div><span class="approved-kicker">AGENT COMMAND CENTER</span><h3>Agent team</h3><p>Run approved model work, review every output, and hand approved findings into internal follow-up without autonomous publishing, outreach or financial action.</p></div><div class="agent-command-actions"><button class="approved-link" id="agentCCRefresh">Refresh</button></div></div><div class="agent-team-grid" id="agentCCTeams"></div><div class="agent-final-status" id="agentFinalStatus">Loading Agent Operations…</div><div class="agent-command-note" id="agentCCNote"></div>`;
    summary.insertAdjacentElement('afterend',box);
  }
  const agentSection=document.getElementById('agentWorkbenchAgentList')?.closest('.agent-card');
  if(agentSection&&!document.getElementById('agentTeamFilter')){
    const filter=document.createElement('div');filter.id='agentTeamFilter';filter.className='agent-team-filter';
    filter.innerHTML='<button class="active" data-agent-team-filter="all">All agents</button><button data-agent-team-filter="growth-revenue">Growth & Revenue</button><button data-agent-team-filter="build-quality">Build & Quality</button><button data-agent-team-filter="operations-success">Operations & Success</button><button data-agent-team-filter="research-resources">Research & Resources</button>';
    agentSection.querySelector('h3')?.insertAdjacentElement('afterend',filter);
  }
  if(!document.getElementById('agentFinalHandoffs')){
    const taskSection=document.getElementById('agentWorkbenchTaskList')?.closest('.agent-card');
    if(taskSection){const h=document.createElement('section');h.id='agentFinalHandoffs';h.className='agent-card';h.innerHTML='<div class="commerce-panel-head"><div><span class="approved-kicker">APPROVED HANDOFFS</span><h3>Human-owned next actions</h3></div></div><div class="agent-handoff-list" id="agentHandoffList"></div>';taskSection.insertAdjacentElement('afterend',h)}
  }
  if(!document.getElementById('agentCCDialog')){const d=document.createElement('dialog');d.id='agentCCDialog';d.className='agent-cc-dialog';d.innerHTML='<div class="agent-cc-dialog-inner" id="agentCCDialogInner"></div>';document.body.appendChild(d)}
  return true;
}

async function load(){
  if(state.loading||!ensureUI())return;
  const bridge=ctx(),user=bridge?.getCurrentUser?.();
  if(!bridge||!user){document.getElementById('agentFinalStatus').textContent='Sign in with Agent Workbench access.';return}
  state.loading=true;
  try{
    const {data,error}=await bridge.client.rpc('lellee_agent_command_center_v1');if(error)throw error;
    state.data=data||{};state.agents=state.data.agents||[];state.tasks=state.data.tasks||[];state.promotions=state.data.promotions||[];state.teams=state.data.teams||[];render();
  }catch(err){const n=document.getElementById('agentFinalStatus');if(n){n.className='agent-final-status warn';n.textContent=err.message||String(err)}}finally{state.loading=false}
}

function render(){
  const d=state.data,s=d.summary||{},r=d.roster||{},settings=d.settings||{};
  const active=Number(r.active_count||state.agents.length),expected=Number(r.expected_count||r.configured_count||active);
  const put=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
  put('agentWorkbenchOpen',s.open_tasks||0);put('agentWorkbenchReview',s.needs_review||0);put('agentWorkbenchApproved',s.approved_outputs||0);put('agentWorkbenchAgents',active);
  const head=document.querySelector('#agentCommandCenter .agent-command-head h3');if(head)head.textContent=`${active} active specialists, one human-controlled operating team`;
  const guardOk=settings.human_review===true&&settings.autonomous_outreach===false&&settings.autonomous_publishing===false&&settings.autonomous_finance===false&&settings.sensitive_data_access===false;
  const status=document.getElementById('agentFinalStatus');if(status){status.className=`agent-final-status ${active===expected&&guardOk?'good':'warn'}`;status.innerHTML=`<b>${active}/${expected} configured agents active.</b> Worker: ${settings.worker_enabled?'ON':'OFF'} · Model execution: ${settings.external_execution?'ON':'OFF'} · Public research: ${settings.external_research?'ON':'OFF'} · Human review: REQUIRED · Open handoffs: ${s.open_handoffs||0}.`}
  renderTeams();renderAgents();renderTasks();renderHandoffs();
  const note=document.getElementById('agentCCNote');if(note)note.innerHTML='<b>Authority boundary:</b> agents can research, analyze and draft. Every output remains human-reviewed. Approved handoffs create internal follow-up records only; they do not publish, contact anyone, move money, change permissions or expose sensitive participant data.';
}

function renderTeams(){
  const host=document.getElementById('agentCCTeams');if(!host)return;const map=Object.fromEntries(state.teams.map(x=>[x.team_key,x]));
  host.innerHTML=TEAM_ORDER.map(k=>{const t=map[k]||{team_label:label(k),agents:0,open:0,review:0,purpose:'Specialist operating team.'};return `<article class="agent-team-card"><b>${esc(t.team_label)}</b><p>${esc(t.purpose||'')}</p><div class="agent-team-metrics"><span><strong>${t.agents||0}</strong>Agents</span><span><strong>${t.open||0}</strong>Open</span><span><strong>${t.review||0}</strong>Review</span></div></article>`}).join('');
}
function renderAgents(){
  const host=document.getElementById('agentWorkbenchAgentList');if(!host)return;const rows=state.agents.filter(a=>state.selectedTeam==='all'||a.team_key===state.selectedTeam);
  host.innerHTML=rows.length?rows.map(a=>`<article class="agent-list-card"><div class="row"><div><b>${esc(a.name)}</b><small>${esc(a.description||'')}</small></div><span class="pill">${esc(a.team_label||'Specialist')}</span></div><small>${esc(a.role_label||label(a.agent_type))} · Human review: ${a.human_review_required?'required':'check'} · Model execution: ${a.external_execution_allowed?'allowed':'off'} · Autonomous action: ${a.autonomous_action_allowed?'enabled':'off'}</small></article>`).join(''):'<div class="agent-cc-empty">No agents in this team.</div>';
}
function renderTasks(){
  const host=document.getElementById('agentWorkbenchTaskList');if(!host)return;const rows=state.tasks.filter(t=>state.selectedTeam==='all'||t.team_key===state.selectedTeam);
  host.innerHTML=rows.length?rows.map(t=>{const o=t.latest_output,pending=o?.review_status==='pending',approved=o?.review_status==='approved';return `<article class="agent-list-card"><div class="row"><div><b>${esc(t.title)}</b><small>${esc(t.agent_name)} · ${esc(label(t.task_type))} · ${esc(label(t.priority))}</small></div><span class="pill">${esc(label(t.status))}</span></div>${o?`<div class="agent-task-output"><b>${esc(label(o.output_type))}</b> · Review: ${esc(label(o.review_status))}<br>${esc((o.output_text||'').slice(0,300))}${(o.output_text||'').length>300?'…':''}</div>`:''}<div class="agent-task-actions">${o?`<button data-agent-view-output="${o.id}">View output</button>`:''}${pending?`<button class="primary" data-agent-review="approved" data-output-id="${o.id}">Approve</button><button data-agent-review="changes_requested" data-output-id="${o.id}">Needs changes</button><button class="warn" data-agent-review="rejected" data-output-id="${o.id}">Reject</button><button data-agent-approve-handoff="${o.id}">Approve & Handoff</button>`:''}${approved?`<button data-agent-handoff="${o.id}">Create Handoff</button>`:''}</div></article>`}).join(''):'<div class="agent-cc-empty">No agent tasks are visible to this account.</div>';
}
function renderHandoffs(){const host=document.getElementById('agentHandoffList');if(!host)return;host.innerHTML=state.promotions.length?state.promotions.map(p=>`<article class="agent-handoff-card"><div class="row"><div><b>${esc(p.task_title)}</b><small>${esc(p.agent_name)} · ${esc(label(p.promotion_type))}</small></div><span class="pill">${esc(label(p.status))}</span></div>${p.status==='ready_for_human_action'?`<div class="agent-handoff-actions"><button class="primary" data-handoff-status="completed" data-promotion-id="${p.id}">Mark completed</button><button data-handoff-status="cancelled" data-promotion-id="${p.id}">Cancel</button></div>`:''}</article>`).join(''):'<div class="agent-cc-empty">No approved internal handoffs yet.</div>'}

function openNewTask(){const d=document.getElementById('agentCCDialog'),inner=document.getElementById('agentCCDialogInner');inner.innerHTML=`<div class="agent-cc-dialog-head"><div><span class="approved-kicker">NEW AGENT TASK</span><h3>Queue human-reviewed model work</h3><p>Do not paste passwords, API keys, private journals, private messages, safety/crisis activity or other excluded sensitive data.</p></div><button class="agent-cc-close" data-agent-dialog-close>×</button></div><form id="agentCCNewTaskForm"><div class="agent-cc-form"><label>Agent<select id="agentCCAgent" required>${state.agents.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join('')}</select></label><label>Task type<select id="agentCCTaskType"><option value="research">Research</option><option value="draft">Draft</option><option value="qa">QA</option><option value="summary">Summary</option><option value="workflow">Workflow</option><option value="evaluation">Evaluation</option></select></label><label class="wide">Title<input id="agentCCTitle" maxlength="180" required></label><label class="wide">Objective<textarea id="agentCCObjective" maxlength="3000" required></textarea></label><label>Priority<select id="agentCCPriority"><option value="normal">Normal</option><option value="high">High</option><option value="low">Low</option><option value="urgent">Urgent</option></select></label><label>Public web research<select id="agentCCExternal"><option value="false">Not required</option><option value="true">Required</option></select></label></div><div class="agent-cc-footer"><button type="button" data-agent-dialog-close>Cancel</button><button class="primary" type="submit">Queue task</button></div></form>`;d.showModal()}
async function createTask(){const c=ctx();const {error}=await c.client.rpc('lellee_create_agent_task_v1',{p_agent_id:document.getElementById('agentCCAgent').value,p_title:document.getElementById('agentCCTitle').value.trim(),p_objective:document.getElementById('agentCCObjective').value.trim(),p_task_type:document.getElementById('agentCCTaskType').value,p_priority:document.getElementById('agentCCPriority').value,p_external_execution_required:document.getElementById('agentCCExternal').value==='true'});if(error)throw error;document.getElementById('agentCCDialog').close();await load()}
function findOutput(id){for(const t of state.tasks)if(t.latest_output?.id===id)return{output:t.latest_output,task:t};return null}
function openOutput(id){const x=findOutput(id);if(!x)return;const d=document.getElementById('agentCCDialog'),inner=document.getElementById('agentCCDialogInner'),o=x.output,t=x.task;inner.innerHTML=`<div class="agent-cc-dialog-head"><div><span class="approved-kicker">AGENT OUTPUT</span><h3>${esc(t.title)}</h3><p>${esc(t.agent_name)} · ${esc(label(o.output_type))} · Review ${esc(label(o.review_status))}</p></div><button class="agent-cc-close" data-agent-dialog-close>×</button></div><div style="white-space:pre-wrap;line-height:1.55;font-size:.82rem;color:#403846">${esc(o.output_text||'')}</div>`;d.showModal()}
const handoffOptions=[['internal_reference','Internal reference'],['staff_followup','Staff follow-up'],['growth_followup','Growth follow-up'],['research_followup','Research follow-up'],['content_followup','Content follow-up'],['release_followup','Release follow-up'],['support_followup','Support follow-up']];
function chooseHandoff(){const raw=prompt(`Choose internal handoff destination:\n${handoffOptions.map((x,i)=>`${i+1}. ${x[1]}`).join('\n')}`,'1');if(raw===null)return null;const n=Number(raw);if(!Number.isInteger(n)||n<1||n>handoffOptions.length)return null;return{type:handoffOptions[n-1][0],note:prompt('Optional handoff note:','')||''}}
async function review(id,decision,withHandoff=false){let note='';if(decision!=='approved'){note=prompt(decision==='changes_requested'?'What should change?':'Reason for rejection?','')||'';if(!note.trim())return}const h=withHandoff?chooseHandoff():null;if(withHandoff&&!h)return;const {error}=await ctx().client.rpc('lellee_review_agent_output_v1',{p_output_id:id,p_decision:decision,p_review_note:note||null,p_promotion_type:h?.type||null,p_promotion_note:h?.note||null});if(error)throw error;await load()}
async function promote(id){const h=chooseHandoff();if(!h)return;const {error}=await ctx().client.rpc('lellee_promote_approved_agent_output_v1',{p_output_id:id,p_promotion_type:h.type,p_promotion_note:h.note||null});if(error)throw error;await load()}
async function updateHandoff(id,status){const {error}=await ctx().client.rpc('lellee_update_agent_promotion_v1',{p_promotion_id:id,p_status:status});if(error)throw error;await load()}

document.addEventListener('click',e=>{if(e.target.closest('[data-page="agent-workbench"]'))setTimeout(load,40);if(e.target.closest('#agentCCRefresh'))load();if(e.target.closest('#agentWorkbenchNewTask')){e.preventDefault();openNewTask()}const f=e.target.closest('[data-agent-team-filter]');if(f){state.selectedTeam=f.dataset.agentTeamFilter;document.querySelectorAll('[data-agent-team-filter]').forEach(b=>b.classList.toggle('active',b===f));renderAgents();renderTasks()}const v=e.target.closest('[data-agent-view-output]');if(v)openOutput(v.dataset.agentViewOutput);const r=e.target.closest('[data-agent-review]');if(r)review(r.dataset.outputId,r.dataset.agentReview).catch(x=>alert(x.message));const ah=e.target.closest('[data-agent-approve-handoff]');if(ah)review(ah.dataset.agentApproveHandoff,'approved',true).catch(x=>alert(x.message));const h=e.target.closest('[data-agent-handoff]');if(h)promote(h.dataset.agentHandoff).catch(x=>alert(x.message));const hs=e.target.closest('[data-handoff-status]');if(hs)updateHandoff(hs.dataset.promotionId,hs.dataset.handoffStatus).catch(x=>alert(x.message));if(e.target.closest('[data-agent-dialog-close]'))document.getElementById('agentCCDialog')?.close()},true);
document.addEventListener('submit',e=>{if(e.target?.id==='agentCCNewTaskForm'){e.preventDefault();createTask().catch(x=>alert(x.message))}});
const boot=()=>{ensureUI();if(document.getElementById('page-agent-workbench')?.classList.contains('active'))load()};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();window.LelleeAgentCommandCenter={load};
})();