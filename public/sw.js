// Minimal service worker. Its presence (with a fetch handler) is what makes
// the app installable; we don't do offline caching beyond a pass-through.
const VERSION = 'zull-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', (event) => {
  // network-first; let the browser handle caching as normal.
  event.respondWith(fetch(event.request).catch(() => new Response('', { status: 504 })))
})
self.addEventListener('message', (e) => { if (e.data === 'version') e.source.postMessage(VERSION) })
