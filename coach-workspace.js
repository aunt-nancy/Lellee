(() => {
  'use strict';

  const SUPABASE_URL='https://hkrrxscyhtxmbvxevfkw.supabase.co';
  const SUPABASE_KEY='sb_publishable_QPwVWU-qNnc3GJb_FoFnlQ_kEHa3dtU';
  const $=s=>document.querySelector(s);
  const $$=s=>Array.from(document.querySelectorAll(s));
  const PAGE_TITLES={
    'coach-dashboard':'Dashboard',
    'coach-business':'Practice Setup',
    'coach-cohorts':'Group Programs',
    'coach-scheduler':'Schedule & CRM',
    'coach-credentials':'Credentials & Training',
    'coach-analytics':'Analytics',
    'coach-revenue':'Revenue',
    'coach-automation':'Automation',
    'coach-quickstart':'Quick Start'
  };
  const VALID_PAGES=new Set(Object.keys(PAGE_TITLES));
  const MODULES=[
    '/coach-dashboard-live.js?v=20261005-shell1',
    '/coach-operations-completion.js?v=20261005-shell1',
    '/coach-marketplace.js?v=20261005-shell1',
    '/coach-pricing-service-ui.js?v=20261005-shell1',
    '/coach-pricing-operations-ui.js?v=20261005-shell1',
    '/coach-consultation-conversion-ui.js?v=20261005-shell1',
    '/coach-paid-operations-ui.js?v=20261005-shell1',
    '/coach-disclosure-acknowledgement-ui.js?v=20261005-shell1'
  ];
  const state={client:null,user:null,context:null,modulesReady:false};

  function toast(msg,bad=false){
    const t=$('#globalToast');
    if(!t)return;
    t.textContent=msg;
    t.style.background=bad?'#7f2634':'#213b38';
    t.classList.remove('hidden');
    clearTimeout(toast.timer);
    toast.timer=setTimeout(()=>t.classList.add('hidden'),2800);
  }

  function setLoading(text){
    const p=$('#coachWorkspaceLoadingText');
    if(p)p.textContent=text;
  }
  function hideLoading(){ $('#coachWorkspaceLoading')?.classList.add('hidden'); }

  function currentPage(){
    return $('.page.active')?.id?.replace(/^page-/,'')||'';
  }

  function syncNav(page){
    $$('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
    const title=$('#coachWorkspacePageTitle');
    if(title)title.textContent=PAGE_TITLES[page]||'Coaching Practice';
  }

  function showPage(page,opts={}){
    if(!VALID_PAGES.has(page))page='coach-dashboard';
    const target=$('#page-'+page);
    if(!target)return false;
    $$('.page').forEach(p=>p.classList.toggle('active',p===target));
    syncNav(page);
    if(!opts.noHash){
      try{history.replaceState(history.state,'',location.pathname+'#'+page)}catch(_){}
    }
    $('#coachWorkspaceSidebar')?.classList.remove('open');
    $('#coachWorkspaceMenu')?.setAttribute('aria-expanded','false');
    if(state.modulesReady){
      if(page==='coach-dashboard')window.LelleeCoachDashboardLive?.loadDashboard?.();
      if(page==='coach-business')window.LelleeCoachDashboardLive?.loadBusinessPage?.();
      if(['coach-analytics','coach-revenue','coach-scheduler','coach-automation','coach-credentials','coach-quickstart'].includes(page)){
        window.LelleeCoachOperationsCompletion?.loadPage?.(page);
      }
    }
    document.dispatchEvent(new CustomEvent('lellee:coachpagechange',{detail:{page}}));
    return true;
  }
  window.showPage=showPage;
  window.LelleeNavigatePage=showPage;

  function openDashboardTab(tab){
    showPage('coach-dashboard');
    setTimeout(()=>{
      const b=document.querySelector('[data-coach-tab="'+tab+'"]');
      if(b)b.click();
    },80);
  }

  function bindShell(){
    document.addEventListener('click',e=>{
      const page=e.target.closest?.('[data-page]');
      if(page){
        e.preventDefault();
        showPage(page.dataset.page);
        return;
      }
      const tab=e.target.closest?.('[data-workspace-tab]');
      if(tab){
        e.preventDefault();
        openDashboardTab(tab.dataset.workspaceTab);
      }
    });
    $('#coachWorkspaceMenu')?.addEventListener('click',()=>{
      const side=$('#coachWorkspaceSidebar');
      const open=side?.classList.toggle('open');
      $('#coachWorkspaceMenu')?.setAttribute('aria-expanded',String(!!open));
    });
    $('#coachWorkspaceSignOut')?.addEventListener('click',async()=>{
      try{await state.client?.auth?.signOut()}finally{location.replace('/coach.html')}
    });
    window.addEventListener('hashchange',()=>{
      const p=decodeURIComponent((location.hash||'').replace(/^#/,''));
      if(VALID_PAGES.has(p)&&p!==currentPage())showPage(p,{noHash:true});
    });
  }

  function setupCountPrivacy(){
    const key='lellee_coach_account_count_visible';
    const toggle=$('#coachAccountVisibilityToggle');
    const label=$('#coachAccountVisibilityLabel');
    const nodes=()=>[$('#coachMetricClients'),$('#coachRevenueClients')].filter(Boolean);
    function apply(){
      let visible=false;
      try{visible=sessionStorage.getItem(key)==='true'}catch(_){}
      if(toggle)toggle.checked=visible;
      if(label)label.textContent=visible?'On':'Off';
      nodes().forEach(n=>n.classList.toggle('coach-count-private',!visible));
    }
    toggle?.addEventListener('change',()=>{
      try{sessionStorage.setItem(key,toggle.checked?'true':'false')}catch(_){}
      apply();
    });
    const mo=new MutationObserver(apply);
    const root=$('.coach-workspace-content');
    if(root)mo.observe(root,{subtree:true,childList:true,characterData:true});
    apply();
  }

  function exposeAuth(client,user){
    state.client=client;state.user=user;
    sb=client;
    currentUser=user;
    window.sb=client;
    window.currentUser=user;
    window.supabaseClient=client;
    window.LelleeAuthContext={
      client,
      getCurrentUser:()=>state.user,
      getSession:()=>client.auth.getSession()
    };
    const account=$('#coachWorkspaceAccount');
    if(account)account.textContent=user.email||'Signed in';
  }

  async function refreshContext(){
    if(!state.client)return null;
    const {data,error}=await state.client.rpc('get_my_coach_dashboard_context');
    if(error)throw error;
    state.context=data||{};
    loadTaxProfile(state.context?.business||null);
    return state.context;
  }

  function loadTaxProfile(b){
    if(!b)return;
    const set=(id,v)=>{const el=$(id);if(el&&v!=null)el.value=v};
    set('#coachTaxLegalName',b.legal_business_name||b.business_name||'');
    set('#coachTaxEntityType',b.business_entity_type||'sole_proprietor');
    set('#coachTaxClassification',b.business_tax_classification||'');
    set('#coachTaxIdType',b.tax_id_type||'ein');
    set('#coachTaxLast4',b.tax_id_last4||'');
    set('#coachTaxAddress1',b.business_address_line1||'');
    set('#coachTaxAddress2',b.business_address_line2||'');
    set('#coachTaxCity',b.business_city||'');
    set('#coachTaxState',b.business_state||'');
    set('#coachTaxPostal',b.business_postal_code||'');
    const status=$('#coachTaxStatus');
    if(status)status.textContent=b.tax_id_attested?(b.tax_id_last4?'Saved · ending '+b.tax_id_last4:'Saved'):'Not completed';
  }

  async function saveTaxProfile(){
    if(!state.client)return;
    const last4=$('#coachTaxLast4')?.value.trim()||'';
    if(!/^\d{4}$/.test(last4))return toast('Enter only the last four digits of the tax ID.',true);
    const args={
      p_legal_business_name:$('#coachTaxLegalName')?.value.trim()||'',
      p_business_entity_type:$('#coachTaxEntityType')?.value||'',
      p_business_tax_classification:$('#coachTaxClassification')?.value.trim()||'',
      p_tax_id_type:$('#coachTaxIdType')?.value||'',
      p_tax_id_last4:last4,
      p_business_address_line1:$('#coachTaxAddress1')?.value.trim()||'',
      p_business_city:$('#coachTaxCity')?.value.trim()||'',
      p_business_state:$('#coachTaxState')?.value.trim()||'',
      p_business_postal_code:$('#coachTaxPostal')?.value.trim()||'',
      p_business_address_line2:$('#coachTaxAddress2')?.value.trim()||null,
      p_tax_id_token:null
    };
    const btn=$('#saveCoachTaxProfile');
    if(btn)btn.disabled=true;
    try{
      const {error}=await state.client.rpc('upsert_my_coach_business_tax_profile',args);
      if(error)throw error;
      await refreshContext();
      toast('Practice identity profile saved.');
    }catch(err){
      toast(err.message||'Could not save identity profile.',true);
    }finally{
      if(btn)btn.disabled=false;
    }
  }

  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src=src;s.defer=true;
      s.onload=()=>resolve();s.onerror=()=>reject(new Error('Could not load '+src));
      document.body.appendChild(s);
    });
  }

  async function loadModules(){
    for(const src of MODULES)await loadScript(src);
    state.modulesReady=true;
  }

  async function boot(){
    bindShell();
    setupCountPrivacy();
    $('#saveCoachTaxProfile')?.addEventListener('click',saveTaxProfile);
    try{
      if(!window.supabase?.createClient)throw new Error('Secure Coaching sign-in service did not load.');
      const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
      const {data,error}=await client.auth.getSession();
      if(error)throw error;
      const user=data?.session?.user;
      if(!user){
        location.replace('/coach-login.html?return='+encodeURIComponent('/coach-workspace.html'));
        return;
      }
      exposeAuth(client,user);
      setLoading('Loading your Coaching Practice…');
      let ctx=null;
      try{ctx=await refreshContext()}catch(err){console.warn('Coach context',err)}
      let requested='';
      try{requested=decodeURIComponent((location.hash||'').replace(/^#/,''))}catch(_){requested=(location.hash||'').replace(/^#/,'')}
      const initial=VALID_PAGES.has(requested)?requested:(ctx?.business?'coach-dashboard':'coach-business');
      showPage(initial,{noHash:false});
      hideLoading();
      loadModules().then(()=>{
        if(initial==='coach-dashboard')window.LelleeCoachDashboardLive?.loadDashboard?.();
        if(initial==='coach-business')window.LelleeCoachDashboardLive?.loadBusinessPage?.();
        if(['coach-analytics','coach-revenue','coach-scheduler','coach-automation','coach-credentials','coach-quickstart'].includes(initial)){
          window.LelleeCoachOperationsCompletion?.loadPage?.(initial);
        }
      }).catch(err=>{
        console.error(err);
        toast('Some Coaching tools did not finish loading. Refresh once if needed.',true);
      });
      client.auth.onAuthStateChange((event,session)=>{
        state.user=session?.user||null;
        window.currentUser=state.user;
        if(event==='SIGNED_OUT'||!session)location.replace('/coach.html');
      });
    }catch(err){
      console.error(err);
      setLoading(err.message||'Could not open Coaching Practice.');
      const card=$('.coach-workspace-loading-card');
      if(card&&!$('#coachWorkspaceRetry')){
        const b=document.createElement('button');
        b.id='coachWorkspaceRetry';b.textContent='Try Again';
        b.style.cssText='border:0;border-radius:9px;background:#0d3b39;color:#fff;padding:9px 13px;font-weight:800';
        b.onclick=()=>location.reload();
        card.appendChild(b);
      }
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();