(() => {
  'use strict';

  const ROUTE_KEY = 'lellee_pending_entry';
  const ACTIVE_WORKSPACE_KEY = 'lellee_active_workspace_v1';
  const params = new URLSearchParams(location.search);
  const urlCoachIntent = params.get('entry') === 'coach' || params.get('workspace') === 'coach' || params.get('page') === 'coach-dashboard' || params.get('page') === 'coach-business';

  function readStoredIntent(){
    try {
      return sessionStorage.getItem(ROUTE_KEY) === 'coach' || localStorage.getItem(ROUTE_KEY) === 'coach';
    } catch (_) {
      return false;
    }
  }

  function storeCoachIntent(){
    try { sessionStorage.setItem(ROUTE_KEY, 'coach'); } catch (_) {}
    try { localStorage.setItem(ROUTE_KEY, 'coach'); } catch (_) {}
    try { localStorage.setItem(ACTIVE_WORKSPACE_KEY, 'coach'); } catch (_) {}
  }

  function clearCoachIntent(){
    try { sessionStorage.removeItem(ROUTE_KEY); } catch (_) {}
    try { localStorage.removeItem(ROUTE_KEY); } catch (_) {}
  }

  if(urlCoachIntent) storeCoachIntent();
  if(!urlCoachIntent && !readStoredIntent()) return;

  function qs(sel){ return document.querySelector(sel); }

  function setCoachAuthCopy(){
    const title = qs('#authTitle');
    const msg = qs('#authMsg');
    if(title) title.textContent = 'Coach Log In';
    if(msg) msg.textContent = 'Sign in to open your coaching business workspace.';
  }

  function showBanner(text, kind='info'){
    let bar = qs('#coachEntryStatus');
    if(!bar){
      bar = document.createElement('div');
      bar.id = 'coachEntryStatus';
      bar.setAttribute('role','status');
      bar.style.cssText = [
        'position:fixed','left:50%','top:14px','transform:translateX(-50%)',
        'z-index:10050','max-width:min(680px,calc(100% - 28px))',
        'padding:10px 14px','border-radius:999px','font:700 12px/1.35 Inter,system-ui,sans-serif',
        'box-shadow:0 10px 30px rgba(0,0,0,.14)'
      ].join(';');
      document.body.appendChild(bar);
    }
    if(kind === 'error'){
      bar.style.background = '#fff1f3';
      bar.style.color = '#8c3548';
      bar.style.border = '1px solid #edcbd3';
    }else{
      bar.style.background = '#eef8f6';
      bar.style.color = '#174d49';
      bar.style.border = '1px solid #c9e3dd';
    }
    bar.textContent = text;
  }

  function forceCoachWorkspace(){
    try { localStorage.setItem(ACTIVE_WORKSPACE_KEY, 'coach'); } catch (_) {}
    try { document.documentElement.dataset.lelleeWorkspace = 'coach'; } catch (_) {}
    try { document.body.dataset.lelleeWorkspace = 'coach'; } catch (_) {}
  }

  function activatePageDom(page){
    const pageEl = qs(`#page-${page}`);
    if(!pageEl) return false;
    document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === `page-${page}`));
    document.querySelectorAll('[data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === page));
    return true;
  }

  function openCoachPage(page){
    forceCoachWorkspace();
    let opened = false;

    if(typeof window.showPage === 'function'){
      try { window.showPage(page); opened = true; } catch (_) {}
    }

    const el = document.querySelector(`[data-page="${page}"]`);
    if(el){
      try { el.click(); opened = true; } catch (_) {}
    }

    if(activatePageDom(page)) opened = true;
    try { history.replaceState({}, '', location.pathname + '?entry=coach#' + page); } catch (_) {}
    return opened;
  }

  function currentPage(){
    return document.querySelector('.page.active')?.id?.replace(/^page-/, '') || '';
  }

  function authContext(){
    const ctx = window.LelleeAuthContext;
    const user = ctx?.getCurrentUser?.();
    if(!ctx?.client || !user) return null;
    return {ctx, user, client: ctx.client};
  }

  let handoffStarted = false;
  async function coachHandoff(){
    if(handoffStarted) return;
    const auth = authContext();
    if(!auth) return;
    handoffStarted = true;

    forceCoachWorkspace();
    showBanner('Opening your coaching workspace…');

    // Safe immediate landing: leave Recovery Today first, without waiting on database checks.
    openCoachPage('coach-business');

    try{
      const membership = await auth.client
        .from('coach_business_members')
        .select('business_id,role,status')
        .eq('user_id', auth.user.id)
        .eq('status','active')
        .limit(1);

      if(membership.error){
        const code = membership.error.code || '';
        if(code === '42P01' || /does not exist|not found/i.test(membership.error.message || '')){
          showBanner('Coach Business setup is not installed in the database yet. Opened Coach Business setup.', 'error');
          return;
        }
        throw membership.error;
      }

      const businessId = membership.data?.[0]?.business_id;
      if(!businessId){
        showBanner('Complete your coaching business setup to continue.');
        return;
      }

      const business = await auth.client
        .from('coach_businesses')
        .select('id,status,business_name,public_name')
        .eq('id', businessId)
        .maybeSingle();

      if(business.error) throw business.error;

      if(business.data?.status === 'approved'){
        openCoachPage('coach-dashboard');
        showBanner(`Coach Dashboard opened${business.data.business_name ? ': '+business.data.business_name : ''}.`);
      }else{
        openCoachPage('coach-business');
        const status = business.data?.status || 'setup';
        showBanner(`Coaching business status: ${status.replaceAll('_',' ')}. Opened Business Settings.`);
      }
    }catch(err){
      console.error('Coach entry routing failed', err);
      openCoachPage('coach-business');
      showBanner('Could not confirm coach workspace membership yet. Opened Coach Business setup.', 'error');
    }finally{
      const page = currentPage();
      if(page === 'coach-dashboard' || page === 'coach-business') clearCoachIntent();
      setTimeout(() => qs('#coachEntryStatus')?.remove(), 5200);
    }
  }

  function boot(){
    setCoachAuthCopy();
    storeCoachIntent();
    forceCoachWorkspace();
    // Try a safe landing once the page has had a moment to build, but do not loop page activation.
    setTimeout(() => openCoachPage('coach-business'), 500);

    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      setCoachAuthCopy();
      forceCoachWorkspace();
      coachHandoff();
      if(handoffStarted || attempts > 40){
        clearInterval(timer);
      }
    }, 500);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  }else{
    boot();
  }
})();

(() => {
  'use strict';
  if(window.__lelleeCoachPricingUiLoader)return;
  window.__lelleeCoachPricingUiLoader=true;
  function loadPricingUi(){
    if(document.querySelector('script[data-coach-pricing-service-ui]'))return;
    const s=document.createElement('script');
    s.src='/coach-pricing-service-ui.js?v=20261004-1';
    s.defer=true;
    s.dataset.coachPricingServiceUi='1';
    document.head.appendChild(s);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadPricingUi,{once:true});
  else loadPricingUi();
})();

(() => {
  'use strict';
  if(window.__lelleeCoachPricingOpsLoader)return;
  window.__lelleeCoachPricingOpsLoader=true;
  function loadPricingOps(){
    if(document.querySelector('script[data-coach-pricing-operations-ui]'))return;
    const s=document.createElement('script');
    s.src='/coach-pricing-operations-ui.js?v=20261004-1';
    s.defer=true;
    s.dataset.coachPricingOperationsUi='1';
    document.head.appendChild(s);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadPricingOps,{once:true});
  else loadPricingOps();
})();

(() => {
  'use strict';
  if(window.__lelleeCoachConsultConversionLoader)return;
  window.__lelleeCoachConsultConversionLoader=true;
  function loadConsultConversion(){
    if(document.querySelector('script[data-coach-consultation-conversion-ui]'))return;
    const s=document.createElement('script');
    s.src='/coach-consultation-conversion-ui.js?v=20261004-1';
    s.defer=true;
    s.dataset.coachConsultationConversionUi='1';
    document.head.appendChild(s);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadConsultConversion,{once:true});
  else loadConsultConversion();
})();

(() => {
  'use strict';
  if(window.__lelleeCoachPaidOpsLoader)return;
  window.__lelleeCoachPaidOpsLoader=true;
  function loadPaidOps(){
    if(document.querySelector('script[data-coach-paid-operations-ui]'))return;
    const s=document.createElement('script');
    s.src='/coach-paid-operations-ui.js?v=20261004-1';
    s.defer=true;
    s.dataset.coachPaidOperationsUi='1';
    document.head.appendChild(s);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadPaidOps,{once:true});
  else loadPaidOps();
})();
