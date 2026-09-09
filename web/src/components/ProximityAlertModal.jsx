import React from 'react';
import { MapPin, Navigation2, Check, X, Building2 } from 'lucide-react';
import { formatDistance } from '../utils/distance';

export default function ProximityAlertModal({ alertData, onYes, onNo }) {
  if (!alertData || !alertData.cari) return null;

  const { cari, distance } = alertData;

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-md bg-slate-900 border-2 border-blue-500/80 rounded-3xl p-6 shadow-2xl shadow-blue-500/20 text-center relative overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Radar Ping Animation */}
        <div className="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center">
          <span className="absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-30 animate-ping"></span>
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/50">
            <Building2 size={32} />
          </div>
        </div>

        {/* Distance Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/90 text-blue-300 border border-blue-800/80 text-xs font-semibold mb-3">
          <Navigation2 size={12} className="rotate-45" />
          Yaklaşık {formatDistance(distance)} mesafede (200m Çapı İçi)
        </div>

        {/* Question Text */}
        <h3 className="text-lg sm:text-xl font-bold text-white mb-2 leading-tight">
          <span className="text-blue-400">{cari.ad}</span>
        </h3>
        
        <p className="text-slate-300 text-sm sm:text-base font-medium mb-6 px-2 leading-relaxed">
          Firmasına yaklaştınız, uğramak ister misiniz?
        </p>

        {/* Action Buttons (Evet / Hayır) */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNo(cari)}
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-300 font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
          >
            <X size={18} />
            Hayır
          </button>

          <button
            onClick={() => onYes(cari)}
            className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check size={18} />
            Evet
          </button>
        </div>

        {/* Sub-note */}
        <p className="text-[11px] text-slate-500 mt-4">
          * Evet butonuna bastığınızda firmanın güncel borç, alacak ve iletişim kartı açılacaktır.
        </p>
      </div>
    </div>
  );
}
