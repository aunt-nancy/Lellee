
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,e=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(e)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}else if(window.showSync)showSync(m)};
let isAdmin=false,resources=[],news=[],sponsors=[],editingResource=null,editingNews=null,editingSponsor=null;

async function checkAdmin(){
  if(!currentUser)return false;
  try{
    const {data:r,error}=await sb.rpc('is_lellee_admin');
    isAdmin=!error&&r===true;
  }catch(e){isAdmin=false}
  window.LelleeAdminContext={isAdmin};
  q('#adminNavItem')?.classList.toggle('hidden',!isAdmin);
  q('#adminUnauthorized')?.classList.toggle('hidden',isAdmin);
  q('#adminContent')?.classList.toggle('hidden',!isAdmin);
  if(isAdmin)setText('adminRoleBadge','ADMIN');
  return isAdmin;
}
function setText(id,v){const e=q('#'+id);if(e)e.textContent=v??''}
function open(id){q('#'+id)?.classList.remove('hidden')}
function close(id){q('#'+id)?.classList.add('hidden')}

async function loadAdmin(){
  if(!await checkAdmin())return;
  const [r,n,s,p]=await Promise.all([
    sb.from('local_resources').select('*').order('name'),
    sb.from('recovery_news').select('*').order('published_at',{ascending:false}),
    sb.from('sponsor_accounts').select('*').order('created_at',{ascending:false}),
    sb.from('user_memberships').select('user_id').eq('tier','plus').in('status',['active','trialing'])
  ]);
  resources=r.data||[];news=n.data||[];sponsors=s.data||[];
  setText('adminResourceCount',resources.filter(x=>x.published).length);
  setText('adminSponsoredCount',resources.filter(x=>x.sponsored).length);
  setText('adminNewsCount',news.filter(x=>x.published).length);
  setText('adminPlusCount',(p.data||[]).length);
  renderResources();renderNews();renderSponsors();loadSettings();
}
function renderResources(){
  const search=(q('#adminResourceSearch')?.value||'').toLowerCase(),type=q('#adminResourceType')?.value||'',status=q('#adminResourceStatus')?.value||'';
  const rows=resources.filter(x=>{
    if(search&&!`${x.name||''} ${x.city||''} ${x.state||''}`.toLowerCase().includes(search))return false;
    if(type&&x.resource_type!==type)return false;
    if(status==='published'&&!x.published)return false;
    if(status==='draft'&&x.published)return false;
    if(status==='sponsored'&&!x.sponsored)return false;
    return true;
  });
  q('#adminResourceList').innerHTML=rows.length?rows.map(x=>`<div class="admin-list-row"><div class="admin-list-icon">⌂</div><div><b>${esc(x.name)}</b><small>${esc((x.resource_type||'resource').replaceAll('_',' '))} • ${esc([x.city,x.state].filter(Boolean).join(', '))}${x.sponsored?' • SPONSORED':''}${x.published?' • Published':' • Draft'}</small></div><div class="admin-list-actions"><button data-edit-resource="${x.id}">Edit</button></div></div>`).join(''):'<div class="approved-resource-empty">No matching resources.</div>';
  qa('[data-edit-resource]').forEach(b=>b.onclick=()=>editResource(b.dataset.editResource));
}
function editResource(id){
  const x=resources.find(r=>r.id===id);editingResource=x||null;
  q('#adminResourceEditorTitle').textContent=x?'Edit Resource':'Add Resource';
  const map={arName:x?.name||'',arType:x?.resource_type||'meeting',arCity:x?.city||'',arState:x?.state||'',arPhone:x?.phone||'',arWebsite:x?.website_url||'',arCost:x?.cost_level||'',arVirtual:String(!!x?.virtual_available),arDescription:x?.description||'',arPublished:String(x?.published??true),arSponsored:String(!!x?.sponsored),arSponsorLabel:x?.sponsor_label||'',arVerified:x?.verified_at?String(x.verified_at).slice(0,10):'',arPathways:(x?.pathways||[]).join(', ')};
  Object.entries(map).forEach(([id,v])=>{if(q('#'+id))q('#'+id).value=v});
  q('#adminDeleteResource').classList.toggle('hidden',!x);open('adminResourceEditor');
}
async function saveResource(){
  const payload={name:q('#arName').value.trim(),resource_type:q('#arType').value,city:q('#arCity').value.trim()||null,state:q('#arState').value.trim().toUpperCase()||null,phone:q('#arPhone').value.trim()||null,website_url:q('#arWebsite').value.trim()||null,cost_level:q('#arCost').value||null,virtual_available:q('#arVirtual').value==='true',description:q('#arDescription').value.trim()||null,published:q('#arPublished').value==='true',sponsored:q('#arSponsored').value==='true',sponsor_label:q('#arSponsorLabel').value.trim()||null,verified_at:q('#arVerified').value?new Date(q('#arVerified').value+'T12:00:00').toISOString():null,pathways:q('#arPathways').value.split(',').map(x=>x.trim()).filter(Boolean)};
  if(!payload.name)return toast('Resource name is required.',true);
  const res=editingResource?await sb.from('local_resources').update(payload).eq('id',editingResource.id):await sb.from('local_resources').insert(payload);
  if(res.error)return toast(res.error.message,true);close('adminResourceEditor');await loadAdmin();toast('Resource saved.');
}
async function deleteResource(){if(!editingResource||!confirm('Delete this resource?'))return;const {error}=await sb.from('local_resources').delete().eq('id',editingResource.id);if(error)return toast(error.message,true);close('adminResourceEditor');loadAdmin()}

function renderNews(){
  q('#adminNewsList').innerHTML=news.length?news.map(x=>`<div class="admin-list-row"><div class="admin-list-icon">◇</div><div><b>${esc(x.title)}</b><small>${esc(x.source_name||'No source')} • ${x.published?'Published':'Draft'}</small></div><div class="admin-list-actions"><button data-edit-news="${x.id}">Edit</button></div></div>`).join(''):'<div class="approved-resource-empty">No news items yet.</div>';
  qa('[data-edit-news]').forEach(b=>b.onclick=()=>editNews(b.dataset.editNews));
}
function editNews(id){
  const x=news.find(r=>r.id===id);editingNews=x||null;q('#adminNewsEditorTitle').textContent=x?'Edit News Item':'Add News Item';
  q('#anTitle').value=x?.title||'';q('#anSource').value=x?.source_name||'';q('#anUrl').value=x?.source_url||'';q('#anDate').value=x?.published_at?String(x.published_at).slice(0,10):'';q('#anPublished').value=String(!!x?.published);q('#anSummary').value=x?.summary||'';q('#adminDeleteNews').classList.toggle('hidden',!x);open('adminNewsEditor');
}
async function saveNews(){
  const payload={title:q('#anTitle').value.trim(),source_name:q('#anSource').value.trim()||null,source_url:q('#anUrl').value.trim()||null,published_at:q('#anDate').value?new Date(q('#anDate').value+'T12:00:00').toISOString():null,published:q('#anPublished').value==='true',summary:q('#anSummary').value.trim()||null,reviewed_at:new Date().toISOString()};
  if(!payload.title)return toast('Title is required.',true);const res=editingNews?await sb.from('recovery_news').update(payload).eq('id',editingNews.id):await sb.from('recovery_news').insert(payload);if(res.error)return toast(res.error.message,true);close('adminNewsEditor');loadAdmin();toast('News item saved.');
}
async function deleteNews(){if(!editingNews||!confirm('Delete this news item?'))return;const {error}=await sb.from('recovery_news').delete().eq('id',editingNews.id);if(error)return toast(error.message,true);close('adminNewsEditor');loadAdmin()}

function renderSponsors(){
  q('#adminSponsorList').innerHTML=sponsors.length?sponsors.map(x=>`<div class="admin-list-row"><div class="admin-list-icon">$</div><div><b>${esc(x.organization_name)}</b><small>${esc(x.status)}${x.monthly_amount!=null?` • $${Number(x.monthly_amount).toFixed(2)}/mo`:''}${x.end_date?` • through ${x.end_date}`:''}</small></div><div class="admin-list-actions"><button data-edit-sponsor="${x.id}">Edit</button></div></div>`).join(''):'<div class="approved-resource-empty">No sponsors yet.</div>';
  qa('[data-edit-sponsor]').forEach(b=>b.onclick=()=>editSponsor(b.dataset.editSponsor));
}
function editSponsor(id){
  const x=sponsors.find(r=>r.id===id);editingSponsor=x||null;q('#adminSponsorEditorTitle').textContent=x?'Edit Sponsor':'Add Sponsor';
  q('#asName').value=x?.organization_name||'';q('#asEmail').value=x?.contact_email||'';q('#asStart').value=x?.start_date||'';q('#asEnd').value=x?.end_date||'';q('#asStatus').value=x?.status||'prospect';q('#asAmount').value=x?.monthly_amount??'';q('#asNotes').value=x?.notes||'';q('#adminDeleteSponsor').classList.toggle('hidden',!x);open('adminSponsorEditor');
}
async function saveSponsor(){
  const payload={organization_name:q('#asName').value.trim(),contact_email:q('#asEmail').value.trim()||null,start_date:q('#asStart').value||null,end_date:q('#asEnd').value||null,status:q('#asStatus').value,monthly_amount:q('#asAmount').value?Number(q('#asAmount').value):null,notes:q('#asNotes').value.trim()||null};
  if(!payload.organization_name)return toast('Organization name is required.',true);const res=editingSponsor?await sb.from('sponsor_accounts').update(payload).eq('id',editingSponsor.id):await sb.from('sponsor_accounts').insert(payload);if(res.error)return toast(res.error.message,true);close('adminSponsorEditor');loadAdmin();toast('Sponsor saved.');
}
async function deleteSponsor(){if(!editingSponsor||!confirm('Delete this sponsor record?'))return;const {error}=await sb.from('sponsor_accounts').delete().eq('id',editingSponsor.id);if(error)return toast(error.message,true);close('adminSponsorEditor');loadAdmin()}

async function loadSettings(){
  const {data:r}=await sb.from('app_public_settings').select('key,value').in('key',['plus_monthly_price','plus_annual_price','sponsorship_enabled','recovery_news_enabled']);
  const m=Object.fromEntries((r||[]).map(x=>[x.key,x.value]));
  q('#adminPlusMonthly').value=m.plus_monthly_price||'5.99';q('#adminPlusAnnual').value=m.plus_annual_price||'59.99';q('#adminSponsorshipEnabled').value=m.sponsorship_enabled||'true';q('#adminNewsEnabled').value=m.recovery_news_enabled||'true';
}
async function saveSettings(){
  const rows=[['plus_monthly_price',q('#adminPlusMonthly').value],['plus_annual_price',q('#adminPlusAnnual').value],['sponsorship_enabled',q('#adminSponsorshipEnabled').value],['recovery_news_enabled',q('#adminNewsEnabled').value]].map(([key,value])=>({key,value,updated_at:new Date().toISOString()}));
  const {error}=await sb.from('app_public_settings').upsert(rows,{onConflict:'key'});if(error)return toast(error.message,true);toast('App settings saved.');
}
function setTab(tab){
  qa('[data-admin-tab]').forEach(b=>b.classList.toggle('active',b.dataset.adminTab===tab));
  q('#adminResourcesPanel').classList.toggle('hidden',tab!=='resources');q('#adminNewsPanel').classList.toggle('hidden',tab!=='news');q('#adminSponsorsPanel').classList.toggle('hidden',tab!=='sponsors');q('#adminSettingsPanel').classList.toggle('hidden',tab!=='settings');
}
function bind(){
  qa('[data-admin-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.adminTab));
  q('#adminResourceSearch')?.addEventListener('input',renderResources);q('#adminResourceType')?.addEventListener('change',renderResources);q('#adminResourceStatus')?.addEventListener('change',renderResources);
  q('#adminNewResource')?.addEventListener('click',()=>editResource(null));q('#adminSaveResource')?.addEventListener('click',saveResource);q('#adminDeleteResource')?.addEventListener('click',deleteResource);
  q('#adminNewNews')?.addEventListener('click',()=>editNews(null));q('#adminSaveNews')?.addEventListener('click',saveNews);q('#adminDeleteNews')?.addEventListener('click',deleteNews);
  q('#adminNewSponsor')?.addEventListener('click',()=>editSponsor(null));q('#adminSaveSponsor')?.addEventListener('click',saveSponsor);q('#adminDeleteSponsor')?.addEventListener('click',deleteSponsor);
  q('#adminSaveSettings')?.addEventListener('click',saveSettings);
  qa('[data-close-admin-editor]').forEach(b=>b.onclick=()=>close(b.dataset.closeAdminEditor));
}
bind();
const oldShow=showPage;showPage=function(name){oldShow(name);if(name==='admin')loadAdmin()};
let tries=0;const timer=setInterval(()=>{tries++;if(currentUser){clearInterval(timer);checkAdmin()}else if(tries>30)clearInterval(timer)},200);
})();
