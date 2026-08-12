
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2500)}};

let org=null,orgTab='licenses',isAdmin=false;

async function loadOrg(){
 if(!currentUser)return;
 const {data}=await sb.from('organizations')
   .select('*')
   .eq('owner_user_id',currentUser.id)
   .maybeSingle();
 org=data||null;
 if(org){
  q('#orgName')&&(q('#orgName').value=org.name||'');
  q('#orgPublicName')&&(q('#orgPublicName').value=org.public_name||'');
  q('#orgContactEmail')&&(q('#orgContactEmail').value=org.contact_email||'');
  q('#orgAudience')&&(q('#orgAudience').value=org.target_audience||'');
  q('#orgType')&&(q('#orgType').value=org.organization_type||'nonprofit');
 }
 return org;
}

async function saveOrg(){
 if(!currentUser)return;
 const name=q('#orgName').value.trim(),publicName=q('#orgPublicName').value.trim(),email=q('#orgContactEmail').value.trim();
 if(!name||!publicName||!email)return toast('Organization name, public name and contact email are required.',true);
 const payload={owner_user_id:currentUser.id,name,public_name:publicName,contact_email:email,organization_type:q('#orgType').value,target_audience:q('#orgAudience').value.trim()||null,status:'pending_review',submitted_at:new Date().toISOString()};
 const res=org?await sb.from('organizations').update(payload).eq('id',org.id):await sb.from('organizations').insert(payload);
 if(res.error)return toast(res.error.message,true);
 q('#orgSetupMsg').textContent='Organization submitted for review.';
 toast('Organization submitted.');
 await loadOrg();
}

function setOrgTab(tab){
 orgTab=tab;
 qa('[data-org-tab]').forEach(b=>b.classList.toggle('active',b.dataset.orgTab===tab));
 ['licenses','people','cohorts','reports','team'].forEach(x=>{
   const id='#orgPanel'+x[0].toUpperCase()+x.slice(1);
   q(id)?.classList.toggle('hidden',x!==tab);
 });
}

async function loadDashboard(){
 await loadOrg();if(!org)return;
 q('#orgDashName').textContent=org.public_name||org.name;
 const [licenses,seats,cohorts,team]=await Promise.all([
  sb.from('organization_program_licenses').select('*,programs(name,slug)').eq('organization_id',org.id),
  sb.from('organization_sponsored_access').select('*,programs(name)').eq('organization_id',org.id).order('created_at',{ascending:false}),
  sb.from('organization_cohorts').select('*,programs(name)').eq('organization_id',org.id).order('created_at',{ascending:false}),
  sb.from('organization_members').select('*,profiles:user_id(display_name)').eq('organization_id',org.id)
 ]);
 const l=licenses.data||[],s=seats.data||[],c=cohorts.data||[],t=team.data||[];
 q('#orgMetricSeats').textContent=l.reduce((n,x)=>n+(x.seat_limit||0),0);
 q('#orgMetricAssigned').textContent=s.filter(x=>['invited','active'].includes(x.status)).length;
 q('#orgMetricActive').textContent=s.filter(x=>x.status==='active').length;
 q('#orgMetricPrograms').textContent=l.filter(x=>x.status==='active').length;

 q('#orgLicenseList').innerHTML=l.length?l.map(x=>`<div class="org-row"><div class="org-icon">◇</div><div><b>${esc(x.programs?.name||'Program')}</b><small>${esc(x.status)} · ${x.seat_limit} seats · ${x.seats_used||0} assigned</small></div><button>Open</button></div>`).join(''):'<div class="approved-resource-empty">No program licenses yet.</div>';

 q('#orgSponsoredList').innerHTML=s.length?s.map(x=>`<div class="org-row"><div class="org-icon">◉</div><div><b>${esc(x.invited_email||'Sponsored user')}</b><small>${esc(x.programs?.name||'Program')} · ${esc(x.status)}</small></div><button>Open</button></div>`).join(''):'<div class="approved-resource-empty">No sponsored access assigned yet.</div>';

 q('#orgCohortList').innerHTML=c.length?c.map(x=>`<div class="org-row"><div class="org-icon">◎</div><div><b>${esc(x.name)}</b><small>${esc(x.programs?.name||'Program')} · ${x.capacity||0} capacity · ${esc(x.status)}</small></div><button>Open</button></div>`).join(''):'<div class="approved-resource-empty">No organization cohorts yet.</div>';

 q('#orgTeamList').innerHTML=t.length?t.map(x=>`<div class="org-row"><div class="org-icon">●</div><div><b>${esc(x.profiles?.display_name||x.role)}</b><small>${esc(x.role)} · ${esc(x.status)}</small></div><button>Open</button></div>`).join(''):'<div class="approved-resource-empty">No team members yet.</div>';

 await loadReports();
}

async function loadReports(){
 if(!org)return;
 const {data,error}=await sb.rpc('get_organization_aggregate_report',{p_organization_id:org.id});
 if(error)return;
 const r=data||{};
 q('#orgReportCards').innerHTML=`
 <article><b>${r.assigned_seats||0}</b><small>Seats assigned across organization programs</small></article>
 <article><b>${r.active_sponsored_users||0}</b><small>Currently active sponsored accounts</small></article>
 <article><b>${r.users_with_recent_activity||0}</b><small>Users with any program activity in the last 30 days</small></article>
 <article><b>${r.total_completed_milestones||0}</b><small>Total milestone completions across sponsored users</small></article>
 <article><b>${r.active_coaching_relationships||0}</b><small>Active coaching relationships connected to sponsored users</small></article>
 <article><b>${r.programs_in_use||0}</b><small>Licensed programs with assigned users</small></article>`;
}

async function requestLicense(){
 if(!org)return;
 const {data:programs}=await sb.from('programs').select('id,name,status').in('status',['active','pilot']).order('display_order');
 if(!programs?.length)return toast('No licensable programs are available.',true);
 const names=programs.map((p,i)=>`${i+1}. ${p.name}`).join('\n');
 const choice=Number(prompt(`Choose a program:\n${names}`,'1'))-1;
 const p=programs[choice];if(!p)return;
 const seats=Math.max(1,Number(prompt('How many sponsored seats?','25')||25));
 const {error}=await sb.from('organization_program_licenses').insert({organization_id:org.id,program_id:p.id,seat_limit:seats,status:'requested'});
 if(error)return toast(error.message,true);loadDashboard();
}

async function inviteUser(){
 if(!org)return;
 const email=prompt('Email address to sponsor:');if(!email)return;
 const {data:licenses}=await sb.from('organization_program_licenses').select('id,program_id,programs(name)').eq('organization_id',org.id).eq('status','active');
 if(!licenses?.length)return toast('An active program license is required first.',true);
 const names=licenses.map((x,i)=>`${i+1}. ${x.programs?.name}`).join('\n');
 const choice=Number(prompt(`Choose program:\n${names}`,'1'))-1;
 const lic=licenses[choice];if(!lic)return;
 const {data,error}=await sb.rpc('create_organization_sponsored_invite',{p_organization_id:org.id,p_license_id:lic.id,p_email:email});
 if(error)return toast(error.message,true);
 prompt('Copy this invite link and send it to the person:',`${location.origin}/app?page=sponsored-access&sponsor=${data}`);
 loadDashboard();
}

async function newCohort(){
 if(!org)return;
 const {data:licenses}=await sb.from('organization_program_licenses').select('program_id,programs(name)').eq('organization_id',org.id).eq('status','active');
 if(!licenses?.length)return toast('An active program license is required first.',true);
 const names=licenses.map((x,i)=>`${i+1}. ${x.programs?.name}`).join('\n');
 const choice=Number(prompt(`Choose program:\n${names}`,'1'))-1;
 const lic=licenses[choice];if(!lic)return;
 const name=prompt('Cohort name:');if(!name)return;
 const cap=Math.max(1,Number(prompt('Capacity:','25')||25));
 const {error}=await sb.from('organization_cohorts').insert({organization_id:org.id,program_id:lic.program_id,name,capacity:cap,status:'active'});
 if(error)return toast(error.message,true);loadDashboard();
}

async function inviteAdmin(){
 if(!org)return;
 const email=prompt('Administrator email:');if(!email)return;
 const {data,error}=await sb.rpc('create_organization_member_invite',{p_organization_id:org.id,p_email:email,p_role:'admin'});
 if(error)return toast(error.message,true);
 prompt('Copy this administrator invite link:',`${location.origin}/app?page=organization-dashboard&orginvite=${data}`);
}

async function loadSponsoredAccess(){
 if(!currentUser)return;
 const params=new URLSearchParams(location.search),token=params.get('sponsor');
 if(token){
   const {data,error}=await sb.rpc('accept_organization_sponsored_invite',{p_token:token});
   if(!error&&data){toast('Sponsored access activated.');history.replaceState({},'',location.pathname+'?page=sponsored-access')}
 }
 const {data}=await sb.from('organization_sponsored_access').select('id,status,activated_at,programs(name),organizations(public_name)').eq('user_id',currentUser.id).order('created_at',{ascending:false});
 const rows=data||[];
 q('#mySponsoredAccessList').innerHTML=rows.length?rows.map(x=>`<div class="org-row"><div class="org-icon">◇</div><div><b>${esc(x.programs?.name||'Lellee Program')}</b><small>Sponsored by ${esc(x.organizations?.public_name||'Organization')} · ${esc(x.status)}</small></div><button data-page="programs">Open</button></div>`).join(''):'<div class="approved-resource-empty">No sponsored programs are connected to your account.</div>';
}

async function checkAdmin(){
 const {data}=await sb.from('admin_user_roles').select('role,active').eq('user_id',currentUser.id).maybeSingle();
 isAdmin=!!data?.active&&['admin','editor'].includes(data.role);return isAdmin;
}

async function loadAdmin(){
 if(!await checkAdmin())return;
 const {data}=await sb.from('organizations').select('id,name,public_name,status,organization_type,contact_email').order('submitted_at',{ascending:false});
 const rows=data||[];
 const {data:licenses}=await sb.from('organization_program_licenses').select('seat_limit');
 q('#orgAdminPending').textContent=rows.filter(x=>x.status==='pending_review').length;
 q('#orgAdminApproved').textContent=rows.filter(x=>x.status==='approved').length;
 q('#orgAdminSeats').textContent=(licenses||[]).reduce((n,x)=>n+(x.seat_limit||0),0);
 q('#orgAdminList').innerHTML=rows.length?rows.map(x=>`<div class="org-row"><div class="org-icon">▣</div><div><b>${esc(x.name)}</b><small>${esc(x.organization_type.replaceAll('_',' '))} · ${esc(x.status)} · ${esc(x.contact_email)}</small></div><div>${x.status==='pending_review'?`<button data-org-approve="${x.id}">Approve</button>`:''}</div></div>`).join(''):'<div class="approved-resource-empty">No organizations submitted.</div>';
 qa('[data-org-approve]').forEach(b=>b.onclick=()=>approveOrg(b.dataset.orgApprove));
}

async function approveOrg(id){
 const {error}=await sb.from('organizations').update({status:'approved',approved_at:new Date().toISOString(),approved_by:currentUser.id}).eq('id',id);
 if(error)return toast(error.message,true);loadAdmin();
}

q('#submitOrganization')?.addEventListener('click',saveOrg);
qa('[data-org-tab]').forEach(b=>b.onclick=()=>setOrgTab(b.dataset.orgTab));
q('#orgRequestLicense')?.addEventListener('click',requestLicense);
q('#orgInviteUser')?.addEventListener('click',inviteUser);
q('#orgNewCohort')?.addEventListener('click',newCohort);
q('#orgInviteAdmin')?.addEventListener('click',inviteAdmin);

if(typeof showPage==='function'){
 const oldShow=showPage;
 showPage=function(name){
   oldShow(name);
   if(name==='organization-setup')loadOrg();
   if(name==='organization-dashboard')loadDashboard();
   if(name==='sponsored-access')loadSponsoredAccess();
   if(name==='organization-admin')loadAdmin();
 };
}
let tries=0;const timer=setInterval(()=>{tries++;if(typeof currentUser!=='undefined'&&currentUser){clearInterval(timer);loadOrg()}else if(tries>40)clearInterval(timer)},200);
})();
