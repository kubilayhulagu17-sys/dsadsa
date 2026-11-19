import React from 'react';
import { BASE_UPGRADES, calculateUpgradeCost } from '../data/upgrades';
import { UpgradeStat } from '../types/game';
import { sounds } from '../utils/sound';
import { Anvil, Coins, X, ChevronUp, Swords, Heart, Shield, Crosshair, Zap, Sparkles } from 'lucide-react';

interface Props {
  gold: number;
  upgrades: Record<string, number>;
  onUpgradeStat: (statId: string, cost: number) => void;
  onClose: () => void;
}

const STAT_ICONS: Record<string, React.ReactNode> = {
  attack: <Swords className="w-5 h-5 text-rose-400" />,
  hp: <Heart className="w-5 h-5 text-emerald-400" />,
  defense: <Shield className="w-5 h-5 text-sky-400" />,
  crit: <Crosshair className="w-5 h-5 text-amber-400" />,
  speed: <Zap className="w-5 h-5 text-yellow-400" />,
  skill: <Sparkles className="w-5 h-5 text-purple-400" />,
};

export const ForgeModal: React.FC<Props> = ({
  gold,
  upgrades,
  onUpgradeStat,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-6 select-none animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <Anvil className="w-5 h-5 text-amber-400" />
            <h2 className="font-medieval text-lg sm:text-xl font-bold text-slate-100">
              Kraliyet Demirci Ocağı
            </h2>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">Kalıcı Güçlendirmeler</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 font-mono text-sm font-bold">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{gold.toLocaleString()}</span>
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
        </div>

        {/* Info Banner */}
        <div className="px-6 py-3 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-950 border-b border-slate-800/80 text-xs text-slate-300">
          Dövüşlerden kazandığın altınlarla şövalyeni kalıcı olarak güçlendir. Her yükseltme bir sonraki bölümlerde hayatta kalma şansını artırır.
        </div>

        {/* Upgrades List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {BASE_UPGRADES.map((stat: UpgradeStat) => {
            const currentLevel = upgrades[stat.id] || 0;
            const isMax = currentLevel >= stat.maxLevel;
            const cost = calculateUpgradeCost(stat, currentLevel);
            const canAfford = gold >= cost && !isMax;
            const currentValue = currentLevel * stat.valuePerLevel;
            const nextValue = (currentLevel + 1) * stat.valuePerLevel;

            return (
              <div
                key={stat.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900/90 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Left: Icon & Description */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 shrink-0">
                    {STAT_ICONS[stat.id] || <Sparkles className="w-5 h-5 text-amber-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <h4 className="font-medieval text-sm font-bold text-slate-200">
                        {stat.name}
                      </h4>
                      <span className="text-xs font-mono text-slate-400">
                        Sv. {currentLevel} / {stat.maxLevel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-2">
                      {stat.desc}
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full max-w-md h-2 bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-300"
                        style={{ width: `${(currentLevel / stat.maxLevel) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Stat Numbers & Upgrade Button */}
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  {/* Current -> Next Value */}
                  <div className="text-right">
                    <div className="text-xs font-mono text-slate-400">
                      Mevcut: <span className="font-bold text-slate-200">+{currentValue} {stat.unit}</span>
                    </div>
                    {!isMax && (
                      <div className="text-xs font-mono text-amber-400">
                        Sonraki: <span className="font-bold">+{nextValue} {stat.unit}</span>
                      </div>
                    )}
                  </div>

                  {/* Upgrade CTA */}
                  {isMax ? (
                    <div className="px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                      Maksimum
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        sounds.playHit();
                        onUpgradeStat(stat.id, cost);
                      }}
                      disabled={!canAfford}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/10'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <ChevronUp className="w-4 h-4" />
                      <span>{cost} Altın</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
