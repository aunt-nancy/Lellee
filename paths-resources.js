
(()=>{
'use strict';
const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const set=(id,v)=>{const e=q('#'+id);if(e)e.textContent=v??''};
const PATH_LABELS={
  '12_step':'12-Step','skills_based':'SMART / Skills-Based','therapy_counseling':'Therapy & Counseling',
  'medication_supported':'Medication-Supported','peer_support':'Peer Support','faith_spiritual':'Faith / Spiritual Support',
  'recovery_community':'Recovery Community','health_wellness':'Health / Wellness','mixed':'Mixed Approach','exploring':'Exploring'
};
const APPROACH_UI={
  '12_step':'12-Step','skills_based':'SMART / skills-based','therapy_counseling':'Therapy / counseling',
  'medication_supported':'Medication-supported','peer_support':'Peer support','mixed':'Mixed','exploring':'Exploring'
};
const PATH_INFO={
 '12_step':['12-Step','Fellowship, sponsorship, meetings, and a structured step process.',['Can add regular peer connection','Can provide sponsorship/mentorship','Can offer a structured recovery framework']],
 'skills_based':['SMART / Skills-Based','Practical motivation, coping, thinking, and behavior-change skills.',['Emphasizes self-management skills','Uses practical tools and exercises','Can complement treatment or other pathways']],
 'therapy_counseling':['Therapy & Counseling','Professional behavioral-health support for substance use, mental health, trauma, relationships, or behavior change.',['Can address deeper patterns','Can support co-occurring mental-health needs','May be individual, group, family, or specialized care']],
 'medication_supported':['Medication-Supported','Medication can be an evidence-based part of an individualized treatment and recovery plan.',['Requires appropriate medical care','Can work alongside counseling and peer support','Medication is not treated as a lesser form of recovery']],
 'peer_support':['Peer Support','Recovery connection with people who have lived experience.',['Can reduce isolation','Can provide practical recovery encouragement','Can complement clinical treatment']],
 'faith_spiritual':['Faith / Spiritual Support','Optional spiritual or faith-based support when it fits your beliefs.',['Belief preference remains optional','Can coexist with any legitimate recovery pathway','Never replaces medical or safety guidance']]
};
let primary='exploring',supporting=[],resourceType='all',resourceView='finder',resourceRows=[],savedIds=new Set();
let resourceProgram='recovery',resourceProgramName='Recovery',resourceRequest=0,resourceLoading=false,resourceLoadError=false,savedLoadError=false;
const originalResourceUI={
 options:q('#resourcePathFilter')?.innerHTML||'',
 types:qa('[data-resource-type-v2]').map(b=>({button:b,type:b.dataset.resourceTypeV2,label:b.textContent}))
};
const categoryLabels={all:'All',caregiving:'Caregiving',transportation:'Transportation',benefits:'Benefits',housing:'Housing',peer_support:'Peer Support',legal:'Legal Help',employment:'Employment',education:'Education',community:'Community',other:'Other'};
function resourceUser(){return typeof currentUser==='undefined'?null:currentUser}
function resourceKey(r){return `${r.source}:${r.id}`}
function resourceWebsite(value){try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u.href:''}catch(_){return ''}}
async function selectedResourceProgram(){
 const user=resourceUser();
 if(user){
  const state=await sb.from('user_program_state').select('active_program_id').eq('user_id',user.id).maybeSingle();
  if(state.error)throw state.error;
  if(state.data?.active_program_id){
   const program=await sb.from('programs').select('slug').eq('id',state.data.active_program_id).single();
   if(program.error||!program.data?.slug)throw program.error||new Error('Selected program unavailable');
   return program.data.slug;
  }
 }
 return typeof activeBrowseProgram!=='undefined'?activeBrowseProgram:'';
}
function configureResourceUI(){
 const recovery=resourceProgram==='recovery',filter=q('#resourcePathFilter');
 if(filter){filter.innerHTML=recovery?originalResourceUI.options:`<option value="">All ${esc(resourceProgramName)} resources</option>`;filter.disabled=!recovery;filter.setAttribute('aria-label',recovery?'Recovery approach':'Selected support program');}
 q('[data-resource-view="news"]')?.classList.toggle('hidden',!recovery);
 const categories=resourceProgram==='caregiving'?['all','caregiving','transportation','benefits','housing','peer_support','legal','other']:['all','community','housing','employment','transportation','benefits','education','other'];
 originalResourceUI.types.forEach((x,i)=>{x.button.dataset.resourceTypeV2=recovery?x.type:categories[i];x.button.textContent=recovery?x.label:categoryLabels[categories[i]];x.button.classList.toggle('active',x.button.dataset.resourceTypeV2===resourceType)});
}

function dbApproachToKey(v){return v||'exploring'}
function supportSelected(){return qa('[data-path-support].selected').map(x=>x.dataset.pathSupport)}
function primarySelected(){return q('[data-path-primary].selected')?.dataset.pathPrimary||primary}

async function loadPaths(){
  if(!currentUser)return;
  try{
    const [u,p]=await Promise.all([
      sb.from('user_preferences').select('recovery_approach,belief_preference,faith_tradition,denomination').eq('user_id',currentUser.id).single(),
      sb.from('recovery_path_preferences').select('*').eq('user_id',currentUser.id).maybeSingle()
    ]);
    primary=p.data?.primary_path||dbApproachToKey(u.data?.recovery_approach)||'exploring';
    supporting=Array.isArray(p.data?.supporting_paths)?p.data.supporting_paths:[];
    qa('[data-path-primary]').forEach(b=>b.classList.toggle('selected',b.dataset.pathPrimary===primary));
    qa('[data-path-support]').forEach(b=>b.classList.toggle('selected',supporting.includes(b.dataset.pathSupport)));
    const belief=u.data?.belief_preference||'exploring',faith=u.data?.faith_tradition,den=u.data?.denomination;
    set('pathBeliefTitle',belief==='secular'?'Secular preference':belief==='spiritual'?'Spiritual preference':belief==='faith_based'?'Faith-based preference':belief==='mixed'?'Mixed belief preference':'Exploring belief preference');
    set('pathBeliefText',[belief.replace('_',' '),faith,den].filter(Boolean).join(' • ')||'Lellee only includes belief-aligned options when you choose them.');
    renderPathSummary();renderExplorer();
  }catch(e){renderPathSummary();renderExplorer()}
}
function renderPathSummary(){
  const p=primarySelected(),extra=supportSelected();
  set('pathPrimarySummary',PATH_LABELS[p]||'Exploring');
  set('pathSupportSummary',extra.length?`Also using: ${extra.map(x=>PATH_LABELS[x]||x).join(' • ')}`:'Choose any additional pathways that support you.');
}
function renderExplorer(){
  const keys=[primarySelected(),...supportSelected()].filter((x,i,a)=>a.indexOf(x)===i).filter(x=>PATH_INFO[x]);
  const use=keys.length?keys:['12_step','skills_based','therapy_counseling','medication_supported','peer_support','faith_spiritual'];
  const box=q('#pathExplorer');if(!box)return;
  box.innerHTML=use.map(k=>{const x=PATH_INFO[k];return `<article class="path-explorer-card"><small>${esc(PATH_LABELS[k]||k)}</small><h3>${esc(x[0])}</h3><p>${esc(x[1])}</p><ul>${x[2].map(v=>`<li>${esc(v)}</li>`).join('')}</ul></article>`}).join('');
}
async function savePaths(){
  if(!currentUser)return;
  primary=primarySelected();supporting=supportSelected();
  const {error}=await sb.from('recovery_path_preferences').upsert({
    user_id:currentUser.id,primary_path:primary,supporting_paths:supporting
  },{onConflict:'user_id'});
  if(error)return show(error.message,true);
  await sb.from('user_preferences').update({recovery_approach:primary}).eq('user_id',currentUser.id);
  if(typeof data!=='undefined'){data.approach=APPROACH_UI[primary]||'Exploring';if(typeof save==='function')save()}
  renderPathSummary();renderExplorer();show('Recovery paths saved.');
}
function show(msg,error=false){const t=q('#globalToast');if(t){t.textContent=msg;t.classList.remove('hidden');if(error)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}else if(window.showSync)showSync(msg)}

async function loadResources(){
  const request=++resourceRequest,user=resourceUser();
  resourceRows=[];savedIds=new Set();resourceLoading=true;resourceLoadError=false;savedLoadError=false;
  renderResources();
  try{
    const slug=await selectedResourceProgram();
    if(!slug)throw new Error('Choose a support program');
    if(request!==resourceRequest||resourceUser()?.id!==user?.id)return;
    const changed=resourceProgram!==slug;
    resourceProgram=slug;resourceProgramName=typeof programPreviewConfig==='function'&&slug!=='recovery'?programPreviewConfig(slug).label:slug==='recovery'?'Recovery':slug.replaceAll('-',' ');
    if(changed){resourceType='all';resourceView='finder';if(q('#resourceSearch'))q('#resourceSearch').value='';if(q('#resourceAccessFilter'))q('#resourceAccessFilter').value='';}
    configureResourceUI();
    const result=await sb.rpc('get_public_program_resources',{p_program_slug:slug});
    if(result.error)throw result.error;
    if(request!==resourceRequest||resourceUser()?.id!==user?.id)return;
    if(!result.data?.program||!Array.isArray(result.data.resources))throw new Error('Directory response unavailable');
    resourceProgram=result.data.program.slug;resourceProgramName=result.data.program.name;
    resourceRows=result.data.resources;
    configureResourceUI();
    if(user){
      const [local,service]=await Promise.all([
        sb.from('saved_resources').select('resource_id').eq('user_id',user.id),
        sb.from('user_saved_resources').select('resource_id').eq('user_id',user.id)
      ]);
      if(request!==resourceRequest||resourceUser()?.id!==user.id)return;
      savedLoadError=!!(local.error||service.error);
      if(!savedLoadError)savedIds=new Set([...(local.data||[]).map(x=>`local:${x.resource_id}`),...(service.data||[]).map(x=>`service:${x.resource_id}`)]);
    }
    resourceLoading=false;
    set('resourceLocation',user?[typeof data!=='undefined'?data.city:'',typeof data!=='undefined'?data.state:''].filter(Boolean).join(', ')||'Your area':'Your area');
    setResourceView(resourceView);
  }catch(error){
    if(request!==resourceRequest)return;
    // Program context is already known locally, even if the public API is unavailable.
    const slug=typeof activeBrowseProgram!=='undefined'?activeBrowseProgram:'';
    if(!user&&slug){resourceProgram=slug;resourceProgramName=typeof programPreviewConfig==='function'&&slug!=='recovery'?programPreviewConfig(slug).label:slug==='recovery'?'Recovery':slug.replaceAll('-',' ');configureResourceUI();}
    resourceLoading=false;resourceLoadError=true;resourceView='finder';setResourceView('finder');
  }
}
function filters(){
  return {
    search:(q('#resourceSearch')?.value||'').toLowerCase().trim(),
    path:q('#resourcePathFilter')?.value||'',
    access:q('#resourceAccessFilter')?.value||''
  };
}
function matches(r,f){
  if(resourceType!=='all'&&r.resource_type!==resourceType)return false;
  if(f.search&&!`${r.name||''} ${r.description||''} ${r.city||''} ${r.state||''}`.toLowerCase().includes(f.search))return false;
  if(f.path&&!(Array.isArray(r.pathways)&&r.pathways.includes(f.path)))return false;
  if(f.access==='free'&&r.cost_level!=='free')return false;
  if(f.access==='low_cost'&&!['free','low_cost'].includes(r.cost_level))return false;
  if(f.access==='virtual'&&!r.virtual_available)return false;
  return true;
}
function pathTags(r){return resourceProgram==='recovery'?(Array.isArray(r.pathways)?r.pathways:[]).slice(0,3).map(x=>`<span>${esc(PATH_LABELS[x]||x.replaceAll('_',' '))}</span>`).join(''):''}
function card(r,isSponsored=false){
  const meta=[r.city,r.state,r.virtual_available?'Virtual available':null,r.cost_level==='free'?'Free':r.cost_level==='low_cost'?'Low cost':null].filter(Boolean).join(' • ');
  const saved=savedIds.has(resourceKey(r)),website=resourceWebsite(r.website_url),phone=/^[+\d\s().-]+$/.test(r.phone||'')?r.phone:'';
  return `<article class="resource-v2-card ${isSponsored?'sponsored':''}">
    <div class="resource-card-top"><span class="resource-tag">${esc(r.category_label||(r.resource_type||'resource').replaceAll('_',' '))}</span>${isSponsored?`<span class="sponsor-tag">${esc(r.sponsor_label||'Sponsored')}</span>`:''}</div>
    <h3>${esc(r.name)}</h3>
    <p>${esc(r.description||(resourceProgram==='recovery'?'Recovery-supporting resource.':'Support resource.'))}</p>
    <div class="resource-meta">${esc(meta||'Location/details available from provider')}</div>
    <div class="resource-path-tags">${pathTags(r)}</div>
    <div class="resource-card-actions">
      ${website?`<a href="${esc(website)}" target="_blank" rel="noopener">Website</a>`:''}
      ${phone?`<a href="tel:${esc(phone)}">Call</a>`:''}
      <button data-resource-save-v2="${esc(resourceKey(r))}" ${savedLoadError?'disabled':''}>${!resourceUser()?'Sign in to save':savedLoadError?'Saved status unavailable':saved?'Saved ✓':'Save'}</button>
    </div>
  </article>`;
}
function renderResources(){
  const box=q('#resourceFinderList');
  if(resourceLoading||resourceLoadError){
    q('#sponsoredResourceSection')?.classList.add('hidden');if(q('#sponsoredResourceList'))q('#sponsoredResourceList').innerHTML='';
    set('resourceResultCount',resourceLoading?'Loading…':'Unavailable');
    set('resourceResultTitle',resourceLoading?'Loading resources':'Resources temporarily unavailable');
    if(box)box.innerHTML=resourceLoading?'<div class="approved-resource-empty" role="status">Loading published resources…</div>':'<div class="approved-resource-empty" role="status"><b>Resources could not be loaded.</b><small>Please try again.</small><button type="button" id="retryPublicResources">Retry</button></div>';
    q('#retryPublicResources')?.addEventListener('click',loadResources);return;
  }
  if(resourceView==='news')return renderNews();
  if(resourceView==='saved')return renderSaved();
  const f=filters(),rows=resourceRows.filter(r=>matches(r,f));
  const sponsored=rows.filter(r=>r.sponsored===true);
  const organic=rows.filter(r=>r.sponsored!==true);
  q('#sponsoredResourceSection')?.classList.toggle('hidden',!sponsored.length);
  if(q('#sponsoredResourceList'))q('#sponsoredResourceList').innerHTML=sponsored.map(r=>card(r,true)).join('');
  set('resourceResultCount',`${organic.length} ${organic.length===1?'result':'results'}`);
  set('resourceResultTitle',resourceProgram==='recovery'?(typeof data!=='undefined'&&data.city?`Resources around ${data.city}`:'Published resources'):`${resourceProgramName} resources`);
  if(box)box.innerHTML=organic.length?organic.map(r=>card(r,false)).join(''):sponsored.length?'':`<div class="approved-resource-empty" role="status"><b>${resourceRows.length?'No matching resources.':`No published ${esc(resourceProgramName)} resources yet.`}</b><small>${resourceRows.length?'Try removing a filter.':'Please check again as the directory grows.'}</small></div>`;
  bindSaveButtons();
}
async function renderNews(){
  if(resourceProgram!=='recovery')return;
  const box=q('#resourceNewsListV2');if(!box)return;
  const {data:r,error}=await sb.from('recovery_news').select('*').eq('published',true).order('published_at',{ascending:false}).limit(40);
  if(error){box.innerHTML='<div class="approved-resource-empty">Recovery news could not be loaded.</div>';return}
  box.innerHTML=(r||[]).length?(r||[]).map(x=>`<article class="resource-news-row"><small>${esc([x.source_name,x.published_at?new Date(x.published_at).toLocaleDateString():null].filter(Boolean).join(' • '))}</small><h3>${esc(x.title)}</h3><p>${esc(x.summary||'')}</p>${x.source_url?`<a class="approved-link" href="${esc(x.source_url)}" target="_blank" rel="noopener">Read source →</a>`:''}</article>`).join(''):'<div class="approved-resource-empty"><b>No curated news published yet.</b></div>';
}
function renderSaved(){
  const box=q('#resourceSavedListV2');if(!box)return;
  if(!resourceUser()){box.innerHTML='<div class="approved-resource-empty"><b>Sign in to view your saved resources.</b></div>';return;}
  if(savedLoadError){box.innerHTML='<div class="approved-resource-empty" role="status">Saved resources could not be loaded. Please try again.</div>';return;}
  const rows=resourceRows.filter(r=>savedIds.has(resourceKey(r)));
  box.innerHTML=rows.length?rows.map(r=>card(r,r.sponsored===true)).join(''):'<div class="approved-resource-empty"><b>No saved resources yet.</b><small>Save resources you may want to return to.</small></div>';
  bindSaveButtons();
}
function bindSaveButtons(){qa('[data-resource-save-v2]').forEach(b=>b.onclick=()=>toggleSave(b.dataset.resourceSaveV2))}
async function toggleSave(key){
  const user=resourceUser();
  if(!user){if(typeof showAuthOverlay==='function')showAuthOverlay('signin');return;}
  if(savedLoadError)return;
  const row=resourceRows.find(r=>resourceKey(r)===key);if(!row)return;
  const table=row.source==='local'?'saved_resources':row.source==='service'?'user_saved_resources':null;if(!table)return;
  let result;
  if(savedIds.has(key))result=await sb.from(table).delete().eq('user_id',user.id).eq('resource_id',row.id);
  else result=await sb.from(table).insert({user_id:user.id,resource_id:row.id});
  if(resourceUser()?.id!==user.id)return;
  if(result.error)return show('Resource could not be saved. Please try again.',true);
  if(savedIds.has(key))savedIds.delete(key);else savedIds.add(key);
  renderResources();
}
function setResourceView(v){
  if(resourceProgram!=='recovery'&&v==='news')v='finder';
  resourceView=v;
  qa('[data-resource-view]').forEach(b=>b.classList.toggle('active',b.dataset.resourceView===v));
  q('#resourceFinderPanel')?.classList.toggle('hidden',v!=='finder');
  q('#resourceNewsPanelV2')?.classList.toggle('hidden',v!=='news');
  q('#resourceSavedPanelV2')?.classList.toggle('hidden',v!=='saved');
  if(resourceLoading||resourceLoadError)renderResources();else if(v==='news')renderNews();else if(v==='saved')renderSaved();else renderResources();
}
function bind(){
  qa('[data-path-primary]').forEach(b=>b.addEventListener('click',()=>{qa('[data-path-primary]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');renderPathSummary();renderExplorer()}));
  qa('[data-path-support]').forEach(b=>b.addEventListener('click',()=>{b.classList.toggle('selected');renderPathSummary();renderExplorer()}));
  q('#saveRecoveryPaths')?.addEventListener('click',savePaths);
  qa('[data-resource-view]').forEach(b=>b.addEventListener('click',()=>setResourceView(b.dataset.resourceView)));
  qa('[data-resource-type-v2]').forEach(b=>b.addEventListener('click',()=>{resourceType=b.dataset.resourceTypeV2;qa('[data-resource-type-v2]').forEach(x=>x.classList.toggle('active',x===b));renderResources()}));
  q('#resourceSearch')?.addEventListener('input',renderResources);
  q('#resourcePathFilter')?.addEventListener('change',renderResources);
  q('#resourceAccessFilter')?.addEventListener('change',renderResources);
}
bind();
const oldShow=showPage;
showPage=function(name){oldShow(name);if(name==='paths')loadPaths();if(name==='resources')loadResources()};
let tries=0;const timer=setInterval(()=>{tries++;if(currentUser){clearInterval(timer);Promise.allSettled([loadPaths(),loadResources()])}else if(tries>30)clearInterval(timer)},200);
if(q('#page-resources')?.classList.contains('active'))loadResources();
})();
