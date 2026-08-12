
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2300)}};
let programId=null,resources=[],savedIds=new Set(),planTab='saved',isAdmin=false;

async function getProgram(){
 if(!currentUser)return;
 const {data}=await sb.from('user_program_state').select('active_program_id').eq('user_id',currentUser.id).maybeSingle();
 programId=data?.active_program_id||null;
}
async function loadCategories(){
 const {data}=await sb.from('resource_categories').select('category_key,label').eq('active',true).order('display_order');
 const s=q('#resourceNavCategory');if(s)s.innerHTML='<option value="">All categories</option>'+(data||[]).map(x=>`<option value="${x.category_key}">${esc(x.label)}</option>`).join('');
}
async function loadResources(){
 if(!currentUser)return;
 if(!programId)await getProgram();
 const [{data:r,error},{data:s},{data:refs}]=await Promise.all([
   sb.from('service_resources').select('*,resource_categories(label),programs(name)').eq('published',true).order('sponsored',{ascending:false}).order('name'),
   sb.from('user_saved_resources').select('resource_id').eq('user_id',currentUser.id),
   sb.from('resource_referrals').select('id').eq('user_id',currentUser.id).in('status',['requested','sent','accepted'])
 ]);
 if(error)return toast(error.message,true);
 resources=(r||[]).filter(x=>!programId||!x.program_id||x.program_id===programId);
 savedIds=new Set((s||[]).map(x=>x.resource_id));
 q('#resourceSavedCount')&&(q('#resourceSavedCount').textContent=savedIds.size);
 q('#resourceReferralCount')&&(q('#resourceReferralCount').textContent=(refs||[]).length);
 renderResources();
}
function renderResources(){
 const search=(q('#resourceNavSearch')?.value||'').toLowerCase().trim(),cat=q('#resourceNavCategory')?.value||'',city=(q('#resourceNavCity')?.value||'').toLowerCase().trim(),cost=q('#resourceNavCost')?.value||'',virt=q('#resourceNavVirtual')?.value||'';
 const rows=resources.filter(x=>{
   if(search&&!`${x.name||''} ${x.description||''} ${x.resource_categories?.label||''}`.toLowerCase().includes(search))return false;
   if(cat&&x.category_key!==cat)return false;
   if(city&&!`${x.city||''} ${x.service_area||''}`.toLowerCase().includes(city))return false;
   if(cost&&x.cost_level!==cost)return false;
   if(virt&&String(!!x.virtual_available)!==virt)return false;
   return true;
 });
 q('#resourceNavCount')&&(q('#resourceNavCount').textContent=rows.length);
 const box=q('#resourceNavList');if(!box)return;
 box.innerHTML=rows.length?rows.map(x=>`<article class="resource-nav-row"><div class="resource-nav-icon">⌂</div><div><h3>${esc(x.name)}</h3><small>${esc(x.resource_categories?.label||'Resource')} · ${esc([x.city,x.state].filter(Boolean).join(', '))}</small><p>${esc(String(x.description||'').slice(0,220))}</p><div class="resource-nav-tags">${x.cost_level?`<span>${esc(x.cost_level.replaceAll('_',' '))}</span>`:''}${x.virtual_available?'<span>virtual</span>':''}${x.sponsored?'<span>SPONSORED</span>':''}${x.verified_at?`<span>verified ${String(x.verified_at).slice(0,10)}</span>`:''}</div></div><div class="resource-nav-actions"><button data-save-resource="${x.id}">${savedIds.has(x.id)?'Saved':'Save'}</button><button data-referral-resource="${x.id}">Request Referral</button>${x.website_url?`<button data-open-resource="${esc(x.website_url)}">Website</button>`:''}</div></article>`).join(''):'<div class="approved-resource-empty">No matching resources yet.</div>';
 qa('[data-save-resource]').forEach(b=>b.onclick=()=>toggleSave(b.dataset.saveResource));
 qa('[data-referral-resource]').forEach(b=>b.onclick=()=>requestReferral(b.dataset.referralResource));
 qa('[data-open-resource]').forEach(b=>b.onclick=()=>window.open(b.dataset.openResource,'_blank','noopener'));
}
async function toggleSave(id){
 if(savedIds.has(id)){await sb.from('user_saved_resources').delete().eq('user_id',currentUser.id).eq('resource_id',id);savedIds.delete(id)}
 else{await sb.from('user_saved_resources').insert({user_id:currentUser.id,program_id:programId,resource_id:id});savedIds.add(id)}
 renderResources();q('#resourceSavedCount')&&(q('#resourceSavedCount').textContent=savedIds.size);
}
async function requestReferral(id){
 const note=prompt('Optional: what would you like help with?','')||null;
 const {error}=await sb.from('resource_referrals').insert({user_id:currentUser.id,program_id:programId,resource_id:id,request_note:note,status:'requested',consent_to_send_contact:false});
 if(error)return toast(error.message,true);
 toast('Referral request saved. You control whether contact information is shared.');loadResources();
}
async function loadPlan(){
 if(!currentUser)return;
 const [s,r,g]=await Promise.all([
  sb.from('user_saved_resources').select('id,created_at,service_resources(name,description,website_url,city,state)').eq('user_id',currentUser.id).order('created_at',{ascending:false}),
  sb.from('resource_referrals').select('id,status,request_note,created_at,service_resources(name,city,state)').eq('user_id',currentUser.id).order('created_at',{ascending:false}),
  sb.from('resource_suggestions').select('id,status,suggestion_note,created_at,service_resources(name,city,state),suggested_by_label').eq('user_id',currentUser.id).order('created_at',{ascending:false})
 ]);
 const saved=s.data||[],refs=r.data||[],sugs=g.data||[];
 q('#resourceSavedList').innerHTML=saved.length?saved.map(x=>`<div class="resource-nav-row"><div class="resource-nav-icon">★</div><div><h3>${esc(x.service_resources?.name||'Resource')}</h3><small>${esc([x.service_resources?.city,x.service_resources?.state].filter(Boolean).join(', '))}</small><p>${esc(x.service_resources?.description||'')}</p></div><div class="resource-nav-actions"><button>Open</button></div></div>`).join(''):'<div class="approved-resource-empty">No saved resources.</div>';
 q('#resourceReferralList').innerHTML=refs.length?refs.map(x=>`<div class="resource-nav-row"><div class="resource-nav-icon">→</div><div><h3>${esc(x.service_resources?.name||'Referral')}</h3><small>${esc(x.status)} · ${new Date(x.created_at).toLocaleDateString()}</small><p>${esc(x.request_note||'')}</p></div><div class="resource-nav-actions"><button data-referral-open="${x.id}">Open</button></div></div>`).join(''):'<div class="approved-resource-empty">No referral requests.</div>';
 q('#resourceSuggestionList').innerHTML=sugs.length?sugs.map(x=>`<div class="resource-nav-row"><div class="resource-nav-icon">✦</div><div><h3>${esc(x.service_resources?.name||'Suggested resource')}</h3><small>Suggested by ${esc(x.suggested_by_label||'Lellee')} · ${esc(x.status)}</small><p>${esc(x.suggestion_note||'')}</p></div><div class="resource-nav-actions">${x.status==='suggested'?`<button data-accept-suggestion="${x.id}">Accept</button><button data-decline-suggestion="${x.id}">Decline</button>`:''}</div></div>`).join(''):'<div class="approved-resource-empty">No suggestions.</div>';
 qa('[data-accept-suggestion]').forEach(b=>b.onclick=()=>respondSuggestion(b.dataset.acceptSuggestion,'accepted'));
 qa('[data-decline-suggestion]').forEach(b=>b.onclick=()=>respondSuggestion(b.dataset.declineSuggestion,'declined'));
}
async function respondSuggestion(id,status){
 const {error}=await sb.from('resource_suggestions').update({status,responded_at:new Date().toISOString()}).eq('id',id).eq('user_id',currentUser.id);
 if(error)return toast(error.message,true);loadPlan();
}
function setPlanTab(tab){
 planTab=tab;qa('[data-resource-plan-tab]').forEach(b=>b.classList.toggle('active',b.dataset.resourcePlanTab===tab));
 q('#resourcePlanSaved').classList.toggle('hidden',tab!=='saved');q('#resourcePlanReferrals').classList.toggle('hidden',tab!=='referrals');q('#resourcePlanSuggestions').classList.toggle('hidden',tab!=='suggestions');
}
async function checkAdmin(){const {data}=await sb.from('admin_user_roles').select('role,active').eq('user_id',currentUser.id).maybeSingle();isAdmin=!!data?.active&&['admin','editor'].includes(data.role);return isAdmin}
async function loadAdmin(){
 if(!await checkAdmin())return;
 const {data,error}=await sb.from('service_resources').select('id,name,category_key,city,state,published,sponsored,verified_at,programs(name),resource_categories(label)').order('name');
 if(error)return toast(error.message,true);
 const rows=data||[],cut=new Date(Date.now()-180*86400000);
 q('#resourceAdminPublished').textContent=rows.filter(x=>x.published).length;
 q('#resourceAdminNeedsReview').textContent=rows.filter(x=>!x.verified_at||new Date(x.verified_at)<cut).length;
 q('#resourceAdminSponsored').textContent=rows.filter(x=>x.sponsored).length;
 q('#resourceAdminPrograms').textContent=new Set(rows.map(x=>x.programs?.name).filter(Boolean)).size;
 q('#resourceAdminList').innerHTML=rows.length?rows.map(x=>`<div class="resource-nav-row"><div class="resource-nav-icon">◇</div><div><h3>${esc(x.name)}</h3><small>${esc(x.resource_categories?.label||'Resource')} · ${esc(x.programs?.name||'Shared')} · ${esc([x.city,x.state].filter(Boolean).join(', '))}</small><div class="resource-nav-tags">${x.published?'<span>published</span>':'<span>draft</span>'}${x.sponsored?'<span>SPONSORED</span>':''}${x.verified_at?`<span>verified ${String(x.verified_at).slice(0,10)}</span>`:'<span>needs verification</span>'}</div></div><div class="resource-nav-actions"><button data-verify-resource="${x.id}">Verify Today</button></div></div>`).join(''):'<div class="approved-resource-empty">No resources yet.</div>';
 qa('[data-verify-resource]').forEach(b=>b.onclick=()=>verifyResource(b.dataset.verifyResource));
}
async function verifyResource(id){const {error}=await sb.from('service_resources').update({verified_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id);if(error)return toast(error.message,true);loadAdmin()}
async function addResource(){
 const name=prompt('Resource name:');if(!name)return;
 const category=prompt('Category key (housing, employment, benefits, peer_support, treatment, caregiving, legal, transportation, education, other):','other')||'other';
 const city=prompt('City (optional):','')||null;
 const {error}=await sb.from('service_resources').insert({name,category_key:category,city,published:false,sponsored:false});
 if(error)return toast(error.message,true);loadAdmin();
}

q('#resourceNavSearch')?.addEventListener('input',renderResources);
q('#resourceNavCategory')?.addEventListener('change',renderResources);
q('#resourceNavCity')?.addEventListener('input',renderResources);
q('#resourceNavCost')?.addEventListener('change',renderResources);
q('#resourceNavVirtual')?.addEventListener('change',renderResources);
qa('[data-resource-plan-tab]').forEach(b=>b.onclick=()=>setPlanTab(b.dataset.resourcePlanTab));
q('#resourceAdminRefresh')?.addEventListener('click',loadAdmin);
q('#resourceAdminAdd')?.addEventListener('click',addResource);

if(typeof showPage==='function'){
 const old=showPage;showPage=function(name){old(name);if(name==='resource-navigator'){Promise.all([getProgram(),loadCategories()]).then(loadResources)}if(name==='my-resources')loadPlan();if(name==='resource-admin')loadAdmin()};
}
})();
