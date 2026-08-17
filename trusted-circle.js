
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}};
let isAdmin=false;

async function rpc(name,args={}){
 const {data,error}=await sb.rpc(name,args);
 if(error){console.warn(name,error);return null}
 return data;
}
function row(icon,title,detail,status='',action='',id='',klass=''){
 return `<div class="circle-row ${klass}"><div class="circle-icon">${icon}</div><div><b>${esc(title)}</b><small>${esc(detail||'')}</small></div>${action?`<button data-circle-action="${esc(action)}" data-circle-id="${esc(id)}">${esc(status||'Open')}</button>`:`<em>${esc(status||'')}</em>`}</div>`;
}
function setCircleTab(tab){
 qa('[data-circle-tab]').forEach(b=>b.classList.toggle('active',b.dataset.circleTab===tab));
 ['people','sharing','tasks','checkins','emergency'].forEach(x=>q('#circlePanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab));
}
async function loadCircle(){
 const d=await rpc('get_my_trusted_circle_summary');if(!d)return;
 const s=d.summary||{};
 q('#circleMembers').textContent=s.members||0;q('#circleActiveShares').textContent=s.active_shares||0;q('#circleSharedTasks').textContent=s.shared_tasks||0;q('#circleCheckins').textContent=s.open_checkins||0;
 q('#circlePeopleList').innerHTML=(d.people||[]).map(x=>row('♡',x.label,`${x.role_label} · ${x.status}`,x.status,'revoke-person',x.id)).join('')||'<div class="approved-resource-empty">No one has been added yet.</div>';
 q('#circleSharingList').innerHTML=(d.shares||[]).map(x=>row('→',x.scope_label,`${x.person_label} · ${x.status}${x.expires_at?' · expires '+new Date(x.expires_at).toLocaleDateString():''}`,x.status,'revoke-share',x.id)).join('')||'<div class="approved-resource-empty">No active sharing permissions.</div>';
 q('#circleTaskList').innerHTML=(d.tasks||[]).map(x=>row('✓',x.title,`${x.status} · ${x.person_label||'Shared circle'}`,x.due_label||'')).join('')||'<div class="approved-resource-empty">No shared tasks.</div>';
 q('#circleCheckinList').innerHTML=(d.checkins||[]).map(x=>row('?',x.title,`${x.person_label} · ${x.status}`,x.due_label||'')).join('')||'<div class="approved-resource-empty">No open check-ins.</div>';
 q('#circleEmergencyList').innerHTML=(d.emergency_contacts||[]).map(x=>row('!',x.label,`${x.relationship_label||'Emergency contact'} · ${x.phone_masked||'phone not stored'}`,x.priority_label||'')).join('')||'<div class="approved-resource-empty">No emergency contacts recorded.</div>';
 wireCircleActions();
}
async function addPerson(){
 const email=prompt('Existing Lellee account email for this trusted person:');if(!email)return;
 const role=prompt('Role: family, caregiver, mentor, case_manager, advocate, friend, other','family')||'other';
 const d=await rpc('invite_trusted_circle_member',{p_email:email,p_role_key:role});
 if(!d)return toast('Could not add trusted person.',true);
 toast('Trusted Circle invitation created.');loadCircle();
}
async function revokePerson(id){
 const d=await rpc('revoke_trusted_circle_relationship',{p_relationship_id:id});if(!d)return toast('Could not revoke relationship.',true);
 toast('Relationship revoked.');loadCircle();
}
async function revokeShare(id){
 const d=await rpc('revoke_trusted_circle_share',{p_share_id:id});if(!d)return toast('Could not revoke share.',true);
 toast('Sharing permission revoked.');loadCircle();
}
async function addSharedTask(){
 const people=await sb.from('trusted_circle_relationships').select('id,role_key,status').eq('owner_user_id',currentUser.id).eq('status','active');
 if(people.error||!people.data?.length)return toast('Add an active Trusted Circle person first.',true);
 const title=prompt('Shared task:');if(!title)return;
 const due=prompt('Due date YYYY-MM-DD (optional):','')||null;
 const {error}=await sb.from('trusted_circle_shared_tasks').insert({owner_user_id:currentUser.id,relationship_id:people.data[0].id,title,status:'open',due_on:due});
 if(error)return toast(error.message,true);loadCircle();
}
async function requestCheckin(){
 const rels=await sb.from('trusted_circle_relationships').select('id').eq('owner_user_id',currentUser.id).eq('status','active').limit(1);
 if(rels.error||!rels.data?.length)return toast('Add an active Trusted Circle person first.',true);
 const title=prompt('Check-in request:','Check in with me');if(!title)return;
 const due=prompt('Due date/time YYYY-MM-DD HH:MM (optional):','')||null;
 const {error}=await sb.from('trusted_circle_checkins').insert({owner_user_id:currentUser.id,relationship_id:rels.data[0].id,title,status:'requested',due_at:due?due.replace(' ','T'):null});
 if(error)return toast(error.message,true);loadCircle();
}
async function addEmergency(){
 const label=prompt('Emergency contact name/label:');if(!label)return;
 const relation=prompt('Relationship:','Family')||null;
 const phone=prompt('Phone number (optional):','')||null;
 const {error}=await sb.from('trusted_circle_emergency_contacts').insert({user_id:currentUser.id,label,relationship_label:relation,phone_masked:phone,status:'active'});
 if(error)return toast(error.message,true);loadCircle();
}
function wireCircleActions(){
 qa('[data-circle-action="revoke-person"]').forEach(b=>b.onclick=()=>revokePerson(b.dataset.circleId));
 qa('[data-circle-action="revoke-share"]').forEach(b=>b.onclick=()=>revokeShare(b.dataset.circleId));
}

async function loadSupporter(){
 const d=await rpc('get_my_supporter_dashboard');if(!d)return;
 const s=d.summary||{};
 q('#supporterPeople').textContent=s.people||0;q('#supporterTasks').textContent=s.tasks||0;q('#supporterCheckins').textContent=s.checkins||0;q('#supporterShares').textContent=s.shares||0;
 q('#supporterRelationshipList').innerHTML=(d.relationships||[]).map(x=>row('♡',x.person_label,`${x.role_label} · ${x.status}`,x.status)).join('')||'<div class="approved-resource-empty">No active supporter relationships.</div>';
 q('#supporterTaskList').innerHTML=(d.tasks||[]).map(x=>row('✓',x.title,`${x.person_label} · ${x.status}`,x.due_label||'')).join('')||'<div class="approved-resource-empty">No shared work.</div>';
}

async function checkAdmin(){const {data}=await sb.from('admin_user_roles').select('role,active').eq('user_id',currentUser.id).maybeSingle();isAdmin=!!data?.active&&['admin','editor'].includes(data.role);return isAdmin}
function setCollabTab(tab){
 qa('[data-collab-tab]').forEach(b=>b.classList.toggle('active',b.dataset.collabTab===tab));
 ['roles','scopes','relationships','programs','guardrails'].forEach(x=>q('#collabPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab));
}
async function loadCollabOps(){
 if(!await checkAdmin())return;
 const d=await rpc('get_collaboration_operations_summary');if(!d)return;
 const s=d.summary||{};
 q('#collabOpsRelationships').textContent=s.relationships||0;q('#collabOpsShares').textContent=s.shares||0;q('#collabOpsExpired').textContent=s.expired||0;q('#collabOpsPrograms').textContent=s.programs||0;
 q('#collabRoleList').innerHTML=(d.roles||[]).map(x=>row('R',x.label,x.description,x.status)).join('');
 q('#collabScopeList').innerHTML=(d.scopes||[]).map(x=>row('S',x.label,x.description,x.sensitive?'restricted':'shareable')).join('');
 q('#collabRelationshipList').innerHTML=(d.relationships||[]).map(x=>row('♡',x.role_label,`${x.status} · ${x.created_at?new Date(x.created_at).toLocaleDateString():''}`,x.share_count+' shares')).join('');
 q('#collabProgramList').innerHTML=(d.programs||[]).map(x=>row('P',x.program_name,`${x.status} · ${x.enabled_scopes} enabled scopes`,x.collaboration_enabled?'enabled':'off')).join('');
 q('#collabGuardrailList').innerHTML=(d.guardrails||[]).map(x=>`<article class="circle-guardrail"><b>${x.enabled?'✓ ':'! '}${esc(x.label)}</b><small>${esc(x.detail)}</small></article>`).join('');
}

qa('[data-circle-tab]').forEach(b=>b.onclick=()=>setCircleTab(b.dataset.circleTab));
qa('[data-collab-tab]').forEach(b=>b.onclick=()=>setCollabTab(b.dataset.collabTab));
q('#circleAddPerson')?.addEventListener('click',addPerson);
q('#circleAddSharedTask')?.addEventListener('click',addSharedTask);
q('#circleRequestCheckin')?.addEventListener('click',requestCheckin);
q('#circleAddEmergency')?.addEventListener('click',addEmergency);

if(typeof showPage==='function'){
 const old=showPage;
 showPage=function(name){
   old(name);
   if(name==='trusted-circle')loadCircle();
   if(name==='supporter-dashboard')loadSupporter();
   if(name==='collaboration-ops')loadCollabOps();
 };
}
})();
