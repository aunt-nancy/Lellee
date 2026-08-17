'use strict';
const CACHE_NAME = 'lellee-app-shell-v1.0.1-auth-stability';
const OFFLINE_URL = '/offline.html';
const APP_SHELL = [
  "/apple-touch-icon.png",
  "/consumer-health-privacy.html",
  "/customer-success.css",
  "/customer-success.js",
  "/data-governance.css",
  "/data-governance.js",
  "/executive-intelligence.css",
  "/executive-intelligence.js",
  "/finance-revenue-ops.css",
  "/finance-revenue-ops.js",
  "/index.html",
  "/landing.html",
  "/manifest.webmanifest",
  "/offline.html",
  "/physical-commerce.css",
  "/physical-commerce.js",
  "/privacy-center.html",
  "/privacy.html",
  "/product-discovery.css",
  "/product-discovery.js",
  "/pwa-icon-192.png",
  "/pwa-icon-512.png",
  "/safety.html",
  "/supply-chain.css",
  "/supply-chain.js",
  "/terms.html",
  "/universal-search.css",
  "/universal-search.js"
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('lellee-app-shell-') && k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function cacheableSameOrigin(request) {
  if (request.method !== 'GET') return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith('/api/')) return false;
  if (url.pathname.includes('/auth/')) return false;
  if (url.pathname.includes('/rest/')) return false;
  if (url.pathname.includes('/functions/')) return false;
  return true;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (!cacheableSameOrigin(request)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put('/index.html', clone));
          }
          return response;
        })
        .catch(async () => (await caches.match('/index.html')) || (await caches.match(OFFLINE_URL)))
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'CLEAR_LELLEE_CACHE') {
    event.waitUntil(
      caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('lellee-app-shell-')).map(k => caches.delete(k))))
    );
  }
});
