import { Vibration } from 'react-native';

// Expo Go (SDK 53+) Android ortamında harici push modülü kaldırıldığı için
// çökme yaşamadan donanımsal titreşim ve yerel alarm sağlayan güvenli servis
export const SafeNotifications = {
  requestPermissionsAsync: async () => {
    return { status: 'granted' };
  },

  triggerProximityAlert: (cari, distance) => {
    try {
      // Donanımsal Titreşim (Expo Go'da %100 çalışır)
      Vibration.vibrate([0, 500, 200, 500]);
    } catch (e) {
      console.warn('Vibration error:', e);
    }
    console.log(`[Alarm] 50m içine girildi: ${cari?.ad} (${Math.round(distance)}m)`);
  },

  setNotificationHandler: () => {},
  addNotificationResponseReceivedListener: () => ({ remove: () => {} }),
};