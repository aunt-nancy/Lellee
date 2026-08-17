
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}};
let supportType='question',isAdmin=false;

async function rpc(name,args={}){
 const {data,error}=await sb.rpc(name,args);
 if(error){console.warn(name,error);return null}
 return data;
}
function row(icon,title,detail,value='',button='',id=''){
 return `<div class="trust-row"><div class="trust-icon">${icon}</div><div><b>${esc(title)}</b><small>${esc(detail||'')}</small></div>${button?`<button ${id?`data-trust-action="${id}"`:''}>${esc(button)}</button>`:`<em>${esc(String(value||''))}</em>`}</div>`;
}
function setTrustTab(tab){qa('[data-trust-tab]').forEach(b=>b.classList.toggle('active',b.dataset.trustTab===tab));['access','sharing','data','consent'].forEach(x=>q('#trustPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}
async function loadTrust(){
 const d=await rpc('get_my_trust_center');if(!d)return;
 const s=d.summary||{};
 q('#trustCoachCount').textContent=s.coach_relationships||0;q('#trustOrgCount').textContent=s.organization_sponsors||0;q('#trustSharedCount').textContent=s.shared_items||0;q('#trustRequestsCount').textContent=s.data_requests||0;
 q('#trustAccessList').innerHTML=(d.access||[]).length?(d.access||[]).map(x=>row(x.icon||'◇',x.label,x.detail,x.status)).join(''):'<div class="approved-resource-empty">No connected third-party access.</div>';
 q('#trustSharingList').innerHTML=(d.sharing||[]).length?(d.sharing||[]).map(x=>row('→',x.label,x.detail,'','Revoke',x.id)).join(''):'<div class="approved-resource-empty">No active shared items.</div>';
 q('#trustDataRequestList').innerHTML=(d.requests||[]).length?(d.requests||[]).map(x=>row('▤',x.label,`${x.status} · ${new Date(x.created_at).toLocaleDateString()}`)).join(''):'<div class="approved-resource-empty">No data-rights requests.</div>';
 q('#trustConsentList').innerHTML=(d.consents||[]).length?(d.consents||[]).map(x=>row('✓',x.label,new Date(x.created_at).toLocaleDateString(),x.status)).join(''):'<div class="approved-resource-empty">No consent history available.</div>';
 qa('[data-trust-action]').forEach(b=>b.onclick=()=>revokeShare(b.dataset.trustAction));
}
async function revokeShare(id){
 if(!confirm('Revoke this shared item?'))return;
 const {data,error}=await sb.rpc('revoke_my_shared_item',{p_shared_item_id:id});
 if(error)return toast(error.message,true);toast('Sharing revoked.');loadTrust();
}
async function createDataRequest(type){
 const note=prompt('Optional note for this request:','')||null;
 const {data,error}=await sb.rpc('create_data_rights_request',{p_request_type:type,p_note:note});
 if(error)return toast(error.message,true);toast('Request submitted.');loadTrust();
}

function openSupport(type){
 supportType=type;
 const title={question:'Ask a Question',bug:'Report a Bug',feedback:'Give Feedback',pilot:'Pilot Feedback'}[type]||'Support Request';
 q('#supportEditorTitle').textContent=title;q('#supportSubject').value='';q('#supportBody').value='';q('#supportArea').value='';q('#supportPriority').value='normal';q('#supportRequestEditor').classList.remove('hidden');
}
function closeSupport(){q('#supportRequestEditor').classList.add('hidden')}
async function saveSupport(){
 const subject=q('#supportSubject').value.trim(),body=q('#supportBody').value.trim();
 if(!subject||!body)return toast('Subject and message are required.',true);
 const {error}=await sb.from('support_requests').insert({user_id:currentUser.id,request_type:supportType,subject,body,priority:q('#supportPriority').value,feature_area:q('#supportArea').value.trim()||null,status:'open'});
 if(error)return toast(error.message,true);closeSupport();toast('Support request sent.');loadSupport();
}
async function loadSupport(){
 const [tickets,releases]=await Promise.all([
  sb.from('support_requests').select('*').eq('user_id',currentUser.id).order('created_at',{ascending:false}),
  sb.from('release_notes').select('*').eq('public_visible',true).eq('status','published').order('published_at',{ascending:false}).limit(12)
 ]);
 q('#mySupportRequestList').innerHTML=(tickets.data||[]).length?(tickets.data||[]).map(x=>row(x.request_type==='bug'?'!':'?',x.subject,`${x.request_type} · ${x.status} · ${new Date(x.created_at).toLocaleDateString()}`)).join(''):'<div class="approved-resource-empty">No support requests.</div>';
 q('#userReleaseNotes').innerHTML=(releases.data||[]).length?(releases.data||[]).map(x=>row('R',x.title,`${x.version_label||''} · ${new Date(x.published_at).toLocaleDateString()}`)).join(''):'<div class="approved-resource-empty">No release notes yet.</div>';
}

async function checkAdmin(){const {data}=await sb.from('admin_user_roles').select('role,active').eq('user_id',currentUser.id).maybeSingle();isAdmin=!!data?.active&&['admin','editor'].includes(data.role);return isAdmin}
async function loadSupportOps(){
 if(!await checkAdmin())return;
 const d=await rpc('get_support_ops_summary');if(!d)return;
 const s=d.summary||{};
 q('#supportOpsOpen').textContent=s.open||0;q('#supportOpsBugs').textContent=s.bugs||0;q('#supportOpsPilot').textContent=s.pilot||0;q('#supportOpsUrgent').textContent=s.high_priority||0;
 q('#supportOpsQueueList').innerHTML=(d.queue||[]).map(x=>row(x.request_type==='bug'?'!':'?',x.subject,`${x.request_type} · ${x.priority} · ${x.status}`,'','Open',x.id)).join('')||'<div class="approved-resource-empty">No open requests.</div>';
 q('#supportOpsBugList').innerHTML=(d.bugs||[]).map(x=>row('!',x.subject,`${x.priority} · ${x.status}`,'','Open',x.id)).join('')||'<div class="approved-resource-empty">No open bugs.</div>';
 q('#supportOpsFeedbackList').innerHTML=(d.feedback||[]).map(x=>row('♡',x.subject,x.status)).join('')||'<div class="approved-resource-empty">No feedback.</div>';
 q('#supportOpsPilotList').innerHTML=(d.pilot||[]).map(x=>row('P',x.subject,x.status)).join('')||'<div class="approved-resource-empty">No pilot feedback.</div>';
}
function setSupportOpsTab(tab){qa('[data-support-ops-tab]').forEach(b=>b.classList.toggle('active',b.dataset.supportOpsTab===tab));['queue','bugs','feedback','pilot'].forEach(x=>q('#supportOpsPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}
async function loadPrivacyOps(){
 if(!await checkAdmin())return;
 const d=await rpc('get_privacy_ops_summary');if(!d)return;
 const s=d.summary||{};
 q('#privacyOpsOpen').textContent=s.open||0;q('#privacyOpsExport').textContent=s.export||0;q('#privacyOpsDelete').textContent=s.delete||0;q('#privacyOpsOverdue').textContent=s.overdue||0;
 q('#privacyOpsList').innerHTML=(d.requests||[]).map(x=>row('▤',x.label,`${x.request_type} · ${x.status} · target ${x.target_date||'not set'}`,'','Open',x.id)).join('')||'<div class="approved-resource-empty">No open privacy requests.</div>';
}
async function loadTrustOps(){
 if(!await checkAdmin())return;
 const d=await rpc('get_trust_ops_summary');if(!d)return;
 q('#trustAuditList').innerHTML=(d.audit||[]).map(x=>row('◇',x.action_label,`${x.entity_type} · ${new Date(x.created_at).toLocaleString()}`)).join('')||'<div class="approved-resource-empty">No audit events.</div>';
 q('#trustReleaseList').innerHTML=(d.releases||[]).map(x=>row('R',x.title,`${x.status} · ${x.version_label||''}`)).join('')||'<div class="approved-resource-empty">No release notes.</div>';
 q('#trustIncidentList').innerHTML=(d.incidents||[]).map(x=>row('!',x.title,`${x.severity} · ${x.status}`)).join('')||'<div class="approved-resource-empty">No incidents.</div>';
}
function setTrustOpsTab(tab){qa('[data-trust-ops-tab]').forEach(b=>b.classList.toggle('active',b.dataset.trustOpsTab===tab));['audit','releases','incidents'].forEach(x=>q('#trustOpsPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}
async function addRelease(){
 const title=prompt('Release title:');if(!title)return;const version=prompt('Version label:','')||null;const body=prompt('What changed?','')||null;
 const {error}=await sb.from('release_notes').insert({title,version_label:version,body,status:'draft',public_visible:false,created_by:currentUser.id});
 if(error)return toast(error.message,true);loadTrustOps();
}
async function addIncident(){
 const title=prompt('Incident title:');if(!title)return;const sev=prompt('Severity: low, medium, high, critical','medium')||'medium';const desc=prompt('Operational description:','')||null;
 const {error}=await sb.from('operational_incidents').insert({title,severity:sev,description:desc,status:'open',created_by:currentUser.id});
 if(error)return toast(error.message,true);loadTrustOps();
}

qa('[data-trust-tab]').forEach(b=>b.onclick=()=>setTrustTab(b.dataset.trustTab));
qa('[data-data-request]').forEach(b=>b.onclick=()=>createDataRequest(b.dataset.dataRequest));
qa('[data-support-type]').forEach(b=>b.onclick=()=>openSupport(b.dataset.supportType));
q('#supportEditorClose')?.addEventListener('click',closeSupport);
q('#supportEditorSave')?.addEventListener('click',saveSupport);
qa('[data-support-ops-tab]').forEach(b=>b.onclick=()=>setSupportOpsTab(b.dataset.supportOpsTab));
qa('[data-trust-ops-tab]').forEach(b=>b.onclick=()=>setTrustOpsTab(b.dataset.trustOpsTab));
q('#trustAddRelease')?.addEventListener('click',addRelease);
q('#trustAddIncident')?.addEventListener('click',addIncident);

if(typeof showPage==='function'){
 const old=showPage;showPage=function(name){old(name);if(name==='trust-center')loadTrust();if(name==='help-support')loadSupport();if(name==='support-ops')loadSupportOps();if(name==='privacy-ops')loadPrivacyOps();if(name==='trust-ops')loadTrustOps()};
}
})();
