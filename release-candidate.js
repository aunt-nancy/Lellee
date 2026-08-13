
(()=>{
'use strict';
const q=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=m=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),2400)}};
async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error){console.warn(name,error);return {error}}return {data}}
function renderCheck(x){
 const cls=x.status==='pass'?'ok':x.status==='warn'?'warn':'fail';
 const icon=x.status==='pass'?'✓':x.status==='warn'?'!':'×';
 return `<div class="rc-check ${cls}"><span>${icon}</span><div><b>${esc(x.label)}</b><small>${esc(x.detail||'')}</small></div><em>${esc(x.status.toUpperCase())}</em></div>`;
}
async function load(){
 const r=await rpc('get_recovery_release_candidate_status');
 if(r.error)return;
 const d=r.data||{};
 q('#rcPassCount').textContent=d.summary?.pass||0;
 q('#rcWarnCount').textContent=d.summary?.warn||0;
 q('#rcFailCount').textContent=d.summary?.fail||0;
 q('#rcVersion').textContent=d.release_candidate?.version_label||'RC';
 q('#rcPhaseChecks').innerHTML=(d.phase_checks||[]).map(renderCheck).join('');
 q('#rcGuardrailChecks').innerHTML=(d.guardrail_checks||[]).map(renderCheck).join('');
 q('#rcLaunchChecks').innerHTML=(d.launch_checks||[]).map(renderCheck).join('');
 const s=d.release_candidate;
 q('#rcLockStatus').textContent=s?.locked_at?`Locked ${s.locked_label}`:'Not yet locked.';
}
q('#rcLockCandidate')?.addEventListener('click',async()=>{
 const r=await rpc('lock_recovery_release_candidate');
 if(r.error)return toast(r.error.message||'Could not lock release candidate.');
 toast('Recovery release candidate locked.');
 load();
});
load();
})();
