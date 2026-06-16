const CACHE = 'trackwise-v1';
const FILES = [
  '/',
  '/index.html'
];

// Install — cache the app
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES))
  );
});

// Fetch — serve from cache first
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});

// Push notifications
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  self.registration.showNotification(data.title || 'TrackWise', {
    body: data.body || 'Check your subscriptions!',
    });
});