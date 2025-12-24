const CACHE_NAME = 'probarber-v1';
const urlsToCache = [
  '/pages/home.html',
  '/pages/login.html',
  '/css/styles.css',
  '/js/login.js',
  '/js/reservas.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});