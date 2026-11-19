import { UpgradeStat } from '../types/game';

export const BASE_UPGRADES: UpgradeStat[] = [
  {
    id: 'attack',
    name: 'Kılıç Bileme (Saldırı)',
    desc: 'Kılıcının keskinliğini artırarak temel vuruş hasarını yükseltir.',
    icon: 'Sword',
    currentLevel: 0,
    maxLevel: 10,
    baseCost: 100,
    costMultiplier: 1.45,
    valuePerLevel: 12, // +12 base attack per level
    unit: 'Hasar',
  },
  {
    id: 'hp',
    name: 'Dayanıklılık (Maks Can)',
    desc: 'Şövalyenin can havuzunu genişleterek daha fazla darbeye dayanmasını sağlar.',
    icon: 'Heart',
    currentLevel: 0,
    maxLevel: 10,
    baseCost: 80,
    costMultiplier: 1.4,
    valuePerLevel: 25, // +25 max HP per level
    unit: 'Can',
  },
  {
    id: 'defense',
    name: 'Ağır Zırh Kaplama (Savunma)',
    desc: 'Gelen fiziksel ve büyü hasarını yüzde olarak azaltır.',
    icon: 'Shield',
    currentLevel: 0,
    maxLevel: 10,
    baseCost: 120,
    costMultiplier: 1.5,
    valuePerLevel: 3, // +3% damage reduction
    unit: '% Koruma',
  },
  {
    id: 'crit',
    name: 'Ölümcül Hassasiyet (Kritik)',
    desc: 'Düşmanın zayıf noktalarını vurarak 2 kat hasar verme ihtimalini artırır.',
    icon: 'Crosshair',
    currentLevel: 0,
    maxLevel: 10,
    baseCost: 150,
    costMultiplier: 1.55,
    valuePerLevel: 4, // +4% crit chance
    unit: '% Kritik',
  },
  {
    id: 'speed',
    name: 'Şövalye Çevikliği (Hız)',
    desc: 'Hareket ve kombo saldırı hızını artırır, takla bekleme süresini düşürür.',
    icon: 'Zap',
    currentLevel: 0,
    maxLevel: 10,
    baseCost: 110,
    costMultiplier: 1.45,
    valuePerLevel: 5, // +5% speed
    unit: '% Hız',
  },
  {
    id: 'skill',
    name: 'Kutsal İnanç (Yetenek Gücü)',
    desc: 'Kutsal Girdap ve Kutsal Işık Patlaması yeteneklerinin hasarını ve alanını güçlendirir.',
    icon: 'Sparkles',
    currentLevel: 0,
    maxLevel: 10,
    baseCost: 160,
    costMultiplier: 1.55,
    valuePerLevel: 15, // +15% skill damage
    unit: '% Yetenek',
  },
];

export function calculateUpgradeCost(stat: UpgradeStat, currentLevel: number): number {
  if (currentLevel >= stat.maxLevel) return 0;
  return Math.round(stat.baseCost * Math.pow(stat.costMultiplier, currentLevel));
}
