const CACHE = 'electrify-equipment-v8';
const ASSETS = ['./','./index.html','./styles.css','./app.js','./auth.js','./manifest.webmanifest','./assets/icon-192.png','./assets/icon-512.png','./assets/inverter-deye-single.webp','./assets/inverter-deye-three-sg04.webp','./assets/inverter-deye-three-sg05.webp','./assets/battery-deye-se-g5-1-pro-b.webp','./assets/battery-deye-se-g10-2.webp','./assets/datasheets/JKM710-735N-66HL5-BDV-Z3-EU.pdf','./assets/datasheets/JKM625-650N-66HL4M-BDV-Z1-EU.pdf'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin === self.location.origin && url.pathname.endsWith('/firebase-config.js')) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match('./index.html'))));
});
