const CACHE_NAME = 'uptend-v4'; // Bumped version for UpTend rebrand
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache duration
const STATIC_ASSETS = [
  '/manifest.json',
  '/app-icon.png',
  '/favicon.png'
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
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Network-only for API calls (no caching)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'You are offline. Please check your connection.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Network-first strategy for HTML pages (always get fresh content)
  if (event.request.destination === 'document' ||
      event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the fresh response
          if (response.ok && url.origin === self.location.origin) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match('/') || new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  // Cache-first with expiration for static assets (images, fonts, CSS, JS)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Check if cached response is still fresh
      if (cachedResponse) {
        const cachedDate = new Date(cachedResponse.headers.get('date') || 0);
        const now = Date.now();
        const isFresh = (now - cachedDate.getTime()) < CACHE_DURATION;

        if (isFresh) {
          return cachedResponse;
        }
      }

      // Fetch fresh copy
      return fetch(event.request).then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // Return stale cache if network fails
        return cachedResponse || new Response('Offline', { status: 503 });
      });
    })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'UpTend';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    tag: data.tag || 'uptend-notification'
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(urlToOpen);
    })
  );
});
