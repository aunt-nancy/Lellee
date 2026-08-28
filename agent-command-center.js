(() => {
  'use strict';

  const TEAM_ORDER=['growth-revenue','build-quality','operations-success','research-resources'];
  const terminal=new Set(['approved','rejected','completed','failed','cancelled']);
  const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const label=v=>String(v||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());

  let state={
    data:null,agents:[],tasks:[],promotions:[],teams:[],
    selectedTeam:'all',loading:false
  };

  function ctx(){const c=window.LelleeAuthContext;return c&&c.client?c:null}

  function ensureUI(){
    const page=document.querySelector('#page-agent-workbench .approved-inner');
    const summary=document.querySelector('#page-agent-workbench .agent-summary-grid');
    if(!page||!summary)return false;

    if(!document.getElementById('agentCommandCenter')){
      const box=document.createElement('section');
      box.id='agentCommandCenter';box.className='agent-command-center';
      box.innerHTML=`
        <div class="agent-command-head">
          <div>
            <span class="approved-kicker">AGENT COMMAND CENTER</span>
            <h3>17 specialists, one human-controlled operating team</h3>
            <p>Run approved model work, review every output, and hand approved findings into internal follow-up without autonomous publishing, outreach or financial action.</p>
          </div>
          <div class="agent-command-actions">
            <button class="approved-link" id="agentCCQueueMissions" style="display:none">Queue Missing Missions</button>
            <button class="approved-link" id="agentCCRefresh">Refresh</button>
          </div>
        </div>
        <div class="agent-team-grid" id="agentCCTeams"></div>
        <div class="agent-final-status" id="agentFinalStatus">Loading Agent Operations…</div>
        <div class="agent-command-note" id="agentCCNote"></div>`;
      summary.insertAdjacentElement('afterend',box);
    }

    const agentSection=document.getElementById('agentWorkbenchAgentList')?.closest('.agent-card');
    if(agentSection&&!document.getElementById('agentTeamFilter')){
      const filter=document.createElement('div');
      filter.id='agentTeamFilter';filter.className='agent-team-filter';
      filter.innerHTML=`
        <button class="active" data-agent-team-filter="all">All agents</button>
        <button data-agent-team-filter="growth-revenue">Growth & Revenue</button>
        <button data-agent-team-filter="build-quality">Build & Quality</button>
        <button data-agent-team-filter="operations-success">Operations & Success</button>
        <button data-agent-team-filter="research-resources">Research & Resources</button>`;
      agentSection.querySelector('h3')?.insertAdjacentElement('afterend',filter);
    }

    let handoff=document.getElementById('agentFinalHandoffs');
    const taskSection=document.getElementById('agentWorkbenchTaskList')?.closest('.agent-card');
    if(taskSection&&!handoff){
      handoff=document.createElement('section');
      handoff.id='agentFinalHandoffs';handoff.className='agent-card';
      handoff.innerHTML=`
        <div class="commerce-panel-head">
          <div><span class="approved-kicker">APPROVED HANDOFFS</span><h3>Human-owned next actions</h3></div>
        </div>
        <div class="agent-handoff-list" id="agentHandoffList"></div>`;
      taskSection.insertAdjacentElement('afterend',handoff);
    }

    if(!document.getElementById('agentCCDialog')){
      const d=document.createElement('dialog');d.id='agentCCDialog';d.className='agent-cc-dialog';
      d.innerHTML='<div class="agent-cc-dialog-inner" id="agentCCDialogInner"></div>';
      document.body.appendChild(d);
    }
    return true;
  }

  async function load(){
    if(state.loading||!ensureUI())return;
    const bridge=ctx(),user=bridge?.getCurrentUser?.();
    if(!bridge||!user){
      document.getElementById('agentFinalStatus').textContent='Sign in with Agent Workbench access.';
      return;
    }

    state.loading=true;
    try{
      const {data,error}=await bridge.client.rpc('lellee_agent_command_center_v1');
      if(error)throw error;
      state.data=data||{};
      state.agents=state.data.agents||[];
      state.tasks=state.data.tasks||[];
      state.promotions=state.data.promotions||[];
      state.teams=state.data.teams||[];
      render();
    }catch(err){
      console.error('Final Agent Command Center load failed',err);
      const n=document.getElementById('agentFinalStatus');
      if(n){
        n.className='agent-final-status warn';
        n.innerHTML=`Final Agent Operations SQL is not available yet, or this account lacks access.<br>${esc(err.message||err)}`;
      }
    }finally{state.loading=false}
  }

  function render(){
    const d=state.data||{},s=d.summary||{},r=d.roster||{},settings=d.settings||{};
    const put=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
    put('agentWorkbenchOpen',s.open_tasks||0);
    put('agentWorkbenchReview',s.needs_review||0);
    put('agentWorkbenchApproved',s.approved_outputs||0);
    put('agentWorkbenchAgents',r.active_count||state.agents.length);

    const status=document.getElementById('agentFinalStatus');
    const rosterOk=Number(r.active_count)===17 && !(r.missing||[]).length;
    const guardOk=settings.human_review===true &&
      settings.autonomous_outreach===false &&
      settings.autonomous_publishing===false &&
      settings.autonomous_finance===false &&
      settings.sensitive_data_access===false;
    if(status){
      status.className=`agent-final-status ${rosterOk&&guardOk?'good':'warn'}`;
      status.innerHTML=rosterOk
        ? `<b>17/17 agents active.</b> Worker: ${settings.worker_enabled?'ON':'OFF'} · Model execution: ${settings.external_execution?'ON':'OFF'} · Public research: ${settings.external_research?'ON':'OFF'} · Human review: REQUIRED · Open handoffs: ${s.open_handoffs||0}.`
        : `<b>Roster check:</b> ${r.active_count||0}/17 active. Missing: ${esc((r.missing||[]).join(', ')||'check installation')}.`;
    }

    const q=document.getElementById('agentCCQueueMissions');
    if(q){
      q.style.display=d.can_admin?'':'none';
      q.textContent=`Queue Missing Missions (${Math.max(0,17-Number(r.first_missions_queued||0))})`;
    }

    renderTeams();renderAgents();renderTasks();renderHandoffs();
    document.getElementById('agentCCNote').innerHTML=
      `<b>Authority boundary:</b> agents can research, analyze and draft. Every output remains human-reviewed. Approved handoffs create internal follow-up records only; they do not publish, contact anyone, move money, change permissions or expose sensitive participant data.`;
  }

  function renderTeams(){
    const host=document.getElementById('agentCCTeams');if(!host)return;
    const map=Object.fromEntries((state.teams||[]).map(x=>[x.team_key,x]));
    host.innerHTML=TEAM_ORDER.map(k=>{
      const t=map[k]||{team_key:k,team_label:label(k),agents:0,open:0,review:0,launch_missions:0,purpose:''};
      return `<article class="agent-team-card">
        <b>${esc(t.team_label)}</b><p>${esc(t.purpose||'Specialist operating team.')}</p>
        <div class="agent-team-metrics">
          <span><strong>${t.agents||0}</strong>Agents</span>
          <span><strong>${t.open||0}</strong>Open</span>
          <span><strong>${t.review||0}</strong>Review</span>
        </div>
        <small style="color:#7a7182;font-size:.61rem">${t.launch_missions||0} first mission${Number(t.launch_missions)===1?'':'s'} queued</small>
      </article>`;
    }).join('');
  }

  function renderAgents(){
    const host=document.getElementById('agentWorkbenchAgentList');if(!host)return;
    const rows=state.agents.filter(a=>state.selectedTeam==='all'||a.team_key===state.selectedTeam);
    host.innerHTML=rows.length?rows.map(a=>`
      <article class="agent-list-card">
        <div class="row">
          <div><b>${esc(a.name)}</b><small>${esc(a.description||'')}</small></div>
          <span class="pill">${esc(a.team_label||'Specialist')}</span>
        </div>
        <small>${esc(a.role_label||label(a.agent_type))} · Human review: ${a.human_review_required?'required':'check'} · Model execution: ${a.external_execution_allowed?'allowed':'off'} · Autonomous action: ${a.autonomous_action_allowed?'enabled':'off'}</small>
      </article>`).join(''):'<div class="agent-cc-empty">No agents in this team.</div>';
  }

  function renderTasks(){
    const host=document.getElementById('agentWorkbenchTaskList');if(!host)return;
    const rows=state.tasks.filter(t=>state.selectedTeam==='all'||t.team_key===state.selectedTeam);
    host.innerHTML=rows.length?rows.map(t=>{
      const o=t.latest_output||null;
      const output=o?`<div class="agent-task-output"><b>${esc(label(o.output_type))}</b> · Review: ${esc(label(o.review_status))}${o.confidence_label?` · Confidence: ${esc(label(o.confidence_label))}`:''}<br>${esc((o.output_text||'').slice(0,300))}${(o.output_text||'').length>300?'…':''}</div>`:'';
      const pending=o?.review_status==='pending';
      const approved=o?.review_status==='approved';
      return `<article class="agent-list-card">
        <div class="row"><div><b>${esc(t.title)}</b><small>${esc(t.agent_name)} · ${esc(t.source_type==='agent_mission'?'First mission':label(t.source_type||'Manual'))} · ${esc(label(t.priority))}</small></div><span class="pill">${esc(label(t.status))}</span></div>
        ${output}
        <div class="agent-task-actions">
          ${o?`<button data-agent-view-output="${o.id}" data-task-id="${t.id}">View output</button>`:''}
          ${pending?`
            <button class="primary" data-agent-review="approved" data-output-id="${o.id}">Approve</button>
            <button data-agent-review="changes_requested" data-output-id="${o.id}">Needs changes</button>
            <button class="warn" data-agent-review="rejected" data-output-id="${o.id}">Reject</button>
            <button data-agent-approve-handoff="${o.id}">Approve & Handoff</button>`:''}
          ${approved?`<button data-agent-handoff="${o.id}">Create Handoff</button>`:''}
        </div>
      </article>`;
    }).join(''):'<div class="agent-cc-empty">No agent tasks are visible to this account.</div>';
  }

  function renderHandoffs(){
    const host=document.getElementById('agentHandoffList');if(!host)return;
    host.innerHTML=state.promotions.length?state.promotions.map(p=>`
      <article class="agent-handoff-card">
        <div class="row">
          <div><b>${esc(p.task_title)}</b><small>${esc(p.agent_name)} · ${esc(label(p.promotion_type))}${p.promotion_note?' · '+esc(p.promotion_note):''}</small></div>
          <span class="pill">${esc(label(p.status))}</span>
        </div>
        ${p.status==='ready_for_human_action'?`<div class="agent-handoff-actions"><button class="primary" data-handoff-status="completed" data-promotion-id="${p.id}">Mark completed</button><button data-handoff-status="cancelled" data-promotion-id="${p.id}">Cancel</button></div>`:''}
      </article>`).join(''):'<div class="agent-cc-empty">No approved internal handoffs yet.</div>';
  }

  function openNewTask(){
    const d=document.getElementById('agentCCDialog'),inner=document.getElementById('agentCCDialogInner');
    inner.innerHTML=`
      <div class="agent-cc-dialog-head"><div><span class="approved-kicker">NEW AGENT TASK</span><h3>Queue human-reviewed model work</h3><p>Do not paste passwords, API keys, private journals, private messages, safety/crisis activity or other excluded sensitive data.</p></div><button class="agent-cc-close" data-agent-dialog-close>×</button></div>
      <form id="agentCCNewTaskForm"><div class="agent-cc-form">
        <label>Agent<select id="agentCCAgent" required>${state.agents.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join('')}</select></label>
        <label>Task type<select id="agentCCTaskType"><option value="research">Research</option><option value="draft">Draft</option><option value="qa">QA</option><option value="summary">Summary</option><option value="workflow">Workflow</option><option value="evaluation">Evaluation</option></select></label>
        <label class="wide">Title<input id="agentCCTitle" maxlength="180" required></label>
        <label class="wide">Objective<textarea id="agentCCObjective" maxlength="3000" required></textarea></label>
        <label>Priority<select id="agentCCPriority"><option value="normal">Normal</option><option value="high">High</option><option value="low">Low</option><option value="urgent">Urgent</option></select></label>
        <label>Public web research<select id="agentCCExternal"><option value="false">Not required</option><option value="true">Required</option></select></label>
      </div><div class="agent-cc-footer"><button type="button" data-agent-dialog-close>Cancel</button><button class="primary" type="submit">Queue task</button></div></form>`;
    d.showModal();
  }

  async function createTask(){
    const bridge=ctx();
    const {error}=await bridge.client.rpc('lellee_create_agent_task_v1',{
      p_agent_id:document.getElementById('agentCCAgent').value,
      p_title:document.getElementById('agentCCTitle').value.trim(),
      p_objective:document.getElementById('agentCCObjective').value.trim(),
      p_task_type:document.getElementById('agentCCTaskType').value,
      p_priority:document.getElementById('agentCCPriority').value,
      p_external_execution_required:document.getElementById('agentCCExternal').value==='true'
    });
    if(error)throw error;
    document.getElementById('agentCCDialog').close();await load();
  }

  function findOutput(id){
    for(const t of state.tasks)if(t.latest_output?.id===id)return {output:t.latest_output,task:t};
    return null;
  }

  function openOutput(id){
    const x=findOutput(id);if(!x)return;
    const {output:o,task:t}=x,d=document.getElementById('agentCCDialog'),inner=document.getElementById('agentCCDialogInner');
    const sources=Array.isArray(o.citations_or_sources)?o.citations_or_sources:[];
    inner.innerHTML=`
      <div class="agent-cc-dialog-head"><div><span class="approved-kicker">AGENT OUTPUT</span><h3>${esc(t.title)}</h3><p>${esc(t.agent_name)} · ${esc(label(o.output_type))} · Review ${esc(label(o.review_status))}${o.confidence_label?` · Confidence ${esc(label(o.confidence_label))}`:''}</p></div><button class="agent-cc-close" data-agent-dialog-close>×</button></div>
      <div style="white-space:pre-wrap;line-height:1.55;font-size:.82rem;color:#403846">${esc(o.output_text||'')}</div>
      ${sources.length?`<div class="agent-output-sources"><b>Sources</b>${sources.map(s=>`<div class="agent-output-source">${esc(s.title||s.url||JSON.stringify(s))}${s.url?` · ${esc(s.url)}`:''}</div>`).join('')}</div>`:''}`;
    d.showModal();
  }

  const promotionOptions=()=>[
    ['internal_reference','Internal reference'],
    ['staff_followup','Staff follow-up'],
    ['growth_followup','Growth follow-up'],
    ['research_followup','Research follow-up'],
    ['content_followup','Content follow-up'],
    ['release_followup','Release follow-up'],
    ['coach_ops_followup','Coach operations follow-up'],
    ['organization_ops_followup','Organization operations follow-up'],
    ['support_followup','Support follow-up']
  ];

  function chooseHandoff(){
    const promptText=promotionOptions().map((x,i)=>`${i+1}. ${x[1]}`).join('\n');
    const raw=window.prompt(`Choose internal handoff destination:\n${promptText}\n\nEnter 1-${promotionOptions().length}:`,'1');
    if(raw===null)return null;
    const n=Number(raw);if(!Number.isInteger(n)||n<1||n>promotionOptions().length){alert('Invalid handoff choice.');return null}
    const note=window.prompt('Optional handoff note:','')||'';
    return {type:promotionOptions()[n-1][0],note};
  }

  async function review(outputId,decision,withHandoff=false){
    const bridge=ctx();
    let note='';
    if(decision!=='approved'){
      note=window.prompt(decision==='changes_requested'?'What should change?':'Reason for rejection?','')||'';
      if(!note.trim())return;
    }
    let handoff=null;
    if(withHandoff){handoff=chooseHandoff();if(!handoff)return}
    const {error}=await bridge.client.rpc('lellee_review_agent_output_v1',{
      p_output_id:outputId,p_decision:decision,p_review_note:note||null,
      p_promotion_type:handoff?.type||null,p_promotion_note:handoff?.note||null
    });
    if(error)throw error;
    await load();
  }

  async function promote(outputId){
    const h=chooseHandoff();if(!h)return;
    const {error}=await ctx().client.rpc('lellee_promote_approved_agent_output_v1',{
      p_output_id:outputId,p_promotion_type:h.type,p_promotion_note:h.note||null
    });
    if(error)throw error;await load();
  }

  async function updateHandoff(id,status){
    const {error}=await ctx().client.rpc('lellee_update_agent_promotion_v1',{p_promotion_id:id,p_status:status});
    if(error)throw error;await load();
  }

  async function queueMissions(){
    const {data,error}=await ctx().client.rpc('lellee_queue_missing_agent_missions_v1');
    if(error)throw error;
    alert(`${data||0} missing first mission(s) queued.`);
    await load();
  }

  document.addEventListener('click',e=>{
    const p=e.target.closest('[data-page="agent-workbench"]');if(p)setTimeout(load,40);
    if(e.target.closest('#agentCCRefresh'))load();
    if(e.target.closest('#agentCCQueueMissions'))queueMissions().catch(err=>alert(err.message||String(err)));
    if(e.target.closest('#agentWorkbenchNewTask')){e.preventDefault();openNewTask()}

    const filter=e.target.closest('[data-agent-team-filter]');
    if(filter){
      state.selectedTeam=filter.dataset.agentTeamFilter;
      document.querySelectorAll('[data-agent-team-filter]').forEach(b=>b.classList.toggle('active',b===filter));
      renderAgents();renderTasks();
    }

    const view=e.target.closest('[data-agent-view-output]');if(view)openOutput(view.dataset.agentViewOutput);

    const rev=e.target.closest('[data-agent-review]');
    if(rev)review(rev.dataset.outputId,rev.dataset.agentReview,false).catch(err=>alert(err.message||String(err)));

    const ah=e.target.closest('[data-agent-approve-handoff]');
    if(ah)review(ah.dataset.agentApproveHandoff,'approved',true).catch(err=>alert(err.message||String(err)));

    const h=e.target.closest('[data-agent-handoff]');
    if(h)promote(h.dataset.agentHandoff).catch(err=>alert(err.message||String(err)));

    const hs=e.target.closest('[data-handoff-status]');
    if(hs)updateHandoff(hs.dataset.promotionId,hs.dataset.handoffStatus).catch(err=>alert(err.message||String(err)));

    if(e.target.closest('[data-agent-dialog-close]'))document.getElementById('agentCCDialog')?.close();
  },true);

  document.addEventListener('submit',e=>{
    if(e.target?.id==='agentCCNewTaskForm'){
      e.preventDefault();createTask().catch(err=>alert(err.message||String(err)));
    }
  });

  const boot=()=>{
    ensureUI();
    const page=document.getElementById('page-agent-workbench');
    if(page?.classList.contains('active'))load();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

  window.LelleeAgentCommandCenter={load};
})();