(function(){
  'use strict';

  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[ch]));
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

  function repairProfessionalCoachCopy(){
    const training=document.getElementById('page-training-center');
    if(training){
      const intro=training.querySelector('.b5-page-head p');
      if(intro)intro.textContent='Independent training may use payment gates and sequential learning gates. Lellee Coaches may serve under approved W-2 or 1099 arrangements and advance through required training, competency and privilege gates.';
      const staffFilter=training.querySelector('[data-b5-training-filter="staff"]');
      if(staffFilter)staffFilter.textContent='Lellee Coaches';

      training.querySelectorAll('.b5-course-card').forEach(card=>{
        const dts=[...card.querySelectorAll('.b5-course-meta dt')];
        const forDt=dts.find(x=>x.textContent.trim()==='For');
        const forValue=forDt?.nextElementSibling;
        if(forValue){
          const value=forValue.textContent.trim();
          if(/^Staff\s*\/\s*independent$/i.test(value))forValue.textContent='Lellee Coach / independent';
          else if(/^Staff$/i.test(value))forValue.textContent='Lellee Coach';
        }

        const accessDt=dts.find(x=>x.textContent.trim()==='Access');
        const accessValue=accessDt?.nextElementSibling;
        const priceMatch=card.textContent.match(/\$(\d+(?:\.\d{2})?)/);
        const price=priceMatch?Number(priceMatch[1]):0;
        if(accessValue&&price>79&&/Paid in full/i.test(accessValue.textContent)){
          accessValue.textContent='Payment plan available · 40% down';
        }
      });
    }

    const hub=document.getElementById('page-professional-hub');
    if(hub){
      const intro=hub.querySelector('.b5-page-head p');
      if(intro)intro.textContent='A Lellee Coach may work with Lellee under an approved W-2 or 1099 arrangement. An independent professional operates their own business and may use separate Lellee business and training tools.';
      const note=hub.querySelector('.b5-clarity-note');
      if(note)note.innerHTML='<b>Titles stay clear:</b> completing independent training alone does not make someone a “Lellee Coach.” That title requires an approved Lellee W-2 or 1099 engagement plus the applicable learning and role-privilege gates.';
    }

    const workforce=document.getElementById('page-staff-coach-workspace');
    if(workforce){
      const heading=workforce.querySelector('.b5-page-head h2');
      const intro=workforce.querySelector('.b5-page-head p');
      if(heading)heading.textContent='Training, supervision and authorized privileges.';
      if(intro)intro.textContent='Applying does not create an employment or contractor relationship. Lellee must approve and activate a coach record before role training or member assignments become available.';
    }

    const business=document.getElementById('page-coach-business');
    if(business){
      const p=business.querySelector('.approved-inner-head p');
      if(p)p.textContent='Independent professionals work for themselves. They are not Lellee Coaches unless separately engaged by Lellee under an approved W-2 or 1099 arrangement, and they must use accurate credentials and scope descriptions.';
    }

    const dashboard=document.getElementById('page-coach-dashboard');
    if(dashboard){
      const p=dashboard.querySelector('.approved-inner-head p');
      if(p)p.textContent='Manage your own clients, groups, services and communication. This independent business workspace is separate from any W-2 or 1099 Lellee Coach engagement.';
    }

    const coaches=document.getElementById('page-coaches');
    if(coaches){
      const kicker=coaches.querySelector('.approved-kicker');
      const heading=coaches.querySelector('.approved-inner-head h2');
      const intro=coaches.querySelector('.approved-inner-head p');
      if(kicker)kicker.textContent='LELLEE COACHES · W-2 & 1099';
      if(heading)heading.textContent='Human coaching from approved Lellee Coaches.';
      if(intro)intro.textContent='The consumer Lellee Coach add-on connects eligible Premium members with trained Lellee Coaches serving under approved W-2 or 1099 arrangements. Independent professionals who are not engaged by Lellee remain a separate business category.';
      const panel=coaches.querySelector('#b5ConsumerCoachPanel p');
      if(panel)panel.textContent='Lellee Coaches are trained and supervised by Lellee and may serve under approved W-2 or 1099 arrangements. The add-on is $49.99/month in addition to Lellee Premium at $14.99/month. Additional 15-minute sessions are $19.99. Billing remains off until the launch gate is approved.';
    }
  }

  function loadActivatedRuntimes(){
    if(document.getElementById('lelleeDocumentVaultStorageRuntime'))return;
    const script=document.createElement('script');
    script.id='lelleeDocumentVaultStorageRuntime';
    script.src='/document-vault-storage.js?v=20260907-1';
    script.defer=true;
    (document.head||document.documentElement).appendChild(script);
  }

  async function mount({root}={}){await loadControls(root||document.getElementById('adminAgentOperationsRoot'))}
  window.LelleeAdminAgentOperations=Object.freeze({mount,refresh:mount});
  loadActivatedRuntimes();

  let last='';
  setInterval(()=>{
    const active=document.querySelector('.page.active')?.id||'';
    if(active!==last){
      last=active;
      if(active==='page-admin-agent-operations')loadControls(document.getElementById('adminAgentOperationsRoot'));
      if(active==='page-agent-workbench')setTimeout(repairWorkbenchRoster,350);
    }
    if(['page-training-center','page-professional-hub','page-staff-coach-workspace','page-coach-business','page-coach-dashboard','page-coaches'].includes(active))repairProfessionalCoachCopy();
  },350);
})();