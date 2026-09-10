// CariRadar - Yüksek Güvenilirlikli Modern PWA Service Worker (v3)
const CACHE_NAME = 'cari-radar-v3';

// Kritik statik dosyalar (çevrimdışı fallback için)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// 1. Kurulum: Hemen aktifleş ve eski cache bekleme
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache uyarısı:', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Aktivasyon: Eski sürüm (v1, v2 vb.) cache'leri anında sil ve istemcileri devral
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Eski önbellek temizlendi:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// 3. Fetch Stratejisi:
// - HTML & Navigasyon: KESİNLİKLE NETWORK-FIRST (Yeni sürümler anında gelsin, mobilde 404/eski bundle takılması olmasın)
// - Canlı Cari Verisi (/data/cariler.json): NETWORK-FIRST
// - Statik Varlıklar (/assets/*, /icons/*): Cache-First + Network Fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // A) Navigasyon veya HTML Sayfa Talebi -> Kesinlikle NETWORK-FIRST
  if (
    event.request.mode === 'navigate' ||
    event.request.destination === 'document' ||
    url.pathname === '/' ||
    url.pathname.endsWith('.html')
  ) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Çevrimdışı fallback: Önbellekteki en son index.html'i sun
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return caches.match('/index.html');
        })
    );
    return;
  }

  // B) Canlı Cari Verisi (/data/cariler.json) -> NETWORK-FIRST
  if (url.pathname.includes('/data/cariler.json')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // C) Vite Hashed Assets (/assets/*) ve İkonlar -> Cache-First
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // D) Diğer tüm istekler -> Network First, Fallback to Cache
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// 4. Bildirim tıklama olayı
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const cariId = event.notification.data ? event.notification.data.cariId : null;

  if (action === 'no') return;

  const targetUrl = cariId ? `/?cariId=${cariId}` : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'SHOW_CARI_DETAIL', cariId: cariId });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// 5. Push bildirimi dinleyici
self.addEventListener('push', (event) => {
  let data = { title: 'CariRadar Bildirimi', body: 'Bir cariye yaklaştınız.' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      { action: 'yes', title: 'Evet' },
      { action: 'no', title: 'Hayır' }
    ],
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '📍 Cari Yakınında!', options)
  );
});
