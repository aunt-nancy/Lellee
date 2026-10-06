/* Coaching-only index runtime. Consumer /app and index.html are not dependencies. */
(() => {
  'use strict';
  const VERSION='coaching-index-20261006-1';
  const HOME='/coaching/index.html';
  const DEFAULT_PAGE='coach-dashboard';
  const SUPABASE_URL='https://hkrrxscyhtxmbvxevfkw.supabase.co';
  const SUPABASE_KEY='sb_publishable_QPwVWU-qNnc3GJb_FoFnlQ_kEHa3dtU';
  const $=s=>document.querySelector(s);
  const $$=s=>Array.from(document.querySelectorAll(s));
  const TITLES={
    'coach-dashboard':'Dashboard','coach-business':'Practice Setup',
    'coach-cohorts':'Group Programs','coach-scheduler':'Schedule & CRM',
    'coach-credentials':'Credentials & Training','coach-analytics':'Analytics',
    'coach-revenue':'Revenue','coach-automation':'Automation','coach-quickstart':'Quick Start'
  };
  const VALID=new Set(Object.keys(TITLES));
  const OPERATIONS=new Set(['coach-analytics','coach-revenue','coach-scheduler','coach-automation','coach-credentials','coach-quickstart']);
  const state={client:null,user:null,context:null,contextKnown:false,ready:false,sequence:0};
  const scripts=new Map();
  let countVisible=false;
  let authSubscription=null;

  function text(selector,value){const el=$(selector);if(el&&el.textContent!==value)el.textContent=value;}
  function toast(message,bad=false){
    const t=$('#globalToast');if(!t)return;
    t.textContent=message;t.style.background=bad?'#7f2634':'#213b38';t.classList.remove('hidden');
    clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.add('hidden'),3500);
  }
  function bounded(promise,label,milliseconds=12000){
    let timer;
    return Promise.race([Promise.resolve(promise),new Promise((_,reject)=>{
      timer=setTimeout(()=>reject(new Error(label+' timed out. No private workspace was opened.')),milliseconds);
    })]).finally(()=>clearTimeout(timer));
  }
  function requestedPage(){try{const h=decodeURIComponent(location.hash.slice(1));return VALID.has(h)?h:DEFAULT_PAGE;}catch(_){return DEFAULT_PAGE;}}
  function activePage(){return $('.page.active')?.id?.replace(/^page-/,'')||'';}
  function login(){location.replace('/coach-login.html?return='+encodeURIComponent(HOME+'#'+requestedPage()));}
  function hasPractice(){return !!(state.context?.has_business||state.context?.business?.id);}
  function setupNotice(){
    let notice=$('#coachingSetupNotice');
    if(!notice){
      notice=document.createElement('p');notice.id='coachingSetupNotice';notice.className='coach-guardrail';
      $('#page-coach-dashboard .approved-inner-head')?.after(notice);
    }
    notice.textContent='Welcome to your Coaching dashboard. Choose Practice Setup to complete your practice profile. Client tools remain unavailable until the required setup is complete.';
    text('#coachReadinessGrid','Practice setup not completed.');
  }
  function countPrivacy(){
    try{countVisible=sessionStorage.getItem('lellee_coach_account_count_visible')==='true';}catch(_){}
    const toggle=$('#coachAccountVisibilityToggle');
    if(toggle){toggle.checked=countVisible;toggle.setAttribute('aria-label','Show coaching account counts');}
    const apply=()=>{
      text('#coachAccountVisibilityLabel',countVisible?'On':'Off');
      ['#coachMetricClients','#coachRevenueClients','#coachAnalyticsClients'].forEach(selector=>{
        $(selector)?.classList.toggle('coach-count-private',!countVisible);
      });
    };
    toggle?.addEventListener('change',()=>{
      countVisible=toggle.checked;
      try{sessionStorage.setItem('lellee_coach_account_count_visible',String(countVisible));}catch(_){}
      apply();
    });
    // The old subtree observer rewrote its own label on every mutation.
    // These count elements retain their classes when their values change.
    // No DOM observer, polling, or authentication side effect is needed.
    apply();
  }
  function activate(page){
    if(!state.user)return false;
    if(!VALID.has(page))return false;
    const target=$('#page-'+page);if(!target)return false;
    $$('.page').forEach(p=>p.classList.toggle('active',p===target));
    $$('.coach-workspace-nav [data-page]').forEach(b=>{
      const active=b.dataset.page===page;b.classList.toggle('active',active);
      if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
    });
    text('#coachWorkspacePageTitle',TITLES[page]);
    history.replaceState(history.state,'',HOME+'#'+page);
    $('#coachWorkspaceSidebar')?.classList.remove('open');
    $('#coachWorkspaceMenu')?.setAttribute('aria-expanded','false');
    return true;
  }
  function loadScript(src){
    if(scripts.has(src))return scripts.get(src);
    const pending=new Promise((resolve,reject)=>{
      const s=document.createElement('script');let timer;
      const finish=(error)=>{
        clearTimeout(timer);s.onload=null;s.onerror=null;
        if(error){s.remove();scripts.delete(src);reject(error);}else resolve();
      };
      s.src=src;s.async=false;
      s.onload=()=>finish();s.onerror=()=>finish(new Error('A Coaching tool could not load: '+src));
      timer=setTimeout(()=>finish(new Error('A Coaching tool took too long to load: '+src)),12000);
      document.head.appendChild(s);
    });
    scripts.set(src,pending);return pending;
  }
  async function loadSupabase(){
    if(!window.supabase?.createClient)await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    if(!window.supabase?.createClient)throw new Error('Secure Coaching sign-in did not initialize.');
    return window.supabase;
  }
  async function refreshContext(){
    const {data,error}=await bounded(state.client.rpc('get_my_coach_dashboard_context'),'Coaching profile');
    if(error)throw error;
    state.context=data||{};state.contextKnown=true;loadTaxProfile(state.context.business);
    return state.context;
  }
  function loadTaxProfile(b){
    if(!b)return;
    const fields={coachTaxLegalName:b.legal_business_name||b.business_name||'',coachTaxEntityType:b.business_entity_type||'sole_proprietor',coachTaxClassification:b.business_tax_classification||'',coachTaxIdType:b.tax_id_type||'ein',coachTaxLast4:b.tax_id_last4||'',coachTaxAddress1:b.business_address_line1||'',coachTaxAddress2:b.business_address_line2||'',coachTaxCity:b.business_city||'',coachTaxState:b.business_state||'',coachTaxPostal:b.business_postal_code||''};
    Object.entries(fields).forEach(([id,value])=>{const el=document.getElementById(id);if(el)el.value=value;});
    text('#coachTaxStatus',b.tax_id_attested?'Saved':'Not completed');
  }
  async function saveTaxProfile(){
    if(!state.user)return;
    const value=id=>document.getElementById(id)?.value.trim()||'';
    const last4=value('coachTaxLast4');
    if(!/^\d{4}$/.test(last4))return toast('Enter only the last four digits of the tax ID.',true);
    const btn=$('#saveCoachTaxProfile');if(btn)btn.disabled=true;
    try{
      const {error}=await state.client.rpc('upsert_my_coach_business_tax_profile',{
        p_legal_business_name:value('coachTaxLegalName'),p_business_entity_type:value('coachTaxEntityType'),
        p_business_tax_classification:value('coachTaxClassification'),p_tax_id_type:value('coachTaxIdType'),
        p_tax_id_last4:last4,p_business_address_line1:value('coachTaxAddress1'),
        p_business_city:value('coachTaxCity'),p_business_state:value('coachTaxState'),
        p_business_postal_code:value('coachTaxPostal'),p_business_address_line2:value('coachTaxAddress2')||null,
        p_tax_id_token:state.context?.business?.tax_id_token||null
      });
      if(error)throw error;await refreshContext();toast('Practice identity profile saved.');
    }catch(error){toast(error.message||'Could not save identity profile.',true);}
    finally{if(btn)btn.disabled=false;}
  }
  function dashboardTab(tab){
    if(!['clients','groups','services','messages','assignments','leads'].includes(tab))return;
    $$('[data-coach-tab]').forEach(b=>b.classList.toggle('active',b.dataset.coachTab===tab));
    ['clients','groups','services','messages','assignments','leads'].forEach(name=>{
      $('#coachPanel'+name[0].toUpperCase()+name.slice(1))?.classList.toggle('hidden',name!==tab);
    });
  }
  async function toolsFor(page){
    const base='/coach-dashboard-live.js?v=20261005-shell1';
    const ops='/coach-operations-completion.js?v=20261005-shell1';
    // Reuse Coaching-only feature bundles, never the consumer runtime.
    if(page==='coach-dashboard'||page==='coach-business'){
      const fresh=!scripts.has(base);await loadScript(base);
      if(!fresh){
        if(page==='coach-dashboard')await window.LelleeCoachDashboardLive?.loadDashboard?.();
        else await window.LelleeCoachDashboardLive?.loadBusinessPage?.();
      }
      // On first load the existing bundle's bounded bootstrap hydrates the active page.
    }else if(OPERATIONS.has(page)){
      const fresh=!scripts.has(ops);await loadScript(ops);
      if(!fresh)await window.LelleeCoachOperationsCompletion?.loadPage?.(page);
    }else if(page==='coach-cohorts'){
      await loadScript('/coach-marketplace.js?v=20261005-shell1');
      // This legacy Coaching-only bundle owns cohort loading through its page hook.
      if(window.showPage!==featureNavigate)window.showPage(page);
    }
    if(page==='coach-dashboard')await loadScript('/coach-pricing-service-ui.js?v=20261005-shell1');
    if(page==='coach-revenue'||page==='coach-scheduler')await loadScript('/coach-pricing-operations-ui.js?v=20261005-shell1');
    if(page==='coach-scheduler')await loadScript('/coach-consultation-conversion-ui.js?v=20261005-shell1');
    if(page==='coach-dashboard')await loadScript('/coach-paid-operations-ui.js?v=20261005-shell1');
  }
  let cohortHook=false;
  function featureNavigate(page){
    // Feature callbacks stay inside the Coaching index; unsupported destinations
    // never become /app, Recovery, or the public marketing page.
    if(cohortHook)return activate(page);
    void navigate(page);return VALID.has(page);
  }
  async function navigate(page,{tab=null}={}){
    if(!state.user||!VALID.has(page))return false;
    const sequence=++state.sequence;
    activate(page);
    if(tab)dashboardTab(tab);
    try{
      if(!state.contextKnown||!hasPractice())await refreshContext();
      if(sequence!==state.sequence)return false;
      if(!hasPractice()&&page!=='coach-business'){
        if(page==='coach-dashboard')setupNotice();
        else toast('Complete Practice Setup before using this tool.');
        return true;
      }
      $('#coachingSetupNotice')?.remove();
      if(page==='coach-cohorts')cohortHook=true;
      try{await toolsFor(page);}finally{cohortHook=false;}
      if(sequence===state.sequence&&tab)dashboardTab(tab);
      return true;
    }catch(error){
      if(sequence===state.sequence)toast(error.message||'This Coaching tool could not load.',true);
      return false;
    }
  }
  function hidePrivate(){
    state.user=null;state.ready=false;window.currentUser=null;
    $('.coach-workspace-shell')?.setAttribute('hidden','');
    $('.coach-workspace-shell')?.setAttribute('inert','');
    $$('.page').forEach(p=>p.classList.remove('active'));
  }
  function failure(error){
    hidePrivate();text('#coachWorkspaceLoadingText',error.message||'Coaching could not open.');
    const card=$('.coach-workspace-loading-card');
    if(card&&!$('#coachingRetry')){
      const button=document.createElement('button');button.id='coachingRetry';button.type='button';button.className='approved-small-action';button.textContent='Try Again';button.onclick=()=>location.reload();card.appendChild(button);
      const link=document.createElement('a');link.href='/coach-login.html';link.textContent='Back to Coaching login';link.className='approved-link';card.appendChild(link);
    }
  }
  function bind(){
    document.addEventListener('click',e=>{
      const button=e.target.closest?.('[data-page]');
      if(button){e.preventDefault();void navigate(button.dataset.page);return;}
      const tab=e.target.closest?.('[data-workspace-tab]');
      if(tab){e.preventDefault();void navigate(DEFAULT_PAGE,{tab:tab.dataset.workspaceTab});return;}
      const ownTab=e.target.closest?.('[data-coach-tab]');if(ownTab)dashboardTab(ownTab.dataset.coachTab);
    });
    $('#coachWorkspaceMenu')?.addEventListener('click',()=>{
      const open=$('#coachWorkspaceSidebar')?.classList.toggle('open');
      $('#coachWorkspaceMenu')?.setAttribute('aria-expanded',String(!!open));
    });
    $('#coachWorkspaceSignOut')?.addEventListener('click',async()=>{
      try{
        const result=await bounded(state.client.auth.signOut({scope:'local'}),'Sign out');
        if(result.error)throw result.error;hidePrivate();location.replace('/coach-login.html');
      }catch(error){toast(error.message||'Sign out did not complete.',true);}
    });
    $('#saveCoachTaxProfile')?.addEventListener('click',saveTaxProfile);
    window.addEventListener('hashchange',()=>{const page=requestedPage();if(page!==activePage())void navigate(page);});
    window.addEventListener('pagehide',()=>authSubscription?.unsubscribe(),{once:true});
  }
  async function boot(){
    bind();countPrivacy();
    try{
      text('#coachWorkspaceLoadingText','Connecting securely to Lellee Coaching…');
      const lib=await loadSupabase();
      const client=lib.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
      const session=await bounded(client.auth.getSession(),'Sign-in check');
      if(session.error)throw session.error;
      if(!session.data?.session?.user){login();return;}
      const verified=await bounded(client.auth.getUser(),'Sign-in verification');
      if(verified.error)throw verified.error;
      if(!verified.data?.user){login();return;}
      state.client=client;state.user=verified.data.user;
      window.sb=client;window.supabaseClient=client;window.currentUser=state.user;
      window.LelleeAuthContext={client,getCurrentUser:()=>state.user,getSession:()=>client.auth.getSession()};
      window.showPage=featureNavigate;window.LelleeNavigatePage=featureNavigate;
      text('#coachWorkspaceAccount',state.user.email||'Signed in');
      authSubscription=client.auth.onAuthStateChange((event,session)=>{
        if(event==='SIGNED_OUT'){hidePrivate();location.replace('/coach-login.html');return;}
        if(session?.user&&session.user.id!==state.user?.id){hidePrivate();location.replace(HOME);return;}
        if(session?.user){state.user=session.user;window.currentUser=state.user;}
      }).data?.subscription;
      await refreshContext();
      state.ready=true;
      document.documentElement.classList.remove('coaching-auth-pending');
      const shell=$('.coach-workspace-shell');shell?.removeAttribute('hidden');shell?.removeAttribute('inert');
      $('#coachWorkspaceLoading')?.classList.add('hidden');
      // Dashboard is the default even before a practice exists; setup is a user action.
      await navigate(requestedPage());
    }catch(error){failure(error);}
  }
  window.LelleeCoachingIndex={version:VERSION,home:HOME,get ready(){return state.ready;}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else void boot();
})();
