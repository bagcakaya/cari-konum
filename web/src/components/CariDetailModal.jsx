import React from 'react';
import { formatCurrency } from '../utils/distance';
import { X, MapPin, Phone, User, Navigation, AlertCircle, ArrowUpRight, ArrowDownLeft, CheckCircle2, Crosshair } from 'lucide-react';

export default function CariDetailModal({ cari, onClose, onTestProximity }) {
  if (!cari) return null;

  const isBorclu = cari.bakiye > 0;
  const isAlacakli = cari.bakiye < 0;
  const isKapali = cari.bakiye === 0;

  // Harita rota URL'i
  const navigationUrl = cari.enlem && cari.boylam
    ? `https://www.google.com/maps/dir/?api=1&destination=${cari.enlem},${cari.boylam}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((cari.adresTemiz || cari.adres) + ' ' + (cari.ilce || '') + ' ' + (cari.il || ''))}`;

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full sm:max-w-lg bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800/80 to-slate-900">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono tracking-wider font-semibold px-2 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/60">
              {cari.kod}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
              isBorclu ? 'bg-red-950/80 text-red-400 border border-red-800/60' :
              isAlacakli ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' :
              'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              {isBorclu && <ArrowDownLeft size={12} />}
              {isAlacakli && <ArrowUpRight size={12} />}
              {isKapali && <CheckCircle2 size={12} />}
              {isBorclu ? 'Borçlu (Alacağımız Var)' : isAlacakli ? 'Alacaklı (Borcumuz Var)' : 'Hesap Sıfır (Kapalı)'}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-white pr-8 leading-snug">
            {cari.ad}
          </h2>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Finansal Bakiye Özeti Kartı */}
          <div className={`p-4 rounded-xl border ${
            isBorclu ? 'bg-red-950/20 border-red-900/40 text-red-100' :
            isAlacakli ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-100' :
            'bg-slate-800/50 border-slate-700 text-slate-200'
          }`}>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
              Net Bakiye
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {formatCurrency(Math.abs(cari.bakiye))}
              <span className="text-xs font-medium ml-2 opacity-80">
                {isBorclu ? '(Bize Borçlu)' : isAlacakli ? '(Alacaklı)' : ''}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-800/80">
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[11px] text-slate-400">Toplam Borç</div>
                <div className="text-sm font-bold text-slate-100">
                  {formatCurrency(cari.borc)}
                </div>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[11px] text-slate-400">Toplam Alacak</div>
                <div className="text-sm font-bold text-slate-100">
                  {formatCurrency(cari.alacak)}
                </div>
              </div>
            </div>
          </div>

          {/* Adres Bilgisi */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-900/30 text-blue-400 shrink-0 mt-0.5">
                <MapPin size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-400">Adres & Konum</div>
                <div className="text-sm text-slate-100 mt-0.5 font-medium leading-relaxed">
                  {cari.adresTemiz || cari.adres || 'Açık adres girilmemiş.'}
                </div>
                <div className="text-xs text-blue-400 mt-1 font-semibold">
                  {[cari.ilce, cari.il].filter(Boolean).join(' / ')}
                </div>
              </div>
            </div>

            {/* Yetkili & Telefon */}
            {(cari.yetkili || cari.telefon) && (
              <div className="pt-3 border-t border-slate-700/50 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {cari.yetkili && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <User size={14} className="text-slate-500" />
                    <span>Yetkili: <strong className="text-white">{cari.yetkili}</strong></span>
                  </div>
                )}
                {cari.telefon && (
                  <a
                    href={`tel:${cari.telefon}`}
                    className="flex items-center gap-2 text-blue-400 hover:underline"
                  >
                    <Phone size={14} className="text-blue-500" />
                    <span>Tel: <strong className="text-white">{cari.telefon}</strong></span>
                  </a>
                )}
              </div>
            )}
            {/* 200m Test Butonu */}
            {onTestProximity && cari.enlem && cari.boylam && (
              <button
                onClick={() => onTestProximity(cari)}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 active:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Crosshair size={15} className="text-amber-400" />
                <span>🎯 Bu Carinin 200m Yakınlık Bildirimini Test Et</span>
              </button>
            )}
          </div>

        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex gap-3">
          <a
            href={navigationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Navigation size={18} />
            Yol Tarifi Al
          </a>

          {cari.telefon && (
            <a
              href={`tel:${cari.telefon}`}
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Phone size={18} />
              Ara
            </a>
          )}

          <button
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-300 font-medium text-sm transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
