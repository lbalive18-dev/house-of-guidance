// House of Guidance — minimal offline cache.
// Caches the core shell so the site still opens with no connection;
// prayer times and Qur'an data still need network access to update.
const CACHE_NAME = 'hog-shell-v1';
const CORE_FILES = [
  '/',
  '/index.html',
  '/assets/css/style.css',
  '/assets/js/content.js',
  '/assets/js/app.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).catch(() => cached))
  );
});
