
const CACHE='lellee-shell-v1';
const SHELL=['/','/index.html','/manifest.webmanifest','/icon-192.png','/icon-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  const url=new URL(req.url);

  // Never cache Supabase/API/auth traffic.
  if(url.hostname.includes('supabase.co') || req.method!=='GET') return;

  if(req.mode==='navigate'){
    event.respondWith(
      fetch(req).then(res=>{
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put('/index.html',copy));
        return res;
      }).catch(()=>caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached=>cached || fetch(req).then(res=>{
      if(url.origin===location.origin){
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(req,copy));
      }
      return res;
    }))
  );
});


self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const page=event.notification.data?.page||'today';
  const url='/?page='+encodeURIComponent(page);
  event.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
      for(const client of list){
        if('focus' in client){
          client.postMessage({type:'LELLEE_OPEN_PAGE',page});
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener('push',event=>{
  let payload={title:'Lellee',body:'You have a recovery reminder.',page:'today',tag:'lellee-push'};
  try{ if(event.data) payload={...payload,...event.data.json()}; }catch{}
  event.waitUntil(
    self.registration.showNotification(payload.title,{
      body:payload.body,
      icon:'/icon-192.png',
      badge:'/icon-192.png',
      tag:payload.tag||'lellee-push',
      data:{page:payload.page||'today',reminder_id:payload.reminder_id||null}
    })
  );
});
