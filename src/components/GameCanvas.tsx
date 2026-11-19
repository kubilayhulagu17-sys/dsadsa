import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Chapter, EnemyTemplate } from '../types/game';
import { ARMOR_SKINS, SWORD_SKINS } from '../data/cosmetics';
import { ACTS } from '../data/chapters';
import { sounds } from '../utils/sound';
import {
  Shield,
  Heart,
  Swords,
  Zap,
  Sparkles,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Maximize2
} from 'lucide-react';

interface Props {
  chapter: Chapter;
  playerStats: {
    equippedArmor: string;
    equippedSword: string;
    upgrades: Record<string, number>;
  };
  onStageClear: (stars: number, gold: number, remainingHpPercent: number) => void;
  onGameOver: (remainingHpPercent: number) => void;
  onQuitToMenu: () => void;
}

interface EnemyInstance {
  id: number;
  name: string;
  type: 'melee' | 'archer' | 'brute' | 'caster' | 'boss';
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  size: number;
  color: string;
  attackRange: number;
  attackCooldown: number;
  lastAttackTime: number;
  specialSkill?: string;
  specialCooldown: number;
  lastSpecialTime: number;
  chargeTarget?: { x: number; y: number };
  chargeSpeed?: number;
  stunTimer: number;
  gold: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  damage: number;
  fromPlayer: boolean;
  pierce: number;
}

interface TelegraphZone {
  x: number;
  y: number;
  radius: number;
  timer: number;
  maxTimer: number;
  damage: number;
  type: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface FloatingText {
  text: string;
  x: number;
  y: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
}

interface DropItem {
  id: number;
  x: number;
  y: number;
  type: 'gold' | 'potion' | 'boost';
  value: number;
}

export const GameCanvas: React.FC<Props> = ({
  chapter,
  playerStats,
  onStageClear,
  onGameOver,
  onQuitToMenu,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(sounds.enabled);

  // Equipped Cosmetics
  const armorSkin = ARMOR_SKINS.find((a) => a.id === playerStats.equippedArmor) || ARMOR_SKINS[0];
  const swordSkin = SWORD_SKINS.find((s) => s.id === playerStats.equippedSword) || SWORD_SKINS[0];
  const actInfo = ACTS.find((a) => a.id === chapter.actId) || ACTS[0];

  // Upgrades
  const upAtk = (playerStats.upgrades['attack'] || 0) * 12;
  const upHp = (playerStats.upgrades['hp'] || 0) * 25;
  const upDef = (playerStats.upgrades['defense'] || 0) * 0.03; // % reduction
  const upCrit = (playerStats.upgrades['crit'] || 0) * 0.04;
  const upSpd = (playerStats.upgrades['speed'] || 0) * 0.05;
  const upSkill = (playerStats.upgrades['skill'] || 0) * 0.15;

  // Base Knight Combat Stats
  const baseHp = 100 + armorSkin.statBonus.hp + upHp;
  const baseAttack = 20 + swordSkin.statBonus.attack + upAtk;
  const baseDefPercent = Math.min(0.65, (armorSkin.statBonus.defense * 0.01) + upDef);
  const baseCritPercent = Math.min(0.75, 0.05 + (swordSkin.statBonus.crit * 0.01) + upCrit);
  const baseSpeed = 3.6 * (1 + upSpd);

  // Reactive UI state for HUD
  const [hudHp, setHudHp] = useState(baseHp);
  const [hudMaxHp, setHudMaxHp] = useState(baseHp);
  const [hudPotions, setHudPotions] = useState(3);
  const [hudGold, setHudGold] = useState(0);
  const [hudWave, setHudWave] = useState(1);
  const [bossHpData, setBossHpData] = useState<{ name: string; hp: number; maxHp: number } | null>(null);

  // Skill Cooldowns (ms remaining)
  const [cdWhirlwind, setCdWhirlwind] = useState(0);
  const [cdSmite, setCdSmite] = useState(0);
  const [cdDash, setCdDash] = useState(0);

  // Internal Game Engine State Ref
  const engineRef = useRef({
    player: {
      x: 450,
      y: 350,
      vx: 0,
      vy: 0,
      radius: 18,
      angle: 0,
      hp: baseHp,
      maxHp: baseHp,
      potions: 3,
      goldEarned: 0,
      // Attack combo
      comboIndex: 0,
      lastAttackTime: 0,
      isAttacking: false,
      attackSwingTimer: 0,
      // Blocking & Parry
      isBlocking: false,
      blockStartTime: 0,
      // Dash
      isDashing: false,
      dashTimer: 0,
      dashVx: 0,
      dashVy: 0,
      lastDashTime: 0,
      // Skills
      lastWhirlwindTime: 0,
      lastSmiteTime: 0,
      lastPotionTime: 0,
      // Temporary Boost
      boostTimer: 0,
      // Invulnerability
      invulnerableTimer: 0,
    },
    enemies: [] as EnemyInstance[],
    projectiles: [] as Projectile[],
    telegraphs: [] as TelegraphZone[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    drops: [] as DropItem[],
    keys: {} as Record<string, boolean>,
    mousePos: { x: 450, y: 350 },
    currentWave: 1,
    totalWaves: chapter.waveCount,
    waveStartTime: Date.now(),
    nextEnemyId: 1,
    screenShake: 0,
    gameEnded: false,
    width: 900,
    height: 600,
  });

  // Handle Resize & Canvas Sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      const container = canvas.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        const w = Math.min(1080, Math.floor(rect.width));
        const h = Math.min(650, Math.floor(w * 0.62));
        canvas.width = w;
        canvas.height = h;
        engineRef.current.width = w;
        engineRef.current.height = h;
        // Keep player in bounds
        engineRef.current.player.x = Math.min(engineRef.current.player.x, w - 40);
        engineRef.current.player.y = Math.min(engineRef.current.player.y, h - 40);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Spawn Enemies for Current Wave
  const spawnWave = useCallback((waveNum: number) => {
    const engine = engineRef.current;
    const w = engine.width;
    const h = engine.height;

    // Filter enemy templates for this chapter
    chapter.enemies.forEach((group) => {
      const count = Math.ceil(group.count * (1 + (waveNum - 1) * 0.3));
      for (let i = 0; i < count; i++) {
        // Spawn around edges
        const edge = Math.floor(Math.random() * 4);
        let ex = 0;
        let ey = 0;
        if (edge === 0) { ex = Math.random() * w; ey = 30; }
        else if (edge === 1) { ex = w - 30; ey = Math.random() * h; }
        else if (edge === 2) { ex = Math.random() * w; ey = h - 30; }
        else { ex = 30; ey = Math.random() * h; }

        const enemy: EnemyInstance = {
          id: engine.nextEnemyId++,
          name: group.template.name,
          type: group.template.type,
          x: ex,
          y: ey,
          hp: group.template.maxHp,
          maxHp: group.template.maxHp,
          speed: group.template.speed,
          damage: group.template.damage,
          size: group.template.size,
          color: group.template.color,
          attackRange: group.template.attackRange,
          attackCooldown: group.template.attackCooldown,
          lastAttackTime: Date.now() + Math.random() * 1000,
          specialSkill: group.template.specialSkill,
          specialCooldown: 4000,
          lastSpecialTime: Date.now() + 2000,
          stunTimer: 0,
          gold: group.template.gold,
        };
        engine.enemies.push(enemy);
      }
    });

    if (chapter.isBossStage && waveNum === chapter.waveCount) {
      sounds.playBossRoar();
      engine.screenShake = 15;
    }
  }, [chapter]);

  // Initial wave spawn
  useEffect(() => {
    engineRef.current.currentWave = 1;
    engineRef.current.enemies = [];
    engineRef.current.projectiles = [];
    engineRef.current.telegraphs = [];
    engineRef.current.particles = [];
    engineRef.current.drops = [];
    engineRef.current.gameEnded = false;
    engineRef.current.player.hp = baseHp;
    engineRef.current.player.maxHp = baseHp;
    engineRef.current.player.potions = 3;
    engineRef.current.player.goldEarned = 0;

    spawnWave(1);
    setHudWave(1);
    setHudHp(baseHp);
    setHudMaxHp(baseHp);
    setHudPotions(3);
    setHudGold(0);
  }, [chapter, baseHp, spawnWave]);

  // Action: Normal Attack Slash Combo
  const performAttack = useCallback(() => {
    const engine = engineRef.current;
    const p = engine.player;
    if (p.isBlocking || p.isDashing || engine.gameEnded) return;

    const now = Date.now();
    if (now - p.lastAttackTime < 240) return; // cooldown between hits

    // Update combo
    if (now - p.lastAttackTime > 900) {
      p.comboIndex = 0;
    } else {
      p.comboIndex = (p.comboIndex + 1) % 3;
    }
    p.lastAttackTime = now;
    p.isAttacking = true;
    p.attackSwingTimer = 180; // duration of swing arc

    sounds.playSlash();

    // Calculate attack hitbox in front of player
    const isHeavy = p.comboIndex === 2;
    const reach = isHeavy ? 68 : 52;
    const arc = isHeavy ? Math.PI * 0.85 : Math.PI * 0.55;
    const isCrit = Math.random() < baseCritPercent;
    const boostMultiplier = p.boostTimer > 0 ? 1.5 : 1.0;
    const heavyMultiplier = isHeavy ? 1.7 : 1.0;
    const finalDamage = Math.round(baseAttack * heavyMultiplier * boostMultiplier * (isCrit ? 2.0 : 1.0));

    let hitAny = false;

    engine.enemies.forEach((enemy) => {
      const dx = enemy.x - p.x;
      const dy = enemy.y - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= reach + enemy.size) {
        const enemyAngle = Math.atan2(dy, dx);
        let diff = Math.abs(enemyAngle - p.angle);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;

        if (diff <= arc / 2) {
          // Hit!
          enemy.hp -= finalDamage;
          hitAny = true;

          // Knockback
          const knockForce = isHeavy ? 12 : 6;
          enemy.x += Math.cos(p.angle) * knockForce;
          enemy.y += Math.sin(p.angle) * knockForce;

          // Floating damage number
          engine.floatingTexts.push({
            text: isCrit ? `${finalDamage}!` : `${finalDamage}`,
            x: enemy.x + (Math.random() - 0.5) * 16,
            y: enemy.y - 15,
            vy: -1.6,
            alpha: 1,
            color: isCrit ? '#facc15' : '#ffffff',
            size: isCrit ? 18 : 14,
          });

          // Blood / Hit particles
          for (let k = 0; k < 6; k++) {
            const pAngle = p.angle + (Math.random() - 0.5);
            const pSpeed = Math.random() * 4 + 2;
            engine.particles.push({
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(pAngle) * pSpeed,
              vy: Math.sin(pAngle) * pSpeed,
              radius: Math.random() * 3 + 1,
              color: swordSkin.bladeColor,
              alpha: 1,
              life: 0,
              maxLife: 18,
            });
          }
        }
      }
    });

    if (hitAny) {
      if (isCrit) {
        sounds.playCrit();
        engine.screenShake = 6;
      } else {
        sounds.playHit();
      }
    }
  }, [baseAttack, baseCritPercent, swordSkin.bladeColor]);

  // Action: Shield Block / Parry
  const startBlock = useCallback(() => {
    const p = engineRef.current.player;
    if (p.isDashing || engineRef.current.gameEnded) return;
    p.isBlocking = true;
    p.blockStartTime = Date.now();
  }, []);

  const endBlock = useCallback(() => {
    engineRef.current.player.isBlocking = false;
  }, []);

  // Action: Dash / Dodge
  const performDash = useCallback(() => {
    const engine = engineRef.current;
    const p = engine.player;
    const now = Date.now();
    if (p.isDashing || now - p.lastDashTime < 1100 || engine.gameEnded) return;

    p.isDashing = true;
    p.dashTimer = 180;
    p.lastDashTime = now;
    p.invulnerableTimer = 220; // i-frames!

    let moveX = 0;
    let moveY = 0;
    if (engine.keys['KeyW'] || engine.keys['ArrowUp']) moveY -= 1;
    if (engine.keys['KeyS'] || engine.keys['ArrowDown']) moveY += 1;
    if (engine.keys['KeyA'] || engine.keys['ArrowLeft']) moveX -= 1;
    if (engine.keys['KeyD'] || engine.keys['ArrowRight']) moveX += 1;

    let dirAngle = p.angle;
    if (moveX !== 0 || moveY !== 0) {
      dirAngle = Math.atan2(moveY, moveX);
    }

    const dashSpeed = 11;
    p.dashVx = Math.cos(dirAngle) * dashSpeed;
    p.dashVy = Math.sin(dirAngle) * dashSpeed;

    sounds.playDash();

    // Dash trail particles
    for (let i = 0; i < 8; i++) {
      engine.particles.push({
        x: p.x + (Math.random() - 0.5) * 10,
        y: p.y + (Math.random() - 0.5) * 10,
        vx: -p.dashVx * 0.2 + (Math.random() - 0.5),
        vy: -p.dashVy * 0.2 + (Math.random() - 0.5),
        radius: 4,
        color: armorSkin.glowColor !== 'transparent' ? armorSkin.glowColor : '#38bdf8',
        alpha: 0.8,
        life: 0,
        maxLife: 20,
      });
    }
  }, [armorSkin.glowColor]);

  // Action: Skill 1 - Kutsal Girdap (Whirlwind)
  const performWhirlwind = useCallback(() => {
    const engine = engineRef.current;
    const p = engine.player;
    const now = Date.now();
    if (now - p.lastWhirlwindTime < 4500 || engine.gameEnded) return;

    p.lastWhirlwindTime = now;
    sounds.playWhirlwind();
    engine.screenShake = 8;

    const radius = 100;
    const dmg = Math.round(baseAttack * 2.2 * (1 + upSkill));

    engine.enemies.forEach((enemy) => {
      const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
      if (dist <= radius + enemy.size) {
        enemy.hp -= dmg;
        // Radial knockback
        const ang = Math.atan2(enemy.y - p.y, enemy.x - p.x);
        enemy.x += Math.cos(ang) * 14;
        enemy.y += Math.sin(ang) * 14;

        engine.floatingTexts.push({
          text: `${dmg} GİRDAP`,
          x: enemy.x,
          y: enemy.y - 18,
          vy: -1.8,
          alpha: 1,
          color: '#38bdf8',
          size: 16,
        });
      }
    });

    // Whirlwind circle particles
    for (let i = 0; i < 32; i++) {
      const ang = (i / 32) * Math.PI * 2;
      const spd = 4;
      engine.particles.push({
        x: p.x + Math.cos(ang) * 20,
        y: p.y + Math.sin(ang) * 20,
        vx: Math.cos(ang + Math.PI / 2) * spd,
        vy: Math.sin(ang + Math.PI / 2) * spd,
        radius: 3.5,
        color: '#60a5fa',
        alpha: 1,
        life: 0,
        maxLife: 25,
      });
    }
  }, [baseAttack, upSkill]);

  // Action: Skill 2 - Kutsal Işık Patlaması (Holy Smite)
  const performSmite = useCallback(() => {
    const engine = engineRef.current;
    const p = engine.player;
    const now = Date.now();
    if (now - p.lastSmiteTime < 8000 || engine.gameEnded) return;

    p.lastSmiteTime = now;
    sounds.playHolySmite();
    engine.screenShake = 14;

    const smiteX = p.x + Math.cos(p.angle) * 70;
    const smiteY = p.y + Math.sin(p.angle) * 70;
    const radius = 120;
    const dmg = Math.round(baseAttack * 3.5 * (1 + upSkill));

    engine.enemies.forEach((enemy) => {
      const dist = Math.hypot(enemy.x - smiteX, enemy.y - smiteY);
      if (dist <= radius + enemy.size) {
        enemy.hp -= dmg;
        enemy.stunTimer = 1200; // Stun!

        engine.floatingTexts.push({
          text: `${dmg} KUTSAL!`,
          x: enemy.x,
          y: enemy.y - 20,
          vy: -2.0,
          alpha: 1,
          color: '#facc15',
          size: 20,
        });
      }
    });

    // Golden divine rays particles
    for (let i = 0; i < 48; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = Math.random() * 6 + 2;
      engine.particles.push({
        x: smiteX,
        y: smiteY,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        radius: Math.random() * 4 + 2,
        color: '#fef08a',
        alpha: 1,
        life: 0,
        maxLife: 35,
      });
    }
  }, [baseAttack, upSkill]);

  // Action: Healing Potion
  const drinkPotion = useCallback(() => {
    const engine = engineRef.current;
    const p = engine.player;
    const now = Date.now();
    if (p.potions <= 0 || p.hp >= p.maxHp || now - p.lastPotionTime < 2000 || engine.gameEnded) return;

    p.potions -= 1;
    p.lastPotionTime = now;
    const healAmount = Math.round(p.maxHp * 0.45);
    p.hp = Math.min(p.maxHp, p.hp + healAmount);
    setHudHp(p.hp);
    setHudPotions(p.potions);

    sounds.playPotion();

    engine.floatingTexts.push({
      text: `+${healAmount} CAN`,
      x: p.x,
      y: p.y - 25,
      vy: -1.5,
      alpha: 1,
      color: '#4ade80',
      size: 16,
    });

    for (let i = 0; i < 16; i++) {
      engine.particles.push({
        x: p.x + (Math.random() - 0.5) * 20,
        y: p.y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 3 - 1,
        radius: 3,
        color: '#22c55e',
        alpha: 1,
        life: 0,
        maxLife: 30,
      });
    }
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      engineRef.current.keys[e.code] = true;

      if (e.code === 'Space' || e.code === 'KeyJ') {
        performAttack();
      } else if (e.code === 'KeyK') {
        startBlock();
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyL') {
        performDash();
      } else if (e.code === 'KeyQ' || e.code === 'KeyU') {
        performWhirlwind();
      } else if (e.code === 'KeyE' || e.code === 'KeyI') {
        performSmite();
      } else if (e.code === 'KeyR' || e.code === 'KeyH') {
        drinkPotion();
      } else if (e.code === 'KeyP') {
        setIsPaused((prev) => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      engineRef.current.keys[e.code] = false;
      if (e.code === 'KeyK') {
        endBlock();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [performAttack, startBlock, endBlock, performDash, performWhirlwind, performSmite, drinkPotion]);

  // Mouse Aim & Click Handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    engineRef.current.mousePos = { x: mx, y: my };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      // Left Click: Attack
      performAttack();
    } else if (e.button === 2) {
      // Right Click: Block
      e.preventDefault();
      startBlock();
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 2) {
      endBlock();
    }
  };

  // Main Canvas Render & Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(40, time - lastTime);
      lastTime = time;

      if (!isPaused && canvasRef.current) {
        updateGame(dt);
        renderGame();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, baseSpeed, baseDefPercent, onGameOver, onStageClear, chapter, spawnWave]);

  // Update Game Physics & AI
  const updateGame = (dt: number) => {
    const engine = engineRef.current;
    if (engine.gameEnded) return;

    const p = engine.player;
    const w = engine.width;
    const h = engine.height;
    const now = Date.now();

    // Cooldown state trackers for HUD
    const wwRemaining = Math.max(0, 4500 - (now - p.lastWhirlwindTime));
    const smiteRemaining = Math.max(0, 8000 - (now - p.lastSmiteTime));
    const dashRemaining = Math.max(0, 1100 - (now - p.lastDashTime));
    setCdWhirlwind(wwRemaining);
    setCdSmite(smiteRemaining);
    setCdDash(dashRemaining);

    // Screen Shake decay
    if (engine.screenShake > 0) {
      engine.screenShake *= 0.9;
      if (engine.screenShake < 0.2) engine.screenShake = 0;
    }

    // Temporary Boost timer decay
    if (p.boostTimer > 0) p.boostTimer -= dt;
    if (p.invulnerableTimer > 0) p.invulnerableTimer -= dt;
    if (p.attackSwingTimer > 0) p.attackSwingTimer -= dt;

    // Player Direction Angle towards mouse
    const dx = engine.mousePos.x - p.x;
    const dy = engine.mousePos.y - p.y;
    p.angle = Math.atan2(dy, dx);

    // Player Movement (Dashing vs Normal)
    if (p.isDashing) {
      p.x += p.dashVx;
      p.y += p.dashVy;
      p.dashTimer -= dt;
      if (p.dashTimer <= 0) {
        p.isDashing = false;
      }
    } else {
      let mx = 0;
      let my = 0;
      if (engine.keys['KeyW'] || engine.keys['ArrowUp']) my -= 1;
      if (engine.keys['KeyS'] || engine.keys['ArrowDown']) my += 1;
      if (engine.keys['KeyA'] || engine.keys['ArrowLeft']) mx -= 1;
      if (engine.keys['KeyD'] || engine.keys['ArrowRight']) mx += 1;

      if (mx !== 0 && my !== 0) {
        mx *= 0.7071;
        my *= 0.7071;
      }

      const speedFactor = p.isBlocking ? 0.45 : 1.0;
      p.vx = mx * baseSpeed * speedFactor;
      p.vy = my * baseSpeed * speedFactor;

      p.x += p.vx;
      p.y += p.vy;
    }

    // Clamp inside arena walls
    p.x = Math.max(p.radius + 10, Math.min(w - p.radius - 10, p.x));
    p.y = Math.max(p.radius + 10, Math.min(h - p.radius - 10, p.y));

    // Update Projectiles
    for (let i = engine.projectiles.length - 1; i >= 0; i--) {
      const proj = engine.projectiles[i];
      proj.x += proj.vx;
      proj.y += proj.vy;

      // Check collision with player
      if (proj.fromPlayer) {
        // Player projectile hitting enemy
        for (const enemy of engine.enemies) {
          const dist = Math.hypot(enemy.x - proj.x, enemy.y - proj.y);
          if (dist <= enemy.size + proj.radius) {
            enemy.hp -= proj.damage;
            proj.pierce -= 1;
            engine.floatingTexts.push({
              text: `${proj.damage}`,
              x: enemy.x,
              y: enemy.y - 10,
              vy: -1.2,
              alpha: 1,
              color: '#38bdf8',
              size: 14,
            });
            break;
          }
        }
      } else {
        // Hostile projectile hitting player
        const dist = Math.hypot(p.x - proj.x, p.y - proj.y);
        if (dist <= p.radius + proj.radius) {
          if (p.isBlocking) {
            // Check Parry
            const parryEligible = now - p.blockStartTime < 250;
            if (parryEligible) {
              sounds.playParry();
              engine.floatingTexts.push({
                text: 'PARRY!',
                x: p.x,
                y: p.y - 20,
                vy: -1.5,
                alpha: 1,
                color: '#38bdf8',
                size: 16,
              });
              // Deflect back!
              proj.fromPlayer = true;
              proj.vx = -proj.vx * 1.5;
              proj.vy = -proj.vy * 1.5;
              proj.color = '#38bdf8';
              continue;
            } else {
              sounds.playBlock();
              engine.floatingTexts.push({
                text: 'BLOK',
                x: p.x,
                y: p.y - 15,
                vy: -1.0,
                alpha: 1,
                color: '#94a3b8',
                size: 12,
              });
              proj.pierce = 0;
            }
          } else if (p.invulnerableTimer <= 0) {
            const actualDamage = Math.round(proj.damage * (1 - baseDefPercent));
            p.hp -= actualDamage;
            setHudHp(p.hp);
            engine.screenShake = 6;
            sounds.playHit();
            engine.floatingTexts.push({
              text: `-${actualDamage}`,
              x: p.x,
              y: p.y - 20,
              vy: -1.5,
              alpha: 1,
              color: '#f43f5e',
              size: 16,
            });
            proj.pierce = 0;
          }
        }
      }

      // Check bounds or expired
      if (
        proj.pierce <= 0 ||
        proj.x < 0 ||
        proj.x > w ||
        proj.y < 0 ||
        proj.y > h
      ) {
        engine.projectiles.splice(i, 1);
      }
    }

    // Update Telegraph Zones (e.g. boss meteor / ground explosions)
    for (let i = engine.telegraphs.length - 1; i >= 0; i--) {
      const tg = engine.telegraphs[i];
      tg.timer -= dt;
      if (tg.timer <= 0) {
        // Explode!
        const dist = Math.hypot(p.x - tg.x, p.y - tg.y);
        if (dist <= tg.radius + p.radius && p.invulnerableTimer <= 0) {
          if (p.isBlocking) {
            sounds.playBlock();
            const dmg = Math.round(tg.damage * 0.3 * (1 - baseDefPercent));
            p.hp -= dmg;
            setHudHp(p.hp);
          } else {
            sounds.playHit();
            engine.screenShake = 10;
            const dmg = Math.round(tg.damage * (1 - baseDefPercent));
            p.hp -= dmg;
            setHudHp(p.hp);
            engine.floatingTexts.push({
              text: `-${dmg}`,
              x: p.x,
              y: p.y - 25,
              vy: -1.8,
              alpha: 1,
              color: '#f43f5e',
              size: 18,
            });
          }
        }

        // Explosion particles
        for (let k = 0; k < 20; k++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = Math.random() * 5 + 1;
          engine.particles.push({
            x: tg.x,
            y: tg.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            radius: Math.random() * 4 + 2,
            color: tg.type === 'ice' ? '#38bdf8' : tg.type === 'void' ? '#c084fc' : '#f97316',
            alpha: 1,
            life: 0,
            maxLife: 25,
          });
        }

        engine.telegraphs.splice(i, 1);
      }
    }

    // Update Enemies
    let bossInstance: EnemyInstance | null = null;

    for (let i = engine.enemies.length - 1; i >= 0; i--) {
      const enemy = engine.enemies[i];

      if (enemy.type === 'boss') {
        bossInstance = enemy;
      }

      // Stun check
      if (enemy.stunTimer > 0) {
        enemy.stunTimer -= dt;
        continue;
      }

      const edx = p.x - enemy.x;
      const edy = p.y - enemy.y;
      const dist = Math.hypot(edx, edy);
      const angleToPlayer = Math.atan2(edy, edx);

      // AI Movement & Attack
      if (enemy.type === 'archer' || enemy.type === 'caster') {
        // Keep distance
        if (dist < enemy.attackRange - 40) {
          enemy.x -= Math.cos(angleToPlayer) * enemy.speed;
          enemy.y -= Math.sin(angleToPlayer) * enemy.speed;
        } else if (dist > enemy.attackRange + 40) {
          enemy.x += Math.cos(angleToPlayer) * enemy.speed;
          enemy.y += Math.sin(angleToPlayer) * enemy.speed;
        }

        // Shoot Projectile or Telegraph
        if (now - enemy.lastAttackTime > enemy.attackCooldown) {
          enemy.lastAttackTime = now;
          if (enemy.type === 'archer') {
            engine.projectiles.push({
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(angleToPlayer) * 5.2,
              vy: Math.sin(angleToPlayer) * 5.2,
              radius: 4,
              color: '#facc15',
              damage: enemy.damage,
              fromPlayer: false,
              pierce: 1,
            });
          } else {
            // Caster casts a ground circle under player!
            engine.telegraphs.push({
              x: p.x,
              y: p.y,
              radius: 55,
              timer: 1100,
              maxTimer: 1100,
              damage: enemy.damage * 1.5,
              type: enemy.specialSkill === 'frostNova' ? 'ice' : enemy.specialSkill === 'voidBeam' ? 'void' : 'fire',
            });
          }
        }
      } else if (enemy.type === 'brute') {
        // Brute melee with charge attack
        if (now - enemy.lastSpecialTime > enemy.specialCooldown && dist < 220) {
          enemy.lastSpecialTime = now;
          enemy.chargeTarget = { x: p.x, y: p.y };
          enemy.chargeSpeed = 7.5;
        }

        if (enemy.chargeTarget) {
          const cdx = enemy.chargeTarget.x - enemy.x;
          const cdy = enemy.chargeTarget.y - enemy.y;
          const cdist = Math.hypot(cdx, cdy);
          if (cdist < 15) {
            enemy.chargeTarget = undefined;
          } else {
            const cang = Math.atan2(cdy, cdx);
            enemy.x += Math.cos(cang) * (enemy.chargeSpeed || 7);
            enemy.y += Math.sin(cang) * (enemy.chargeSpeed || 7);
          }
        } else {
          // Standard walk
          enemy.x += Math.cos(angleToPlayer) * enemy.speed;
          enemy.y += Math.sin(angleToPlayer) * enemy.speed;
        }

        // Melee hit check
        if (dist <= enemy.size + p.radius + 8 && now - enemy.lastAttackTime > enemy.attackCooldown) {
          enemy.lastAttackTime = now;
          applyEnemyDamageToPlayer(enemy.damage);
        }
      } else if (enemy.type === 'boss') {
        // Boss AI: Approaches player + Special attacks (telegraphs & minions)
        enemy.x += Math.cos(angleToPlayer) * enemy.speed;
        enemy.y += Math.sin(angleToPlayer) * enemy.speed;

        if (dist <= enemy.size + p.radius + 15 && now - enemy.lastAttackTime > enemy.attackCooldown) {
          enemy.lastAttackTime = now;
          applyEnemyDamageToPlayer(enemy.damage);
        }

        // Boss periodic skill
        if (now - enemy.lastSpecialTime > 4000) {
          enemy.lastSpecialTime = now;
          // Spawn 3 ground hazards around player
          for (let k = 0; k < 3; k++) {
            const offsetAng = Math.random() * Math.PI * 2;
            const offsetDist = Math.random() * 90;
            engine.telegraphs.push({
              x: p.x + Math.cos(offsetAng) * offsetDist,
              y: p.y + Math.sin(offsetAng) * offsetDist,
              radius: 65,
              timer: 1200,
              maxTimer: 1200,
              damage: enemy.damage * 1.4,
              type: enemy.specialSkill || 'fire',
            });
          }
        }
      } else {
        // Standard melee enemy
        enemy.x += Math.cos(angleToPlayer) * enemy.speed;
        enemy.y += Math.sin(angleToPlayer) * enemy.speed;

        if (dist <= enemy.size + p.radius + 6 && now - enemy.lastAttackTime > enemy.attackCooldown) {
          enemy.lastAttackTime = now;
          applyEnemyDamageToPlayer(enemy.damage);
        }
      }

      // Check Enemy Death
      if (enemy.hp <= 0) {
        sounds.playCoin();
        p.goldEarned += enemy.gold;
        setHudGold(p.goldEarned);

        // Spawn Gold Drops
        engine.drops.push({
          id: Math.random(),
          x: enemy.x,
          y: enemy.y,
          type: 'gold',
          value: enemy.gold,
        });

        // Chance of Potion or Boost drop
        if (Math.random() < 0.22) {
          engine.drops.push({
            id: Math.random(),
            x: enemy.x + 12,
            y: enemy.y + 12,
            type: Math.random() < 0.6 ? 'potion' : 'boost',
            value: 1,
          });
        }

        // Death particles
        for (let k = 0; k < 12; k++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = Math.random() * 4 + 1;
          engine.particles.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            radius: Math.random() * 3 + 1,
            color: enemy.color,
            alpha: 1,
            life: 0,
            maxLife: 20,
          });
        }

        engine.enemies.splice(i, 1);
      }
    }

    // Update Boss UI State
    if (bossInstance) {
      setBossHpData({
        name: bossInstance.name,
        hp: bossInstance.hp,
        maxHp: bossInstance.maxHp,
      });
    } else {
      setBossHpData(null);
    }

    // Check Drops Collection (Magnetized when close)
    for (let i = engine.drops.length - 1; i >= 0; i--) {
      const drop = engine.drops[i];
      const dist = Math.hypot(p.x - drop.x, p.y - drop.y);

      if (dist < 110) {
        // Magnetize towards player
        const ang = Math.atan2(p.y - drop.y, p.x - drop.x);
        drop.x += Math.cos(ang) * 6;
        drop.y += Math.sin(ang) * 6;
      }

      if (dist <= p.radius + 14) {
        if (drop.type === 'potion') {
          p.potions = Math.min(5, p.potions + 1);
          setHudPotions(p.potions);
          sounds.playPotion();
          engine.floatingTexts.push({
            text: '+1 İKSİR',
            x: p.x,
            y: p.y - 20,
            vy: -1.4,
            alpha: 1,
            color: '#22c55e',
            size: 15,
          });
        } else if (drop.type === 'boost') {
          p.boostTimer = 8000;
          sounds.playCrit();
          engine.floatingTexts.push({
            text: 'GÜÇ ARTIŞI! (+%50)',
            x: p.x,
            y: p.y - 20,
            vy: -1.4,
            alpha: 1,
            color: '#f59e0b',
            size: 15,
          });
        }
        engine.drops.splice(i, 1);
      }
    }

    // Update Floating Damage Texts
    for (let i = engine.floatingTexts.length - 1; i >= 0; i--) {
      const ft = engine.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.025;
      if (ft.alpha <= 0) {
        engine.floatingTexts.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = engine.particles.length - 1; i >= 0; i--) {
      const pt = engine.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life += 1;
      pt.alpha = 1 - pt.life / pt.maxLife;
      if (pt.life >= pt.maxLife) {
        engine.particles.splice(i, 1);
      }
    }

    // Check Player Death
    if (p.hp <= 0) {
      engine.gameEnded = true;
      sounds.playDefeat();
      onGameOver(0);
      return;
    }

    // Check Wave Completion
    if (engine.enemies.length === 0) {
      if (engine.currentWave < engine.totalWaves) {
        engine.currentWave += 1;
        setHudWave(engine.currentWave);
        spawnWave(engine.currentWave);
      } else {
        // Stage Cleared!
        engine.gameEnded = true;
        sounds.playVictory();

        // Calculate Stars
        const hpPercent = (p.hp / p.maxHp) * 100;
        let stars = 1;
        if (hpPercent >= 75) stars = 3;
        else if (hpPercent >= 40) stars = 2;

        const totalEarnedGold = chapter.rewardGold + p.goldEarned;
        onStageClear(stars, totalEarnedGold, hpPercent);
      }
    }
  };

  // Helper to handle enemy melee damage to player
  const applyEnemyDamageToPlayer = (rawDamage: number) => {
    const engine = engineRef.current;
    const p = engine.player;
    if (p.invulnerableTimer > 0) return;

    if (p.isBlocking) {
      const now = Date.now();
      const isParry = now - p.blockStartTime < 220;
      if (isParry) {
        sounds.playParry();
        engine.screenShake = 4;
        engine.floatingTexts.push({
          text: 'MÜKEMMEL SAVUŞTURMA!',
          x: p.x,
          y: p.y - 25,
          vy: -1.6,
          alpha: 1,
          color: '#38bdf8',
          size: 16,
        });
        return;
      } else {
        sounds.playBlock();
        const mitigated = Math.round(rawDamage * 0.25 * (1 - baseDefPercent));
        p.hp -= mitigated;
        setHudHp(p.hp);
        engine.floatingTexts.push({
          text: 'BLOKLANDI',
          x: p.x,
          y: p.y - 15,
          vy: -1.0,
          alpha: 1,
          color: '#94a3b8',
          size: 13,
        });
        return;
      }
    }

    const actualDmg = Math.round(rawDamage * (1 - baseDefPercent));
    p.hp -= actualDmg;
    setHudHp(p.hp);
    sounds.playHit();
    engine.screenShake = 8;

    engine.floatingTexts.push({
      text: `-${actualDmg}`,
      x: p.x,
      y: p.y - 20,
      vy: -1.5,
      alpha: 1,
      color: '#ef4444',
      size: 18,
    });
  };

  // Canvas Render Frame
  const renderGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const engine = engineRef.current;
    const p = engine.player;
    const w = engine.width;
    const h = engine.height;

    ctx.save();

    // Screen Shake Offset
    if (engine.screenShake > 0) {
      const sx = (Math.random() - 0.5) * engine.screenShake * 2;
      const sy = (Math.random() - 0.5) * engine.screenShake * 2;
      ctx.translate(sx, sy);
    }

    // 1. Draw Arena Flooring
    ctx.fillStyle = actInfo.flooringColor;
    ctx.fillRect(0, 0, w, h);

    // Subtle stone tile grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const tileSize = 60;
    for (let x = 0; x < w; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Perimeter Stone Walls
    ctx.strokeStyle = actInfo.wallColor;
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, w - 8, h - 8);

    // 2. Draw Telegraph Danger Zones
    engine.telegraphs.forEach((tg) => {
      ctx.save();
      const progress = 1 - tg.timer / tg.maxTimer;
      ctx.fillStyle = tg.type === 'ice' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(239, 68, 68, 0.25)';
      ctx.strokeStyle = tg.type === 'ice' ? '#38bdf8' : '#ef4444';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(tg.x, tg.y, tg.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Expanding warning ring
      ctx.beginPath();
      ctx.arc(tg.x, tg.y, tg.radius * progress, 0, Math.PI * 2);
      ctx.fillStyle = tg.type === 'ice' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(239, 68, 68, 0.4)';
      ctx.fill();
      ctx.restore();
    });

    // 3. Draw Drops (Gold coins, Potions, Power orbs)
    engine.drops.forEach((drop) => {
      ctx.save();
      if (drop.type === 'gold') {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(drop.x, drop.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (drop.type === 'potion') {
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(drop.x, drop.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(drop.x - 1, drop.y - 4, 2, 8);
        ctx.fillRect(drop.x - 4, drop.y - 1, 8, 2);
      } else {
        // Boost Orb
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(drop.x, drop.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
    });

    // 4. Draw Projectiles
    engine.projectiles.forEach((proj) => {
      ctx.save();
      ctx.fillStyle = proj.color;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 5. Draw Enemies
    engine.enemies.forEach((enemy) => {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);

      // Draw Stun Indicator
      if (enemy.stunTimer > 0) {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -enemy.size - 6, 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Enemy Body Circle
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Enemy Details / Type distinction
      if (enemy.type === 'boss') {
        // Boss crown / horns
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(-enemy.size * 0.7, -enemy.size);
        ctx.lineTo(-enemy.size * 0.35, -enemy.size * 1.5);
        ctx.lineTo(0, -enemy.size * 1.1);
        ctx.lineTo(enemy.size * 0.35, -enemy.size * 1.5);
        ctx.lineTo(enemy.size * 0.7, -enemy.size);
        ctx.fill();
      } else if (enemy.type === 'brute') {
        // Spikes
        ctx.fillStyle = '#475569';
        ctx.fillRect(-enemy.size, -enemy.size * 0.5, 4, 8);
        ctx.fillRect(enemy.size - 4, -enemy.size * 0.5, 4, 8);
      }

      // Mini Health Bar above enemy
      const barW = enemy.size * 2;
      const barH = 4;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(-barW / 2, -enemy.size - 10, barW, barH);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-barW / 2, -enemy.size - 10, barW * (enemy.hp / enemy.maxHp), barH);

      ctx.restore();
    });

    // 6. Draw Player Knight
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);

    // Cape Physics
    ctx.fillStyle = armorSkin.capeColor;
    ctx.beginPath();
    ctx.moveTo(-p.radius, -8);
    ctx.lineTo(-p.radius - 16, -12);
    ctx.lineTo(-p.radius - 18, 0);
    ctx.lineTo(-p.radius - 16, 12);
    ctx.lineTo(-p.radius, 8);
    ctx.closePath();
    ctx.fill();

    // Shield (when blocking)
    if (p.isBlocking) {
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.beginPath();
      ctx.arc(p.radius + 6, 0, 24, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    }

    // Knight Body (Armor)
    ctx.fillStyle = armorSkin.primaryColor;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = armorSkin.trimColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Visor / Helmet Slit
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(2, -4, 8, 8);
    if (armorSkin.glowColor !== 'transparent') {
      ctx.fillStyle = armorSkin.glowColor;
      ctx.fillRect(4, -2, 5, 4);
    }

    // Sword Weapon
    ctx.save();
    ctx.translate(p.radius * 0.7, p.radius * 0.6);

    if (p.isAttacking) {
      // Swung weapon rotation
      ctx.rotate(-Math.PI / 6);
    }

    // Sword Blade
    ctx.fillStyle = swordSkin.bladeColor;
    ctx.fillRect(0, -2, 28, 4);
    // Sword Tip
    ctx.beginPath();
    ctx.moveTo(28, -2);
    ctx.lineTo(34, 0);
    ctx.lineTo(28, 2);
    ctx.fill();
    // Crossguard
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-2, -6, 4, 12);

    ctx.restore(); // sword

    // Attack Slash Arc Trail Effect
    if (p.attackSwingTimer > 0) {
      ctx.save();
      const slashProgress = 1 - p.attackSwingTimer / 180;
      ctx.strokeStyle = swordSkin.trailColor;
      ctx.lineWidth = p.comboIndex === 2 ? 6 : 4;
      ctx.beginPath();
      ctx.arc(
        0,
        0,
        p.comboIndex === 2 ? 55 : 44,
        -Math.PI / 3 + slashProgress * 0.2,
        Math.PI / 3 + slashProgress * 0.2
      );
      ctx.stroke();
      ctx.restore();
    }

    // Temporary Boost Aura
    if (p.boostTimer > 0) {
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore(); // player

    // 7. Draw Particles
    engine.particles.forEach((pt) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.alpha);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 8. Draw Floating Numbers
    engine.floatingTexts.forEach((ft) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${ft.size}px 'Plus Jakarta Sans', sans-serif`;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    ctx.restore(); // Screen shake restore
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none bg-slate-950 p-2 sm:p-4">
      {/* Top Combat HUD Strip */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-2 px-2 text-xs">
        {/* Left: Player HP & Potions */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="font-medieval text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>Şövalye Kaelen</span>
              </span>
              <span className="font-mono text-[11px] font-bold text-slate-400">
                {Math.max(0, Math.round(hudHp))} / {hudMaxHp}
              </span>
            </div>
            {/* Health Bar */}
            <div className="w-36 sm:w-48 h-3 bg-slate-900 border border-slate-700 rounded-full overflow-hidden flex">
              <div
                className="bg-gradient-to-r from-rose-600 to-rose-400 h-full transition-all duration-150"
                style={{ width: `${Math.max(0, (hudHp / hudMaxHp) * 100)}%` }}
              />
            </div>
          </div>

          {/* Potions Indicator */}
          <button
            onClick={drinkPotion}
            disabled={hudPotions <= 0 || hudHp >= hudMaxHp}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              hudPotions > 0 && hudHp < hudMaxHp
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400 hover:bg-emerald-900/60'
                : 'bg-slate-900 border-slate-800 text-slate-600'
            }`}
            title="Can İksiri (R veya dokun)"
          >
            <Heart className="w-3 h-3 text-emerald-400" />
            <span>x{hudPotions} (R)</span>
          </button>
        </div>

        {/* Center: Wave / Chapter info */}
        <div className="flex flex-col items-center">
          <span className="font-medieval text-xs font-bold text-amber-400">
            {chapter.title.split(':')[0]}
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Dalga: {hudWave} / {chapter.waveCount}
          </span>
        </div>

        {/* Right: Gold & Pause / Audio */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 font-mono text-xs font-bold">
            <span>+{hudGold} G</span>
          </div>

          <button
            onClick={() => {
              const next = !soundEnabled;
              sounds.enabled = next;
              setSoundEnabled(next);
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
            title="Ses Aç/Kapat"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>

          <button
            onClick={() => setIsPaused((prev) => !prev)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
            title="Oyunu Duraklat"
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Boss Health Bar (if active) */}
      {bossHpData && (
        <div className="w-full max-w-2xl mb-2 px-2 animate-fade-in">
          <div className="flex items-center justify-between text-xs font-medieval font-bold text-rose-400 mb-1">
            <span>{bossHpData.name}</span>
            <span className="font-mono text-xs">{bossHpData.hp} / {bossHpData.maxHp} HP</span>
          </div>
          <div className="w-full h-3 bg-slate-900 border border-rose-900 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-rose-700 via-rose-500 to-amber-500 h-full transition-all duration-150"
              style={{ width: `${Math.max(0, (bossHpData.hp / bossHpData.maxHp) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Game Canvas Container */}
      <div className="relative w-full max-w-4xl flex items-center justify-center rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onContextMenu={(e) => e.preventDefault()}
          className="cursor-crosshair w-full block touch-none"
        />

        {/* Pause Overlay */}
        {isPaused && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
            <h3 className="font-medieval text-2xl font-bold text-amber-400">
              Oyun Duraklatıldı
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => setIsPaused(false)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>Devam Et</span>
              </button>
              <button
                onClick={onQuitToMenu}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Menüye Dön
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Skill Bar & Mobile Controls */}
      <div className="w-full max-w-4xl mt-3 flex items-center justify-between gap-2 px-2">
        {/* Left: Combat Actions */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Attack Button */}
          <button
            onClick={performAttack}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 active:scale-95 text-slate-200 flex items-center gap-1.5 transition-all text-xs font-semibold cursor-pointer"
          >
            <Swords className="w-4 h-4 text-rose-400" />
            <span>Kılıç [Sol Tık]</span>
          </button>

          {/* Block / Parry Button */}
          <button
            onMouseDown={startBlock}
            onMouseUp={endBlock}
            onTouchStart={startBlock}
            onTouchEnd={endBlock}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 active:scale-95 text-slate-200 flex items-center gap-1.5 transition-all text-xs font-semibold cursor-pointer"
          >
            <Shield className="w-4 h-4 text-sky-400" />
            <span>Kalkan [Sağ Tık]</span>
          </button>

          {/* Dash Button */}
          <button
            onClick={performDash}
            disabled={cdDash > 0}
            className={`px-3.5 py-2 rounded-xl border flex items-center gap-1.5 transition-all text-xs font-semibold cursor-pointer ${
              cdDash <= 0
                ? 'bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-500'
                : 'bg-slate-950 border-slate-800 text-slate-600'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Takla [Shift]</span>
            {cdDash > 0 && <span className="font-mono text-[10px]">{(cdDash / 1000).toFixed(1)}s</span>}
          </button>
        </div>

        {/* Right: Special Skills */}
        <div className="flex items-center gap-2">
          {/* Skill 1: Whirlwind */}
          <button
            onClick={performWhirlwind}
            disabled={cdWhirlwind > 0}
            className={`px-3.5 py-2 rounded-xl border flex items-center gap-1.5 transition-all text-xs font-semibold cursor-pointer ${
              cdWhirlwind <= 0
                ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300 hover:bg-indigo-900/60'
                : 'bg-slate-950 border-slate-800 text-slate-600'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Girdap [Q]</span>
            {cdWhirlwind > 0 && (
              <span className="font-mono text-[10px]">{(cdWhirlwind / 1000).toFixed(1)}s</span>
            )}
          </button>

          {/* Skill 2: Holy Smite */}
          <button
            onClick={performSmite}
            disabled={cdSmite > 0}
            className={`px-3.5 py-2 rounded-xl border flex items-center gap-1.5 transition-all text-xs font-semibold cursor-pointer ${
              cdSmite <= 0
                ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 hover:bg-amber-900/60'
                : 'bg-slate-950 border-slate-800 text-slate-600'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Işık [E]</span>
            {cdSmite > 0 && (
              <span className="font-mono text-[10px]">{(cdSmite / 1000).toFixed(1)}s</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
