import React, { useState, useEffect, useRef, useMemo } from 'react';
import Header from './components/Header';
import Map from './components/Map';
import CariList from './components/CariList';
import CariDetailModal from './components/CariDetailModal';
import ProximityAlertModal from './components/ProximityAlertModal';
import { calculateDistance } from './utils/distance';
import {
  initOneSignal,
  requestNotificationPermission,
  sendProximityPushNotification
} from './services/notifications';

// 200 Metre Yaklaşma Eşiği (Metre)
const PROXIMITY_THRESHOLD_METERS = 200;
// Bildirim bekleme süresi (Aynı cari için 30 dakika)
const COOLDOWN_MS = 30 * 60 * 1000;

export default function App() {
  const [allCariler, setAllCariler] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCari, setSelectedCari] = useState(null);
  const [activeProximityAlert, setActiveProximityAlert] = useState(null);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);

  // Arama & Filtreleme Durumu
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('hepsi'); // 'hepsi' | 'yakin' | 'borclu' | 'alacakli'
  const [isListOpen, setIsListOpen] = useState(false);

  // Test / Simülasyon Durumu
  const [isSimulating, setIsSimulating] = useState(false);

  // PWA Yükleme Prompt'u
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Bildirim geçmişi (CariId -> Son bildirim zamanı)
  const notificationCooldowns = useRef({});

  // 1. Verileri Çek
  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/data/cariler.json?t=' + Date.now());
      if (!res.ok) throw new Error('Veri dosyası bulunamadı');
      const data = await res.json();
      setAllCariler(data.cariler || []);
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    // OneSignal Baslat
    const onesignalId = import.meta.env.VITE_ONESIGNAL_APP_ID;
    initOneSignal(onesignalId);

    // Bildirim izni kontrolu
    if ('Notification' in window) {
      setHasNotificationPermission(Notification.permission === 'granted');
    }

    // PWA Install Event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    // Service Worker veya URL'den gelen CariId parametresini kontrol et
    const params = new URLSearchParams(window.location.search);
    const initialCariId = params.get('cariId');
    if (initialCariId) {
      // Data yuklendikten sonra acilmasi icin sakla
      window.__initialCariId = initialCariId;
    }

    const handleSwMessage = (event) => {
      if (event.data && event.data.type === 'SHOW_CARI_DETAIL' && event.data.cariId) {
        showCariById(event.data.cariId);
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleSwMessage);

    const handleCustomDetail = (e) => {
      if (e.detail) showCariById(e.detail);
    };
    window.addEventListener('SHOW_CARI_DETAIL_EVENT', handleCustomDetail);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleSwMessage);
      window.removeEventListener('SHOW_CARI_DETAIL_EVENT', handleCustomDetail);
    };
  }, []);

  // Data yuklendiginde varsa url'deki cariyi ac
  useEffect(() => {
    if (allCariler.length > 0 && window.__initialCariId) {
      showCariById(window.__initialCariId);
      window.__initialCariId = null;
    }
  }, [allCariler]);

  const showCariById = (id) => {
    const found = allCariler.find((c) => String(c.id) === String(id));
    if (found) {
      setSelectedCari(found);
    }
  };

  // 2. GPS Konum Takibi
  useEffect(() => {
    if (isSimulating) return; // Simulasyon aciksa gercek GPS durdurulsun

    if (!('geolocation' in navigator)) {
      console.warn('Geolocation desteklenmiyor.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setIsTracking(true);
      },
      (err) => {
        console.warn('GPS Hatası:', err.message);
        // Varsayilan Erzurum Yakutiye konumu (test icin)
        if (!userLocation) {
          setUserLocation({ lat: 39.9086, lng: 41.2769 });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isSimulating]);

  // 3. 200 Metre Geofencing & Yakınlık Bildirimi
  useEffect(() => {
    if (!userLocation || allCariler.length === 0) return;

    const now = Date.now();

    for (const cari of allCariler) {
      if (!cari.enlem || !cari.boylam) continue;

      const dist = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        cari.enlem,
        cari.boylam
      );

      // 200 metre esigi kontrolu
      if (dist <= PROXIMITY_THRESHOLD_METERS) {
        const lastNotified = notificationCooldowns.current[cari.id];
        
        // Spam engelleme: Son 30 dakika icinde bildirim gitmediyse
        if (!lastNotified || now - lastNotified > COOLDOWN_MS) {
          notificationCooldowns.current[cari.id] = now;

          console.log(`[Geofence] 200m içi cari algılandı: ${cari.ad} (${Math.round(dist)}m)`);

          // 1. OneSignal / Web Push Bildirimi Gönder
          sendProximityPushNotification(cari, dist);

          // 2. Uygulama İçi İnteraktif Alert Modalı Aç (Evet/Hayır Butonlu)
          setActiveProximityAlert({
            cari: cari,
            distance: dist,
          });

          // Ayni anda birden fazla alert cikmamasi icin ilk caride dur
          break;
        }
      }
    }
  }, [userLocation, allCariler]);

  // Carileri mesafeye ve filtrelere gore hesapla
  const processedCariler = useMemo(() => {
    return allCariler.map((c) => {
      let dist = Infinity;
      if (userLocation && c.enlem && c.boylam) {
        dist = calculateDistance(userLocation.lat, userLocation.lng, c.enlem, c.boylam);
      }
      return { ...c, distance: dist };
    });
  }, [allCariler, userLocation]);

  // Filtrelenmis liste
  const filteredCariler = useMemo(() => {
    let list = processedCariler;

    // Arama filtresi
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.ad.toLowerCase().includes(q) ||
          c.kod.toLowerCase().includes(q) ||
          (c.ilce && c.ilce.toLowerCase().includes(q)) ||
          (c.adresTemiz && c.adresTemiz.toLowerCase().includes(q))
      );
    }

    // Tab filtresi
    if (activeFilter === 'borclu') {
      list = list.filter((c) => c.bakiye > 0);
    } else if (activeFilter === 'alacakli') {
      list = list.filter((c) => c.bakiye < 0);
    } else if (activeFilter === 'yakin') {
      list = [...list].sort((a, b) => a.distance - b.distance);
    }

    return list;
  }, [processedCariler, searchQuery, activeFilter]);

  // Bildirim Buton Aksiyonları
  const handleProximityYes = (cari) => {
    setActiveProximityAlert(null);
    setSelectedCari(cari); // Evet basinca Borc - Alacak detay kartini ac
  };

  const handleProximityNo = (cari) => {
    setActiveProximityAlert(null); // Hayir basinca kapat
  };

  // Bildirim İzni İste
  const handleRequestNotification = async () => {
    const granted = await requestNotificationPermission();
    setHasNotificationPermission(granted);
  };

  // PWA Kurulum Butonu
  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Belirli bir cari için 200m yaklaşma testini tetikle
  const handleTestProximityForCari = (cari) => {
    if (!cari || !cari.enlem || !cari.boylam) return;

    // Kullanıcıyı bu carinin 50 metre yanına taşı
    const testLat = cari.enlem + 0.0003;
    const testLng = cari.boylam + 0.0003;

    // Cooldown'u sıfırla ki bildirim anında tetiklensin
    delete notificationCooldowns.current[cari.id];

    // Varsa açık detay modalını kapat
    setSelectedCari(null);

    // Konumu güncelle
    setUserLocation({ lat: testLat, lng: testLng, accuracy: 5 });
    setIsTracking(true);

    // Haritayı bu noktaya odakla
    if (window.__mapInstance) {
      window.__mapInstance.setView([testLat, testLng], 17, { animate: true });
    }
  };

  // Sanal GPS Belirleme (Test Modu)
  const handleSimulateLocation = (lat, lng) => {
    // Haritaya tıklandığında cooldown'ları temizle ki yakındaki cari anında bildirim versin
    notificationCooldowns.current = {};
    setUserLocation({ lat, lng, accuracy: 5 });
    setIsTracking(true);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 flex flex-col">
      {/* Üst Çubuk */}
      <Header
        isTracking={isTracking}
        hasNotificationPermission={hasNotificationPermission}
        onRequestNotification={handleRequestNotification}
        onRefreshData={loadData}
        isRefreshing={isRefreshing}
        deferredPrompt={deferredPrompt}
        onInstallPWA={handleInstallPWA}
      />

      {/* Ana Harita Alanı */}
      <main className="flex-1 w-full h-full pt-14 pb-20 relative">
        <Map
          cariler={allCariler}
          userLocation={userLocation}
          onSelectCari={setSelectedCari}
          onTestProximity={handleTestProximityForCari}
          isSimulating={isSimulating}
          setIsSimulating={setIsSimulating}
          onSimulateLocation={handleSimulateLocation}
        />
      </main>

      {/* Alt Kayar Liste Paneli */}
      <CariList
        cariler={filteredCariler}
        onSelectCari={setSelectedCari}
        onTestProximity={handleTestProximityForCari}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isOpen={isListOpen}
        setIsOpen={setIsListOpen}
      />

      {/* 200 Metre Yaklaşma Bildirim Modalı (Evet / Hayır) */}
      <ProximityAlertModal
        alertData={activeProximityAlert}
        onYes={handleProximityYes}
        onNo={handleProximityNo}
      />

      {/* Cari Borç - Alacak Detay Kartı */}
      <CariDetailModal
        cari={selectedCari}
        onClose={() => setSelectedCari(null)}
        onTestProximity={handleTestProximityForCari}
      />
    </div>
  );
}
