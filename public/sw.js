// Service Worker for GitHub Pages SPA support
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
