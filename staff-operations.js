
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}};
let isAdmin=false;
let currentSops=[];

function addStaffReadabilityStyle(){
 if(document.getElementById('lelleeStaffReadability2pt'))return;
 const style=document.createElement('style');
 style.id='lelleeStaffReadability2pt';
 style.textContent=`
 #page-staff-operations .staff-row b,
 #page-staff-operations .staff-row small,
 #page-staff-operations .staff-row em,
 #page-staff-operations [data-staff-tab],
 #page-staff-operations .approved-resource-empty,
 #page-staff-operations .approved-page-head p,
 #page-staff-operations .approved-resource-note,
 #page-staff-operations .staff-note,
 #staffSopList .staff-row b,
 #staffSopList .staff-row small,
 #staffSopList .staff-row em{font-size:calc(1em + 2pt)!important;line-height:1.45!important}
 #staffSopList .staff-row{cursor:pointer}
 #staffSopList .staff-row:focus-visible{outline:3px solid #73518f;outline-offset:2px}
 .lellee-sop-modal-backdrop{position:fixed;inset:0;z-index:10050;background:rgba(25,18,39,.46);display:flex;align-items:center;justify-content:center;padding:24px}
 .lellee-sop-modal{width:min(720px,96vw);max-height:82vh;overflow:auto;background:#fff;border-radius:18px;padding:24px;box-shadow:0 20px 70px rgba(22,14,38,.25);color:#352c40}
 .lellee-sop-modal h2{margin:0 0 8px;font-size:1.35rem}.lellee-sop-modal p,.lellee-sop-modal div{font-size:calc(1em + 2pt);line-height:1.55}.lellee-sop-modal button{margin-top:18px;border:0;border-radius:9px;background:#5b2fa0;color:#fff;padding:10px 16px;font-weight:800;cursor:pointer}
 `;
 document.head.appendChild(style);
}

async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error){console.warn(name,error);return null}return data;}
function row(icon,title,detail,status='',klass='',attrs=''){
 return `<div class="staff-row ${klass}" ${attrs}><div class="staff-icon">${icon}</div><div><b>${esc(title)}</b><small>${esc(detail||'')}</small></div><em>${esc(status||'')}</em></div>`;
}
function setStaffTab(tab){qa('[data-staff-tab]').forEach(b=>b.classList.toggle('active',b.dataset.staffTab===tab));['dashboard','team','queues','approvals','handoffs','sops'].forEach(x=>q('#staffPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab));}
async function checkAdmin(){if(typeof currentUser==='undefined'||!currentUser){isAdmin=false;return false;}try{const {data,error}=await sb.rpc('is_lellee_admin');isAdmin=!error&&data===true}catch(_){isAdmin=false}return isAdmin;}
function openSop(index){
 const x=currentSops[index];if(!x)return;
 const old=q('#lelleeSopModalBackdrop');if(old)old.remove();
 const body=x.body||x.content||x.description||x.instructions||x.summary||'This SOP is registered in Lellee, but detailed procedure text has not been entered yet.';
 const wrap=document.createElement('div');wrap.id='lelleeSopModalBackdrop';wrap.className='lellee-sop-modal-backdrop';
 wrap.innerHTML=`<section class="lellee-sop-modal" role="dialog" aria-modal="true" aria-labelledby="lelleeSopTitle"><h2 id="lelleeSopTitle">${esc(x.title||'Standard Operating Procedure')}</h2><p><b>Category:</b> ${esc(x.category||'Operations')} &nbsp; <b>Status:</b> ${esc(x.status||'')}</p><p><b>Owner:</b> ${esc(x.owner_label||'Unassigned')}</p><div>${esc(body).replace(/\n/g,'<br>')}</div><button type="button">Close</button></section>`;
 wrap.addEventListener('click',e=>{if(e.target===wrap||e.target.closest('button'))wrap.remove()});
 document.body.appendChild(wrap);wrap.querySelector('button').focus();
}
function bindSops(){qa('#staffSopList .staff-row').forEach((el,i)=>{el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label',`Open ${currentSops[i]?.title||'SOP'}`);el.onclick=()=>openSop(i);el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openSop(i)}}});}
async function loadStaffOps(){
 addStaffReadabilityStyle();if(!await checkAdmin())return;
 const d=await rpc('get_staff_operations_summary');if(!d)return;const s=d.summary||{};
 q('#staffOpsStaff').textContent=s.staff||0;q('#staffOpsQueues').textContent=s.open_queue||0;q('#staffOpsApprovals').textContent=s.approvals||0;q('#staffOpsEscalations').textContent=s.escalations||0;
 q('#staffWorkloadList').innerHTML=(d.workload||[]).map(x=>row('W',x.label,x.detail,x.value,x.status==='attention'?'attention':'' )).join('');
 q('#staffRecentActivity').innerHTML=(d.activity||[]).map(x=>row('•',x.label,`${x.area} · ${new Date(x.created_at).toLocaleString()}`,x.status||'')).join('')||'<div class="approved-resource-empty">No recent staff activity.</div>';
 q('#staffTeamList').innerHTML=(d.team||[]).map(x=>row('A',x.display_name||'Staff member',`${x.role_name} · ${x.status}`,x.permission_count+' permissions')).join('');
 q('#staffQueueList').innerHTML=(d.queue||[]).map(x=>row('Q',x.title,`${x.queue_name} · ${x.priority} · ${x.status}`,x.assignee_label||'unassigned',x.priority==='urgent'?'blocked':x.priority==='high'?'attention':'' )).join('')||'<div class="approved-resource-empty">No open queue items.</div>';
 q('#staffApprovalList').innerHTML=(d.approvals||[]).map(x=>row('✓',x.title,`${x.approval_type} · ${x.status}`,x.required_role||'',x.status==='pending'?'attention':'' )).join('')||'<div class="approved-resource-empty">No pending approvals.</div>';
 q('#staffHandoffList').innerHTML=(d.handoffs||[]).map(x=>row('→',x.title,`${x.status} · ${x.from_label||'Staff'} → ${x.to_label||'Staff'}`,x.due_label||'')).join('')||'<div class="approved-resource-empty">No active handoffs.</div>';
 currentSops=d.sops||[];q('#staffSopList').innerHTML=currentSops.map((x,i)=>row('S',x.title,`${x.category} · ${x.status}`,x.owner_label||'','',`data-sop-index="${i}"`)).join('');bindSops();
}
async function addStaff(){if(!await checkAdmin())return toast('Administrator access required.',true);const email=prompt('Existing Lellee account email:');if(!email)return;const roles=await sb.from('staff_roles').select('role_key,name').eq('active',true).order('name');if(roles.error)return toast(roles.error.message,true);const list=(roles.data||[]).map((r,i)=>`${i+1}. ${r.name}`).join('\n');const idx=Number(prompt('Choose role:\n'+list,'1'));if(!idx||!roles.data[idx-1])return;const {error}=await sb.rpc('admin_assign_staff_role',{p_email:email,p_role_key:roles.data[idx-1].role_key});if(error)return toast(error.message,true);toast('Staff role assigned.');loadStaffOps();}
async function addHandoff(){if(!await checkAdmin())return toast('Administrator access required.',true);const title=prompt('Handoff title:');if(!title)return;const note=prompt('Operational handoff note:','')||null;const {error}=await sb.from('staff_handoffs').insert({title,note,from_user_id:currentUser.id,status:'open',created_by:currentUser.id});if(error)return toast(error.message,true);loadStaffOps();}
async function loadMyStaff(){const d=await rpc('get_my_staff_work');if(!d)return;const s=d.summary||{};q('#myStaffOpen').textContent=s.open||0;q('#myStaffDue').textContent=s.due||0;q('#myStaffApprovals').textContent=s.approvals||0;q('#myStaffHandoffs').textContent=s.handoffs||0;q('#myStaffWorkList').innerHTML=(d.work||[]).map(x=>row('Q',x.title,`${x.work_type} · ${x.priority} · ${x.status}`,x.due_label||'',x.priority==='urgent'?'blocked':x.priority==='high'?'attention':'' )).join('')||'<div class="approved-resource-empty">No work assigned to you.</div>';q('#myStaffPermissionList').innerHTML=(d.permissions||[]).map(x=>`<article class="staff-permission"><b>${esc(x.label)}</b><small>${esc(x.description||'')}</small></article>`).join('')||'<div class="approved-resource-empty">No staff permission pack assigned.</div>';}
addStaffReadabilityStyle();qa('[data-staff-tab]').forEach(b=>b.onclick=()=>setStaffTab(b.dataset.staffTab));q('#staffAddMember')?.addEventListener('click',addStaff);q('#staffAddHandoff')?.addEventListener('click',addHandoff);
if(typeof showPage==='function'){const old=showPage;showPage=function(name){old(name);if(name==='staff-operations')loadStaffOps();if(name==='my-staff-work')loadMyStaff();};}
})();
