
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=m=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),2200)}};
async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error){console.warn(name,error);return {error}}return {data}}
let state='';

const stateInfo={
 already_used:{
   title:'Focus on safety and the next few hours.',
   steps:[
     'Move away from more substances or easy access if you can do so safely.',
     'If overdose or another medical emergency may be possible, seek emergency medical care now.',
     'Avoid using more to “fix” how you feel.',
     'Contact a supportive person or professional resource when you are able.',
     'When you are medically safe, make the next decision small: water, food if appropriate, rest, a safe place, and support.'
   ]
 },
 close_call:{
   title:'Protect the rest of today.',
   steps:[
     'Create distance from the person, place, substance, money, or situation involved.',
     'Tell one supportive person you had a close call.',
     'Use one coping step from your personal plan.',
     'Reduce decisions for the next few hours and return to a familiar healthy routine.'
   ]
 },
 slipping:{
   title:'Reconnect early.',
   steps:[
     'Name one warning sign you are noticing.',
     'Change your environment if the current one is increasing risk.',
     'Contact someone before isolation grows.',
     'Use Help Me Right Now or your personal plan for one immediate coping step.'
   ]
 }
};

function choose(s){
 state=s;
 qa('[data-return-state]').forEach(b=>b.classList.toggle('active',b.dataset.returnState===s));
 const d=stateInfo[s];
 q('#returnStateTitle').textContent=d.title;
 q('#returnImmediateSteps').innerHTML=d.steps.map((x,i)=>`<div class="return-step"><b>${i+1}.</b> ${esc(x)}</div>`).join('');
}
qa('[data-return-state]').forEach(b=>b.onclick=()=>choose(b.dataset.returnState));

function selectedSteps(){return qa('.return-check-grid input:checked').map(x=>x.value)}
async function save(status){
 if(!state)return toast('Choose what fits best first.');
 const r=await rpc('save_my_return_plan',{
   p_event_type:state,
   p_reflection:q('#returnReflection').value.trim(),
   p_next_steps:selectedSteps(),
   p_own_step:q('#returnOwnStep').value.trim(),
   p_status:status
 });
 if(r.error)return toast('Could not save your return plan.');
 toast(status==='completed'?'Return plan completed. Your earlier progress remains in place.':'Private return plan saved.');
 loadPlans();
}
q('#returnSave')?.addEventListener('click',()=>save('active'));
q('#returnComplete')?.addEventListener('click',()=>save('completed'));

async function loadPlans(){
 const r=await rpc('get_my_recent_return_plans');
 if(r.error)return;
 q('#returnPlanList').innerHTML=(r.data||[]).map(x=>`<div class="return-plan-item"><b>${esc(x.event_label)}</b><small>${esc(x.created_label)} · ${esc(x.status)}</small></div>`).join('')||'<div class="approved-resource-empty">No return plans saved.</div>';
}
loadPlans();
})();
