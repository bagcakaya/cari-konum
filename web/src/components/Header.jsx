import React from 'react';
import { Radio, RefreshCw, Bell, BellOff, Download, ShieldCheck } from 'lucide-react';

export default function Header({
  isTracking,
  hasNotificationPermission,
  onRequestNotification,
  onRefreshData,
  isRefreshing,
  deferredPrompt,
  onInstallPWA,
  proximityThreshold,
  setProximityThreshold
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-[1000] bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-4 py-2.5 flex items-center justify-between shadow-lg">
      {/* Sol Logo & Baslik */}
      <div className="flex items-center gap-2.5">
        <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Radio size={18} className="animate-pulse" />
        </div>
        <div>
          <h1 className="text-sm font-extrabold text-white leading-tight tracking-tight flex items-center gap-1.5">
            Cari Konum
            <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-blue-950 text-blue-400 border border-blue-800/80">
              POLATLAR2025
            </span>
          </h1>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isTracking ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              <span className="text-slate-300 font-medium">{isTracking ? `GPS Aktif (${proximityThreshold}m Takip)` : 'GPS Bekleniyor'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Sag Aksiyonlar */}
      <div className="flex items-center gap-1.5">
        {/* Yarıçap Seçici (Varsayılan 100m) */}
        <select
          value={proximityThreshold}
          onChange={(e) => setProximityThreshold(Number(e.target.value))}
          className="bg-slate-800 hover:bg-slate-750 border border-slate-700 text-blue-400 text-xs font-bold rounded-xl px-2 py-1.5 outline-none cursor-pointer focus:border-blue-500 transition-colors shadow-sm"
          title="Yakınlık Algılama Mesafesi"
        >
          <option value={50}>50m</option>
          <option value={100}>100m</option>
          <option value={150}>150m</option>
          <option value={200}>200m</option>
        </select>
        {/* PWA Yukle / Ana Ekrana Ekle Butonu */}
        {deferredPrompt && (
          <button
            onClick={onInstallPWA}
            className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            title="Uygulamayı Ana Ekrana Ekle"
          >
            <Download size={14} />
            <span>Yükle</span>
          </button>
        )}

        {/* Bildirim Izni Butonu */}
        {!hasNotificationPermission && (
          <button
            onClick={onRequestNotification}
            className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs flex items-center gap-1 transition-colors cursor-pointer"
            title="Bildirim İzni Ver"
          >
            <BellOff size={16} />
            <span className="hidden sm:inline">Bildirim Aç</span>
          </button>
        )}

        {hasNotificationPermission && (
          <div className="p-2 rounded-xl text-emerald-400 bg-emerald-500/10 border border-emerald-500/30" title="Bildirimler Aktif">
            <Bell size={16} />
          </div>
        )}

        {/* Veri Yenileme Butonu */}
        <button
          onClick={onRefreshData}
          disabled={isRefreshing}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/80"
          title="Verileri Canlı Yenile"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-blue-400' : ''} />
        </button>
      </div>
    </header>
  );
}
