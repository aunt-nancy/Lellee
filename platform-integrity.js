
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}};
async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error){console.warn(name,error);return null}return data}
function row(icon,title,detail,status='',klass=''){return `<div class="integrity-row ${klass}"><div class="integrity-icon">${icon}</div><div><b>${esc(title)}</b><small>${esc(detail||'')}</small></div><em>${esc(status||'')}</em></div>`}
function setTab(tab){qa('[data-integrity-tab]').forEach(b=>b.classList.toggle('active',b.dataset.integrityTab===tab));['preflight','builds','dependencies','settings','drift','recovery'].forEach(x=>q('#integrityPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab))}
async function load(){
 const d=await rpc('get_platform_integrity_summary');if(!d)return;
 const s=d.summary||{};
 q('#integrityPassed').textContent=s.passed||0;
 q('#integrityFailed').textContent=s.failed||0;
 q('#integrityBuilds').textContent=s.builds||0;
 q('#integrityDrift').textContent=s.drift||0;
 q('#integrityPreflightList').innerHTML=(d.preflight||[]).map(x=>row(x.status==='pass'?'✓':'!',x.label,x.detail,x.status,x.status==='pass'?'ok':x.severity==='critical'?'fail':'attention')).join('')||'<div class="approved-resource-empty">Run an integrity scan.</div>';
 q('#integrityBuildList').innerHTML=(d.builds||[]).map(x=>row('B',x.build_name,`${x.version_label||''} · ${x.install_status} · ${x.verify_status}`,x.installed_label||'',x.verify_status==='pass'?'ok':x.install_status==='failed'?'fail':'attention')).join('')||'<div class="approved-resource-empty">No builds registered.</div>';
 q('#integrityDependencyList').innerHTML=(d.dependencies||[]).map(x=>row(x.status==='present'?'✓':'!',x.object_name,`${x.object_type} · ${x.required_by}`,x.status,x.status==='present'?'ok':'fail')).join('');
 q('#integritySettingList').innerHTML=(d.settings||[]).map(x=>row(x.status==='match'?'✓':'!',x.setting_key,`Expected ${x.expected_value}; current ${x.current_value}`,x.status,x.status==='match'?'ok':'fail')).join('');
 q('#integrityDriftList').innerHTML=(d.drift||[]).map(x=>row('Δ',x.finding_type,x.detail,x.status,x.severity==='critical'?'fail':'attention')).join('')||'<div class="approved-resource-empty">No unresolved drift findings.</div>';
 q('#integrityRecoveryList').innerHTML=(d.recovery||[]).map(x=>row('R',x.title,`${x.status} · ${new Date(x.created_at).toLocaleString()}`,x.area)).join('')||'<div class="approved-resource-empty">No recovery notes.</div>';
}
async function runScan(){
 const d=await rpc('run_platform_integrity_scan');if(!d)return toast('Integrity scan failed to run.',true);
 toast(`Integrity scan complete: ${d.passed||0} passed, ${d.failed||0} need attention.`);
 load();
}
async function addBuild(){
 const name=prompt('Build name:');if(!name)return;
 const version=prompt('Version label (optional):','')||null;
 const status=prompt('Install status: planned, installed, failed, superseded','installed')||'installed';
 const verify=prompt('Verify status: not_run, pass, fail','not_run')||'not_run';
 const {error}=await sb.from('platform_build_ledger').insert({build_name:name,version_label:version,install_status:status,verify_status:verify,created_by:currentUser.id});
 if(error)return toast(error.message,true);load();
}
async function addRecovery(){
 const title=prompt('Recovery/repair note title:');if(!title)return;
 const area=prompt('Area: foundation, settings, permissions, data, integration, other','foundation')||'other';
 const note=prompt('What was observed or repaired?','')||null;
 const {error}=await sb.from('platform_recovery_notes').insert({title,area,note,status:'open',created_by:currentUser.id});
 if(error)return toast(error.message,true);load();
}
qa('[data-integrity-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.integrityTab));
q('#integrityRunScan')?.addEventListener('click',runScan);
q('#integrityRegisterBuild')?.addEventListener('click',addBuild);
q('#integrityAddRecoveryNote')?.addEventListener('click',addRecovery);
if(typeof showPage==='function'){const old=showPage;showPage=function(name){old(name);if(name==='platform-integrity')load()}}
})();
