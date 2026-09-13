(()=>{
'use strict';
const VERSION='2026-09-13-menu-organization-v1';
const STYLE_ID='lelleeMenuOrganizationStyle';
const WAVE=new Set(['caregiving','reentry','housing-stability','independent-living']);
const CATEGORY_LABELS={daily:'Start Here',grow:'Learn & Tools',connect:'Connect',reflect:'Journal & Progress',support:'Support',account:'Account'};
const CATEGORY_ORDER={
  daily:['today','program-switcher','recovery','for-you'],
  grow:['learn','tools','recovery-paths-v2','expert-guided-practices'],
  connect:['meetings','community'],
  reflect:['journal','progress','calendar'],
  support:['resources','inbox'],
  account:['workspace-home','global-search','plus','settings','help-center','admin']
};
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const db=()=>window.LelleeAuthContext?.client||null;
let admin=false,betaSlugs=new Set(),accessLoaded=false,accessLoading=false;

function addStyle(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement('style');
  s.id=STYLE_ID;
  s.textContent=`
/* Keep the approved flat shell; only organize the My Journeys workspace. */
#programSwitcherList{display:block!important;width:100%!important;max-width:none!important}
#programSwitcherList>#journeyPlanLimitSummary,#programSwitcherList>.mj-summary{width:100%!important;max-width:none!important;margin:0 0 12px!important}
#programSwitcherList .mj-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px!important;width:100%!important;margin:0!important}
#programSwitcherList .mj-card{display:grid!important;grid-template-columns:44px minmax(0,1fr)!important;grid-template-areas:"icon copy" "open open" "manage manage"!important;gap:10px 12px!important;align-items:start!important;min-width:0!important;height:auto!important}
#programSwitcherList .mj-card>.mj-icon{grid-area:icon}
#programSwitcherList .mj-card>div:nth-child(2){grid-area:copy;min-width:0!important}
#programSwitcherList .mj-card>.mj-open{grid-area:open;width:100%!important;max-width:none!important;justify-self:stretch!important;margin:0!important}
#programSwitcherList .mj-card>.jpl-card-manage{grid-area:manage!important;width:100%!important;margin-top:0!important}
#programSwitcherList .mj-card p{overflow-wrap:anywhere}
#journeyAdminPreviewSection{margin-top:18px;padding-top:15px;border-top:1px solid #e7e0ea}
#journeyAdminPreviewSection h3{margin:0 0 4px;font-size:.78rem;color:#40344c}
#journeyAdminPreviewSection>p{margin:0 0 11px;font-size:.61rem;line-height:1.5;color:#706777}
#journeyAdminPreviewSection .mj-admin-grid{margin-top:0!important}
#journeyAdminPreviewSection .mj-admin-preview{background:#fcfbfd}
#journeyAdminPreviewSection .mj-admin-preview .mj-meta span{background:#f4f2f6;color:#665d6d;border-color:#ddd8e2}
@media(max-width:1050px){#programSwitcherList .mj-grid{grid-template-columns:1fr!important}}
`;
  document.head.appendChild(s);
}

function navigate(page){
  const go=window.LelleeNavigatePage||window.showPage;
  if(typeof go==='function'){go(page);return true}
  location.hash=page;return false;
}

function categoryInner(key){
  return $(`.sidebar .nav-category[data-category="${key}"] .nav-category-items-inner`);
}

function setCategoryLabel(key,label){
  const toggle=$(`.sidebar .nav-category[data-category="${key}"] .nav-category-toggle`);
  if(!toggle)return;
  const spans=$$('span',toggle);
  const target=spans.length>=2?spans[1]:null;
  if(target&&target.textContent.trim()!==label)target.textContent=label;
}

function setNavLabel(button,label){
  if(!button)return;
  const spans=$$('span',button);
  if(spans.length>=2)spans[spans.length-1].textContent=label;
  else {
    const icon=button.querySelector('.nav-icon')?.outerHTML||'<span class="nav-icon">◎</span>';
    button.innerHTML=`${icon}<span>${label}</span>`;
  }
}

function makeMyJourneysButton(){
  const b=document.createElement('button');
  b.type='button';
  b.className='nav-item';
  b.dataset.page='program-switcher';
  b.innerHTML='<span class="nav-icon">◎</span><span>My Journeys</span>';
  b.addEventListener('click',event=>{
    event.preventDefault();
    navigate('program-switcher');
    setTimeout(()=>window.LelleeMyJourneys?.reload?.(),70);
    setTimeout(()=>window.LelleeJourneyPlanLimits?.refresh?.(),180);
  });
  return b;
}

function ensureMyJourneysNav(){
  const host=categoryInner('daily');
  if(!host)return null;
  let buttons=$$('.sidebar .nav-item[data-page="program-switcher"]');
  let primary=buttons.find(b=>b.closest('.nav-category')?.dataset.category==='daily')||buttons[0]||null;
  if(!primary)primary=makeMyJourneysButton();
  setNavLabel(primary,'My Journeys');
  if(primary.parentElement!==host)host.appendChild(primary);
  buttons=$$('.sidebar .nav-item[data-page="program-switcher"]');
  buttons.filter(b=>b!==primary).forEach(b=>b.classList.add('b2-nav-duplicate'));
  return primary;
}

function reorderCategory(key,pages){
  const host=categoryInner(key);if(!host)return;
  pages.forEach(page=>{
    const b=$(`.sidebar .nav-item[data-page="${page}"]`);
    if(b)host.appendChild(b);
  });
}

function patchWorkspaceLabels(){
  $$('[data-quick-page="program-switcher"]').forEach(b=>{
    const title=$('b',b),help=$('small',b);
    if(title)title.textContent='My Journeys';
    if(help)help.textContent='Your active journeys and preview access';
  });
  $$('[data-recent-page="program-switcher"]').forEach(b=>{
    const row=b.closest('.workspace-recent-row');
    const title=row?.querySelector('b');
    if(title)title.textContent='My Journeys';
  });
  $$('.sidebar .nav-item[data-page="program-switcher"]').forEach(b=>setNavLabel(b,'My Journeys'));
}

function organizeSidebar(){
  Object.entries(CATEGORY_LABELS).forEach(([key,label])=>setCategoryLabel(key,label));
  ensureMyJourneysNav();
  Object.entries(CATEGORY_ORDER).forEach(([key,pages])=>reorderCategory(key,pages));
  patchWorkspaceLabels();
}

async function loadAccess(){
  if(accessLoading)return accessLoaded;
  const c=db();if(!c)return false;
  accessLoading=true;
  try{
    const [a,b]=await Promise.all([c.rpc('is_lellee_admin'),c.rpc('get_my_wave1_beta_access')]);
    admin=!a.error&&a.data===true;
    betaSlugs=new Set(!b.error?(b.data||[]).map(x=>x.program_slug).filter(Boolean):[]);
    accessLoaded=true;
  }catch(_){accessLoaded=false}
  finally{accessLoading=false}
  return accessLoaded;
}

function patchCardMeta(card,slug){
  if(!accessLoaded||!WAVE.has(slug))return;
  const meta=$('.mj-meta',card),button=$('.mj-open',card);
  if(betaSlugs.has(slug)){
    card.classList.remove('mj-admin-preview');
    if(meta)meta.innerHTML='<span>ACTIVE JOURNEY</span><span>CONTROLLED BETA</span>';
    if(button)button.textContent='Continue';
    return;
  }
  if(admin){
    card.classList.add('mj-admin-preview');
    if(meta)meta.innerHTML='<span>ADMIN PREVIEW</span>';
    if(button)button.textContent='Preview';
  }
}

function separateAdminPreviews(){
  const wrap=$('#programSwitcherList');if(!wrap)return;
  const mainGrid=$(':scope > .mj-grid',wrap);if(!mainGrid)return;
  const previews=$$('.mj-admin-preview',wrap);
  let section=$('#journeyAdminPreviewSection',wrap);
  if(!previews.length){section?.remove();return}
  if(!section){
    section=document.createElement('section');
    section.id='journeyAdminPreviewSection';
    section.innerHTML='<h3>Admin previews</h3><p>These journeys are visible because this account has admin access. They are not active journeys and do not use plan slots.</p><div class="mj-grid mj-admin-grid"></div>';
    mainGrid.insertAdjacentElement('afterend',section);
  }
  const adminGrid=$('.mj-admin-grid',section);
  previews.forEach(card=>adminGrid?.appendChild(card));
}

function patchJourneySummary(){
  if(!accessLoaded)return;
  const wrap=$('#programSwitcherList');if(!wrap)return;
  const summary=$$('.mj-summary',wrap).find(x=>x.id!=='journeyPlanLimitSummary');
  if(!summary)return;
  const planSummary=window.LelleeJourneyPlanLimits?.summary?.();
  const recovery=!!$('.mj-card [data-mj-open="recovery"]',wrap);
  const actual=Number.isFinite(Number(planSummary?.total_active_journey_count))?Number(planSummary.total_active_journey_count):(recovery?1:0)+betaSlugs.size;
  const previews=$$('.mj-admin-preview',wrap).length;
  summary.innerHTML=`<b>${actual} active journey${actual===1?'':'s'} on this account.</b> Opening one journey changes what you are viewing; it does not pause your other active journeys.${previews?` ${previews} admin preview${previews===1?' is':'s are'} shown separately below.`:''}`;
}

function organizeJourneys(){
  addStyle();
  const wrap=$('#programSwitcherList');if(!wrap)return;
  $$('.mj-card',wrap).forEach(card=>{
    const slug=$('[data-mj-open]',card)?.dataset?.mjOpen;
    if(slug)patchCardMeta(card,slug);
  });
  separateAdminPreviews();
  patchJourneySummary();
}

function patchAll(){organizeSidebar();organizeJourneys()}
function schedule(){[0,120,320,650,1050,1550,2200].forEach(ms=>setTimeout(async()=>{if(!accessLoaded)await loadAccess();patchAll()},ms))}

document.addEventListener('lellee:pagechange',()=>schedule());
document.addEventListener('click',event=>{
  if(event.target.closest?.('.nav-category-toggle,[data-page="program-switcher"],[data-quick-page="program-switcher"]'))setTimeout(patchAll,80);
},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();

window.LelleeMenuOrganization=Object.freeze({version:VERSION,refresh:schedule});
})();
