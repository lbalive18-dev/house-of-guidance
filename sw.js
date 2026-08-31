// House of Guidance — Push Notification Service Worker
// -----------------------------------------------------------------------
// This service worker does exactly TWO things: receive a push message and
// handle a tap on the resulting notification. That's it.
//
// It deliberately has NO 'fetch' event listener — meaning it never
// intercepts page loads, never caches anything, and can never serve a
// stale version of the site. An earlier version of this site's service
// worker did cache aggressively and broke the whole site after a deploy.
// This one structurally cannot do that, because the capability simply
// isn't implemented here.
// -----------------------------------------------------------------------

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'House of Guidance', body: event.data ? event.data.text() : 'You have a reminder.' };
  }

  const title = data.title || 'House of Guidance';
  const options = {
    body: data.body || '',
    icon: data.icon || '/logo.png',
    badge: data.badge || '/logo.png',
    tag: data.tag || 'hog-notification',
    renotify: !!data.tag,
    vibrate: [120, 60, 120],
    data: { url: data.url || '/index.html#prayer-hub' }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/index.html#prayer-hub';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) client.navigate(targetUrl);
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
