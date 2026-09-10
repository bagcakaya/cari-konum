import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';

import Header from './components/Header';
import MapWebView from './components/MapWebView';
import CariListDrawer from './components/CariListDrawer';
import CariDetailModal from './components/CariDetailModal';
import ProximityAlertModal from './components/ProximityAlertModal';
import { calculateDistance } from './utils/distance';

const GEOFENCE_TASK_NAME = 'CARI_RADAR_GEOFENCE_TASK';
const DEFAULT_PROXIMITY = 50; // 50 metre
const COOLDOWN_MS = 30 * 60 * 1000; // 30 dakika

// Bildirim Ayarları
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Arka Plan Geofence Görevi (Uygulama arka plandayken 50m alarmı)
TaskManager.defineTask(GEOFENCE_TASK_NAME, ({ data: { eventType, region }, error }) => {
  if (error) {
    console.warn('[Geofence] Arka plan hatası:', error.message);
    return;
  }
  if (eventType === Location.GeofencingEventType.Enter) {
    console.log('[Geofence] 50m bölgesine girildi:', region.identifier);
    Notifications.scheduleNotificationAsync({
      content: {
        title: '📍 Cari Yakınında (50m)!',
        body: 'Kayıtlı bir firmanın 50 metre yakınına geldiniz. Bakiye kartını görmek için dokunun.',
        sound: true,
        vibrate: [0, 300, 200, 300],
        data: { cariId: region.identifier },
      },
      trigger: null,
    });
  }
});

export default function App() {
  const [allCariler, setAllCariler] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCari, setSelectedCari] = useState(null);
  const [activeProximityAlert, setActiveProximityAlert] = useState(null);
  const [proximityThreshold, setProximityThreshold] = useState(DEFAULT_PROXIMITY);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const notificationCooldowns = useRef({});
  const locationSubRef = useRef(null);

  // 1. Canlı SQL Verilerini Vercel Bulutundan Çek
  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('https://cari-konum.vercel.app/data/cariler.json?t=' + Date.now());
      if (!res.ok) throw new Error('Veri çekilemedi: ' + res.status);
      const data = await res.json();
      const list = data.cariler || [];
      setAllCariler(list);
      setupGeofences(list, proximityThreshold);
    } catch (err) {
      console.warn('Veri yükleme hatası:', err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 2. Donanımsal Geofencing Kaydı
  const setupGeofences = async (carilerList, radius) => {
    try {
      const hasStarted = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK_NAME);
      if (hasStarted) {
        await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
      }

      const validList = carilerList.filter((c) => c.enlem && c.boylam).slice(0, 100);
      if (validList.length === 0) return;

      const regions = validList.map((c) => ({
        identifier: String(c.id),
        latitude: c.enlem,
        longitude: c.boylam,
        radius: radius || DEFAULT_PROXIMITY,
        notifyOnEnter: true,
        notifyOnExit: false,
      }));

      await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, regions);
      console.log(`[Geofence] ${regions.length} adet cari 50m radara kaydedildi.`);
    } catch (e) {
      console.warn('Geofence başlatılamadı:', e.message);
    }
  };

  // 3. İzinler ve Başlatma
  useEffect(() => {
    loadData();

    async function initPermissions() {
      // Bildirim İzni
      await Notifications.requestPermissionsAsync();

      // Ön Plan Konum İzni
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      if (fgStatus !== 'granted') {
        console.warn('Ön plan konum izni verilmedi');
        return;
      }

      // Arka Plan Konum İzni (Geofencing için)
      await Location.requestBackgroundPermissionsAsync();

      // GPS Takibini Başlat
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5,
          timeInterval: 3000,
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
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const cariId = response.notification.request.content.data?.cariId;
      if (cariId) {
        const found = allCariler.find((c) => String(c.id) === String(cariId));
        if (found) setSelectedCari(found);
      }
    });

    return () => {
      if (locationSubRef.current) locationSubRef.current.remove();
      responseSub.remove();
    };
  }, []);

  // 4. Ön Plan 50m Yakınlık Kontrolü
  useEffect(() => {
    if (!userLocation || allCariler.length === 0) return;

    const now = Date.now();
    for (const cari of allCariler) {
      if (!cari.enlem || !cari.boylam) continue;

      const dist = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        cari.enlem,
        cari.boylam
      );

      if (dist <= proximityThreshold) {
        const last = notificationCooldowns.current[cari.id];
        if (!last || now - last > COOLDOWN_MS) {
          notificationCooldowns.current[cari.id] = now;

          // Sesli ve titreşimli push bildirimi
          Notifications.scheduleNotificationAsync({
            content: {
              title: `📍 ${cari.ad}`,
              body: `${cari.ad} firmasına ${dist}m yaklaştınız. Detay için dokunun.`,
              sound: true,
              vibrate: [0, 250, 200, 250],
              data: { cariId: cari.id },
            },
            trigger: null,
          });

          // Uygulama içi modal
          setActiveProximityAlert({ cari, distance: dist });
          break;
        }
      }
    }
  }, [userLocation, allCariler, proximityThreshold]);

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

  // 50m Test Simülasyonu
  const handleTestProximityForCari = (cari) => {
    if (!cari || !cari.enlem || !cari.boylam) return;

    // Kullanıcıyı carinin 18 metre yanına taşı
    const testLat = cari.enlem + 0.00015;
    const testLng = cari.boylam + 0.00015;

    delete notificationCooldowns.current[cari.id];
    setSelectedCari(null);

    setUserLocation({ latitude: testLat, longitude: testLng });
    setIsTracking(true);
  };

  const handleSimulateLocation = (lat, lng) => {
    notificationCooldowns.current = {};
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
        setProximityThreshold={setProximityThreshold}
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