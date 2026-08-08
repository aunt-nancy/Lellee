const CACHE='lellee-v1-rc1-20260807';
const SHELL=['/app','/index.html','/group-a-core.css','/group-a-core.js','/group-b-production.css','/group-b-production.js','/manifest.webmanifest','/icon-192.png','/icon-512.png','/privacy.html','/terms.html','/safety.html'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL).catch(()=>{})));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);
 if(e.request.method!=='GET')return;
 if(u.hostname.includes('supabase.co')||u.pathname.includes('/functions/v1/'))return;
 if(e.request.mode==='navigate'){
   e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put('/index.html',copy));return r}).catch(()=>caches.match('/index.html')));
   return;
 }
 e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r})));
});
self.addEventListener('push',e=>{
 let d={};try{d=e.data?e.data.json():{}}catch(err){d={body:e.data?.text?.()||''}}
 const page=d.page||'today';
 const options={body:d.body||'You have a recovery reminder.',icon:'/icon-192.png',badge:'/icon-192.png',tag:d.tag||'lellee-reminder',renotify:false,data:{url:`/app?page=${encodeURIComponent(page)}`}};
 e.waitUntil(self.registration.showNotification(d.title||'Lellee',options));
});
self.addEventListener('notificationclick',e=>{
 e.notification.close();const url=e.notification.data?.url||'/app';
 e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(ws=>{for(const w of ws){if('focus'in w){w.navigate(url);return w.focus()}}return clients.openWindow(url)}));
});
