(() => {
  'use strict';

  const params=new URLSearchParams(location.search);
  if(params.get('entry')!=='organization') return;

  function ctx(){return window.LelleeAuthContext?.client?window.LelleeAuthContext:null}
  function pageClick(p){const e=document.querySelector(`[data-page="${p}"]`);if(e){e.click();return true}return false}
  function status(text,err=false){
    let n=document.getElementById('orgEntryStatus');
    if(!n){n=document.createElement('div');n.id='orgEntryStatus';n.style.cssText='position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:10060;max-width:min(700px,calc(100% - 28px));padding:10px 14px;border-radius:999px;font:700 12px/1.35 Inter,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.14)';document.body.appendChild(n)}
    n.style.background=err?'#fff3f5':'#f1f5fb';n.style.color=err?'#8a3f50':'#29456d';n.style.border=err?'1px solid #eccbd2':'1px solid #d3dfef';n.textContent=text;
  }
  function setCopy(){
    const t=document.getElementById('authTitle'),m=document.getElementById('authMsg');
    if(t)t.textContent='Organization Log In';
    if(m)m.textContent='Sign in to open or create your organization workspace.';
  }

  async function route(){
    const c=ctx(),u=c?.getCurrentUser?.();if(!c||!u)return false;
    status('Opening your organization workspace…');
    try{
      const r=await c.client.from('organization_members').select('organization_id,role,status').eq('user_id',u.id).eq('status','active').limit(1);
      if(r.error){
        if(r.error.code==='42P01'||/does not exist|not found/i.test(r.error.message||'')){
          status('Organization foundation is not installed yet. Run the Organization Foundation + Live Dashboard SQL.',true);
          pageClick('organization-setup');return true;
        }
        throw r.error;
      }
      if(r.data?.[0]?.organization_id){
        pageClick('organization-dashboard');
        status('Organization Dashboard opened.');
      }else{
        pageClick('organization-setup');
        status('Create or complete your organization profile.');
      }
      try{history.replaceState({},'',location.pathname+location.hash)}catch(_){}
      setTimeout(()=>document.getElementById('orgEntryStatus')?.remove(),4200);
      return true;
    }catch(err){
      console.error(err);status('Could not open the organization workspace.',true);return true;
    }
  }

  function boot(){
    setCopy();
    let tries=0;
    const t=setInterval(async()=>{
      tries++;setCopy();
      const done=await route();
      if(done||tries>240)clearInterval(t);
    },250);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();