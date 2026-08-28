
(() => {
  'use strict';

  const TEAM_ORDER = ['growth-revenue','build-quality','operations-success','research-resources'];
  const TEAM_FALLBACK = {
    'trend-demand-intelligence':['growth-revenue','Growth & Revenue'],
    'social-media-growth':['growth-revenue','Growth & Revenue'],
    'growth-marketing':['growth-revenue','Growth & Revenue'],
    'coach-business-growth':['growth-revenue','Growth & Revenue'],
    'revenue-intelligence':['growth-revenue','Growth & Revenue'],
    'prospect-research':['growth-revenue','Growth & Revenue'],

    'content-qa':['build-quality','Build & Quality'],
    'release-qa':['build-quality','Build & Quality'],
    'program-builder-assistant':['build-quality','Build & Quality'],
    'knowledge-assistant':['build-quality','Build & Quality'],
    'accessibility-qa':['build-quality','Build & Quality'],

    'operations-copilot':['operations-success','Operations & Success'],
    'support-triage':['operations-success','Operations & Success'],
    'customer-success-agent':['operations-success','Operations & Success'],
    'coach-quality':['operations-success','Operations & Success'],

    'provider-research':['research-resources','Research & Resources'],
    'resource-freshness':['research-resources','Research & Resources']
  };
  const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const terminal = new Set(['approved','rejected','completed','failed','cancelled']);

  let state = {
    agents: [], memberships: [], tasks: [], outputs: [], command: [],
    selectedTeam: 'all', loading: false
  };

  function ctx(){
    const c = window.LelleeAuthContext;
    return c && c.client ? c : null;
  }

  function teamFor(agent){
    const m = state.memberships.find(x => x.agent_id === agent.id && x.active !== false);
    if(m) return [m.team_key,m.team_label || m.team_key];
    return TEAM_FALLBACK[agent.agent_key] || ['other','Other'];
  }

  function ensureUI(){
    const page = document.querySelector('#page-agent-workbench .approved-inner');
    const summary = document.querySelector('#page-agent-workbench .agent-summary-grid');
    if(!page || !summary) return false;

    if(!document.getElementById('agentCommandCenter')){
      const box = document.createElement('section');
      box.id = 'agentCommandCenter';
      box.className = 'agent-command-center';
      box.innerHTML = `
        <div class="agent-command-head">
          <div>
            <span class="approved-kicker">AGENT COMMAND CENTER</span>
            <h3>17 specialists, organized as one operating team</h3>
            <p>See team workload, first missions and human-review status without giving agents autonomous authority.</p>
          </div>
          <div class="agent-command-actions">
            <button class="approved-link" id="agentCCRefresh">Refresh</button>
          </div>
        </div>
        <div class="agent-team-grid" id="agentCCTeams"></div>
        <div class="agent-command-note" id="agentCCNote">Loading team status…</div>`;
      summary.insertAdjacentElement('afterend', box);
    }

    const agentSection = document.getElementById('agentWorkbenchAgentList')?.closest('.agent-card');
    if(agentSection && !document.getElementById('agentTeamFilter')){
      const filter = document.createElement('div');
      filter.id = 'agentTeamFilter';
      filter.className = 'agent-team-filter';
      filter.innerHTML = `
        <button class="active" data-agent-team-filter="all">All agents</button>
        <button data-agent-team-filter="growth-revenue">Growth & Revenue</button>
        <button data-agent-team-filter="build-quality">Build & Quality</button>
        <button data-agent-team-filter="operations-success">Operations & Success</button>
        <button data-agent-team-filter="research-resources">Research & Resources</button>`;
      agentSection.querySelector('h3')?.insertAdjacentElement('afterend',filter);
    }

    if(!document.getElementById('agentCCDialog')){
      const dialog = document.createElement('dialog');
      dialog.id = 'agentCCDialog';
      dialog.className = 'agent-cc-dialog';
      dialog.innerHTML = `<div class="agent-cc-dialog-inner" id="agentCCDialogInner"></div>`;
      document.body.appendChild(dialog);
    }
    return true;
  }

  async function safeSelect(table, query){
    try{
      const res = await query;
      if(res.error) return {data:[],error:res.error};
      return {data:res.data || [],error:null};
    }catch(error){ return {data:[],error}; }
  }

  async function load(){
    if(state.loading) return;
    if(!ensureUI()) return;
    const bridge = ctx();
    const user = bridge?.getCurrentUser?.();
    if(!bridge || !user){
      document.getElementById('agentCCNote').textContent='Sign in with an account that has Agent Workbench access.';
      return;
    }
    state.loading = true;
    const sb = bridge.client;
    document.getElementById('agentCCNote').textContent='Refreshing agent operations…';

    try{
      const agentsR = await safeSelect('agent_definitions',
        sb.from('agent_definitions')
          .select('id,agent_key,name,description,agent_type,status,human_review_required,external_execution_allowed,autonomous_action_allowed')
          .eq('status','active').order('name')
      );
      if(agentsR.error) throw agentsR.error;
      state.agents = agentsR.data;

      const memR = await safeSelect('agent_team_memberships',
        sb.from('agent_team_memberships')
          .select('agent_id,team_key,team_label,role_label,active').eq('active',true)
      );
      state.memberships = memR.data;

      const taskR = await safeSelect('agent_tasks',
        sb.from('agent_tasks')
          .select('id,agent_id,title,objective,task_type,status,priority,source_type,source_reference,requested_by,assigned_review_user_id,human_review_required,external_execution_required,created_at,updated_at')
          .order('updated_at',{ascending:false}).limit(100)
      );
      if(taskR.error) throw taskR.error;
      state.tasks = taskR.data;

      state.outputs = [];
      const ids = state.tasks.map(t=>t.id);
      if(ids.length){
        const outR = await safeSelect('agent_outputs',
          sb.from('agent_outputs')
            .select('id,task_id,output_type,output_text,confidence_label,review_status,created_at')
            .in('task_id',ids).order('created_at',{ascending:false})
        );
        state.outputs = outR.data;
      }

      const ccR = await safeSelect('agent_team_command_summary',
        sb.from('agent_team_command_summary').select('*')
      );
      state.command = ccR.data;

      render();
    }catch(err){
      console.error('Agent Command Center load failed',err);
      document.getElementById('agentCCNote').innerHTML =
        `<span class="agent-cc-error">Agent Workbench could not load: ${esc(err.message || err)}</span>`;
    }finally{
      state.loading = false;
    }
  }

  function latestOutput(taskId){
    return state.outputs
      .filter(o=>o.task_id===taskId)
      .sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)))[0] || null;
  }

  function render(){
    const open = state.tasks.filter(t=>!terminal.has(t.status)).length;
    const pending = state.outputs.filter(o=>o.review_status==='pending').length;
    const approved = state.outputs.filter(o=>o.review_status==='approved').length;

    const put=(id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };
    put('agentWorkbenchOpen',open);
    put('agentWorkbenchReview',pending);
    put('agentWorkbenchApproved',approved);
    put('agentWorkbenchAgents',state.agents.length);

    renderTeams();
    renderAgents();
    renderTasks();

    document.getElementById('agentCCNote').innerHTML =
      `<b>Controlled operating mode:</b> ${state.agents.length} active agents. Human review is required. Publishing, outreach, payments, permission changes and sensitive-data access remain outside this command center.`;
  }

  function renderTeams(){
    const host=document.getElementById('agentCCTeams');
    if(!host) return;
    const byTeam = {};
    for(const a of state.agents){
      const [key,label] = teamFor(a);
      (byTeam[key] ||= {label,agents:[]}).agents.push(a);
    }
    const commandMap = Object.fromEntries((state.command||[]).map(x=>[x.team_key,x]));
    host.innerHTML = TEAM_ORDER.map(key=>{
      const g=byTeam[key] || {label:key,agents:[]};
      const agentIds = new Set(g.agents.map(a=>a.id));
      const tasks = state.tasks.filter(t=>agentIds.has(t.agent_id));
      const active = tasks.filter(t=>!terminal.has(t.status)).length;
      const review = tasks.filter(t=>latestOutput(t.id)?.review_status==='pending').length;
      const cmd = commandMap[key];
      const missions = cmd?.launch_missions ?? tasks.filter(t=>t.source_type==='agent_mission').length;
      return `<article class="agent-team-card">
        <b>${esc(g.label)}</b>
        <p>${teamPurpose(key)}</p>
        <div class="agent-team-metrics">
          <span><strong>${g.agents.length}</strong>Agents</span>
          <span><strong>${active}</strong>Open</span>
          <span><strong>${review}</strong>Review</span>
        </div>
        <small style="color:#7a7182;font-size:.61rem">${missions} launch mission${missions===1?'':'s'} visible</small>
      </article>`;
    }).join('');
  }

  function teamPurpose(key){
    return ({
      'growth-revenue':'Demand, social, prospects, marketing, coach growth and revenue.',
      'build-quality':'Content, program structure, knowledge, accessibility and release QA.',
      'operations-success':'Operations, support, customer success and coach quality.',
      'research-resources':'Provider/resource research and freshness verification preparation.'
    })[key] || 'Specialist operating team.';
  }

  function renderAgents(){
    const host=document.getElementById('agentWorkbenchAgentList');
    if(!host) return;
    const list = state.agents.filter(a=>{
      if(state.selectedTeam==='all') return true;
      return teamFor(a)[0]===state.selectedTeam;
    });
    host.innerHTML = list.length ? list.map(a=>{
      const [key,label]=teamFor(a);
      return `<article class="agent-list-card">
        <div class="row">
          <div><b>${esc(a.name)}</b><small>${esc(a.description || '')}</small></div>
          <span class="pill">${esc(label)}</span>
        </div>
        <small>Human review: ${a.human_review_required?'required':'check'} · Autonomous action: ${a.autonomous_action_allowed?'enabled':'off'}</small>
      </article>`;
    }).join('') : `<div class="agent-cc-empty">No agents in this team.</div>`;
  }

  function renderTasks(){
    const host=document.getElementById('agentWorkbenchTaskList');
    if(!host) return;
    const agentMap=Object.fromEntries(state.agents.map(a=>[a.id,a]));
    host.innerHTML = state.tasks.length ? state.tasks.map(t=>{
      const a=agentMap[t.agent_id];
      const o=latestOutput(t.id);
      const source = t.source_type==='agent_mission' ? 'First mission' : (t.source_type || 'Manual');
      const output = o ? `<div class="agent-task-output"><b>${esc(o.output_type)}</b> · Review: ${esc(o.review_status)}<br>${esc((o.output_text||'').slice(0,280))}${(o.output_text||'').length>280?'…':''}</div>` : '';
      const reviewButtons = o && o.review_status==='pending' ? `
        <button class="primary" data-agent-review="approved" data-output-id="${o.id}" data-task-id="${t.id}">Approve</button>
        <button data-agent-review="changes_requested" data-output-id="${o.id}" data-task-id="${t.id}">Needs changes</button>
        <button class="warn" data-agent-review="rejected" data-output-id="${o.id}" data-task-id="${t.id}">Reject</button>` : '';
      return `<article class="agent-list-card">
        <div class="row">
          <div>
            <b>${esc(t.title)}</b>
            <small>${esc(a?.name || 'Agent')} · ${esc(source)} · ${esc(t.priority)} priority</small>
          </div>
          <span class="pill">${esc(t.status)}</span>
        </div>
        ${output}
        <div class="agent-task-actions">
          ${o?`<button data-agent-view-output="${o.id}">View output</button>`:''}
          ${reviewButtons}
        </div>
      </article>`;
    }).join('') : `<div class="agent-cc-empty">No agent tasks are visible to this account yet.</div>`;
  }

  function openNewTask(){
    const dialog=document.getElementById('agentCCDialog');
    const inner=document.getElementById('agentCCDialogInner');
    inner.innerHTML = `
      <div class="agent-cc-dialog-head">
        <div><span class="approved-kicker">NEW AGENT TASK</span><h3>Queue work for human-reviewed execution</h3><p>The agent prepares work; a person remains responsible for review and any external action.</p></div>
        <button class="agent-cc-close" data-agent-dialog-close>×</button>
      </div>
      <form id="agentCCNewTaskForm">
        <div class="agent-cc-form">
          <label>Agent<select id="agentCCAgent" required>
            ${state.agents.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join('')}
          </select></label>
          <label>Task type<select id="agentCCTaskType">
            <option value="research">Research</option><option value="draft">Draft</option>
            <option value="qa">QA</option><option value="summary">Summary</option>
            <option value="workflow">Workflow</option><option value="evaluation">Evaluation</option>
          </select></label>
          <label class="wide">Title<input id="agentCCTitle" maxlength="180" required placeholder="Short task title"></label>
          <label class="wide">Objective<textarea id="agentCCObjective" maxlength="3000" required placeholder="What should the agent prepare for human review?"></textarea></label>
          <label>Priority<select id="agentCCPriority"><option>normal</option><option>high</option><option>low</option><option>urgent</option></select></label>
          <label><span>Execution</span><select id="agentCCExternal"><option value="false">Internal / supplied context</option><option value="true">Public web research required</option></select></label>
        </div>
        <div class="agent-cc-footer">
          <button type="button" data-agent-dialog-close>Cancel</button>
          <button class="primary" type="submit">Queue task</button>
        </div>
      </form>`;
    dialog.showModal();
  }

  async function createTask(){
    const bridge=ctx(), user=bridge?.getCurrentUser?.();
    if(!bridge||!user) throw new Error('You must be signed in.');
    const row={
      agent_id:document.getElementById('agentCCAgent').value,
      title:document.getElementById('agentCCTitle').value.trim(),
      objective:document.getElementById('agentCCObjective').value.trim(),
      task_type:document.getElementById('agentCCTaskType').value,
      status:'queued',
      priority:document.getElementById('agentCCPriority').value,
      source_type:'manual_workbench',
      source_reference:'agent-workbench-ui-2026-08-27',
      requested_by:user.id,
      assigned_review_user_id:user.id,
      human_review_required:true,
      external_execution_required:document.getElementById('agentCCExternal').value==='true'
    };
    const {error}=await bridge.client.from('agent_tasks').insert(row);
    if(error) throw error;
    document.getElementById('agentCCDialog').close();
    await load();
  }

  function openOutput(id){
    const o=state.outputs.find(x=>x.id===id);
    if(!o) return;
    const dialog=document.getElementById('agentCCDialog');
    const inner=document.getElementById('agentCCDialogInner');
    inner.innerHTML=`
      <div class="agent-cc-dialog-head">
        <div><span class="approved-kicker">AGENT OUTPUT</span><h3>${esc(o.output_type)}</h3><p>Review status: ${esc(o.review_status)}${o.confidence_label?` · Confidence: ${esc(o.confidence_label)}`:''}</p></div>
        <button class="agent-cc-close" data-agent-dialog-close>×</button>
      </div>
      <div style="white-space:pre-wrap;line-height:1.55;font-size:.82rem;color:#403846">${esc(o.output_text||'')}</div>`;
    dialog.showModal();
  }

  async function reviewOutput(outputId,taskId,status){
    const bridge=ctx(), user=bridge?.getCurrentUser?.();
    if(!bridge||!user) return;
    let note='';
    if(status!=='approved') note=window.prompt(status==='changes_requested'?'What should be changed?':'Reason for rejection?','') || '';
    const insert=await bridge.client.from('agent_human_reviews').insert({
      output_id:outputId,reviewer_user_id:user.id,review_status:status,review_note:note||null
    });
    if(insert.error){ alert(insert.error.message); return; }

    const outUpdate=await bridge.client.from('agent_outputs').update({review_status:status}).eq('id',outputId);
    if(outUpdate.error){
      alert('Review was recorded, but this account cannot update the output status directly. An admin can finalize it.');
    }else{
      const taskStatus = status==='approved' ? 'approved' : (status==='rejected' ? 'rejected' : 'needs_review');
      await bridge.client.from('agent_tasks').update({status:taskStatus}).eq('id',taskId);
    }
    await load();
  }

  document.addEventListener('click', e=>{
    const pageBtn=e.target.closest('[data-page="agent-workbench"]');
    if(pageBtn) setTimeout(load,50);

    if(e.target.closest('#agentCCRefresh')) load();
    if(e.target.closest('#agentWorkbenchNewTask')){ e.preventDefault(); openNewTask(); }

    const filter=e.target.closest('[data-agent-team-filter]');
    if(filter){
      state.selectedTeam=filter.dataset.agentTeamFilter;
      document.querySelectorAll('[data-agent-team-filter]').forEach(b=>b.classList.toggle('active',b===filter));
      renderAgents();
    }

    const view=e.target.closest('[data-agent-view-output]');
    if(view) openOutput(view.dataset.agentViewOutput);

    const rev=e.target.closest('[data-agent-review]');
    if(rev) reviewOutput(rev.dataset.outputId,rev.dataset.taskId,rev.dataset.agentReview);

    if(e.target.closest('[data-agent-dialog-close]')) document.getElementById('agentCCDialog')?.close();
  });

  document.addEventListener('submit', e=>{
    if(e.target?.id==='agentCCNewTaskForm'){
      e.preventDefault();
      createTask().catch(err=>alert(err.message||String(err)));
    }
  });

  const boot=()=>{
    ensureUI();
    const page=document.getElementById('page-agent-workbench');
    if(page?.classList.contains('active')) load();
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();

  window.LelleeAgentCommandCenter={load};
})();
