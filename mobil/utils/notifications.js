import { Vibration } from 'react-native';

// Expo Go (SDK 53+) Android ortamında native push modülleri bulunmadığı için
// çökme yaşamadan donanımsal titreşim ve yerel alarm sağlayan güvenli servis
export const SafeNotifications = {
  requestPermissionsAsync: async () => {
    return { status: 'granted' };
  },

  triggerProximityAlert: (cari, distance) => {
    try {
      // Donanımsal Titreşim (Expo Go ve APK'da %100 çalışır)
      Vibration.vibrate([0, 500, 200, 500]);
    } catch (e) {
      console.warn('Vibration error:', e);
    }
    console.log(`[Alarm] Yakınlık uyarısı: ${cari?.ad} (${Math.round(distance || 50)}m)`);
  },

  setNotificationHandler: () => {},
  addNotificationResponseReceivedListener: () => ({ remove: () => {} }),
};