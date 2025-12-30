const CACHE_NAME = 'probarber-v2'; 
const urlsToCache = [
  '/pages/home.html',
  '/pages/login.html',
  '/css/styles.css',
  '/js/login.js',
  '/js/auth.js', 
  '/js/reservas.js',
  '/images/icon-192.png',
  '/images/icon-512.png'
];

self.addEventListener('install', event => {
  console.log('📦 Service Worker instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caché creado');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('Error creando caché:', err))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si está en caché, devolver
        if (response) {
          return response;
        }
        
        // Si no, hacer fetch y cachear si es exitoso
        return fetch(event.request).then(fetchResponse => {
          // Solo cachear respuestas válidas
          if (!fetchResponse || fetchResponse.status !== 200) {
            return fetchResponse;
          }
          
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return fetchResponse;
        });
      })
      .catch(err => {
        console.error('Error en fetch:', err);
        // Devolver página de error offline (opcional)
        return caches.match('/pages/offline.html');
      })
  );
});

// Limpiar cachés antiguos
self.addEventListener('activate', event => {
  console.log('Service Worker activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});