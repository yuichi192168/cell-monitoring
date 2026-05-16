const CACHE_NAME = 'cgt-pwa-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/members',
  '/settings',
  '/globals.css',
  '/site.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests for caching
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // For Firestore and Auth requests, let the SDK handle persistence
  if (url.hostname.includes('firestore.googleapis.com') || url.hostname.includes('firebaseauth.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Cache successful responses for static assets
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If fetch fails (offline), return the cached response if available
        return cachedResponse;
      });

      // Prefer network for pages (Network First), prefer cache for static assets (Cache First)
      const isPage = event.request.mode === 'navigate';
      return isPage ? fetchPromise.catch(() => cachedResponse) : (cachedResponse || fetchPromise);
    })
  );
});