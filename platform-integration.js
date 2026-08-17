
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=(m,bad=false)=>{const t=q('#globalToast');if(t){t.textContent=m;t.classList.remove('hidden');if(bad)t.style.background='#7f2634';setTimeout(()=>{t.classList.add('hidden');t.style.background=''},2200)}};

let workspaces=[],activeWorkspace='personal',searchFilter='all',isAdmin=false;

async function rpc(name,args={}){
 const {data,error}=await sb.rpc(name,args);
 if(error){console.warn(name,error);return null}
 return data;
}
async function loadWorkspaces(){
 if(!currentUser)return;
 const data=await rpc('get_my_lellee_workspaces');
 if(!data)return;
 workspaces=data.workspaces||[];
 activeWorkspace=data.active_workspace||'personal';
 renderWorkspaceHome(data);
}
function wsIcon(k){return ({personal:'♡',coach:'◎',organization:'▣',admin:'◇'})[k]||'•'}
function wsTitle(k){return ({personal:'Personal',coach:'Coach Business',organization:'Organization',admin:'Admin'})[k]||k}
function wsDesc(k){return ({personal:'Your private programs, Inbox, tools, resources and progress.',coach:'Clients, groups, services, messages, leads and business analytics.',organization:'Licenses, sponsored access, cohorts and aggregate reporting.',admin:'Programs, content, safety, analytics and platform operations.'})[k]||''}
function wsHome(k){return ({personal:'today',coach:'coach-dashboard',organization:'organization-dashboard',admin:'admin'})[k]||'today'}
function renderWorkspaceHome(data){
 const current=workspaces.find(x=>x.key===activeWorkspace)||{key:'personal'};
 q('#workspaceCurrentName')&&(q('#workspaceCurrentName').textContent=wsTitle(current.key));
 q('#workspaceCurrentDescription')&&(q('#workspaceCurrentDescription').textContent=wsDesc(current.key));
 q('#workspaceCurrentPill')&&(q('#workspaceCurrentPill').textContent=current.key.toUpperCase());

 const box=q('#workspaceCardGrid');
 if(box)box.innerHTML=['personal','coach','organization','admin'].map(k=>{
   const w=workspaces.find(x=>x.key===k),available=!!w?.available;
   return `<article class="workspace-card ${available?'available':'unavailable'}" ${available?`data-workspace="${k}"`:''}><div class="workspace-card-icon">${wsIcon(k)}</div><b>${wsTitle(k)}</b><small>${wsDesc(k)}</small><em>${available?(k===activeWorkspace?'CURRENT':'AVAILABLE'):'NOT CONNECTED'}</em></article>`;
 }).join('');
 qa('[data-workspace]').forEach(x=>x.onclick=()=>openWorkspace(x.dataset.workspace));

 const recents=data.recent||[];
 q('#workspaceRecentList')&&(q('#workspaceRecentList').innerHTML=recents.length?recents.map(x=>`<div class="workspace-recent-row"><span>${wsIcon(x.workspace_key)}</span><div><b>${esc(x.label)}</b><small>${esc(wsTitle(x.workspace_key))} · ${niceTime(x.last_opened_at)}</small></div><button data-recent-page="${esc(x.page_key)}" data-recent-workspace="${esc(x.workspace_key)}">Open</button></div>`).join(''):'<div class="approved-resource-empty">Your recent Lellee areas will appear here.</div>');
 qa('[data-recent-page]').forEach(b=>b.onclick=async()=>{await setWorkspace(b.dataset.recentWorkspace);showPage(b.dataset.recentPage)});

 const quick=quickFor(activeWorkspace);
 q('#workspaceQuickGrid')&&(q('#workspaceQuickGrid').innerHTML=quick.map(x=>`<button data-quick-page="${x.page}"><b>${esc(x.label)}</b><small>${esc(x.help)}</small></button>`).join(''));
 qa('[data-quick-page]').forEach(b=>b.onclick=()=>showPage(b.dataset.quickPage));
}
function quickFor(k){
 if(k==='coach')return [
  {page:'coach-dashboard',label:'Coach Dashboard',help:'Clients, messages and operations'},
  {page:'coach-cohorts',label:'Group Programs',help:'Affordable cohort coaching'},
  {page:'coach-analytics',label:'Coach Analytics',help:'Leads, capacity and utilization'},
  {page:'coach-business',label:'Business Settings',help:'Services and business profile'}
 ];
 if(k==='organization')return [
  {page:'organization-dashboard',label:'Organization Dashboard',help:'Seats, cohorts and licenses'},
  {page:'organization-analytics',label:'Organization Analytics',help:'Aggregate utilization'},
  {page:'sponsored-access',label:'Sponsored Access',help:'Review program sponsorship'}
 ];
 if(k==='admin')return [
  {page:'admin',label:'Admin',help:'Operations home'},
  {page:'analytics',label:'Analytics & Insights',help:'Platform performance'},
  {page:'program-builder',label:'Program Builder',help:'Build Lellee verticals'},
  {page:'content-studio',label:'Content Studio',help:'Create and publish journeys'},
  {page:'safety-profile-builder',label:'Safety Profiles',help:'Program safety controls'},
  {page:'platform-health',label:'Platform Health',help:'Integration checks'}
 ];
 return [
  {page:'today',label:'Today',help:'Your current program'},
  {page:'program-switcher',label:'My Programs',help:'Recovery and pilot access'},
  {page:'inbox',label:'Inbox',help:'Messages and reminders'},
  {page:'life-admin',label:'My Plan',help:'Tasks and practical life tools'},
  {page:'resource-navigator',label:'Resources',help:'Find practical support'},
  {page:'progress-hub',label:'My Progress',help:'Goals and outcomes'}
 ];
}
async function setWorkspace(k){
 const data=await rpc('set_my_lellee_workspace',{p_workspace_key:k});
 if(data?.success){activeWorkspace=k;return true}
 toast(data?.message||'That workspace is not available.',true);return false;
}
async function openWorkspace(k){
 if(await setWorkspace(k)){showPage(wsHome(k));loadWorkspaces()}
}
function niceTime(v){
 if(!v)return '';
 const d=new Date(v),diff=Math.floor((Date.now()-d.getTime())/60000);
 if(diff<1)return 'now';if(diff<60)return `${diff}m ago`;if(diff<1440)return `${Math.floor(diff/60)}h ago`;
 return d.toLocaleDateString();
}

async function loadAccess(){
 const data=await rpc('get_my_lellee_workspaces');if(!data)return;
 q('#workspaceAccessList').innerHTML=(data.workspaces||[]).map(w=>`<article class="workspace-access-row"><b>${wsTitle(w.key)} — ${w.available?'Available':'Not connected'}</b><small>${esc(w.detail||wsDesc(w.key))}</small></article>`).join('');
}

async function doSearch(){
 const term=q('#globalSearchInput')?.value.trim();
 if(!term||term.length<2)return toast('Enter at least 2 characters.',true);
 const data=await rpc('search_lellee',{p_query:term,p_filter:searchFilter});
 renderSearch(data||[]);
}
function renderSearch(rows){
 const box=q('#globalSearchResults');if(!box)return;
 box.innerHTML=rows.length?rows.map(x=>`<article class="global-search-row"><div class="global-search-icon">${searchIcon(x.result_type)}</div><div><b>${esc(x.title)}</b><small>${esc(x.result_type.replaceAll('_',' '))}${x.subtitle?' · '+esc(x.subtitle):''}</small><p>${esc(x.snippet||'')}</p></div><button data-search-page="${esc(x.page_key||'workspace-home')}" ${x.action_payload?`data-search-payload='${esc(JSON.stringify(x.action_payload))}'`:''}>Open</button></article>`).join(''):'<div class="approved-resource-empty">No matching Lellee items.</div>';
 qa('[data-search-page]').forEach(b=>b.onclick=()=>showPage(b.dataset.searchPage));
}
function searchIcon(t){return ({program:'P',content:'▤',resource:'⌂',goal:'✓',task:'○'})[t]||'⌕'}

async function checkAdmin(){
 const {data}=await sb.from('admin_user_roles').select('role,active').eq('user_id',currentUser.id).maybeSingle();
 isAdmin=!!data?.active&&['admin','editor'].includes(data.role);return isAdmin;
}
async function loadHealth(){
 if(!await checkAdmin())return;
 const data=await rpc('get_lellee_platform_health');if(!data)return toast('Health check unavailable.',true);
 const modules=data.modules||[];
 const installed=modules.filter(x=>x.status==='ok').length,attention=modules.filter(x=>x.status==='attention').length,critical=modules.filter(x=>x.status==='critical').length;
 q('#healthInstalled').textContent=installed;q('#healthAttention').textContent=attention;q('#healthCritical').textContent=critical;q('#healthOverall').textContent=critical?'CHECK':attention?'ATTENTION':'PASS';
 q('#platformHealthList').innerHTML=modules.map(x=>`<div class="platform-health-row ${x.status}"><div class="platform-health-icon">${x.status==='ok'?'✓':x.status==='attention'?'!':'×'}</div><div><b>${esc(x.label)}</b><small>${esc(x.detail)}</small></div><em>${x.status.toUpperCase()}</em></div>`).join('');
 q('#platformLaunchSwitches').innerHTML=(data.switches||[]).map(x=>`<article class="platform-switch"><b>${esc(x.key)}</b><small>${esc(String(x.value))}</small></article>`).join('');
}

async function recordRecent(page){
 if(!currentUser||!page)return;
 const labels={
   today:'Today','program-switcher':'My Programs',inbox:'Inbox','life-admin':'My Plan',
   'resource-navigator':'Resource Navigator','progress-hub':'My Progress',
   'coach-dashboard':'Coach Dashboard','coach-cohorts':'Group Programs','coach-analytics':'Coach Analytics',
   'organization-dashboard':'Organization Dashboard','organization-analytics':'Organization Analytics',
   admin:'Admin','analytics':'Analytics & Insights','program-builder':'Program Builder',
   'content-studio':'Content Studio','safety-profile-builder':'Safety Profiles','platform-health':'Platform Health'
 };
 if(labels[page])rpc('record_workspace_recent',{p_workspace_key:activeWorkspace,p_page_key:page,p_label:labels[page]});
}

q('#globalSearchButton')?.addEventListener('click',doSearch);
q('#globalSearchInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')doSearch()});
qa('[data-search-filter]').forEach(b=>b.onclick=()=>{searchFilter=b.dataset.searchFilter;qa('[data-search-filter]').forEach(x=>x.classList.toggle('active',x===b));if(q('#globalSearchInput')?.value.trim())doSearch()});
q('#healthRefresh')?.addEventListener('click',loadHealth);

if(typeof showPage==='function'){
 const old=showPage;
 showPage=function(name){
   old(name);
   recordRecent(name);
   if(name==='workspace-home')loadWorkspaces();
   if(name==='workspace-access')loadAccess();
   if(name==='platform-health')loadHealth();
 };
}

let tries=0;
const timer=setInterval(()=>{
 tries++;
 if(typeof currentUser!=='undefined'&&currentUser){
   clearInterval(timer);
   loadWorkspaces();
 }else if(tries>40)clearInterval(timer);
},200);
})();
