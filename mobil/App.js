import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View, StatusBar, Vibration, LogBox } from 'react-native';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { SafeNotifications } from './utils/notifications';

// Expo Go'da arka plan konumu uyarısını ekranda gösterme (APK derlemesinde arka plan tam çalışır)
LogBox.ignoreLogs([
  'Background location is limited in Expo Go',
  'Location.hasStartedGeofencingAsync',
  'Location.startGeofencingAsync',
]);

import Header from './components/Header';
import MapWebView from './components/MapWebView';
import CariListDrawer from './components/CariListDrawer';
import CariDetailModal from './components/CariDetailModal';
import ProximityAlertModal from './components/ProximityAlertModal';
import { calculateDistance } from './utils/distance';
import localCariler from './assets/cariler.json';

import AsyncStorage from '@react-native-async-storage/async-storage';

const GEOFENCE_TASK_NAME = 'CARI_RADAR_GEOFENCE_TASK';
const BACKGROUND_LOCATION_TASK = 'CARI_RADAR_LOCATION_TASK';
const DEFAULT_PROXIMITY = 50; // Kullanıcı seçimine göre dinamik (Varsayılan 50m)
const STORAGE_KEY_PROXIMITY = '@cari_radar_proximity_threshold';
const STORAGE_KEY_NOTIFIED = '@cari_radar_notified_caris';
const NOTIFICATION_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 saat tek bildirim kuralı
const MIN_NOTIFICATION_INTERVAL_MS = 15 * 1000; // 15 saniye fırtına koruması
const GEOFENCE_HYSTERESIS_BUFFER = 20; // 20 metre histerezis tamponu

// Ortak bellek ve kalıcı hafıza yöneticisi
let memoryNotifiedCariler = {};
let currentRadarThreshold = DEFAULT_PROXIMITY;

const loadNotifiedCarilerFromStorage = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_NOTIFIED);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const now = Date.now();
    const valid = {};
    for (const [id, ts] of Object.entries(parsed)) {
      if (now - ts < NOTIFICATION_COOLDOWN_MS) {
        valid[String(id)] = ts;
      }
    }
    memoryNotifiedCariler = valid;
    return valid;
  } catch (e) {
    return {};
  }
};

const recordCariNotified = async (cariId) => {
  try {
    const now = Date.now();
    memoryNotifiedCariler[String(cariId)] = now;
    await AsyncStorage.setItem(STORAGE_KEY_NOTIFIED, JSON.stringify(memoryNotifiedCariler));
  } catch (e) {}
};

// Bildirim Ayarları (Expo Go korumalı)
try {
  SafeNotifications.setNotificationHandler();
} catch (e) {
  console.warn('[Notification] Handler başlatılamadı:', e);
}

// 1. Arka Plan Kesintisiz Yüksek Hassasiyetli GPS Görevi (Seçili menzile göre KESİN filtreleme)
try {
  TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
    if (error || !data || !data.locations || !data.locations.length) return;
    const loc = data.locations[0];
    const { latitude, longitude } = loc.coords;

    const list = localCariler?.cariler || [];
    const now = Date.now();

    // Kullanıcının seçtiği en güncel menzili al (50m, 100m vb.)
    let threshold = currentRadarThreshold;
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY_PROXIMITY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0) {
          threshold = parsed;
          currentRadarThreshold = parsed;
        }
      }
    } catch (_) {}

    if (Object.keys(memoryNotifiedCariler).length === 0) {
      await loadNotifiedCarilerFromStorage();
    }

    const eligible = [];
    for (const cari of list) {
      if (!cari.enlem || !cari.boylam) continue;
      const dist = calculateDistance(latitude, longitude, cari.enlem, cari.boylam);

      // KESİNLİKLE kullanıcının seçtiği menzil içinde olmalıdır (Örn: 50m seçiliyse sadece <=50m)
      if (dist <= threshold) {
        const lastNotified = memoryNotifiedCariler[String(cari.id)];
        if (!lastNotified || now - lastNotified > NOTIFICATION_COOLDOWN_MS) {
          eligible.push({ cari, dist });
        }
      }
    }

    if (eligible.length > 0) {
      // En yakındakine tek seferlik bildirim ver
      eligible.sort((a, b) => a.dist - b.dist);
      const chosen = eligible[0];

      await recordCariNotified(chosen.cari.id);
      console.log(`[Arka Plan Radar] ${threshold}m menzilindeki cariye TEK bildirim: ${chosen.cari.ad} (${Math.round(chosen.dist)}m)`);
      await SafeNotifications.triggerProximityAlert(chosen.cari, chosen.dist);
    }
  });
} catch (e) {
  console.warn('[LocationTask] Tanımlama hatası:', e);
}

export default function App() {
  const [allCariler, setAllCariler] = useState(localCariler.cariler || []);
  const [userLocation, setUserLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCari, setSelectedCari] = useState(null);
  const [activeProximityAlert, setActiveProximityAlert] = useState(null);
  const [proximityThreshold, setProximityThreshold] = useState(DEFAULT_PROXIMITY);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const locationSubRef = useRef(null);
  const allCarilerRef = useRef(allCariler);
  const insideCarilerRef = useRef(new Set());
  const isInitialFixRef = useRef(true);
  const lastNotificationTimeRef = useRef(0);

  useEffect(() => {
    allCarilerRef.current = allCariler;
  }, [allCariler]);

  // Hafızadan son seçilen metreyi ve bildirim geçmişini yükle
  useEffect(() => {
    loadNotifiedCarilerFromStorage();
    AsyncStorage.getItem(STORAGE_KEY_PROXIMITY)
      .then((saved) => {
        if (saved) {
          const val = parseInt(saved, 10);
          if (!isNaN(val) && val > 0) {
            setProximityThreshold(val);
            currentRadarThreshold = val;
          }
        }
      })
      .catch((e) => console.log('[Storage] Proximity okuma hatası:', e));
  }, []);

  const handleUpdateProximity = (newVal) => {
    setProximityThreshold(newVal);
    currentRadarThreshold = newVal;
    AsyncStorage.setItem(STORAGE_KEY_PROXIMITY, String(newVal)).catch((e) =>
      console.log('[Storage] Proximity yazma hatası:', e)
    );
    if (allCariler.length > 0) {
      startBackgroundTracking(allCariler, newVal);
    }
  };

  // 1. Canlı SQL Verilerini Vercel Bulutundan Çek
  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('https://cari-konum.vercel.app/data/cariler.json?t=' + Date.now());
      if (!res.ok) throw new Error('Veri çekilemedi: ' + res.status);
      const data = await res.json();
      const list = data.cariler || [];
      setAllCariler(list);
      startBackgroundTracking(list, proximityThreshold);
    } catch (err) {
      console.warn('Veri yükleme hatası:', err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 2. Kesintisiz Arka Plan Radarı (Yüksek Hassasiyetli Foreground Service)
  const startBackgroundTracking = async (carilerList, radius) => {
    try {
      const isExpoGo = Constants?.appOwnership === 'expo' || Constants?.executionEnvironment === 'storeClient';
      if (isExpoGo) {
        console.log('[Radar] Expo Go ortamı: Ön plan radar devrede.');
        return;
      }

      // Eski donanımsal geofence görevini durdur (küçük metrajları desteklemez ve yanlış 150m alarmı üretir)
      try {
        const hasGeofence = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK_NAME);
        if (hasGeofence) {
          await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
          console.log('[Geofence] Donanımsal geofence durduruldu; hassas GPS devrede.');
        }
      } catch (_) {}

      // A. Kesintisiz Ön Plan Servisi (Seçilen menzile göre güncellenir)
      const hasStartedLocation = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      if (hasStartedLocation) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      }

      const activeRadius = radius || currentRadarThreshold || DEFAULT_PROXIMITY;
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.High,
        distanceInterval: 5, // Her 5 metrede bir konumu doğrula
        deferredUpdatesInterval: 3000,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'CariRadar Devrede',
          notificationBody: `Saha radarı ${activeRadius}m menzili tarıyor...`,
          notificationColor: '#2563eb',
        },
      });
      console.log(`[Radar] Foreground Service ${activeRadius}m menziliyle başlatıldı.`);
    } catch (e) {
      console.warn('Arka plan takibi başlatılamadı:', e.message);
    }
  };

  // 3. İzinler ve Başlatma
  useEffect(() => {
    loadData();

    async function initPermissions() {
      // Bildirim İzni
      try {
        if (SafeNotifications && SafeNotifications.requestPermissionsAsync) {
          await SafeNotifications.requestPermissionsAsync();
        }
      } catch (e) {
        console.warn('Bildirim izni atlandı:', e.message);
      }

      // Ön Plan Konum İzni
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      if (fgStatus !== 'granted') {
        console.warn('Ön plan konum izni verilmedi');
        return;
      }

      // Arka Plan Konum İzni (Yalnızca APK'da istenir)
      const isExpoGo = Constants?.appOwnership === 'expo' || Constants?.executionEnvironment === 'storeClient';
      if (!isExpoGo) {
        try {
          const bgPerm = await Location.requestBackgroundPermissionsAsync();
          if (bgPerm.status === 'granted') {
            await startBackgroundTracking(allCarilerRef.current, proximityThreshold);
          }
        } catch (e) {
          console.warn('Arka plan konum izni atlandı:', e.message);
        }
      }

      // GPS Takibini Başlat
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 3,
          timeInterval: 2000,
        },
        (loc) => {
          if (!isSimulating) {
            setUserLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
            setIsTracking(true);
          }
        }
      );
      locationSubRef.current = sub;
    }

    initPermissions();

    // Bildirime tıklandığında ilgili cariyi aç
    let responseSub = null;
    try {
      if (SafeNotifications && SafeNotifications.addNotificationResponseReceivedListener) {
        responseSub = SafeNotifications.addNotificationResponseReceivedListener((response) => {
          const cariId = response?.notification?.request?.content?.data?.cariId;
          if (cariId) {
            const found = allCarilerRef.current.find((c) => String(c.id) === String(cariId));
            if (found) setSelectedCari(found);
          }
        });
      }
    } catch (e) {
      console.warn('Listener kaydı hatası:', e.message);
    }

    return () => {
      if (locationSubRef.current) locationSubRef.current.remove();
      if (responseSub && responseSub.remove) responseSub.remove();
    };
  }, []);

  // 4. Ön Plan Seçilen Menzil Yakınlık Kontrolü (SADECE SEÇİLEN MENZİL VE TEK BİLDİRİM)
  useEffect(() => {
    if (!userLocation || allCariler.length === 0) return;

    const now = Date.now();
    const insideSet = insideCarilerRef.current;

    // Uygulama ilk açıldığında bulunulan yerdeki carileri baz al (açılışta bildirim fırlatmasını önle)
    if (isInitialFixRef.current) {
      isInitialFixRef.current = false;
      for (const cari of allCariler) {
        if (!cari.enlem || !cari.boylam) continue;
        const d = calculateDistance(userLocation.latitude, userLocation.longitude, cari.enlem, cari.boylam);
        if (d <= proximityThreshold) {
          insideSet.add(String(cari.id));
        }
      }
      return;
    }

    const eligible = [];
    for (const cari of allCariler) {
      if (!cari.enlem || !cari.boylam) continue;

      const dist = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        cari.enlem,
        cari.boylam
      );

      const cariIdStr = String(cari.id);
      const isInside = insideSet.has(cariIdStr);

      // KESİNLİKLE kullanıcının seçtiği menzil içinde mi? (Örn: 50m seçiliyse sadece <=50m)
      if (dist <= proximityThreshold) {
        if (!isInside) {
          insideSet.add(cariIdStr);
        }

        const lastNotified = memoryNotifiedCariler[cariIdStr];
        const isAlreadyNotified = lastNotified && (now - lastNotified < NOTIFICATION_COOLDOWN_MS);

        if (!isAlreadyNotified) {
          eligible.push({ cari, dist });
        }
      } else if (dist > proximityThreshold + GEOFENCE_HYSTERESIS_BUFFER) {
        if (isInside) {
          insideSet.delete(cariIdStr);
        }
      }
    }

    if (activeProximityAlert) return;
    if (now - lastNotificationTimeRef.current < MIN_NOTIFICATION_INTERVAL_MS) return;

    if (eligible.length > 0) {
      eligible.sort((a, b) => a.dist - b.dist);
      const chosen = eligible[0];
      const chosenIdStr = String(chosen.cari.id);

      recordCariNotified(chosenIdStr);
      lastNotificationTimeRef.current = now;

      console.log(`[Ön Plan Radar] ${proximityThreshold}m menzili içindeki cariye TEK SEFERLİK bildirim: ${chosen.cari.ad} (${Math.round(chosen.dist)}m)`);

      // Donanımsal Titreşim ve Yakınlık Uyarısı
      SafeNotifications.triggerProximityAlert(chosen.cari, chosen.dist);

      // Uygulama içi modal
      setActiveProximityAlert({ cari: chosen.cari, distance: chosen.dist });
    }
  }, [userLocation, allCariler, proximityThreshold, activeProximityAlert]);

  // Carileri mesafeye göre hesapla
  const processedCariler = useMemo(() => {
    return allCariler.map((c) => {
      let dist = Infinity;
      if (userLocation && c.enlem && c.boylam) {
        dist = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          c.enlem,
          c.boylam
        );
      }
      return { ...c, distance: dist };
    });
  }, [allCariler, userLocation]);

  // Test Simülasyonu
  const handleTestProximityForCari = (cari) => {
    if (!cari || !cari.enlem || !cari.boylam) return;

    // Kullanıcıyı carinin 18 metre yanına taşı
    const testLat = cari.enlem + 0.00015;
    const testLng = cari.boylam + 0.00015;

    const cariIdStr = String(cari.id);
    delete memoryNotifiedCariler[cariIdStr];
    insideCarilerRef.current.delete(cariIdStr);
    lastNotificationTimeRef.current = 0;
    isInitialFixRef.current = false;

    setSelectedCari(null);
    setActiveProximityAlert(null);

    setUserLocation({ latitude: testLat, longitude: testLng });
    setIsTracking(true);
  };

  const handleSimulateLocation = (lat, lng) => {
    lastNotificationTimeRef.current = 0;
    isInitialFixRef.current = false;
    setUserLocation({ latitude: lat, longitude: lng });
    setIsTracking(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Üst Bar */}
      <Header
        isTracking={isTracking}
        isRefreshing={isRefreshing}
        onRefreshData={loadData}
        proximityThreshold={proximityThreshold}
        setProximityThreshold={handleUpdateProximity}
        isSimulating={isSimulating}
        setIsSimulating={setIsSimulating}
      />

      {/* Harita */}
      <View style={styles.mapContainer}>
        <MapWebView
          cariler={allCariler}
          userLocation={userLocation}
          proximityThreshold={proximityThreshold}
          onSelectCari={setSelectedCari}
          onTestProximity={handleTestProximityForCari}
          onSimulateLocation={handleSimulateLocation}
          isSimulating={isSimulating}
        />
      </View>

      {/* Alt Liste Çekmecesi */}
      <CariListDrawer
        cariler={processedCariler}
        onSelectCari={setSelectedCari}
        onTestProximity={handleTestProximityForCari}
        proximityThreshold={proximityThreshold}
        isOpen={isDrawerOpen}
        setIsOpen={setIsDrawerOpen}
      />

      {/* 50m Yaklaşma Modalı (Evet / Hayır) */}
      <ProximityAlertModal
        alertData={activeProximityAlert}
        onYes={(c) => {
          setActiveProximityAlert(null);
          setSelectedCari(c);
        }}
        onNo={() => setActiveProximityAlert(null)}
        proximityThreshold={proximityThreshold}
      />

      {/* Borç - Alacak Detay Modalı */}
      <CariDetailModal
        cari={selectedCari}
        onClose={() => setSelectedCari(null)}
        onTestProximity={handleTestProximityForCari}
        proximityThreshold={proximityThreshold}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  mapContainer: {
    flex: 1,
  },
});