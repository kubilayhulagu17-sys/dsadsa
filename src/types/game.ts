export type GameView = 'TITLE' | 'BATTLE' | 'CHAPTER_SELECT' | 'ARMORY' | 'FORGE' | 'HELP';

export interface ActInfo {
  id: number;
  name: string;
  subtitle: string;
  themeColor: string;
  bgGradient: string;
  flooringColor: string;
  wallColor: string;
  ambientParticle: 'leaf' | 'ghost' | 'ember' | 'shadow' | 'frost' | 'void';
}

export interface EnemyTemplate {
  name: string;
  type: 'melee' | 'archer' | 'brute' | 'caster' | 'boss';
  maxHp: number;
  speed: number;
  damage: number;
  color: string;
  size: number;
  attackRange: number;
  attackCooldown: number;
  points: number;
  gold: number;
  specialSkill?: 'charge' | 'fireball' | 'whirlwind' | 'frostNova' | 'meteor' | 'voidBeam';
}

export interface Chapter {
  id: number;
  actId: number;
  title: string;
  description: string;
  waveCount: number;
  isBossStage: boolean;
  bossName?: string;
  recommendedPower: number;
  rewardGold: number;
  enemies: {
    template: EnemyTemplate;
    count: number;
    delay: number;
  }[];
  cinematicBefore?: string;
  cinematicAfter?: string;
}

export interface ArmorSkin {
  id: string;
  name: string;
  desc: string;
  primaryColor: string;
  trimColor: string;
  capeColor: string;
  glowColor: string;
  effect: 'none' | 'fire' | 'darkness' | 'holy' | 'ice' | 'void';
  price: number;
  unlockedAtChapter: number;
  statBonus: {
    hp: number;
    defense: number;
  };
}

export interface SwordSkin {
  id: string;
  name: string;
  desc: string;
  bladeColor: string;
  trailColor: string;
  glowColor: string;
  effect: 'steel' | 'flame' | 'frost' | 'lightning' | 'holy' | 'void';
  price: number;
  unlockedAtChapter: number;
  statBonus: {
    attack: number;
    crit: number;
  };
}

export interface UpgradeStat {
  id: 'attack' | 'hp' | 'defense' | 'crit' | 'speed' | 'skill';
  name: string;
  desc: string;
  icon: string;
  currentLevel: number;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  valuePerLevel: number;
  unit: string;
}

export type ElementType = 'fire' | 'water' | 'air';

export interface ElementInfo {
  id: ElementType;
  name: string;
  title: string;
  description: string;
  passiveName: string;
  passiveDesc: string;
  skillName: string;
  skillDesc: string;
  themeColor: string;
  glowColor: string;
  badgeBg: string;
  icon: string;
}

export interface PlayerStats {
  gold: number;
  currentChapter: number;
  highestCompletedChapter: number;
  chapterStars: Record<number, number>;
  equippedArmor: string;
  equippedSword: string;
  unlockedArmors: string[];
  unlockedSwords: string[];
  upgrades: Record<string, number>; // statId -> level
  element?: ElementType;
}

export interface CinematicSpeaker {
  id: string;
  name: string;
  role: string;
  avatarBg: string;
  accentColor: string;
}

export interface CinematicSlide {
  speaker: string;
  text: string;
  bgImage?: string;
  emotion?: 'neutral' | 'anger' | 'holy' | 'solemn' | 'menacing';
}

export interface Cinematic {
  id: string;
  title: string;
  actTitle: string;
  slides: CinematicSlide[];
}
