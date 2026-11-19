import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Chapter, ElementType } from '../types/game';
import { ARMOR_SKINS, SWORD_SKINS } from '../data/cosmetics';
import { ACTS } from '../data/chapters';
import { ELEMENTS } from '../data/elements';
import { sounds } from '../utils/sound';
import { build3DArena } from '../three/arena';
import { createKnightModel, createEnemyModel, createBossModel, KnightModelData } from '../three/models';
import { createSlashArcTexture, createShieldBarrierTexture } from '../three/textures';
import {
  Heart,
  Swords,
  Shield,
  Zap,
  Sparkles,
  Pause,
  Play,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Flame,
  Droplets,
  Wind,
  RotateCcw
} from 'lucide-react';

interface Props {
  chapter: Chapter;
  playerStats: {
    equippedArmor: string;
    equippedSword: string;
    upgrades: Record<string, number>;
    element?: ElementType;
  };
  onStageClear: (stars: number, gold: number, remainingHpPercent: number) => void;
  onGameOver: (remainingHpPercent: number) => void;
  onQuitToMenu: () => void;
  onRestart?: () => void;
}

interface EnemyEntity {
  id: number;
  name: string;
  type: 'melee' | 'archer' | 'brute' | 'caster' | 'boss';
  mesh: THREE.Group;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  attackRange: number;
  attackCooldown: number;
  lastAttackTime: number;
  specialSkill?: string;
  specialCooldown: number;
  lastSpecialTime: number;
  stunTimer: number;
  burnTimer: number;
  gold: number;
  chargeTarget?: { x: number; z: number };
}

interface Projectile3D {
  mesh: THREE.Mesh;
  vx: number;
  vz: number;
  damage: number;
  fromPlayer: boolean;
  pierce: number;
  life: number;
}

interface HazardCircle3D {
  mesh: THREE.Mesh;
  timer: number;
  maxTimer: number;
  damage: number;
  radius: number;
  type: string;
}

interface DropItem3D {
  id: number;
  type: 'gold' | 'potion' | 'boost';
  mesh: THREE.Group;
  value: number;
}

interface FloatingLabel {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  opacity: number;
}

export const GameCanvas3D: React.FC<Props> = ({
  chapter,
  playerStats,
  onStageClear,
  onGameOver,
  onQuitToMenu,
  onRestart,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(sounds.enabled);
  const [hudCollapsed, setHudCollapsed] = useState(false);

  // Equipped Cosmetics & Element & Act
  const armorSkin = ARMOR_SKINS.find((a) => a.id === playerStats.equippedArmor) || ARMOR_SKINS[0];
  const swordSkin = SWORD_SKINS.find((s) => s.id === playerStats.equippedSword) || SWORD_SKINS[0];
  const actInfo = ACTS.find((a) => a.id === chapter.actId) || ACTS[0];
  const element: ElementType = playerStats.element || 'fire';
  const elementInfo = ELEMENTS[element];

  // Upgrades
  const upAtk = (playerStats.upgrades['attack'] || 0) * 12;
  const upHp = (playerStats.upgrades['hp'] || 0) * 25;
  const upDef = (playerStats.upgrades['defense'] || 0) * 0.03;
  const upCrit = (playerStats.upgrades['crit'] || 0) * 0.04;
  const upSpd = (playerStats.upgrades['speed'] || 0) * 0.05;
  const upSkill = (playerStats.upgrades['skill'] || 0) * 0.15;

  // Elemental passive bonus
  const elemSpeedMultiplier = element === 'air' ? 1.3 : 1.0;
  const elemCritMultiplier = element === 'fire' ? 0.08 : 0.0;

  // Combat Stats
  const baseHp = 100 + armorSkin.statBonus.hp + upHp;
  const baseAttack = 22 + swordSkin.statBonus.attack + upAtk;
  const baseDefPercent = Math.min(0.65, armorSkin.statBonus.defense * 0.01 + upDef);
  const baseCritPercent = Math.min(0.75, 0.05 + swordSkin.statBonus.crit * 0.01 + upCrit + elemCritMultiplier);
  const baseSpeed = 8.5 * (1 + upSpd) * elemSpeedMultiplier;

  // Reactive HUD
  const [hudHp, setHudHp] = useState(baseHp);
  const [hudMaxHp, setHudMaxHp] = useState(baseHp);
  const [hudFrostShield, setHudFrostShield] = useState(0);
  const [hudPotions, setHudPotions] = useState(3);
  const [hudGold, setHudGold] = useState(0);
  const [hudWave, setHudWave] = useState(1);
  const [bossHpData, setBossHpData] = useState<{ name: string; hp: number; maxHp: number } | null>(null);
  const [floatingLabels, setFloatingLabels] = useState<FloatingLabel[]>([]);

  // Cooldowns
  const [cdWhirlwind, setCdWhirlwind] = useState(0);
  const [cdSmite, setCdSmite] = useState(0);
  const [cdDash, setCdDash] = useState(0);
  const [cdElemental, setCdElemental] = useState(0);

  // Mutable Engine State Ref
  const engineRef = useRef({
    renderer: null as THREE.WebGLRenderer | null,
    camera: null as THREE.PerspectiveCamera | null,
    scene: null as THREE.Scene | null,
    arena: null as ReturnType<typeof build3DArena> | null,
    raycaster: new THREE.Raycaster(),
    mouseNDC: new THREE.Vector2(0, 0),
    groundPlane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    raycastIntersection: new THREE.Vector3(),
    keys: {} as Record<string, boolean>,
    touchMovement: { x: 0, z: 0 },

    // Knight Entity with Articulated Limbs
    knight: {
      data: null as KnightModelData | null,
      shieldBarrierMesh: null as THREE.Mesh | null,
      slashArcMesh: null as THREE.Mesh | null,
      holyPillarMesh: null as THREE.Mesh | null,
      elementalWaveMesh: null as THREE.Mesh | null,
      x: 0,
      z: 0,
      targetAngle: 0,
      walkCycle: 0,
      isMoving: false,
      hp: baseHp,
      maxHp: baseHp,
      frostShield: 0,
      potions: 3,
      goldEarned: 0,
      // Attack state
      comboIndex: 0,
      lastAttackTime: 0,
      isAttacking: false,
      attackSwingTimer: 0,
      // Block & Parry
      isBlocking: false,
      blockStartTime: 0,
      // Dash
      isDashing: false,
      dashTimer: 0,
      dashVx: 0,
      dashVz: 0,
      lastDashTime: 0,
      // Skills
      lastWhirlwindTime: 0,
      lastSmiteTime: 0,
      lastElementalTime: 0,
      lastPotionTime: 0,
      boostTimer: 0,
      speedBuffTimer: 0,
      invulnerableTimer: 0,
    },

    // Collections
    enemies: [] as EnemyEntity[],
    projectiles: [] as Projectile3D[],
    hazards: [] as HazardCircle3D[],
    drops: [] as DropItem3D[],

    // Progression & State
    currentWave: 1,
    totalWaves: chapter.waveCount,
    screenShake: 0,
    gameEnded: false,
    nextId: 1,
  });

  // Action: Normal Attack 3-Hit Combo in 3D
  const performAttack = useCallback(() => {
    const engine = engineRef.current;
    const k = engine.knight;
    if (k.isBlocking || k.isDashing || engine.gameEnded) return;

    const now = Date.now();
    if (now - k.lastAttackTime < 240) return;

    if (now - k.lastAttackTime > 850) {
      k.comboIndex = 0;
    } else {
      k.comboIndex = (k.comboIndex + 1) % 3;
    }
    k.lastAttackTime = now;
    k.isAttacking = true;
    k.attackSwingTimer = 0.22;

    sounds.playSlash();

    // 3D Slash Arc Visually Active
    if (k.slashArcMesh) {
      k.slashArcMesh.visible = true;
      k.slashArcMesh.scale.set(k.comboIndex === 2 ? 1.4 : 1.0, 1.0, k.comboIndex === 2 ? 1.4 : 1.0);
    }

    // Hit Calculation
    const isHeavy = k.comboIndex === 2;
    const reach = isHeavy ? 3.8 : 2.9;
    const isCrit = Math.random() < baseCritPercent;
    const boostMult = k.boostTimer > 0 ? 1.5 : 1.0;
    const heavyMult = isHeavy ? 1.75 : 1.0;
    const firePassiveBonus = element === 'fire' ? 1.25 : 1.0;
    const finalDamage = Math.round(baseAttack * heavyMult * boostMult * firePassiveBonus * (isCrit ? 2.0 : 1.0));

    let hitAny = false;

    engine.enemies.forEach((enemy) => {
      const dx = enemy.mesh.position.x - k.x;
      const dz = enemy.mesh.position.z - k.z;
      const dist = Math.hypot(dx, dz);

      if (dist <= reach + enemy.radius) {
        const enemyAngle = Math.atan2(dx, dz);
        let diff = Math.abs(enemyAngle - k.targetAngle);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;

        if (diff <= (isHeavy ? 1.4 : 0.95)) {
          enemy.hp -= finalDamage;
          hitAny = true;

          // Water element passive: Chill slow
          if (element === 'water') {
            enemy.speed = Math.max(1.0, enemy.speed * 0.7);
          }

          // Fire element passive: Burn dot
          if (element === 'fire') {
            enemy.burnTimer = 3.0;
          }

          // Knockback with Arena Bounds Clamp (Prevents soft-lock bug!)
          const knockDist = isHeavy ? 1.6 : 0.8;
          enemy.mesh.position.x = Math.max(-23, Math.min(23, enemy.mesh.position.x + Math.sin(k.targetAngle) * knockDist));
          enemy.mesh.position.z = Math.max(-15, Math.min(15, enemy.mesh.position.z + Math.cos(k.targetAngle) * knockDist));

          // Floating damage
          addFloatingLabel(
            isCrit ? `${finalDamage}!` : `${finalDamage}`,
            enemy.mesh.position.x,
            enemy.mesh.position.z,
            isCrit ? '#facc15' : element === 'fire' ? '#f97316' : '#ffffff'
          );
        }
      }
    });

    if (hitAny) {
      if (isCrit) {
        sounds.playCrit();
        engine.screenShake = 0.45;
      } else {
        sounds.playHit();
        engine.screenShake = 0.15;
      }
    }
  }, [baseAttack, baseCritPercent, element]);

  // Action: Shield Block / Parry
  const startBlock = useCallback(() => {
    const k = engineRef.current.knight;
    if (k.isDashing || engineRef.current.gameEnded) return;
    k.isBlocking = true;
    k.blockStartTime = Date.now();
    if (k.shieldBarrierMesh) {
      k.shieldBarrierMesh.visible = true;
    }
  }, []);

  const endBlock = useCallback(() => {
    const k = engineRef.current.knight;
    k.isBlocking = false;
    if (k.shieldBarrierMesh) {
      k.shieldBarrierMesh.visible = false;
    }
  }, []);

  // Action: 3D Dash / Dodge
  const performDash = useCallback(() => {
    const engine = engineRef.current;
    const k = engine.knight;
    const now = Date.now();
    const dashCd = element === 'air' ? 650 : 1100; // Air element halves dash cooldown!
    if (k.isDashing || now - k.lastDashTime < dashCd || engine.gameEnded) return;

    k.isDashing = true;
    k.dashTimer = 0.22;
    k.lastDashTime = now;
    k.invulnerableTimer = 0.25;

    let moveX = 0;
    let moveZ = 0;
    if (engine.keys['KeyW'] || engine.keys['ArrowUp']) moveZ -= 1;
    if (engine.keys['KeyS'] || engine.keys['ArrowDown']) moveZ += 1;
    if (engine.keys['KeyA'] || engine.keys['ArrowLeft']) moveX -= 1;
    if (engine.keys['KeyD'] || engine.keys['ArrowRight']) moveX += 1;

    let dashAng = k.targetAngle;
    if (moveX !== 0 || moveZ !== 0) {
      dashAng = Math.atan2(moveX, moveZ);
    }

    const dashSpeed = element === 'air' ? 26 : 22;
    k.dashVx = Math.sin(dashAng) * dashSpeed;
    k.dashVz = Math.cos(dashAng) * dashSpeed;

    sounds.playDash();
  }, [element]);

  // Action: 3D Whirlwind (Girdap)
  const performWhirlwind = useCallback(() => {
    const engine = engineRef.current;
    const k = engine.knight;
    const now = Date.now();
    if (now - k.lastWhirlwindTime < 4500 || engine.gameEnded) return;

    k.lastWhirlwindTime = now;
    sounds.playWhirlwind();
    engine.screenShake = 0.5;

    const dmg = Math.round(baseAttack * 2.2 * (1 + upSkill));
    const radius = 5.2;

    engine.enemies.forEach((enemy) => {
      const dist = Math.hypot(enemy.mesh.position.x - k.x, enemy.mesh.position.z - k.z);
      if (dist <= radius + enemy.radius) {
        enemy.hp -= dmg;
        const ang = Math.atan2(enemy.mesh.position.x - k.x, enemy.mesh.position.z - k.z);
        // Clamp bounds
        enemy.mesh.position.x = Math.max(-23, Math.min(23, enemy.mesh.position.x + Math.sin(ang) * 1.8));
        enemy.mesh.position.z = Math.max(-15, Math.min(15, enemy.mesh.position.z + Math.cos(ang) * 1.8));

        addFloatingLabel(`${dmg} GİRDAP`, enemy.mesh.position.x, enemy.mesh.position.z, '#38bdf8');
      }
    });
  }, [baseAttack, upSkill]);

  // Action: 3D Holy Smite (Kutsal Işık)
  const performSmite = useCallback(() => {
    const engine = engineRef.current;
    const k = engine.knight;
    const now = Date.now();
    if (now - k.lastSmiteTime < 8000 || engine.gameEnded) return;

    k.lastSmiteTime = now;
    sounds.playHolySmite();
    engine.screenShake = 0.9;

    const smiteX = k.x + Math.sin(k.targetAngle) * 3.5;
    const smiteZ = k.z + Math.cos(k.targetAngle) * 3.5;
    const radius = 6.5;
    const dmg = Math.round(baseAttack * 3.5 * (1 + upSkill));

    // Show Holy Light Pillar in 3D
    if (k.holyPillarMesh) {
      k.holyPillarMesh.position.set(smiteX, 6, smiteZ);
      k.holyPillarMesh.visible = true;
      setTimeout(() => {
        if (k.holyPillarMesh) k.holyPillarMesh.visible = false;
      }, 450);
    }

    engine.enemies.forEach((enemy) => {
      const dist = Math.hypot(enemy.mesh.position.x - smiteX, enemy.mesh.position.z - smiteZ);
      if (dist <= radius + enemy.radius) {
        enemy.hp -= dmg;
        enemy.stunTimer = 1.4;

        addFloatingLabel(`${dmg} KUTSAL!`, enemy.mesh.position.x, enemy.mesh.position.z, '#fde047');
      }
    });
  }, [baseAttack, upSkill]);

  // Action: 3D Elemental Ultimate Ability (F / Özel Güç)
  const performElementalSkill = useCallback(() => {
    const engine = engineRef.current;
    const k = engine.knight;
    const now = Date.now();
    const elemCd = element === 'air' ? 7500 : 9500;
    if (now - k.lastElementalTime < elemCd || engine.gameEnded) return;

    k.lastElementalTime = now;

    if (element === 'fire') {
      // ATEŞ: Kıyamet Alev Dalgası (Inferno Wave)
      sounds.playBossRoar();
      sounds.playWhirlwind();
      engine.screenShake = 1.1;

      // 3D expanding magma cone
      const dmg = Math.round(baseAttack * 4.2 * (1 + upSkill));
      const forwardX = k.x + Math.sin(k.targetAngle) * 4.5;
      const forwardZ = k.z + Math.cos(k.targetAngle) * 4.5;

      // Hit enemies in front
      engine.enemies.forEach((enemy) => {
        const dist = Math.hypot(enemy.mesh.position.x - forwardX, enemy.mesh.position.z - forwardZ);
        if (dist <= 7.0 + enemy.radius) {
          enemy.hp -= dmg;
          enemy.burnTimer = 4.5;
          enemy.mesh.position.x = Math.max(-23, Math.min(23, enemy.mesh.position.x + Math.sin(k.targetAngle) * 2.5));
          enemy.mesh.position.z = Math.max(-15, Math.min(15, enemy.mesh.position.z + Math.cos(k.targetAngle) * 2.5));
          addFloatingLabel(`${dmg} ALEV DALGASI!`, enemy.mesh.position.x, enemy.mesh.position.z, '#f97316');
        }
      });

      // Spawn 3 flaming magma impact hazards
      for (let i = 0; i < 3; i++) {
        const hx = forwardX + (Math.random() - 0.5) * 5;
        const hz = forwardZ + (Math.random() - 0.5) * 5;
        spawn3DHazard(hx, hz, 2.5, baseAttack * 1.5, 'fire');
      }
    } else if (element === 'water') {
      // SU / BUZ: Buzul Tsunami & Mutlak Donma (Glacial Tsunami)
      sounds.playParry();
      sounds.playWhirlwind();
      engine.screenShake = 0.8;

      const dmg = Math.round(baseAttack * 3.2 * (1 + upSkill));

      // 360-degree freeze shockwave
      engine.enemies.forEach((enemy) => {
        const dist = Math.hypot(enemy.mesh.position.x - k.x, enemy.mesh.position.z - k.z);
        if (dist <= 8.5 + enemy.radius) {
          enemy.hp -= dmg;
          enemy.stunTimer = 3.2; // Absolute freeze for 3.2 seconds!
          addFloatingLabel(`${dmg} DONDU! (3s)`, enemy.mesh.position.x, enemy.mesh.position.z, '#38bdf8');
        }
      });

      // Grant Knight a Frost Barrier that absorbs damage
      const shieldAmount = Math.round(k.maxHp * 0.45);
      k.frostShield = shieldAmount;
      setHudFrostShield(shieldAmount);
      addFloatingLabel(`+${shieldAmount} BUZ KALKANI`, k.x, k.z, '#38bdf8');
    } else {
      // HAVA / FIRTINA: Zincirleme Yıldırım Kasırgası (Tempest Cyclone)
      sounds.playHolySmite();
      sounds.playCrit();
      engine.screenShake = 1.0;

      const dmg = Math.round(baseAttack * 3.8 * (1 + upSkill));

      // Lightning arcs to all enemies and vacuum cyclone
      engine.enemies.forEach((enemy) => {
        const dist = Math.hypot(enemy.mesh.position.x - k.x, enemy.mesh.position.z - k.z);
        if (dist <= 11.0 + enemy.radius) {
          enemy.hp -= dmg;
          enemy.stunTimer = 1.0;
          // Vacuum pull towards knight
          const pullAng = Math.atan2(k.x - enemy.mesh.position.x, k.z - enemy.mesh.position.z);
          enemy.mesh.position.x = Math.max(-23, Math.min(23, enemy.mesh.position.x + Math.sin(pullAng) * 2.8));
          enemy.mesh.position.z = Math.max(-15, Math.min(15, enemy.mesh.position.z + Math.cos(pullAng) * 2.8));
          addFloatingLabel(`${dmg} ŞİMŞEK!`, enemy.mesh.position.x, enemy.mesh.position.z, '#fde047');
        }
      });

      // Speed buff for 6s
      k.speedBuffTimer = 6.0;
      addFloatingLabel('FIRTINA HIZI (+%60)', k.x, k.z, '#fde047');
    }
  }, [baseAttack, element, upSkill]);

  // Action: Healing Potion
  const drinkPotion = useCallback(() => {
    const engine = engineRef.current;
    const k = engine.knight;
    const now = Date.now();
    if (k.potions <= 0 || k.hp >= k.maxHp || now - k.lastPotionTime < 2000 || engine.gameEnded) return;

    k.potions -= 1;
    k.lastPotionTime = now;
    const healAmount = Math.round(k.maxHp * 0.45);
    k.hp = Math.min(k.maxHp, k.hp + healAmount);
    setHudHp(k.hp);
    setHudPotions(k.potions);

    sounds.playPotion();
    addFloatingLabel(`+${healAmount} CAN`, k.x, k.z, '#4ade80');
  }, []);

  // Floating label helper with 3D projection
  const addFloatingLabel = (text: string, worldX: number, worldZ: number, color: string) => {
    const engine = engineRef.current;
    if (!engine.camera || !engine.renderer) return;

    const tempV = new THREE.Vector3(worldX, 2.2, worldZ);
    tempV.project(engine.camera);

    const canvas = engine.renderer.domElement;
    const screenX = (tempV.x * 0.5 + 0.5) * canvas.clientWidth;
    const screenY = (-(tempV.y * 0.5) + 0.5) * canvas.clientHeight;

    const labelId = Math.random();
    setFloatingLabels((prev) => [
      ...prev.slice(-15),
      { id: labelId, text, x: screenX, y: screenY, color, opacity: 1 },
    ]);

    setTimeout(() => {
      setFloatingLabels((prev) => prev.filter((l) => l.id !== labelId));
    }, 900);
  };

  // Spawn Enemy Wave into 3D Scene
  const spawnWave = useCallback(
    (waveNum: number) => {
      const engine = engineRef.current;
      const scene = engine.scene;
      if (!scene) return;

      const arenaW = 46;
      const arenaD = 32;

      chapter.enemies.forEach((group) => {
        const count = Math.ceil(group.count * (1 + (waveNum - 1) * 0.3));

        for (let i = 0; i < count; i++) {
          const edge = Math.floor(Math.random() * 4);
          let ex = 0;
          let ez = 0;
          if (edge === 0) { ex = (Math.random() - 0.5) * arenaW; ez = -arenaD / 2 + 2; }
          else if (edge === 1) { ex = arenaW / 2 - 2; ez = (Math.random() - 0.5) * arenaD; }
          else if (edge === 2) { ex = (Math.random() - 0.5) * arenaW; ez = arenaD / 2 - 2; }
          else { ex = -arenaW / 2 + 2; ez = (Math.random() - 0.5) * arenaD; }

          let mesh: THREE.Group;
          if (group.template.type === 'boss') {
            mesh = createBossModel(group.template.name);
          } else {
            mesh = createEnemyModel(group.template.type, group.template.color);
          }

          mesh.position.set(ex, 0, ez);
          scene.add(mesh);

          const enemy: EnemyEntity = {
            id: engine.nextId++,
            name: group.template.name,
            type: group.template.type,
            mesh,
            hp: group.template.maxHp,
            maxHp: group.template.maxHp,
            speed: group.template.speed * 2.2,
            damage: group.template.damage,
            radius: group.template.type === 'boss' ? 1.6 : group.template.type === 'brute' ? 1.1 : 0.8,
            attackRange: group.template.type === 'archer' || group.template.type === 'caster' ? 14 : group.template.type === 'boss' ? 3.4 : 1.8,
            attackCooldown: group.template.attackCooldown / 1000,
            lastAttackTime: Date.now() / 1000 + Math.random(),
            specialSkill: group.template.specialSkill,
            specialCooldown: 4.5,
            lastSpecialTime: Date.now() / 1000 + 2,
            stunTimer: 0,
            burnTimer: 0,
            gold: group.template.gold,
          };

          engine.enemies.push(enemy);
        }
      });

      if (chapter.isBossStage && waveNum === chapter.waveCount) {
        sounds.playBossRoar();
        engine.screenShake = 1.2;
      }
    },
    [chapter]
  );

  // Setup Three.js WebGL Scene & Game Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Initialize Renderer
    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(46, w / h, 0.5, 120);
    camera.position.set(0, 16, 17);
    camera.lookAt(0, 0, 0);

    // 3. Build 3D Arena
    const arena = build3DArena(renderer, actInfo);
    const scene = arena.scene;

    // 4. Assemble Articulated 3D Knight Model with Elemental Glow
    const knightParts = createKnightModel(armorSkin, swordSkin, element);
    scene.add(knightParts.group);

    // 3D Sword Slash Arc Mesh
    const arcTexture = createSlashArcTexture(swordSkin.bladeColor, swordSkin.glowColor);
    const arcGeo = new THREE.PlaneGeometry(3.6, 1.8);
    const arcMat = new THREE.MeshBasicMaterial({
      map: arcTexture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const slashArcMesh = new THREE.Mesh(arcGeo, arcMat);
    slashArcMesh.rotation.x = -Math.PI / 2;
    slashArcMesh.position.set(0, 1.1, 1.6);
    slashArcMesh.visible = false;
    knightParts.group.add(slashArcMesh);

    // 3D Shield Energy Barrier Dome
    const barrierTexture = createShieldBarrierTexture(
      element === 'water' ? '#38bdf8' : armorSkin.glowColor !== 'transparent' ? armorSkin.glowColor : '#38bdf8'
    );
    const barrierGeo = new THREE.PlaneGeometry(2.4, 2.4);
    const barrierMat = new THREE.MeshBasicMaterial({
      map: barrierTexture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const shieldBarrierMesh = new THREE.Mesh(barrierGeo, barrierMat);
    shieldBarrierMesh.position.set(-0.6, 1.2, 0.8);
    shieldBarrierMesh.rotation.y = 0.2;
    shieldBarrierMesh.visible = false;
    knightParts.group.add(shieldBarrierMesh);

    // 3D Holy Light Pillar (for Smite skill)
    const pillarGeo = new THREE.CylinderGeometry(2.8, 3.2, 20, 16, 1, true);
    const pillarMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const holyPillarMesh = new THREE.Mesh(pillarGeo, pillarMat);
    holyPillarMesh.visible = false;
    scene.add(holyPillarMesh);

    // Store in Engine Ref
    engineRef.current.renderer = renderer;
    engineRef.current.camera = camera;
    engineRef.current.scene = scene;
    engineRef.current.arena = arena;
    engineRef.current.knight.data = knightParts;
    engineRef.current.knight.slashArcMesh = slashArcMesh;
    engineRef.current.knight.shieldBarrierMesh = shieldBarrierMesh;
    engineRef.current.knight.holyPillarMesh = holyPillarMesh;
    engineRef.current.knight.hp = baseHp;
    engineRef.current.knight.maxHp = baseHp;
    engineRef.current.knight.frostShield = 0;
    engineRef.current.knight.potions = 3;
    engineRef.current.knight.goldEarned = 0;
    engineRef.current.knight.x = 0;
    engineRef.current.knight.z = 0;
    engineRef.current.knight.walkCycle = 0;
    engineRef.current.knight.isMoving = false;
    engineRef.current.knight.isDashing = false;
    engineRef.current.knight.isAttacking = false;
    engineRef.current.knight.isBlocking = false;
    engineRef.current.knight.attackSwingTimer = 0;
    engineRef.current.knight.boostTimer = 0;
    engineRef.current.knight.speedBuffTimer = 0;
    engineRef.current.knight.invulnerableTimer = 0;
    engineRef.current.keys = {};
    engineRef.current.touchMovement = { x: 0, z: 0 };
    engineRef.current.enemies = [];
    engineRef.current.projectiles = [];
    engineRef.current.hazards = [];
    engineRef.current.drops = [];
    engineRef.current.currentWave = 1;
    engineRef.current.gameEnded = false;

    // Spawn first wave
    spawnWave(1);
    setHudWave(1);
    setHudHp(baseHp);
    setHudMaxHp(baseHp);
    setHudFrostShield(0);
    setHudPotions(3);
    setHudGold(0);

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    // Animation Tick Loop with THREE.Clock
    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(0.04, clock.getDelta());
      const totalTime = clock.getElapsedTime();

      if (!isPaused) {
        update3DGame(dt, totalTime);
        arena.update(totalTime);
        renderer.render(scene, camera);
      }
    };
    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      arena.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, [actInfo, armorSkin, swordSkin, baseHp, spawnWave, isPaused, element]);

  // Main 3D Game Physics & AI Tick with Walking Animation
  const update3DGame = (dt: number, totalTime: number) => {
    const engine = engineRef.current;
    const k = engine.knight;
    const parts = k.data;
    if (engine.gameEnded || !parts || !engine.camera || !engine.scene) return;

    const knightGroup = parts.group;
    const now = Date.now();

    // Cooldown trackers
    const elemCdMax = element === 'air' ? 7500 : 9500;
    setCdWhirlwind(Math.max(0, 4500 - (now - k.lastWhirlwindTime)));
    setCdSmite(Math.max(0, 8000 - (now - k.lastSmiteTime)));
    const currentDashCd = element === 'air' ? 650 : 1100;
    setCdDash(Math.max(0, currentDashCd - (now - k.lastDashTime)));
    setCdElemental(Math.max(0, elemCdMax - (now - k.lastElementalTime)));

    if (k.boostTimer > 0) k.boostTimer -= dt;
    if (k.speedBuffTimer > 0) k.speedBuffTimer -= dt;
    if (k.invulnerableTimer > 0) k.invulnerableTimer -= dt;

    // Decay Screen Shake
    if (engine.screenShake > 0) {
      engine.screenShake *= 0.9;
      if (engine.screenShake < 0.02) engine.screenShake = 0;
    }

    // 1. Raycast Cursor to Ground for Knight Aiming Direction
    engine.raycaster.setFromCamera(engine.mouseNDC, engine.camera);
    if (engine.raycaster.ray.intersectPlane(engine.groundPlane, engine.raycastIntersection)) {
      const dx = engine.raycastIntersection.x - k.x;
      const dz = engine.raycastIntersection.z - k.z;
      k.targetAngle = Math.atan2(dx, dz);
    }

    // Smoothly rotate knight towards target angle
    knightGroup.rotation.y = THREE.MathUtils.damp(knightGroup.rotation.y, k.targetAngle, 14, dt);

    // 2. Knight Movement & Bipedal Walking Cycle Animation
    let mx = engine.touchMovement.x;
    let mz = engine.touchMovement.z;
    if (engine.keys['KeyW'] || engine.keys['ArrowUp']) mz -= 1;
    if (engine.keys['KeyS'] || engine.keys['ArrowDown']) mz += 1;
    if (engine.keys['KeyA'] || engine.keys['ArrowLeft']) mx -= 1;
    if (engine.keys['KeyD'] || engine.keys['ArrowRight']) mx += 1;

    const moveMag = Math.hypot(mx, mz);
    if (moveMag > 1.0) {
      mx /= moveMag;
      mz /= moveMag;
    }

    const isMoving = moveMag > 0.05;
    k.isMoving = isMoving;

    if (k.isDashing) {
      k.x += k.dashVx * dt;
      k.z += k.dashVz * dt;
      k.dashTimer -= dt;
      if (k.dashTimer <= 0) {
        k.isDashing = false;
      }
    } else {
      const spdFactor = (k.isBlocking ? 0.45 : 1.0) * (k.speedBuffTimer > 0 ? 1.6 : 1.0);
      k.x += mx * baseSpeed * spdFactor * dt;
      k.z += mz * baseSpeed * spdFactor * dt;
    }

    // Arena boundary clamp
    const boundX = 23;
    const boundZ = 15;
    k.x = Math.max(-boundX, Math.min(boundX, k.x));
    k.z = Math.max(-boundZ, Math.min(boundZ, k.z));
    knightGroup.position.set(k.x, 0, k.z);

    // FLUID ARTICULATED WALKING & RUNNING ANIMATION
    if (isMoving && !k.isDashing) {
      k.walkCycle += dt * 13;

      // Leg stride oscillation
      const stride = Math.sin(k.walkCycle);
      parts.leftLegPivot.rotation.x = stride * 0.72;
      parts.rightLegPivot.rotation.x = -stride * 0.72;

      // Dynamic foot lift off the floor while swinging forward
      parts.leftLegPivot.position.y = 0.7 + Math.max(0, -stride) * 0.12;
      parts.rightLegPivot.position.y = 0.7 + Math.max(0, stride) * 0.12;

      // Subtle hip tilt roll
      parts.leftLegPivot.rotation.z = stride * 0.04;
      parts.rightLegPivot.rotation.z = -stride * 0.04;

      // Arm swing oscillation (counterbalancing legs)
      if (!k.isBlocking) {
        parts.leftArmPivot.rotation.x = THREE.MathUtils.damp(parts.leftArmPivot.rotation.x, -stride * 0.45 + 0.22, 14, dt);
        parts.leftArmPivot.rotation.z = 0.14 + stride * 0.06;
      }
      if (!k.isAttacking) {
        parts.rightArmPivot.rotation.x = THREE.MathUtils.damp(parts.rightArmPivot.rotation.x, stride * 0.45 - 0.18, 14, dt);
        if (parts.swordGroup) {
          parts.swordGroup.rotation.z = stride * 0.08;
        }
      }

      // Torso vertical bounce & dynamic forward lean into stride
      parts.bodyGroup.position.y = -Math.abs(Math.sin(k.walkCycle)) * 0.08;
      parts.bodyGroup.rotation.x = THREE.MathUtils.damp(parts.bodyGroup.rotation.x, 0.15, 12, dt);
      parts.bodyGroup.rotation.y = THREE.MathUtils.damp(parts.bodyGroup.rotation.y, stride * 0.12, 12, dt);
      parts.bodyGroup.rotation.z = THREE.MathUtils.damp(parts.bodyGroup.rotation.z, stride * 0.04, 12, dt);

      // Cape dynamically flowing behind the running knight
      if (parts.capeMesh) {
        parts.capeMesh.rotation.x = THREE.MathUtils.damp(parts.capeMesh.rotation.x, 0.5 + Math.sin(totalTime * 14) * 0.15, 12, dt);
        parts.capeMesh.rotation.y = THREE.MathUtils.damp(parts.capeMesh.rotation.y, stride * 0.16, 12, dt);
      }
    } else {
      // Return to standing idle stance smoothly
      parts.leftLegPivot.rotation.x = THREE.MathUtils.damp(parts.leftLegPivot.rotation.x, 0, 10, dt);
      parts.rightLegPivot.rotation.x = THREE.MathUtils.damp(parts.rightLegPivot.rotation.x, 0, 10, dt);
      parts.leftLegPivot.position.y = THREE.MathUtils.damp(parts.leftLegPivot.position.y, 0.7, 10, dt);
      parts.rightLegPivot.position.y = THREE.MathUtils.damp(parts.rightLegPivot.position.y, 0.7, 10, dt);
      parts.leftLegPivot.rotation.z = THREE.MathUtils.damp(parts.leftLegPivot.rotation.z, 0, 10, dt);
      parts.rightLegPivot.rotation.z = THREE.MathUtils.damp(parts.rightLegPivot.rotation.z, 0, 10, dt);

      if (!k.isBlocking) {
        parts.leftArmPivot.rotation.x = THREE.MathUtils.damp(parts.leftArmPivot.rotation.x, 0, 8, dt);
        parts.leftArmPivot.rotation.z = THREE.MathUtils.damp(parts.leftArmPivot.rotation.z, 0, 8, dt);
      }
      if (!k.isAttacking) {
        parts.rightArmPivot.rotation.x = THREE.MathUtils.damp(parts.rightArmPivot.rotation.x, 0, 8, dt);
        if (parts.swordGroup) {
          parts.swordGroup.rotation.z = THREE.MathUtils.damp(parts.swordGroup.rotation.z, 0, 8, dt);
        }
      }

      // Idle natural breathing
      parts.bodyGroup.position.y = Math.sin(totalTime * 3) * 0.03;
      parts.bodyGroup.rotation.x = THREE.MathUtils.damp(parts.bodyGroup.rotation.x, 0, 8, dt);
      parts.bodyGroup.rotation.y = THREE.MathUtils.damp(parts.bodyGroup.rotation.y, 0, 8, dt);
      parts.bodyGroup.rotation.z = THREE.MathUtils.damp(parts.bodyGroup.rotation.z, 0, 8, dt);

      // Cape resting idle sway
      if (parts.capeMesh) {
        parts.capeMesh.rotation.x = THREE.MathUtils.damp(parts.capeMesh.rotation.x, 0.16 + Math.sin(totalTime * 3) * 0.05, 6, dt);
        parts.capeMesh.rotation.y = THREE.MathUtils.damp(parts.capeMesh.rotation.y, 0, 6, dt);
      }
    }

    // Orbiting Elemental Orbs rotation & vertical bobbing
    if (parts.elementalOrbs) {
      parts.elementalOrbs.rotation.y += dt * (isMoving ? 4.2 : 2.6);
      parts.elementalOrbs.position.y = 1.2 + Math.sin(totalTime * 4) * 0.08;
    }

    // Elemental Ring pulsation
    if (parts.elementalRing) {
      const ringPulse = 1.0 + Math.sin(totalTime * 4.5) * 0.06;
      parts.elementalRing.scale.set(ringPulse, ringPulse, ringPulse);
    }

    // Sword Swing animation decay
    if (k.attackSwingTimer > 0) {
      k.attackSwingTimer -= dt;
      if (parts.swordGroup) {
        parts.swordGroup.rotation.x = THREE.MathUtils.damp(parts.swordGroup.rotation.x, -Math.PI / 3, 20, dt);
      }
      if (k.attackSwingTimer <= 0 && k.slashArcMesh) {
        k.slashArcMesh.visible = false;
      }
    } else if (parts.swordGroup) {
      parts.swordGroup.rotation.x = THREE.MathUtils.damp(parts.swordGroup.rotation.x, Math.PI / 6, 12, dt);
    }

    // Camera following knight with smooth damp and shake
    const targetCamX = k.x + (Math.random() - 0.5) * engine.screenShake * 1.5;
    const targetCamY = 16 + (Math.random() - 0.5) * engine.screenShake * 1.5;
    const targetCamZ = k.z + 16;
    engine.camera.position.x = THREE.MathUtils.damp(engine.camera.position.x, targetCamX, 6, dt);
    engine.camera.position.y = THREE.MathUtils.damp(engine.camera.position.y, targetCamY, 6, dt);
    engine.camera.position.z = THREE.MathUtils.damp(engine.camera.position.z, targetCamZ, 6, dt);
    engine.camera.lookAt(k.x, 1.2, k.z);

    // 3. Projectiles Update
    for (let i = engine.projectiles.length - 1; i >= 0; i--) {
      const proj = engine.projectiles[i];
      proj.mesh.position.x += proj.vx * dt;
      proj.mesh.position.z += proj.vz * dt;
      proj.life += dt;

      // Hit Player check
      if (!proj.fromPlayer) {
        const dist = Math.hypot(k.x - proj.mesh.position.x, k.z - proj.mesh.position.z);
        if (dist <= 1.2) {
          if (k.isBlocking) {
            const parryEligible = now - k.blockStartTime < 250;
            if (parryEligible) {
              sounds.playParry();
              addFloatingLabel('PARRY!', k.x, k.z, '#38bdf8');
              proj.fromPlayer = true;
              proj.vx = -proj.vx * 1.6;
              proj.vz = -proj.vz * 1.6;
              (proj.mesh.material as THREE.MeshBasicMaterial).color.set(0x38bdf8);
              continue;
            } else {
              sounds.playBlock();
              addFloatingLabel('BLOK', k.x, k.z, '#94a3b8');
              proj.pierce = 0;
            }
          } else if (k.invulnerableTimer <= 0) {
            applyDamageToKnight(proj.damage);
            proj.pierce = 0;
          }
        }
      }

      if (proj.pierce <= 0 || proj.life > 4) {
        engine.scene.remove(proj.mesh);
        engine.projectiles.splice(i, 1);
      }
    }

    // 4. Update Hazard Ground Decals
    for (let i = engine.hazards.length - 1; i >= 0; i--) {
      const hz = engine.hazards[i];
      hz.timer -= dt;

      const progress = 1 - hz.timer / hz.maxTimer;
      hz.mesh.scale.set(progress, 1, progress);

      if (hz.timer <= 0) {
        // Explosion hit
        const dist = Math.hypot(k.x - hz.mesh.position.x, k.z - hz.mesh.position.z);
        if (dist <= hz.radius && k.invulnerableTimer <= 0) {
          if (k.isBlocking) {
            sounds.playBlock();
            applyDamageToKnight(hz.damage * 0.3);
          } else {
            sounds.playHit();
            engine.screenShake = 0.7;
            applyDamageToKnight(hz.damage);
          }
        }
        engine.scene.remove(hz.mesh);
        engine.hazards.splice(i, 1);
      }
    }

    // 5. Update Enemies
    let activeBoss: EnemyEntity | null = null;
    const nowSec = now / 1000;

    for (let i = engine.enemies.length - 1; i >= 0; i--) {
      const enemy = engine.enemies[i];
      if (enemy.type === 'boss') activeBoss = enemy;

      // Handle burning DOT damage
      if (enemy.burnTimer > 0) {
        enemy.burnTimer -= dt;
        enemy.hp -= dt * 18;
      }

      if (enemy.stunTimer > 0) {
        enemy.stunTimer -= dt;
        continue;
      }

      const edx = k.x - enemy.mesh.position.x;
      const edz = k.z - enemy.mesh.position.z;
      const dist = Math.hypot(edx, edz);
      const angle = Math.atan2(edx, edz);
      enemy.mesh.rotation.y = angle;

      if (enemy.type === 'archer' || enemy.type === 'caster') {
        if (dist < enemy.attackRange - 3) {
          enemy.mesh.position.x -= Math.sin(angle) * enemy.speed * dt;
          enemy.mesh.position.z -= Math.cos(angle) * enemy.speed * dt;
        } else if (dist > enemy.attackRange + 3) {
          enemy.mesh.position.x += Math.sin(angle) * enemy.speed * dt;
          enemy.mesh.position.z += Math.cos(angle) * enemy.speed * dt;
        }

        if (nowSec - enemy.lastAttackTime > enemy.attackCooldown) {
          enemy.lastAttackTime = nowSec;

          if (enemy.type === 'archer') {
            const arrowMesh = new THREE.Mesh(
              new THREE.ConeGeometry(0.1, 0.6, 6),
              new THREE.MeshBasicMaterial({ color: 0xfacc15 })
            );
            arrowMesh.position.set(enemy.mesh.position.x, 1.2, enemy.mesh.position.z);
            arrowMesh.rotation.y = angle;
            arrowMesh.rotation.x = Math.PI / 2;
            engine.scene.add(arrowMesh);

            const arrowSpd = 16;
            engine.projectiles.push({
              mesh: arrowMesh,
              vx: Math.sin(angle) * arrowSpd,
              vz: Math.cos(angle) * arrowSpd,
              damage: enemy.damage,
              fromPlayer: false,
              pierce: 1,
              life: 0,
            });
          } else {
            spawn3DHazard(k.x, k.z, 2.8, enemy.damage * 1.5, enemy.specialSkill || 'fire');
          }
        }
      } else if (enemy.type === 'brute') {
        if (nowSec - enemy.lastSpecialTime > enemy.specialCooldown && dist < 12) {
          enemy.lastSpecialTime = nowSec;
          enemy.chargeTarget = { x: k.x, z: k.z };
        }

        if (enemy.chargeTarget) {
          const cdx = enemy.chargeTarget.x - enemy.mesh.position.x;
          const cdz = enemy.chargeTarget.z - enemy.mesh.position.z;
          const cdist = Math.hypot(cdx, cdz);
          if (cdist < 1.0) {
            enemy.chargeTarget = undefined;
          } else {
            const cang = Math.atan2(cdx, cdz);
            enemy.mesh.position.x += Math.sin(cang) * 14 * dt;
            enemy.mesh.position.z += Math.cos(cang) * 14 * dt;
          }
        } else {
          enemy.mesh.position.x += Math.sin(angle) * enemy.speed * dt;
          enemy.mesh.position.z += Math.cos(angle) * enemy.speed * dt;
        }

        if (dist <= enemy.radius + 1.2 && nowSec - enemy.lastAttackTime > enemy.attackCooldown) {
          enemy.lastAttackTime = nowSec;
          applyDamageToKnight(enemy.damage);
        }
      } else if (enemy.type === 'boss') {
        enemy.mesh.position.x += Math.sin(angle) * enemy.speed * dt;
        enemy.mesh.position.z += Math.cos(angle) * enemy.speed * dt;

        if (dist <= enemy.radius + 1.4 && nowSec - enemy.lastAttackTime > enemy.attackCooldown) {
          enemy.lastAttackTime = nowSec;
          applyDamageToKnight(enemy.damage);
        }

        if (nowSec - enemy.lastSpecialTime > 3.8) {
          enemy.lastSpecialTime = nowSec;
          for (let b = 0; b < 3; b++) {
            const offX = (Math.random() - 0.5) * 8;
            const offZ = (Math.random() - 0.5) * 8;
            spawn3DHazard(enemy.mesh.position.x + offX, enemy.mesh.position.z + offZ, 3.2, enemy.damage * 1.4, 'fire');
          }
        }
      } else {
        enemy.mesh.position.x += Math.sin(angle) * enemy.speed * dt;
        enemy.mesh.position.z += Math.cos(angle) * enemy.speed * dt;

        if (dist <= enemy.radius + 1.1 && nowSec - enemy.lastAttackTime > enemy.attackCooldown) {
          enemy.lastAttackTime = nowSec;
          applyDamageToKnight(enemy.damage);
        }
      }

      // Clamp Enemy Position within Arena to PREVENT SOFTOCCK BUGS
      enemy.mesh.position.x = Math.max(-23, Math.min(23, enemy.mesh.position.x));
      enemy.mesh.position.z = Math.max(-15, Math.min(15, enemy.mesh.position.z));

      // Check Enemy Death
      if (enemy.hp <= 0) {
        sounds.playCoin();
        k.goldEarned += enemy.gold;
        setHudGold(k.goldEarned);

        spawn3DDrop(enemy.mesh.position.x, enemy.mesh.position.z, 'gold', enemy.gold);

        if (Math.random() < 0.25) {
          spawn3DDrop(
            enemy.mesh.position.x + 0.8,
            enemy.mesh.position.z + 0.8,
            Math.random() < 0.6 ? 'potion' : 'boost',
            1
          );
        }

        engine.scene.remove(enemy.mesh);
        engine.enemies.splice(i, 1);
      }
    }

    if (activeBoss) {
      setBossHpData({ name: activeBoss.name, hp: Math.max(0, Math.round(activeBoss.hp)), maxHp: activeBoss.maxHp });
    } else {
      setBossHpData(null);
    }

    // 6. 3D Drops update (Rotate & Magnetize)
    for (let i = engine.drops.length - 1; i >= 0; i--) {
      const drop = engine.drops[i];
      drop.mesh.rotation.y += dt * 3;
      drop.mesh.position.y = 0.4 + Math.sin(totalTime * 4 + drop.id) * 0.15;

      const dist = Math.hypot(k.x - drop.mesh.position.x, k.z - drop.mesh.position.z);
      if (dist < 6.5) {
        const ang = Math.atan2(k.x - drop.mesh.position.x, k.z - drop.mesh.position.z);
        drop.mesh.position.x += Math.sin(ang) * 9 * dt;
        drop.mesh.position.z += Math.cos(ang) * 9 * dt;
      }

      if (dist < 1.4) {
        if (drop.type === 'potion') {
          k.potions = Math.min(5, k.potions + 1);
          setHudPotions(k.potions);
          sounds.playPotion();
          addFloatingLabel('+1 İKSİR', k.x, k.z, '#22c55e');
        } else if (drop.type === 'boost') {
          k.boostTimer = 8.0;
          sounds.playCrit();
          addFloatingLabel('GÜÇ ARTIŞI! (+%50)', k.x, k.z, '#f59e0b');
        }
        engine.scene.remove(drop.mesh);
        engine.drops.splice(i, 1);
      }
    }

    // 7. Check Player Death
    if (k.hp <= 0) {
      engine.gameEnded = true;
      sounds.playDefeat();
      onGameOver(0);
      return;
    }

    // 8. Wave Completion Check
    if (engine.enemies.length === 0) {
      if (engine.currentWave < engine.totalWaves) {
        engine.currentWave += 1;
        setHudWave(engine.currentWave);
        spawnWave(engine.currentWave);
      } else {
        engine.gameEnded = true;
        sounds.playVictory();
        const hpPercent = (k.hp / k.maxHp) * 100;
        let stars = 1;
        if (hpPercent >= 75) stars = 3;
        else if (hpPercent >= 40) stars = 2;

        const totalGold = chapter.rewardGold + k.goldEarned;
        onStageClear(stars, totalGold, hpPercent);
      }
    }
  };

  // Helper: Spawn 3D Ground Hazard Zone
  const spawn3DHazard = (x: number, z: number, radius: number, damage: number, type: string) => {
    const engine = engineRef.current;
    if (!engine.scene) return;

    const ringGeo = new THREE.RingGeometry(radius * 0.85, radius, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: type === 'ice' ? 0x38bdf8 : type === 'void' ? 0xc084fc : 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.set(x, 0.04, z);
    engine.scene.add(ringMesh);

    engine.hazards.push({
      mesh: ringMesh,
      timer: 1.1,
      maxTimer: 1.1,
      damage,
      radius,
      type,
    });
  };

  // Helper: Spawn 3D Collectible Drop
  const spawn3DDrop = (x: number, z: number, type: 'gold' | 'potion' | 'boost', value: number) => {
    const engine = engineRef.current;
    if (!engine.scene) return;

    const group = new THREE.Group();
    // Clamp drops inside bounds
    const clampedX = Math.max(-22, Math.min(22, x));
    const clampedZ = Math.max(-14, Math.min(14, z));
    group.position.set(clampedX, 0.4, clampedZ);

    if (type === 'gold') {
      const coin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 0.08, 12),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.2 })
      );
      coin.rotation.x = Math.PI / 2;
      group.add(coin);
    } else if (type === 'potion') {
      const bottle = new THREE.Mesh(
        new THREE.SphereGeometry(0.26, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x22c55e, metalness: 0.1, roughness: 0.2 })
      );
      group.add(bottle);
    } else {
      const orb = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.3),
        new THREE.MeshBasicMaterial({ color: 0xf97316 })
      );
      group.add(orb);
    }

    engine.scene.add(group);
    engine.drops.push({ id: Math.random(), type, mesh: group, value });
  };

  // Apply Enemy damage to Knight (considering Frost Shield and Defenses)
  const applyDamageToKnight = (rawDmg: number) => {
    const engine = engineRef.current;
    const k = engine.knight;
    if (k.invulnerableTimer > 0) return;

    if (k.isBlocking) {
      const now = Date.now();
      const isParry = now - k.blockStartTime < 220;
      if (isParry) {
        sounds.playParry();
        addFloatingLabel('MÜKEMMEL SAVUŞTURMA!', k.x, k.z, '#38bdf8');
        engine.screenShake = 0.3;
        return;
      } else {
        sounds.playBlock();
        const mitigated = Math.round(rawDmg * 0.25 * (1 - baseDefPercent));
        applyDamageWithShield(mitigated);
        addFloatingLabel('BLOK', k.x, k.z, '#94a3b8');
        return;
      }
    }

    const actual = Math.round(rawDmg * (1 - baseDefPercent));
    applyDamageWithShield(actual);
    sounds.playHit();
    engine.screenShake = 0.55;
    addFloatingLabel(`-${actual}`, k.x, k.z, '#ef4444');
  };

  const applyDamageWithShield = (dmg: number) => {
    const k = engineRef.current.knight;
    if (k.frostShield > 0) {
      if (k.frostShield >= dmg) {
        k.frostShield -= dmg;
        setHudFrostShield(k.frostShield);
        addFloatingLabel(`-${dmg} KALKAN`, k.x, k.z, '#38bdf8');
        return;
      } else {
        const overflow = dmg - k.frostShield;
        k.frostShield = 0;
        setHudFrostShield(0);
        k.hp = Math.max(0, k.hp - overflow);
        setHudHp(k.hp);
        return;
      }
    }
    k.hp = Math.max(0, k.hp - dmg);
    setHudHp(k.hp);
  };

  // Keyboard Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      engineRef.current.keys[e.code] = true;

      if (e.code === 'Space' || e.code === 'KeyJ') performAttack();
      else if (e.code === 'KeyK') startBlock();
      else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyL') performDash();
      else if (e.code === 'KeyQ' || e.code === 'KeyU') performWhirlwind();
      else if (e.code === 'KeyE' || e.code === 'KeyI') performSmite();
      else if (e.code === 'KeyF') performElementalSkill();
      else if (e.code === 'KeyR' || e.code === 'KeyH') drinkPotion();
      else if (e.code === 'KeyP') setIsPaused((p) => !p);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      engineRef.current.keys[e.code] = false;
      if (e.code === 'KeyK') endBlock();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [performAttack, startBlock, endBlock, performDash, performWhirlwind, performSmite, performElementalSkill, drinkPotion]);

  // Accurate Pointer NDC calculation
  const updateNDCFromEvent = (clientX: number, clientY: number, currentTarget: HTMLElement) => {
    const rect = currentTarget.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((clientY - rect.top) / rect.height) * 2 - 1);
    engineRef.current.mouseNDC.set(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    updateNDCFromEvent(e.clientX, e.clientY, e.currentTarget);
  };

  const setTouchMove = (x: number, z: number) => {
    engineRef.current.touchMovement.x = x;
    engineRef.current.touchMovement.z = z;
  };

  return (
    <div
      onPointerMove={handlePointerMove}
      onMouseDown={(e) => {
        updateNDCFromEvent(e.clientX, e.clientY, e.currentTarget);
        if (e.button === 0) performAttack();
        else if (e.button === 2) {
          e.preventDefault();
          startBlock();
        }
      }}
      onMouseUp={(e) => {
        if (e.button === 2) endBlock();
      }}
      onContextMenu={(e) => e.preventDefault()}
      className="relative w-full h-[76vh] min-h-[500px] max-h-[720px] rounded-3xl overflow-hidden border border-slate-800 bg-[#070a12] shadow-2xl select-none"
    >
      {/* 3D WebGL Canvas Mounting Container */}
      <div ref={mountRef} className="w-full h-full cursor-crosshair touch-none" />

      {/* On-screen Bipedal Movement D-Pad (Touch & Click Walk Controller) */}
      <div className="absolute bottom-20 left-4 sm:bottom-6 sm:left-6 z-20 flex flex-col items-center select-none pointer-events-auto bg-slate-950/85 p-2 rounded-2xl border border-slate-800/80 backdrop-blur-md shadow-2xl">
        <span className="text-[10px] font-mono text-slate-400 mb-1 font-bold">Yürüme (WASD)</span>
        <button
          onPointerDown={() => setTouchMove(0, -1)}
          onPointerUp={() => setTouchMove(0, 0)}
          onPointerLeave={() => setTouchMove(0, 0)}
          className="w-10 h-10 rounded-xl bg-slate-900 active:bg-amber-500 active:text-slate-950 border border-slate-700 flex items-center justify-center font-bold text-sm text-slate-200 transition-colors cursor-pointer select-none"
          title="İleri Yürü"
        >
          ▲
        </button>
        <div className="flex gap-1.5 my-1">
          <button
            onPointerDown={() => setTouchMove(-1, 0)}
            onPointerUp={() => setTouchMove(0, 0)}
            onPointerLeave={() => setTouchMove(0, 0)}
            className="w-10 h-10 rounded-xl bg-slate-900 active:bg-amber-500 active:text-slate-950 border border-slate-700 flex items-center justify-center font-bold text-sm text-slate-200 transition-colors cursor-pointer select-none"
            title="Sola Yürü"
          >
            ◀
          </button>
          <button
            onPointerDown={() => setTouchMove(0, 1)}
            onPointerUp={() => setTouchMove(0, 0)}
            onPointerLeave={() => setTouchMove(0, 0)}
            className="w-10 h-10 rounded-xl bg-slate-900 active:bg-amber-500 active:text-slate-950 border border-slate-700 flex items-center justify-center font-bold text-sm text-slate-200 transition-colors cursor-pointer select-none"
            title="Geri Yürü"
          >
            ▼
          </button>
          <button
            onPointerDown={() => setTouchMove(1, 0)}
            onPointerUp={() => setTouchMove(0, 0)}
            onPointerLeave={() => setTouchMove(0, 0)}
            className="w-10 h-10 rounded-xl bg-slate-900 active:bg-amber-500 active:text-slate-950 border border-slate-700 flex items-center justify-center font-bold text-sm text-slate-200 transition-colors cursor-pointer select-none"
            title="Sağa Yürü"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Floating 3D Damage Screen Labels */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingLabels.map((lbl) => (
          <div
            key={lbl.id}
            style={{
              left: `${lbl.x}px`,
              top: `${lbl.y}px`,
              color: lbl.color,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute font-medieval font-black text-sm drop-shadow-md transition-all duration-300 pointer-events-none"
          >
            {lbl.text}
          </div>
        ))}
      </div>

      {/* Top HUD Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
        {/* Left: Player HP & Potions & Frost Shield */}
        <div className="flex items-center gap-3 bg-slate-950/85 border border-slate-800/80 px-4 py-2 rounded-xl backdrop-blur-sm">
          <div className="flex flex-col">
            <div className="flex items-center justify-between gap-3 text-xs mb-1">
              <span className="font-medieval font-bold text-slate-200 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span>Şövalye Kaelen</span>
                {hudFrostShield > 0 && (
                  <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-500/40">
                    +{hudFrostShield} Buz
                  </span>
                )}
              </span>
              <span className="font-mono text-xs font-bold text-slate-400">
                {Math.max(0, Math.round(hudHp))} / {hudMaxHp}
              </span>
            </div>
            {/* Health Bar */}
            <div className="w-40 sm:w-52 h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-400 h-full transition-all duration-150"
                style={{ width: `${Math.max(0, (hudHp / hudMaxHp) * 100)}%` }}
              />
            </div>
          </div>

          <button
            onClick={drinkPotion}
            disabled={hudPotions <= 0 || hudHp >= hudMaxHp}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              hudPotions > 0 && hudHp < hudMaxHp
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400 hover:bg-emerald-900/80'
                : 'bg-slate-900 border-slate-800 text-slate-600'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-emerald-400" />
            <span>x{hudPotions} [R]</span>
          </button>
        </div>

        {/* Center: Stage, Wave & Active Element Badge */}
        <div className="hidden sm:flex items-center gap-3 bg-slate-950/85 border border-slate-800/80 px-4 py-1.5 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: elementInfo.themeColor }}>
            {element === 'fire' ? (
              <Flame className="w-4 h-4" />
            ) : element === 'water' ? (
              <Droplets className="w-4 h-4" />
            ) : (
              <Wind className="w-4 h-4" />
            )}
            <span>{elementInfo.title}</span>
          </div>
          <span className="text-slate-600">·</span>
          <span className="font-medieval text-xs font-bold text-amber-400">
            {chapter.title.split(':')[0]}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-[11px] font-mono text-slate-400">
            Dalga: {hudWave} / {chapter.waveCount}
          </span>
        </div>

        {/* Right: Gold, Sound, Pause */}
        <div className="flex items-center gap-2 bg-slate-950/85 border border-slate-800/80 px-3 py-1.5 rounded-xl backdrop-blur-sm">
          <span className="font-mono text-xs font-bold text-amber-400">
            +{hudGold} G
          </span>
          <span className="text-slate-700">·</span>
          <button
            onClick={() => {
              const next = !soundEnabled;
              sounds.enabled = next;
              setSoundEnabled(next);
            }}
            className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>
          <button
            onClick={() => setIsPaused((p) => !p)}
            className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Boss Health Bar (if active) */}
      {bossHpData && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 pointer-events-none animate-fade-in">
          <div className="bg-slate-950/90 border border-rose-900/80 rounded-xl p-2.5 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs font-medieval font-bold text-rose-400 mb-1">
              <span>{bossHpData.name}</span>
              <span className="font-mono text-xs">{bossHpData.hp} / {bossHpData.maxHp} HP</span>
            </div>
            <div className="w-full h-3 bg-slate-900 border border-rose-950 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-rose-700 via-rose-500 to-amber-500 h-full transition-all duration-150"
                style={{ width: `${Math.max(0, (bossHpData.hp / bossHpData.maxHp) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Pause Menu Modal */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-40">
          <h3 className="font-medieval text-2xl font-black text-amber-400">
            Oyun Duraklatıldı
          </h3>
          <p className="text-xs text-slate-400">3D Savaş Sahnesi Beklemede</p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setIsPaused(false)}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>Devam Et</span>
            </button>
            {onRestart && (
              <button
                onClick={() => {
                  setIsPaused(false);
                  onRestart();
                }}
                className="px-5 py-2.5 bg-rose-600/90 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Yeniden Başlat</span>
              </button>
            )}
            <button
              onClick={onQuitToMenu}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Menüye Dön
            </button>
          </div>
        </div>
      )}

      {/* Unified Collapsible Bottom Control Dock (Three.js UX Directive) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 flex flex-col items-center pointer-events-auto">
        <button
          onClick={() => setHudCollapsed((prev) => !prev)}
          className="mb-1 px-3 py-1 bg-slate-950/80 hover:bg-slate-900 text-slate-400 hover:text-slate-200 rounded-full border border-slate-800 text-[11px] flex items-center gap-1 transition-all cursor-pointer backdrop-blur-sm"
        >
          {hudCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{hudCollapsed ? 'Kontrolleri Göster' : 'Gizle'}</span>
        </button>

        {!hudCollapsed && (
          <div className="w-full bg-slate-950/90 border border-slate-800/90 p-3 rounded-2xl backdrop-blur-md shadow-2xl flex flex-wrap items-center justify-between gap-2 animate-fade-in">
            {/* Primary Combat Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={performAttack}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-700 text-slate-100 flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer"
              >
                <Swords className="w-4 h-4 text-rose-400" />
                <span>Kılıç [Sol Tık]</span>
              </button>

              <button
                onMouseDown={startBlock}
                onMouseUp={endBlock}
                onTouchStart={startBlock}
                onTouchEnd={endBlock}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-700 text-slate-100 flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer"
              >
                <Shield className="w-4 h-4 text-sky-400" />
                <span>Kalkan [Sağ Tık]</span>
              </button>

              <button
                onClick={performDash}
                disabled={cdDash > 0}
                className={`px-3.5 py-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  cdDash <= 0
                    ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-100'
                    : 'bg-slate-950 border-slate-800 text-slate-600'
                }`}
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Takla [Shift]</span>
                {cdDash > 0 && <span className="font-mono text-[10px]">{(cdDash / 1000).toFixed(1)}s</span>}
              </button>
            </div>

            {/* Special & Elemental Skills */}
            <div className="flex items-center gap-2">
              {/* Skill 1: Whirlwind */}
              <button
                onClick={performWhirlwind}
                disabled={cdWhirlwind > 0}
                className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  cdWhirlwind <= 0
                    ? 'bg-indigo-950/70 hover:bg-indigo-900/80 border-indigo-500/50 text-indigo-300'
                    : 'bg-slate-950 border-slate-800 text-slate-600'
                }`}
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Girdap [Q]</span>
                {cdWhirlwind > 0 && <span className="font-mono text-[10px]">{(cdWhirlwind / 1000).toFixed(1)}s</span>}
              </button>

              {/* Skill 2: Holy Smite */}
              <button
                onClick={performSmite}
                disabled={cdSmite > 0}
                className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  cdSmite <= 0
                    ? 'bg-amber-950/70 hover:bg-amber-900/80 border-amber-500/50 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-600'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Işık [E]</span>
                {cdSmite > 0 && <span className="font-mono text-[10px]">{(cdSmite / 1000).toFixed(1)}s</span>}
              </button>

              {/* Elemental Special Power (F Key) */}
              <button
                onClick={performElementalSkill}
                disabled={cdElemental > 0}
                className={`px-3.5 py-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                  cdElemental <= 0
                    ? element === 'fire'
                      ? 'bg-rose-950/80 hover:bg-rose-900 border-rose-500 text-rose-300 shadow-md shadow-rose-500/20'
                      : element === 'water'
                      ? 'bg-sky-950/80 hover:bg-sky-900 border-sky-500 text-sky-300 shadow-md shadow-sky-500/20'
                      : 'bg-amber-950/80 hover:bg-amber-900 border-amber-500 text-amber-300 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-600'
                }`}
              >
                {element === 'fire' ? (
                  <Flame className="w-4 h-4 text-rose-400" />
                ) : element === 'water' ? (
                  <Droplets className="w-4 h-4 text-sky-400" />
                ) : (
                  <Wind className="w-4 h-4 text-amber-400" />
                )}
                <span>Özel Güç [F]</span>
                {cdElemental > 0 && <span className="font-mono text-[10px]">{(cdElemental / 1000).toFixed(1)}s</span>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
