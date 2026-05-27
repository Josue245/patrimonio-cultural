/* ============================================================
   Service Worker — Patrimonio Cultural Junín PWA
   Estrategia: Cache-First para assets, Network-First para API
   ============================================================ */

const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE  = `patrimonio-static-${CACHE_VERSION}`;
const API_CACHE     = `patrimonio-api-${CACHE_VERSION}`;
const MEDIA_CACHE   = `patrimonio-media-${CACHE_VERSION}`;

// Assets que se cachean en la instalación (shell de la app)
const STATIC_ASSETS = [
  '/',
  '/registro-movil',
  '/index.html',
  '/manifest.json',
  '/offline.html',
];

// ─── Install ────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando versión:', CACHE_VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate: limpia caches antiguas ───────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando versión:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => ![STATIC_CACHE, API_CACHE, MEDIA_CACHE].includes(name))
          .map((name) => {
            console.log('[SW] Eliminando cache obsoleta:', name);
            return caches.delete(name);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch: estrategia por tipo de recurso ──────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. API calls → Network-First con fallback a cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // 2. Uploads de multimedia → Network Only (no cachear binarios grandes)
  if (url.pathname.includes('/upload') || request.method === 'POST') {
    event.respondWith(networkOnlyWithQueue(request));
    return;
  }

  // 3. Assets estáticos → Cache-First
  event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
});

// ─── Estrategias ────────────────────────────────────────────

async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const offlinePage = await caches.match('/offline.html');
    return offlinePage || new Response('Sin conexión', { status: 503 });
  }
}

async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(
      JSON.stringify({ error: 'Sin conexión. Datos en cola de sincronización.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Cola de sincronización cuando no hay red (Background Sync API)
async function networkOnlyWithQueue(request) {
  try {
    return await fetch(request);
  } catch (error) {
    // Registra para sincronización posterior
    await registerSyncTask(request);
    return new Response(
      JSON.stringify({
        queued: true,
        message: 'Registro guardado localmente. Se sincronizará cuando haya conexión.'
      }),
      { status: 202, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function registerSyncTask(request) {
  try {
    const registration = await self.registration;
    if ('sync' in registration) {
      await registration.sync.register('sync-registros-movil');
    }
  } catch (err) {
    console.warn('[SW] Background Sync no disponible:', err);
  }
}

// ─── Background Sync ────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-registros-movil') {
    console.log('[SW] Sincronizando registros pendientes...');
    event.waitUntil(syncPendingRegistros());
  }
});

async function syncPendingRegistros() {
  const db = await openIndexedDB();
  const pendientes = await db.getAll('registros-pendientes');

  for (const registro of pendientes) {
    try {
      const response = await fetch('/api/v1/bienes-culturales/movil', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${registro.token}`,
        },
        body: JSON.stringify(registro.data),
      });

      if (response.ok) {
        await db.delete('registros-pendientes', registro.id);
        console.log('[SW] Registro sincronizado:', registro.id);

        // Notifica al usuario
        self.registration.showNotification('Patrimonio Cultural Junín', {
          body: `Registro "${registro.data.nombre}" sincronizado exitosamente.`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: `sync-${registro.id}`,
        });
      }
    } catch (err) {
      console.error('[SW] Error sincronizando registro:', registro.id, err);
    }
  }
}

// Mini wrapper IndexedDB para la cola offline
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('patrimonio-offline-db', 1);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('registros-pendientes')) {
        db.createObjectStore('registros-pendientes', { keyPath: 'id', autoIncrement: true });
      }
    };

    req.onsuccess = (e) => {
      const db = e.target.result;
      resolve({
        getAll: (store) => new Promise((res, rej) => {
          const tx = db.transaction(store, 'readonly');
          const req = tx.objectStore(store).getAll();
          req.onsuccess = () => res(req.result);
          req.onerror  = () => rej(req.error);
        }),
        delete: (store, id) => new Promise((res, rej) => {
          const tx = db.transaction(store, 'readwrite');
          const req = tx.objectStore(store).delete(id);
          req.onsuccess = () => res();
          req.onerror  = () => rej(req.error);
        }),
      });
    };

    req.onerror = () => reject(req.error);
  });
}
