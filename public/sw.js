const CACHE_NAME = 'cgt-pwa-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/site.webmanifest',
  '/globals.css',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/apple-touch-icon.png'
];

// Use a Stale-While-Revalidate strategy for HTML/Routes
// Use a Cache-First strategy for static JS/CSS/Assets

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
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip Firebase and external API calls
  if (url.origin !== self.location.origin) return;

  // For navigating routes, use Stale-While-Revalidate
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone());
          });
          return networkResponse;
        }).catch(() => cachedResponse); // Fallback to cache if network fails
        
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // For static assets, use Cache-First
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      return cachedResponse || fetch(request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});
