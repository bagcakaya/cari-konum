import React from 'react';
import { Download, Share, PlusSquare, X, Smartphone, CheckCircle } from 'lucide-react';

export default function InstallPromptModal({ isOpen, onClose, onInstall, hasDeferredPrompt }) {
  if (!isOpen) return null;

  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Smartphone size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Ana Ekrana Ekle</h3>
              <p className="text-xs text-slate-400">CariRadar Mobil PWA Kurulumu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {isStandalone ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle size={32} />
            </div>
            <h4 className="font-semibold text-white">Uygulama Zaten Yüklü!</h4>
            <p className="text-xs text-slate-400">
              CariRadar şu anda tam ekran mobil uygulama modunda çalışıyor.
            </p>
            <button
              onClick={onClose}
              className="mt-2 w-full py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-semibold text-white transition-colors"
            >
              Tamam
            </button>
          </div>
        ) : isIOS ? (
          /* iOS Safari Rehberi */
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              iPhone'unuzda Safari tarayıcısını kullanarak CariRadar'ı ana ekranınıza doğrudan bir uygulama gibi ekleyebilirsiniz:
            </p>

            <div className="space-y-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 text-xs text-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div className="flex items-center gap-1.5">
                  <span>Safari alt menüsündeki</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-700 text-white font-medium">
                    <Share size={12} /> Paylaş
                  </span>
                  <span>düğmesine dokunun.</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div className="flex items-center gap-1.5">
                  <span>Açılan menüde aşağı kaydırıp</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-700 text-white font-medium">
                    <PlusSquare size={12} /> Ana Ekrana Ekle
                  </span>
                  <span>'yi seçin.</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  Sağ üst köşedeki <span className="font-semibold text-blue-400">"Ekle"</span> butonuna dokunun.
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle size={16} className="flex-shrink-0" />
              <span>Artık ana ekrandan tarayıcı çubuğu olmadan tam ekran açılacaktır!</span>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl text-xs sm:text-sm font-semibold text-white transition-colors"
            >
              Anladım
            </button>
          </div>
        ) : hasDeferredPrompt ? (
          /* Android / Desktop Chrome Doğrudan Yükleme */
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              CariRadar'ı cihazınıza kurarak internet kesintilerinde bile hızlı açılan tam ekran bir deneyim yaşayabilirsiniz.
            </p>

            <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle size={14} /> <span>371 Cari çevrimdışı hafızada</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle size={14} /> <span>GPS 100m yaklaşma radarı</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle size={14} /> <span>Canlı borç/alacak takibi</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 transition-colors"
              >
                Vazgeç
              </button>
              <button
                onClick={() => {
                  onInstall();
                  onClose();
                }}
                className="flex-[2] py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl text-xs sm:text-sm font-semibold text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <Download size={16} />
                <span>Ana Ekrana Ekle</span>
              </button>
            </div>
          </div>
        ) : (
          /* Android / Tarayıcı Menüsü Rehberi */
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Tarayıcınızın menüsünden CariRadar'ı ana ekrana ekleyebilirsiniz:
            </p>

            <div className="space-y-2 bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 text-xs text-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-400">1.</span>
                <span>Tarayıcının sağ üstündeki <b>üç nokta (⋮)</b> menüsüne dokunun.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-400">2.</span>
                <span><b>"Ana ekrana ekle"</b> veya <b>"Uygulamayı yükle"</b> seçeneğini seçin.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-400">3.</span>
                <span>Gelen onay kutusunda <b>"Yükle"</b>ye dokunun.</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl text-xs sm:text-sm font-semibold text-white transition-colors"
            >
              Tamam
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
