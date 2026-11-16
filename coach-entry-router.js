(() => {
  'use strict';
  // Legacy coach entry URLs must open the separate Coaching workspace.
  const params = new URLSearchParams(location.search);
  const coachPages = new Set(['coach-dashboard','coach-business','coach-cohorts','coach-scheduler','coach-credentials','coach-analytics','coach-revenue','coach-automation','coach-quickstart']);
  const hash = location.hash.slice(1);
  const requested = params.get('page');
  const coachIntent = params.get('entry') === 'coach' || params.get('workspace') === 'coach' || coachPages.has(requested) || coachPages.has(hash);
  // An old pending intent must not hijack a later journey visit.
  try { sessionStorage.removeItem('lellee_pending_entry'); } catch (_) {}
  try { localStorage.removeItem('lellee_pending_entry'); } catch (_) {}
  if (!coachIntent) return;
  const page = coachPages.has(hash) ? hash : coachPages.has(requested) ? requested : 'coach-dashboard';
  location.replace('/coaching/index.html#' + page);
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
