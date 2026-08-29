const LELLEE_SW_VERSION='lellee-header-plans-plus-pricing-2026-08-29-v6';
self.addEventListener('install',event=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const names=await caches.keys();
  await Promise.all(names.map(name=>caches.delete(name)));
  await self.clients.claim();
})()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request,{cache:'no-store'}).catch(async()=>{
      const fallback=url.pathname.startsWith('/app')?'/index.html':'/landing.html';
      try{return await fetch(fallback,{cache:'no-store'})}
      catch(_){return new Response('Lellee is temporarily unavailable.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}})}
    }));
    return;
  }
  event.respondWith(fetch(request,{cache:'no-store'}).catch(()=>new Response('',{status:504})));
});
self.addEventListener('push',event=>{
  let p={};try{p=event.data?.json()||{}}catch(_){p={body:event.data?.text()||''}}
  event.waitUntil(self.registration.showNotification(p.title||'Lellee',{
    body:p.body||'You have a new Lellee update.',
    icon:p.icon||'/icon-192.png',badge:p.badge||'/icon-192.png',
    data:{url:p.url||'/app'},tag:p.tag||'lellee-update'
  }));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=event.notification?.data?.url||'/app';
  event.waitUntil((async()=>{
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of windows){if('focus' in client){await client.navigate(target);return client.focus()}}
    return self.clients.openWindow(target);
  })());
});
