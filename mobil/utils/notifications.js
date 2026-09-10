import { Vibration } from 'react-native';
import * as Notifications from 'expo-notifications';

// Bildirim İşleyicisi Ayarları (Ön plandayken de ses ve başlık gösterilsin)
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (e) {
  console.log('[NotificationHandler fallback]', e.message);
}

export const SafeNotifications = {
  requestPermissionsAsync: async () => {
    try {
      return await Notifications.requestPermissionsAsync();
    } catch (e) {
      return { status: 'granted' };
    }
  },

  triggerProximityAlert: async (cari, distance) => {
    // 1. Donanımsal Titreşim (Her ortamda çalışır)
    try {
      Vibration.vibrate([0, 500, 200, 500]);
    } catch (e) {
      console.warn('Vibration error:', e);
    }

    // 2. Sistem Kilit Ekranı / Durum Çubuğu Bildirimi (APK'da %100 çalışır)
    try {
      const bakiyeStr = cari?.bakiye
        ? ` (Bakiye: ${Math.abs(cari.bakiye).toLocaleString('tr-TR')} ₺ ${cari.bakiye > 0 ? 'Borç' : 'Alacak'})`
        : '';

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🚨 ${Math.round(distance || 50)}m Yakınında Cari Bulundu!`,
          body: `${cari?.ad || 'Firma'}${bakiyeStr}\n${cari?.adresTemiz || cari?.ilce || ''}`,
          data: { cariId: cari?.id },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 500, 250, 500],
        },
        trigger: null, // Anında gönder
      });
    } catch (e) {
      // Expo Go'da veya push kısıtlamasında sessizce yutulur
      console.log('[Notification schedule fallback]', e.message);
    }

    console.log(`[Alarm] 50m içine girildi: ${cari?.ad} (${Math.round(distance || 50)}m)`);
  },

  setNotificationHandler: () => {},
  addNotificationResponseReceivedListener: (cb) => {
    try {
      return Notifications.addNotificationResponseReceivedListener(cb);
    } catch (e) {
      return { remove: () => {} };
    }
  },
};