(() => {
  'use strict';

  const $=s=>document.querySelector(s);
  const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pct=(a,b)=>b?Math.round((a/b)*100):0;
  const money=v=>`$${Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const dt=v=>v?new Date(v).toLocaleString():'—';
  const date=v=>v?new Date(v).toLocaleDateString():'—';
  const title=v=>String(v||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());

  let state={ctx:null,base:null,user:null,loading:false};

  function bridge(){return window.LelleeAuthContext?.client?window.LelleeAuthContext:null}
  function sb(){return bridge()?.client}
  function user(){return bridge()?.getCurrentUser?.()||null}
  function pageClick(p){const e=document.querySelector(`[data-page="${p}"]`);if(e){e.click();return true}return false}

  function ensureDialog(){
    let d=$('#coachOpsDialog');
    if(!d){
      d=document.createElement('dialog');d.id='coachOpsDialog';d.className='coach-ops-dialog';
      d.innerHTML='<div class="coach-ops-dialog-inner" id="coachOpsDialogInner"></div>';
      document.body.appendChild(d);
    }
    return d;
  }
  function openDialog(name,sub,body){
    const d=ensureDialog();
    $('#coachOpsDialogInner').innerHTML=`
      <div class="coach-ops-dialog-head">
        <div><span class="approved-kicker">COACH OPERATIONS</span><h3>${esc(name)}</h3><p>${esc(sub||'')}</p></div>
        <button type="button" class="coach-ops-close" data-coach-ops-close>×</button>
      </div>${body}`;
    d.showModal();return d;
  }
  function closeDialog(){$('#coachOpsDialog')?.close()}

  async function load(force=false){
    if(state.loading) return state.ctx;
    if(state.ctx && !force) return state.ctx;
    const c=bridge(),u=user(); if(!c||!u) return null;
    state.loading=true;
    try{
      const [ops,base]=await Promise.all([
        c.client.rpc('get_my_coach_operations_context'),
        c.client.rpc('get_my_coach_dashboard_context')
      ]);
      if(ops.error) throw ops.error;
      if(base.error) throw base.error;
      state.ctx=ops.data||{};
      state.base=base.data||{};
      state.user=u;
      return state.ctx;
    }finally{state.loading=false}
  }

  function requireBusiness(){
    if(!state.ctx?.has_business){
      pageClick('coach-business');alert('Complete your coaching business setup first.');return false;
    }
    return true;
  }

  function setText(id,v){const e=$('#'+id);if(e)e.textContent=v}

  function renderAnalytics(){
    const a=state.ctx?.analytics||{},s=a.summary||{};
    setText('coachAnalyticsName',state.ctx.business_name||'My Coaching Business');
    setText('coachAnalyticsLeads',s.leads||0);
    setText('coachAnalyticsLeadRate',`${pct(s.lead_converted||0,s.leads||0)}% converted`);
    setText('coachAnalyticsClients',s.clients||0);
    setText('coachAnalyticsNewClients',`${s.new_clients||0} new`);
    setText('coachAnalyticsGroups',s.groups||0);
    setText('coachAnalyticsSeats',`${s.open_seats||0} open seats`);
    setText('coachAnalyticsConsults',s.consultations||0);
    setText('coachAnalyticsConsultRate',`${pct(s.consult_converted||0,s.consultations||0)}% converted`);
    const sl=$('#coachAnalyticsServices');
    if(sl) sl.innerHTML=(a.services||[]).length?(a.services||[]).map(x=>`
      <article class="coach-ops-item"><div class="coach-ops-row"><div><b>${esc(x.name)}</b><small>${esc(title(x.service_type))}</small></div><span class="coach-ops-pill">${x.active_clients||0} clients · ${x.active_groups||0} groups</span></div></article>`).join(''):
      '<div class="coach-ops-empty">No active service packages yet.</div>';
    const gl=$('#coachAnalyticsGroupList');
    if(gl) gl.innerHTML=(a.groups||[]).length?(a.groups||[]).map(x=>`
      <article class="coach-ops-item"><div class="coach-ops-row"><div><b>${esc(x.name)}</b><small>${x.members||0} of ${x.capacity||0} seats filled</small></div><span class="coach-ops-pill">${x.open_seats||0} open</span></div></article>`).join(''):
      '<div class="coach-ops-empty">No active groups yet.</div>';
  }

  function renderRevenue(){
    const r=state.ctx?.revenue||{},s=r.summary||{};
    setText('coachRevenueName',state.ctx.business_name||'My Coaching Business');
    setText('coachRevenueServices',s.services||0);
    setText('coachRevenueClients',s.clients||0);
    setText('coachRevenueGroups',s.groups||0);
    setText('coachRevenueProjected',money(s.projected_gross||0));
    const sl=$('#coachRevenueServiceList');
    if(sl) sl.innerHTML=(r.services||[]).length?(r.services||[]).map(x=>`
      <article class="coach-ops-item"><div class="coach-ops-row"><div><b>${esc(x.name)}</b><small>${esc(title(x.service_type))} · ${esc(title(x.billing_model))}</small></div><span class="coach-ops-pill">${x.price_amount==null?'Price not set':money(x.price_amount)}</span></div>
      <div class="coach-ops-meta">${x.sessions_included!=null?`<span class="coach-ops-pill">${x.sessions_included} sessions</span>`:''}${x.group_capacity!=null?`<span class="coach-ops-pill">Capacity ${x.group_capacity}</span>`:''}${x.individual_touchpoints!=null?`<span class="coach-ops-pill">${x.individual_touchpoints} individual touchpoints</span>`:''}</div></article>`).join(''):
      '<div class="coach-ops-empty">Create services in the Coach Dashboard to see pricing here.</div>';
    const gl=$('#coachRevenueGroupList');
    if(gl) gl.innerHTML=(r.groups||[]).length?(r.groups||[]).map(x=>`
      <article class="coach-ops-item"><div class="coach-ops-row"><div><b>${esc(x.name)}</b><small>${x.members||0}/${x.capacity||0} enrolled · ${x.group_price==null?'price not set':money(x.group_price)+' per configured group unit'}</small></div><span class="coach-ops-pill">${money(x.projected_value||0)} projected</span></div></article>`).join(''):
      '<div class="coach-ops-empty">No group economics to display yet.</div>';
    const po=$('#coachPayoutStatus');
    if(po) po.innerHTML=`<div class="coach-ops-warning"><b>${r.payout_status?.enabled?'Payment operations enabled':'Payment operations OFF'}</b><br>${esc(r.payout_status?.label||'Coach payment collection and payouts are not activated.')}</div>`;
  }

  function renderScheduler(tab='schedule'){
    const r=state.ctx?.scheduler||{},s=r.summary||{};
    setText('coachSchedulerName',state.ctx.business_name||'My Coaching Business');
    setText('coachSchedConsults',s.open_consultations||0);
    setText('coachSchedSessions',s.upcoming_sessions||0);
    setText('coachSchedFollowups',s.followups_due||0);
    setText('coachSchedOpenSlots',s.open_slots||0);

    const sched=$('#coachScheduleList');
    if(sched) sched.innerHTML=(r.schedule||[]).length?(r.schedule||[]).map(x=>`
      <article class="coach-ops-item"><div class="coach-ops-row"><div><b>${esc(x.title)}</b><small>${esc(dt(x.scheduled_start))} · ${x.duration_minutes} min · ${esc(title(x.session_scope))}</small></div><span class="coach-ops-pill">${esc(title(x.status))}</span></div>${x.meeting_location?`<small>${esc(x.meeting_location)}</small>`:''}</article>`).join(''):
      '<div class="coach-ops-empty">No scheduled sessions yet.</div>';

    const av=$('#coachAvailabilityList');
    const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    if(av) av.innerHTML=(r.availability||[]).length?(r.availability||[]).map(x=>`
      <article class="coach-ops-item"><div class="coach-ops-row"><div><b>${days[x.day_of_week]||'Day'}</b><small>${esc(x.start_time)} – ${esc(x.end_time)} · ${esc(x.timezone)}</small></div><span class="coach-ops-pill">${x.active?'ACTIVE':'OFF'}</span></div></article>`).join(''):
      '<div class="coach-ops-empty">No availability rules yet.</div>';

    const co=$('#coachConsultationList');
    if(co) co.innerHTML=(r.consultations||[]).length?(r.consultations||[]).map(x=>`
      <article class="coach-ops-item"><div class="coach-ops-row"><div><b>${esc(x.client_label)}</b><small>${esc(x.note||'No note')} · ${esc(date(x.created_at))}</small></div><span class="coach-ops-pill">${esc(title(x.status))}</span></div></article>`).join(''):
      '<div class="coach-ops-empty">No open consultation requests.</div>';

    const fo=$('#coachFollowupList');
    if(fo) fo.innerHTML=(r.followups||[]).length?(r.followups||[]).map(x=>`
      <article class="coach-ops-item"><div class="coach-ops-row"><div><b>${esc(x.title)}</b><small>${esc(x.related_label||'')} ${x.note?'· '+esc(x.note):''}</small></div><span class="coach-ops-pill">${x.due_at?esc(dt(x.due_at)):'No due date'}</span></div>
      ${x.status==='open'?`<div class="coach-ops-actions"><button data-complete-followup="${x.id}" class="primary">Complete</button></div>`:''}</article>`).join(''):
      '<div class="coach-ops-empty">No follow-ups yet.</div>';

    const hi=$('#coachContactHistory');
    if(hi) hi.innerHTML=(r.history||[]).length?(r.history||[]).map(x=>`
      <article class="coach-ops-item"><b>${esc(x.event_label)}</b><small>${esc(title(x.event_type))} · ${esc(dt(x.created_at))}</small></article>`).join(''):
      '<div class="coach-ops-empty">No CRM contact history yet.</div>';

    showCrmTab(tab);
  }

  function showCrmTab(tab){
    document.querySelectorAll('[data-coach-crm-tab]').forEach(b=>b.classList.toggle('active',b.dataset.coachCrmTab===tab));
    const map={schedule:'coachCrmPanelSchedule',availability:'coachCrmPanelAvailability',consultations:'coachCrmPanelConsultations',followups:'coachCrmPanelFollowups',history:'coachCrmPanelHistory'};
    Object.entries(map).forEach(([k,id])=>$('#'+id)?.classList.toggle('hidden',k!==tab));
  }

  function renderAutomation(){
    const a=state.ctx?.automation||{},s=a.summary||{};
    setText('coachAutomationName',state.ctx.business_name||'My Coaching Business');
    setText('coachAutomationRules',s.active_rules||0);
    setText('coachAutomationDue',s.followups_due||0);
    setText('coachAutomationCreated',s.tasks_created||0);
    setText('coachAutomationRuns',s.recent_runs||0);
    const rl=$('#coachAutomationRuleList');
    if(rl) rl.innerHTML=(a.rules||[]).length?(a.rules||[]).map(x=>`
      <article class="coach-ops-item"><div class="coach-ops-row"><div><b>${esc(x.name)}</b><small>${esc(title(x.trigger_event))} → create follow-up</small></div><span class="coach-ops-pill">${esc(title(x.status))}</span></div>
      <div class="coach-ops-actions"><button data-toggle-rule="${x.id}" class="primary">${x.status==='active'?'Pause':'Activate'}</button></div></article>`).join(''):
      '<div class="coach-ops-empty">No automation rules yet. Add a safe operational rule.</div>';
    const rr=$('#coachAutomationRunList');
    if(rr) rr.innerHTML=(a.runs||[]).length?(a.runs||[]).map(x=>`
      <article class="coach-ops-item"><div class="coach-ops-row"><div><b>${esc(x.rule_name)}</b><small>${esc(dt(x.created_at))}</small></div><span class="coach-ops-pill">${esc(title(x.status))}</span></div></article>`).join(''):
      '<div class="coach-ops-empty">No automation runs yet. Runs appear after a matching operational event occurs.</div>';
  }

  function ensureCredentialButtons(){
    const tr=$('#coachCredPanelTraining .commerce-panel-head');
    if(tr && !$('#coachAddTraining')){
      const b=document.createElement('button');b.id='coachAddTraining';b.className='approved-small-action';b.textContent='+ Add Training';tr.appendChild(b);
    }
    const it=$('#coachCredPanelIntake .commerce-panel-head');
    if(it && !$('#coachAddIntakeForm')){
      const b=document.createElement('button');b.id='coachAddIntakeForm';b.className='approved-small-action';b.textContent='+ New Intake Form';it.appendChild(b);
    }
  }

  function renderCredentials(tab='credentials'){
    ensureCredentialButtons();
    const c=state.ctx?.credentials||{},s=c.summary||{};
    setText('coachCredentialName',state.ctx.business_name||'My Coaching Business');
    setText('coachCredCount',s.credentials||0);
    setText('coachCredVerified',s.verified||0);
    setText('coachCredTraining',s.training||0);
    setText('coachCredForms',s.intake_forms||0);
    const cl=$('#coachCredentialList');
    if(cl) cl.innerHTML=(c.credentials||[]).length?(c.credentials||[]).map(x=>`
      <article class="coach-ops-item"><div class="coach-ops-row"><div><b>${esc(x.label)}</b><small>${esc(title(x.credential_type))}${x.issuer?' · '+esc(x.issuer):''}</small></div><span class="coach-ops-pill">${esc(title(x.verification_status))}</span></div>
      ${x.expires_on?`<small>Expires ${esc(date(x.expires_on))}</small>`:''}</article>`).join(''):
      '<div class="coach-ops-empty">No credential claims yet. Self-entered claims remain unverified until human review.</div>';
    const tl=$('#coachTrainingList');
    if(tl) tl.innerHTML=(c.training||[]).length?(c.training||[]).map(x=>`
      <article class="coach-ops-item"><div class="coach-ops-row"><div><b>${esc(x.title)}</b><small>${x.hours!=null?esc(x.hours)+' hours':''}${x.completed_at?' · completed '+esc(date(x.completed_at)):''}</small></div><span class="coach-ops-pill">${x.verified?'VERIFIED':esc(title(x.status))}</span></div></article>`).join(''):
      '<div class="coach-ops-empty">No training records yet.</div>';
    const il=$('#coachIntakeFormList');
    if(il) il.innerHTML=(c.intake_forms||[]).length?(c.intake_forms||[]).map(x=>`
      <article class="coach-ops-item"><div class="coach-ops-row"><div><b>${esc(x.title)}</b><small>${esc(x.description||'')} · ${x.assignment_count||0} assignments</small></div><span class="coach-ops-pill">${esc(title(x.status))}</span></div>
      <div class="coach-ops-actions"><button class="primary" data-assign-intake="${x.id}">Assign to Client</button></div></article>`).join(''):
      '<div class="coach-ops-empty">No intake forms yet.</div>';
    showCredTab(tab);
  }

  function showCredTab(tab){
    document.querySelectorAll('[data-coach-cred-tab]').forEach(b=>b.classList.toggle('active',b.dataset.coachCredTab===tab));
    ['credentials','training','intake'].forEach(k=>{
      const id='coachCredPanel'+(k==='credentials'?'Credentials':k==='training'?'Training':'Intake');
      $('#'+id)?.classList.toggle('hidden',k!==tab);
    });
  }

  function renderQuickstart(){
    const q=state.ctx?.quickstart||{},steps=q.steps||[];
    const done=steps.filter(x=>x.complete).length, total=steps.length||1, percent=Math.round(done/total*100);
    setText('coachQuickstartProgress',`${percent}%`);
    const bar=$('#coachQuickstartBar');if(bar)bar.style.width=`${percent}%`;
    const host=$('#coachQuickstartList');
    if(host) host.innerHTML=steps.map(x=>`
      <div class="coach-ops-progress-row">
        <span class="coach-ops-check ${x.complete?'done':''}">${x.complete?'✓':'○'}</span>
        <div><b>${esc(x.label)}</b><small>${x.complete?'Complete':'Next step'}</small></div>
        <button data-page="${esc(x.page)}">${x.complete?'Review':'Open'}</button>
      </div>`).join('');
  }

  async function loadPage(page){
    try{
      await load(true);
      if(!state.ctx?.has_business){pageClick('coach-business');return}
      if(page==='coach-analytics')renderAnalytics();
      if(page==='coach-revenue')renderRevenue();
      if(page==='coach-scheduler')renderScheduler('schedule');
      if(page==='coach-automation')renderAutomation();
      if(page==='coach-credentials')renderCredentials('credentials');
      if(page==='coach-quickstart')renderQuickstart();
    }catch(err){
      console.error('Coach operations load error',err);
      alert(`Coach operations could not load: ${err.message||err}`);
    }
  }

  function baseTargets(kind='all'){
    const clients=(state.base?.clients||[]).filter(x=>x.status==='active');
    const groups=(state.base?.groups||[]).filter(x=>['forming','active'].includes(x.status));
    let rows=[];
    if(kind!=='group') rows.push(...clients.map(c=>({kind:'rel',id:c.id,label:`Client · ${c.client_name}`,program_id:c.program_id,user_id:c.client_user_id})));
    if(kind!=='client') rows.push(...groups.map(g=>({kind:'group',id:g.id,label:`Group · ${g.name}`,program_id:g.program_id})));
    return rows;
  }

  function openSchedule(){
    if(!requireBusiness())return;
    const t=baseTargets();
    openDialog('Schedule Session','Create a 1-to-1, group, consultation or administrative coaching event.',`
      <form id="coachOpsScheduleForm"><div class="coach-ops-form">
        <label class="wide">Session title<input id="opsScheduleTitle" required></label>
        <label>Scope<select id="opsScheduleScope"><option value="one_to_one">1-to-1</option><option value="group">Group</option><option value="consultation">Consultation</option><option value="admin">Administrative</option></select></label>
        <label>Client / group<select id="opsScheduleTarget"><option value="">No linked participant</option>${t.map(x=>`<option value="${x.kind}:${x.id}">${esc(x.label)}</option>`).join('')}</select></label>
        <label>Start<input id="opsScheduleStart" type="datetime-local" required></label>
        <label>Duration minutes<input id="opsScheduleDuration" type="number" min="10" max="240" value="50"></label>
        <label>Meeting location<input id="opsScheduleLocation"></label>
        <label>Meeting URL<input id="opsScheduleUrl" type="url"></label>
      </div><div class="coach-ops-footer"><button type="button" data-coach-ops-close>Cancel</button><button class="primary" type="submit">Schedule</button></div></form>`);
  }

  async function saveSchedule(){
    const target=$('#opsScheduleTarget').value;
    let relationship_id=null,group_id=null;
    if(target){const [k,id]=target.split(':');if(k==='rel')relationship_id=id;else group_id=id}
    const row={
      business_id:state.ctx.business_id,created_by:state.user.id,
      relationship_id,group_id,title:$('#opsScheduleTitle').value.trim(),
      session_scope:$('#opsScheduleScope').value,
      scheduled_start:new Date($('#opsScheduleStart').value).toISOString(),
      duration_minutes:Number($('#opsScheduleDuration').value||50),
      meeting_location:$('#opsScheduleLocation').value.trim()||null,
      meeting_url:$('#opsScheduleUrl').value.trim()||null,status:'scheduled'
    };
    const {error}=await sb().from('coach_schedule_events').insert(row);if(error)throw error;
    await logHistory('schedule_created',`Scheduled ${row.title}`,relationship_id?baseTargets('client').find(x=>x.id===relationship_id)?.user_id:null);
    closeDialog();await loadPage('coach-scheduler');
  }

  function openAvailability(){
    openDialog('Add Availability','Add a recurring weekly availability window.',`
      <form id="coachOpsAvailabilityForm"><div class="coach-ops-form">
        <label>Day<select id="opsAvailDay">${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((d,i)=>`<option value="${i}">${d}</option>`).join('')}</select></label>
        <label>Timezone<input id="opsAvailTimezone" value="America/Los_Angeles"></label>
        <label>Start time<input id="opsAvailStart" type="time" required></label>
        <label>End time<input id="opsAvailEnd" type="time" required></label>
      </div><div class="coach-ops-footer"><button type="button" data-coach-ops-close>Cancel</button><button class="primary" type="submit">Add availability</button></div></form>`);
  }
  async function saveAvailability(){
    const row={business_id:state.ctx.business_id,user_id:state.user.id,day_of_week:Number($('#opsAvailDay').value),start_time:$('#opsAvailStart').value,end_time:$('#opsAvailEnd').value,timezone:$('#opsAvailTimezone').value.trim()||'America/Los_Angeles',active:true};
    if(row.end_time<=row.start_time)throw new Error('End time must be after start time.');
    const {error}=await sb().from('coach_availability_rules').insert(row);if(error)throw error;
    closeDialog();await loadPage('coach-scheduler');showCrmTab('availability');
  }

  function openFollowup(){
    const clients=baseTargets('client');
    openDialog('Add Follow-Up','CRM notes are operational business notes, not clinical records.',`
      <form id="coachOpsFollowupForm"><div class="coach-ops-form">
        <label class="wide">Title<input id="opsFollowupTitle" required></label>
        <label>Related client<select id="opsFollowupClient"><option value="">No client</option>${clients.map(x=>`<option value="${x.user_id}">${esc(x.label)}</option>`).join('')}</select></label>
        <label>Due<input id="opsFollowupDue" type="datetime-local"></label>
        <label class="wide">Operational note<textarea id="opsFollowupNote" placeholder="Do not copy journal, diagnosis, crisis or treatment content here."></textarea></label>
      </div><div class="coach-ops-footer"><button type="button" data-coach-ops-close>Cancel</button><button class="primary" type="submit">Add follow-up</button></div></form>`);
  }
  async function saveFollowup(){
    const row={owner_user_id:state.user.id,workspace_type:'coach',business_id:state.ctx.business_id,related_user_id:$('#opsFollowupClient').value||null,title:$('#opsFollowupTitle').value.trim(),note:$('#opsFollowupNote').value.trim()||null,due_at:$('#opsFollowupDue').value?new Date($('#opsFollowupDue').value).toISOString():null,status:'open'};
    const {error}=await sb().from('crm_followups').insert(row);if(error)throw error;
    await logHistory('followup_created',`Added follow-up: ${row.title}`,row.related_user_id);
    closeDialog();await loadPage('coach-scheduler');showCrmTab('followups');
  }
  async function completeFollowup(id){
    const {error}=await sb().from('crm_followups').update({status:'completed',completed_at:new Date().toISOString()}).eq('id',id);if(error)throw error;
    await loadPage('coach-scheduler');showCrmTab('followups');
  }
  async function logHistory(type,label,related=null){
    const row={workspace_type:'coach',business_id:state.ctx.business_id,actor_user_id:state.user.id,related_user_id:related,event_type:type,event_label:label,metadata:{}};
    const {error}=await sb().from('crm_contact_history').insert(row);if(error)console.warn(error);
  }

  function openAutomation(){
    openDialog('Add Automation Rule','Only privacy-safe operational triggers are available. The current action creates a coach follow-up.',`
      <form id="coachOpsAutomationForm"><div class="coach-ops-form">
        <label class="wide">Rule name<input id="opsAutoName" required></label>
        <label>Trigger<select id="opsAutoTrigger"><option value="consultation_requested">New consultation</option><option value="session_scheduled">Session scheduled</option><option value="group_start_due">Group created with start date</option></select></label>
        <label>Status<select id="opsAutoStatus"><option value="active">Active</option><option value="draft">Draft</option></select></label>
        <label>Follow-up delay<input id="opsAutoDelay" type="number" min="1" max="720" value="24"></label>
        <label class="wide">Follow-up title<input id="opsAutoTitle" value="Coach follow-up"></label>
        <label class="wide">Description<textarea id="opsAutoDescription"></textarea></label>
      </div><div class="coach-ops-footer"><button type="button" data-coach-ops-close>Cancel</button><button class="primary" type="submit">Save rule</button></div></form>`);
  }
  async function saveAutomation(){
    const trigger=$('#opsAutoTrigger').value;
    const delay=Number($('#opsAutoDelay').value||24);
    const cfg=trigger==='group_start_due'?{days_before:Math.max(0,Math.min(30,Math.round(delay/24))),title:$('#opsAutoTitle').value.trim()||'Prepare for group start'}:{due_hours:delay,title:$('#opsAutoTitle').value.trim()||'Coach follow-up'};
    const row={name:$('#opsAutoName').value.trim(),description:$('#opsAutoDescription').value.trim()||null,scope_type:'coach_business',scope_id:state.ctx.business_id,trigger_event:trigger,trigger_config:{},conditions:[],action_type:'create_followup',action_config:cfg,status:$('#opsAutoStatus').value,created_by:state.user.id};
    const {error}=await sb().from('automation_rules').insert(row);if(error)throw error;
    closeDialog();await loadPage('coach-automation');
  }
  async function toggleRule(id){
    const r=(state.ctx?.automation?.rules||[]).find(x=>x.id===id);if(!r)return;
    const {error}=await sb().from('automation_rules').update({status:r.status==='active'?'paused':'active',updated_at:new Date().toISOString()}).eq('id',id);if(error)throw error;
    await loadPage('coach-automation');
  }

  function openCredential(){
    openDialog('Add Credential Claim','Self-entered credentials are not verified automatically and are not automatically public.',`
      <form id="coachOpsCredentialForm"><div class="coach-ops-form">
        <label class="wide">Credential label<input id="opsCredLabel" required placeholder="Example: Certified Peer Support Specialist"></label>
        <label>Type<select id="opsCredType"><option value="certification">Certification</option><option value="license">Professional License</option><option value="education">Education</option><option value="training">Training Certificate</option><option value="lived_experience">Lived Experience</option><option value="other">Other</option></select></label>
        <label>Issuer<input id="opsCredIssuer"></label>
        <label>Credential number (masked)<input id="opsCredNumber" placeholder="Example: ****1234"></label>
        <label>Issued on<input id="opsCredIssued" type="date"></label>
        <label>Expires on<input id="opsCredExpires" type="date"></label>
      </div><div class="coach-ops-footer"><button type="button" data-coach-ops-close>Cancel</button><button class="primary" type="submit">Add claim</button></div></form>`);
  }
  async function saveCredential(){
    const row={user_id:state.user.id,business_id:state.ctx.business_id,label:$('#opsCredLabel').value.trim(),credential_type:$('#opsCredType').value,issuer:$('#opsCredIssuer').value.trim()||null,credential_number_masked:$('#opsCredNumber').value.trim()||null,issued_on:$('#opsCredIssued').value||null,expires_on:$('#opsCredExpires').value||null,verification_status:'self_reported',public_display_approved:false};
    const {error}=await sb().from('professional_credential_claims').insert(row);if(error)throw error;
    closeDialog();await loadPage('coach-credentials');
  }

  function openTraining(){
    openDialog('Add Training Record','Track completed or in-progress training. Human verification is separate.',`
      <form id="coachOpsTrainingForm"><div class="coach-ops-form">
        <label class="wide">Training title<input id="opsTrainTitle" required></label>
        <label>Hours<input id="opsTrainHours" type="number" min="0" step="0.25"></label>
        <label>Status<select id="opsTrainStatus"><option value="completed">Completed</option><option value="in_progress">In progress</option><option value="assigned">Assigned</option></select></label>
        <label>Completed on<input id="opsTrainCompleted" type="date"></label>
        <label>Expires on<input id="opsTrainExpires" type="date"></label>
      </div><div class="coach-ops-footer"><button type="button" data-coach-ops-close>Cancel</button><button class="primary" type="submit">Add training</button></div></form>`);
  }
  async function saveTraining(){
    const status=$('#opsTrainStatus').value;
    const row={user_id:state.user.id,title:$('#opsTrainTitle').value.trim(),hours:$('#opsTrainHours').value===''?null:Number($('#opsTrainHours').value),status,completed_at:status==='completed'&&$('#opsTrainCompleted').value?new Date($('#opsTrainCompleted').value+'T12:00:00').toISOString():null,expires_on:$('#opsTrainExpires').value||null,verified:false};
    const {error}=await sb().from('training_records').insert(row);if(error)throw error;
    closeDialog();await loadPage('coach-credentials');showCredTab('training');
  }

  function openIntake(){
    const programs=state.base?.programs||[];
    openDialog('New Client Intake Form','Questions are non-diagnostic by default. Private answers are not automatically shared with the coach.',`
      <form id="coachOpsIntakeForm"><div class="coach-ops-form">
        <label class="wide">Form title<input id="opsIntakeTitle" required></label>
        <label>Program<select id="opsIntakeProgram">${programs.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></label>
        <label class="wide">Description<textarea id="opsIntakeDescription"></textarea></label>
        <label class="wide">Questions — one per line<textarea id="opsIntakeQuestions" placeholder="What would you like support with?&#10;What would make coaching useful for you?"></textarea></label>
      </div><div class="coach-ops-footer"><button type="button" data-coach-ops-close>Cancel</button><button class="primary" type="submit">Create form</button></div></form>`);
  }
  async function saveIntake(){
    const questions=$('#opsIntakeQuestions').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    const {error}=await sb().rpc('create_coach_intake_form',{p_business_id:state.ctx.business_id,p_program_id:$('#opsIntakeProgram').value,p_title:$('#opsIntakeTitle').value.trim(),p_description:$('#opsIntakeDescription').value.trim()||null,p_questions:questions});
    if(error)throw error;closeDialog();await loadPage('coach-credentials');showCredTab('intake');
  }

  function openAssignIntake(formId){
    const clients=baseTargets('client');
    if(!clients.length)return alert('No active client relationships are available.');
    openDialog('Assign Intake Form','The client receives a private form assignment. Their answers are not automatically public.',`
      <form id="coachOpsAssignIntakeForm" data-form-id="${formId}"><div class="coach-ops-form">
        <label class="wide">Client<select id="opsAssignClient">${clients.map(x=>`<option value="${x.user_id}">${esc(x.label)}</option>`).join('')}</select></label>
        <label>Due<input id="opsAssignDue" type="datetime-local"></label>
      </div><div class="coach-ops-footer"><button type="button" data-coach-ops-close>Cancel</button><button class="primary" type="submit">Assign</button></div></form>`);
  }
  async function assignIntake(formId){
    const {error}=await sb().rpc('assign_coach_intake_form',{p_form_id:formId,p_client_user_id:$('#opsAssignClient').value,p_due_at:$('#opsAssignDue').value?new Date($('#opsAssignDue').value).toISOString():null});
    if(error)throw error;closeDialog();await loadPage('coach-credentials');showCredTab('intake');
  }

  document.addEventListener('click',e=>{
    const page=e.target.closest('[data-page]');
    if(page && ['coach-analytics','coach-revenue','coach-scheduler','coach-automation','coach-credentials','coach-quickstart'].includes(page.dataset.page)){
      setTimeout(()=>loadPage(page.dataset.page),40);
    }

    if(e.target.closest('[data-coach-ops-close]'))closeDialog();

    const crm=e.target.closest('[data-coach-crm-tab]');
    if(crm){e.preventDefault();e.stopImmediatePropagation();showCrmTab(crm.dataset.coachCrmTab)}

    const cred=e.target.closest('[data-coach-cred-tab]');
    if(cred){e.preventDefault();e.stopImmediatePropagation();showCredTab(cred.dataset.coachCredTab)}

    if(e.target.closest('#coachScheduleSession')){e.preventDefault();e.stopImmediatePropagation();openSchedule()}
    if(e.target.closest('#coachAddAvailability')){e.preventDefault();e.stopImmediatePropagation();openAvailability()}
    if(e.target.closest('#coachAddFollowup')){e.preventDefault();e.stopImmediatePropagation();openFollowup()}
    if(e.target.closest('#coachAutomationAddRule')){e.preventDefault();e.stopImmediatePropagation();openAutomation()}
    if(e.target.closest('#coachAddCredential')){e.preventDefault();e.stopImmediatePropagation();openCredential()}
    if(e.target.closest('#coachAddTraining')){e.preventDefault();e.stopImmediatePropagation();openTraining()}
    if(e.target.closest('#coachAddIntakeForm')){e.preventDefault();e.stopImmediatePropagation();openIntake()}

    const comp=e.target.closest('[data-complete-followup]');
    if(comp){e.preventDefault();completeFollowup(comp.dataset.completeFollowup).catch(err=>alert(err.message||String(err)))}

    const tog=e.target.closest('[data-toggle-rule]');
    if(tog){e.preventDefault();toggleRule(tog.dataset.toggleRule).catch(err=>alert(err.message||String(err)))}

    const ai=e.target.closest('[data-assign-intake]');
    if(ai){e.preventDefault();openAssignIntake(ai.dataset.assignIntake)}
  },true);

  document.addEventListener('submit',e=>{
    const id=e.target?.id;if(!id)return;
    const run=async fn=>{e.preventDefault();try{await fn()}catch(err){alert(err.message||String(err))}};
    if(id==='coachOpsScheduleForm')run(saveSchedule);
    if(id==='coachOpsAvailabilityForm')run(saveAvailability);
    if(id==='coachOpsFollowupForm')run(saveFollowup);
    if(id==='coachOpsAutomationForm')run(saveAutomation);
    if(id==='coachOpsCredentialForm')run(saveCredential);
    if(id==='coachOpsTrainingForm')run(saveTraining);
    if(id==='coachOpsIntakeForm')run(saveIntake);
    if(id==='coachOpsAssignIntakeForm')run(()=>assignIntake(e.target.dataset.formId));
  });

  function boot(){
    const timer=setInterval(async()=>{
      if(bridge()&&user()){
        clearInterval(timer);state.user=user();
        const active=$('.page.active')?.id?.replace('page-','');
        if(['coach-analytics','coach-revenue','coach-scheduler','coach-automation','coach-credentials','coach-quickstart'].includes(active))loadPage(active);
      }
    },250);
    setTimeout(()=>clearInterval(timer),60000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

  window.LelleeCoachOperationsCompletion={loadPage};
})();