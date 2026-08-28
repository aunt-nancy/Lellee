(() => {
  'use strict';

  const $=s=>document.querySelector(s);
  const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const title=v=>String(v||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
  const money=v=>`$${Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const dt=v=>v?new Date(v).toLocaleString():'—';
  const date=v=>v?new Date(v).toLocaleDateString():'—';

  let state={ctx:null,user:null,base:null,loading:false};

  function bridge(){return window.LelleeAuthContext?.client?window.LelleeAuthContext:null}
  function sb(){return bridge()?.client}
  function user(){return bridge()?.getCurrentUser?.()||null}
  function pageClick(p){const e=document.querySelector(`[data-page="${p}"]`);if(e){e.click();return true}return false}
  function setText(id,v){const e=$('#'+id);if(e)e.textContent=v}

  function ensureDialog(){
    let d=$('#orgOpsDialog');
    if(!d){d=document.createElement('dialog');d.id='orgOpsDialog';d.className='org-ops-dialog';d.innerHTML='<div class="org-ops-dialog-inner" id="orgOpsDialogInner"></div>';document.body.appendChild(d)}
    return d;
  }
  function dialog(name,sub,body){
    const d=ensureDialog();$('#orgOpsDialogInner').innerHTML=`<div class="org-ops-dialog-head"><div><span class="approved-kicker">ORGANIZATION OPERATIONS</span><h3>${esc(name)}</h3><p>${esc(sub||'')}</p></div><button type="button" class="org-ops-close" data-org-ops-close>×</button></div>${body}`;d.showModal();return d;
  }
  function closeDialog(){$('#orgOpsDialog')?.close()}

  async function load(force=false){
    if(state.loading)return state.ctx;
    if(state.ctx&&!force)return state.ctx;
    const c=bridge(),u=user();if(!c||!u)return null;
    state.loading=true;
    try{
      const [ops,base]=await Promise.all([
        c.client.rpc('lellee_get_my_organization_operations_v1'),
        c.client.rpc('lellee_get_my_organization_dashboard_context_v3')
      ]);
      if(ops.error)throw ops.error;
      if(base.error)throw base.error;
      state.ctx=ops.data||{};state.base=base.data||{};state.user=u;return state.ctx;
    }finally{state.loading=false}
  }

  function requireOrg(){
    if(!state.ctx?.has_organization){pageClick('organization-setup');alert('Complete your organization setup first.');return false}
    return true;
  }

  function renderAnalytics(){
    const a=state.ctx?.analytics||{},s=a.summary||{};
    setText('orgAnalyticsName',state.ctx.organization_name||'Organization');
    setText('orgAnalyticsSeats',s.licensed_seats||0);
    setText('orgAnalyticsAssigned',`${s.assigned||0} assigned`);
    setText('orgAnalyticsActive',s.active_users||0);
    setText('orgAnalyticsActivation',`${s.assigned?Math.round((s.active_users||0)*100/s.assigned):0}% activation`);
    setText('orgAnalyticsPrograms',s.programs||0);
    setText('orgAnalyticsCohorts',`${s.cohorts||0} cohorts`);
    setText('orgAnalyticsMilestones',s.milestones||0);

    const pl=$('#orgAnalyticsProgramList');
    if(pl)pl.innerHTML=(a.programs||[]).length?(a.programs||[]).map(x=>`
      <article class="org-ops-item"><div class="org-ops-row"><div><b>${esc(x.name)}</b><small>${x.assigned||0} assigned · ${x.active||0} active · ${x.seats||0} licensed seats</small></div><span class="org-ops-pill">${x.activation_rate||0}% active</span></div></article>`).join(''):
      '<div class="org-ops-empty">No active program licenses yet.</div>';

    const ol=$('#orgAnalyticsOutcomeList');
    if(ol)ol.innerHTML=(a.outcomes||[]).length?(a.outcomes||[]).map(x=>`
      <article class="org-ops-item"><div class="org-ops-row"><div><b>${esc(x.label)}</b><small>${esc(x.detail)}</small></div><span class="org-ops-pill">${esc(x.value)}</span></div></article>`).join(''):
      '<div class="org-ops-empty">Aggregate outcome indicators will appear when licensed participation exists.</div>';
  }

  function ensureCommerceActions(){
    const page=$('#page-organization-commerce .approved-inner-head');
    if(page&&!$('#orgRequestQuote')){
      const b=document.createElement('button');b.id='orgRequestQuote';b.className='approved-small-action';b.textContent='Request Quote';page.appendChild(b);
    }
  }
  function renderCommerce(){
    ensureCommerceActions();
    const c=state.ctx?.commerce||{},s=c.summary||{};
    setText('orgCommerceName',state.ctx.organization_name||'Organization');
    setText('orgCommerceLicenses',s.licenses||0);setText('orgCommerceSeats',s.seats||0);
    setText('orgCommerceAssigned',s.assigned||0);setText('orgCommerceValue',money(s.contract_value||0));
    const ll=$('#orgCommerceLicenseList');
    if(ll)ll.innerHTML=(c.licenses||[]).length?(c.licenses||[]).map(x=>`
      <article class="org-ops-item"><div class="org-ops-row"><div><b>${esc(x.program_name)}</b><small>${esc(title(x.license_model))} · ${x.seats_used||0}/${x.seat_limit||0} assigned</small></div><span class="org-ops-pill">${esc(title(x.status))}</span></div>
      <div class="org-ops-meta"><span class="org-ops-pill">Configured value ${money(x.configured_value||0)}</span></div>${x.review_note?`<div class="org-ops-warning">${esc(x.review_note)}</div>`:''}</article>`).join(''):
      '<div class="org-ops-empty">No program licenses yet.</div>';
    const ql=$('#orgCommerceQuoteList');
    if(ql)ql.innerHTML=(c.quotes||[]).length?(c.quotes||[]).map(x=>`
      <article class="org-ops-item"><div class="org-ops-row"><div><b>${esc(x.quote_name)}</b><small>${esc(x.term_label||'Pricing pending review')}${x.valid_until?' · valid through '+esc(date(x.valid_until)):''}</small></div><span class="org-ops-pill">${esc(title(x.status))}</span></div>
      <div class="org-ops-meta"><span class="org-ops-pill">${money(x.total_amount||0)}</span></div></article>`).join(''):
      '<div class="org-ops-empty">No quote requests or prepared quotes yet.</div>';
    const note=$('#page-organization-commerce .commerce-note');
    if(note)note.innerHTML=`<b>Organization billing stays ${c.payments_enabled?'ON':'OFF'}.</b><p>This workspace prepares licensing and quote information. It does not collect institutional payment while organization payments are disabled.</p>`;
  }

  function openQuote(){
    dialog('Request Institutional Quote','This records a request. It does not set or approve a price.',`
      <form id="orgOpsQuoteForm"><div class="org-ops-form"><label class="wide">What should Lellee price or review?<textarea id="orgQuoteNote" placeholder="Example: 100 sponsored seats across two programs for a 12-month term."></textarea></label></div><div class="org-ops-footer"><button type="button" data-org-ops-close>Cancel</button><button class="primary" type="submit">Request quote</button></div></form>`);
  }
  async function saveQuote(){
    const {error}=await sb().rpc('lellee_request_organization_quote_v1',{p_note:$('#orgQuoteNote').value.trim()||null});if(error)throw error;closeDialog();await loadPage('organization-commerce');
  }

  function showOutreachTab(tab){
    document.querySelectorAll('[data-org-crm-tab]').forEach(b=>b.classList.toggle('active',b.dataset.orgCrmTab===tab));
    const map={outreach:'orgCrmPanelOutreach',announcements:'orgCrmPanelAnnouncements',followups:'orgCrmPanelFollowups',history:'orgCrmPanelHistory'};
    Object.entries(map).forEach(([k,id])=>$('#'+id)?.classList.toggle('hidden',k!==tab));
  }
  function renderOutreach(tab='outreach'){
    const o=state.ctx?.outreach||{},s=o.summary||{};
    setText('orgOutreachName',state.ctx.organization_name||'Organization');
    setText('orgOutreachInvites',s.pending_invites||0);setText('orgOutreachActive',s.active_users||0);
    setText('orgOutreachFollowups',s.followups_due||0);setText('orgOutreachAnnouncements',s.announcements||0);

    const out=$('#orgOutreachList');
    if(out)out.innerHTML=(o.outreach||[]).length?(o.outreach||[]).map(x=>`
      <article class="org-ops-item"><div class="org-ops-row"><div><b>${esc(x.label)}</b><small>${esc(x.program_name)} · invited ${esc(date(x.invited_at))}</small></div><span class="org-ops-pill">${esc(title(x.status))}</span></div></article>`).join(''):
      '<div class="org-ops-empty">No sponsored-user outreach records yet.</div>';

    const an=$('#orgAnnouncementList');
    if(an)an.innerHTML=(o.announcements||[]).length?(o.announcements||[]).map(x=>`
      <article class="org-ops-item"><div class="org-ops-row"><div><b>${esc(x.title)}</b><small>${esc(title(x.audience_type))} · ${esc(date(x.created_at))}</small></div><span class="org-ops-pill">${esc(title(x.status))}</span></div>
      ${x.status==='draft'?`<div class="org-ops-actions"><button class="primary" data-send-org-announcement="${x.id}">Send in Lellee</button></div>`:''}</article>`).join(''):
      '<div class="org-ops-empty">No organization announcements yet.</div>';

    const fo=$('#orgFollowupList');
    if(fo)fo.innerHTML=(o.followups||[]).length?(o.followups||[]).map(x=>`
      <article class="org-ops-item"><div class="org-ops-row"><div><b>${esc(x.title)}</b><small>${esc(x.related_label||'')}${x.note?' · '+esc(x.note):''}</small></div><span class="org-ops-pill">${x.due_at?esc(dt(x.due_at)):'No due date'}</span></div>
      ${x.status==='open'?`<div class="org-ops-actions"><button class="primary" data-complete-org-followup="${x.id}">Complete</button></div>`:''}</article>`).join(''):
      '<div class="org-ops-empty">No organization follow-ups yet.</div>';

    const hi=$('#orgContactHistory');
    if(hi)hi.innerHTML=(o.history||[]).length?(o.history||[]).map(x=>`
      <article class="org-ops-item"><b>${esc(x.event_label)}</b><small>${esc(title(x.event_type))} · ${esc(dt(x.created_at))}</small></article>`).join(''):
      '<div class="org-ops-empty">No organization CRM history yet.</div>';
    showOutreachTab(tab);
  }

  function activeLicenses(){return (state.base?.licenses||[]).filter(x=>x.status==='active')}
  function activeSponsored(){return (state.base?.sponsored||[]).filter(x=>x.status==='active'&&x.user_id)}

  function openAnnouncement(){
    const lic=activeLicenses(),coh=state.base?.cohorts||[];
    dialog('New Organization Announcement','Creates a draft first. Sending requires a separate human click and stays inside Lellee.',`
      <form id="orgOpsAnnouncementForm"><div class="org-ops-form">
        <label class="wide">Title<input id="orgAnnTitle" required maxlength="160"></label>
        <label>Program<select id="orgAnnProgram"><option value="">All active sponsored users</option>${lic.map(x=>`<option value="${x.program_id}">${esc(x.program_name)}</option>`).join('')}</select></label>
        <label>Cohort<select id="orgAnnCohort"><option value="">No specific cohort</option>${coh.map(x=>`<option value="${x.id}" data-program="${x.program_id}">${esc(x.name)}</option>`).join('')}</select></label>
        <label class="wide">Message<textarea id="orgAnnBody" required maxlength="4000" placeholder="General program logistics or organization update."></textarea></label>
      </div><div class="org-ops-footer"><button type="button" data-org-ops-close>Cancel</button><button class="primary" type="submit">Create draft</button></div></form>`);
  }
  async function saveAnnouncement(){
    const cohort=$('#orgAnnCohort').value||null;
    let program=$('#orgAnnProgram').value||null;
    if(cohort){program=$('#orgAnnCohort').selectedOptions[0].dataset.program||program}
    const {error}=await sb().rpc('lellee_create_organization_announcement_v1',{p_title:$('#orgAnnTitle').value.trim(),p_body:$('#orgAnnBody').value.trim(),p_program_id:program,p_cohort_id:cohort});if(error)throw error;closeDialog();await loadPage('organization-outreach');showOutreachTab('announcements');
  }
  async function sendAnnouncement(id){
    if(!confirm('Send this organization announcement inside Lellee now?'))return;
    const {data,error}=await sb().rpc('lellee_send_organization_announcement_v1',{p_announcement_id:id});if(error)throw error;alert(`Sent inside Lellee to ${data||0} participant account(s).`);await loadPage('organization-outreach');showOutreachTab('announcements');
  }

  function openFollowup(){
    const users=activeSponsored();
    dialog('Add Organization Follow-Up','Operational follow-up only. Do not copy private program, clinical, journal or crisis content.',`
      <form id="orgOpsFollowupForm"><div class="org-ops-form">
        <label class="wide">Title<input id="orgFollowTitle" required></label>
        <label>Related participant<select id="orgFollowUser"><option value="">No participant</option>${users.map(x=>`<option value="${x.user_id}">${esc(x.user_label||x.invited_email||'Sponsored participant')} · ${esc(x.program_name)}</option>`).join('')}</select></label>
        <label>Due<input id="orgFollowDue" type="datetime-local"></label>
        <label class="wide">Operational note<textarea id="orgFollowNote"></textarea></label>
      </div><div class="org-ops-footer"><button type="button" data-org-ops-close>Cancel</button><button class="primary" type="submit">Add follow-up</button></div></form>`);
  }
  async function saveFollowup(){
    const {error}=await sb().rpc('lellee_create_organization_followup_v1',{p_title:$('#orgFollowTitle').value.trim(),p_note:$('#orgFollowNote').value.trim()||null,p_due_at:$('#orgFollowDue').value?new Date($('#orgFollowDue').value).toISOString():null,p_related_user_id:$('#orgFollowUser').value||null});if(error)throw error;closeDialog();await loadPage('organization-outreach');showOutreachTab('followups');
  }
  async function completeFollowup(id){
    const {error}=await sb().rpc('lellee_complete_organization_followup_v1',{p_followup_id:id});if(error)throw error;await loadPage('organization-outreach');showOutreachTab('followups');
  }

  function renderAutomation(){
    const a=state.ctx?.automation||{},s=a.summary||{};
    setText('orgAutomationName',state.ctx.organization_name||'Organization');
    setText('orgAutomationRules',s.active_rules||0);setText('orgAutomationInvites',s.pending_invites||0);
    setText('orgAutomationFollowups',s.followups_due||0);setText('orgAutomationRuns',s.recent_runs||0);
    const rl=$('#orgAutomationRuleList');
    if(rl)rl.innerHTML=(a.rules||[]).length?(a.rules||[]).map(x=>`
      <article class="org-ops-item"><div class="org-ops-row"><div><b>${esc(x.name)}</b><small>${esc(title(x.trigger_event))} → ${esc(title(x.action_type))}</small></div><span class="org-ops-pill">${esc(title(x.status))}</span></div>
      <div class="org-ops-actions"><button class="primary" data-toggle-org-rule="${x.id}">${x.status==='active'?'Pause':'Activate'}</button></div></article>`).join(''):
      '<div class="org-ops-empty">No organization automation rules yet.</div>';
    const rr=$('#orgAutomationRunList');
    if(rr)rr.innerHTML=(a.runs||[]).length?(a.runs||[]).map(x=>`
      <article class="org-ops-item"><div class="org-ops-row"><div><b>${esc(x.rule_name)}</b><small>${esc(title(x.action_type))} · ${esc(dt(x.created_at))}</small></div><span class="org-ops-pill">${esc(title(x.status))}</span></div></article>`).join(''):
      '<div class="org-ops-empty">No automation runs yet.</div>';
  }
  function openAutomation(){
    dialog('Add Organization Automation','Automation can create internal follow-ups or announcement drafts only. It never auto-sends.',`
      <form id="orgOpsAutomationForm"><div class="org-ops-form">
        <label class="wide">Rule name<input id="orgAutoName" required></label>
        <label>Trigger<select id="orgAutoTrigger"><option value="sponsored_invite_pending">Sponsored invite created</option><option value="cohort_event_due">Cohort created with start date</option></select></label>
        <label>Action<select id="orgAutoAction"><option value="create_followup">Create internal follow-up</option><option value="create_announcement_draft">Create announcement draft</option></select></label>
        <label>Delay<input id="orgAutoDelay" type="number" min="0" max="720" value="24"></label>
        <label class="wide">Action title<input id="orgAutoTitle" value="Organization follow-up"></label>
        <label class="wide">Description<textarea id="orgAutoDescription"></textarea></label>
      </div><div class="org-ops-footer"><button type="button" data-org-ops-close>Cancel</button><button class="primary" type="submit">Create rule</button></div></form>`);
  }
  async function saveAutomation(){
    const {error}=await sb().rpc('lellee_create_organization_automation_rule_v1',{p_name:$('#orgAutoName').value.trim(),p_trigger_event:$('#orgAutoTrigger').value,p_action_type:$('#orgAutoAction').value,p_delay:Number($('#orgAutoDelay').value||0),p_action_title:$('#orgAutoTitle').value.trim()||null,p_description:$('#orgAutoDescription').value.trim()||null});if(error)throw error;closeDialog();await loadPage('organization-automation');
  }
  async function toggleRule(id){
    const {error}=await sb().rpc('lellee_toggle_organization_automation_rule_v1',{p_rule_id:id});if(error)throw error;await loadPage('organization-automation');
  }

  function showIntegrationTab(tab){
    document.querySelectorAll('[data-org-integration-tab]').forEach(b=>b.classList.toggle('active',b.dataset.orgIntegrationTab===tab));
    const map={jobs:'orgIntegrationPanelJobs',feeds:'orgIntegrationPanelFeeds',sso:'orgIntegrationPanelSso'};
    Object.entries(map).forEach(([k,id])=>$('#'+id)?.classList.toggle('hidden',k!==tab));
  }
  function renderIntegrations(tab='jobs'){
    const i=state.ctx?.integrations||{},s=i.summary||{};
    setText('orgIntegrationName',state.ctx.organization_name||'Organization');
    setText('orgIntegrationJobs',s.jobs||0);setText('orgIntegrationFeeds',s.feeds||0);
    setText('orgIntegrationClients',s.api_clients||0);setText('orgIntegrationSso',s.sso_status||'Prepared');
    const jl=$('#orgIntegrationJobList');
    if(jl)jl.innerHTML=(i.jobs||[]).length?(i.jobs||[]).map(x=>`
      <article class="org-ops-item"><div class="org-ops-row"><div><b>${esc(title(x.label))}</b><small>${esc(title(x.direction))} · ${esc(String(x.format).toUpperCase())} · ${esc(date(x.created_at))}</small></div><span class="org-ops-pill">${esc(title(x.status))}</span></div></article>`).join(''):
      '<div class="org-ops-empty">No staged data-exchange jobs yet.</div>';
    const fl=$('#orgIntegrationFeedList');
    if(fl)fl.innerHTML=(i.feeds||[]).length?(i.feeds||[]).map(x=>`
      <article class="org-ops-item"><div class="org-ops-row"><div><b>${esc(x.name)}</b><small>${esc(title(x.feed_type))} · ${esc(title(x.direction))}</small></div><span class="org-ops-pill">${esc(title(x.status))}</span></div></article>`).join(''):
      '<div class="org-ops-empty">No organization resource/data feeds have been prepared by an administrator.</div>';
    const sl=$('#orgIntegrationSsoList');
    if(sl)sl.innerHTML=(i.sso||[]).length?(i.sso||[]).map(x=>`
      <article class="org-ops-item"><div class="org-ops-row"><div><b>${esc(x.provider_label)}</b><small>${esc(String(x.protocol).toUpperCase())}${x.domain_hint?' · '+esc(x.domain_hint):''}</small></div><span class="org-ops-pill">${esc(title(x.status))}</span></div></article>`).join(''):
      '<div class="org-ops-empty">SSO is prepared architecturally but no provider configuration is enabled.</div>';
    const note=$('#page-organization-integrations .integration-note');
    if(note)note.innerHTML=`<b>Prepared does not mean connected.</b><p>External API: ${i.external_api_enabled?'ON':'OFF'} · Webhook delivery: ${i.webhook_delivery_enabled?'ON':'OFF'} · SSO: ${i.sso_enabled?'ON':'OFF'}. Data jobs are staged requests only.</p>`;
    showIntegrationTab(tab);
  }
  function openDataJob(){
    dialog('New Data-Exchange Job','Creates a staged request only. It does not upload, export or transmit data automatically.',`
      <form id="orgOpsDataJobForm"><div class="org-ops-form">
        <label>Direction<select id="orgJobDirection"><option value="import">Import preparation</option><option value="export">Export preparation</option></select></label>
        <label>Data type<select id="orgJobType"><option value="roster">Roster</option><option value="cohort">Cohort</option><option value="aggregate_report">Aggregate report</option><option value="resources">Resources</option><option value="configuration">Configuration</option></select></label>
        <label>Format<select id="orgJobFormat"><option value="csv">CSV</option><option value="json">JSON</option></select></label>
        <label class="wide">Reference / note<input id="orgJobReference" maxlength="500" placeholder="Optional internal reference; do not paste private data."></label>
      </div><div class="org-ops-footer"><button type="button" data-org-ops-close>Cancel</button><button class="primary" type="submit">Create staged job</button></div></form>`);
  }
  async function saveDataJob(){
    const {error}=await sb().rpc('lellee_create_organization_data_job_v1',{p_direction:$('#orgJobDirection').value,p_data_type:$('#orgJobType').value,p_format:$('#orgJobFormat').value,p_reference:$('#orgJobReference').value.trim()||null});if(error)throw error;closeDialog();await loadPage('organization-integrations');
  }

  function ensureFormButtons(){
    const page=$('#page-organization-forms .approved-inner-head');
    if(page&&!$('#orgNewOperationalForm')){const b=document.createElement('button');b.id='orgNewOperationalForm';b.className='approved-small-action';b.textContent='+ New Form';page.appendChild(b)}
  }
  function showFormsTab(tab){
    document.querySelectorAll('[data-org-forms-tab]').forEach(b=>b.classList.toggle('active',b.dataset.orgFormsTab===tab));
    const map={assignments:'orgFormsPanelAssignments',surveys:'orgFormsPanelSurveys',templates:'orgFormsPanelTemplates'};
    Object.entries(map).forEach(([k,id])=>$('#'+id)?.classList.toggle('hidden',k!==tab));
  }
  function renderForms(tab='assignments'){
    ensureFormButtons();
    const f=state.ctx?.forms||{},s=f.summary||{};
    setText('orgFormsName',state.ctx.organization_name||'Organization');
    setText('orgFormsAssigned',s.assigned||0);setText('orgFormsCompleted',s.completed||0);
    setText('orgFormsSurveys',s.surveys||0);setText('orgFormsTemplates',s.templates||0);
    const al=$('#orgFormAssignmentList');
    if(al)al.innerHTML=(f.assignments||[]).length?(f.assignments||[]).map(x=>`
      <article class="org-ops-item"><div class="org-ops-row"><div><b>${esc(x.form_title)}</b><small>${esc(x.participant_label)} · ${esc(title(x.form_type))}${x.due_at?' · due '+esc(dt(x.due_at)):''}</small></div><span class="org-ops-pill">${esc(title(x.status))}</span></div></article>`).join(''):
      '<div class="org-ops-empty">No operational form assignments yet.</div>';
    const sl=$('#orgSurveyList');
    if(sl)sl.innerHTML=(f.surveys||[]).length?(f.surveys||[]).map(x=>`
      <article class="org-ops-item"><div class="org-ops-row"><div><b>${esc(x.title)}</b><small>${esc(x.description||'')} · ${x.completed_count||0}/${x.assignment_count||0} completed</small></div><span class="org-ops-pill">${esc(title(x.status))}</span></div></article>`).join(''):
      '<div class="org-ops-empty">No aggregate survey forms yet.</div>';
    const tl=$('#orgFormTemplateList');
    if(tl)tl.innerHTML=(f.templates||[]).length?(f.templates||[]).map(x=>`
      <article class="org-ops-item"><div class="org-ops-row"><div><b>${esc(x.title)}</b><small>${esc(title(x.form_type))} · ${x.assignment_count||0} assignments</small></div><span class="org-ops-pill">${esc(title(x.status))}</span></div>
      <div class="org-ops-actions"><button class="primary" data-assign-org-form="${x.id}">Assign to Sponsored User</button></div></article>`).join(''):
      '<div class="org-ops-empty">No organization form templates yet.</div>';
    showFormsTab(tab);
  }
  function openForm(){
    const programs=activeLicenses();
    dialog('New Organization Form','Operational onboarding, acknowledgment or aggregate survey only. Private Lellee content is not included.',`
      <form id="orgOpsFormCreate"><div class="org-ops-form">
        <label class="wide">Title<input id="orgFormTitle" required></label>
        <label>Type<select id="orgFormType"><option value="acknowledgment">Acknowledgment</option><option value="survey">Aggregate survey</option><option value="intake">Operational intake</option></select></label>
        <label>Program<select id="orgFormProgram"><option value="">General organization form</option>${programs.map(x=>`<option value="${x.program_id}">${esc(x.program_name)}</option>`).join('')}</select></label>
        <label class="wide">Description<textarea id="orgFormDescription"></textarea></label>
        <label class="wide">Questions — one per line<textarea id="orgFormQuestions" placeholder="I understand this program is voluntary.&#10;What would help with onboarding?"></textarea></label>
      </div><div class="org-ops-footer"><button type="button" data-org-ops-close>Cancel</button><button class="primary" type="submit">Create form</button></div></form>`);
  }
  async function saveForm(){
    const questions=$('#orgFormQuestions').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    const {error}=await sb().rpc('lellee_create_organization_form_v1',{p_title:$('#orgFormTitle').value.trim(),p_description:$('#orgFormDescription').value.trim()||null,p_form_type:$('#orgFormType').value,p_program_id:$('#orgFormProgram').value||null,p_questions:questions});if(error)throw error;closeDialog();await loadPage('organization-forms');showFormsTab('templates');
  }
  function openAssignForm(formId){
    const users=state.ctx?.forms?.sponsored_users||[];
    if(!users.length)return alert('No active sponsored users are available.');
    dialog('Assign Organization Form','The organization sees operational assignment/completion status, not unrelated private Lellee content.',`
      <form id="orgOpsFormAssign" data-form-id="${formId}"><div class="org-ops-form">
        <label class="wide">Sponsored participant<select id="orgAssignSponsored">${users.map(x=>`<option value="${x.sponsored_access_id}">${esc(x.label)} · ${esc(x.program_name)}</option>`).join('')}</select></label>
        <label>Due<input id="orgAssignDue" type="datetime-local"></label>
      </div><div class="org-ops-footer"><button type="button" data-org-ops-close>Cancel</button><button class="primary" type="submit">Assign</button></div></form>`);
  }
  async function assignForm(formId){
    const {error}=await sb().rpc('lellee_assign_organization_form_v1',{p_form_id:formId,p_sponsored_access_id:$('#orgAssignSponsored').value,p_due_at:$('#orgAssignDue').value?new Date($('#orgAssignDue').value).toISOString():null});if(error)throw error;closeDialog();await loadPage('organization-forms');
  }

  function renderQuickstart(){
    const steps=state.ctx?.quickstart?.steps||[],done=steps.filter(x=>x.complete).length,total=steps.length||1,percent=Math.round(done*100/total);
    setText('orgQuickstartProgress',`${percent}% complete`);
    const bar=$('#orgQuickstartBar');if(bar)bar.style.width=`${percent}%`;
    const host=$('#orgQuickstartList');
    if(host)host.innerHTML=steps.map(x=>`
      <div class="org-ops-progress"><span class="org-ops-check ${x.complete?'done':''}">${x.complete?'✓':'○'}</span><div><b>${esc(x.label)}</b><small>${x.complete?'Complete':'Next step'}</small></div><button data-page="${esc(x.page)}">${x.complete?'Review':'Open'}</button></div>`).join('');
  }

  async function loadPage(page){
    try{
      await load(true);
      if(!state.ctx?.has_organization){pageClick('organization-setup');return}
      if(page==='organization-analytics')renderAnalytics();
      if(page==='organization-commerce')renderCommerce();
      if(page==='organization-outreach')renderOutreach();
      if(page==='organization-automation')renderAutomation();
      if(page==='organization-integrations')renderIntegrations();
      if(page==='organization-forms')renderForms();
      if(page==='organization-quickstart')renderQuickstart();
    }catch(err){console.error(err);alert(`Organization operations could not load: ${err.message||err}`)}
  }

  document.addEventListener('click',e=>{
    const page=e.target.closest('[data-page]');
    if(page&&['organization-analytics','organization-commerce','organization-outreach','organization-automation','organization-integrations','organization-forms','organization-quickstart'].includes(page.dataset.page)){
      setTimeout(()=>loadPage(page.dataset.page),40);
    }

    if(e.target.closest('[data-org-ops-close]'))closeDialog();

    const ot=e.target.closest('[data-org-crm-tab]');if(ot){e.preventDefault();e.stopImmediatePropagation();showOutreachTab(ot.dataset.orgCrmTab)}
    const it=e.target.closest('[data-org-integration-tab]');if(it){e.preventDefault();e.stopImmediatePropagation();showIntegrationTab(it.dataset.orgIntegrationTab)}
    const ft=e.target.closest('[data-org-forms-tab]');if(ft){e.preventDefault();e.stopImmediatePropagation();showFormsTab(ft.dataset.orgFormsTab)}

    if(e.target.closest('#orgRequestQuote')){e.preventDefault();e.stopImmediatePropagation();openQuote()}
    if(e.target.closest('#orgNewAnnouncement')){e.preventDefault();e.stopImmediatePropagation();openAnnouncement()}
    if(e.target.closest('#orgAddFollowup')){e.preventDefault();e.stopImmediatePropagation();openFollowup()}
    if(e.target.closest('#orgAutomationAddRule')){e.preventDefault();e.stopImmediatePropagation();openAutomation()}
    if(e.target.closest('#orgIntegrationNewJob')){e.preventDefault();e.stopImmediatePropagation();openDataJob()}
    if(e.target.closest('#orgNewOperationalForm')){e.preventDefault();e.stopImmediatePropagation();openForm()}

    const send=e.target.closest('[data-send-org-announcement]');if(send){e.preventDefault();sendAnnouncement(send.dataset.sendOrgAnnouncement).catch(err=>alert(err.message||String(err)))}
    const comp=e.target.closest('[data-complete-org-followup]');if(comp){e.preventDefault();completeFollowup(comp.dataset.completeOrgFollowup).catch(err=>alert(err.message||String(err)))}
    const tog=e.target.closest('[data-toggle-org-rule]');if(tog){e.preventDefault();toggleRule(tog.dataset.toggleOrgRule).catch(err=>alert(err.message||String(err)))}
    const assign=e.target.closest('[data-assign-org-form]');if(assign){e.preventDefault();openAssignForm(assign.dataset.assignOrgForm)}
  },true);

  document.addEventListener('submit',e=>{
    const id=e.target?.id;if(!id)return;
    const run=async fn=>{e.preventDefault();try{await fn()}catch(err){alert(err.message||String(err))}};
    if(id==='orgOpsQuoteForm')run(saveQuote);
    if(id==='orgOpsAnnouncementForm')run(saveAnnouncement);
    if(id==='orgOpsFollowupForm')run(saveFollowup);
    if(id==='orgOpsAutomationForm')run(saveAutomation);
    if(id==='orgOpsDataJobForm')run(saveDataJob);
    if(id==='orgOpsFormCreate')run(saveForm);
    if(id==='orgOpsFormAssign')run(()=>assignForm(e.target.dataset.formId));
  });

  function boot(){
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(bridge()&&user()){
        clearInterval(timer);state.user=user();
        const active=$('.page.active')?.id?.replace('page-','');
        if(['organization-analytics','organization-commerce','organization-outreach','organization-automation','organization-integrations','organization-forms','organization-quickstart'].includes(active))loadPage(active);
      }
      if(tries>240)clearInterval(timer);
    },250);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

  window.LelleeOrganizationOperations={loadPage};
})();