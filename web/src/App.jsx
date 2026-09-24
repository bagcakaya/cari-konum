import React, { useState, useEffect, useRef, useMemo } from 'react';
import Header from './components/Header';
import Map from './components/Map';
import CariList from './components/CariList';
import CariDetailModal from './components/CariDetailModal';
import ProximityAlertModal from './components/ProximityAlertModal';
import InstallPromptModal from './components/InstallPromptModal';
import initialCarilerData from './data/cariler.json';
import { calculateDistance } from './utils/distance';
import {
  initOneSignal,
  requestNotificationPermission,
  sendProximityPushNotification
} from './services/notifications';

// Varsayılan Yaklaşma Eşiği (Metre) - Kullanıcı isteği ile 150m yapıldı
const DEFAULT_PROXIMITY_THRESHOLD = 150;
const STORAGE_KEY_PROXIMITY = 'CARIRADAR_PROXIMITY_THRESHOLD';
const STORAGE_KEY_NOTIFIED = 'CARIRADAR_NOTIFIED_CARIS';

// Bildirim kuralları:
// 1. Aynı cari için bildirim süresi (24 saat - Kullanıcı alana girdiğinde cari başına 1 kez bildirim)
const NOTIFICATION_COOLDOWN_MS = 24 * 60 * 60 * 1000;
// 2. Ardı ardına gelen bildirimler arası minimum nefes alma süresi (aynı anda birden çok cari varsa fırtına engelleme)
const MIN_NOTIFICATION_INTERVAL_MS = 15 * 1000; // 15 saniye
// 3. GPS Histerezis Payı (Sınırda titreşimi engelleme: Alandan çıkış için eşik + tampon)
const GEOFENCE_HYSTERESIS_BUFFER = 30; // 30 metre

// LocalStorage yardımcı fonksiyonları
const getStoredNotifiedCariler = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFIED);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const now = Date.now();
    const valid = {};
    for (const [id, ts] of Object.entries(parsed)) {
      if (now - ts < NOTIFICATION_COOLDOWN_MS) {
        valid[String(id)] = ts;
      }
    }
    return valid;
  } catch (e) {
    return {};
  }
};

const persistNotifiedCari = (cariId) => {
  try {
    const current = getStoredNotifiedCariler();
    current[String(cariId)] = Date.now();
    localStorage.setItem(STORAGE_KEY_NOTIFIED, JSON.stringify(current));
    return current;
  } catch (e) {
    return {};
  }
};

const clearStoredNotifiedCari = (cariId) => {
  try {
    const current = getStoredNotifiedCariler();
    delete current[String(cariId)];
    localStorage.setItem(STORAGE_KEY_NOTIFIED, JSON.stringify(current));
    return current;
  } catch (e) {
    return {};
  }
};

const clearAllStoredNotifications = () => {
  try {
    localStorage.removeItem(STORAGE_KEY_NOTIFIED);
  } catch (e) {}
};

export default function App() {
  const [allCariler, setAllCariler] = useState(() => initialCarilerData?.cariler || []);
  const [userLocation, setUserLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCari, setSelectedCari] = useState(null);
  const [activeProximityAlert, setActiveProximityAlert] = useState(null);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const [proximityThreshold, setProximityThreshold] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROXIMITY);
      if (saved) {
        const val = Number(saved);
        if (!isNaN(val) && val > 0) return val;
      }
    } catch (e) {}
    return DEFAULT_PROXIMITY_THRESHOLD;
  });

  const handleUpdateProximity = (val) => {
    setProximityThreshold(val);
    try {
      localStorage.setItem(STORAGE_KEY_PROXIMITY, String(val));
    } catch (e) {}
    showToast(`📍 Yakınlık alanı ${val} metre olarak güncellendi.`);
  };

  // Arama & Filtreleme Durumu
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('hepsi'); // 'hepsi' | 'yakin' | 'borclu' | 'alacakli'
  const [isListOpen, setIsListOpen] = useState(false);

  // Test / Simülasyon Durumu
  const [isSimulating, setIsSimulating] = useState(false);

  // PWA Yükleme Prompt'u & Kurulum Modalı
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Bildirim geçmişi (CariId -> Son bildirim zamanı) - LocalStorage kalıcı hafıza
  const notifiedCarilerRef = useRef(getStoredNotifiedCariler());
  // Halihazırda seçili alanın içinde olan carilerin ID kümesi (Alana giriş/çıkış takibi)
  const insideCarilerRef = useRef(new Set());
  // En son bildirim gönderilme zamanı (Çoklu caride bildirim fırtınasını engelleme)
  const lastNotificationTimeRef = useRef(0);
  // Uygulama açılışında bulunulan mevcut konumdaki cariler için açılış anında bildirim fırlatılmasını engelleyen kontrol
  const isInitialFixRef = useRef(true);

  const handleResetNotificationHistory = () => {
    clearAllStoredNotifications();
    notifiedCarilerRef.current = {};
    insideCarilerRef.current.clear();
    lastNotificationTimeRef.current = 0;
    isInitialFixRef.current = false;
    showToast('🔔 Bildirim hafızası sıfırlandı. Seçili alana giren cariler için tekrar bildirim verilecek.');
  };

  // 1. Verileri Çek
  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/data/cariler.json?t=' + Date.now());
      if (!res.ok) throw new Error('Veri dosyası bulunamadı');
      const data = await res.json();
      if (data.cariler && Array.isArray(data.cariler) && data.cariler.length > 0) {
        setAllCariler(data.cariler);
      }
    } catch (err) {
      console.error('Veri yükleme hatası (mevcut yerel veri kullanılıyor):', err);
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

  // Ekranı açık tutma (Saha / Sürüş takibi için WakeLock)
  useEffect(() => {
    let wakeLockInstance = null;
    const requestLock = async () => {
      if ('wakeLock' in navigator && isTracking) {
        try {
          wakeLockInstance = await navigator.wakeLock.request('screen');
        } catch (e) {}
      }
    };
    if (isTracking) {
      requestLock();
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isTracking) {
        requestLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wakeLockInstance) {
        wakeLockInstance.release().catch(() => {});
      }
    };
  }, [isTracking]);

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
        console.warn('GPS Sinyali Bekleniyor / Hatası:', err.message);
        // Kesinlikle sahte koordinat atanmamalıdır; harita varsayılan merkezde durur
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isSimulating]);

  // 3. Kullanıcının Seçtiği Alana Göre Geofencing & TEK SEFERLİK Yakınlık Bildirimi
  useEffect(() => {
    if (!userLocation || allCariler.length === 0) return;

    const now = Date.now();
    const notifiedHistory = notifiedCarilerRef.current;
    const insideSet = insideCarilerRef.current;

    // Uygulama ilk açıldığında: Kullanıcının zaten içinde bulunduğu mevcut konumu baz al,
    // açılış anında ekrana ve bildirim çubuğuna ani bildirim fırlatma!
    // (Sadece kullanıcı hareket edip YENİ bir carinin alanına girdiğinde bildir)
    if (isInitialFixRef.current) {
      isInitialFixRef.current = false;
      for (const cari of allCariler) {
        if (!cari.enlem || !cari.boylam) continue;
        const d = calculateDistance(userLocation.lat, userLocation.lng, cari.enlem, cari.boylam);
        if (d <= proximityThreshold) {
          insideSet.add(String(cari.id));
        }
      }
      return;
    }

    // Alana giren ve henüz bu gün/dönem içinde bildirim gitmemiş cariler
    const eligibleCandidates = [];

    for (const cari of allCariler) {
      if (!cari.enlem || !cari.boylam) continue;

      const dist = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        cari.enlem,
        cari.boylam
      );

      const cariIdStr = String(cari.id);
      const isCurrentlyInside = insideSet.has(cariIdStr);

      // Kullanıcının seçtiği yarıçap alanı sınırına girildi mi? (dist <= proximityThreshold)
      if (dist <= proximityThreshold) {
        if (!isCurrentlyInside) {
          // Bu alana yeni giriş yaptı
          insideSet.add(cariIdStr);
        }

        // Daha önce bu cari için bildirim gönderildi mi kontrol et (24 saatlik kalıcı hafıza)
        const lastNotifiedAt = notifiedHistory[cariIdStr];
        const isAlreadyNotified = lastNotifiedAt && (now - lastNotifiedAt < NOTIFICATION_COOLDOWN_MS);

        if (!isAlreadyNotified) {
          eligibleCandidates.push({ cari, dist });
        }
      } else if (dist > proximityThreshold + GEOFENCE_HYSTERESIS_BUFFER) {
        // Kullanıcı carinin etrafındaki alandan çıktı (Histerezis tamponu ile GPS titreşimleri elenir)
        if (isCurrentlyInside) {
          insideSet.delete(cariIdStr);
        }
      }
    }

    // Halihazırda ekranda açık bir bildirim modalı varsa kullanıcı yanıtlamadan yenisini açma
    if (activeProximityAlert) return;

    // Bildirim sıklık koruması (Aynı bölgede birden fazla cari varsa sırayla en az 15 sn arayla bildir)
    if (now - lastNotificationTimeRef.current < MIN_NOTIFICATION_INTERVAL_MS) return;

    // Bildirime uygun cariler varsa EN YAKIN olanı seç ve SADECE 1 KEZ bildir
    if (eligibleCandidates.length > 0) {
      // Mesafeye göre en yakından uzağa sırala
      eligibleCandidates.sort((a, b) => a.dist - b.dist);
      const chosen = eligibleCandidates[0];
      const chosenIdStr = String(chosen.cari.id);

      // Kalıcı hafızaya ve ref'e kaydet (Tekrar bildirim gitmeyecek)
      notifiedCarilerRef.current = persistNotifiedCari(chosenIdStr);
      lastNotificationTimeRef.current = now;

      console.log(`[Geofence] ${proximityThreshold}m alanına giren cari için TEK SEFERLİK bildirim: ${chosen.cari.ad} (${Math.round(chosen.dist)}m)`);

      // 1. OneSignal / Web Push Bildirimi Gönder
      sendProximityPushNotification(chosen.cari, chosen.dist);

      // 2. Uygulama İçi İnteraktif Alert Modalı Aç (Evet/Hayır Butonlu)
      setActiveProximityAlert({
        cari: chosen.cari,
        distance: chosen.dist,
      });
    }
  }, [userLocation, allCariler, proximityThreshold, activeProximityAlert]);

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
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      } catch (e) {
        setIsInstallModalOpen(true);
      }
    } else {
      // iOS Safari veya tarayıcı menüsü rehberini aç
      setIsInstallModalOpen(true);
    }
  };

  // Belirli bir cari için yaklaşma testini tetikle
  const handleTestProximityForCari = (cari) => {
    if (!cari || !cari.enlem || !cari.boylam) return;

    // Kullanıcıyı bu carinin yanına taşı
    const testLat = cari.enlem + 0.00015;
    const testLng = cari.boylam + 0.00015;

    const cariIdStr = String(cari.id);
    // Test amaçlı olduğu için bu cariyi hafızadan temizle ki anında bildirim çıksın
    notifiedCarilerRef.current = clearStoredNotifiedCari(cariIdStr);
    insideCarilerRef.current.delete(cariIdStr);
    lastNotificationTimeRef.current = 0;
    isInitialFixRef.current = false;

    // Varsa açık modalları kapat
    setSelectedCari(null);
    setActiveProximityAlert(null);

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
    // Haritaya tıklandığında anlık test yapılabilmesi için sıklık koruma sayacını sıfırla
    lastNotificationTimeRef.current = 0;
    isInitialFixRef.current = false;
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
        proximityThreshold={proximityThreshold}
        setProximityThreshold={handleUpdateProximity}
        onResetNotifications={handleResetNotificationHistory}
      />

      {/* Toast Bilgilendirme */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[3000] px-4 py-2 rounded-2xl bg-slate-900/95 border border-blue-500/80 text-blue-200 text-xs font-semibold shadow-xl shadow-blue-500/20 backdrop-blur-md animate-fade-in flex items-center gap-2 max-w-[90vw] text-center">
          <span>{toastMessage}</span>
        </div>
      )}

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
          proximityThreshold={proximityThreshold}
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
        proximityThreshold={proximityThreshold}
      />

      {/* Yaklaşma Bildirim Modalı (Evet / Hayır) */}
      <ProximityAlertModal
        alertData={activeProximityAlert}
        onYes={handleProximityYes}
        onNo={handleProximityNo}
        proximityThreshold={proximityThreshold}
      />

      {/* Cari Borç - Alacak Detay Kartı */}
      <CariDetailModal
        cari={selectedCari}
        onClose={() => setSelectedCari(null)}
        onTestProximity={handleTestProximityForCari}
      />

      {/* PWA Kurulum & Ana Ekrana Ekle Modal */}
      <InstallPromptModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        onInstall={() => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
          }
        }}
        hasDeferredPrompt={!!deferredPrompt}
      />
    </div>
  );
}
