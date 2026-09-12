import { Vibration, Platform } from 'react-native';

const CHANNEL_ID = 'cari-radar-alerts';

let Notifications = null;
try {
  Notifications = require('expo-notifications');
  // Bildirim İşleyicisi (Ön plandayken de ses, başlık ve rozet göster)
  if (Notifications?.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch (e) {
  // Expo Go (SDK 53+) veya push modülü kısıtlı ortamlar için sessiz fallback
  console.log('[Notifications] Fallback modu devrede.');
}

const setupNotificationChannelAsync = async () => {
  if (Platform.OS === 'android' && Notifications?.setNotificationChannelAsync) {
    try {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Cari Radar Yakınlık Bildirimleri',
        description: '150m mesafedeki carilere yaklaşıldığında sesli ve kilit ekranı uyarıları',
        importance: Notifications.AndroidImportance?.MAX || 5,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#10b981',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
        sound: 'default',
      });
      console.log('[Notifications] Android bildirim kanalı hazırlandı: MAX öncelik.');
    } catch (e) {
      console.warn('[Notification Channel Error]', e.message);
    }
  }
};

// Başlangıçta kanalı hemen kaydet
setupNotificationChannelAsync().catch(() => {});

export const SafeNotifications = {
  requestPermissionsAsync: async () => {
    if (Notifications?.requestPermissionsAsync) {
      try {
        const perm = await Notifications.requestPermissionsAsync();
        await setupNotificationChannelAsync();
        return perm;
      } catch (e) {
        return { status: 'granted' };
      }
    }
    return { status: 'granted' };
  },

  triggerProximityAlert: async (cari, distance) => {
    // 1. Donanımsal Titreşim (Her ortamda çalışır)
    try {
      Vibration.vibrate([0, 500, 200, 500]);
    } catch (e) {
      console.warn('Vibration error:', e);
    }

    // 2. Sistem Kilit Ekranı / Durum Çubuğu Bildirimi (APK'da %100 çalışır)
    if (Notifications?.scheduleNotificationAsync) {
      try {
        await setupNotificationChannelAsync();
        const bakiyeStr = cari?.bakiye
          ? ` (Bakiye: ${Math.abs(cari.bakiye).toLocaleString('tr-TR')} ₺ ${cari.bakiye > 0 ? 'Borç' : 'Alacak'})`
          : '';

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `🚨 ${Math.round(distance || 150)}m Yakınında Cari Bulundu!`,
            body: `${cari?.ad || 'Firma'}${bakiyeStr}\n${cari?.adresTemiz || cari?.ilce || ''}`,
            data: { cariId: cari?.id },
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority?.MAX || 'max',
            vibrate: [0, 500, 250, 500],
            channelId: CHANNEL_ID,
          },
          trigger: null, // Anında göster
        });
      } catch (e) {
        console.log('[Notification schedule]', e.message);
      }
    }

    console.log(`[Alarm] Yakınlık uyarısı: ${cari?.ad} (${Math.round(distance || 150)}m)`);
  },

  setNotificationHandler: () => {},
  addNotificationResponseReceivedListener: (cb) => {
    if (Notifications?.addNotificationResponseReceivedListener) {
      try {
        return Notifications.addNotificationResponseReceivedListener(cb);
      } catch (e) {
        return { remove: () => {} };
      }
    }
    return { remove: () => {} };
  },
};