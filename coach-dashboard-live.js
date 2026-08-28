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
    user:null,
    business:null,
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
      const {data,error}=await c.client.rpc('get_my_coach_dashboard_context');
      if(error) throw error;
      state.context=data || {};
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
        <div class="coach-live-actions"><button class="primary" data-coach-message-rel="${r.id}">Message</button></div>
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

  function openAssignment(){
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