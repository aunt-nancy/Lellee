
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2300)}};

let programId=null,editorMode=null,editingId=null,isAdmin=false,domains=[];

async function getProgram(){
 if(!currentUser)return;
 const {data}=await sb.from('user_program_state').select('active_program_id').eq('user_id',currentUser.id).maybeSingle();
 programId=data?.active_program_id||null;
}
function closeEditor(){q('#progressCoreEditor').classList.add('hidden');editorMode=null;editingId=null}
function field(name){return q(`[data-progress-field="${name}"]`)?.value??null}
function fieldsHTML(items,row={}){
 return items.map(x=>{
  const [n,l,t,opts]=x;let v=row[n]??'';
  if(t==='textarea')return `<label class="admin-wide">${l}<textarea data-progress-field="${n}">${esc(v)}</textarea></label>`;
  if(t==='select')return `<label>${l}<select data-progress-field="${n}">${opts.map(o=>`<option value="${o}" ${String(v)===String(o)?'selected':''}>${String(o).replaceAll('_',' ')}</option>`).join('')}</select></label>`;
  if(t==='range')return `<label>${l}<input data-progress-field="${n}" type="range" min="1" max="5" value="${v||3}"><small>1 = needs attention · 5 = going well</small></label>`;
  return `<label>${l}<input data-progress-field="${n}" type="${t}" value="${esc(v)}"></label>`;
 }).join('');
}
async function openGoal(id=null){
 editorMode='goal';editingId=id;let row={};
 if(id){const {data}=await sb.from('program_goals').select('*').eq('id',id).eq('user_id',currentUser.id).maybeSingle();row=data||{}}
 q('#progressEditorKicker').textContent='GOAL';q('#progressEditorTitle').textContent=id?'Edit Goal':'New Goal';
 q('#progressEditorFields').innerHTML=fieldsHTML([
  ['title','Goal','text'],['why_it_matters','Why this matters','textarea'],['target_date','Target date','date'],['status','Status','select',['active','paused','completed','archived']]
 ],row);
 q('#progressEditorDelete').classList.toggle('hidden',!id);q('#progressCoreEditor').classList.remove('hidden');
}
async function openCheckin(){
 editorMode='checkin';editingId=null;
 if(!domains.length){const {data}=await sb.from('program_outcome_domains').select('*').eq('program_id',programId).eq('active',true).order('display_order');domains=data||[]}
 const domainOptions=domains.map(d=>d.domain_key);
 q('#progressEditorKicker').textContent='PROGRESS CHECK-IN';q('#progressEditorTitle').textContent='How are things going?';
 q('#progressEditorFields').innerHTML=fieldsHTML([
   ['domain_key','Area','select',domainOptions.length?domainOptions:['general']],
   ['self_rating','How is this area going?','range'],
   ['reflection','What feels different or important?','textarea']
 ],{self_rating:3});
 q('#progressEditorDelete').classList.add('hidden');q('#progressCoreEditor').classList.remove('hidden');
}
async function saveEditor(){
 if(editorMode==='goal'){
  const title=field('title')?.trim();if(!title)return toast('Add a goal.',true);
  const payload={user_id:currentUser.id,program_id:programId,title,why_it_matters:field('why_it_matters')?.trim()||null,target_date:field('target_date')||null,status:field('status')||'active',updated_at:new Date().toISOString()};
  if(payload.status==='completed')payload.completed_at=new Date().toISOString();
  const res=editingId?await sb.from('program_goals').update(payload).eq('id',editingId).eq('user_id',currentUser.id):await sb.from('program_goals').insert(payload);
  if(res.error)return toast(res.error.message,true);
 }else if(editorMode==='checkin'){
  const payload={user_id:currentUser.id,program_id:programId,domain_key:field('domain_key')||'general',self_rating:Number(field('self_rating')||3),reflection:field('reflection')?.trim()||null};
  const {error}=await sb.from('program_progress_checkins').insert(payload);if(error)return toast(error.message,true);
 }
 closeEditor();await loadProgress();toast('Saved.');
}
async function deleteEditor(){
 if(editorMode!=='goal'||!editingId)return;
 if(!confirm('Delete this goal?'))return;
 await sb.from('program_goals').delete().eq('id',editingId).eq('user_id',currentUser.id);closeEditor();loadProgress();
}
async function loadProgress(){
 if(!programId)await getProgram();
 const [goals,checks,milestones,doms]=await Promise.all([
  sb.from('program_goals').select('*').eq('user_id',currentUser.id).eq('program_id',programId).order('created_at',{ascending:false}),
  sb.from('program_progress_checkins').select('*').eq('user_id',currentUser.id).eq('program_id',programId).order('created_at',{ascending:false}).limit(12),
  sb.from('milestones').select('id').eq('user_id',currentUser.id).eq('program_id',programId),
  sb.from('program_outcome_domains').select('*').eq('program_id',programId).eq('active',true).order('display_order')
 ]);
 domains=doms.data||[];const g=goals.data||[],c=checks.data||[];
 const active=g.filter(x=>x.status==='active').length,done=g.filter(x=>x.status==='completed').length;
 q('#progressActiveGoals')&&(q('#progressActiveGoals').textContent=active);q('#todayActiveGoals')&&(q('#todayActiveGoals').textContent=active);
 q('#progressCompletedGoals')&&(q('#progressCompletedGoals').textContent=done);q('#progressCheckpoints')&&(q('#progressCheckpoints').textContent=c.length);q('#progressMilestones')&&(q('#progressMilestones').textContent=(milestones.data||[]).length);
 const gl=q('#progressGoalList');if(gl)gl.innerHTML=g.length?g.map(x=>`<div class="progress-row ${x.status==='completed'?'done':''}"><div class="progress-icon">${x.status==='completed'?'✓':'○'}</div><div><b>${esc(x.title)}</b><small>${esc(x.status)}${x.target_date?' · target '+x.target_date:''}</small>${x.why_it_matters?`<p>${esc(x.why_it_matters)}</p>`:''}</div><button data-goal-edit="${x.id}">Edit</button></div>`).join(''):'<div class="approved-resource-empty">No goals yet.</div>';
 qa('[data-goal-edit]').forEach(b=>b.onclick=()=>openGoal(b.dataset.goalEdit));
 const cl=q('#progressCheckinList');if(cl)cl.innerHTML=c.length?c.map(x=>`<div class="progress-row"><div class="progress-icon">${x.self_rating}</div><div><b>${esc(domainLabel(x.domain_key))}</b><small>${new Date(x.created_at).toLocaleDateString()} · ${x.self_rating}/5</small>${x.reflection?`<p>${esc(x.reflection)}</p>`:''}</div><span></span></div>`).join(''):'<div class="approved-resource-empty">No progress check-ins yet.</div>';
}
function domainLabel(key){return domains.find(d=>d.domain_key===key)?.label||String(key||'General').replaceAll('_',' ')}

async function loadSummary(){
 if(!programId)await getProgram();
 const {data,error}=await sb.rpc('get_user_progress_summary',{p_user_id:currentUser.id,p_program_id:programId});
 if(error)return toast(error.message,true);
 const s=data||{};
 q('#progressNarrativeTitle').textContent=s.title||'Your progress';
 q('#progressNarrativeText').textContent=s.narrative||'Your summary will become more useful as you add goals and check-ins.';
 const rows=s.domains||[];
 q('#progressDomainGrid').innerHTML=rows.length?rows.map(x=>`<article class="progress-domain-card"><b>${esc(x.label)}</b><small>${x.checkin_count||0} check-ins</small><div class="progress-domain-bar"><i style="width:${Math.max(0,Math.min(100,Number(x.latest_rating||0)*20))}%"></i></div><p>${x.latest_rating?`Most recent self-rating: ${x.latest_rating}/5.`:'No rating yet.'}${x.direction?` Direction: ${esc(x.direction)}.`:''}</p></article>`).join(''):'<div class="approved-resource-empty">No progress domains configured yet.</div>';
}
async function shareWithCoach(){
 const {data:rels,error}=await sb.from('coach_client_relationships').select('id,coach_businesses(business_name,public_name)').eq('client_user_id',currentUser.id).eq('program_id',programId).eq('status','active');
 if(error)return toast(error.message,true);
 if(!rels?.length)return toast('You do not have an active coach for this program.',true);
 const choices=rels.map((r,i)=>`${i+1}. ${r.coach_businesses?.public_name||r.coach_businesses?.business_name||'Coach'}`).join('\n');
 const idx=Number(prompt(`Choose a coach:\n${choices}`,'1'))-1,rel=rels[idx];if(!rel)return;
 const {data:summary}=await sb.rpc('get_user_progress_summary',{p_user_id:currentUser.id,p_program_id:programId});
 const {error:e}=await sb.from('coach_shared_items').insert({relationship_id:rel.id,client_user_id:currentUser.id,program_id:programId,share_type:'progress_summary',title:'Progress Summary',shared_content:JSON.stringify(summary),source_reference:'progress-core:'+new Date().toISOString()});
 if(e)return toast(e.message,true);toast('Progress snapshot shared with your coach.');
}
async function checkAdmin(){const {data}=await sb.from('admin_user_roles').select('role,active').eq('user_id',currentUser.id).maybeSingle();isAdmin=!!data?.active&&['admin','editor'].includes(data.role);return isAdmin}
async function loadOutcomeBuilder(){
 if(!await checkAdmin())return;
 const {data,error}=await sb.from('program_outcome_domains').select('*,programs(name,slug)').order('program_id').order('display_order');
 if(error)return toast(error.message,true);
 const rows=data||[];
 const {count}=await sb.from('program_progress_checkins').select('id',{count:'exact',head:true});
 q('#outcomeMetricDomains').textContent=rows.length;q('#outcomeMetricPrograms').textContent=new Set(rows.map(x=>x.program_id)).size;q('#outcomeMetricCheckins').textContent=count||0;
 q('#outcomeDomainList').innerHTML=rows.length?rows.map(x=>`<div class="progress-row"><div class="progress-icon">◇</div><div><b>${esc(x.label)}</b><small>${esc(x.programs?.name||'Program')} · ${esc(x.measurement_style)}</small><p>${esc(x.description||'')}</p></div><button data-outcome-edit="${x.id}">Edit</button></div>`).join(''):'<div class="approved-resource-empty">No outcome domains configured.</div>';
}
async function openOutcomeDomain(){
 if(!await checkAdmin())return;
 const {data:programs}=await sb.from('programs').select('id,name').in('status',['active','pilot','planned']).order('display_order');
 const pOptions=(programs||[]).map(x=>x.id);
 editorMode='outcome';editingId=null;
 q('#progressEditorKicker').textContent='OUTCOME DOMAIN';q('#progressEditorTitle').textContent='Add Outcome Domain';
 q('#progressEditorFields').innerHTML=`
 <label>Program<select data-progress-field="program_id">${(programs||[]).map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></label>
 <label>Domain key<input data-progress-field="domain_key" placeholder="example: housing_stability"></label>
 <label>Label<input data-progress-field="label" placeholder="Housing Stability"></label>
 <label>Measurement style<select data-progress-field="measurement_style"><option value="self_rating">Self-rating</option><option value="milestone">Milestone</option><option value="completion">Completion</option><option value="mixed">Mixed</option></select></label>
 <label class="admin-wide">Description<textarea data-progress-field="description"></textarea></label>`;
 q('#progressEditorDelete').classList.add('hidden');q('#progressCoreEditor').classList.remove('hidden');
}
async function saveOutcome(){
 const payload={program_id:field('program_id'),domain_key:field('domain_key')?.trim(),label:field('label')?.trim(),measurement_style:field('measurement_style')||'self_rating',description:field('description')?.trim()||null,active:true};
 if(!payload.program_id||!payload.domain_key||!payload.label)return toast('Program, key and label are required.',true);
 const {error}=await sb.from('program_outcome_domains').insert(payload);if(error)return toast(error.message,true);closeEditor();loadOutcomeBuilder();toast('Outcome domain added.');
}
const originalSave=saveEditor;
async function saveDispatcher(){if(editorMode==='outcome')return saveOutcome();return originalSave()}
q('#progressNewGoal')?.addEventListener('click',()=>openGoal());
q('#progressNewCheckin')?.addEventListener('click',openCheckin);
q('#shareProgressWithCoach')?.addEventListener('click',shareWithCoach);
q('#outcomeNewDomain')?.addEventListener('click',openOutcomeDomain);
q('#outcomeRefresh')?.addEventListener('click',loadOutcomeBuilder);
q('#progressEditorClose')?.addEventListener('click',closeEditor);
q('#progressEditorSave')?.addEventListener('click',saveDispatcher);
q('#progressEditorDelete')?.addEventListener('click',deleteEditor);

if(typeof showPage==='function'){
 const old=showPage;showPage=function(name){old(name);if(name==='progress-hub'){getProgram().then(loadProgress)}if(name==='progress-summary'){getProgram().then(loadSummary)}if(name==='outcome-builder')loadOutcomeBuilder()};
}
let tries=0;const timer=setInterval(()=>{tries++;if(typeof currentUser!=='undefined'&&currentUser){clearInterval(timer);getProgram().then(loadProgress)}else if(tries>40)clearInterval(timer)},200);
})();
