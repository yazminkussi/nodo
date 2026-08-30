/* NODO PWA Service Worker
   Estrategias:
   - App shell (navegaciones): network-first con fallback a caché (offline).
   - Estáticos (JS/CSS/imágenes): stale-while-revalidate.
   - Assets de marca (logo de comunidad en Supabase Storage u origen remoto):
     network-first con revalidación en background y cache-busting por versión,
     para que las PWAs instaladas muestren siempre el logo actualizado.
   - API/redes externas (no imagen/marca): solo red.
*/

const CACHE_VERSION = 'nodo-v3';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const BRAND_CACHE = `${CACHE_VERSION}-brand`;

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/imagenes/nodo_logo.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
];

// Orígenes considerados de "marca" (logo remoto, p.ej. Supabase Storage).
const ES_IMAGEN_BRAND = (url) =>
  url.pathname.match(/\.(png|jpe?g|webp|svg|avif)(\?.*)?$/i) &&
  url.hostname !== self.location.hostname;

const BUCKETS_BRAND_HINT = ['supabase.co', 'supabase.in'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.endsWith('-shell') ||
                key.endsWith('-static') ||
                key.endsWith('-brand') ||
                key === CACHE_VERSION
            )
            // Solo eliminamos las versiones anteriores (que comiencen con `nodo-`).
            .filter((key) => key !== APP_SHELL_CACHE && key !== STATIC_CACHE && key !== BRAND_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fuerza la revalidación en background de todos los assets de marca cacheados,
// para detectar un logo nuevo aunque el usuario no visite la página seguido.
async function revalidarAssetsMarca() {
  try {
    const cache = await caches.open(BRAND_CACHE);
    const claves = await cache.keys();
    await Promise.all(
      claves.map(async (req) => {
        try {
          const res = await fetch(req, { cache: 'no-store' });
          if (res && res.ok) await cache.put(req, res.clone());
        } catch {
          /* offline: se mantiene la versión cacheada */
        }
      })
    );
  } catch {
    /* ignore */
  }
}

// Revalidación periódica de marca (cada 45 min) mientras la PWA esté abierta.
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'nodo-brand-revalidate') {
    event.waitUntil(revalidarAssetsMarca());
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // --- Assets de marca remotos (logo de la comunidad en la nube) ---
  if (
    ES_IMAGEN_BRAND(url) ||
    BUCKETS_BRAND_HINT.some((h) => url.hostname.endsWith(h))
  ) {
    // tipo de petición de imagen/logo
    const esLogo =
      url.pathname.includes('logo') ||
      url.pathname.startsWith('/logos') ||
      ES_IMAGEN_BRAND(url);
    if (esLogo) {
      event.respondWith(
        fetch(request)
          .then((response) => {
            if (response && response.ok) {
              const copy = response.clone();
              caches.open(BRAND_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() =>
            caches.match(request).then((cached) => cached || fetch(request).catch(() => cached))
          )
      );
      return;
    }
  }

  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(APP_SHELL_CACHE).then((cache) => cache.put('/', copy));
          return response;
        })
        .catch(() =>
          caches.match('/').then((cached) => cached || caches.match('/index.html'))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
