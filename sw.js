/* التقويم الهجري — Service Worker (network-first, auto-update)
   يجلب دائمًا أحدث نسخة من الشبكة عند توفّر الإنترنت،
   ويعود للنسخة المخزّنة فقط عند انقطاع الاتصال (أوفلاين). */
const VERSION = 'hijri-v4.1';
const CORE = ['./', './index.html', './manifest.json'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE).catch(() => {})));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith((async () => {
    try {
      const fresh = await fetch(req);
      const cache = await caches.open(VERSION);
      cache.put(req, fresh.clone()).catch(() => {});
      return fresh;
    } catch (err) {
      const cached = await caches.match(req);
      if (cached) return cached;
      if (req.mode === 'navigate') {
        const idx = await caches.match('./index.html');
        if (idx) return idx;
      }
      throw err;
    }
  })());
});
