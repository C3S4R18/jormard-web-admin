// Service Worker de Bodega Jormard
// Estrategia: la app (shell) se sirve rápido desde caché y se refresca en segundo plano.
// Las peticiones a Supabase NUNCA se cachean (los precios y el stock deben ser reales).

const CACHE = 'jormard-v1';
const APP_SHELL = [
  '/',
  '/cliente/catalogo',
  '/icon-192.png',
  '/icon-512.png',
  '/placeholder.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Datos en vivo: siempre a la red (nunca caché)
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/api/')) return;

  // Imágenes de productos: caché primero, y se guardan al vuelo
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((hit) =>
        hit ||
        fetch(request)
          .then((res) => {
            const copia = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copia)).catch(() => {});
            return res;
          })
          .catch(() => caches.match('/placeholder.png'))
      )
    );
    return;
  }

  // Navegación: red primero, caché si no hay internet
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copia)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match('/cliente/catalogo')))
    );
  }
});
