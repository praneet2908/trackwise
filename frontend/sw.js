const CACHE = 'trackwise-v2';
const FILES = ['/', '/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Only intercept same-origin GET requests for caching.
  // Cross-origin (Supabase auth, Netlify functions) and non-GET requests
  // must pass through untouched, or auth/API calls break.
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});

self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  self.registration.showNotification(data.title || 'TrackWise', {
    body: data.body || 'Check your spending!',
    icon: '/icon-192.png',
    badge: '/icon-192.png'
  });
});