
(()=>{
'use strict';
const q=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=m=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),2200)}};
async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error){console.warn(name,error);return {error}}return {data}}

async function load(){
 const r=await rpc('get_my_journal_companion');
 if(r.error)return;
 const d=r.data||{};
 const volumes=d.volumes||[];
 q('#journalCompanionVolumes').innerHTML=volumes.map(v=>`<article class="journal-volume ${v.current?'current':''}"><b>${esc(v.label)}</b><span>${esc(v.day_range_label)}</span><span>${esc(v.description)}</span><em>${v.current?'Your current companion':'Available companion'}</em></article>`).join('');
 q('#journalPairedList').innerHTML=(d.paired||[]).map(x=>`<div class="journal-paired-item"><div><b>${esc(x.label)}</b><small>Paired ${esc(x.paired_label||'')}</small></div><button class="approved-small-action" data-unpair="${x.id}">Unpair</button></div>`).join('')||'<div class="approved-resource-empty">No physical journals paired yet.</div>';
 q('#journalModeStatus').textContent=`Current preference: ${d.reflection_mode||'digital'}`;
 document.querySelectorAll('[data-unpair]').forEach(b=>b.onclick=async()=>{const x=await rpc('unpair_my_physical_journal',{p_pairing_id:b.dataset.unpair});toast(x.error?'Could not unpair journal.':'Journal unpaired.');if(!x.error)load()});
}
q('#journalPairButton')?.addEventListener('click',async()=>{
 const code=q('#journalPairCode').value.trim();
 if(!code)return toast('Enter the journal code first.');
 const r=await rpc('pair_my_physical_journal',{p_pair_code:code});
 if(r.error)return toast(r.error.message||'Could not pair journal.');
 q('#journalPairCode').value='';
 toast('Journal paired.');
 load();
});
document.querySelectorAll('[data-journal-mode]').forEach(b=>b.onclick=async()=>{
 const mode=b.dataset.journalMode;
 const r=await rpc('save_my_journal_reflection_mode',{p_mode:mode});
 toast(r.error?'Could not save preference.':`Reflection preference saved: ${mode}.`);
 if(!r.error)load();
});
load();
})();
