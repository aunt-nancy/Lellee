
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2300)}};

let activeProgram=null,enrollments=[],runtimeStages=[],runtimeContent=[],runtimeModules=[],todayItem=null,selectedChoices=new Set(),isAdmin=false;

async function loadEnrollments(){
 if(!currentUser)return;
 const {data,error}=await sb.from('program_enrollments')
   .select('id,program_id,status,is_primary,enrolled_at,programs(id,slug,name,short_description,status,terminology,journey_config,brand_config)')
   .eq('user_id',currentUser.id)
   .in('status',['active','paused']);
 if(error)return toast(error.message,true);
 enrollments=data||[];

 const {data:state}=await sb.from('user_program_state').select('active_program_id').eq('user_id',currentUser.id).maybeSingle();
 const activeId=state?.active_program_id;
 activeProgram=enrollments.find(x=>x.program_id===activeId)?.programs||enrollments[0]?.programs||null;
 renderSwitcher();
}
function renderSwitcher(){
 const box=q('#programSwitcherList');if(!box)return;
 box.innerHTML=enrollments.length?enrollments.map((e,i)=>{
   const p=e.programs,active=p.id===activeProgram?.id;
   return `<article class="program-switch-row ${active?'active':''}"><div class="program-switch-icon">${esc((p.name||'L').slice(0,1))}</div><div><b>${esc(p.name)}</b><small>${esc(p.short_description||'Lellee program')}</small><span class="program-switch-pill ${active?'active':p.status==='pilot'?'pilot':''}">${active?'CURRENT':String(p.status||e.status).toUpperCase()}</span></div><button data-switch-program="${p.id}">${active?'Open':'Switch'}</button></article>`;
 }).join(''):'<div class="approved-resource-empty">No programs are connected to your account.</div>';
 qa('[data-switch-program]').forEach(b=>b.onclick=()=>switchProgram(b.dataset.switchProgram));
}
async function switchProgram(id){
 const enrolled=enrollments.find(x=>x.program_id===id);
 if(!enrolled)return toast('You are not enrolled in that program.',true);
 const {error}=await sb.from('user_program_state').update({active_program_id:id,updated_at:new Date().toISOString()}).eq('user_id',currentUser.id);
 if(error)return toast(error.message,true);
 activeProgram=enrolled.programs;
 if(activeProgram.slug==='recovery'){
   toast('Recovery selected.');showPage('today');return;
 }
 await loadRuntime();
 showPage('program-home');
}
async function loadRuntime(){
 if(!activeProgram)return;
 const [stages,content,modules,progress]=await Promise.all([
   sb.from('program_journey_stages').select('*').eq('program_id',activeProgram.id).eq('status','published').order('sequence'),
   sb.from('published_program_content').select('*').eq('program_id',activeProgram.id).order('day_number').order('week_number').order('sequence'),
   sb.from('program_modules').select('*').eq('program_id',activeProgram.id).eq('enabled',true).order('display_order'),
   sb.from('pilot_program_progress').select('*').eq('user_id',currentUser.id).eq('program_id',activeProgram.id).maybeSingle()
 ]);
 runtimeStages=stages.data||[];runtimeContent=content.data||[];runtimeModules=modules.data||[];
 const prog=progress.data||{};
 const day=Math.max(1,prog.current_day||1),week=Math.max(1,prog.current_week||1);
 todayItem=chooseToday(day,week);
 selectedChoices=new Set();
 renderRuntime(day,week);
}
function chooseToday(day,week){
 const byDay=runtimeContent.find(x=>x.day_number===day&&['guided_action','prompt'].includes(x.content_type));
 if(byDay)return byDay;
 const byWeek=runtimeContent.find(x=>x.week_number===week&&['guided_action','prompt'].includes(x.content_type));
 if(byWeek)return byWeek;
 return runtimeContent.find(x=>['guided_action','prompt'].includes(x.content_type))||runtimeContent[0]||null;
}
function currentStage(day){
 return runtimeStages.find(s=>s.start_day&&s.end_day&&day>=s.start_day&&day<=s.end_day) || runtimeStages[0] || null;
}
function renderRuntime(day,week){
 const p=activeProgram,stage=currentStage(day);
 q('#runtimeProgramKicker').textContent=`LELLEE · ${(p.name||'PROGRAM').toUpperCase()}`;
 q('#runtimeProgramName').textContent=p.name;
 q('#runtimeProgramDescription').textContent=p.short_description||'';
 q('#runtimeJourneyLabel').textContent=p.terminology?.journey||`${p.name} Journey`;
 q('#runtimeStageLabel').textContent=stage?.name||`Day ${day}`;

 if(todayItem){
   q('#runtimeTodayTitle').textContent=todayItem.title;
   q('#runtimeTodayIntro').textContent=todayItem.intro_text||todayItem.body_text||'';
   q('#runtimeTodayChoices').innerHTML=(todayItem.suggested_choices||[]).map((x,i)=>`<button data-runtime-choice="${i}">${esc(x)}</button>`).join('');
   const hasReflection=!!todayItem.reflection_prompt;
   q('#runtimeTodayReflectionWrap').classList.toggle('hidden',!hasReflection);
   q('#runtimeTodayReflectionLabel').textContent=todayItem.reflection_prompt||'Optional reflection';
   qa('[data-runtime-choice]').forEach(b=>b.onclick=()=>{const v=Number(b.dataset.runtimeChoice);if(selectedChoices.has(v))selectedChoices.delete(v);else selectedChoices.add(v);b.classList.toggle('selected')});
 }else{
   q('#runtimeTodayTitle').textContent='Your program is being prepared';
   q('#runtimeTodayIntro').textContent='No published guided action is scheduled yet.';
   q('#runtimeTodayChoices').innerHTML='';
   q('#runtimeTodayReflectionWrap').classList.add('hidden');
 }

 q('#runtimeModuleGrid').innerHTML=runtimeModules.filter(x=>!['today'].includes(x.module_key)).map(m=>`<button data-runtime-module="${m.module_key}"><b>${esc(m.label)}</b><small>${esc(moduleHelp(m.module_key))}</small></button>`).join('');
 qa('[data-runtime-module]').forEach(b=>b.onclick=()=>openModule(b.dataset.runtimeModule));

 q('#runtimeStageList').innerHTML=runtimeStages.map(s=>`<article class="runtime-stage-chip ${stage?.id===s.id?'current':''}"><b>${esc(s.name)}</b><small>${s.start_day&&s.end_day?`Days ${s.start_day}–${s.end_day}`:esc(s.status)}</small></article>`).join('');
}
function moduleHelp(k){
 return ({journey:'See where you are going',help_now:'Immediate support',journal:'Reflect privately',tools:'Practical tools',learn:'Learn at your pace',support:'People and connection',resources:'Find practical help',milestones:'Notice progress',history:'Review your journey',story:'Build your story',documents:'Track documents',appointments:'Track appointments',benefits:'Track benefits',housing:'Track housing',employment:'Track work and training'})[k]||'Open this part of your program';
}
function openModule(k){
 const map={journey:'program-journey-runtime',help_now:'safety-center',journal:'journal',tools:'tools',learn:'learn',support:'support',resources:'resource-navigator',milestones:'progress-hub',history:'history',story:'story',documents:'life-documents',appointments:'life-appointments',benefits:'life-benefits',housing:'life-housing',employment:'life-employment'};
 showPage(map[k]||'program-home');
}
async function saveToday(){
 if(!todayItem||!activeProgram)return;
 const choices=[...selectedChoices].map(i=>todayItem.suggested_choices?.[i]).filter(Boolean);
 const reflection=q('#runtimeTodayReflection')?.value.trim()||null;
 const {error}=await sb.from('pilot_daily_responses').upsert({
   user_id:currentUser.id,
   program_id:activeProgram.id,
   content_item_id:todayItem.id,
   selected_choices:choices,
   reflection,
   completed_at:new Date().toISOString()
 },{onConflict:'user_id,program_id,content_item_id'});
 if(error)return toast(error.message,true);
 q('#runtimeTodayMsg').textContent='Saved.';
 toast('Today saved.');
}
async function loadJourneyRuntime(){
 if(!activeProgram)return;
 if(!runtimeStages.length)await loadRuntime();
 q('#runtimeJourneyTitle').textContent=activeProgram.terminology?.journey||`${activeProgram.name} Journey`;
 q('#runtimeJourneyDescription').textContent='Your current stage is emphasized. Future stages stay visible without overwhelming Today.';
 q('#runtimeJourneyStages').innerHTML=runtimeStages.map((s,i)=>`<article class="runtime-journey-stage ${i===0?'current':''}"><b>${esc(s.sequence+'. '+s.name)}</b><small>${s.start_day&&s.end_day?`Days ${s.start_day}–${s.end_day}`:esc(s.status)}</small></article>`).join('');
 q('#runtimeJourneyContent').innerHTML=runtimeContent.filter(x=>['guided_action','prompt','learn','tool','milestone_review'].includes(x.content_type)).slice(0,60).map(x=>`<article class="runtime-content-row"><b>${esc(x.title)}</b><small>${esc(x.content_type.replaceAll('_',' '))}${x.day_number?' · day '+x.day_number:''}${x.week_number?' · week '+x.week_number:''}</small><p>${esc(String(x.intro_text||x.body_text||'').slice(0,220))}</p></article>`).join('');
}

async function checkAdmin(){
 const {data}=await sb.from('admin_user_roles').select('role,active').eq('user_id',currentUser.id).maybeSingle();
 isAdmin=!!data?.active&&['admin','editor'].includes(data.role);return isAdmin;
}
async function loadPilotAdmin(){
 if(!await checkAdmin())return;
 const [{data:programs},{data:rows,error}]=await Promise.all([
   sb.from('programs').select('id,name,slug,status').in('status',['pilot','planned']).order('display_order'),
   sb.from('program_pilot_enrollments').select('id,user_id,program_id,status,enrolled_at,profiles:user_id(display_name),programs(name,slug,status)').order('enrolled_at',{ascending:false})
 ]);
 if(error)return toast(error.message,true);
 q('#pilotProgramSelect').innerHTML=(programs||[]).map(x=>`<option value="${x.id}">${esc(x.name)} · ${esc(x.status)}</option>`).join('');
 const r=rows||[];
 q('#pilotMetricUsers').textContent=new Set(r.filter(x=>x.status==='active').map(x=>x.user_id)).size;
 q('#pilotMetricPrograms').textContent=new Set(r.filter(x=>x.status==='active').map(x=>x.program_id)).size;
 q('#pilotMetricActive').textContent=r.filter(x=>x.status==='active').length;
 q('#pilotEnrollmentList').innerHTML=r.length?r.map(x=>`<article class="program-switch-row"><div class="program-switch-icon">P</div><div><b>${esc(x.profiles?.display_name||'Pilot user')}</b><small>${esc(x.programs?.name||'Program')} · ${esc(x.status)}</small></div><button data-remove-pilot="${x.id}">Remove</button></article>`).join(''):'<div class="approved-resource-empty">No pilot enrollments yet.</div>';
 qa('[data-remove-pilot]').forEach(b=>b.onclick=()=>removePilot(b.dataset.removePilot));
}
async function enrollPilot(){
 const email=q('#pilotUserEmail').value.trim(),pid=q('#pilotProgramSelect').value;
 if(!email||!pid)return toast('Choose a program and enter a user email.',true);
 const {data,error}=await sb.rpc('admin_enroll_user_in_pilot',{p_email:email,p_program_id:pid});
 if(error)return toast(error.message,true);
 q('#pilotUserEmail').value='';toast('Pilot user enrolled.');loadPilotAdmin();
}
async function removePilot(id){
 const {error}=await sb.rpc('admin_remove_pilot_enrollment',{p_pilot_enrollment_id:id});
 if(error)return toast(error.message,true);loadPilotAdmin();
}

q('#runtimeSaveToday')?.addEventListener('click',saveToday);
q('#pilotEnrollUser')?.addEventListener('click',enrollPilot);

if(typeof showPage==='function'){
 const old=showPage;
 showPage=function(name){
   old(name);
   if(name==='program-switcher')loadEnrollments();
   if(name==='program-home')loadEnrollments().then(()=>{if(activeProgram?.slug!=='recovery')loadRuntime()});
   if(name==='program-journey-runtime')loadJourneyRuntime();
   if(name==='pilot-enrollment-admin')loadPilotAdmin();
 };
}

let tries=0;
const timer=setInterval(()=>{
 tries++;
 if(typeof currentUser!=='undefined'&&currentUser){
   clearInterval(timer);
   loadEnrollments();
 }else if(tries>40)clearInterval(timer);
},200);
})();
