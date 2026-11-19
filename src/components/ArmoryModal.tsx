import React, { useState } from 'react';
import { ARMOR_SKINS, SWORD_SKINS, ARMORY_HERO_IMAGE } from '../data/cosmetics';
import { ArmorSkin, SwordSkin } from '../types/game';
import { sounds } from '../utils/sound';
import { Shield, Sparkles, Check, Lock, Coins, X, Flame } from 'lucide-react';

interface Props {
  gold: number;
  highestCompletedChapter: number;
  equippedArmorId: string;
  equippedSwordId: string;
  unlockedArmors: string[];
  unlockedSwords: string[];
  onEquipArmor: (armorId: string) => void;
  onEquipSword: (swordId: string) => void;
  onBuyArmor: (armor: ArmorSkin) => void;
  onBuySword: (sword: SwordSkin) => void;
  onClose: () => void;
}

export const ArmoryModal: React.FC<Props> = ({
  gold,
  highestCompletedChapter,
  equippedArmorId,
  equippedSwordId,
  unlockedArmors,
  unlockedSwords,
  onEquipArmor,
  onEquipSword,
  onBuyArmor,
  onBuySword,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'armor' | 'sword'>('armor');

  const currentArmor = ARMOR_SKINS.find((a) => a.id === equippedArmorId) || ARMOR_SKINS[0];
  const currentSword = SWORD_SKINS.find((s) => s.id === equippedSwordId) || SWORD_SKINS[0];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-6 select-none animate-fade-in">
      <div className="relative w-full max-w-5xl h-[90vh] bg-slate-950 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-400" />
            <h2 className="font-medieval text-lg sm:text-xl font-bold text-slate-100">
              Kraliyet Cephaneliği & Gardırop
            </h2>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">Kozmetikler & Donanım</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Gold Badge */}
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

        {/* Tab Controls */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800 bg-slate-950">
          <button
            onClick={() => {
              sounds.playDialogueBlip();
              setActiveTab('armor');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'armor'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Karakter Zırhları ({ARMOR_SKINS.length})</span>
          </button>

          <button
            onClick={() => {
              sounds.playDialogueBlip();
              setActiveTab('sword');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'sword'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Kılıç Kozmetikleri ({SWORD_SKINS.length})</span>
          </button>
        </div>

        {/* Content Layout: 2 Columns on Desktop */}
        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row">
          {/* Left Column: Visual Showcase & Current Loadout */}
          <div className="lg:w-80 p-6 border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-slate-900/30 flex flex-col justify-between">
            <div>
              <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-slate-700/80 mb-4 shadow-lg group">
                <img
                  src={ARMORY_HERO_IMAGE}
                  alt="Şövalye Portresi"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-3 text-center">
                  <span className="font-medieval text-sm font-bold text-amber-300">
                    {currentArmor.name}
                  </span>
                  <p className="text-[11px] text-slate-300">
                    ve {currentSword.name}
                  </p>
                </div>
              </div>

              {/* Loadout Bonus Box */}
              <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 block mb-2">
                  Kozmetik Bonus Toplamı
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ek Can (HP):</span>
                    <span className="font-mono font-bold text-emerald-400">
                      +{currentArmor.statBonus.hp} Can
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ek Savunma:</span>
                    <span className="font-mono font-bold text-sky-400">
                      +{currentArmor.statBonus.defense} Def
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ek Saldırı:</span>
                    <span className="font-mono font-bold text-rose-400">
                      +{currentSword.statBonus.attack} Atk
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ek Kritik:</span>
                    <span className="font-mono font-bold text-amber-400">
                      +{currentSword.statBonus.crit}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 mt-4 leading-relaxed">
              * Kozmetik eşyalar şövalyenin dövüş sırasındaki zırh rengini, pelerinini, kılıç aurasını ve vuruş izi parçacıklarını değiştirir.
            </div>
          </div>

          {/* Right Column: Items Grid */}
          <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTab === 'armor'
              ? ARMOR_SKINS.map((armor) => {
                  const isUnlocked = unlockedArmors.includes(armor.id);
                  const isEquipped = equippedArmorId === armor.id;
                  const canUnlockByProgress = highestCompletedChapter + 1 >= armor.unlockedAtChapter;
                  const canAfford = gold >= armor.price;

                  return (
                    <div
                      key={armor.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                        isEquipped
                          ? 'bg-slate-900 border-amber-500 shadow-md'
                          : isUnlocked
                          ? 'bg-slate-900/60 border-slate-700/80 hover:border-slate-600'
                          : 'bg-slate-950/60 border-slate-800/80'
                      }`}
                    >
                      <div>
                        {/* Header with Color Swatch */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded-full border border-white/20 shadow-inner"
                              style={{
                                backgroundColor: armor.primaryColor,
                                boxShadow: `0 0 10px ${armor.glowColor}`,
                              }}
                            />
                            <h4 className="font-medieval text-sm font-bold text-slate-200">
                              {armor.name}
                            </h4>
                          </div>
                          {isEquipped && (
                            <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Kuşanıldı</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                          {armor.desc}
                        </p>

                        {/* Stat Bonuses */}
                        <div className="flex items-center gap-3 text-xs mb-3">
                          <span className="font-mono text-emerald-400 font-semibold">
                            +{armor.statBonus.hp} Can
                          </span>
                          <span className="text-slate-600">·</span>
                          <span className="font-mono text-sky-400 font-semibold">
                            +{armor.statBonus.defense} Savunma
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                        {isUnlocked ? (
                          <button
                            onClick={() => {
                              sounds.playSlash();
                              onEquipArmor(armor.id);
                            }}
                            disabled={isEquipped}
                            className={`w-full py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              isEquipped
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            }`}
                          >
                            {isEquipped ? 'Aktif Kuşanıldı' : 'Kuşan'}
                          </button>
                        ) : !canUnlockByProgress ? (
                          <div className="w-full py-2 flex items-center justify-center gap-1 text-xs text-slate-500 bg-slate-900/50 rounded-lg">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Bölüm {armor.unlockedAtChapter}'de Açılır</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              sounds.playCoin();
                              onBuyArmor(armor);
                            }}
                            disabled={!canAfford}
                            className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              canAfford
                                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>Satın Al ({armor.price} Altın)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              : SWORD_SKINS.map((sword) => {
                  const isUnlocked = unlockedSwords.includes(sword.id);
                  const isEquipped = equippedSwordId === sword.id;
                  const canUnlockByProgress = highestCompletedChapter + 1 >= sword.unlockedAtChapter;
                  const canAfford = gold >= sword.price;

                  return (
                    <div
                      key={sword.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                        isEquipped
                          ? 'bg-slate-900 border-amber-500 shadow-md'
                          : isUnlocked
                          ? 'bg-slate-900/60 border-slate-700/80 hover:border-slate-600'
                          : 'bg-slate-950/60 border-slate-800/80'
                      }`}
                    >
                      <div>
                        {/* Header with Trail Color */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded-full border border-white/20 shadow-inner"
                              style={{
                                backgroundColor: sword.bladeColor,
                                boxShadow: `0 0 10px ${sword.glowColor}`,
                              }}
                            />
                            <h4 className="font-medieval text-sm font-bold text-slate-200">
                              {sword.name}
                            </h4>
                          </div>
                          {isEquipped && (
                            <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Kuşanıldı</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                          {sword.desc}
                        </p>

                        {/* Stat Bonuses */}
                        <div className="flex items-center gap-3 text-xs mb-3">
                          <span className="font-mono text-rose-400 font-semibold">
                            +{sword.statBonus.attack} Saldırı
                          </span>
                          <span className="text-slate-600">·</span>
                          <span className="font-mono text-amber-400 font-semibold">
                            +{sword.statBonus.crit}% Kritik
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                        {isUnlocked ? (
                          <button
                            onClick={() => {
                              sounds.playSlash();
                              onEquipSword(sword.id);
                            }}
                            disabled={isEquipped}
                            className={`w-full py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              isEquipped
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            }`}
                          >
                            {isEquipped ? 'Aktif Kuşanıldı' : 'Kuşan'}
                          </button>
                        ) : !canUnlockByProgress ? (
                          <div className="w-full py-2 flex items-center justify-center gap-1 text-xs text-slate-500 bg-slate-900/50 rounded-lg">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Bölüm {sword.unlockedAtChapter}'de Açılır</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              sounds.playCoin();
                              onBuySword(sword);
                            }}
                            disabled={!canAfford}
                            className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              canAfford
                                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>Satın Al ({sword.price} Altın)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      </div>
    </div>
  );
};
