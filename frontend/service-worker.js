const CACHE_NAME = 'draw-vote-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/index.css',
  '/manifest.json'
  // add other static assets here, e.g. '/icons/icon-192.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(URLS_TO_CACHE)
    )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
});

self.addEventListener('fetch', event => {
  const url = event.request.url;
  // Bypass the SW for any socket.io requests
  if (url.includes('/socket.io/')) {
    return event.respondWith(fetch(event.request));
  }
  // Otherwise, respond from cache or network
  event.respondWith(
    caches.match(event.request).then(response =>
      response || fetch(event.request)
    )
  );
});
