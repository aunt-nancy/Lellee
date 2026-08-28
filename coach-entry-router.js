(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  if (params.get('entry') !== 'coach') return;

  const ROUTE_KEY = 'lellee_pending_entry';
  try { sessionStorage.setItem(ROUTE_KEY, 'coach'); } catch (_) {}

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

  function clickPage(page){
    const el = document.querySelector(`[data-page="${page}"]`);
    if(!el) return false;
    el.click();
    return true;
  }

  async function resolveCoachDestination(){
    const ctx = window.LelleeAuthContext;
    const user = ctx?.getCurrentUser?.();
    if(!ctx?.client || !user) return false;

    const sb = ctx.client;
    showBanner('Opening your coaching workspace…');

    try{
      // If the restored Coach Business foundation is present and the signed-in
      // user already belongs to a business, prefer the Dashboard. Otherwise,
      // send them to the Business Setup/Application page.
      const membership = await sb
        .from('coach_business_members')
        .select('business_id,role,status')
        .eq('user_id', user.id)
        .eq('status','active')
        .limit(1);

      if(membership.error){
        // 42P01 / missing relation: keep the page usable and make the issue explicit.
        const code = membership.error.code || '';
        if(code === '42P01' || /does not exist|not found/i.test(membership.error.message || '')){
          showBanner('Coach Business setup is not installed in the database yet. Run the Coach Business Foundation Restore.', 'error');
          clickPage('coach-business');
          return true;
        }
        throw membership.error;
      }

      const businessId = membership.data?.[0]?.business_id;
      if(!businessId){
        clickPage('coach-business');
        showBanner('Complete your coaching business setup to continue.');
        return true;
      }

      const business = await sb
        .from('coach_businesses')
        .select('id,status,business_name,public_name')
        .eq('id', businessId)
        .maybeSingle();

      if(business.error) throw business.error;

      if(business.data?.status === 'approved'){
        clickPage('coach-dashboard');
        showBanner(`Coach Dashboard opened${business.data.business_name ? ': '+business.data.business_name : ''}.`);
      }else{
        clickPage('coach-business');
        const status = business.data?.status || 'setup';
        showBanner(`Coaching business status: ${status.replaceAll('_',' ')}. Opened Business Settings.`);
      }

      // Clean professional entry flag after successful routing without creating
      // a new history entry.
      try {
        sessionStorage.removeItem(ROUTE_KEY);
        const clean = location.pathname + location.hash;
        history.replaceState({}, '', clean);
      } catch (_) {}

      setTimeout(() => qs('#coachEntryStatus')?.remove(), 4200);
      return true;
    }catch(err){
      console.error('Coach entry routing failed', err);
      showBanner('Could not open the coaching workspace. Open Coach Business from the app settings and try again.', 'error');
      return true;
    }
  }

  function boot(){
    setCoachAuthCopy();

    let attempts = 0;
    const timer = setInterval(async () => {
      attempts += 1;

      // Keep coach-specific login wording while the sign-in overlay is visible.
      setCoachAuthCopy();

      const routed = await resolveCoachDestination();
      if(routed || attempts > 240){
        clearInterval(timer);
      }
    }, 250);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  }else{
    boot();
  }
})();