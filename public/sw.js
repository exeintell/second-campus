// Service Worker for GitHub Pages SPA support + Push Notifications
// Rewrites dynamic route requests (UUIDs) to pre-rendered placeholder (_) paths

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const path = url.pathname;

  // UUID pattern
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

  if (!uuidPattern.test(path)) return;

  // Reset regex lastIndex
  uuidPattern.lastIndex = 0;

  // Replace all UUIDs with _
  const newPath = path.replace(uuidPattern, '_');
  if (newPath === path) return;

  const isFile = newPath.includes('.'); // .txt, .html, .js, .css etc.

  if (isFile) {
    // RSC payload (.txt) or HTML file - fetch rewritten path directly
    event.respondWith(fetch(new URL(newPath, url.origin)));
  } else {
    // Page navigation (no extension) - serve the .html file
    const htmlPath = (newPath.endsWith('/') ? newPath.slice(0, -1) : newPath) + '.html';
    event.respondWith(fetch(new URL(htmlPath, url.origin)));
  }
});

// Push notification received
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'SECOCAM', body: event.data.text() };
  }

  const title = data.title || 'SECOCAM';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: data.url || '/circles' },
    tag: data.tag || 'secocam-notification',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/circles';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if (new URL(client.url).pathname === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      for (const client of clients) {
        if ('focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
