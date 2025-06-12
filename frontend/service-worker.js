// service-worker.js

const CACHE_NAME = 'draw-vote-shell-v1';
const SHELL_FILES = [
  '/',                // your index.html
  '/index.html',
  '/src/index.css',
  '/manifest.json'
  // list any other static assets you want offline
];


self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES))
  );
});


self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
});


self.addEventListener('fetch', evt => {
  const url = new URL(evt.request.url);


  if (
    url.pathname.endsWith('.js')  ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.json')||
    url.pathname.includes('/socket.io/')
  ) {
    return evt.respondWith(fetch(evt.request));
  }


  evt.respondWith(
    caches.match(evt.request).then(cached =>
      cached || fetch(evt.request)
    )
  );
});
