import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

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

  // Cariler ve kullanici konumu JSON serilestirmesi
  const mapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #0f172a; }
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
    }
    .leaflet-popup-tip { background: #1e293b !important; }
    .btn-action {
      flex: 1; padding: 7px 10px; border-radius: 8px; border: none; font-size: 11px; font-weight: bold; cursor: pointer; color: white;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([39.9086, 41.2769], 14);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    var userMarker = null;
    var userCircle = null;
    var markersLayer = L.layerGroup().addTo(map);

    var isSimulating = ${isSimulating};
    var proximityRadius = ${proximityThreshold || 50};

    // Harita tiklama
    map.on('click', function(e) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'MAP_CLICK',
          lat: e.latlng.lat,
          lng: e.latlng.lng
        }));
      }
    });

    function postAppMessage(type, data) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, data: data }));
      }
    }

    // Carileri ciz
    function renderCariler(list) {
      markersLayer.clearLayers();
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
        
        var popupContent = '<div style="min-width:180px;font-family:system-ui,-apple-system,sans-serif;">' +
          '<div style="font-size:10px;font-weight:700;color:#94a3b8;">' + (c.kod || '') + '</div>' +
          '<div style="font-size:13px;font-weight:800;color:#ffffff;margin-top:2px;">' + (c.ad || '') + '</div>' +
          '<div style="font-size:11px;color:#cbd5e1;margin-top:4px;">' + (c.adresTemiz || c.ilce || '') + '</div>' +
          '<div style="margin-top:8px;padding-top:6px;border-top:1px solid #334155;display:flex;justify-content:space-between;align-items:center;">' +
            '<span style="font-size:11px;color:#94a3b8;">Bakiye:</span>' +
            '<strong style="font-size:12px;color:' + color + ';">' + Math.abs(c.bakiye || 0).toLocaleString('tr-TR') + ' ₺</strong>' +
          '</div>' +
          '<div style="display:flex;gap:6px;margin-top:10px;">' +
            '<button onclick="postAppMessage(\'SELECT_CARI\', ' + c.id + ')" class="btn-action" style="background:#2563eb;">Detay</button>' +
            '<button onclick="postAppMessage(\'TEST_CARI\', ' + c.id + ')" class="btn-action" style="background:#d97706;">🎯 ' + proximityRadius + 'm Test</button>' +
          '</div>' +
        '</div>';

        m.bindPopup(popupContent);
        markersLayer.addLayer(m);
      });
    }

    // Kullanici konumu guncelle
    function updateUserLoc(lat, lng, radius) {
      if (!userMarker) {
        var userIcon = L.divIcon({
          className: 'user-pulse',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
        userCircle = L.circle([lat, lng], {
          radius: radius || 50,
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
        userCircle.setRadius(radius || 50);
      }
    }

    // Ilk yukleme
    var initialCariler = ${JSON.stringify(cariler.slice(0, 300))};
    renderCariler(initialCariler);

    ${userLocation ? `updateUserLoc(${userLocation.latitude}, ${userLocation.longitude}, ${proximityThreshold || 50});` : ''}
  </script>
</body>
</html>
  `;

  // Konum degistiginde webview'a komut gonder
  useEffect(() => {
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

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SELECT_CARI') {
        const found = cariler.find((c) => String(c.id) === String(data.data));
        if (found && onSelectCari) onSelectCari(found);
      } else if (data.type === 'TEST_CARI') {
        const found = cariler.find((c) => String(c.id) === String(data.data));
        if (found && onTestProximity) onTestProximity(found);
      } else if (data.type === 'MAP_CLICK') {
        if (isSimulating && onSimulateLocation) {
          onSimulateLocation(data.lat, data.lng);
        }
      }
    } catch (e) {
      console.warn('Map message error:', e);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
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