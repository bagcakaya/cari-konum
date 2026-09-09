// Cari Konum - Service Worker
const CACHE_NAME = 'cari-konum-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// Bildirim tiklama olayi
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action; // 'yes', 'no' veya bildirim govdesine tiklama
  const cariId = event.notification.data ? event.notification.data.cariId : null;

  if (action === 'no') {
    // Kullanici 'Hayir' dedi, sadece bildirimi kapat
    return;
  }

  // 'Evet' tiklandi veya bildirime dokunuldu: Uygulamayi ac ve Cari kartini goster
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

// Push bildirimi dinleyici (OneSignal veya Web Push)
self.addEventListener('push', (event) => {
  let data = { title: 'Cari Konum Bildirimi', body: 'Bir cariye yaklaştınız.' };
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
