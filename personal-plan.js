
(()=>{
'use strict';
const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=m=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),2200)}};
async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error){console.warn(name,error);return {error}}return {data}}
const map={warning:'warning_sign',triggers:'trigger',coping:'coping_step',support:'support_person',places:'place'};
function panel(tab){qa('[data-plan-tab]').forEach(b=>b.classList.toggle('active',b.dataset.planTab===tab));['Warning','Triggers','Coping','Support','Places','Message'].forEach(x=>q('#planPanel'+x)?.classList.add('hidden'));q('#planPanel'+tab[0].toUpperCase()+tab.slice(1))?.classList.remove('hidden')}
function renderList(id,rows){q(id).innerHTML=(rows||[]).map(x=>`<div class="plan-item"><span>${esc(x.item_text)}</span><button data-plan-delete="${x.id}">Remove</button></div>`).join('')||'<div class="approved-resource-empty">Nothing added yet.</div>'}
async function load(){
 const r=await rpc('get_my_personal_recovery_plan'); if(r.error)return;
 const d=r.data||{};
 renderList('#planWarningList',d.warning_signs);renderList('#planTriggerList',d.triggers);renderList('#planCopingList',d.coping_steps);renderList('#planSupportList',d.support_people);renderList('#planPlaceList',d.places);
 q('#planMessage').value=d.message_to_self||'';
 q('#planWarningCount').textContent=(d.warning_signs||[]).length;q('#planTriggerCount').textContent=(d.triggers||[]).length;q('#planCopingCount').textContent=(d.coping_steps||[]).length;q('#planSupportCount').textContent=(d.support_people||[]).length;
 qa('[data-plan-delete]').forEach(b=>b.onclick=async()=>{const x=await rpc('delete_my_personal_plan_item',{p_item_id:b.dataset.planDelete});if(x.error)return toast('Could not remove item.');load()});
}
async function add(type,input){
 const el=q(input),text=el.value.trim();if(!text)return;
 const r=await rpc('add_my_personal_plan_item',{p_item_type:type,p_item_text:text});if(r.error)return toast('Could not save item.');el.value='';load();
}
qa('[data-plan-tab]').forEach(b=>b.onclick=()=>panel(b.dataset.planTab));
q('#planWarningAdd')?.addEventListener('click',()=>add('warning_sign','#planWarningInput'));
q('#planTriggerAdd')?.addEventListener('click',()=>add('trigger','#planTriggerInput'));
q('#planCopingAdd')?.addEventListener('click',()=>add('coping_step','#planCopingInput'));
q('#planSupportAdd')?.addEventListener('click',()=>add('support_person','#planSupportInput'));
q('#planPlaceAdd')?.addEventListener('click',()=>add('place','#planPlaceInput'));
q('#planMessageSave')?.addEventListener('click',async()=>{const r=await rpc('save_my_personal_plan_message',{p_message:q('#planMessage').value.trim()});toast(r.error?'Could not save your note.':'Private note saved.')});
q('#planPrint')?.addEventListener('click',async()=>{const r=await rpc('get_my_personal_recovery_plan');if(r.error)return toast('Could not prepare your plan.');const d=r.data||{},section=(title,arr)=>`<section><h2>${esc(title)}</h2>${(arr||[]).map(x=>`<p>• ${esc(x.item_text)}</p>`).join('')||'<p>—</p>'}</section>`;const w=window.open('','_blank');if(!w)return;w.document.write(`<html><head><title>My Lellee Plan</title><style>body{font-family:Arial,sans-serif;max-width:760px;margin:50px auto;padding:0 24px;line-height:1.6;color:#29242e}h1,h2{color:#5f476f}section{margin:26px 0;page-break-inside:avoid}.note{padding:16px;background:#f7f2f9;border-radius:10px;white-space:pre-wrap}</style></head><body><small>Lellee · Private Personal Plan</small><h1>What Helps Me</h1>${section('Warning signs',d.warning_signs)}${section('Triggers',d.triggers)}${section('Coping steps',d.coping_steps)}${section('Support people',d.support_people)}${section('Helpful or difficult places',d.places)}<section><h2>What I want to remember</h2><div class="note">${esc(d.message_to_self||'')}</div></section></body></html>`);w.document.close();w.focus();w.print()});
load();
})();
