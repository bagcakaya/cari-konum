import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Locate, Navigation, Crosshair } from 'lucide-react';
import { formatCurrency } from '../utils/distance';

export default function Map({
  cariler,
  userLocation,
  onSelectCari,
  onTestProximity,
  isSimulating,
  setIsSimulating,
  onSimulateLocation,
  proximityThreshold = 50
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const userCircleRef = useRef(null);
  const markersLayerRef = useRef(null);

  const isSimulatingRef = useRef(isSimulating);
  const onSimulateLocationRef = useRef(onSimulateLocation);

  useEffect(() => {
    isSimulatingRef.current = isSimulating;
  }, [isSimulating]);

  useEffect(() => {
    onSimulateLocationRef.current = onSimulateLocation;
  }, [onSimulateLocation]);

  // Haritayi ilk olusturma
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Erzurum merkezli varsayilan harita
    const defaultCenter = [39.9086, 41.2769];
    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 14,
      zoomControl: false,
    });

    // Standart Ucretsiz OpenStreetMap Katmani (API Key gerektirmez)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Zoom kontrollerini sag altta konumlandir
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Katman grubu
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;
    window.__mapInstance = map;

    // Haritaya tiklandiginda (Simulasyon modu aciksa konum tasi)
    map.on('click', (e) => {
      if (isSimulatingRef.current && onSimulateLocationRef.current) {
        onSimulateLocationRef.current(e.latlng.lat, e.latlng.lng);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      window.__mapInstance = null;
    };
  }, []);

  // Kullanici konumu degistiginde veya olusturuldugunda guncelle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;

    const { lat, lng } = userLocation;

    // 1. Kullanici Noktasi (Pulse Efekti)
    if (!userMarkerRef.current) {
      const userIcon = L.divIcon({
        className: 'user-location-pulse',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      userMarkerRef.current = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng([lat, lng]);
    }

    // 2. Yaricap Cemberi (Varsayilan 50m)
    if (!userCircleRef.current) {
      userCircleRef.current = L.circle([lat, lng], {
        radius: proximityThreshold || 50,
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
        weight: 1.5,
        dashArray: '4, 6',
      }).addTo(map);
    } else {
      userCircleRef.current.setLatLng([lat, lng]);
      userCircleRef.current.setRadius(proximityThreshold || 50);
    }
  }, [userLocation, proximityThreshold]);

  // Carileri Haritaya Ciz
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    cariler.forEach((cari) => {
      if (!cari.enlem || !cari.boylam) return;

      const isBorclu = cari.bakiye > 0;
      const isAlacakli = cari.bakiye < 0;
      const statusClass = isBorclu ? 'borclu' : isAlacakli ? 'alacakli' : 'kapali';
      const bgColor = isBorclu ? '#ef4444' : isAlacakli ? '#10b981' : '#64748b';

      const customIcon = L.divIcon({
        className: `custom-pin ${statusClass}`,
        html: `<div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold;">📍</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
      });

      const marker = L.marker([cari.enlem, cari.boylam], { icon: customIcon });

      // Popup html
      const popupContent = `
        <div style="font-family: inherit; min-width: 180px;">
          <div style="font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 0.5px;">${cari.kod}</div>
          <div style="font-size: 13px; font-weight: 700; color: #f8fafc; margin-top: 2px;">${cari.ad}</div>
          <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px;">${cari.adresTemiz || cari.ilce || ''}</div>
          
          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #334155; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; color: #94a3b8;">Bakiye:</span>
            <strong style="font-size: 12px; color: ${bgColor};">${formatCurrency(Math.abs(cari.bakiye))}</strong>
          </div>
          
          <div style="display: flex; gap: 4px; margin-top: 8px;">
            <button id="btn-view-${cari.id}" style="flex: 1; padding: 6px 8px; background: #2563eb; color: white; border: none; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">
              Detay Gör
            </button>
            <button id="btn-test-${cari.id}" style="flex: 1; padding: 6px 8px; background: #d97706; color: white; border: none; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;" title="${proximityThreshold || 50}m Bildirimini Test Et">
              🎯 ${proximityThreshold || 50}m Test
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const btnView = document.getElementById(`btn-view-${cari.id}`);
        if (btnView) {
          btnView.onclick = () => {
            onSelectCari(cari);
            marker.closePopup();
          };
        }

        const btnTest = document.getElementById(`btn-test-${cari.id}`);
        if (btnTest) {
          btnTest.onclick = () => {
            if (onTestProximity) onTestProximity(cari);
            marker.closePopup();
          };
        }
      });

      marker.addTo(markersLayer);
    });
  }, [cariler, onSelectCari, onTestProximity]);

  // Haritayi kullanici konumuna odakla
  const handleRecenter = () => {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 16, { animate: true });
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Harita Alani */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Harita Uzeri Hizli Aksiyon Dugmeleri */}
      <div className="absolute top-4 right-4 z-[500] flex flex-col gap-2">
        {/* Konumuma Git */}
        <button
          onClick={handleRecenter}
          title="Konumuma Git"
          className="w-11 h-11 rounded-full bg-slate-900/90 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 shadow-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer backdrop-blur-sm"
        >
          <Locate size={20} className="text-blue-400" />
        </button>

        {/* Test/Simulasyon Modu Butonu */}
        <button
          onClick={() => setIsSimulating(!isSimulating)}
          title={isSimulating ? "Simülasyon Modunu Kapat" : "Haritaya Tıklayarak Konum Simüle Et"}
          className={`w-11 h-11 rounded-full border shadow-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer backdrop-blur-sm ${
            isSimulating
              ? 'bg-amber-500 border-amber-400 text-black shadow-amber-500/30 ring-2 ring-amber-400'
              : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          <Crosshair size={20} />
        </button>
      </div>

      {/* Simulasyon Bilgi Seridi */}
      {isSimulating && (
        <div className="absolute top-4 left-4 right-16 z-[500] bg-amber-500/95 text-slate-950 px-3 py-2 rounded-xl text-xs font-semibold shadow-lg flex items-center gap-2 backdrop-blur-sm animate-pulse">
          <Crosshair size={16} className="shrink-0" />
          <span>Test Modu Aktif: Haritada herhangi bir noktaya tıklayarak konumunuzu taşıyın ({proximityThreshold || 50}m bildirimini test edin).</span>
        </div>
      )}
    </div>
  );
}
