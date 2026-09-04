(function(){
  'use strict';

  const LELLEE_PRICES = Object.freeze({
    free: { monthly: 0 },
    plus: { monthly: 5.99, annual: 59.99 },
    premium: { monthly: 14.99, annual: 149.00 },
    journalCompanion: { monthly: 4.99 },
    coachAddon: { monthly: 49.99, requires: 'premium' },
    extraCoach15: { each: 19.99, minutes: 15 }
  });
  window.LELLEE_PRICES = LELLEE_PRICES;

  const money = n => '$' + Number(n).toFixed(2);
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  function setText(sel, value){ const el=$(sel); if(el && el.textContent!==value) el.textContent=value; }

  function fixPlus(){
    setText('#plusPriceMonthly', money(LELLEE_PRICES.plus.monthly));
    const pricePill=$('#plusPriceMonthly')?.nextElementSibling;
    if(pricePill && pricePill.tagName==='SMALL' && pricePill.textContent!=='/month') pricePill.textContent='/month';
    setText('#plusComparePrice', money(LELLEE_PRICES.plus.monthly));
    const choice=$('#plusPlanChoice');
    if(choice){
      const monthly=choice.querySelector('option[value="monthly"]');
      const annual=choice.querySelector('option[value="annual"]');
      if(monthly && monthly.textContent!=='Monthly — $5.99/month') monthly.textContent='Monthly — $5.99/month';
      if(annual && annual.textContent!=='Annual — $59.99/year') annual.textContent='Annual — $59.99/year';
    }
    const m=$('#adminPlusMonthly'), a=$('#adminPlusAnnual');
    if(m && (!m.value || String(m.value)!=='5.99')) m.value='5.99';
    if(a && (!a.value || String(a.value)!=='59.99')) a.value='59.99';
    const pm=$('#adminPremiumMonthly'), pa=$('#adminPremiumAnnual');
    if(pm && (!pm.value || String(pm.value)==='0')) pm.value='14.99';
    if(pa && (!pa.value || String(pa.value)==='0')) pa.value='149';
    const premiumChoice=$('#premiumPlanChoice');
    if(premiumChoice){
      const monthly=premiumChoice.querySelector('option[value="monthly"]');
      const annual=premiumChoice.querySelector('option[value="annual"]');
      if(monthly && monthly.textContent!=='Monthly — $14.99/month') monthly.textContent='Monthly — $14.99/month';
      if(annual && annual.textContent!=='Annual — $149/year') annual.textContent='Annual — $149/year';
    }
  }

  function replacePriceInNode(node, amount, period){
    if(!node) return;
    const candidates=node.querySelectorAll('b,h3,strong,span,small,p,div');
    for(const el of candidates){
      const t=(el.textContent||'').trim();
      if(/^\$\d+(?:\.\d{1,2})?(?:\s*\/\s*(?:mo|month|yr|year))?$/i.test(t) || /price pending|^TBD$/i.test(t)){
        const next=money(amount)+(period ? '/'+period : '');
        if(el.textContent!==next) el.textContent=next;
        return;
      }
    }
  }

  function fixNamedPlanCards(){
    const cards=$$('article,.commerce-plan-card,.plus-compare-card,.final-checkout-card,.pricing-card,.plan-card,.access-card');
    for(const card of cards){
      const text=(card.textContent||'').replace(/\s+/g,' ').trim();
      if(/LELLEE\s+PLUS/i.test(text)) replacePriceInNode(card, LELLEE_PRICES.plus.monthly, 'mo');
      if(/LELLEE\s+PREMIUM/i.test(text)){
        if(/annual|year/i.test(text)) replacePriceInNode(card, LELLEE_PRICES.premium.annual, 'year');
        else replacePriceInNode(card, LELLEE_PRICES.premium.monthly, 'mo');
      }
      if(/JOURNAL\s+COMPANION/i.test(text)) replacePriceInNode(card, LELLEE_PRICES.journalCompanion.monthly, 'month');
      if(/(?:LELLEE\s+COACH|ADD\s+A\s+COACH|COACH\s+ADD[- ]?ON)/i.test(text)) replacePriceInNode(card, LELLEE_PRICES.coachAddon.monthly, 'month');
      if(/15[- ]?MINUTE|15\s+MIN/i.test(text) && /COACH/i.test(text)) replacePriceInNode(card, LELLEE_PRICES.extraCoach15.each, 'session');
    }
  }

  function fixLiteralOldPlusPrices(){
    const all=$$('body *');
    for(const el of all){
      if(el.children.length) continue;
      const t=(el.textContent||'').trim();
      if(!['$5.99','$59.99','TBD','unapproved'].includes(t)) continue;
      const ctx=el.closest('article,.commerce-plan-card,.plus-compare-card,.pricing-card,.plan-card,section,div');
      if(ctx && /LELLEE\s+PLUS|PLUS\s+MEMBERSHIP|FREE\s+VS\s+PLUS/i.test((ctx.textContent||''))){
        el.textContent=t==='$59.99'?'$59.99':'$5.99';
      }
    }
  }

  function addPricingNote(){
    const plusPage=$('#page-plus .approved-inner');
    if(!plusPage || $('#lelleeCanonicalPricingNote')) return;
    const note=document.createElement('div');
    note.id='lelleeCanonicalPricingNote';
    note.className='plus-boundary-note';
    note.innerHTML='<b>Current Lellee pricing:</b> Plus $5.99/month or $59.99/year · Premium $14.99/month or $149/year · Journal Companion $4.99/month · Lellee Coach add-on $49.99/month with Premium · Additional 15-minute coaching sessions $19.99 each.';
    plusPage.appendChild(note);
  }

  function applyPricing(){fixPlus();fixNamedPlanCards();fixLiteralOldPlusPrices();addPricingNote()}
  setTimeout(applyPricing,250);
  setTimeout(applyPricing,1000);

  /* ==========================================================
     SYSTEM CONSOLIDATION RUNTIME BOUNDARY — 2026-09-04
     One public navigation entry + permission-aware Account menu.
     ========================================================== */
  const RUNTIME_VERSION='2026-09-04-system2-admin-entry';
  const legacyRouter=typeof window.showPage==='function'?window.showPage:null;
  const coreRouter=typeof window.LelleeNavigatePage==='function'?window.LelleeNavigatePage:null;
  let navigating=false;
  let pendingPage=null;
  let navigationCount=0;
  let lastError=null;
  let userInteracted=false;

  const activePage=()=>document.querySelector('.page.active[id^="page-"]')?.id?.replace(/^page-/,'')||null;
  const pageExists=page=>Boolean(page&&document.getElementById(`page-${page}`));

  function stabilizeLogo(){
    const logo=document.querySelector('.sidebar .approved-logo');
    if(!logo)return;
    const src='/lellee-approved-logo-transparent.svg?v=20260903-system1';
    const expected=new URL(src,location.origin).href;
    if(logo.src!==expected)logo.src=src;
    logo.removeAttribute('srcset');
  }

  function accountMenuInner(){
    return document.querySelector('.nav-category[data-category="account"] .nav-category-items-inner');
  }

  function makeAccountButton(page,label,icon,id){
    const b=document.createElement('button');
    b.type='button';
    b.className='nav-item';
    b.dataset.page=page;
    if(id)b.id=id;
    b.innerHTML=`<span class="nav-icon">${icon}</span><span>${label}</span>`;
    return b;
  }

  function ensureAccountNavigation(){
    const inner=accountMenuInner();
    if(!inner)return false;

    let workspace=inner.querySelector('[data-page="workspace-home"]');
    if(!workspace){
      workspace=makeAccountButton('workspace-home','Workspaces','▦','workspaceNavItem');
      const search=inner.querySelector('[data-page="global-search"]');
      inner.insertBefore(workspace,search||inner.firstChild);
    }
    workspace.classList.remove('hidden','b2-nav-unused','b2-nav-duplicate');

    let admin=inner.querySelector('[data-page="admin"]');
    if(!admin){
      admin=makeAccountButton('admin','Admin','A','adminNavItem');
      admin.classList.add('hidden');
      inner.appendChild(admin);
    }else if(!admin.id){
      admin.id='adminNavItem';
    }

    if(window.LelleeAdminContext?.isAdmin===true)admin.classList.remove('hidden');
    return true;
  }

  async function refreshAdminNavigation(){
    ensureAccountNavigation();
    const admin=document.getElementById('adminNavItem');
    if(!admin)return false;
    const ctx=window.LelleeAuthContext;
    const user=ctx?.getCurrentUser?.();
    if(!ctx?.client||!user){
      admin.classList.add('hidden');
      return false;
    }
    try{
      const {data,error}=await ctx.client.rpc('is_lellee_admin');
      const allowed=!error&&data===true;
      window.LelleeAdminContext={...(window.LelleeAdminContext||{}),isAdmin:allowed};
      admin.classList.toggle('hidden',!allowed);
      return allowed;
    }catch(_){
      admin.classList.add('hidden');
      return false;
    }
  }

  function syncHash(page){
    if(!pageExists(page))return;
    const next=`${location.pathname}${location.search}#${encodeURIComponent(page)}`;
    const current=`${location.pathname}${location.search}${location.hash}`;
    if(next!==current)history.replaceState(history.state,'',next);
  }

  function clearEntryParameter(){
    try{
      const url=new URL(location.href);
      if(!url.searchParams.has('page'))return;
      url.searchParams.delete('page');
      history.replaceState(history.state,'',url.pathname+(url.searchParams.toString()?`?${url.searchParams.toString()}`:'')+url.hash);
    }catch(_){ }
  }

  function emitPageChange(page,source='navigation'){
    if(!page)return;
    document.dispatchEvent(new CustomEvent('lellee:pagechange',{detail:{page,source,version:RUNTIME_VERSION}}));
  }

  function canonicalNavigate(page){
    if(!page)return false;
    if(navigating){
      if(page!==activePage())pendingPage=page;
      return false;
    }
    navigating=true;
    let result=true;
    try{
      if(legacyRouter)result=legacyRouter(page);
      else if(coreRouter)result=coreRouter(page);
      else result=false;
    }catch(err){
      lastError=err;
      console.error('Lellee canonical navigation hook error:',err);
      if(activePage()!==page && coreRouter){
        try{coreRouter(page)}catch(coreErr){lastError=coreErr;console.error('Lellee core navigation error:',coreErr);result=false}
      }
    }finally{
      navigating=false;
    }

    const active=activePage();
    if(active){
      navigationCount+=1;
      syncHash(active);
      stabilizeLogo();
      ensureAccountNavigation();
      emitPageChange(active,'navigation');
    }

    const queued=pendingPage;
    pendingPage=null;
    if(queued && queued!==active)queueMicrotask(()=>canonicalNavigate(queued));
    return result;
  }

  if(coreRouter){
    window.LelleeCoreNavigatePage=coreRouter;
    window.LelleeLegacyPageHooks=legacyRouter;
    window.showPage=canonicalNavigate;
    window.LelleeNavigatePage=canonicalNavigate;
  }

  window.LelleeRuntimeOwnership={
    version:RUNTIME_VERSION,
    navigationOwner:'canonical runtime -> core index router',
    sessionOwner:'index.html / LelleeAuthContext',
    logoOwner:'lellee-approved-logo-transparent.svg',
    serviceWorkerOwner:'/service-worker.js',
    accountAccessOwner:'canonical runtime + is_lellee_admin',
    get activePage(){return activePage()},
    get navigationCount(){return navigationCount},
    get lastError(){return lastError}
  };

  document.addEventListener('pointerdown',()=>{userInteracted=true},{capture:true,once:true});
  document.addEventListener('keydown',()=>{userInteracted=true},{capture:true,once:true});
  window.addEventListener('hashchange',()=>{
    let page='';
    try{page=decodeURIComponent(location.hash.replace(/^#/,''))}catch{page=location.hash.replace(/^#/,'')}
    if(pageExists(page) && page!==activePage())canonicalNavigate(page);
  });

  let hashRequested='';
  try{hashRequested=decodeURIComponent(location.hash.replace(/^#/,''))}catch{hashRequested=location.hash.replace(/^#/,'')}
  let queryRequested='';
  try{
    const q=new URLSearchParams(location.search).get('page')||'';
    if(q==='admin'||q==='workspace-home')queryRequested=q;
  }catch(_){ }
  const requested=queryRequested||hashRequested;

  ensureAccountNavigation();
  refreshAdminNavigation();
  setTimeout(refreshAdminNavigation,700);
  setTimeout(refreshAdminNavigation,1800);

  if(requested && requested!=='today' && pageExists(requested)){
    setTimeout(async()=>{
      if(requested==='admin')await refreshAdminNavigation();
      if(!userInteracted && activePage()!==requested)canonicalNavigate(requested);
      if(queryRequested)clearEntryParameter();
    },850);
  }

  setTimeout(()=>{
    stabilizeLogo();
    ensureAccountNavigation();
    const active=activePage();
    if(active){syncHash(active);emitPageChange(active,'runtime-ready')}
    console.info(`Lellee system runtime ${RUNTIME_VERSION} active`);
  },0);
})();
