const LELLEE_SW_VERSION='lellee-root-routing-2026-08-27-v1';

self.addEventListener('install',event=>{
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;

  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  // Critical routing rule: navigations are network-only. The service worker
  // must never replace the public landing page with the authenticated Today app.
  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        return await fetch(request,{cache:'no-store'});
      }catch(_){
        const fallback=url.pathname.startsWith('/app')?'/index.html':'/landing.html';
        try{return await fetch(fallback,{cache:'no-store'})}
        catch(__){return new Response('Lellee is temporarily unavailable. Please reconnect and try again.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}})}
      }
    })());
    return;
  }

  // Keep public and app assets fresh while this routing repair is deployed.
  event.respondWith(fetch(request,{cache:'no-store'}).catch(()=>new Response('',{status:504})));
});

self.addEventListener('push',event=>{
  let payload={};
  try{payload=event.data?.json()||{}}catch(_){payload={body:event.data?.text()||''}}
  const title=payload.title||'Lellee';
  const options={
    body:payload.body||'You have a new Lellee update.',
    icon:payload.icon||'/icon-192.png',
    badge:payload.badge||'/icon-192.png',
    data:{url:payload.url||'/app'},
    tag:payload.tag||'lellee-update'
  };
  event.waitUntil(self.registration.showNotification(title,options));
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=event.notification?.data?.url||'/app';
  event.waitUntil((async()=>{
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of windows){
      if('focus' in client){await client.navigate(target);return client.focus()}
    }
    return self.clients.openWindow(target);
  })());
});
