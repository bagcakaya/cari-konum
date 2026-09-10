import React, { useState } from 'react';
import { Search, MapPin, Navigation, ArrowDownLeft, ArrowUpRight, CheckCircle2, ChevronUp, ChevronDown, Crosshair } from 'lucide-react';
import { formatDistance, formatCurrency } from '../utils/distance';

export default function CariList({
  cariler,
  onSelectCari,
  onTestProximity,
  activeFilter,
  setActiveFilter,
  searchQuery,
  setSearchQuery,
  isOpen,
  setIsOpen,
  proximityThreshold = 50
}) {
  const isBorclu = (c) => c.bakiye > 0;
  const isAlacakli = (c) => c.bakiye < 0;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[1000] bg-slate-900/95 border-t border-slate-700/80 backdrop-blur-md rounded-t-3xl transition-all duration-300 shadow-2xl flex flex-col ${
      isOpen ? 'h-[75vh]' : 'h-24'
    }`}>
      {/* Drawer Handle & Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full pt-3 pb-2 px-4 flex flex-col items-center cursor-pointer select-none"
      >
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mb-2" />
        
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white">Cariler & Mesafeler</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 font-semibold border border-blue-700/50">
              {cariler.length}
            </span>
          </div>

          <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
            <span>{isOpen ? 'Haritaya Dön' : 'Listeyi Aç'}</span>
            {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </div>
        </div>
      </div>

      {/* Arama ve Filtre Cubugu */}
      <div className="px-4 pb-3 space-y-2 border-b border-slate-800">
        {/* Arama Kutusu */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari adı, kodu veya ilçe ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Filtre Butonlari */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setActiveFilter('hepsi')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer ${
              activeFilter === 'hepsi'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Tümü ({cariler.length})
          </button>

          <button
            onClick={() => setActiveFilter('yakin')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer ${
              activeFilter === 'yakin'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            📍 En Yakındakiler
          </button>

          <button
            onClick={() => setActiveFilter('borclu')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer ${
              activeFilter === 'borclu'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Borçlular
          </button>

          <button
            onClick={() => setActiveFilter('alacakli')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer ${
              activeFilter === 'alacakli'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Alacaklılar
          </button>
        </div>
      </div>

      {/* Kaydirilabilir Liste */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-800/60">
          {cariler.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Arama kriterlerine uygun cari bulunamadı.
            </div>
          ) : (
            cariler.map((cari) => {
              const borclu = isBorclu(cari);
              const alacakli = isAlacakli(cari);

              return (
                <div
                  key={cari.id}
                  onClick={() => onSelectCari(cari)}
                  className="pt-2.5 first:pt-0 cursor-pointer group"
                >
                  <div className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/90 border border-slate-700/40 transition-all flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-700/80 text-slate-300">
                          {cari.kod}
                        </span>
                        {cari.distance !== undefined && cari.distance !== Infinity && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                            cari.distance <= proximityThreshold
                              ? 'bg-blue-900 text-blue-300 border border-blue-700 animate-pulse'
                              : 'bg-slate-700/50 text-slate-400'
                          }`}>
                            <Navigation size={10} className="rotate-45" />
                            {formatDistance(cari.distance)}
                          </span>
                        )}
                        {(!cari.enlem || !cari.boylam) && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50">
                            Haritada Yok (Açık Adres Eksik)
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-100 truncate group-hover:text-blue-400 transition-colors">
                        {cari.ad}
                      </h4>

                      <p className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1">
                        <MapPin size={12} className="shrink-0 text-slate-500" />
                        <span>{[cari.adresTemiz || cari.adres, cari.ilce].filter(Boolean).join(' • ') || 'Adres bilgisi yok'}</span>
                      </p>
                    </div>

                    {/* Bakiye Rozeti */}
                    <div className="text-right shrink-0">
                      <div className={`text-xs sm:text-sm font-bold flex items-center justify-end gap-0.5 ${
                        borclu ? 'text-red-400' : alacakli ? 'text-emerald-400' : 'text-slate-400'
                      }`}>
                        {borclu && <ArrowDownLeft size={14} />}
                        {alacakli && <ArrowUpRight size={14} />}
                        {cari.bakiye === 0 && <CheckCircle2 size={14} />}
                        <span>{formatCurrency(Math.abs(cari.bakiye))}</span>
                      </div>

                      <div className="text-[10px] text-slate-500">
                        {borclu ? 'Borç' : alacakli ? 'Alacak' : 'Kapalı'}
                      </div>

                      {onTestProximity && cari.enlem && cari.boylam && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTestProximity(cari);
                            setIsOpen(false);
                          }}
                          title={`${proximityThreshold || 50}m Yakınlık Bildirimini Test Et`}
                          className="mt-1 px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Crosshair size={10} className="text-amber-400" />
                          <span>Test</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
