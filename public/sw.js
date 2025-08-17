
const CACHE_NAME = 'clucksmart-cache-v1';
const urlsToCache = [
  '/',
  '/fallback.html' 
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // The fallback page is crucial for offline functionality
        fetch('fallback.html').then(response => {
          if (response.ok) {
            cache.add('fallback.html');
          }
        });
        return cache.addAll(urlsToCache.filter(url => url !== '/fallback.html'));
      })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            return preloadResponse;
          }
          const networkResponse = await fetch(event.request);
          return networkResponse;
        } catch (error) {
          console.log('Fetch failed; returning offline page instead.', error);
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match('fallback.html');
          return cachedResponse;
        }
      })()
    );
  } else {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
  }
});


self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
