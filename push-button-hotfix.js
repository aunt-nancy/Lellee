(()=>{
'use strict';

function q(s){ return document.querySelector(s); }

function pushNotice(message, isError=false){
  const t=q('#globalToast');
  if(t){
    t.textContent=message;
    t.classList.remove('hidden');
    if(isError) t.style.background='#7f2634';
    setTimeout(()=>{
      t.classList.add('hidden');
      t.style.background='';
    },4000);
  }else{
    alert(message);
  }
}

function urlBase64ToUint8Array(value){
  const clean=String(value||'').trim();
  const padding='='.repeat((4-clean.length%4)%4);
  const base64=(clean+padding).replace(/-/g,'+').replace(/_/g,'/');
  const raw=atob(base64);
  return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)));
}

function validVapidPublicKey(value){
  try{
    const bytes=urlBase64ToUint8Array(value);
    return bytes.length===65 && bytes[0]===4;
  }catch(e){
    return false;
  }
}

async function askNotificationPermission(){
  if(!('Notification' in window)){
    pushNotice('This browser does not support notifications.',true);
    return false;
  }
  if(Notification.permission==='granted') return true;
  const result=await Notification.requestPermission();
  const status=q('#notificationPermissionStatus');
  if(status) status.textContent=`Notification permission: ${result}.`;
  if(result!=='granted'){
    pushNotice('Notifications were not allowed on this device.',true);
    return false;
  }
  return true;
}

async function enableBackgroundPushHotfix(){
  const btn=q('#enableBackgroundPush');
  if(btn) btn.disabled=true;
  try{
    if(typeof currentUser==='undefined' || !currentUser){
      pushNotice('Please sign in before enabling background push.',true);
      return;
    }
    if(typeof sb==='undefined'){
      pushNotice('Lellee could not reach notification settings. Refresh and try again.',true);
      return;
    }
    if(!('serviceWorker' in navigator) || !('PushManager' in window)){
      pushNotice('Background push is not supported in this browser.',true);
      return;
    }
    if(!await askNotificationPermission()) return;

    const reg=await navigator.serviceWorker.ready;

    const {data:keyRow,error:keyError}=await sb
      .from('app_public_settings')
      .select('value')
      .eq('key','vapid_public_key')
      .maybeSingle();

    if(keyError) throw keyError;

    const publicKey=String(keyRow?.value||'').trim();
    if(!publicKey){
      pushNotice('The VAPID public key is not configured yet.',true);
      return;
    }

    if(!validVapidPublicKey(publicKey)){
      pushNotice('The stored VAPID public key is invalid. We can correct that next.',true);
      console.error('Lellee Push: invalid VAPID public key format. Decoded key must be a 65-byte uncompressed P-256 public key.');
      return;
    }

    let subscription=await reg.pushManager.getSubscription();
    if(!subscription){
      subscription=await reg.pushManager.subscribe({
        userVisibleOnly:true,
        applicationServerKey:urlBase64ToUint8Array(publicKey)
      });
    }

    const json=subscription.toJSON();
    const {error:saveError}=await sb.from('push_subscriptions').upsert({
      user_id:currentUser.id,
      endpoint:json.endpoint,
      p256dh:json.keys?.p256dh,
      auth:json.keys?.auth,
      user_agent:navigator.userAgent,
      enabled:true,
      updated_at:new Date().toISOString()
    },{onConflict:'endpoint'});

    if(saveError) throw saveError;

    pushNotice('Background push is enabled on this device.');
    const status=q('#notificationPermissionStatus');
    if(status) status.textContent='Background push is enabled on this device.';
  }catch(e){
    console.error('Lellee Background Push:',e);
    pushNotice(e?.message||String(e),true);
  }finally{
    if(btn) btn.disabled=false;
  }
}

function bind(){
  const btn=q('#enableBackgroundPush');
  if(!btn || btn.dataset.pushHotfixBound==='true') return;
  btn.dataset.pushHotfixBound='true';
  btn.addEventListener('click',enableBackgroundPushHotfix);
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',bind,{once:true});
}else{
  bind();
}
})();
