
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2500)}};
let isAdmin=false,rows=[],editing=null,currentStep='identity';

async function checkAdmin(){
 if(!currentUser)return false;
 const {data}=await sb.from('admin_user_roles').select('role,active').eq('user_id',currentUser.id).maybeSingle();
 isAdmin=!!data?.active&&['admin','editor'].includes(data.role);
 q('#programBuilderUnauthorized')?.classList.toggle('hidden',isAdmin);
 q('#programBuilderContent')?.classList.toggle('hidden',!isAdmin);
 return isAdmin;
}
function statusLabel(s){return s==='active'?'ACTIVE':s==='pilot'?'PILOT':s==='paused'?'PAUSED':'PLANNED'}
function launchPct(row){
 const c=row.launch_checklist||{};
 const keys=['content','safety','privacy','resources','mobile','data','pilot'];
 return Math.round(keys.filter(k=>c[k]===true).length/keys.length*100);
}
async function loadPrograms(){
 if(!await checkAdmin())return;
 const {data,error}=await sb.from('programs').select('*').order('display_order');
 if(error)return toast(error.message,true);
 rows=data||[];
 q('#pbMetricActive').textContent=rows.filter(x=>x.status==='active').length;
 q('#pbMetricPilot').textContent=rows.filter(x=>x.status==='pilot').length;
 q('#pbMetricPlanned').textContent=rows.filter(x=>x.status==='planned').length;
 q('#pbMetricReady').textContent=rows.filter(x=>launchPct(x)>=100).length;
 const box=q('#pbProgramList');
 box.innerHTML=rows.map((x,i)=>`<div class="program-builder-row"><div class="program-builder-icon">${i+1}</div><div><b>${esc(x.name)}</b><small>${esc(x.short_description||'')} · readiness ${launchPct(x)}%</small></div><div class="meta"><span class="pb-status ${x.status}">${statusLabel(x.status)}</span><button data-pb-edit="${x.id}">Edit</button></div></div>`).join('');
 qa('[data-pb-edit]').forEach(b=>b.onclick=()=>openEditor(b.dataset.pbEdit));
}
function setStep(step){
 currentStep=step;
 qa('[data-pb-step]').forEach(b=>b.classList.toggle('active',b.dataset.pbStep===step));
 ['identity','journey','modules','resources','safety','coaching','launch'].forEach(s=>q('#pbStep'+s[0].toUpperCase()+s.slice(1))?.classList.toggle('hidden',s!==step));
}
function setChecks(selector,values=[]){qa(selector).forEach(x=>x.checked=values.includes(x.value))}
function openEditor(id=null){
 editing=id?rows.find(x=>x.id===id):null;
 q('#pbEditorTitle').textContent=editing?'Edit Program':'Create Program';
 q('#pbName').value=editing?.name||'';
 q('#pbSlug').value=editing?.slug||'';
 q('#pbStatus').value=editing?.status||'planned';
 q('#pbAudience').value=editing?.audience||'';
 q('#pbDescription').value=editing?.short_description||'';
 q('#pbJourneyLabel').value=editing?.terminology?.journey||'';
 q('#pbStoryLabel').value=editing?.terminology?.story||'';
 q('#pbJourneyMode').value=editing?.journey_config?.mode||'milestone_stage';
 q('#pbJourneyDays').value=editing?.journey_config?.days||365;
 q('#pbLongCadence').value=editing?.journey_config?.long_term_cadence||'weekly';
 q('#pbProgressive').value=String(editing?.journey_config?.progressive_disclosure??true);
 q('#pbStages').value=(editing?.journey_config?.stages||[]).join('\n');
 setChecks('#pbModuleChecks input',editing?.module_keys||['today','journey','help_now','journal','tools','learn','support','resources','milestones','history','story']);
 q('#pbResourceCategories').value=(editing?.resource_config?.categories||[]).join('\n');
 q('#pbLocalResources').value=String(editing?.resource_config?.local_search??true);
 q('#pbSponsored').value=String(editing?.resource_config?.sponsored??false);
 q('#pbSensitive').checked=!!editing?.privacy_config?.sensitive;
 q('#pbCrossShare').checked=!!editing?.privacy_config?.cross_program_sharing_default;
 q('#pbQuickExit').checked=!!editing?.privacy_config?.quick_exit_required;
 q('#pbMinorReview').checked=!!editing?.privacy_config?.minor_review_required;
 q('#pbMedicalReview').checked=!!editing?.privacy_config?.heightened_review;
 q('#pbSafetyNotes').value=editing?.safety_config?.notes||'';
 q('#pbCoachingAvailable').checked=!!editing?.coaching_config?.available;
 q('#pbGroupCoaching').checked=!!editing?.coaching_config?.group_allowed;
 q('#pbHybridCoaching').checked=!!editing?.coaching_config?.hybrid_allowed;
 q('#pbCredentialReview').checked=editing?.coaching_config?.requires_business_review!==false;
 q('#pbGroupCapacity').value=editing?.coaching_config?.default_group_capacity||8;
 q('#pbCoachLabel').value=editing?.coaching_config?.coach_label||'Coach';
 const lc=editing?.launch_checklist||{};
 qa('[data-pb-launch]').forEach(x=>x.checked=lc[x.dataset.pbLaunch]===true);
 q('#pbDeleteProgram').classList.toggle('hidden',!editing||editing.slug==='recovery');
 updateReadiness();
 setStep('identity');q('#programBuilderEditor').classList.remove('hidden');
}
function close(){q('#programBuilderEditor').classList.add('hidden')}
function updateReadiness(){
 const total=qa('[data-pb-launch]').length,done=qa('[data-pb-launch]:checked').length,p=total?Math.round(done/total*100):0;
 q('#pbLaunchPercent').textContent=p+'%';q('#pbLaunchBar').style.width=p+'%';
}
async function saveProgram(){
 const name=q('#pbName').value.trim(),slug=q('#pbSlug').value.trim().toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-');
 if(!name||!slug)return toast('Program name and slug are required.',true);
 const launch=Object.fromEntries(qa('[data-pb-launch]').map(x=>[x.dataset.pbLaunch,x.checked]));
 const payload={
  name,slug,status:q('#pbStatus').value,audience:q('#pbAudience').value.trim()||null,short_description:q('#pbDescription').value.trim()||null,
  terminology:{journey:q('#pbJourneyLabel').value.trim()||'Journey',story:q('#pbStoryLabel').value.trim()||'My Story'},
  journey_config:{mode:q('#pbJourneyMode').value,days:Number(q('#pbJourneyDays').value)||0,long_term_cadence:q('#pbLongCadence').value,progressive_disclosure:q('#pbProgressive').value==='true',stages:q('#pbStages').value.split('\n').map(x=>x.trim()).filter(Boolean)},
  module_keys:qa('#pbModuleChecks input:checked').map(x=>x.value),
  resource_config:{categories:q('#pbResourceCategories').value.split('\n').map(x=>x.trim()).filter(Boolean),local_search:q('#pbLocalResources').value==='true',sponsored:q('#pbSponsored').value==='true'},
  privacy_config:{sensitive:q('#pbSensitive').checked,cross_program_sharing_default:q('#pbCrossShare').checked,quick_exit_required:q('#pbQuickExit').checked,minor_review_required:q('#pbMinorReview').checked,heightened_review:q('#pbMedicalReview').checked},
  safety_config:{notes:q('#pbSafetyNotes').value.trim()||null},
  coaching_config:{available:q('#pbCoachingAvailable').checked,group_allowed:q('#pbGroupCoaching').checked,hybrid_allowed:q('#pbHybridCoaching').checked,requires_business_review:q('#pbCredentialReview').checked,default_group_capacity:Number(q('#pbGroupCapacity').value)||8,coach_label:q('#pbCoachLabel').value.trim()||'Coach'},
  launch_checklist:launch,
  updated_at:new Date().toISOString()
 };
 const pct=Math.round(Object.values(launch).filter(Boolean).length/Object.keys(launch).length*100);
 if(payload.status==='active'&&pct<100)return toast('Complete all launch checks before activating a program.',true);
 let res;
 if(editing)res=await sb.from('programs').update(payload).eq('id',editing.id);
 else res=await sb.from('programs').insert({...payload,display_order:(rows.at(-1)?.display_order||0)+10,brand_config:{master_brand:'Lellee'}});
 if(res.error)return toast(res.error.message,true);
 await syncModules(editing?.id||null,slug);
 close();toast('Program saved.');loadPrograms();
}
async function syncModules(id,slug){
 let pid=id;
 if(!pid){const {data}=await sb.from('programs').select('id').eq('slug',slug).single();pid=data?.id}
 if(!pid)return;
 const selected=qa('#pbModuleChecks input:checked').map(x=>x.value);
 const labels={today:'Today',journey:'Journey',help_now:'Help Me Right Now',journal:'Journal / Reflection',tools:'Tools',learn:'Learn',support:'Support / Connection',resources:'Resources',milestones:'Milestones',history:'History',story:'Story',documents:'Documents',appointments:'Appointments',benefits:'Benefits',employment:'Employment',housing:'Housing'};
 await sb.from('program_modules').delete().eq('program_id',pid);
 if(selected.length)await sb.from('program_modules').insert(selected.map((k,i)=>({program_id:pid,module_key:k,label:labels[k]||k,enabled:true,display_order:(i+1)*10})));
}
async function deleteProgram(){
 if(!editing||editing.slug==='recovery')return;
 if(!confirm(`Delete planned program "${editing.name}"? This should only be used for programs with no user data.`))return;
 const {error}=await sb.from('programs').delete().eq('id',editing.id);
 if(error)return toast(error.message,true);close();loadPrograms();
}
qa('[data-pb-step]').forEach(b=>b.onclick=()=>setStep(b.dataset.pbStep));
qa('[data-pb-launch]').forEach(x=>x.onchange=updateReadiness);
q('#pbCreateProgram')?.addEventListener('click',()=>openEditor());
q('#pbRefresh')?.addEventListener('click',loadPrograms);
q('#pbSaveProgram')?.addEventListener('click',saveProgram);
q('#pbDeleteProgram')?.addEventListener('click',deleteProgram);
q('[data-close-program-builder]')?.addEventListener('click',close);

if(typeof showPage==='function'){
 const oldShow=showPage;
 showPage=function(name){oldShow(name);if(name==='program-builder')loadPrograms()};
}
})();
