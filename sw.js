// Service worker: guarda los archivos de la app para abrirla sin señal.
// Si cambias index.html en el futuro, sube el número de versión para forzar la actualización.
const CACHE = 'gastos-v1';
const ARCHIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARCHIVOS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (ks) {
        return Promise.all(ks.filter(function (k) { return k !== CACHE; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

// Muestra lo guardado al instante y actualiza en segundo plano cuando hay red.
// Las peticiones al puente de Google (otro dominio) no pasan por aquí.
self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (guardado) {
      const red = fetch(req)
        .then(function (res) {
          const copia = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copia); });
          return res;
        })
        .catch(function () { return guardado; });
      return guardado || red;
    })
  );
});
