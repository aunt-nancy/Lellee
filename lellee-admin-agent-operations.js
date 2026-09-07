(function(){
  'use strict';

  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
  const bridge=()=>window.LelleeAuthContext?.client?window.LelleeAuthContext:null;

  function capabilitiesByAgent(items){
    const map={};
    for(const item of items||[]){(map[item.agent_key]??=[]).push(item)}
    return map;
  }

  function render({registry=[],capabilities=[],globalControls=[],recentActivity=[],alerts=[]}){
    const caps=capabilitiesByAgent(capabilities);
    const stop=globalControls.find(x=>x.control_key==='emergency_stop')?.bool_value===true;
    return `<section class="agent-admin-shell">
      <div class="agent-admin-emergency ${stop?'active':''}">
        <div><small>GLOBAL CONTROL</small><h3>${stop?'Emergency stop is ACTIVE':'Emergency stop is off'}</h3><p>${stop?'All new Lellee agent tasks are blocked until Admin restores operations.':'Agents operate only within their individual permissions and human-review requirements.'}</p></div>
        <button data-admin-action="global-stop" data-enabled="${stop?'false':'true'}">${stop?'Restore agent operations':'Stop all agents'}</button>
      </div>
      <div class="agent-admin-grid">${registry.map(agent=>`<article class="agent-admin-card">
        <div class="agent-admin-card-head"><div><small>AGENT</small><h3>${esc(agent.display_name||agent.agent_key)}</h3></div><button data-admin-action="agent-toggle" data-agent="${esc(agent.agent_key)}" data-enabled="${agent.is_enabled?'false':'true'}">${agent.is_enabled?'Disable':'Enable'}</button></div>
        <div class="agent-admin-status">${agent.is_enabled?'Enabled':'Disabled'}</div>
        <div class="agent-admin-cap-list">${(caps[agent.agent_key]||[]).map(cap=>`<div class="agent-admin-cap-row"><span>${esc(cap.capability)}</span><button data-admin-action="cap-toggle" data-agent="${esc(agent.agent_key)}" data-capability="${esc(cap.capability)}" data-enabled="${cap.is_allowed?'false':'true'}">${cap.is_allowed?'Allowed':'Blocked'}</button></div>`).join('')}</div>
      </article>`).join('')}</div>
      <section class="agent-admin-alerts"><span class="approved-kicker">SECURITY ALERTS</span><h3>Abnormal agent activity</h3>${alerts.length?alerts.map(a=>`<div class="agent-admin-alert ${esc(a.severity)}"><div><b>${esc(a.summary)}</b><small>${esc(a.alert_type)} · ${esc(a.created_at)}</small></div><span>${esc(a.status)}</span></div>`).join(''):'<p>No current alerts.</p>'}</section>
      <section class="agent-admin-audit"><span class="approved-kicker">RECENT AGENT AUDIT</span><h3>Latest agent activity</h3>${recentActivity.length?recentActivity.slice(0,50).map(row=>`<div class="agent-admin-audit-row"><b>${esc(row.agent_key)}</b><span>${esc(row.capability)}</span><span class="${row.outcome==='allowed'?'allowed':'denied'}">${esc(row.outcome)}</span><time>${esc(new Date(row.created_at).toLocaleString())}</time></div>`).join(''):'<p>No recent agent audit activity.</p>'}</section>
    </section>`;
  }

  async function loadControls(root){
    const c=bridge();
    if(!root||!c?.getCurrentUser?.())return;
    const firstLoad=!root.querySelector('.agent-admin-shell');
    if(firstLoad){
      root.style.minHeight='70vh';
      root.innerHTML='<div class="agent-admin-loading">Loading agent controls…</div>';
    }
    const {data,error}=await c.client.rpc('get_agent_control_center_v1');
    if(error){root.innerHTML=`<div class="agent-admin-loading">Agent Controls could not load: ${esc(error.message)}</div>`;return}
    root.innerHTML=render(data||{});
    if(root.dataset.agentControlsBound==='1')return;
    root.dataset.agentControlsBound='1';
    root.addEventListener('click',async event=>{
      const button=event.target.closest('[data-admin-action]');if(!button)return;
      button.disabled=true;
      try{
        const enabled=button.dataset.enabled==='true';
        let res;
        if(button.dataset.adminAction==='global-stop')res=await c.client.rpc('set_agent_emergency_stop_v1',{p_enabled:enabled});
        else if(button.dataset.adminAction==='agent-toggle')res=await c.client.rpc('set_agent_enabled_v1',{p_agent_key:button.dataset.agent,p_enabled:enabled});
        else if(button.dataset.adminAction==='cap-toggle')res=await c.client.rpc('set_agent_capability_v1',{p_agent_key:button.dataset.agent,p_capability:button.dataset.capability,p_enabled:enabled});
        if(res?.error)throw res.error;
        await loadControls(root);
      }catch(error){alert(error.message||'Admin agent operation failed')}finally{button.disabled=false}
    });
  }

  async function repairWorkbenchRoster(){
    const page=document.getElementById('page-agent-workbench');
    if(!page)return;
    const c=bridge();if(!c?.getCurrentUser?.())return;
    const {data,error}=await c.client.rpc('lellee_agent_command_center_v1');
    if(error)return;
    const r=data?.roster||{},s=data?.summary||{},settings=data?.settings||{};
    const active=Number(r.active_count||0),expected=Number(r.expected_count||active);
    const heading=page.querySelector('#agentCommandCenter .agent-command-head h3');
    if(heading)heading.textContent=`${active} active specialists, one human-controlled operating team`;
    const status=document.getElementById('agentFinalStatus');
    if(status){
      const guardOk=settings.human_review===true&&settings.autonomous_outreach===false&&settings.autonomous_publishing===false&&settings.autonomous_finance===false&&settings.sensitive_data_access===false;
      status.className=`agent-final-status ${active===expected&&guardOk?'good':'warn'}`;
      status.innerHTML=`<b>${active}/${expected} configured agents active.</b> Worker: ${settings.worker_enabled?'ON':'OFF'} · Model execution: ${settings.external_execution?'ON':'OFF'} · Human review: REQUIRED · Open handoffs: ${s.open_handoffs||0}.`;
    }
    const q=document.getElementById('agentCCQueueMissions');if(q)q.style.display='none';
  }

  async function mount({root}={}){await loadControls(root||document.getElementById('adminAgentOperationsRoot'))}
  window.LelleeAdminAgentOperations=Object.freeze({mount,refresh:mount});

  let last='';
  setInterval(()=>{
    const active=document.querySelector('.page.active')?.id||'';
    if(active===last)return;
    last=active;
    if(active==='page-admin-agent-operations')loadControls(document.getElementById('adminAgentOperationsRoot'));
    if(active==='page-agent-workbench')setTimeout(repairWorkbenchRoster,350);
  },350);
})();