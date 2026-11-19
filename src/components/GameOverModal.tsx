import React from 'react';
import { Chapter } from '../types/game';
import { sounds } from '../utils/sound';
import { Trophy, Skull, Star, Coins, RotateCcw, ChevronRight, Anvil, Map } from 'lucide-react';

interface Props {
  victory: boolean;
  chapter: Chapter;
  starsEarned: number;
  goldEarned: number;
  remainingHpPercent: number;
  onNextChapter: () => void;
  onRetry: () => void;
  onOpenForge: () => void;
  onOpenMap: () => void;
}

export const GameOverModal: React.FC<Props> = ({
  victory,
  chapter,
  starsEarned,
  goldEarned,
  remainingHpPercent,
  onNextChapter,
  onRetry,
  onOpenForge,
  onOpenMap,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none animate-fade-in">
      <div
        className={`relative w-full max-w-lg rounded-2xl border p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl ${
          victory
            ? 'bg-slate-950 border-amber-500/50 shadow-amber-500/10'
            : 'bg-slate-950 border-rose-900/50 shadow-rose-900/10'
        }`}
      >
        {/* Status Emblem */}
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border ${
            victory
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {victory ? (
            <Trophy className="w-8 h-8 animate-bounce" />
          ) : (
            <Skull className="w-8 h-8" />
          )}
        </div>

        {/* Title */}
        <h2 className="font-medieval text-2xl font-black text-slate-100 tracking-wide mb-1">
          {victory ? 'ZAFER KAZANILDI!' : 'ŞÖVALYE YENİLDİ'}
        </h2>
        <p className="text-xs text-slate-400 mb-6">{chapter.title}</p>

        {/* Stars Breakdown (Victory only) */}
        {victory && (
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center gap-2 mb-2">
              {[1, 2, 3].map((starIdx) => (
                <Star
                  key={starIdx}
                  className={`w-7 h-7 transition-all ${
                    starIdx <= starsEarned
                      ? 'text-amber-400 fill-amber-400 scale-110 drop-shadow'
                      : 'text-slate-700'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-slate-400">
              {starsEarned === 3
                ? 'Kusursuz Mücadele! (3 Yıldız)'
                : starsEarned === 2
                ? 'Mükemmel Dövüş! (2 Yıldız)'
                : 'Bölüm Tamamlandı (1 Yıldız)'}
            </span>
          </div>
        )}

        {/* Stats Card */}
        <div className="w-full bg-slate-900/80 rounded-xl p-4 border border-slate-800 space-y-2 mb-6">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Kazanılan Altın:</span>
            <span className="font-mono font-bold text-amber-400 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" />
              <span>+{goldEarned} Altın</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Kalan Can:</span>
            <span className="font-mono font-bold text-emerald-400">
              %{Math.round(remainingHpPercent)} HP
            </span>
          </div>

          {!victory && (
            <div className="pt-2 border-t border-slate-800 text-[11px] text-rose-300/80 text-left">
              * İpucu: Demirci Ocağı’nda zırhını ve kılıcını yükselterek veya saldırıları kalkana alarak tekrar dene!
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-2.5">
          {victory ? (
            <>
              {chapter.id < 30 ? (
                <button
                  onClick={() => {
                    sounds.playCoin();
                    onNextChapter();
                  }}
                  className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <span>Sonraki Bölüm</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onOpenMap}
                  className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Krallık Kurtarıldı! (Harita)</span>
                </button>
              )}

              <button
                onClick={onOpenForge}
                className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Anvil className="w-4 h-4 text-amber-400" />
                <span>Demirci</span>
              </button>

              <button
                onClick={onOpenMap}
                className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Map className="w-4 h-4" />
                <span>Harita</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  sounds.playSlash();
                  onRetry();
                }}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Tekrar Dene</span>
              </button>

              <button
                onClick={onOpenForge}
                className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Anvil className="w-4 h-4 text-amber-400" />
                <span>Güçlen (Demirci)</span>
              </button>

              <button
                onClick={onOpenMap}
                className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Map className="w-4 h-4" />
                <span>Harita</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
