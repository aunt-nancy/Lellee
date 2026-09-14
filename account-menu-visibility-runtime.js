(()=>{
'use strict';
const VERSION='2026-09-13-account-menu-v10';
const STYLE_ID='lelleeAccountMenuVisibilityStyle';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];

function addStyle(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
.sidebar .nav-category[data-category="account"] .nav-category-items-inner{padding-bottom:6px!important}
.sidebar .nav-category[data-category="account"] .nav-item{min-height:28px!important;padding-top:4px!important;padding-bottom:4px!important}
.sidebar .nav-list{scrollbar-color:rgba(255,255,255,.38) transparent!important}
.sidebar .nav-item[data-page="language-accessibility"]{display:none!important}
.sidebar .lellee-view-toggle{margin:6px 8px 2px!important;border:1px solid rgba(255,255,255,.32)!important;border-radius:999px!important;background:rgba(255,255,255,.10)!important;justify-content:center!important;font-weight:800!important;letter-spacing:.01em!important}
.sidebar .lellee-view-toggle[data-mode="admin"]{background:rgba(255,255,255,.18)!important}
@media(max-height:850px) and (min-width:821px){
  .sidebar .help-card{padding:9px 10px!important;margin-top:5px!important}
  .sidebar .help-card p{display:none!important}
  .sidebar .help-card h4{margin-bottom:6px!important}
  .sidebar .side-help{padding:8px!important}
}
`;
  document.head.appendChild(style);
}

function categoryHost(key){return $(`.sidebar .nav-category[data-category="${key}"] .nav-category-items-inner`)}
function accountHost(){return categoryHost('account')}
function navigate(page){
  const go=window.LelleeNavigatePage||window.showPage;
  if(typeof go==='function'){go(page);return}
  location.hash=page;
}
function makeButton(page,label,icon,id){
  const b=document.createElement('button');
  b.type='button';b.className='nav-item';b.dataset.page=page;if(id)b.id=id;
  b.innerHTML=`<span class="nav-icon">${icon}</span><span>${label}</span>`;
  b.addEventListener('click',e=>{e.preventDefault();navigate(page)});
  return b;
}
function normalizeLabel(b,label){
  if(!b)return;
  const spans=b.querySelectorAll('span');
  if(spans.length>1)spans[spans.length-1].textContent=label;
}
function placeAfter(node,anchor){
  if(!node||!anchor?.parentNode)return;
  anchor.parentNode.insertBefore(node,anchor.nextSibling);
}
function currentPage(){return (location.hash||'').replace(/^#/,'').split('?')[0]}
function isAdminView(){return currentPage()==='admin'||document.body?.dataset?.lelleeViewMode==='admin'}
function setViewMode(mode){
  if(document.body)document.body.dataset.lelleeViewMode=mode;
  try{sessionStorage.setItem('lelleeViewMode',mode)}catch(_){ }
}
function savedViewMode(){try{return sessionStorage.getItem('lelleeViewMode')||'user'}catch(_){return'user'}}
function ensureViewToggle(allowed){
  const host=accountHost();if(!host)return;
  let b=$('#lelleeViewToggle');
  if(!allowed){b?.remove();return}
  if(!b){
    b=document.createElement('button');
    b.type='button';b.id='lelleeViewToggle';b.className='nav-item lellee-view-toggle';
    b.innerHTML='<span class="nav-icon">⇄</span><span></span>';
    b.addEventListener('click',e=>{
      e.preventDefault();
      const adminNow=isAdminView();
      const next=adminNow?'user':'admin';
      setViewMode(next);
      navigate(next==='admin'?'admin':'program-switcher');
      setTimeout(()=>updateViewToggle(true),40);
    });
  }
  if(b.parentElement!==host)host.insertBefore(b,host.firstChild);
  updateViewToggle(true);
}
function updateViewToggle(allowed){
  const b=$('#lelleeViewToggle');if(!b||!allowed)return;
  const adminNow=isAdminView();
  b.dataset.mode=adminNow?'admin':'user';
  normalizeLabel(b,adminNow?'Switch to User View':'Switch to Admin View');
  b.setAttribute('aria-label',adminNow?'Switch to regular user view':'Switch to admin view');
}
function repairMyJourneysPlacement(){
  const daily=categoryHost('daily');
  if(!daily)return;
  const buttons=$$('.sidebar .nav-item[data-page="program-switcher"]');
  let primary=buttons.find(b=>b.closest('.nav-category')?.dataset.category==='daily')||buttons[0];
  if(!primary)return;
  primary.classList.remove('hidden','b2-nav-unused','b2-nav-duplicate');
  normalizeLabel(primary,'My Journeys');
  if(primary.parentElement!==daily)daily.appendChild(primary);
  buttons.filter(b=>b!==primary).forEach(b=>b.classList.add('b2-nav-duplicate'));
}
function ensureEntries(){
  addStyle();
  repairMyJourneysPlacement();
  const host=accountHost();if(!host)return false;
  const language=$('[data-page="language-accessibility"]',host);
  if(language)language.classList.add('b2-nav-unused');
  const settings=$('[data-page="settings"]',host);
  let help=$('[data-page="help-center"]',host)||$('.sidebar .nav-item[data-page="help-center"]');
  if(!help)help=makeButton('help-center','Help Center','?','helpCenterNavItem');
  help.classList.remove('hidden','b2-nav-unused','b2-nav-duplicate');
  normalizeLabel(help,'Help Center');
  if(help.parentElement!==host)host.appendChild(help);
  if(settings)placeAfter(help,settings);

  let admin=$('[data-page="admin"]',host)||$('.sidebar .nav-item[data-page="admin"]');
  if(!admin)admin=makeButton('admin','Admin','A','adminNavItem');
  if(!admin.id)admin.id='adminNavItem';
  normalizeLabel(admin,'Admin');
  if(admin.parentElement!==host)host.appendChild(admin);
  placeAfter(admin,help);
  return true;
}
async function resolveUser(client){
  let user=null;
  try{user=window.LelleeAuthContext?.getCurrentUser?.()||window.currentUser||null}catch(_){ }
  if(user)return user;
  try{const r=await client?.auth?.getSession?.();user=r?.data?.session?.user||null}catch(_){ }
  if(user)return user;
  try{const r=await client?.auth?.getUser?.();user=r?.data?.user||null}catch(_){ }
  return user;
}
function privatePageRequested(){
  return new Set(['settings','help-center','admin','workspace-home','global-search','plus','program-switcher','today','recovery','for-you','inbox','journal','progress','calendar']).has(currentPage());
}
function exitBrowseModeIfNeeded(user){
  if(!user||!privatePageRequested())return false;
  const url=new URL(location.href);
  if(url.searchParams.get('browse')!=='1')return false;
  url.searchParams.delete('browse');
  url.searchParams.delete('recommended');
  location.replace(url.pathname+(url.searchParams.toString()?`?${url.searchParams.toString()}`:'')+url.hash);
  return true;
}
function repairPrivateHeader(user){
  if(!user)return;
  const page=currentPage();
  const heading=$('.topbar .greeting h1')||$('.greeting h1');
  const sub=$('.topbar .greeting p')||$('.greeting p');
  if(page==='program-switcher'){
    if(heading)heading.textContent='My Journeys';
    if(sub)sub.textContent='Open any journey whenever you want. Working in one journey does not pause your other journeys.';
  }else if(page==='admin'){
    if(heading)heading.textContent='Admin';
    if(sub)sub.textContent='Manage Lellee operations, content, people, safety, data, and platform controls.';
  }
  $$('.topbar .mini-stat,.topbar [class*="stat"]').forEach(node=>{
    const text=(node.textContent||'').toLowerCase();
    if(text.includes('program preview')||text.includes('no account required')||text.trim()==='explore')node.style.setProperty('display','none','important');
  });
}
async function serverAdminCheck(client,user){
  try{
    const {data,error}=await client.rpc('is_lellee_admin');
    if(!error)return data===true;
  }catch(_){ }
  try{
    const {data,error}=await client.from('admin_user_roles').select('role,active').eq('user_id',user.id).maybeSingle();
    return !error&&data?.active===true&&['admin','editor'].includes(data?.role);
  }catch(_){return false}
}
async function refreshAdmin(){
  if(!ensureEntries())return false;
  const admin=$('#adminNavItem')||$('.sidebar .nav-item[data-page="admin"]');
  if(!admin)return false;
  const client=window.LelleeAuthContext?.client||window.sb;
  if(!client){admin.classList.add('hidden');ensureViewToggle(false);return false}
  const user=await resolveUser(client);
  if(!user){admin.classList.add('hidden');ensureViewToggle(false);return false}
  if(exitBrowseModeIfNeeded(user))return false;
  repairPrivateHeader(user);
  const allowed=await serverAdminCheck(client,user);
  window.LelleeAdminContext={...(window.LelleeAdminContext||{}),isAdmin:allowed,userId:user.id,email:user.email||null};
  admin.classList.toggle('hidden',!allowed);
  if(allowed)admin.classList.remove('b2-nav-unused','b2-nav-duplicate');
  ensureViewToggle(allowed);
  if(allowed){
    const mode=currentPage()==='admin'?'admin':(savedViewMode()==='admin'&&currentPage()==='admin'?'admin':'user');
    setViewMode(mode);
    updateViewToggle(true);
  }
  return allowed;
}
function refresh(){
  ensureEntries();
  [0,200,500,900,1500,2400,4000].forEach(ms=>setTimeout(()=>{ensureEntries();refreshAdmin()},ms));
}
document.addEventListener('lellee:pagechange',refresh);
document.addEventListener('click',e=>{if(e.target.closest?.('.nav-category-toggle,[data-page="settings"],[data-page="help-center"],[data-page="admin"],[data-page="program-switcher"],#lelleeViewToggle'))setTimeout(refresh,30)},true);
try{
  const client=window.LelleeAuthContext?.client||window.sb;
  client?.auth?.onAuthStateChange?.(()=>setTimeout(refresh,30));
}catch(_){ }
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
window.LelleeAccountMenu=Object.freeze({version:VERSION,refresh});
})();