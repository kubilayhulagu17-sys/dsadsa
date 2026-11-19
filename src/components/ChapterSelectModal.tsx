import React, { useState } from 'react';
import { ACTS, CHAPTERS } from '../data/chapters';
import { Chapter } from '../types/game';
import { sounds } from '../utils/sound';
import { Star, Lock, Skull, Swords, ChevronRight, X, Trophy } from 'lucide-react';

interface Props {
  currentChapterId: number;
  highestCompletedChapter: number;
  chapterStars: Record<number, number>;
  playerPower: number;
  onSelectChapter: (chapter: Chapter) => void;
  onClose: () => void;
}

export const ChapterSelectModal: React.FC<Props> = ({
  currentChapterId,
  highestCompletedChapter,
  chapterStars,
  playerPower,
  onSelectChapter,
  onClose,
}) => {
  const [selectedActId, setSelectedActId] = useState<number>(() => {
    const current = CHAPTERS.find((c) => c.id === currentChapterId);
    return current ? current.actId : 1;
  });

  const activeAct = ACTS.find((a) => a.id === selectedActId) || ACTS[0];
  const actChapters = CHAPTERS.filter((c) => c.actId === selectedActId);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-6 select-none animate-fade-in">
      <div className="relative w-full max-w-5xl h-[90vh] bg-slate-950 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <Swords className="w-5 h-5 text-amber-400" />
            <h2 className="font-medieval text-lg sm:text-xl font-bold text-slate-100">
              Krallık Sefer Haritası
            </h2>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">30 Destansı Bölüm</span>
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

        {/* Acts Segmented Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800/80 bg-slate-950 overflow-x-auto scrollbar-none">
          {ACTS.map((act) => {
            const isActive = act.id === selectedActId;
            const isUnlocked = act.id === 1 || highestCompletedChapter >= (act.id - 1) * 5;
            return (
              <button
                key={act.id}
                onClick={() => {
                  sounds.playDialogueBlip();
                  setSelectedActId(act.id);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                    : isUnlocked
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    : 'text-slate-600 opacity-60'
                }`}
              >
                {!isUnlocked && <Lock className="w-3 h-3 text-slate-500" />}
                <span>{act.name}</span>
              </button>
            );
          })}
        </div>

        {/* Act Banner Info */}
        <div className="px-6 py-3 bg-gradient-to-r from-slate-900 via-slate-900/60 to-slate-950 border-b border-slate-800/60 flex items-center justify-between">
          <div>
            <h3 className="font-medieval text-sm font-semibold text-amber-400">
              {activeAct.name}
            </h3>
            <p className="text-xs text-slate-400">{activeAct.subtitle}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500">Mevcut Şövalye Gücü</span>
            <p className="text-sm font-mono font-bold text-amber-400">{playerPower} GP</p>
          </div>
        </div>

        {/* Chapters Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actChapters.map((chapter) => {
            const isUnlocked = chapter.id <= highestCompletedChapter + 1;
            const isCompleted = chapter.id <= highestCompletedChapter;
            const isCurrent = chapter.id === currentChapterId;
            const stars = chapterStars[chapter.id] || 0;
            const isUnderpowered = playerPower < chapter.recommendedPower;

            return (
              <div
                key={chapter.id}
                className={`relative rounded-xl p-4 transition-all flex flex-col justify-between border ${
                  isUnlocked
                    ? isCurrent
                      ? 'bg-slate-900 border-amber-500/70 shadow-lg shadow-amber-500/10'
                      : isCompleted
                      ? 'bg-slate-900/80 border-slate-700/80 hover:border-slate-600'
                      : 'bg-slate-900/50 border-amber-500/30 hover:border-amber-500/60'
                    : 'bg-slate-950/60 border-slate-800/60 opacity-60'
                }`}
              >
                {/* Chapter Header */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      BÖLÜM {chapter.id}
                    </span>
                    <div className="flex items-center gap-1">
                      {chapter.isBossStage && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-950/50 border border-rose-800/50 px-2 py-0.5 rounded">
                          <Skull className="w-3 h-3" />
                          <span>BOSS</span>
                        </span>
                      )}
                      {/* Star Rating */}
                      <div className="flex items-center gap-0.5 ml-1">
                        {[1, 2, 3].map((starIdx) => (
                          <Star
                            key={starIdx}
                            className={`w-3.5 h-3.5 ${
                              starIdx <= stars
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <h4 className="font-medieval text-sm font-bold text-slate-200 line-clamp-1 mb-1">
                    {chapter.title.split(': ')[1] || chapter.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 min-h-[2rem]">
                    {chapter.description}
                  </p>
                </div>

                {/* Chapter Meta & CTA */}
                <div className="mt-4 pt-3 border-t border-slate-800/70 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500">Önerilen Güç</span>
                    <span
                      className={`text-xs font-mono font-bold ${
                        isUnderpowered ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {chapter.recommendedPower} GP
                    </span>
                  </div>

                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-slate-500">Ödül</span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      +{chapter.rewardGold} Altın
                    </span>
                  </div>

                  {isUnlocked ? (
                    <button
                      onClick={() => {
                        sounds.playCoin();
                        onSelectChapter(chapter);
                      }}
                      className={`ml-2 px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      <span>Savaş</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-slate-600 px-3 py-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Kilitli</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Stats Summary */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Tamamlanan: {highestCompletedChapter} / 30</span>
            </span>
            <span>·</span>
            <span>
              Toplam Yıldız:{' '}
              {Object.values(chapterStars).reduce((a, b) => a + b, 0)} / 90
            </span>
          </div>
          <span className="text-slate-500 hidden sm:inline">
            Her bölüm 3 yıldızla tamamlanabilir (Can koruma ve hız hedefleri).
          </span>
        </div>
      </div>
    </div>
  );
};
