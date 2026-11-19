import React, { useState, useEffect, useMemo } from 'react';
import { Chapter, PlayerStats, Cinematic, ElementType } from './types/game';
import { CHAPTERS } from './data/chapters';
import { ARMOR_SKINS, SWORD_SKINS } from './data/cosmetics';
import { CINEMATICS, CINEMATIC_BG_TITLE, MENU_DUNGEON_BG } from './data/cinematics';
import { ELEMENTS } from './data/elements';
import { sounds } from './utils/sound';
import { GameCanvas3D } from './components/GameCanvas3D';
import { ChapterSelectModal } from './components/ChapterSelectModal';
import { ArmoryModal } from './components/ArmoryModal';
import { ForgeModal } from './components/ForgeModal';
import { ControlsHelpModal } from './components/ControlsHelpModal';
import { ElementSelectModal } from './components/ElementSelectModal';
import { CinematicModal } from './components/CinematicModal';
import { GameOverModal } from './components/GameOverModal';
import { CornerFiligree } from './components/CornerFiligree';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallButton';
import {
  Swords,
  Shield,
  Anvil,
  Map,
  Coins,
  Gem,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  ChevronRight,
  Flame,
  Droplets,
  Wind,
  Share2,
  Check
} from 'lucide-react';

const STORAGE_KEY = 'knights_legend_save_v1';

const INITIAL_PLAYER_STATS: PlayerStats = {
  gold: 150,
  currentChapter: 1,
  highestCompletedChapter: 0,
  chapterStars: {},
  equippedArmor: 'armor_starter',
  equippedSword: 'sword_starter',
  unlockedArmors: ['armor_starter'],
  unlockedSwords: ['sword_starter'],
  element: undefined,
  upgrades: {
    attack: 0,
    hp: 0,
    defense: 0,
    crit: 0,
    speed: 0,
    skill: 0,
  },
};

export default function App() {
  // Load saved game from localStorage
  const [playerStats, setPlayerStats] = useState<PlayerStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...INITIAL_PLAYER_STATS, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback
    }
    return INITIAL_PLAYER_STATS;
  });

  // Save to localStorage on stats change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(playerStats));
    } catch {
      // Ignore storage errors
    }
  }, [playerStats]);

  // Audio State
  const [soundOn, setSoundOn] = useState(sounds.enabled);

  // Active View & Modals
  const [inBattle, setInBattle] = useState(false);
  const [battleKey, setBattleKey] = useState(1);
  const [showChapterSelect, setShowChapterSelect] = useState(false);
  const [showArmory, setShowArmory] = useState(false);
  const [showForge, setShowForge] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showElementModal, setShowElementModal] = useState<boolean>(() => {
    return !playerStats.element;
  });
  const [activeCinematic, setActiveCinematic] = useState<Cinematic | null>(null);

  const currentElement = playerStats.element || 'fire';
  const elementInfo = ELEMENTS[currentElement];

  const handleSelectElement = (elem: ElementType) => {
    setPlayerStats((prev) => ({ ...prev, element: elem }));
    setShowElementModal(false);
  };

  // Share Game Link
  const [copiedLink, setCopiedLink] = useState(false);
  const handleShareGame = () => {
    sounds.playCoin();
    const shareUrl = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }).catch(() => {});
    }
  };

  // Battle End State Modal
  const [battleResult, setBattleResult] = useState<{
    victory: boolean;
    stars: number;
    gold: number;
    hpPercent: number;
  } | null>(null);

  // Selected Chapter for Battle
  const [selectedChapterId, setSelectedChapterId] = useState<number>(() => {
    return playerStats.currentChapter || 1;
  });

  const activeChapter = useMemo(() => {
    return CHAPTERS.find((c) => c.id === selectedChapterId) || CHAPTERS[0];
  }, [selectedChapterId]);

  // Calculate Knight Total Power (GP)
  const knightPower = useMemo(() => {
    const armor = ARMOR_SKINS.find((a) => a.id === playerStats.equippedArmor) || ARMOR_SKINS[0];
    const sword = SWORD_SKINS.find((s) => s.id === playerStats.equippedSword) || SWORD_SKINS[0];

    const upAtk = (playerStats.upgrades['attack'] || 0) * 20;
    const upHp = (playerStats.upgrades['hp'] || 0) * 15;
    const upDef = (playerStats.upgrades['defense'] || 0) * 25;
    const upCrit = (playerStats.upgrades['crit'] || 0) * 20;
    const upSpd = (playerStats.upgrades['speed'] || 0) * 15;
    const upSkill = (playerStats.upgrades['skill'] || 0) * 25;

    const basePower = 50;
    const cosmeticPower = armor.statBonus.hp + armor.statBonus.defense * 2 + sword.statBonus.attack * 2 + sword.statBonus.crit * 2;
    const upgradePower = upAtk + upHp + upDef + upCrit + upSpd + upSkill;

    return basePower + cosmeticPower + upgradePower;
  }, [playerStats]);

  // Start Chapter Battle Flow
  const launchChapter = (chap: Chapter) => {
    if (!playerStats.element) {
      setShowElementModal(true);
      return;
    }
    setSelectedChapterId(chap.id);
    setShowChapterSelect(false);
    setBattleResult(null);
    setBattleKey((k) => k + 1);

    // Check if chapter has a prologue / intro cinematic that hasn't played or if it's Boss stage
    if (chap.cinematicBefore && CINEMATICS[chap.cinematicBefore]) {
      setActiveCinematic(CINEMATICS[chap.cinematicBefore]);
    } else {
      setInBattle(true);
    }
  };

  // Stage Cleared Callback
  const handleStageClear = (stars: number, gold: number, hpPercent: number) => {
    sounds.playVictory();

    // Update Stats
    setPlayerStats((prev) => {
      const highest = Math.max(prev.highestCompletedChapter, selectedChapterId);
      const nextChapter = Math.min(30, selectedChapterId + 1);
      const existingStars = prev.chapterStars[selectedChapterId] || 0;
      const newStars = Math.max(existingStars, stars);

      return {
        ...prev,
        gold: prev.gold + gold,
        highestCompletedChapter: highest,
        currentChapter: nextChapter,
        chapterStars: {
          ...prev.chapterStars,
          [selectedChapterId]: newStars,
        },
      };
    });

    // Check if this chapter triggers an outro cinematic
    if (activeChapter.cinematicAfter && CINEMATICS[activeChapter.cinematicAfter]) {
      setActiveCinematic(CINEMATICS[activeChapter.cinematicAfter]);
    } else {
      setBattleResult({
        victory: true,
        stars,
        gold,
        hpPercent,
      });
    }
  };

  // Game Over Callback
  const handleGameOver = (hpPercent: number) => {
    sounds.playDefeat();
    setBattleResult({
      victory: false,
      stars: 0,
      gold: 0,
      hpPercent,
    });
  };

  // Next Chapter
  const handleNextChapter = () => {
    const nextId = Math.min(30, selectedChapterId + 1);
    const nextChap = CHAPTERS.find((c) => c.id === nextId) || CHAPTERS[0];
    launchChapter(nextChap);
  };

  // Retry Chapter
  const handleRetry = () => {
    sounds.playSlash();
    setBattleResult(null);
    setBattleKey((k) => k + 1);
    setInBattle(true);
  };

  // Cosmetic Equip/Buy Handlers
  const handleEquipArmor = (armorId: string) => {
    setPlayerStats((prev) => ({ ...prev, equippedArmor: armorId }));
  };

  const handleEquipSword = (swordId: string) => {
    setPlayerStats((prev) => ({ ...prev, equippedSword: swordId }));
  };

  const handleBuyArmor = (armor: (typeof ARMOR_SKINS)[0]) => {
    if (playerStats.gold >= armor.price && !playerStats.unlockedArmors.includes(armor.id)) {
      setPlayerStats((prev) => ({
        ...prev,
        gold: prev.gold - armor.price,
        unlockedArmors: [...prev.unlockedArmors, armor.id],
        equippedArmor: armor.id,
      }));
    }
  };

  const handleBuySword = (sword: (typeof SWORD_SKINS)[0]) => {
    if (playerStats.gold >= sword.price && !playerStats.unlockedSwords.includes(sword.id)) {
      setPlayerStats((prev) => ({
        ...prev,
        gold: prev.gold - sword.price,
        unlockedSwords: [...prev.unlockedSwords, sword.id],
        equippedSword: sword.id,
      }));
    }
  };

  // Forge Upgrade Handler
  const handleUpgradeStat = (statId: string, cost: number) => {
    if (playerStats.gold >= cost) {
      setPlayerStats((prev) => ({
        ...prev,
        gold: prev.gold - cost,
        upgrades: {
          ...prev.upgrades,
          [statId]: (prev.upgrades[statId] || 0) + 1,
        },
      }));
    }
  };

  // Reset Progress for fresh start
  const handleResetProgress = () => {
    if (window.confirm('Tüm ilerlemeni sıfırlamak istediğinden emin misin?')) {
      localStorage.removeItem(STORAGE_KEY);
      setPlayerStats(INITIAL_PLAYER_STATS);
      setSelectedChapterId(1);
      setInBattle(false);
      setBattleResult(null);
      sounds.playCoin();
    }
  };

  const totalStars = useMemo(() => {
    return Object.values(playerStats.chapterStars).reduce((acc, s) => acc + s, 0);
  }, [playerStats.chapterStars]);

  return (
    <div className="relative min-h-screen bg-[#090706] text-[#efe4cf] flex flex-col font-lore selection:bg-amber-600/35 overflow-x-hidden">
      {/* Dark Fantasy Dungeon Artwork Backdrop (Main Menu) */}
      {!inBattle && (
        <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden">
          <img
            src={MENU_DUNGEON_BG}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-60 scale-105"
          />
          {/* Deep Chiaroscuro Scrim & Warm Torch Vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#090706]/85 via-[#0e0a08]/55 to-[#070504]/95" />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 12% 28%, rgba(234, 136, 36, 0.16) 0%, transparent 42%), radial-gradient(circle at 88% 32%, rgba(217, 102, 24, 0.14) 0%, transparent 40%), radial-gradient(circle at 50% 50%, transparent 35%, rgba(6, 4, 3, 0.88) 100%)',
            }}
          />
          {/* Subtle Floating Torchlight Embers */}
          <div className="absolute inset-0 overflow-hidden">
            {[
              { left: '11%', top: '76%', dur: '6.5s', delay: '0s' },
              { left: '16%', top: '62%', dur: '8.2s', delay: '1.8s' },
              { left: '28%', top: '84%', dur: '7.4s', delay: '0.9s' },
              { left: '72%', top: '80%', dur: '7.8s', delay: '1.4s' },
              { left: '84%', top: '68%', dur: '6.9s', delay: '0.4s' },
              { left: '89%', top: '85%', dur: '8.8s', delay: '2.6s' },
            ].map((ember, idx) => (
              <span
                key={idx}
                className="rpg-ember absolute w-1.5 h-1.5 rounded-full bg-amber-400/80 blur-[0.5px]"
                style={
                  {
                    left: ember.left,
                    top: ember.top,
                    '--dur': ember.dur,
                    '--delay': ember.delay,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* 1. Forged Wrought-Iron Top Bar (3-Zone Contract) */}
      <header className="relative z-30 flex items-center justify-between gap-6 px-5 lg:px-8 py-3.5 border-b border-[#594329] bg-[#0e0b09]/95 backdrop-blur-md shadow-[0_6px_24px_rgba(0,0,0,0.85)] sticky top-0">
        {/* Zone 1: Brand Crest Wordmark */}
        <div
          onClick={() => {
            sounds.playDialogueBlip();
            setInBattle(false);
          }}
          className="cursor-pointer flex items-center gap-2.5 whitespace-nowrap shrink-0 group"
        >
          <div className="rpg-treasury-slot p-1.5 rounded-sm">
            <Swords className="w-4 h-4 text-[#eab354] group-hover:rotate-12 transition-transform duration-200" />
          </div>
          <span className="font-medieval text-base sm:text-lg font-extrabold tracking-wider text-[#f3cf7a] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            Şövalye Efsanesi
          </span>
        </div>

        {/* Zone 2: Clean Single-Line Nav Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#cbbaa0]">
          <button
            onClick={() => {
              sounds.playDialogueBlip();
              setShowChapterSelect(true);
            }}
            className="hover:text-[#f3cf7a] transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b border-transparent hover:border-[#b88948] py-0.5"
          >
            Sefer (30 Bölüm)
          </button>
          <button
            onClick={() => {
              sounds.playDialogueBlip();
              setShowElementModal(true);
            }}
            className="hover:text-[#f3cf7a] transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b border-transparent hover:border-[#b88948] py-0.5"
          >
            Element Özü
          </button>
          <button
            onClick={() => {
              sounds.playDialogueBlip();
              setShowArmory(true);
            }}
            className="hover:text-[#f3cf7a] transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b border-transparent hover:border-[#b88948] py-0.5"
          >
            Cephanelik &amp; Kozmetik
          </button>
          <button
            onClick={() => {
              sounds.playDialogueBlip();
              setShowForge(true);
            }}
            className="hover:text-[#f3cf7a] transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b border-transparent hover:border-[#b88948] py-0.5"
          >
            Demirci Ocağı
          </button>
          <button
            onClick={() => {
              sounds.playDialogueBlip();
              setShowHelp(true);
            }}
            className="hover:text-[#f3cf7a] transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b border-transparent hover:border-[#b88948] py-0.5"
          >
            Savaş Rehberi
          </button>
        </nav>

        {/* Zone 3: Recessed RPG Treasury Counters + Primary Action */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* RPG Gold & Gem Treasury Readout */}
          <div className="rpg-treasury-slot flex items-center gap-2.5 px-3 py-1.5 rounded-sm whitespace-nowrap">
            <span className="flex items-center gap-1.5 text-[#f3cf7a] font-rpg-mono text-xs font-bold">
              <Coins className="w-3.5 h-3.5 text-[#eab354]" />
              <span>{playerStats.gold.toLocaleString()}</span>
            </span>
            <span className="h-3.5 w-px bg-[#4a3723]" aria-hidden="true" />
            <span
              className="flex items-center gap-1 text-[#7dd3fc] font-rpg-mono text-xs font-bold"
              title="Toplanan Zafer Mücevheri (Yıldız)"
            >
              <Gem className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>{totalStars}</span>
            </span>
          </div>

          {/* Element Sigil Trigger */}
          <button
            onClick={() => {
              sounds.playDialogueBlip();
              setShowElementModal(true);
            }}
            className="rpg-btn-iron flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs font-semibold whitespace-nowrap cursor-pointer"
            style={{
              borderColor: `${elementInfo.themeColor}70`,
              color: elementInfo.themeColor,
            }}
            title="Element Seç / Değiştir"
          >
            {currentElement === 'fire' ? (
              <Flame className="w-3.5 h-3.5" />
            ) : currentElement === 'water' ? (
              <Droplets className="w-3.5 h-3.5" />
            ) : (
              <Wind className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{elementInfo.title}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              const next = !soundOn;
              sounds.enabled = next;
              setSoundOn(next);
            }}
            className="rpg-btn-iron p-2 rounded-sm cursor-pointer"
            title="Ses Aç/Kapat"
            aria-label="Ses Aç/Kapat"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-[#d8c3a2]" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>

          {/* Primary Action Button */}
          {!inBattle ? (
            <button
              onClick={() => launchChapter(activeChapter)}
              className="rpg-btn-gold px-4 py-2 text-xs font-medieval font-extrabold rounded-sm whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Savaşa Başla ({selectedChapterId})</span>
            </button>
          ) : (
            <button
              onClick={() => {
                sounds.playDialogueBlip();
                setInBattle(false);
              }}
              className="rpg-btn-iron px-4 py-2 text-xs font-medieval font-bold rounded-sm whitespace-nowrap shrink-0 cursor-pointer"
            >
              Menüye Dön
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
        {inBattle ? (
          /* Active 3D Combat WebGL View */
          <div className="w-full max-w-5xl flex flex-col items-center">
            <GameCanvas3D
              key={`battle-${selectedChapterId}-${battleKey}`}
              chapter={activeChapter}
              playerStats={playerStats}
              onStageClear={handleStageClear}
              onGameOver={handleGameOver}
              onQuitToMenu={() => setInBattle(false)}
              onRestart={handleRetry}
            />
          </div>
        ) : (
          /* Skeuomorphic Dark Fantasy Citadel Dashboard (Preserving Exact Layout) */
          <div className="w-full max-w-5xl flex flex-col items-center">
            {/* Hero Key Art Frame — Hammered Iron & Bronze Plaque */}
            <div className="rpg-iron-panel relative w-full rounded-md overflow-hidden mb-7 group">
              <CornerFiligree className="z-20" />
              <div className="relative w-full h-80 sm:h-96 md:h-[420px] overflow-hidden">
                <img
                  src={CINEMATIC_BG_TITLE}
                  alt="Şövalye Efsanesi"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700 brightness-90 contrast-105"
                />
                {/* Dramatic Chiaroscuro & Warm Dungeon Scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0807] via-[#0d0907]/55 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0b0807]/90 via-[#0e0a08]/45 to-transparent" />

                {/* Hero Title & Information Overlay */}
                <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8 max-w-2xl z-10">
                  {/* Unboxed Typographic Metadata */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#eab354] font-medieval tracking-wider mb-2">
                    <span>Eldoria Krallığı</span>
                    <span aria-hidden="true">·</span>
                    <span>30 Bölümlük 3D Sefer</span>
                    <span aria-hidden="true">·</span>
                    <span>Karanlık Fantezi RPG</span>
                  </div>

                  <h1 className="font-medieval text-3xl sm:text-4xl md:text-5xl font-black text-[#f8ebd2] tracking-wide drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)] leading-tight mb-3 text-balance">
                    Şövalye Efsanesi: Krallığın Kılıcı
                  </h1>

                  <p className="text-sm sm:text-base text-[#d5c5ab] leading-relaxed font-lore mb-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    Karanlık ordular krallığın 6 diyarını kuşattı. Kılıcını bile, zırhını kuşan, kadim meşalelerin aydınlattığı zindanlara in ve hiçliğe karşı Eldoria&apos;nın tek umudu ol.
                  </p>

                  {/* Primary & Secondary Forged Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                    <button
                      onClick={() => launchChapter(activeChapter)}
                      className="rpg-btn-gold px-6 py-3 rounded-sm text-sm font-medieval font-extrabold flex items-center gap-2 whitespace-nowrap cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>
                        {playerStats.highestCompletedChapter > 0
                          ? `Bölüm ${selectedChapterId}'ye Devam Et`
                          : 'Maceraya Başla'}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        sounds.playDialogueBlip();
                        setShowChapterSelect(true);
                      }}
                      className="rpg-btn-iron px-4 py-3 rounded-sm text-sm font-semibold flex items-center gap-2 whitespace-nowrap cursor-pointer"
                    >
                      <Map className="w-4 h-4 text-[#eab354]" />
                      <span>Bölüm Haritası</span>
                    </button>

                    <button
                      onClick={() => {
                        sounds.playDialogueBlip();
                        setShowElementModal(true);
                      }}
                      className="rpg-btn-iron px-4 py-3 rounded-sm text-sm font-semibold flex items-center gap-2 whitespace-nowrap cursor-pointer"
                      style={{
                        borderColor: `${elementInfo.themeColor}75`,
                        color: elementInfo.themeColor,
                      }}
                    >
                      {currentElement === 'fire' ? (
                        <Flame className="w-4 h-4" />
                      ) : currentElement === 'water' ? (
                        <Droplets className="w-4 h-4" />
                      ) : (
                        <Wind className="w-4 h-4" />
                      )}
                      <span>Element: {elementInfo.title}</span>
                    </button>

                    <button
                      onClick={handleShareGame}
                      className="rpg-btn-iron px-4 py-3 rounded-sm text-sm font-semibold flex items-center gap-2 whitespace-nowrap cursor-pointer"
                      style={
                        copiedLink
                          ? { borderColor: '#10b981', color: '#6ee7b7' }
                          : undefined
                      }
                    >
                      {copiedLink ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Share2 className="w-4 h-4 text-[#eab354]" />
                      )}
                      <span>{copiedLink ? 'Bağlantı Kopyalandı!' : 'Arkadaşınla Paylaş'}</span>
                    </button>

                    <PWAInstallButton />
                  </div>
                </div>
              </div>
            </div>

            {/* Hub Quick Access Cards: 4 Skeuomorphic Iron & Parchment Panels (Preserved Placement) */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Card 1: Sefer Haritası */}
              <div
                onClick={() => {
                  sounds.playDialogueBlip();
                  setShowChapterSelect(true);
                }}
                className="rpg-iron-panel rpg-iron-panel-interactive p-5 rounded-md cursor-pointer flex flex-col justify-between group"
              >
                <CornerFiligree />
                <div>
                  <div className="rpg-treasury-slot p-2.5 rounded-sm w-fit mb-3.5 text-[#eab354] group-hover:scale-105 transition-transform">
                    <Map className="w-5 h-5" />
                  </div>
                  <h3 className="font-medieval text-base font-bold text-[#f3cf7a] tracking-wide mb-1.5">
                    Sefer Haritası
                  </h3>
                  <p className="text-xs text-[#c7b79e] leading-relaxed font-lore">
                    6 farklı bölge, 30 aşama ve goblinlerden ejderhalara devasa boss savaşları.
                  </p>
                </div>
                <div className="mt-4">
                  <div className="rpg-divider mb-3" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#9e8c72]">İlerleme</span>
                    <span className="rpg-treasury-slot px-2 py-0.5 rounded-sm font-rpg-mono font-bold text-[#eab354]">
                      {playerStats.highestCompletedChapter} / 30 Bölüm
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Cephanelik & Kozmetik */}
              <div
                onClick={() => {
                  sounds.playDialogueBlip();
                  setShowArmory(true);
                }}
                className="rpg-iron-panel rpg-iron-panel-interactive p-5 rounded-md cursor-pointer flex flex-col justify-between group"
              >
                <CornerFiligree />
                <div>
                  <div className="rpg-treasury-slot p-2.5 rounded-sm w-fit mb-3.5 text-[#7dd3fc] group-hover:scale-105 transition-transform">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h3 className="font-medieval text-base font-bold text-[#f3cf7a] tracking-wide mb-1.5">
                    Cephanelik &amp; Kozmetik
                  </h3>
                  <p className="text-xs text-[#c7b79e] leading-relaxed font-lore">
                    Alevli pala, buz kılıcı, kutsal şafak ve görkemli şövalye zırhları kuşan.
                  </p>
                </div>
                <div className="mt-4">
                  <div className="rpg-divider mb-3" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#9e8c72]">Açılan Kozmetik</span>
                    <span className="rpg-treasury-slot px-2 py-0.5 rounded-sm font-rpg-mono font-bold text-[#7dd3fc]">
                      {playerStats.unlockedArmors.length + playerStats.unlockedSwords.length} /{' '}
                      {ARMOR_SKINS.length + SWORD_SKINS.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Demirci Ocağı */}
              <div
                onClick={() => {
                  sounds.playDialogueBlip();
                  setShowForge(true);
                }}
                className="rpg-iron-panel rpg-iron-panel-interactive p-5 rounded-md cursor-pointer flex flex-col justify-between group"
              >
                <CornerFiligree />
                <div>
                  <div className="rpg-treasury-slot p-2.5 rounded-sm w-fit mb-3.5 text-[#fb7185] group-hover:scale-105 transition-transform">
                    <Anvil className="w-5 h-5" />
                  </div>
                  <h3 className="font-medieval text-base font-bold text-[#f3cf7a] tracking-wide mb-1.5">
                    Demirci Ocağı
                  </h3>
                  <p className="text-xs text-[#c7b79e] leading-relaxed font-lore">
                    Saldırı gücü, can, kritik vuruş, zırh koruması ve kutsal yetenek yükseltmeleri.
                  </p>
                </div>
                <div className="mt-4">
                  <div className="rpg-divider mb-3" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#9e8c72]">Şövalye Gücü</span>
                    <span className="rpg-treasury-slot px-2 py-0.5 rounded-sm font-rpg-mono font-bold text-[#fb7185]">
                      {knightPower} GP
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 4: Hikaye Sinematikleri */}
              <div
                onClick={() => {
                  sounds.playDialogueBlip();
                  setActiveCinematic(CINEMATICS['prologue']);
                }}
                className="rpg-iron-panel rpg-iron-panel-interactive p-5 rounded-md cursor-pointer flex flex-col justify-between group"
              >
                <CornerFiligree />
                <div>
                  <div className="rpg-treasury-slot p-2.5 rounded-sm w-fit mb-3.5 text-[#d8b4fe] group-hover:scale-105 transition-transform">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="font-medieval text-base font-bold text-[#f3cf7a] tracking-wide mb-1.5">
                    Hikaye Sinematikleri
                  </h3>
                  <p className="text-xs text-[#c7b79e] leading-relaxed font-lore">
                    Bölüm aralarında kral, ejderha ve düşmanlarla geçen sinematik diyaloglar.
                  </p>
                </div>
                <div className="mt-4">
                  <div className="rpg-divider mb-3" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#9e8c72]">Giriş Sahnesi</span>
                    <span className="rpg-treasury-slot px-2.5 py-0.5 rounded-sm text-xs font-medieval font-bold text-[#d8b4fe] flex items-center gap-1">
                      <span>İzle</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Reset & Lore Footer */}
            <div className="w-full pt-4">
              <div className="rpg-divider mb-4" />
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#9c8a70]">
                <div className="flex items-center gap-2 font-lore">
                  <span>Eldoria Krallığı Savunması</span>
                  <span aria-hidden="true">·</span>
                  <span>Karanlık Zindan Kronikleri</span>
                </div>
                <button
                  onClick={handleResetProgress}
                  className="flex items-center gap-1.5 text-[#8c7a61] hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Kayıt Verisini Sıfırla</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}

      {/* 1. Cinematic Modal */}
      {activeCinematic && (
        <CinematicModal
          cinematic={activeCinematic}
          onComplete={() => {
            setActiveCinematic(null);
            // If completed an intro cinematic, start battle
            if (activeCinematic.id === 'prologue' || activeCinematic.id.includes('intro')) {
              setBattleKey((k) => k + 1);
              setInBattle(true);
            } else if (activeCinematic.id.includes('defeat') || activeCinematic.id === 'epilogue') {
              // After boss defeat cinematic, show completion
              setBattleResult({
                victory: true,
                stars: 3,
                gold: activeChapter.rewardGold,
                hpPercent: 80,
              });
            }
          }}
        />
      )}

      {/* 2. Chapter Select Modal */}
      {showChapterSelect && (
        <ChapterSelectModal
          currentChapterId={selectedChapterId}
          highestCompletedChapter={playerStats.highestCompletedChapter}
          chapterStars={playerStats.chapterStars}
          playerPower={knightPower}
          onSelectChapter={launchChapter}
          onClose={() => setShowChapterSelect(false)}
        />
      )}

      {/* 3. Armory Modal */}
      {showArmory && (
        <ArmoryModal
          gold={playerStats.gold}
          highestCompletedChapter={playerStats.highestCompletedChapter}
          equippedArmorId={playerStats.equippedArmor}
          equippedSwordId={playerStats.equippedSword}
          unlockedArmors={playerStats.unlockedArmors}
          unlockedSwords={playerStats.unlockedSwords}
          onEquipArmor={handleEquipArmor}
          onEquipSword={handleEquipSword}
          onBuyArmor={handleBuyArmor}
          onBuySword={handleBuySword}
          onClose={() => setShowArmory(false)}
        />
      )}

      {/* 4. Forge Modal */}
      {showForge && (
        <ForgeModal
          gold={playerStats.gold}
          upgrades={playerStats.upgrades}
          onUpgradeStat={handleUpgradeStat}
          onClose={() => setShowForge(false)}
        />
      )}

      {/* 5. Controls Help Modal */}
      {showHelp && <ControlsHelpModal onClose={() => setShowHelp(false)} />}

      {/* 6. Element Select Modal */}
      {showElementModal && (
        <ElementSelectModal
          selectedElement={playerStats.element}
          onSelectElement={handleSelectElement}
          onClose={() => setShowElementModal(false)}
          forceSelection={!playerStats.element}
        />
      )}

      {/* 7. Game Over / Victory Modal */}
      {battleResult && (
        <GameOverModal
          victory={battleResult.victory}
          chapter={activeChapter}
          starsEarned={battleResult.stars}
          goldEarned={battleResult.gold}
          remainingHpPercent={battleResult.hpPercent}
          onNextChapter={handleNextChapter}
          onRetry={handleRetry}
          onOpenForge={() => {
            setBattleResult(null);
            setInBattle(false);
            setShowForge(true);
          }}
          onOpenMap={() => {
            setBattleResult(null);
            setInBattle(false);
            setShowChapterSelect(true);
          }}
        />
      )}
      {/* 8. Offline PWA Status */}
      <OfflineIndicator />
    </div>
  );
}
