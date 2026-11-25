/* Сначала сеть, без сети - сохранённая копия. Так обновления приходят сразу, а без интернета приложение открывается. */
const CACHE = 'mbp-v3';
const FILES = ['./', './index.html', './app.css', './frac.js', './rat.js', './content.js', './content2.js', './content3.js', './content6a.js', './content6b.js', './grades.js', './engine.js', './ui.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const mine = url.origin === self.location.origin, fonts = /^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!mine && !fonts) return;
  e.respondWith(fetch(req).then(function (res) {
    if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(req).then(function (r) { return r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined); });
  }));
});
