/**
 * Cari Konum - Bildirim ve OneSignal Servisi
 */

let isOneSignalInit = false;

export async function initOneSignal(appId) {
  if (typeof window === 'undefined' || isOneSignalInit) return;
  
  if (!appId) {
    console.log('[Notification] OneSignal App ID girilmedi, yerel Web Notification API devrede.');
    return;
  }

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function(OneSignal) {
    try {
      await OneSignal.init({
        appId: appId,
        safari_web_id: undefined,
        notifyButton: {
          enable: true,
        },
        allowLocalhostAsSecureOrigin: true,
      });
      isOneSignalInit = true;
      console.log('[Notification] OneSignal Web Push basariyla baslatildi.');
    } catch (err) {
      console.warn('[Notification] OneSignal baslatilamadi:', err);
    }
  });
}

/**
 * Tarayici bildirim izni ister
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Bu tarayici bildirimleri desteklemiyor.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * 200 Metre Yaklasma Bildirimi Gonderir
 * - Titresim (Vibration)
 * - Service Worker uzerinden [Evet] ve [Hayir] butonlu bildirim
 */
export async function sendProximityPushNotification(cari, distance) {
  // 1. Titresim
  if ('vibrate' in navigator) {
    navigator.vibrate([200, 100, 200, 100, 300]);
  }

  const title = `📍 ${cari.ad}`;
  const body = `${cari.ad} firmasına yaklaştınız (${Math.round(distance)} metre). Uğramak ister misiniz?`;

  // 2. Service Worker Bildirimi (Aksiyon butonlu)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body: body,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          tag: `cari-${cari.id}`,
          renotify: true,
          vibrate: [200, 100, 200],
          data: {
            cariId: cari.id,
            actionUrl: `/?cariId=${cari.id}`
          },
          actions: [
            { action: 'yes', title: 'Evet' },
            { action: 'no', title: 'Hayır' }
          ]
        });
        return;
      }
    } catch (err) {
      console.warn('Service Worker bildirimi gonderilemedi, standart API deneniyor:', err);
    }
  }

  // 3. Standart Web Notification API (Fallback)
  if (Notification.permission === 'granted') {
    const n = new Notification(title, {
      body: body,
      icon: '/icons/icon-192.png',
      tag: `cari-${cari.id}`
    });
    n.onclick = () => {
      window.focus();
      window.dispatchEvent(new CustomEvent('SHOW_CARI_DETAIL_EVENT', { detail: cari.id }));
      n.close();
    };
  }
}
