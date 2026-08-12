
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=m=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),2200)}};
async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error){console.warn(name,error);return {error}}return {data}}

let snapshot={domains:[],priority:null,suggestions:[]};

function render(){
 const d=snapshot.domains||[];
 q('#stabilityDomains').innerHTML=d.map(x=>`
  <article class="stability-domain">
    <h3>${esc(x.label)}</h3>
    <p>${esc(x.description)}</p>
    <div class="stability-state-row">
      ${[
        ['steady','Steady'],
        ['attention','Needs attention'],
        ['help_now','Need help now'],
        ['not_applicable','Not applicable']
      ].map(([v,l])=>`<button class="${x.state===v?'active':''}" data-domain="${x.domain_key}" data-state="${v}">${l}</button>`).join('')}
    </div>
  </article>`).join('');

 qa('[data-domain][data-state]').forEach(b=>b.onclick=async()=>{
   const r=await rpc('save_my_stability_domain',{p_domain_key:b.dataset.domain,p_state:b.dataset.state});
   if(r.error)return toast('Could not save that area.');
   await load();
 });

 q('#stabilitySteadyCount').textContent=d.filter(x=>x.state==='steady').length;
 q('#stabilityAttentionCount').textContent=d.filter(x=>x.state==='attention').length;
 q('#stabilityHelpCount').textContent=d.filter(x=>x.state==='help_now').length;

 const pri=q('#stabilityPriority');
 pri.innerHTML='<option value="">Choose an area</option>'+d.filter(x=>x.state!=='not_applicable').map(x=>`<option value="${x.domain_key}">${esc(x.label)}</option>`).join('');
 if(snapshot.priority?.domain_key) pri.value=snapshot.priority.domain_key;
 q('#stabilityPriorityNote').value=snapshot.priority?.note||'';

 q('#stabilitySuggestions').innerHTML=(snapshot.suggestions||[]).map(x=>`
   <div class="stability-suggestion"><b>${esc(x.title)}</b><small>${esc(x.detail)}</small></div>
 `).join('')||'<div class="approved-resource-empty">Mark an area as needing attention to see suggestions.</div>';
}

async function load(){
 const r=await rpc('get_my_stability_map');
 if(r.error)return;
 snapshot=r.data||{};
 render();
}

q('#stabilitySavePriority')?.addEventListener('click',async()=>{
 const k=q('#stabilityPriority').value;
 if(!k)return toast('Choose an area first.');
 const r=await rpc('save_my_stability_priority',{p_domain_key:k,p_note:q('#stabilityPriorityNote').value.trim()});
 toast(r.error?'Could not save your priority.':'Priority saved.');
 if(!r.error)load();
});

q('#stabilityOpenResources')?.addEventListener('click',()=>{
 if(typeof showPage==='function') showPage('resources');
});

load();
})();
