(() => {
  'use strict';

  const $=s=>document.querySelector(s);
  const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const title=v=>String(v||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
  const dt=v=>v?new Date(v).toLocaleString():'—';
  const date=v=>v?new Date(v).toLocaleDateString():'—';

  let state={ctx:null,user:null,loading:false};

  function bridge(){return window.LelleeAuthContext?.client?window.LelleeAuthContext:null}
  function sb(){return bridge()?.client}
  function user(){return bridge()?.getCurrentUser?.()||null}
  function pageClick(p){const e=document.querySelector(`[data-page="${p}"]`);if(e){e.click();return true}return false}

  function ensureDialog(){
    let d=$('#orgLiveDialog');
    if(!d){d=document.createElement('dialog');d.id='orgLiveDialog';d.className='org-live-dialog';d.innerHTML='<div class="org-live-dialog-inner" id="orgLiveDialogInner"></div>';document.body.appendChild(d)}
    return d;
  }
  function dialog(name,sub,body){
    const d=ensureDialog();$('#orgLiveDialogInner').innerHTML=`<div class="org-live-dialog-head"><div><span class="approved-kicker">ORGANIZATION</span><h3>${esc(name)}</h3><p>${esc(sub||'')}</p></div><button class="org-live-close" data-org-live-close type="button">×</button></div>${body}`;d.showModal();return d;
  }
  function closeDialog(){$('#orgLiveDialog')?.close()}

  async function load(force=false){
    if(state.loading)return state.ctx;
    if(state.ctx&&!force)return state.ctx;
    const c=bridge(),u=user();if(!c||!u)return null;
    state.loading=true;
    try{
      const {data,error}=await c.client.rpc('get_my_organization_dashboard_context');
      if(error)throw error;
      state.ctx=data||{};state.user=u;return state.ctx;
    }finally{state.loading=false}
  }

  function setText(id,v){const e=$('#'+id);if(e)e.textContent=v}

  async function loadSetup(){
    try{
      const c=await load(true);if(!c)return;
      const o=c.organization;
      if(o){
        $('#orgName').value=o.name||'';$('#orgType').value=o.organization_type||'nonprofit';
        $('#orgPublicName').value=o.public_name||'';$('#orgContactEmail').value=o.contact_email||'';
        $('#orgAudience').value=o.target_audience||'';
        const msg=$('#orgSetupMsg');if(msg)msg.textContent=`Status: ${title(o.status)}`;
        if(o.review_note&&!$('#orgSetupReviewNote')){
          $('#submitOrganization')?.parentElement?.insertAdjacentHTML('beforebegin',`<div class="org-live-review" id="orgSetupReviewNote"><b>Reviewer note:</b> ${esc(o.review_note)}</div>`);
        }
        $('#submitOrganization').textContent=o.status==='approved'?'Update & Resubmit':'Submit Organization';
        if(!$('#openOrgDashboard')){
          const b=document.createElement('button');b.id='openOrgDashboard';b.type='button';b.className='approved-link';b.textContent='Open Organization Dashboard';b.addEventListener('click',()=>pageClick('organization-dashboard'));$('#submitOrganization')?.parentElement?.insertBefore(b,$('#submitOrganization'));
        }
      }
    }catch(err){const m=$('#orgSetupMsg');if(m)m.textContent=err.message||String(err)}
  }

  async function submitOrg(){
    const payload={p_name:$('#orgName').value.trim(),p_public_name:$('#orgPublicName').value.trim(),p_organization_type:$('#orgType').value,p_contact_email:$('#orgContactEmail').value.trim(),p_target_audience:$('#orgAudience').value.trim()||null};
    if(!payload.p_name||!payload.p_public_name||!payload.p_contact_email)return alert('Organization name, public name and contact email are required.');
    const {error}=await sb().rpc('submit_my_organization',payload);if(error)throw error;
    state.ctx=null;const m=$('#orgSetupMsg');if(m)m.textContent='Submitted for human review.';await loadSetup();
  }

  function renderDashboard(){
    const c=state.ctx||{},o=c.organization||{},m=c.metrics||{};
    setText('orgDashboardName',o.name||'Organization');
    setText('orgMetricSeats',m.sponsored_seats||0);setText('orgMetricAssigned',m.assigned||0);
    setText('orgMetricActive',m.active_users||0);setText('orgMetricPrograms',m.licensed_programs||0);

    const lic=$('#orgLicenseList');
    if(lic)lic.innerHTML=(c.licenses||[]).length?(c.licenses||[]).map(x=>`
      <article class="org-live-item"><div class="org-live-row"><div><b>${esc(x.program_name)}</b><small>${esc(title(x.license_model))} · ${x.seats_used||0}/${x.seat_limit||0} seats assigned</small></div><span class="org-live-pill">${esc(title(x.status))}</span></div>
      ${x.review_note?`<div class="org-live-review">${esc(x.review_note)}</div>`:''}</article>`).join(''):
      '<div class="org-live-empty">No program licenses requested yet.</div>';

    const people=$('#orgSponsoredList');
    if(people)people.innerHTML=(c.sponsored||[]).length?(c.sponsored||[]).map(x=>`
      <article class="org-live-item"><div class="org-live-row"><div><b>${esc(x.user_label||x.invited_email||'Sponsored participant')}</b><small>${esc(x.program_name)} · invited ${esc(date(x.invited_at))}</small></div><span class="org-live-pill">${esc(title(x.status))}</span></div></article>`).join(''):
      '<div class="org-live-empty">No sponsored-access invitations yet.</div>';

    const cohorts=$('#orgCohortList');
    if(cohorts)cohorts.innerHTML=(c.cohorts||[]).length?(c.cohorts||[]).map(x=>`
      <article class="org-live-item"><div class="org-live-row"><div><b>${esc(x.name)}</b><small>${esc(x.program_name)}${x.location_label?' · '+esc(x.location_label):''}${x.funding_source?' · '+esc(x.funding_source):''}</small></div><span class="org-live-pill">${x.members||0}/${x.capacity||0}</span></div><div class="org-live-meta"><span class="org-live-pill">${esc(title(x.status))}</span>${x.starts_at?`<span class="org-live-pill">Starts ${esc(date(x.starts_at))}</span>`:''}</div></article>`).join(''):
      '<div class="org-live-empty">No cohorts yet.</div>';

    const report=$('#orgReportCards');
    if(report){
      const r=c.report||{};
      report.innerHTML=[
        ['Assigned sponsored seats',r.assigned_seats||0],
        ['Active sponsored users',r.active_sponsored_users||0],
        ['Programs in use',r.programs_in_use||0],
        ['Active/forming cohorts',r.cohorts||0]
      ].map(x=>`<article><b>${esc(x[1])}</b><small>${esc(x[0])}</small></article>`).join('');
    }

    const team=$('#orgTeamList');
    if(team)team.innerHTML=[...(c.team||[]).map(x=>`
      <article class="org-live-item"><div class="org-live-row"><div><b>${esc(x.email||'Organization member')}</b><small>${esc(title(x.role))}</small></div><span class="org-live-pill">${esc(title(x.status))}</span></div></article>`),
      ...(c.team_invitations||[]).filter(x=>x.status==='pending').map(x=>`
      <article class="org-live-item"><div class="org-live-row"><div><b>${esc(x.invited_email)}</b><small>Invitation expires ${esc(date(x.expires_at))}</small></div><span class="org-live-pill">INVITED · ${esc(title(x.role))}</span></div></article>`)
    ].join('')||'<div class="org-live-empty">No organization team members yet.</div>';
  }

  async function loadDashboard(){
    try{await load(true);if(!state.ctx?.has_organization){pageClick('organization-setup');return}renderDashboard()}catch(err){console.error(err);alert(err.message||String(err))}
  }

  function showTab(tab){
    document.querySelectorAll('[data-org-tab]').forEach(b=>b.classList.toggle('active',b.dataset.orgTab===tab));
    const map={licenses:'orgPanelLicenses',people:'orgPanelPeople',cohorts:'orgPanelCohorts',reports:'orgPanelReports',team:'orgPanelTeam'};
    Object.entries(map).forEach(([k,id])=>$('#'+id)?.classList.toggle('hidden',k!==tab));
  }

  function activeLicenses(){return (state.ctx?.licenses||[]).filter(x=>x.status==='active')}

  function openLicense(){
    const o=state.ctx?.organization;if(!o)return;
    if(o.status!=='approved')return alert('Human organization approval is required before requesting a program license.');
    const existing=new Set((state.ctx?.licenses||[]).map(x=>x.program_id));
    const programs=(state.ctx?.programs||[]).filter(p=>!existing.has(p.id));
    if(!programs.length)return alert('Every available program already has a license record.');
    dialog('Request Program License','This creates a request only. A Lellee administrator must activate the license.',`
      <form id="orgLicenseForm"><div class="org-live-form">
        <label class="wide">Program<select id="orgLiveProgram">${programs.map(p=>`<option value="${p.id}">${esc(p.name)} · ${esc(title(p.status))}</option>`).join('')}</select></label>
        <label>Requested seats<input id="orgLiveSeats" type="number" min="1" max="100000" value="25"></label>
        <label>License model<select id="orgLiveModel"><option value="sponsored_seats">Sponsored seats</option><option value="site_license">Site license</option><option value="pilot">Pilot</option><option value="grant_sponsored">Grant sponsored</option><option value="enterprise">Enterprise</option></select></label>
        <label class="wide">Notes<textarea id="orgLiveLicenseNotes"></textarea></label>
      </div><div class="org-live-footer"><button type="button" data-org-live-close>Cancel</button><button class="primary" type="submit">Request program</button></div></form>`);
  }
  async function saveLicense(){
    const {error}=await sb().rpc('request_organization_program_license',{p_organization_id:state.ctx.organization.id,p_program_id:$('#orgLiveProgram').value,p_requested_seats:Number($('#orgLiveSeats').value||25),p_license_model:$('#orgLiveModel').value,p_notes:$('#orgLiveLicenseNotes').value.trim()||null});if(error)throw error;closeDialog();await loadDashboard();showTab('licenses');
  }

  function openSponsorInvite(){
    const licenses=activeLicenses();if(!licenses.length)return alert('An active program license is required before inviting sponsored participants.');
    dialog('Invite Sponsored Participant','The private link is tied to the invited email and approved program license.',`
      <form id="orgSponsorInviteForm"><div class="org-live-form">
        <label class="wide">Email<input id="orgSponsorEmail" type="email" required></label>
        <label class="wide">Program license<select id="orgSponsorLicense">${licenses.map(x=>`<option value="${x.id}">${esc(x.program_name)} · ${x.seats_used||0}/${x.seat_limit||0} assigned</option>`).join('')}</select></label>
      </div><div class="org-live-footer"><button type="button" data-org-live-close>Cancel</button><button class="primary" type="submit">Create invitation</button></div></form>`);
  }
  async function createSponsorInvite(){
    const {data,error}=await sb().rpc('create_organization_sponsored_invite',{p_organization_id:state.ctx.organization.id,p_license_id:$('#orgSponsorLicense').value,p_email:$('#orgSponsorEmail').value.trim()});if(error)throw error;
    const link=`${location.origin}/app?org_invite=${encodeURIComponent(data)}`;
    $('#orgLiveDialogInner').innerHTML=`<div class="org-live-dialog-head"><div><span class="approved-kicker">SPONSORED ACCESS</span><h3>Invitation ready</h3><p>Send this private link to the invited person.</p></div><button class="org-live-close" data-org-live-close>×</button></div><div class="org-invite-link" id="orgInviteLink">${esc(link)}</div><div class="org-live-footer"><button id="copyOrgInvite" type="button">Copy link</button><button class="primary" data-org-live-close type="button">Done</button></div>`;
  }

  function openCohort(){
    const licenses=activeLicenses();if(!licenses.length)return alert('An active program license is required before creating a cohort.');
    dialog('New Cohort','Organize sponsored participants by program, location or funding source.',`
      <form id="orgCohortForm"><div class="org-live-form">
        <label class="wide">Cohort name<input id="orgCohortName" required></label>
        <label>Program<select id="orgCohortProgram">${licenses.map(x=>`<option value="${x.program_id}">${esc(x.program_name)}</option>`).join('')}</select></label>
        <label>Capacity<input id="orgCohortCapacity" type="number" min="1" value="25"></label>
        <label>Location / site<input id="orgCohortLocation"></label>
        <label>Funding source<input id="orgCohortFunding"></label>
        <label>Start date<input id="orgCohortStart" type="date"></label>
        <label>End date<input id="orgCohortEnd" type="date"></label>
      </div><div class="org-live-footer"><button type="button" data-org-live-close>Cancel</button><button class="primary" type="submit">Create cohort</button></div></form>`);
  }
  async function saveCohort(){
    const row={organization_id:state.ctx.organization.id,program_id:$('#orgCohortProgram').value,name:$('#orgCohortName').value.trim(),capacity:Number($('#orgCohortCapacity').value||25),status:'forming',funding_source:$('#orgCohortFunding').value.trim()||null,location_label:$('#orgCohortLocation').value.trim()||null,starts_at:$('#orgCohortStart').value||null,ends_at:$('#orgCohortEnd').value||null};
    const {error}=await sb().from('organization_cohorts').insert(row);if(error)throw error;closeDialog();await loadDashboard();showTab('cohorts');
  }

  function openTeamInvite(){
    dialog('Invite Organization Administrator','Invite an admin, program manager or read-only viewer.',`
      <form id="orgTeamInviteForm"><div class="org-live-form">
        <label class="wide">Email<input id="orgTeamEmail" type="email" required></label>
        <label class="wide">Role<select id="orgTeamRole"><option value="admin">Admin</option><option value="program_manager">Program manager</option><option value="viewer">Viewer</option></select></label>
      </div><div class="org-live-footer"><button type="button" data-org-live-close>Cancel</button><button class="primary" type="submit">Create invitation</button></div></form>`);
  }
  async function createTeamInvite(){
    const {data,error}=await sb().rpc('create_organization_member_invite',{p_organization_id:state.ctx.organization.id,p_email:$('#orgTeamEmail').value.trim(),p_role:$('#orgTeamRole').value});if(error)throw error;
    const link=`${location.origin}/app?org_member_invite=${encodeURIComponent(data)}`;
    $('#orgLiveDialogInner').innerHTML=`<div class="org-live-dialog-head"><div><span class="approved-kicker">ORGANIZATION TEAM</span><h3>Team invitation ready</h3><p>Send this private link to the invited administrator.</p></div><button class="org-live-close" data-org-live-close>×</button></div><div class="org-invite-link" id="orgInviteLink">${esc(link)}</div><div class="org-live-footer"><button id="copyOrgInvite" type="button">Copy link</button><button class="primary" data-org-live-close type="button">Done</button></div>`;
  }

  async function handleInviteTokens(){
    if(!user())return;
    const q=new URLSearchParams(location.search);
    const sponsor=q.get('org_invite'),member=q.get('org_member_invite');
    if(!sponsor&&!member)return;
    try{
      if(sponsor){
        const {error}=await sb().rpc('accept_organization_sponsored_invite',{p_token:sponsor});if(error)throw error;
        alert('Sponsored access accepted. Your sponsor can manage the sponsored seat and aggregate operations, but does not automatically receive your private Lellee content.');
        pageClick('sponsored-access');
      }else{
        const {error}=await sb().rpc('accept_organization_member_invite',{p_token:member});if(error)throw error;
        alert('Organization team invitation accepted.');
        pageClick('organization-dashboard');
      }
      q.delete('org_invite');q.delete('org_member_invite');
      history.replaceState({},'',location.pathname+(q.toString()?'?'+q.toString():'')+location.hash);
    }catch(err){alert(`Could not accept invitation: ${err.message||err}`)}
  }

  async function loadAdmin(){
    if(!user())return;
    const [orgs,licenses]=await Promise.all([
      sb().from('organizations').select('*').order('submitted_at',{ascending:false,nullsFirst:false}),
      sb().from('organization_program_licenses').select('id,organization_id,program_id,status,seat_limit,seats_used,requested_seat_limit,license_model,notes,review_note,created_at').order('created_at',{ascending:false})
    ]);
    if(orgs.error){const h=$('#orgAdminList');if(h)h.innerHTML=`<div class="org-live-empty">${esc(orgs.error.message)}</div>`;return}
    const programs=state.ctx?.programs||[];const pname=id=>programs.find(p=>p.id===id)?.name||'Program';
    const rows=orgs.data||[],lics=licenses.data||[];
    setText('orgAdminPending',rows.filter(x=>x.status==='pending_review').length);
    setText('orgAdminApproved',rows.filter(x=>x.status==='approved').length);
    setText('orgAdminSeats',lics.filter(x=>x.status==='active').reduce((a,x)=>a+Number(x.seat_limit||0),0));
    const host=$('#orgAdminList');if(!host)return;
    host.innerHTML=rows.length?rows.map(o=>{
      const ol=lics.filter(x=>x.organization_id===o.id);
      return `<article class="org-live-item"><div class="org-live-row"><div><b>${esc(o.name)}</b><small>${esc(o.public_name)} · ${esc(title(o.organization_type))} · ${esc(o.contact_email)}</small></div><span class="org-live-pill">${esc(title(o.status))}</span></div><small>${esc(o.target_audience||'Audience not provided')}</small>${o.review_note?`<div class="org-live-review">${esc(o.review_note)}</div>`:''}
      <div class="org-admin-actions"><button class="approve" data-org-review="approved" data-org-id="${o.id}">Approve</button><button data-org-review="pending_review" data-org-id="${o.id}">Return to Review</button><button data-org-review="paused" data-org-id="${o.id}">Pause</button><button class="reject" data-org-review="rejected" data-org-id="${o.id}">Reject / Changes</button></div>
      ${ol.map(l=>`<div class="org-live-item" style="margin-top:10px;background:#f9fbfd"><div class="org-live-row"><div><b>${esc(pname(l.program_id))}</b><small>${esc(title(l.license_model))} · requested ${l.requested_seat_limit||l.seat_limit} seats</small></div><span class="org-live-pill">${esc(title(l.status))}</span></div><div class="org-admin-actions"><button class="approve" data-license-review="active" data-license-id="${l.id}" data-license-seats="${l.requested_seat_limit||l.seat_limit}">Activate</button><button class="reject" data-license-review="denied" data-license-id="${l.id}">Deny</button><button data-license-review="paused" data-license-id="${l.id}">Pause</button></div></div>`).join('')}</article>`;
    }).join(''):'<div class="org-live-empty">No organizations submitted yet.</div>';
  }

  async function reviewOrg(id,decision){
    const note=decision==='approved'?(prompt('Optional approval note:','')||''):(prompt('Reviewer note:','')||'');
    if(decision==='rejected'&&!note.trim())return alert('Add a reviewer note explaining what must change.');
    const {error}=await sb().rpc('admin_review_organization',{p_organization_id:id,p_decision:decision,p_review_note:note||null});if(error)throw error;await loadAdmin();
  }
  async function reviewLicense(id,decision,seats){
    let n=seats?Number(seats):null;
    if(decision==='active'){
      const entered=prompt('Approved seat limit:',String(n||25));if(entered===null)return;n=Number(entered);if(!Number.isFinite(n)||n<1)return alert('Enter a valid seat limit.');
    }
    const note=prompt('Optional license review note:','')||'';
    const {error}=await sb().rpc('admin_review_organization_license',{p_license_id:id,p_decision:decision,p_seat_limit:n,p_license_model:null,p_review_note:note||null});if(error)throw error;await loadAdmin();
  }

  document.addEventListener('click',e=>{
    const p=e.target.closest('[data-page]');
    if(p){
      if(p.dataset.page==='organization-setup')setTimeout(()=>{state.ctx=null;loadSetup()},40);
      if(p.dataset.page==='organization-dashboard')setTimeout(loadDashboard,40);
      if(p.dataset.page==='organization-admin')setTimeout(async()=>{await load(true);loadAdmin()},40);
    }
    if(e.target.closest('[data-org-live-close]'))closeDialog();

    const tab=e.target.closest('[data-org-tab]');if(tab){e.preventDefault();e.stopImmediatePropagation();showTab(tab.dataset.orgTab)}
    if(e.target.closest('#submitOrganization')){e.preventDefault();e.stopImmediatePropagation();submitOrg().catch(err=>alert(err.message||String(err)))}
    if(e.target.closest('#orgRequestLicense')){e.preventDefault();e.stopImmediatePropagation();openLicense()}
    if(e.target.closest('#orgInviteUser')){e.preventDefault();e.stopImmediatePropagation();openSponsorInvite()}
    if(e.target.closest('#orgNewCohort')){e.preventDefault();e.stopImmediatePropagation();openCohort()}
    if(e.target.closest('#orgInviteAdmin')){e.preventDefault();e.stopImmediatePropagation();openTeamInvite()}

    if(e.target.closest('#copyOrgInvite'))navigator.clipboard?.writeText($('#orgInviteLink')?.textContent||'').then(()=>e.target.textContent='Copied').catch(()=>{});

    const ro=e.target.closest('[data-org-review]');if(ro){e.preventDefault();reviewOrg(ro.dataset.orgId,ro.dataset.orgReview).catch(err=>alert(err.message||String(err)))}
    const rl=e.target.closest('[data-license-review]');if(rl){e.preventDefault();reviewLicense(rl.dataset.licenseId,rl.dataset.licenseReview,rl.dataset.licenseSeats).catch(err=>alert(err.message||String(err)))}
  },true);

  document.addEventListener('submit',e=>{
    const id=e.target?.id;if(!id)return;
    const run=async fn=>{e.preventDefault();try{await fn()}catch(err){alert(err.message||String(err))}};
    if(id==='orgLicenseForm')run(saveLicense);
    if(id==='orgSponsorInviteForm')run(createSponsorInvite);
    if(id==='orgCohortForm')run(saveCohort);
    if(id==='orgTeamInviteForm')run(createTeamInvite);
  });

  function boot(){
    let tries=0;
    const timer=setInterval(async()=>{
      tries++;
      if(bridge()&&user()){
        clearInterval(timer);state.user=user();await handleInviteTokens();
        const active=$('.page.active')?.id?.replace('page-','');
        if(active==='organization-setup')loadSetup();
        if(active==='organization-dashboard')loadDashboard();
        if(active==='organization-admin'){await load(true);loadAdmin()}
      }
      if(tries>240)clearInterval(timer);
    },250);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

  window.LelleeOrganizationLive={loadDashboard,loadSetup,loadAdmin};
})();