(()=>{
'use strict';
const VERSION='2026-09-13-account-menu-v1';
const STYLE_ID='lelleeAccountMenuVisibilityStyle';
const $=(s,r=document)=>r.querySelector(s);

function addStyle(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
.sidebar .nav-category[data-category="account"] .nav-category-items-inner{padding-bottom:6px!important}
.sidebar .nav-category[data-category="account"] .nav-item{min-height:28px!important;padding-top:4px!important;padding-bottom:4px!important}
.sidebar .nav-list{scrollbar-color:rgba(255,255,255,.38) transparent!important}
@media(max-height:850px) and (min-width:821px){
  .sidebar .help-card{padding:9px 10px!important;margin-top:5px!important}
  .sidebar .help-card p{display:none!important}
  .sidebar .help-card h4{margin-bottom:6px!important}
  .sidebar .side-help{padding:8px!important}
}
`;
  document.head.appendChild(style);
}

function accountHost(){return $('.sidebar .nav-category[data-category="account"] .nav-category-items-inner')}
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
function ensureEntries(){
  addStyle();
  const host=accountHost();if(!host)return false;
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
async function refreshAdmin(){
  if(!ensureEntries())return false;
  const admin=$('#adminNavItem')||$('.sidebar .nav-item[data-page="admin"]');
  if(!admin)return false;
  const client=window.LelleeAuthContext?.client||window.sb;
  const user=window.LelleeAuthContext?.getCurrentUser?.()||window.currentUser||null;
  if(!client||!user){admin.classList.add('hidden');return false}
  try{
    const {data,error}=await client.rpc('is_lellee_admin');
    const allowed=!error&&data===true;
    admin.classList.toggle('hidden',!allowed);
    if(allowed)admin.classList.remove('b2-nav-unused','b2-nav-duplicate');
    return allowed;
  }catch(_){admin.classList.add('hidden');return false}
}
function refresh(){
  ensureEntries();
  [0,250,700,1400,2400].forEach(ms=>setTimeout(()=>{ensureEntries();refreshAdmin()},ms));
}
document.addEventListener('lellee:pagechange',refresh);
document.addEventListener('click',e=>{if(e.target.closest?.('.nav-category[data-category="account"] .nav-category-toggle'))setTimeout(refresh,30)},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
window.LelleeAccountMenu=Object.freeze({version:VERSION,refresh});
})();