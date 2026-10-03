(() => {
  'use strict';

  const $ = s => document.querySelector(s);
  const esc = (v='') => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtDate = v => v ? new Date(v).toLocaleDateString() : '—';
  const fmtDateTime = v => v ? new Date(v).toLocaleString() : '—';
  const money = v => (v===null || v===undefined || v==='') ? 'Price not set' : `$${Number(v).toFixed(2)}`;
  const typeLabel = v => ({one_to_one:'1-to-1',group:'Group',hybrid:'Hybrid'}[v] || String(v||'').replaceAll('_',' '));
  const statusLabel = v => String(v||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());

  let state = {
    context:null,
    certification:null,
    user:null,
    business:null,
    selectedClient:null,
    clientWorkspace:null,
    loading:false
  };

  function bridge(){ return window.LelleeAuthContext?.client ? window.LelleeAuthContext : null; }
  function sb(){ return bridge()?.client; }
  function user(){ return bridge()?.getCurrentUser?.() || null; }
  function pageClick(page){ const el=document.querySelector(`[data-page="${page}"]`); if(el){ el.click(); return true; } return false; }

  function ensureDialog(){
    let d = $('#coachLiveDialog');
    if(!d){
      d=document.createElement('dialog');
      d.id='coachLiveDialog';
      d.className='coach-live-dialog';
      d.innerHTML='<div class="coach-live-dialog-inner" id="coachLiveDialogInner"></div>';
      document.body.appendChild(d);
    }
    return d;
  }

  function dialog(title, subtitle, body, footer=''){
    const d=ensureDialog(), inner=$('#coachLiveDialogInner');
    inner.innerHTML=`
      <div class="coach-live-dialog-head">
        <div><span class="approved-kicker">COACH BUSINESS</span><h3>${esc(title)}</h3><p>${esc(subtitle||'')}</p></div>
        <button class="coach-live-close" type="button" data-coach-live-close>×</button>
      </div>
      ${body}
      ${footer}`;
    d.showModal();
    return d;
  }

  function closeDialog(){ $('#coachLiveDialog')?.close(); }

  async function loadContext(){
    if(state.loading) return state.context;
    const c=bridge(), u=user();
    if(!c || !u) return null;
    state.loading=true;
    try{
      const [dashboardResult, certificationResult]=await Promise.all([
        c.client.rpc('get_my_coach_dashboard_context'),
        c.client.rpc('get_my_coach_certification_context')
      ]);
      if(dashboardResult.error) throw dashboardResult.error;
      if(certificationResult.error) throw certificationResult.error;
      state.context=dashboardResult.data || {};
      state.certification=certificationResult.data || {};
      state.user=u;
      state.business=state.context.business || null;
      return state.context;
    } finally {
      state.loading=false;
    }
  }

  async function loadBusinessPage(){
    try{
      const ctx=await loadContext();
      if(!ctx) return;

      const select=$('#coachPrimaryProgram');
      if(select){
        select.innerHTML=(ctx.programs||[]).map(p=>
          `<option value="${p.id}">${esc(p.name)}${p.status!=='active'?' · '+esc(statusLabel(p.status)):''}</option>`
        ).join('');
      }

      const b=ctx.business;
      if(b){
        $('#coachBusinessName').value=b.business_name||'';
        $('#coachPublicName').value=b.public_name||'';
        $('#coachPrimaryProgram').value=b.primary_program_id||'';
        $('#coachBusinessModel').value=b.business_model||'solo';
        $('#coachAudience').value=b.target_audience||'';
        $('#coachBio').value=b.bio||'';
        $('#coachCredentials').value=b.credentials_disclosure||'';
        $('#coachBusinessDisclosure').checked=!!b.submitted_at;
        $('#coachBusinessPrivacy').checked=!!b.submitted_at;

        const title=$('#coachBusinessStatusTitle'), text=$('#coachBusinessStatusText'), pill=$('#coachBusinessStatusPill');
        if(title) title.textContent=statusLabel(b.status);
        if(pill) pill.textContent=String(b.status||'').toUpperCase().replaceAll('_',' ');
        if(text){
          text.textContent = ({
            pending_review:'Your coaching business is waiting for human review.',
            approved:'Your coaching business is approved. You can open the Coach Dashboard.',
            rejected:'Changes are required before approval.',
            paused:'This coaching business is paused.',
            draft:'Complete the form and submit it for review.'
          })[b.status] || 'Review your coaching business information.';
        }

        if(b.review_note && $('#coachBusinessStatusCard') && !$('#coachBusinessReviewNote')){
          $('#coachBusinessStatusCard').insertAdjacentHTML('afterend',
            `<div class="coach-live-review-note" id="coachBusinessReviewNote"><b>Reviewer note:</b> ${esc(b.review_note)}</div>`);
        }

        if(!$('#coachBusinessOpenDashboard')){
          const footer=$('#submitCoachBusiness')?.parentElement;
          if(footer){
            const btn=document.createElement('button');
            btn.id='coachBusinessOpenDashboard';
            btn.type='button';
            btn.className='approved-link';
            btn.textContent='Open Coach Dashboard';
            btn.addEventListener('click',()=>pageClick('coach-dashboard'));
            footer.insertBefore(btn,$('#submitCoachBusiness'));
          }
        }
      }else{
        const title=$('#coachBusinessStatusTitle'), text=$('#coachBusinessStatusText'), pill=$('#coachBusinessStatusPill');
        if(title) title.textContent='Not Started';
        if(text) text.textContent='Create a coaching business profile to begin the human review process.';
        if(pill) pill.textContent='START';
      }
    }catch(err){
      console.error('Coach business page load failed',err);
      const msg=$('#coachBusinessMsg');
      if(msg) msg.textContent=err.message||String(err);
    }
  }

  async function submitBusiness(){
    const u=user();
    if(!u) return alert('Sign in required.');
    if(!$('#coachBusinessDisclosure')?.checked || !$('#coachBusinessPrivacy')?.checked){
      return alert('Confirm both professional-scope and privacy statements before submitting.');
    }
    const payload={
      p_business_name:$('#coachBusinessName').value.trim(),
      p_public_name:$('#coachPublicName').value.trim(),
      p_primary_program_id:$('#coachPrimaryProgram').value,
      p_business_model:$('#coachBusinessModel').value,
      p_target_audience:$('#coachAudience').value.trim() || null,
      p_bio:$('#coachBio').value.trim() || null,
      p_credentials_disclosure:$('#coachCredentials').value.trim() || null
    };
    if(!payload.p_business_name || !payload.p_public_name || !payload.p_primary_program_id){
      return alert('Business name, public name, and primary program are required.');
    }
    const btn=$('#submitCoachBusiness');
    const prior=btn?.textContent;
    if(btn){ btn.disabled=true; btn.textContent='Submitting…'; }
    try{
      const {error}=await sb().rpc('submit_my_coach_business',payload);
      if(error) throw error;
      state.context=null;
      const msg=$('#coachBusinessMsg');
      if(msg) msg.textContent='Submitted for human review.';
      await loadBusinessPage();
    }catch(err){
      alert(err.message||String(err));
    }finally{
      if(btn){ btn.disabled=false; btn.textContent=prior||'Submit Coaching Business'; }
    }
  }

  function businessRequired(){
    if(!state.context?.business){
      pageClick('coach-business');
      alert('Complete your coaching business setup first.');
      return false;
    }
    return true;
  }

  async function loadDashboard(){
    try{
      state.context=null;
      const ctx=await loadContext();
      if(!ctx) return;
      if(!ctx.has_business){
        pageClick('coach-business');
        return;
      }
      const b=ctx.business;
      $('#coachDashboardBusinessName').textContent=b.business_name || 'My Coaching Business';
      $('#coachMetricClients').textContent=ctx.metrics?.clients ?? 0;
      $('#coachMetricGroups').textContent=ctx.metrics?.groups ?? 0;
      $('#coachMetricCapacity').textContent=ctx.metrics?.open_seats ?? 0;
      $('#coachMetricMessages').textContent=ctx.metrics?.unread_messages ?? 0;
      renderReadiness();

      renderClients();
      renderGroups();
      renderServices();
      renderMessages();
      renderAssignments();
      renderLeads();

      const head=$('#page-coach-dashboard .approved-inner-head');
      if(head && !$('#coachDashboardRefresh')){
        const btn=document.createElement('button');
        btn.id='coachDashboardRefresh';
        btn.className='approved-link';
        btn.textContent='Refresh';
        btn.addEventListener('click',loadDashboard);
        head.appendChild(btn);
      }
      ensureMessageAction();
    }catch(err){
      console.error('Coach dashboard load failed',err);
      const host=$('#coachClientList');
      if(host) host.innerHTML=`<div class="coach-live-error">${esc(err.message||err)}</div>`;
    }
  }

  function renderReadiness(){
    const host=$('#coachReadinessGrid'); if(!host) return;
    const readiness=state.certification?.readiness || {};
    const items=[
      ['Business approved',readiness.business_approved],
      ['Credential submitted',readiness.credential_submitted],
      ['Training recorded',readiness.training_recorded],
      ['Certificate issued',readiness.certificate_issued]
    ];
    host.innerHTML=items.map(([label,complete])=>`
      <span class="coach-readiness-step ${complete?'complete':''}"><b>${complete?'✓':'○'}</b>${esc(label)}</span>
    `).join('');
  }

  function renderClients(){
    const host=$('#coachClientList'); if(!host) return;
    const rows=state.context?.clients||[];
    host.innerHTML=rows.length ? rows.map(r=>`
      <article class="coach-live-item">
        <div class="coach-live-row">
          <div><b>${esc(r.client_name||'Client')}</b><small>${esc(r.client_email||'')} ${r.program_name?'· '+esc(r.program_name):''}</small></div>
          <span class="coach-live-pill">${esc(statusLabel(r.status))}</span>
        </div>
        <div class="coach-live-meta"><span class="coach-live-pill">Started ${esc(fmtDate(r.started_at))}</span>${r.service_name?`<span class="coach-live-pill">${esc(r.service_name)}</span>`:''}</div>
        <div class="coach-live-actions"><button class="primary" data-coach-open-client="${r.id}">Open Client</button><button data-coach-message-rel="${r.id}">Message</button></div>
      </article>`).join('') :
      `<div class="coach-live-empty">No active coaching relationships yet. Invite a client after your business is approved.</div>`;
  }

  function renderGroups(){
    const host=$('#coachGroupList'); if(!host) return;
    const rows=state.context?.groups||[];
    host.innerHTML=rows.length ? rows.map(g=>`
      <article class="coach-live-item">
        <div class="coach-live-row">
          <div><b>${esc(g.name)}</b><small>${esc(g.program_name||'')} ${g.start_date?'· starts '+esc(fmtDate(g.start_date)):''}</small></div>
          <span class="coach-live-pill">${esc(statusLabel(g.status))}</span>
        </div>
        <div class="coach-live-meta">
          <span class="coach-live-pill">${g.members||0}/${g.capacity} members</span>
          <span class="coach-live-pill">${esc(money(g.group_price))}</span>
        </div>
        <div class="coach-live-actions"><button class="primary" data-coach-message-group="${g.id}">Message group</button></div>
      </article>`).join('') :
      `<div class="coach-live-empty">No groups yet. Create a group or hybrid coaching program when you are ready.</div>`;
  }

  function renderServices(){
    const host=$('#coachServiceList'); if(!host) return;
    const rows=state.context?.services||[];
    host.innerHTML=rows.length ? rows.map(s=>`
      <article class="coach-live-item">
        <div class="coach-live-row">
          <div><b>${esc(s.name)}</b><small>${esc(s.description||'')} ${s.program_name?'· '+esc(s.program_name):''}</small></div>
          <span class="coach-live-pill">${s.active?'ACTIVE':'INACTIVE'}</span>
        </div>
        <div class="coach-live-meta">
          <span class="coach-live-pill">${esc(typeLabel(s.service_type))}</span>
          <span class="coach-live-pill">${esc(money(s.price_amount))}</span>
          <span class="coach-live-pill">${esc(statusLabel(s.billing_model))}</span>
        </div>
      </article>`).join('') :
      `<div class="coach-live-empty">No services yet. Define a 1-to-1, group, hybrid, package, or free coaching offer.</div>`;
  }

  function messageTargetLabel(m){
    if(m.relationship_id){
      const c=(state.context?.clients||[]).find(x=>x.id===m.relationship_id);
      return c ? c.client_name : 'Client';
    }
    if(m.group_id){
      const g=(state.context?.groups||[]).find(x=>x.id===m.group_id);
      return g ? g.name : 'Group';
    }
    return 'Coaching';
  }

  function renderMessages(){
    const host=$('#coachMessageList'); if(!host) return;
    const rows=state.context?.messages||[];
    host.innerHTML=rows.length ? rows.map(m=>`
      <article class="coach-live-item">
        <div class="coach-live-row">
          <div><b>${esc(m.sender_label||'Participant')}</b><small>${esc(messageTargetLabel(m))} · ${esc(fmtDateTime(m.created_at))}</small></div>
          ${!m.read_at && m.sender_user_id!==state.user?.id?'<span class="coach-live-pill">NEW</span>':''}
        </div>
        <small style="font-size:.7rem;margin-top:8px;color:#403747">${esc(m.body)}</small>
      </article>`).join('') :
      `<div class="coach-live-empty">No coaching messages yet.</div>`;
  }

  function renderAssignments(){
    const host=$('#coachAssignmentList'); if(!host) return;
    const rows=state.context?.assignments||[];
    host.innerHTML=rows.length ? rows.map(a=>`
      <article class="coach-live-item">
        <div class="coach-live-row">
          <div><b>${esc(a.title)}</b><small>${esc(a.instructions||'')} ${a.program_name?'· '+esc(a.program_name):''}</small></div>
          <span class="coach-live-pill">${esc(statusLabel(a.status))}</span>
        </div>
        <div class="coach-live-meta">
          <span class="coach-live-pill">Due ${esc(a.due_at?fmtDateTime(a.due_at):'not set')}</span>
          <span class="coach-live-pill">${a.recipient_count||0} recipient${Number(a.recipient_count)===1?'':'s'}</span>
        </div>
      </article>`).join('') :
      `<div class="coach-live-empty">No assignments yet.</div>`;
  }

  function renderLeads(){
    const host=$('#coachLeadList'); if(!host) return;
    const rows=state.context?.leads||[];
    host.innerHTML=rows.length ? rows.map(l=>`
      <article class="coach-live-item">
        <div class="coach-live-row">
          <div><b>${esc(l.name||l.email||'Lead')}</b><small>${esc([l.email,l.phone,l.source].filter(Boolean).join(' · '))}</small></div>
          <span class="coach-live-pill">${esc(statusLabel(l.status))}</span>
        </div>
        ${l.notes?`<small style="margin-top:7px">${esc(l.notes)}</small>`:''}
      </article>`).join('') :
      `<div class="coach-live-empty">No leads yet.</div>`;
  }

  function ensureMessageAction(){
    const panel=$('#coachPanelMessages .coach-panel-head');
    if(panel && !$('#coachNewMessage')){
      const b=document.createElement('button');
      b.id='coachNewMessage';
      b.className='approved-small-action';
      b.textContent='+ New Message';
      panel.appendChild(b);
    }
  }

  function programOptions(selected=''){
    return (state.context?.programs||[]).map(p=>`<option value="${p.id}" ${p.id===selected?'selected':''}>${esc(p.name)}</option>`).join('');
  }

  function serviceOptions(){
    return `<option value="">No service package</option>`+(state.context?.services||[]).filter(s=>s.active).map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('');
  }

  function openInvite(){
    const b=state.context?.business;
    if(!b) return;
    if(b.status!=='approved') return alert('Human approval is required before inviting clients.');
    dialog('Invite Client','The client must sign in with the exact email address you invite.',`
      <form id="coachInviteForm">
        <div class="coach-live-form">
          <label class="wide">Client email<input id="coachInviteEmail" type="email" required></label>
          <label class="wide">Program<select id="coachInviteProgram">${programOptions(b.primary_program_id)}</select></label>
        </div>
        <div class="coach-live-footer"><button type="button" data-coach-live-close>Cancel</button><button class="primary" type="submit">Create invitation</button></div>
      </form>`);
  }

  async function createInvite(){
    const email=$('#coachInviteEmail').value.trim();
    const program=$('#coachInviteProgram').value;
    const {data,error}=await sb().rpc('create_coach_invite',{
      p_business_id:state.business.id,p_program_id:program,p_email:email
    });
    if(error) throw error;
    const link=`${location.origin}/app?coach_invite=${encodeURIComponent(data)}`;
    $('#coachLiveDialogInner').innerHTML=`
      <div class="coach-live-dialog-head"><div><span class="approved-kicker">INVITATION READY</span><h3>Send this private invitation link</h3><p>The link works only for the invited email address and expires according to the invitation policy.</p></div><button class="coach-live-close" data-coach-live-close>×</button></div>
      <div class="coach-invite-link" id="coachInviteLink">${esc(link)}</div>
      <div class="coach-live-footer"><button type="button" id="copyCoachInvite">Copy link</button><button class="primary" type="button" data-coach-live-close>Done</button></div>`;
  }

  function openService(){
    if(!businessRequired()) return;
    dialog('New Service','Define the offer now. Coach payment collection remains disabled.',`
      <form id="coachServiceForm">
        <div class="coach-live-form">
          <label class="wide">Service name<input id="liveServiceName" required></label>
          <label>Program<select id="liveServiceProgram">${programOptions(state.business.primary_program_id)}</select></label>
          <label>Service type<select id="liveServiceType"><option value="one_to_one">1-to-1</option><option value="group">Group</option><option value="hybrid">Hybrid</option></select></label>
          <label>Billing model<select id="liveServiceBilling"><option value="monthly">Monthly</option><option value="per_session">Per session</option><option value="package">Package</option><option value="free">Free</option></select></label>
          <label>Price<input id="liveServicePrice" type="number" min="0" step="0.01" placeholder="Optional"></label>
          <label>Sessions included<input id="liveServiceSessions" type="number" min="0" placeholder="Optional"></label>
          <label>Group capacity<input id="liveServiceCapacity" type="number" min="2" max="50" placeholder="Optional"></label>
          <label>Individual touchpoints<input id="liveServiceTouchpoints" type="number" min="0" placeholder="Optional"></label>
          <label class="wide">Description<textarea id="liveServiceDescription"></textarea></label>
        </div>
        <div class="coach-live-footer"><button type="button" data-coach-live-close>Cancel</button><button class="primary" type="submit">Create service</button></div>
      </form>`);
  }

  async function createService(){
    const row={
      business_id:state.business.id,
      program_id:$('#liveServiceProgram').value,
      name:$('#liveServiceName').value.trim(),
      description:$('#liveServiceDescription').value.trim()||null,
      service_type:$('#liveServiceType').value,
      billing_model:$('#liveServiceBilling').value,
      price_amount:$('#liveServicePrice').value===''?null:Number($('#liveServicePrice').value),
      sessions_included:$('#liveServiceSessions').value===''?null:Number($('#liveServiceSessions').value),
      group_capacity:$('#liveServiceCapacity').value===''?null:Number($('#liveServiceCapacity').value),
      individual_touchpoints:$('#liveServiceTouchpoints').value===''?null:Number($('#liveServiceTouchpoints').value),
      active:true
    };
    const {error}=await sb().from('coach_service_packages').insert(row);
    if(error) throw error;
    closeDialog(); await loadDashboard();
  }

  function openGroup(){
    if(!businessRequired()) return;
    dialog('New Group','Create a forming or active coaching group. Public enrollment stays off.',`
      <form id="coachGroupForm">
        <div class="coach-live-form">
          <label class="wide">Group name<input id="liveGroupName" required></label>
          <label>Program<select id="liveGroupProgram">${programOptions(state.business.primary_program_id)}</select></label>
          <label>Service package<select id="liveGroupService">${serviceOptions()}</select></label>
          <label>Capacity<input id="liveGroupCapacity" type="number" min="2" max="50" value="8"></label>
          <label>Status<select id="liveGroupStatus"><option value="forming">Forming</option><option value="active">Active</option></select></label>
          <label>Start date<input id="liveGroupStart" type="date"></label>
          <label>End date<input id="liveGroupEnd" type="date"></label>
          <label>Group price<input id="liveGroupPrice" type="number" min="0" step="0.01" placeholder="Optional"></label>
          <label class="wide">Description<textarea id="liveGroupDescription"></textarea></label>
        </div>
        <div class="coach-live-footer"><button type="button" data-coach-live-close>Cancel</button><button class="primary" type="submit">Create group</button></div>
      </form>`);
  }

  async function createGroup(){
    const row={
      business_id:state.business.id,
      program_id:$('#liveGroupProgram').value,
      service_package_id:$('#liveGroupService').value||null,
      name:$('#liveGroupName').value.trim(),
      description:$('#liveGroupDescription').value.trim()||null,
      capacity:Number($('#liveGroupCapacity').value||8),
      status:$('#liveGroupStatus').value,
      start_date:$('#liveGroupStart').value||null,
      end_date:$('#liveGroupEnd').value||null,
      group_price:$('#liveGroupPrice').value===''?null:Number($('#liveGroupPrice').value),
      public_enrollment_open:false,
      waitlist_enabled:true
    };
    const {error}=await sb().from('coach_groups').insert(row);
    if(error) throw error;
    closeDialog(); await loadDashboard();
  }

  function openLead(){
    if(!businessRequired()) return;
    dialog('Add Lead','Store business prospect/contact information only. Do not put private recovery information in lead notes.',`
      <form id="coachLeadForm">
        <div class="coach-live-form">
          <label>Name<input id="liveLeadName"></label>
          <label>Email<input id="liveLeadEmail" type="email"></label>
          <label>Phone<input id="liveLeadPhone"></label>
          <label>Source<input id="liveLeadSource" placeholder="Referral, social, website…"></label>
          <label>Interested service<select id="liveLeadService">${serviceOptions()}</select></label>
          <label>Status<select id="liveLeadStatus"><option value="new">New</option><option value="contacted">Contacted</option><option value="consultation">Consultation</option><option value="invited">Invited</option><option value="converted">Converted</option><option value="closed">Closed</option></select></label>
          <label class="wide">Notes<textarea id="liveLeadNotes" placeholder="Business/contact notes only"></textarea></label>
        </div>
        <div class="coach-live-footer"><button type="button" data-coach-live-close>Cancel</button><button class="primary" type="submit">Add lead</button></div>
      </form>`);
  }

  async function createLead(){
    const row={
      business_id:state.business.id,
      name:$('#liveLeadName').value.trim()||null,
      email:$('#liveLeadEmail').value.trim()||null,
      phone:$('#liveLeadPhone').value.trim()||null,
      source:$('#liveLeadSource').value.trim()||null,
      interested_service_id:$('#liveLeadService').value||null,
      status:$('#liveLeadStatus').value,
      notes:$('#liveLeadNotes').value.trim()||null
    };
    const {error}=await sb().from('coach_leads').insert(row);
    if(error) throw error;
    closeDialog(); await loadDashboard();
  }

  function assignmentTargets(){
    const clients=(state.context?.clients||[]).filter(x=>x.status==='active');
    const groups=(state.context?.groups||[]).filter(x=>['forming','active'].includes(x.status));
    return [
      ...clients.map(c=>`<option value="rel:${c.id}" data-program="${c.program_id}">Client · ${esc(c.client_name)}</option>`),
      ...groups.map(g=>`<option value="group:${g.id}" data-program="${g.program_id}">Group · ${esc(g.name)}</option>`)
    ].join('');
  }

  function openAssignment(kind='',targetId=''){
    if(!businessRequired()) return;
    if(!(state.context?.clients||[]).length && !(state.context?.groups||[]).length) return alert('Add a client relationship or group first.');
    dialog('New Assignment','Send a structured next step to one client or one group.',`
      <form id="coachAssignmentForm">
        <div class="coach-live-form">
          <label class="wide">Target<select id="liveAssignmentTarget">${assignmentTargets()}</select></label>
          <label class="wide">Title<input id="liveAssignmentTitle" required></label>
          <label class="wide">Instructions<textarea id="liveAssignmentInstructions"></textarea></label>
          <label>Due date/time<input id="liveAssignmentDue" type="datetime-local"></label>
        </div>
        <div class="coach-live-footer"><button type="button" data-coach-live-close>Cancel</button><button class="primary" type="submit">Create assignment</button></div>
      </form>`);
    if(kind&&targetId){
      const target=$('#liveAssignmentTarget');
      if(target) target.value=kind+':'+targetId;
    }
  }

  async function createAssignment(){
    const target=$('#liveAssignmentTarget').value;
    const [kind,targetId]=target.split(':');
    const opt=$('#liveAssignmentTarget').selectedOptions[0];
    const programId=opt.dataset.program;
    const row={
      business_id:state.business.id,
      coach_user_id:state.user.id,
      program_id:programId,
      title:$('#liveAssignmentTitle').value.trim(),
      instructions:$('#liveAssignmentInstructions').value.trim()||null,
      due_at:$('#liveAssignmentDue').value ? new Date($('#liveAssignmentDue').value).toISOString() : null,
      status:'active'
    };
    const {data,error}=await sb().from('coach_assignments').insert(row).select('id').single();
    if(error) throw error;
    const recipient={assignment_id:data.id,relationship_id:kind==='rel'?targetId:null,group_id:kind==='group'?targetId:null};
    const rr=await sb().from('coach_assignment_recipients').insert(recipient);
    if(rr.error){
      await sb().from('coach_assignments').delete().eq('id',data.id);
      throw rr.error;
    }
    closeDialog(); await loadDashboard();
  }

  function messageTargets(selectedKind='',selectedId=''){
    const clients=(state.context?.clients||[]).filter(x=>x.status==='active');
    const groups=(state.context?.groups||[]).filter(x=>['forming','active'].includes(x.status));
    return [
      ...clients.map(c=>`<option value="rel:${c.id}" ${selectedKind==='rel'&&selectedId===c.id?'selected':''}>Client · ${esc(c.client_name)}</option>`),
      ...groups.map(g=>`<option value="group:${g.id}" ${selectedKind==='group'&&selectedId===g.id?'selected':''}>Group · ${esc(g.name)}</option>`)
    ].join('');
  }

  function openMessage(kind='',id=''){
    if(!businessRequired()) return;
    const options=messageTargets(kind,id);
    if(!options) return alert('No active coaching relationship or group is available for messaging.');
    dialog('New Message','Messages stay inside the coaching relationship/group. Do not use this for emergencies.',`
      <form id="coachMessageForm">
        <div class="coach-live-form">
          <label class="wide">Recipient<select id="liveMessageTarget">${options}</select></label>
          <label class="wide">Message<textarea id="liveMessageBody" maxlength="4000" required></textarea></label>
        </div>
        <div class="coach-live-footer"><button type="button" data-coach-live-close>Cancel</button><button class="primary" type="submit">Send message</button></div>
      </form>`);
  }

  async function sendMessage(){
    const [kind,id]=$('#liveMessageTarget').value.split(':');
    const row={
      business_id:state.business.id,
      relationship_id:kind==='rel'?id:null,
      group_id:kind==='group'?id:null,
      sender_user_id:state.user.id,
      body:$('#liveMessageBody').value.trim()
    };
    const {error}=await sb().from('coach_messages').insert(row);
    if(error) throw error;
    closeDialog(); await loadDashboard();
  }

  async function markMessagesRead(){
    if(!state.business?.id) return;
    const {error}=await sb().rpc('mark_my_coach_messages_read',{p_business_id:state.business.id});
    if(error) console.warn('Could not update message read state',error);
    await loadDashboard();
  }

  async function handleInviteToken(){
    const token=new URLSearchParams(location.search).get('coach_invite');
    if(!token || !user()) return false;
    try{
      const {error}=await sb().rpc('accept_coach_invite',{p_token:token});
      if(error) throw error;
      const url=new URL(location.href);
      url.searchParams.delete('coach_invite');
      history.replaceState({},'',url.pathname+url.search+url.hash);
      pageClick('my-coaching');
      alert('Coaching invitation accepted. You control what Lellee information you share with your coach.');
      return true;
    }catch(err){
      alert(`Could not accept coaching invitation: ${err.message||err}`);
      return true;
    }
  }


  function clientForRelationship(id){
    return (state.context?.clients||[]).find(x=>x.id===id)||null;
  }

  function clientServiceOptions(client){
    const rows=(state.context?.services||[]).filter(s=>s.active&&s.program_id===client.program_id);
    return '<option value="">No service package</option>'+rows.map(s=>
      '<option value="'+esc(s.id)+'" '+(s.id===client.service_package_id?'selected':'')+'>'+esc(s.name)+' · '+esc(money(s.price_amount))+'</option>'
    ).join('');
  }

  async function loadClientWorkspaceData(client){
    const businessId=state.business?.id;
    if(!businessId) throw new Error('Coach business is unavailable.');
    const [memberships,sessions,shared,recipients,formAssignments,formDefinitions,followups]=await Promise.all([
      sb().from('coach_group_members').select('group_id,status,joined_at').eq('relationship_id',client.id),
      sb().from('coach_sessions').select('id,scheduled_start,duration_minutes,session_type,status,operational_note,created_at').eq('relationship_id',client.id).order('scheduled_start',{ascending:false}).limit(50),
      sb().from('coach_shared_items').select('id,share_type,title,shared_content,source_reference,shared_at,revoked_at').eq('relationship_id',client.id).is('revoked_at',null).order('shared_at',{ascending:false}).limit(50),
      sb().from('coach_assignment_recipients').select('assignment_id,completed_at').eq('relationship_id',client.id),
      sb().from('form_assignments').select('id,form_id,due_at,status,completed_at,created_at').eq('business_id',businessId).eq('user_id',client.client_user_id).order('created_at',{ascending:false}).limit(50),
      sb().from('form_definitions').select('id,title,description,form_type,program_id,status').eq('business_id',businessId).order('updated_at',{ascending:false}),
      sb().from('crm_followups').select('id,title,note,due_at,status,completed_at,created_at').eq('workspace_type','coach').eq('business_id',businessId).eq('related_user_id',client.client_user_id).order('created_at',{ascending:false}).limit(50)
    ]);
    for(const result of [memberships,sessions,shared,recipients,formAssignments,formDefinitions,followups]){
      if(result.error) throw result.error;
    }
    const assignmentMap=new Map((state.context?.assignments||[]).map(a=>[a.id,a]));
    const assigned=(recipients.data||[]).map(r=>({...r,assignment:assignmentMap.get(r.assignment_id)||null})).filter(x=>x.assignment);
    const formMap=new Map((formDefinitions.data||[]).map(x=>[x.id,x]));
    const forms=(formAssignments.data||[]).map(x=>({...x,definition:formMap.get(x.form_id)||null}));
    const availableIntake=(formDefinitions.data||[]).filter(x=>x.form_type==='intake'&&x.status==='published'&&(x.program_id===null||x.program_id===client.program_id));
    return {
      memberships:memberships.data||[],
      sessions:sessions.data||[],
      shared:shared.data||[],
      assignments:assigned,
      forms,
      availableIntake,
      followups:followups.data||[]
    };
  }

  function renderClientWorkspace(client,data){
    const inner=$('#coachLiveDialogInner'); if(!inner) return;
    const memberMap=new Map((data.memberships||[]).map(x=>[x.group_id,x]));
    const groups=(state.context?.groups||[]).filter(g=>g.program_id===client.program_id&&['forming','active'].includes(g.status));
    const groupRows=groups.map(g=>{
      const m=memberMap.get(g.id),active=m?.status==='active';
      return '<article class="coach-client-line"><div><b>'+esc(g.name)+'</b><small>'+esc(g.members||0)+'/'+esc(g.capacity)+' members · '+esc(statusLabel(g.status))+'</small></div>'+
        (client.status==='active'?'<button type="button" data-client-group-toggle="'+esc(g.id)+'" data-relationship-id="'+esc(client.id)+'" data-next-active="'+(active?'false':'true')+'">'+(active?'Remove':'Add')+'</button>':'')+
        '</article>';
    }).join('')||'<div class="coach-live-empty">No active groups match this client program.</div>';

    const sessionRows=(data.sessions||[]).map(s=>'<article class="coach-client-line"><div><b>'+esc(fmtDateTime(s.scheduled_start))+'</b><small>'+esc(statusLabel(s.session_type))+' · '+esc(s.duration_minutes)+' min'+(s.operational_note?' · '+esc(s.operational_note):'')+'</small></div><span class="coach-live-pill">'+esc(statusLabel(s.status))+'</span></article>').join('')||
      '<div class="coach-live-empty">No sessions scheduled for this client.</div>';

    const assignmentRows=(data.assignments||[]).map(x=>'<article class="coach-client-line"><div><b>'+esc(x.assignment.title)+'</b><small>Due '+esc(x.assignment.due_at?fmtDateTime(x.assignment.due_at):'not set')+'</small></div><span class="coach-live-pill">'+esc(x.completed_at?'Completed':statusLabel(x.assignment.status))+'</span></article>').join('')||
      '<div class="coach-live-empty">No assignments for this client.</div>';

    const formRows=(data.forms||[]).map(x=>'<article class="coach-client-line"><div><b>'+esc(x.definition?.title||'Assigned form')+'</b><small>'+esc(x.due_at?'Due '+fmtDateTime(x.due_at):'No due date')+'</small></div><span class="coach-live-pill">'+esc(statusLabel(x.status))+'</span></article>').join('')||
      '<div class="coach-live-empty">No forms assigned to this client.</div>';

    const followupRows=(data.followups||[]).map(x=>'<article class="coach-client-line"><div><b>'+esc(x.title)+'</b><small>'+esc(x.note||'')+(x.due_at?' · due '+esc(fmtDateTime(x.due_at)):'')+'</small></div><span class="coach-live-pill">'+esc(statusLabel(x.status))+'</span></article>').join('')||
      '<div class="coach-live-empty">No follow-ups for this client.</div>';

    const sharedRows=(data.shared||[]).map(x=>'<article class="coach-client-shared"><div class="coach-live-row"><div><b>'+esc(x.title||statusLabel(x.share_type))+'</b><small>'+esc(statusLabel(x.share_type))+' · shared '+esc(fmtDateTime(x.shared_at))+'</small></div><span class="coach-live-pill">CLIENT SHARED</span></div>'+(x.shared_content?'<p>'+esc(x.shared_content)+'</p>':'')+'</article>').join('')||
      '<div class="coach-live-empty">This client has not shared any Lellee items with this coach.</div>';

    const ended=client.status==='ended';
    inner.innerHTML=
      '<div class="coach-live-dialog-head"><div><span class="approved-kicker">CLIENT MANAGEMENT</span><h3>'+esc(client.client_name||'Client')+'</h3><p>'+esc(client.client_email||'')+' · '+esc(client.program_name||'Program')+'</p></div><button class="coach-live-close" type="button" data-coach-live-close>×</button></div>'+
      '<div class="coach-client-summary"><span class="coach-live-pill">'+esc(statusLabel(client.status))+'</span><span>Started '+esc(fmtDate(client.started_at))+'</span><span>Consent recorded for this coaching relationship</span></div>'+
      '<form id="coachClientRelationshipForm" data-relationship-id="'+esc(client.id)+'" class="coach-client-controls">'+
        '<label>Service package<select id="coachClientService" '+(ended?'disabled':'')+'>'+clientServiceOptions(client)+'</select></label>'+
        '<label>Relationship status<select id="coachClientStatus" '+(ended?'disabled':'')+'><option value="active" '+(client.status==='active'?'selected':'')+'>Active</option><option value="paused" '+(client.status==='paused'?'selected':'')+'>Paused</option>'+(ended?'<option value="ended" selected>Ended</option>':'')+'</select></label>'+
        '<button class="primary" type="submit" '+(ended?'disabled':'')+'>Save Client Setup</button>'+
      '</form>'+
      '<div class="coach-client-actions">'+
        '<button type="button" data-client-message="'+esc(client.id)+'">Message</button>'+
        '<button type="button" data-client-assignment="'+esc(client.id)+'" '+(client.status!=='active'?'disabled':'')+'>New Assignment</button>'+
        '<button type="button" data-client-session="'+esc(client.id)+'" '+(client.status!=='active'?'disabled':'')+'>Schedule Session</button>'+
        '<button type="button" data-client-followup="'+esc(client.id)+'">Add Follow-Up</button>'+
        '<button type="button" data-client-intake="'+esc(client.id)+'" '+(!(data.availableIntake||[]).length||client.status!=='active'?'disabled':'')+'>Assign Intake Form</button>'+
        (!ended?'<button type="button" class="danger" data-client-end="'+esc(client.id)+'">End Relationship</button>':'')+
      '</div>'+
      '<div class="coach-client-grid">'+
        '<section><h4>Groups</h4>'+groupRows+'</section>'+
        '<section><h4>Sessions</h4>'+sessionRows+'</section>'+
        '<section><h4>Assignments</h4>'+assignmentRows+'</section>'+
        '<section><h4>Forms</h4>'+formRows+'</section>'+
        '<section><h4>Follow-Ups</h4>'+followupRows+'</section>'+
        '<section class="wide"><h4>Shared by Client</h4><p class="coach-client-privacy">Only information the client explicitly shared with this coaching relationship appears here. Private journals, private check-ins and other unshared Lellee data are not available to the coach.</p>'+sharedRows+'</section>'+
      '</div>';
  }

  async function openClientManagement(relationshipId){
    const client=clientForRelationship(relationshipId);
    if(!client) return alert('Client relationship could not be found.');
    state.selectedClient=client;
    state.clientWorkspace=null;
    dialog(client.client_name||'Client','Loading client workspace…','<div class="coach-live-empty">Loading service, groups, sessions, assignments, forms and client-shared items…</div>');
    try{
      const data=await loadClientWorkspaceData(client);
      state.clientWorkspace=data;
      renderClientWorkspace(client,data);
    }catch(err){
      const inner=$('#coachLiveDialogInner');
      if(inner) inner.innerHTML='<div class="coach-live-dialog-head"><div><span class="approved-kicker">CLIENT MANAGEMENT</span><h3>Client workspace unavailable</h3></div><button class="coach-live-close" data-coach-live-close>×</button></div><div class="coach-live-error">'+esc(err.message||err)+'</div>';
    }
  }

  async function saveClientRelationship(){
    const client=state.selectedClient;
    if(!client) throw new Error('Client relationship is unavailable.');
    const service=$('#coachClientService')?.value||null;
    const status=$('#coachClientStatus')?.value||client.status;
    const {error}=await sb().rpc('update_my_coach_client_relationship',{
      p_relationship_id:client.id,p_service_package_id:service,p_status:status
    });
    if(error) throw error;
    closeDialog();
    state.context=null;
    await loadDashboard();
  }

  async function endClientRelationship(relationshipId){
    const client=clientForRelationship(relationshipId);
    if(!client) return;
    if(!confirm('End the coaching relationship with '+(client.client_name||'this client')+'? This also removes active group memberships. The client must consent to a new invitation before coaching can restart.')) return;
    const {error}=await sb().rpc('update_my_coach_client_relationship',{
      p_relationship_id:client.id,
      p_service_package_id:client.service_package_id||null,
      p_status:'ended'
    });
    if(error) throw error;
    closeDialog();
    state.context=null;
    await loadDashboard();
  }

  async function toggleClientGroup(relationshipId,groupId,active){
    const {error}=await sb().rpc('set_my_coach_client_group_membership',{
      p_relationship_id:relationshipId,p_group_id:groupId,p_active:active
    });
    if(error) throw error;
    state.context=null;
    await loadDashboard();
    await openClientManagement(relationshipId);
  }

  function openClientSession(relationshipId){
    const client=clientForRelationship(relationshipId);
    if(!client||client.status!=='active') return alert('An active coaching relationship is required to schedule a session.');
    state.selectedClient=client;
    dialog('Schedule Session',client.client_name||'Client',
      '<form id="coachClientSessionForm" data-relationship-id="'+esc(client.id)+'"><div class="coach-live-form">'+
        '<label class="wide">Date & time<input id="coachClientSessionStart" type="datetime-local" required></label>'+
        '<label>Duration (minutes)<input id="coachClientSessionDuration" type="number" min="10" max="240" value="50" required></label>'+
        '<label>Session type<select id="coachClientSessionType"><option value="coaching">Coaching</option><option value="checkin">Check-in</option></select></label>'+
        '<label class="wide">Operational note<textarea id="coachClientSessionNote" placeholder="Scheduling or operational note only."></textarea></label>'+
      '</div><div class="coach-live-footer"><button type="button" data-coach-open-client="'+esc(client.id)+'">Back</button><button class="primary" type="submit">Schedule</button></div></form>');
  }

  async function createClientSession(){
    const client=state.selectedClient;
    if(!client) throw new Error('Client relationship is unavailable.');
    const start=$('#coachClientSessionStart')?.value;
    if(!start) throw new Error('Choose a session date and time.');
    const row={
      business_id:state.business.id,
      coach_user_id:state.user.id,
      relationship_id:client.id,
      group_id:null,
      scheduled_start:new Date(start).toISOString(),
      duration_minutes:Number($('#coachClientSessionDuration')?.value||50),
      session_type:$('#coachClientSessionType')?.value||'coaching',
      status:'scheduled',
      operational_note:$('#coachClientSessionNote')?.value.trim()||null
    };
    const {error}=await sb().from('coach_sessions').insert(row);
    if(error) throw error;
    await openClientManagement(client.id);
  }

  function openClientFollowup(relationshipId){
    const client=clientForRelationship(relationshipId);
    if(!client) return;
    state.selectedClient=client;
    dialog('Add Follow-Up',client.client_name||'Client',
      '<form id="coachClientFollowupForm"><div class="coach-live-form">'+
        '<label class="wide">Follow-up title<input id="coachClientFollowupTitle" required></label>'+
        '<label class="wide">Due date/time<input id="coachClientFollowupDue" type="datetime-local"></label>'+
        '<label class="wide">Note<textarea id="coachClientFollowupNote" placeholder="Business/operational follow-up note."></textarea></label>'+
      '</div><div class="coach-live-footer"><button type="button" data-coach-open-client="'+esc(client.id)+'">Back</button><button class="primary" type="submit">Add Follow-Up</button></div></form>');
  }

  async function createClientFollowup(){
    const client=state.selectedClient;
    if(!client) throw new Error('Client relationship is unavailable.');
    const row={
      owner_user_id:state.user.id,
      workspace_type:'coach',
      business_id:state.business.id,
      organization_id:null,
      related_user_id:client.client_user_id,
      consultation_request_id:null,
      lead_id:null,
      title:$('#coachClientFollowupTitle')?.value.trim(),
      note:$('#coachClientFollowupNote')?.value.trim()||null,
      due_at:$('#coachClientFollowupDue')?.value?new Date($('#coachClientFollowupDue').value).toISOString():null,
      status:'open'
    };
    if(!row.title) throw new Error('Follow-up title is required.');
    const {error}=await sb().from('crm_followups').insert(row);
    if(error) throw error;
    await openClientManagement(client.id);
  }

  function openClientIntake(relationshipId){
    const client=clientForRelationship(relationshipId);
    if(!client||client.status!=='active') return alert('An active coaching relationship is required.');
    const forms=state.clientWorkspace?.availableIntake||[];
    if(!forms.length) return alert('No published intake form is available for this client program.');
    state.selectedClient=client;
    dialog('Assign Intake Form',client.client_name||'Client',
      '<form id="coachClientIntakeForm"><div class="coach-live-form">'+
        '<label class="wide">Form<select id="coachClientIntakeSelect">'+forms.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.title)+'</option>').join('')+'</select></label>'+
        '<label class="wide">Due date/time<input id="coachClientIntakeDue" type="datetime-local"></label>'+
      '</div><div class="coach-live-footer"><button type="button" data-coach-open-client="'+esc(client.id)+'">Back</button><button class="primary" type="submit">Assign Form</button></div></form>');
  }

  async function assignClientIntake(){
    const client=state.selectedClient;
    if(!client) throw new Error('Client relationship is unavailable.');
    const due=$('#coachClientIntakeDue')?.value;
    const {error}=await sb().rpc('assign_coach_intake_form',{
      p_form_id:$('#coachClientIntakeSelect')?.value,
      p_client_user_id:client.client_user_id,
      p_due_at:due?new Date(due).toISOString():null
    });
    if(error) throw error;
    await openClientManagement(client.id);
  }

  async function loadAdminCoachReview(){
    if(!user()) return;
    const bq=await sb().from('coach_businesses')
      .select('id,business_name,public_name,business_model,target_audience,bio,credentials_disclosure,status,review_note,marketplace_visible,submitted_at,reviewed_at,primary_program_id')
      .order('submitted_at',{ascending:false,nullsFirst:false});
    if(bq.error){
      const host=$('#coachAdminList'); if(host) host.innerHTML=`<div class="coach-live-error">${esc(bq.error.message)}</div>`;
      return;
    }
    const programs=(state.context?.programs)||[];
    const pname=id=>programs.find(p=>p.id===id)?.name||'Program';
    const rows=bq.data||[];
    $('#coachAdminPending').textContent=rows.filter(x=>x.status==='pending_review').length;
    $('#coachAdminApproved').textContent=rows.filter(x=>x.status==='approved').length;
    $('#coachAdminMarketplace').textContent=rows.filter(x=>x.marketplace_visible).length;
    const host=$('#coachAdminList'); if(!host) return;
    host.innerHTML=rows.length?rows.map(b=>`
      <article class="coach-live-item">
        <div class="coach-live-row">
          <div><b>${esc(b.business_name)}</b><small>${esc(b.public_name)} · ${esc(pname(b.primary_program_id))} · ${esc(statusLabel(b.business_model))}</small></div>
          <span class="coach-live-pill">${esc(statusLabel(b.status))}</span>
        </div>
        <small style="margin-top:8px"><b>Audience:</b> ${esc(b.target_audience||'Not provided')}</small>
        <small><b>Bio:</b> ${esc(b.bio||'Not provided')}</small>
        <small><b>Credentials/disclosure:</b> ${esc(b.credentials_disclosure||'Not provided')}</small>
        ${b.review_note?`<div class="coach-live-review-note"><b>Review note:</b> ${esc(b.review_note)}</div>`:''}
        <div class="coach-admin-review-actions">
          <button class="approve" data-coach-admin-decision="approved" data-business-id="${b.id}">Approve</button>
          <button data-coach-admin-decision="pending_review" data-business-id="${b.id}">Return to Review</button>
          <button data-coach-admin-decision="paused" data-business-id="${b.id}">Pause</button>
          <button class="reject" data-coach-admin-decision="rejected" data-business-id="${b.id}">Reject / Changes</button>
        </div>
      </article>`).join(''):`<div class="coach-live-empty">No coaching businesses have been submitted.</div>`;
  }

  async function adminDecision(businessId,decision){
    const note=decision==='approved' ? (prompt('Optional approval note:','')||'') : (prompt('Reviewer note:','')||'');
    if(decision==='rejected' && !note.trim()) return alert('Add a review note explaining what must change.');
    const {error}=await sb().rpc('admin_review_coach_business',{
      p_business_id:businessId,p_decision:decision,p_review_note:note||null
    });
    if(error) throw error;
    await loadAdminCoachReview();
  }

  function showCoachTab(tab){
    document.querySelectorAll('[data-coach-tab]').forEach(b=>b.classList.toggle('active',b.dataset.coachTab===tab));
    ['clients','groups','services','messages','assignments','leads'].forEach(name=>{
      const el=$(`#coachPanel${name[0].toUpperCase()+name.slice(1)}`);
      if(el) el.classList.toggle('hidden',name!==tab);
    });
    if(tab==='messages') markMessagesRead();
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('[data-coach-live-close]')) closeDialog();

    const page=e.target.closest('[data-page]');
    if(page){
      const p=page.dataset.page;
      if(p==='coach-business') setTimeout(()=>{state.context=null;loadBusinessPage();},40);
      if(p==='coach-dashboard') setTimeout(loadDashboard,40);
      if(p==='coach-admin') setTimeout(async()=>{state.context=null;await loadContext();loadAdminCoachReview();},40);
    }

    const tab=e.target.closest('[data-coach-tab]');
    if(tab){
      e.preventDefault(); e.stopImmediatePropagation();
      showCoachTab(tab.dataset.coachTab);
    }

    if(e.target.closest('#submitCoachBusiness')){
      e.preventDefault(); e.stopImmediatePropagation(); submitBusiness();
    }
    if(e.target.closest('#coachInviteClient')){
      e.preventDefault(); e.stopImmediatePropagation(); openInvite();
    }
    if(e.target.closest('#coachNewService')){
      e.preventDefault(); e.stopImmediatePropagation(); openService();
    }
    if(e.target.closest('#coachNewGroup')){
      e.preventDefault(); e.stopImmediatePropagation(); openGroup();
    }
    if(e.target.closest('#coachNewLead')){
      e.preventDefault(); e.stopImmediatePropagation(); openLead();
    }
    if(e.target.closest('#coachNewAssignment')){
      e.preventDefault(); e.stopImmediatePropagation(); openAssignment();
    }
    if(e.target.closest('#coachNewMessage')){
      e.preventDefault(); e.stopImmediatePropagation(); openMessage();
    }

    const openClient=e.target.closest('[data-coach-open-client]');
    if(openClient){ e.preventDefault(); openClientManagement(openClient.dataset.coachOpenClient); }

    const clientMessage=e.target.closest('[data-client-message]');
    if(clientMessage){ e.preventDefault(); openMessage('rel',clientMessage.dataset.clientMessage); }
    const clientAssignment=e.target.closest('[data-client-assignment]');
    if(clientAssignment){ e.preventDefault(); openAssignment('rel',clientAssignment.dataset.clientAssignment); }
    const clientSession=e.target.closest('[data-client-session]');
    if(clientSession){ e.preventDefault(); openClientSession(clientSession.dataset.clientSession); }
    const clientFollowup=e.target.closest('[data-client-followup]');
    if(clientFollowup){ e.preventDefault(); openClientFollowup(clientFollowup.dataset.clientFollowup); }
    const clientIntake=e.target.closest('[data-client-intake]');
    if(clientIntake){ e.preventDefault(); openClientIntake(clientIntake.dataset.clientIntake); }
    const clientEnd=e.target.closest('[data-client-end]');
    if(clientEnd){ e.preventDefault(); endClientRelationship(clientEnd.dataset.clientEnd).catch(err=>alert(err.message||String(err))); }
    const groupToggle=e.target.closest('[data-client-group-toggle]');
    if(groupToggle){
      e.preventDefault();
      toggleClientGroup(groupToggle.dataset.relationshipId,groupToggle.dataset.clientGroupToggle,groupToggle.dataset.nextActive==='true').catch(err=>alert(err.message||String(err)));
    }

    const rel=e.target.closest('[data-coach-message-rel]');
    if(rel){ e.preventDefault(); openMessage('rel',rel.dataset.coachMessageRel); }
    const grp=e.target.closest('[data-coach-message-group]');
    if(grp){ e.preventDefault(); openMessage('group',grp.dataset.coachMessageGroup); }

    const dec=e.target.closest('[data-coach-admin-decision]');
    if(dec){
      e.preventDefault();
      adminDecision(dec.dataset.businessId,dec.dataset.coachAdminDecision).catch(err=>alert(err.message||String(err)));
    }

    if(e.target.closest('#copyCoachInvite')){
      const txt=$('#coachInviteLink')?.textContent||'';
      navigator.clipboard?.writeText(txt).then(()=>{e.target.textContent='Copied';}).catch(()=>{});
    }
  },true);

  document.addEventListener('submit',e=>{
    const id=e.target?.id;
    if(!id) return;
    const run=async fn=>{
      e.preventDefault();
      try{ await fn(); }catch(err){ alert(err.message||String(err)); }
    };
    if(id==='coachInviteForm') run(createInvite);
    if(id==='coachServiceForm') run(createService);
    if(id==='coachGroupForm') run(createGroup);
    if(id==='coachLeadForm') run(createLead);
    if(id==='coachAssignmentForm') run(createAssignment);
    if(id==='coachMessageForm') run(sendMessage);
    if(id==='coachClientRelationshipForm') run(saveClientRelationship);
    if(id==='coachClientSessionForm') run(createClientSession);
    if(id==='coachClientFollowupForm') run(createClientFollowup);
    if(id==='coachClientIntakeForm') run(assignClientIntake);
  });

  function boot(){
    const timer=setInterval(async()=>{
      if(bridge() && user()){
        clearInterval(timer);
        state.user=user();
        await handleInviteToken();
        const active=$('.page.active');
        if(active?.id==='page-coach-business') loadBusinessPage();
        if(active?.id==='page-coach-dashboard') loadDashboard();
        if(active?.id==='page-coach-admin'){ await loadContext(); loadAdminCoachReview(); }
      }
    },250);
    setTimeout(()=>clearInterval(timer),60000);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();

  window.LelleeCoachDashboardLive={loadDashboard,loadBusinessPage,loadAdminCoachReview};
})();
