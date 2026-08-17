
(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
let deferredInstallPrompt=null;
let waitingWorker=null;

function isStandalone(){
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true;
}
function platformHint(){
  const ua=navigator.userAgent||'';
  if(/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if(/Android/i.test(ua)) return 'android';
  return 'desktop';
}
function updateClientStatus(){
  const installed=isStandalone();
  if(q('#pwaInstallState')) q('#pwaInstallState').textContent=installed?'Installed':'Browser';
  if(q('#pwaNetworkState')) q('#pwaNetworkState').textContent=navigator.onLine?'Online':'Offline';
  if(q('#pwaWorkerState')) q('#pwaWorkerState').textContent=('serviceWorker' in navigator)?'Available':'Unsupported';
  const installBtn=q('#pwaInstallButton');
  const instructions=q('#pwaInstallInstructions');
  if(installBtn){
    installBtn.disabled=installed;
    installBtn.textContent=installed?'Lellee Installed':'Install Lellee';
  }
  if(instructions){
    const p=platformHint();
    if(installed) instructions.textContent='Lellee is already installed on this device.';
    else if(p==='ios') instructions.textContent='On iPhone or iPad: open the browser Share menu, then choose “Add to Home Screen.”';
    else if(deferredInstallPrompt) instructions.textContent='Your browser is ready to install Lellee.';
    else instructions.textContent='Use your browser’s Install App or Add to Home Screen option when available.';
  }
}

window.addEventListener('online',updateClientStatus);
window.addEventListener('offline',updateClientStatus);
window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;updateClientStatus()});
window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();
  deferredInstallPrompt=e;
  updateClientStatus();
});

q('#pwaInstallButton')?.addEventListener('click',async()=>{
  if(isStandalone()) return;
  if(deferredInstallPrompt){
    deferredInstallPrompt.prompt();
    try{await deferredInstallPrompt.userChoice}catch(_){}
    deferredInstallPrompt=null;
    updateClientStatus();
    return;
  }
  const p=platformHint();
  alert(p==='ios'
    ? 'On iPhone or iPad, use the browser Share menu and choose “Add to Home Screen.”'
    : 'Open your browser menu and choose “Install app” or “Add to Home Screen.”');
});

q('#pwaUpdateButton')?.addEventListener('click',()=>{
  if(waitingWorker){
    waitingWorker.postMessage({type:'SKIP_WAITING'});
    setTimeout(()=>location.reload(),500);
  }
});

async function registerWorker(){
  updateClientStatus();
  if(!('serviceWorker' in navigator)) return;
  try{
    const reg=await navigator.serviceWorker.register('/sw.js',{scope:'/'});
    if(q('#pwaWorkerState')) q('#pwaWorkerState').textContent='Ready';

    if(reg.waiting){
      waitingWorker=reg.waiting;
      q('#pwaUpdateButton')?.classList.remove('hidden');
      if(q('#pwaUpdateState')) q('#pwaUpdateState').textContent='Update ready';
    }

    reg.addEventListener('updatefound',()=>{
      const w=reg.installing;
      if(!w) return;
      w.addEventListener('statechange',()=>{
        if(w.state==='installed' && navigator.serviceWorker.controller){
          waitingWorker=reg.waiting||w;
          q('#pwaUpdateButton')?.classList.remove('hidden');
          if(q('#pwaUpdateState')) q('#pwaUpdateState').textContent='Update ready';
        }
      });
    });

    navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload());
  }catch(err){
    console.warn('Lellee service worker registration failed',err);
    if(q('#pwaWorkerState')) q('#pwaWorkerState').textContent='Unavailable';
  }
}

function row(icon,title,detail,status='',klass=''){
  return `<div class="pwa-admin-row ${klass}"><div class="pwa-admin-icon">${icon}</div><div><b>${esc(title)}</b><small>${esc(detail||'')}</small></div><em>${esc(status||'')}</em></div>`;
}
function setTab(tab){
  qa('[data-pwa-tab]').forEach(b=>b.classList.toggle('active',b.dataset.pwaTab===tab));
  ['release','checks','compatibility','updates','incidents','guardrails'].forEach(x=>q('#pwaPanel'+x[0].toUpperCase()+x.slice(1))?.classList.toggle('hidden',x!==tab));
}
async function loadOps(){
  if(typeof sb==='undefined') return;
  const {data,error}=await sb.rpc('get_pwa_operations_summary');
  if(error){console.warn(error);return}
  const s=data.summary||{};
  if(q('#pwaOpsVersion')) q('#pwaOpsVersion').textContent=s.current_version||'—';
  if(q('#pwaOpsChecks')) q('#pwaOpsChecks').textContent=s.checks_pass||0;
  if(q('#pwaOpsPlatforms')) q('#pwaOpsPlatforms').textContent=s.platforms||0;
  if(q('#pwaOpsIncidents')) q('#pwaOpsIncidents').textContent=s.open_incidents||0;
  q('#pwaReleaseList').innerHTML=(data.releases||[]).map(x=>row('V',x.version_label,`${x.status} · cache ${x.cache_name}`,x.released_label||'',x.status==='current'?'ok':'')).join('');
  q('#pwaCheckList').innerHTML=(data.checks||[]).map(x=>row('✓',x.label,x.detail,x.status,x.status==='pass'?'ok':x.status==='fail'?'attention':'')).join('');
  q('#pwaCompatibilityList').innerHTML=(data.compatibility||[]).map(x=>row('D',x.label,`${x.install_support} · offline ${x.offline_support}`,x.status)).join('');
  q('#pwaUpdateList').innerHTML=(data.updates||[]).map(x=>row('U',x.title,x.body,x.status,x.status==='active'?'ok':'')).join('');
  q('#pwaIncidentList').innerHTML=(data.incidents||[]).map(x=>row('!',x.title,`${x.severity} · ${x.status}`,x.area,x.status==='open'?'attention':'')).join('');
  q('#pwaGuardrailList').innerHTML=(data.guardrails||[]).map(x=>`<article class="pwa-guardrail"><b>${x.enabled?'✓ ':'! '}${esc(x.label)}</b><small>${esc(x.detail)}</small></article>`).join('');
}
qa('[data-pwa-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.pwaTab));

if(typeof showPage==='function'){
  const old=showPage;
  showPage=function(name){
    old(name);
    if(name==='install-lellee') updateClientStatus();
    if(name==='pwa-operations') loadOps();
  };
}
registerWorker();
})();
