
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=m=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),2200)}};
async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error){console.warn(name,error);return {error}}return {data}}
let weekState=''; const helped=new Set();
qa('[data-week-state]').forEach(b=>b.onclick=()=>{weekState=b.dataset.weekState;qa('[data-week-state]').forEach(x=>x.classList.toggle('active',x===b))});
qa('[data-helped]').forEach(b=>b.onclick=()=>{const k=b.dataset.helped;if(helped.has(k))helped.delete(k);else helped.add(k);b.classList.toggle('active',helped.has(k))});
async function load(){const r=await rpc('get_my_long_term_maintenance');if(r.error)return;const d=r.data||{};
q('#maintenanceStages').innerHTML=(d.stages||[]).map(x=>`<article class="maintenance-stage ${x.current?'current':''}"><b>${esc(x.label)}</b><small>${esc(x.description)}</small></article>`).join('');
q('#maintenanceRoutineList').innerHTML=(d.routines||[]).map(x=>`<div class="maintenance-list-item"><div><b>${esc(x.routine_text)}</b><small>Active maintenance routine</small></div><button data-routine-remove="${x.id}">Remove</button></div>`).join('')||'<div class="approved-resource-empty">No maintenance routines added yet.</div>';
q('#maintenanceRecentList').innerHTML=(d.recent_checkins||[]).map(x=>`<div class="maintenance-list-item"><div><b>${esc(x.week_state_label)}</b><small>${esc(x.week_label)} · ${esc((x.helped||[]).join(', '))}</small></div></div>`).join('')||'<div class="approved-resource-empty">No weekly check-ins yet.</div>';
qa('[data-routine-remove]').forEach(b=>b.onclick=async()=>{const x=await rpc('delete_my_maintenance_routine',{p_routine_id:b.dataset.routineRemove});toast(x.error?'Could not remove routine.':'Routine removed.');if(!x.error)load()})}
q('#maintenanceSaveWeek')?.addEventListener('click',async()=>{if(!weekState)return toast('Choose how this week felt.');const r=await rpc('save_my_maintenance_checkin',{p_week_state:weekState,p_helped:[...helped],p_reflection:q('#maintenanceReflection').value.trim()});if(r.error)return toast('Could not save your weekly check-in.');toast('Weekly check-in saved.');q('#maintenanceReflection').value='';weekState='';helped.clear();qa('[data-week-state],[data-helped]').forEach(x=>x.classList.remove('active'));load()});
q('#maintenanceRoutineAdd')?.addEventListener('click',async()=>{const text=q('#maintenanceRoutineInput').value.trim();if(!text)return;const r=await rpc('add_my_maintenance_routine',{p_routine_text:text});toast(r.error?'Could not save routine.':'Routine added.');if(!r.error){q('#maintenanceRoutineInput').value='';load()}});
q('#maintenanceSaveAnniversary')?.addEventListener('click',async()=>{const r=await rpc('save_my_anniversary_review',{p_reflection:q('#maintenanceAnniversaryNote').value.trim(),p_refresh_goals:false});toast(r.error?'Could not save anniversary review.':'Anniversary review saved.');if(!r.error)q('#maintenanceAnniversaryNote').value=''});
q('#maintenanceRefreshGoals')?.addEventListener('click',async()=>{const r=await rpc('save_my_anniversary_review',{p_reflection:q('#maintenanceAnniversaryNote').value.trim(),p_refresh_goals:true});toast(r.error?'Could not refresh goals.':'Goals marked for refresh. Your prior recovery history remains preserved.');if(!r.error&&typeof showPage==='function')showPage('goals')});
load();
})();
