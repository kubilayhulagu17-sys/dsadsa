import React from 'react';
import { sounds } from '../utils/sound';
import { HelpCircle, X, Shield, Swords, Zap, Sparkles, Heart, Compass } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const ControlsHelpModal: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-6 select-none animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-950 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h2 className="font-medieval text-lg sm:text-xl font-bold text-slate-100">
              Savaş Sanatı ve Kontroller
            </h2>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">Rehber</span>
          </div>
          <button
            onClick={() => {
              sounds.playDialogueBlip();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Controls Grid */}
          <div>
            <h3 className="font-medieval text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
              <Compass className="w-4 h-4" />
              <span>Klavye ve Fare Kontrolleri</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded bg-slate-800 text-amber-400">
                    <Compass className="w-4 h-4" />
                  </span>
                  <span className="text-xs text-slate-300 font-medium">Hareket</span>
                </div>
                <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-amber-300">
                  W, A, S, D / Yön Tuşları
                </kbd>
              </div>

              <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded bg-slate-800 text-rose-400">
                    <Swords className="w-4 h-4" />
                  </span>
                  <span className="text-xs text-slate-300 font-medium">Kılıç Saldırısı</span>
                </div>
                <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-amber-300">
                  Sol Tık / Boşluk / J
                </kbd>
              </div>

              <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded bg-slate-800 text-sky-400">
                    <Shield className="w-4 h-4" />
                  </span>
                  <span className="text-xs text-slate-300 font-medium">Kalkan Blok / Parry</span>
                </div>
                <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-amber-300">
                  Sağ Tık / K
                </kbd>
              </div>

              <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded bg-slate-800 text-yellow-400">
                    <Zap className="w-4 h-4" />
                  </span>
                  <span className="text-xs text-slate-300 font-medium">Hızlı Takla / Atılma</span>
                </div>
                <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-amber-300">
                  Shift / L
                </kbd>
              </div>

              <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded bg-slate-800 text-cyan-400">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <span className="text-xs text-slate-300 font-medium">Kutsal Girdap</span>
                </div>
                <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-amber-300">
                  Q / U Tuşu
                </kbd>
              </div>

              <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded bg-slate-800 text-amber-400">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <span className="text-xs text-slate-300 font-medium">Kutsal Işık Patlaması</span>
                </div>
                <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-amber-300">
                  E / I Tuşu
                </kbd>
              </div>

              <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded bg-slate-800 text-rose-400">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <span className="text-xs text-slate-300 font-medium">Element Özel Gücü</span>
                </div>
                <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-amber-300">
                  F Tuşu
                </kbd>
              </div>

              <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded bg-slate-800 text-emerald-400">
                    <Heart className="w-4 h-4" />
                  </span>
                  <span className="text-xs text-slate-300 font-medium">Can İksiri Tüket</span>
                </div>
                <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-amber-300">
                  R / H Tuşu
                </kbd>
              </div>
            </div>
          </div>

          {/* Combat Mastery Tips */}
          <div>
            <h3 className="font-medieval text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Şövalye Taktik İpuçları</span>
            </h3>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800/80">
                <strong className="text-amber-300">Mükemmel Savuşturma (Parry):</strong> Düşman saldırısının veya okunun isabet edeceği son anda kalkana basarsan darbeyi sektirir ve düşmanı sersemletirsin!
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800/80">
                <strong className="text-amber-300">Kaçınma Dokunulmazlığı:</strong> Hızlı takla attığın anda kısa süreliğine hasar almazsın. Bossların kırmızı alan patlamalarından kaçmak için kullan.
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800/80">
                <strong className="text-amber-300">3'lü Kılıç Kombosu:</strong> Kılıç tuşuna art arda basarak kombo yapabilirsin. 3. vuruş geniş açılı ağır bir darbe indirir ve düşmanları savurur.
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800/80">
                <strong className="text-amber-300">Dokunmatik / Mobil Desteği:</strong> Ekranın altındaki sanal butonlara dokunarak oyunu mobil veya tablet cihazlarda da akıcı şekilde oynayabilirsin.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
