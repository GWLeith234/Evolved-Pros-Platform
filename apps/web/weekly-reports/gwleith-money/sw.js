// Weekly report PWA. Shell is cache-first. report.json is network-first.
const CACHE = 'gwleith-money-shell-20260926215000';
const BASE = '/admin/reports/gwleith-money/';
const SHELL = [BASE, BASE + 'index.html', BASE + 'manifest.webmanifest', BASE + 'icon.svg', BASE + 'icon-192.png', BASE + 'icon-512.png'];

function cacheable(res) {
  if (!res || !res.ok || res.redirected || res.type === 'opaqueredirect') return false;
  if (res.status < 200 || res.status >= 300) return false;
  return true;
}

self.addEventListener('install', function (event) {
  event.waitUntil((async function () {
    var cache = await caches.open(CACHE);
    await Promise.all(SHELL.map(async function (url) {
      try {
        var res = await fetch(url, { credentials: 'same-origin', redirect: 'manual', cache: 'no-store' });
        if (!cacheable(res)) return;
        await cache.put(url, res);
      } catch (err) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) { return key !== CACHE; }).map(function (key) { return caches.delete(key); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.endsWith('/report.json')) {
    event.respondWith((async function () {
      try {
        var res = await fetch(event.request, { credentials: 'same-origin', redirect: 'manual', cache: 'no-store' });
        var ct = res.headers.get('content-type') || '';
        if (!cacheable(res) || ct.indexOf('json') === -1) throw new Error('not report json');
        var copy = res.clone();
        var cache = await caches.open(CACHE);
        await cache.put(BASE + 'report.json', copy);
        return res;
      } catch (err) {
        var hit = await caches.match(BASE + 'report.json');
        if (hit) return hit;
        return new Response(JSON.stringify({ error: 'unavailable' }), {
          status: 504,
          headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store' },
        });
      }
    })());
    return;
  }
  event.respondWith((async function () {
    var hit = await caches.match(event.request, { ignoreSearch: true });
    if (hit) return hit;
    return fetch(event.request, { credentials: 'same-origin', redirect: 'manual' });
  })());
});
