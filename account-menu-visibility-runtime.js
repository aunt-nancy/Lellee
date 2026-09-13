(()=>{
'use strict';
const VERSION='2026-09-13-account-menu-v4';
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
/* Logo regression lock: transparent approved artwork must sit directly on the sidebar. */
body .sidebar .logo-wrap{background:transparent!important}
body .sidebar .approved-logo{
  background-color:transparent!important;
  background-image:url('/lellee-approved-logo-transparent.svg?v=20260913-logo-lock-1')!important;
  background-repeat:no-repeat!important;
  background-position:center!important;
  background-size:contain!important;
  border:0!important;
  box-shadow:none!important;
}
body .sidebar .approved-logo>img,
body .sidebar .approved-logo .sidebar-logo{visibility:hidden!important}
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
  const hash=(location.hash||'').replace(/^#/,'').split('?')[0];
  return new Set(['settings','help-center','admin','workspace-home','global-search','plus','program-switcher','today','recovery','for-you','inbox','journal','progress','calendar']).has(hash);
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
  if(!client){admin.classList.add('hidden');return false}
  const user=await resolveUser(client);
  if(!user){admin.classList.add('hidden');return false}
  if(exitBrowseModeIfNeeded(user))return false;
  const allowed=await serverAdminCheck(client,user);
  window.LelleeAdminContext={...(window.LelleeAdminContext||{}),isAdmin:allowed,userId:user.id,email:user.email||null};
  admin.classList.toggle('hidden',!allowed);
  if(allowed)admin.classList.remove('b2-nav-unused','b2-nav-duplicate');
  return allowed;
}
function refresh(){
  ensureEntries();
  [0,200,500,900,1500,2400,4000].forEach(ms=>setTimeout(()=>{ensureEntries();refreshAdmin()},ms));
}
document.addEventListener('lellee:pagechange',refresh);
document.addEventListener('click',e=>{if(e.target.closest?.('.nav-category-toggle,[data-page="settings"],[data-page="help-center"],[data-page="admin"]'))setTimeout(refresh,30)},true);
try{
  const client=window.LelleeAuthContext?.client||window.sb;
  client?.auth?.onAuthStateChange?.(()=>setTimeout(refresh,30));
}catch(_){ }
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
window.LelleeAccountMenu=Object.freeze({version:VERSION,refresh});
})();