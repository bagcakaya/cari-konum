import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { LEAFLET_CSS, LEAFLET_JS } from './leafletBundle';

// HTML şablonu: Leaflet JS & CSS gömülü (CDN bağımlılığı sıfır), CartoDB Voyager tiles (engelsiz ve hızlı)
const createMapHtml = (initialCariler = []) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    ${LEAFLET_CSS}
  </style>
  <style>
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body {
      margin: 0; padding: 0;
      width: 100%; height: 100%;
      overflow: hidden;
      background: #0f172a;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #map {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      width: 100%; height: 100%;
      background: #0f172a;
    }
    .user-pulse {
      position: relative;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #2563eb;
      border: 3px solid #ffffff;
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
    }
    .user-pulse::before {
      content: '';
      position: absolute;
      top: -10px; left: -10px;
      width: 40px; height: 40px;
      border-radius: 50%;
      background: rgba(37, 99, 235, 0.4);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.6); opacity: 0.8; }
      100% { transform: scale(2.0); opacity: 0; }
    }
    .leaflet-popup-content-wrapper {
      background: #1e293b !important;
      color: #f8fafc !important;
      border-radius: 14px !important;
      border: 1px solid #334155 !important;
      padding: 4px !important;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
    }
    .leaflet-popup-tip { background: #1e293b !important; }
    .btn-action {
      flex: 1; padding: 7px 10px; border-radius: 8px; border: none; font-size: 11px; font-weight: bold; cursor: pointer; color: white;
    }
    .btn-action:active { opacity: 0.8; }
    .leaflet-control-layers {
      background: #1e293b !important;
      color: #f8fafc !important;
      border: 1px solid #334155 !important;
      border-radius: 10px !important;
      font-size: 11px !important;
      font-weight: 600 !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
    }
    .leaflet-control-layers-expanded {
      padding: 6px 10px !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    ${LEAFLET_JS}
  </script>
  <script>
    // JS Hata Yakalama (React Native tarafına iletmek için)
    window.onerror = function(msg, url, line) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'MAP_ERROR',
          error: msg + ' (' + line + ')'
        }));
      }
    };

    function postAppMessage(type, data) {
      try {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, data: data }));
        }
      } catch (e) {
        console.warn('postAppMessage error:', e);
      }
    }

    // Harita Hazır El Sıkışması (Asenkron köprü gelene kadar 100ms aralıkla dener)
    function notifyMapReady() {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
        return true;
      }
      return false;
    }
    if (!notifyMapReady()) {
      var checkReadyInterval = setInterval(function() {
        if (notifyMapReady()) clearInterval(checkReadyInterval);
      }, 100);
      setTimeout(function() { clearInterval(checkReadyInterval); }, 6000);
    }

    var defaultCenter = [39.9086, 41.2769];
    var map = L.map('map', { zoomControl: false }).setView(defaultCenter, 14);

    // 1. Google Maps Standart Yol Haritası (Binalar, Kapı Numaraları, Cadde/Sokak İsimleri)
    var googleRoadmap = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 21,
      attribution: '&copy; Google Maps'
    }).addTo(map);

    // 2. Google Maps Hibrit / Uydu Katmanı (Uydu fotoğrafı + Sokak isimleri)
    var googleHybrid = L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 21,
      attribution: '&copy; Google Maps'
    });

    var baseMaps = {
      "Google Harita": googleRoadmap,
      "Google Uydu": googleHybrid
    };
    L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

    setTimeout(function() { map.invalidateSize(); }, 200);
    setTimeout(function() { map.invalidateSize(); }, 800);

    var userMarker = null;
    var userCircle = null;
    var markersLayer = L.layerGroup().addTo(map);
    var proximityRadius = 50;

    map.on('click', function(e) {
      postAppMessage('MAP_CLICK', { lat: e.latlng.lat, lng: e.latlng.lng });
    });

    function setCariler(list) {
      markersLayer.clearLayers();
      if (!list || !list.length) return;
      
      list.forEach(function(c) {
        if (!c.enlem || !c.boylam) return;
        var isBorclu = c.bakiye > 0;
        var isAlacakli = c.bakiye < 0;
        var color = isBorclu ? '#ef4444' : (isAlacakli ? '#10b981' : '#64748b');

        var icon = L.divIcon({
          className: 'custom-pin',
          html: '<div style="width:26px;height:26px;background:' + color + ';border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.5);font-size:12px;">📍</div>',
          iconSize: [28, 28],
          iconAnchor: [14, 28],
          popupAnchor: [0, -28]
        });

        var m = L.marker([c.enlem, c.boylam], { icon: icon });
        
        var bakiyeStr = Math.abs(c.bakiye || 0).toLocaleString('tr-TR') + ' ₺';
        var popupContent = '<div style="min-width:180px;">' +
          '<div style="font-size:10px;font-weight:700;color:#94a3b8;">' + (c.kod || '') + '</div>' +
          '<div style="font-size:13px;font-weight:800;color:#ffffff;margin-top:2px;">' + (c.ad || '') + '</div>' +
          '<div style="font-size:11px;color:#cbd5e1;margin-top:4px;">' + (c.adresTemiz || c.ilce || '') + '</div>' +
          '<div style="margin-top:8px;padding-top:6px;border-top:1px solid #334155;display:flex;justify-content:space-between;align-items:center;">' +
            '<span style="font-size:11px;color:#94a3b8;">Bakiye:</span>' +
            '<strong style="font-size:12px;color:' + color + ';">' + bakiyeStr + '</strong>' +
          '</div>' +
          '<div style="display:flex;gap:6px;margin-top:10px;">' +
            '<button onclick="postAppMessage(\\'SELECT_CARI\\', ' + c.id + ')" class="btn-action" style="background:#2563eb;">Detay</button>' +
            '<button onclick="postAppMessage(\\'TEST_CARI\\', ' + c.id + ')" class="btn-action" style="background:#d97706;">🎯 50m Test</button>' +
          '</div>' +
        '</div>';

        m.bindPopup(popupContent);
        markersLayer.addLayer(m);
      });
      map.invalidateSize();
    }

    function updateUserLoc(lat, lng, radius) {
      proximityRadius = radius || proximityRadius || 50;
      if (!userMarker) {
        var userIcon = L.divIcon({
          className: 'user-pulse',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
        userCircle = L.circle([lat, lng], {
          radius: proximityRadius,
          color: '#2563eb',
          fillColor: '#3b82f6',
          fillOpacity: 0.15,
          weight: 1.5,
          dashArray: '4, 6'
        }).addTo(map);
        map.setView([lat, lng], 15);
      } else {
        userMarker.setLatLng([lat, lng]);
        userCircle.setLatLng([lat, lng]);
        userCircle.setRadius(proximityRadius);
      }
    }

    // İlk carileri başlangıçta çiz (varsa)
    ${initialCariler.length > 0 ? `setCariler(${JSON.stringify(initialCariler)});` : ''}
  </script>
</body>
</html>
`;

export default function MapWebView({
  cariler = [],
  userLocation,
  proximityThreshold = 50,
  onSelectCari,
  onTestProximity,
  onSimulateLocation,
  isSimulating = false,
}) {
  const webViewRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Sadece geçerli koordinatlı cariler
  const validCariler = useMemo(
    () => cariler.filter((c) => c.enlem && c.boylam),
    [cariler]
  );

  // Başlangıç HTML'i - Cariler içine gömülerek anında görünmesi garanti edilir
  const mapHtml = useMemo(
    () => createMapHtml(validCariler),
    [] // İlk açılışta oluşturulur
  );

  // Carileri WebView'a aktarma fonksiyonu
  const injectCariler = useCallback(() => {
    if (webViewRef.current && validCariler.length > 0) {
      const js = `
        if (typeof setCariler === 'function') {
          setCariler(${JSON.stringify(validCariler)});
        }
        true;
      `;
      webViewRef.current.injectJavaScript(js);
    }
  }, [validCariler]);

  // Konumu WebView'a aktarma fonksiyonu
  const injectLocation = useCallback(() => {
    if (webViewRef.current && userLocation) {
      const js = `
        if (typeof updateUserLoc === 'function') {
          updateUserLoc(${userLocation.latitude}, ${userLocation.longitude}, ${proximityThreshold || 50});
        }
        true;
      `;
      webViewRef.current.injectJavaScript(js);
    }
  }, [userLocation, proximityThreshold]);

  // Harita hazır olduğunda veya cariler listesi güncellendiğinde aktar
  useEffect(() => {
    if (isMapReady) {
      injectCariler();
    }
  }, [isMapReady, injectCariler]);

  // Konum değiştiğinde aktar
  useEffect(() => {
    if (isMapReady) {
      injectLocation();
    }
  }, [isMapReady, injectLocation]);

  // WebView yüklemesi bittiğinde hemen veri enjekte et (Handshake beklenmeden çift koruma)
  const handleLoadEnd = () => {
    setTimeout(() => {
      injectCariler();
      injectLocation();
    }, 150);
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MAP_READY') {
        setIsMapReady(true);
        injectCariler();
        injectLocation();
      } else if (data.type === 'MAP_ERROR') {
        console.warn('[MapWebView JS Error]:', data.error);
      } else if (data.type === 'SELECT_CARI') {
        const found = cariler.find((c) => String(c.id) === String(data.data));
        if (found && onSelectCari) onSelectCari(found);
      } else if (data.type === 'TEST_CARI') {
        const found = cariler.find((c) => String(c.id) === String(data.data));
        if (found && onTestProximity) onTestProximity(found);
      } else if (data.type === 'MAP_CLICK') {
        if (isSimulating && onSimulateLocation && data.data) {
          onSimulateLocation(data.data.lat, data.data.lng);
        }
      }
    } catch (e) {
      console.warn('Map message parse error:', e);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml, baseUrl: 'https://cari-konum.vercel.app' }}
        style={styles.webview}
        onMessage={handleMessage}
        onLoadEnd={handleLoadEnd}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={false}
        mixedContentMode="always"
        androidHardwareAccelerationDisabled={false}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        userAgent="Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 CariRadar/1.0"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
});