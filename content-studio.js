
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2300)}};

let isAdmin=false,programs=[],items=[],stages=[],editingItem=null,editingStage=null,editorTab='content';

async function checkAdmin(){
 if(!currentUser)return false;
 const {data}=await sb.from('admin_user_roles').select('role,active').eq('user_id',currentUser.id).maybeSingle();
 isAdmin=!!data?.active&&['admin','editor'].includes(data.role);
 return isAdmin;
}
async function loadPrograms(){
 if(!await checkAdmin())return;
 const {data}=await sb.from('programs').select('id,slug,name,status,display_order').order('display_order');
 programs=data||[];
 const s=q('#contentStudioProgram');if(!s)return;
 const prev=s.value;
 s.innerHTML=programs.map(x=>`<option value="${x.id}">${esc(x.name)} · ${esc(x.status)}</option>`).join('');
 if(prev&&programs.some(x=>x.id===prev))s.value=prev;
 await loadStudio();
}
async function loadStudio(){
 const pid=q('#contentStudioProgram')?.value;if(!pid)return;
 const [content,stageData]=await Promise.all([
   sb.from('program_content_items').select('*').eq('program_id',pid).order('sequence').order('created_at'),
   sb.from('program_journey_stages').select('*').eq('program_id',pid).order('sequence')
 ]);
 if(content.error)return toast(content.error.message,true);
 items=content.data||[];stages=stageData.data||[];
 renderStudio();
}
function renderStudio(){
 const type=q('#contentStudioType')?.value||'',status=q('#contentStudioStatus')?.value||'',search=(q('#contentStudioSearch')?.value||'').toLowerCase();
 const rows=items.filter(x=>{
   if(type&&x.content_type!==type)return false;
   if(status&&x.status!==status)return false;
   if(search&&!`${x.title||''} ${x.content_key||''} ${x.body_text||''}`.toLowerCase().includes(search))return false;
   return true;
 });
 q('#contentMetricDraft').textContent=items.filter(x=>x.status==='draft').length;
 q('#contentMetricReview').textContent=items.filter(x=>x.status==='review').length;
 q('#contentMetricPublished').textContent=items.filter(x=>x.status==='published').length;
 q('#contentMetricScheduled').textContent=items.filter(x=>x.day_number||x.week_number||x.milestone_day).length;
 const box=q('#contentStudioList');if(!box)return;
 box.innerHTML=rows.length?rows.map(x=>{
   const st=stages.find(s=>s.id===x.stage_id);
   return `<article class="content-row"><div class="content-row-icon">${icon(x.content_type)}</div><div><h3>${esc(x.title)}</h3><small>${esc(x.content_type.replaceAll('_',' '))} · ${esc(x.content_key)}${st?' · '+esc(st.name):''}</small><p>${esc(String(x.intro_text||x.body_text||'').slice(0,190))}</p><div class="content-row-tags"><span class="${x.status}">${esc(x.status)}</span>${x.day_number?`<span>day ${x.day_number}</span>`:''}${x.week_number?`<span>week ${x.week_number}</span>`:''}<span>v${x.version_number||1}</span>${x.pathway&&x.pathway!=='all'?`<span>${esc(x.pathway)}</span>`:''}</div></div><div class="content-row-actions"><button data-content-edit="${x.id}">Edit</button><button data-content-duplicate="${x.id}">Duplicate</button></div></article>`;
 }).join(''):'<div class="approved-resource-empty">No matching content.</div>';
 qa('[data-content-edit]').forEach(b=>b.onclick=()=>openItem(b.dataset.contentEdit));
 qa('[data-content-duplicate]').forEach(b=>b.onclick=()=>duplicateItem(b.dataset.contentDuplicate));
}
function icon(t){return ({guided_action:'✓',prompt:'?',tool:'◇',learn:'▤',milestone_review:'◆',support:'◎',resource_callout:'⌂'})[t]||'•'}
function setEditorTab(tab){
 editorTab=tab;
 qa('[data-content-editor-tab]').forEach(b=>b.classList.toggle('active',b.dataset.contentEditorTab===tab));
 ['content','schedule','personalization','review'].forEach(x=>q('#contentEditor'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab));
}
function fillStageOptions(value=''){
 const s=q('#contentEditStage');if(!s)return;
 s.innerHTML='<option value="">No stage</option>'+stages.filter(x=>x.status!=='archived').map(x=>`<option value="${x.id}">${esc(x.sequence+'. '+x.name)}</option>`).join('');
 s.value=value||'';
}
async function openItem(id=null){
 editingItem=id?items.find(x=>x.id===id):null;
 q('#contentEditorKicker').textContent=editingItem?'EDIT CONTENT':'NEW CONTENT';
 q('#contentEditorTitle').textContent=editingItem?.title||'New Content';
 q('#contentEditType').value=editingItem?.content_type||'guided_action';
 q('#contentEditKey').value=editingItem?.content_key||'';
 q('#contentEditTitleText').value=editingItem?.title||'';
 q('#contentEditIntro').value=editingItem?.intro_text||'';
 q('#contentEditBody').value=editingItem?.body_text||'';
 q('#contentEditChoices').value=(editingItem?.suggested_choices||[]).join('\n');
 q('#contentEditReflection').value=editingItem?.reflection_prompt||'';
 fillStageOptions(editingItem?.stage_id||'');
 q('#contentEditSequence').value=editingItem?.sequence||10;
 q('#contentEditDay').value=editingItem?.day_number||'';
 q('#contentEditWeek').value=editingItem?.week_number||'';
 q('#contentEditMilestoneDay').value=editingItem?.milestone_day||'';
 q('#contentEditMinutes').value=editingItem?.estimated_minutes||5;
 q('#contentEditPathway').value=editingItem?.pathway||'all';
 q('#contentEditTradition').value=editingItem?.belief_tradition||'';
 q('#contentEditAudienceTag').value=editingItem?.audience_tag||'';
 q('#contentEditLanguage').value=editingItem?.language_code||'en';
 q('#contentEditTags').value=(editingItem?.tags||[]).join(', ');
 q('#contentEditStatus').value=editingItem?.status||'draft';
 q('#contentEditVersion').value=editingItem?.version_number||1;
 q('#contentEditNotes').value=editingItem?.editor_notes||'';
 q('#contentEditorArchive').classList.toggle('hidden',!editingItem||editingItem.status==='archived');
 setEditorTab('content');q('#contentStudioEditor').classList.remove('hidden');
}
function closeItem(){q('#contentStudioEditor').classList.add('hidden');editingItem=null}
function payloadFromEditor(){
 const key=q('#contentEditKey').value.trim().toLowerCase().replace(/[^a-z0-9_-]/g,'_').replace(/_+/g,'_');
 return {
   program_id:q('#contentStudioProgram').value,
   content_key:key,
   content_type:q('#contentEditType').value,
   title:q('#contentEditTitleText').value.trim(),
   intro_text:q('#contentEditIntro').value.trim()||null,
   body_text:q('#contentEditBody').value.trim()||null,
   suggested_choices:q('#contentEditChoices').value.split('\n').map(x=>x.trim()).filter(Boolean),
   reflection_prompt:q('#contentEditReflection').value.trim()||null,
   stage_id:q('#contentEditStage').value||null,
   sequence:Number(q('#contentEditSequence').value)||10,
   day_number:Number(q('#contentEditDay').value)||null,
   week_number:Number(q('#contentEditWeek').value)||null,
   milestone_day:Number(q('#contentEditMilestoneDay').value)||null,
   estimated_minutes:Number(q('#contentEditMinutes').value)||5,
   pathway:q('#contentEditPathway').value,
   belief_tradition:q('#contentEditTradition').value.trim()||null,
   audience_tag:q('#contentEditAudienceTag').value.trim()||null,
   language_code:q('#contentEditLanguage').value.trim()||'en',
   tags:q('#contentEditTags').value.split(',').map(x=>x.trim()).filter(Boolean),
   status:q('#contentEditStatus').value,
   version_number:Number(q('#contentEditVersion').value)||1,
   editor_notes:q('#contentEditNotes').value.trim()||null,
   updated_at:new Date().toISOString()
 };
}
async function saveItem(){
 const p=payloadFromEditor();
 if(!p.content_key||!p.title)return toast('Internal key and title are required.',true);
 if(p.status==='published'&&(!p.body_text&&!p.reflection_prompt&&!p.suggested_choices.length))return toast('Published content needs meaningful content.',true);
 let res;
 if(editingItem){
   await sb.from('program_content_revisions').insert({
     content_item_id:editingItem.id,
     version_number:editingItem.version_number||1,
     snapshot:editingItem,
     changed_by:currentUser.id
   });
   res=await sb.from('program_content_items').update(p).eq('id',editingItem.id);
 }else{
   res=await sb.from('program_content_items').insert({...p,created_by:currentUser.id});
 }
 if(res.error)return toast(res.error.message,true);
 closeItem();toast('Content saved.');loadStudio();
}
async function archiveItem(){
 if(!editingItem)return;
 const {error}=await sb.from('program_content_items').update({status:'archived',updated_at:new Date().toISOString()}).eq('id',editingItem.id);
 if(error)return toast(error.message,true);closeItem();loadStudio();
}
async function duplicateItem(id){
 const x=items.find(i=>i.id===id);if(!x)return;
 const clone={...x};delete clone.id;delete clone.created_at;delete clone.updated_at;
 clone.content_key=x.content_key+'_copy_'+Date.now().toString().slice(-5);
 clone.title=x.title+' (Copy)';clone.status='draft';clone.version_number=1;clone.created_by=currentUser.id;
 const {error}=await sb.from('program_content_items').insert(clone);if(error)return toast(error.message,true);loadStudio();
}

async function openStage(id=null){
 editingStage=id?stages.find(x=>x.id===id):null;
 q('#stageEditorTitle').textContent=editingStage?'Edit Stage':'New Stage';
 q('#stageEditKey').value=editingStage?.stage_key||'';
 q('#stageEditName').value=editingStage?.name||'';
 q('#stageEditSequence').value=editingStage?.sequence||stages.length+1;
 q('#stageEditStartDay').value=editingStage?.start_day||'';
 q('#stageEditEndDay').value=editingStage?.end_day||'';
 q('#stageEditStatus').value=editingStage?.status||'draft';
 q('#stageEditDescription').value=editingStage?.description||'';
 q('#contentStageEditor').classList.remove('hidden');
}
function closeStage(){q('#contentStageEditor').classList.add('hidden');editingStage=null}
async function saveStage(){
 const p={program_id:q('#contentStudioProgram').value,stage_key:q('#stageEditKey').value.trim().toLowerCase().replace(/[^a-z0-9_-]/g,'_'),name:q('#stageEditName').value.trim(),sequence:Number(q('#stageEditSequence').value)||1,start_day:Number(q('#stageEditStartDay').value)||null,end_day:Number(q('#stageEditEndDay').value)||null,status:q('#stageEditStatus').value,description:q('#stageEditDescription').value.trim()||null,updated_at:new Date().toISOString()};
 if(!p.stage_key||!p.name)return toast('Stage key and name are required.',true);
 const res=editingStage?await sb.from('program_journey_stages').update(p).eq('id',editingStage.id):await sb.from('program_journey_stages').insert(p);
 if(res.error)return toast(res.error.message,true);closeStage();loadStudio();
}

async function preview(){
 const pid=q('#contentStudioProgram').value,program=programs.find(x=>x.id===pid);
 const [s,c]=await Promise.all([
  sb.from('program_journey_stages').select('*').eq('program_id',pid).neq('status','archived').order('sequence'),
  sb.from('program_content_items').select('*').eq('program_id',pid).in('status',['review','published']).order('sequence')
 ]);
 q('#contentPreviewTitle').textContent=(program?.name||'Program')+' Journey Preview';
 const stageRows=s.data||[],contentRows=c.data||[];
 q('#contentPreviewStages').innerHTML=stageRows.length?stageRows.map((x,i)=>`<article class="content-preview-stage ${i===0?'active':''}"><b>${esc(x.sequence+'. '+x.name)}</b><small>${x.start_day&&x.end_day?`Days ${x.start_day}–${x.end_day}`:esc(x.status)}</small></article>`).join(''):'<div class="approved-resource-empty">No journey stages yet.</div>';
 q('#contentPreviewItems').innerHTML=contentRows.length?contentRows.map(x=>`<article class="content-preview-item"><b>${esc(x.title)}</b><small>${esc(x.content_type.replaceAll('_',' '))}${x.day_number?' · day '+x.day_number:''}${x.week_number?' · week '+x.week_number:''} · ${esc(x.status)}</small><p>${esc(String(x.intro_text||x.body_text||'').slice(0,260))}</p></article>`).join(''):'<div class="approved-resource-empty">No review/published content yet.</div>';
 showPage('content-preview');
}
async function loadReleases(){
 if(!await checkAdmin())return;
 const pid=q('#contentStudioProgram')?.value||programs[0]?.id;if(!pid)return;
 const {data,error}=await sb.from('program_content_releases').select('*').eq('program_id',pid).order('created_at',{ascending:false});
 if(error)return toast(error.message,true);
 q('#contentReleaseList').innerHTML=(data||[]).length?(data||[]).map(x=>`<article class="content-row"><div class="content-row-icon">R</div><div><h3>${esc(x.release_name)}</h3><small>${esc(x.status)} · ${new Date(x.created_at).toLocaleDateString()} · ${x.item_count||0} items</small><p>${esc(x.release_notes||'')}</p></div><div class="content-row-actions">${x.status==='draft'?`<button data-publish-release="${x.id}">Publish</button>`:''}</div></article>`).join(''):'<div class="approved-resource-empty">No releases yet.</div>';
 qa('[data-publish-release]').forEach(b=>b.onclick=()=>publishRelease(b.dataset.publishRelease));
}
async function createRelease(){
 const pid=q('#contentStudioProgram')?.value||programs[0]?.id;if(!pid)return;
 const name=prompt('Release name:','Program Content v1');if(!name)return;
 const notes=prompt('Release notes (optional):','')||null;
 const {data:review}=await sb.from('program_content_items').select('id').eq('program_id',pid).eq('status','review');
 const ids=(review||[]).map(x=>x.id);
 if(!ids.length)return toast('Move at least one content item to Review first.',true);
 const {error}=await sb.from('program_content_releases').insert({program_id:pid,release_name:name,release_notes:notes,status:'draft',content_item_ids:ids,item_count:ids.length,created_by:currentUser.id});
 if(error)return toast(error.message,true);toast('Release created.');showPage('content-releases');loadReleases();
}
async function publishRelease(id){
 const {data,error}=await sb.rpc('publish_program_content_release',{p_release_id:id});
 if(error)return toast(error.message,true);toast(`Published ${data||0} content items.`);loadReleases();loadStudio();
}

q('#contentStudioProgram')?.addEventListener('change',loadStudio);
q('#contentStudioType')?.addEventListener('change',renderStudio);
q('#contentStudioStatus')?.addEventListener('change',renderStudio);
q('#contentStudioSearch')?.addEventListener('input',renderStudio);
q('#contentNewItem')?.addEventListener('click',()=>openItem());
q('#contentNewStage')?.addEventListener('click',()=>openStage());
q('#contentRefresh')?.addEventListener('click',loadStudio);
q('#contentPreviewProgram')?.addEventListener('click',preview);
q('#contentCreateRelease')?.addEventListener('click',createRelease);
q('#contentEditorClose')?.addEventListener('click',closeItem);
q('#contentEditorSave')?.addEventListener('click',saveItem);
q('#contentEditorArchive')?.addEventListener('click',archiveItem);
q('#stageEditorClose')?.addEventListener('click',closeStage);
q('#stageEditorSave')?.addEventListener('click',saveStage);
qa('[data-content-editor-tab]').forEach(b=>b.onclick=()=>setEditorTab(b.dataset.contentEditorTab));

if(typeof showPage==='function'){
 const old=showPage;
 showPage=function(name){
   old(name);
   if(name==='content-studio')loadPrograms();
   if(name==='content-releases')loadReleases();
 };
}
})();
