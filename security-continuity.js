
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
function row(icon,title,detail,status='',klass='',action='',id=''){
 return `<div class="security-row ${klass}"><div class="security-icon">${icon}</div><div><b>${esc(title)}</b><small>${esc(detail||'')}</small></div>${action?`<button data-security-action="${esc(action)}" data-security-id="${esc(id)}">${esc(status||'Open')}</button>`:`<em>${esc(status||'')}</em>`}</div>`;
}
async function checkAdmin(){const {data}=await sb.from('admin_user_roles').select('role,active').eq('user_id',currentUser.id).maybeSingle();isAdmin=!!data?.active&&['admin','editor'].includes(data.role);return isAdmin}

async function loadMySecurity(){
 const d=await rpc('get_my_security_center');if(!d)return;
 const s=d.summary||{};
 q('#securityTrustedDevices').textContent=s.trusted_devices||0;q('#securityRecentEvents').textContent=s.recent_events||0;q('#securityConnectedRoles').textContent=s.connected_roles||0;q('#securityOpenRequests').textContent=s.open_security_requests||0;
 q('#securityDeviceList').innerHTML=(d.devices||[]).map(x=>row('▣',x.label,`Last seen ${x.last_seen_at?new Date(x.last_seen_at).toLocaleString():'not recorded'}`,x.status,'', 'revoke-device',x.id)).join('')||'<div class="approved-resource-empty">No trusted devices named.</div>';
 q('#securityEventList').innerHTML=(d.events||[]).map(x=>row(x.severity==='high'?'!':'✓',x.label,`${x.area} · ${new Date(x.created_at).toLocaleString()}`,x.severity,x.severity==='high'?'attention':'')).join('')||'<div class="approved-resource-empty">No recent security events.</div>';
 wireActions();
}
async function addTrustedDevice(){
 const label=prompt('Name this device (example: Home laptop):');if(!label)return;
 const d=await rpc('register_my_trusted_device',{p_label:label});if(!d)return toast('Could not register device.',true);
 toast('Trusted-device label saved.');loadMySecurity();
}
async function revokeDevice(id){
 const d=await rpc('revoke_my_trusted_device',{p_device_id:id});if(!d)return toast('Could not revoke device.',true);
 toast('Trusted-device record revoked.');loadMySecurity();
}
async function reportSecurityIssue(){
 const subject=prompt('Briefly describe the security concern:');if(!subject)return;
 const {error}=await sb.from('support_requests').insert({user_id:currentUser.id,request_type:'question',subject:'Security concern: '+subject,body:'User reported suspicious or concerning account-security activity. Follow up through normal support verification.',priority:'high',feature_area:'account_security',status:'open'});
 if(error)return toast(error.message,true);
 await rpc('record_security_event',{p_event_type:'security_concern_reported',p_area:'account_security',p_metadata:{source:'security_center'}});
 toast('Security concern submitted.');
 loadMySecurity();
}
function wireActions(){
 qa('[data-security-action="revoke-device"]').forEach(b=>b.onclick=()=>revokeDevice(b.dataset.securityId));
}
function setSecurityTab(tab){
 qa('[data-security-tab]').forEach(b=>b.classList.toggle('active',b.dataset.securityTab===tab));
 ['baseline','access','retention','secrets','continuity','incidents'].forEach(x=>q('#securityPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab));
}

async function loadSecurityOps(){
 if(!await checkAdmin())return;
 const d=await rpc('get_security_operations_summary');if(!d)return;
 const s=d.summary||{};
 q('#securityBaselinePass').textContent=s.baseline_pass||0;q('#securityBaselineFail').textContent=s.baseline_fail||0;q('#securityPrivilegedUsers').textContent=s.privileged_identities||0;q('#securityOpenIncidents').textContent=s.open_incidents||0;
 q('#securityBaselineList').innerHTML=(d.baseline||[]).map(x=>row(x.status==='pass'?'✓':'!',x.label,x.detail,x.status,x.status==='pass'?'ok':x.severity==='critical'?'critical':'attention')).join('')||'<div class="approved-resource-empty">Run the security baseline.</div>';
 q('#securityAccessReviewList').innerHTML=(d.access_reviews||[]).map(x=>row('A',x.name,`${x.status} · ${x.item_count} access items`,x.review_type)).join('')||'<div class="approved-resource-empty">No access reviews yet.</div>';
 q('#securityRetentionList').innerHTML=(d.retention||[]).map(x=>row('◷',x.label,`${x.data_class} · ${x.retention_label}`,x.status,x.status==='review_required'?'attention':'')).join('');
 q('#securitySecretList').innerHTML=(d.secrets||[]).map(x=>row('K',x.label,`${x.system_name} · owner ${x.owner_label||'unassigned'} · ${x.rotation_label}`,x.status,x.status==='attention'?'attention':'ok')).join('');
 q('#securityContinuityList').innerHTML=(d.continuity||[]).map(x=>row(x.status==='pass'?'✓':'↶',x.label,x.detail,x.status,x.status==='attention'?'attention':'')).join('');
 q('#securityIncidentList').innerHTML=(d.incidents||[]).map(x=>row('!',x.title,`${x.severity} · ${x.status} · ${new Date(x.created_at).toLocaleDateString()}`,x.affected_area||'',x.severity==='critical'?'critical':'attention')).join('')||'<div class="approved-resource-empty">No security incidents.</div>';
}
async function runBaseline(){
 const d=await rpc('run_security_baseline_checks');if(!d)return toast('Security baseline could not run.',true);
 toast(`Security baseline: ${d.passed||0} passed, ${d.failed||0} need attention.`);
 loadSecurityOps();
}
async function createAccessReview(){
 const name=prompt('Access review name:','Quarterly Privileged Access Review');if(!name)return;
 const d=await rpc('create_privileged_access_review',{p_name:name});if(!d)return toast('Could not create review.',true);
 toast('Access review created.');loadSecurityOps();
}
async function addRestoreDrill(){
 const label=prompt('Restore drill label:','Supabase restore drill');if(!label)return;
 const result=prompt('Result: pass, attention, fail','pass')||'pass';
 const notes=prompt('Notes:','')||null;
 const {error}=await sb.from('continuity_restore_drills').insert({label,result,notes,performed_by:currentUser.id,performed_at:new Date().toISOString()});
 if(error)return toast(error.message,true);loadSecurityOps();
}
async function addSecurityIncident(){
 const title=prompt('Security incident title:');if(!title)return;
 const severity=prompt('Severity: low, medium, high, critical','medium')||'medium';
 const area=prompt('Affected area:','account/access')||null;
 const {error}=await sb.from('security_incidents').insert({title,severity,affected_area:area,status:'open',created_by:currentUser.id});
 if(error)return toast(error.message,true);loadSecurityOps();
}

q('#securityAddTrustedDevice')?.addEventListener('click',addTrustedDevice);
q('#securityReportIssue')?.addEventListener('click',reportSecurityIssue);
qa('[data-security-tab]').forEach(b=>b.onclick=()=>setSecurityTab(b.dataset.securityTab));
q('#securityRunBaseline')?.addEventListener('click',runBaseline);
q('#securityCreateAccessReview')?.addEventListener('click',createAccessReview);
q('#securityAddRestoreDrill')?.addEventListener('click',addRestoreDrill);
q('#securityAddIncident')?.addEventListener('click',addSecurityIncident);

if(typeof showPage==='function'){
 const old=showPage;showPage=function(name){old(name);if(name==='security-center')loadMySecurity();if(name==='security-operations')loadSecurityOps()};
}
})();
