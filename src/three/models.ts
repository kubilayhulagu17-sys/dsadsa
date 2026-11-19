import * as THREE from 'three';
import { ArmorSkin, SwordSkin, ElementType } from '../types/game';

export interface KnightModelData {
  group: THREE.Group;
  bodyGroup: THREE.Group;
  leftLegPivot: THREE.Group;
  rightLegPivot: THREE.Group;
  leftArmPivot: THREE.Group;
  rightArmPivot: THREE.Group;
  swordGroup: THREE.Group;
  shieldGroup: THREE.Group;
  capeMesh: THREE.Mesh;
  glowMesh: THREE.Mesh;
  elementalRing: THREE.Mesh;
  elementalOrbs: THREE.Group;
}

/**
 * Creates an ornate, composite 3D Knight character model with articulated limb pivots
 * allowing authentic bipedal walking/running animations, torso sway, and breathing.
 */
export function createKnightModel(
  armorSkin: ArmorSkin,
  swordSkin: SwordSkin,
  element?: ElementType
): KnightModelData {
  const root = new THREE.Group();

  // Materials
  const armorMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(armorSkin.primaryColor),
    metalness: 0.85,
    roughness: 0.25,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(armorSkin.trimColor),
    metalness: 0.95,
    roughness: 0.15,
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.4,
    roughness: 0.6,
  });

  const glowMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(armorSkin.glowColor !== 'transparent' ? armorSkin.glowColor : '#38bdf8'),
  });

  // 1. Articulated Legs (Pivots at hip Y=0.7)
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.22, 0.7, 0);

  const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.7, 8), armorMat);
  leftLeg.position.set(0, -0.35, 0);
  leftLeg.castShadow = true;
  leftLegPivot.add(leftLeg);

  // Armored Knee Poleyn
  const leftKnee = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), trimMat);
  leftKnee.position.set(0, -0.32, 0.08);
  leftKnee.scale.set(1, 0.85, 1);
  leftLegPivot.add(leftKnee);

  const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.28), trimMat);
  leftBoot.position.set(0, -0.62, 0.05);
  leftBoot.castShadow = true;
  leftLegPivot.add(leftBoot);

  root.add(leftLegPivot);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.22, 0.7, 0);

  const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.7, 8), armorMat);
  rightLeg.position.set(0, -0.35, 0);
  rightLeg.castShadow = true;
  rightLegPivot.add(rightLeg);

  // Armored Knee Poleyn
  const rightKnee = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), trimMat);
  rightKnee.position.set(0, -0.32, 0.08);
  rightKnee.scale.set(1, 0.85, 1);
  rightLegPivot.add(rightKnee);

  const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.28), trimMat);
  rightBoot.position.set(0, -0.62, 0.05);
  rightBoot.castShadow = true;
  rightLegPivot.add(rightBoot);

  root.add(rightLegPivot);

  // 2. Upper Body Group (Torso, Belt, Head, Cape) for subtle breathing & bobbing
  const bodyGroup = new THREE.Group();

  // Waist Belt & Tassets
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.28, 0.15, 8), trimMat);
  belt.position.set(0, 0.78, 0);
  belt.castShadow = true;
  bodyGroup.add(belt);

  // Torso / Breastplate
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.7, 8), armorMat);
  torso.position.set(0, 1.2, 0);
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Chestplate Emblem
  const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.45, 0.2), trimMat);
  chestPlate.position.set(0, 1.25, 0.15);
  chestPlate.castShadow = true;
  bodyGroup.add(chestPlate);

  // Greathelm / Helmet
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.15, 8), darkMat);
  neck.position.set(0, 1.6, 0);
  bodyGroup.add(neck);

  const helmet = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.42, 8), armorMat);
  helmet.position.set(0, 1.85, 0);
  helmet.castShadow = true;
  bodyGroup.add(helmet);

  const helmetDome = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), trimMat);
  helmetDome.position.set(0, 2.05, 0);
  helmetDome.scale.set(1, 0.5, 1);
  bodyGroup.add(helmetDome);

  // Helmet Visor Slit
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.1), darkMat);
  visor.position.set(0, 1.88, 0.18);
  bodyGroup.add(visor);

  // Glowing Eye Slit
  const eyeGlow = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.025, 0.12), glowMat);
  eyeGlow.position.set(0, 1.88, 0.185);
  bodyGroup.add(eyeGlow);

  // Helmet Crest
  const crest = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.35, 0.3), trimMat);
  crest.position.set(0, 2.15, -0.05);
  bodyGroup.add(crest);

  // Flowing Animated Cape
  const capeGeo = new THREE.PlaneGeometry(0.7, 1.2, 4, 8);
  const capeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(armorSkin.capeColor),
    side: THREE.DoubleSide,
    roughness: 0.8,
  });
  const capeMesh = new THREE.Mesh(capeGeo, capeMat);
  capeMesh.position.set(0, 1.0, -0.25);
  capeMesh.rotation.x = 0.15;
  capeMesh.castShadow = true;
  bodyGroup.add(capeMesh);

  root.add(bodyGroup);

  // 3. Articulated Left Arm & Shield (Pivot at shoulder Y=1.45)
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.48, 1.45, 0);

  const leftShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), trimMat);
  leftShoulder.scale.set(1.1, 0.8, 1.1);
  leftShoulder.castShadow = true;
  leftArmPivot.add(leftShoulder);

  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.5, 6), armorMat);
  leftArm.position.set(0, -0.3, 0.1);
  leftArm.rotation.x = Math.PI / 4;
  leftArm.castShadow = true;
  leftArmPivot.add(leftArm);

  const shieldGroup = new THREE.Group();
  shieldGroup.position.set(-0.1, -0.3, 0.3);

  const shieldBody = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.75, 0.06), armorMat);
  shieldBody.castShadow = true;
  shieldGroup.add(shieldBody);

  const shieldBoss = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.15, 6), trimMat);
  shieldBoss.position.set(0, 0.05, 0.06);
  shieldBoss.rotation.x = Math.PI / 2;
  shieldGroup.add(shieldBoss);

  const shieldTrim = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.78, 0.04), trimMat);
  shieldTrim.position.set(0, 0, -0.01);
  shieldGroup.add(shieldTrim);

  leftArmPivot.add(shieldGroup);
  root.add(leftArmPivot);

  // 4. Articulated Right Arm & Sword (Pivot at shoulder Y=1.45)
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.48, 1.45, 0);

  const rightShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), trimMat);
  rightShoulder.scale.set(1.1, 0.8, 1.1);
  rightShoulder.castShadow = true;
  rightArmPivot.add(rightShoulder);

  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.5, 6), armorMat);
  rightArm.position.set(0, -0.3, 0.1);
  rightArm.rotation.x = Math.PI / 6;
  rightArm.castShadow = true;
  rightArmPivot.add(rightArm);

  const swordGroup = new THREE.Group();
  swordGroup.position.set(0.05, -0.4, 0.25);

  const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), trimMat);
  pommel.position.set(0, -0.3, 0);
  swordGroup.add(pommel);

  const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.25, 6), darkMat);
  hilt.position.set(0, -0.15, 0);
  swordGroup.add(hilt);

  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.08), trimMat);
  swordGroup.add(guard);

  let swordEmissive = swordSkin.glowColor;
  let elemColorHex = 0xf97316;
  if (element === 'water') {
    swordEmissive = '#38bdf8';
    elemColorHex = 0x38bdf8;
  } else if (element === 'air') {
    swordEmissive = '#fde047';
    elemColorHex = 0xfde047;
  }

  const bladeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(swordSkin.bladeColor),
    metalness: 0.95,
    roughness: 0.1,
    emissive: new THREE.Color(swordEmissive),
    emissiveIntensity: 0.6,
  });
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.03), bladeMat);
  blade.position.set(0, 0.55, 0);
  blade.castShadow = true;
  swordGroup.add(blade);

  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 4), bladeMat);
  tip.position.set(0, 1.18, 0);
  tip.rotation.y = Math.PI / 4;
  swordGroup.add(tip);

  rightArmPivot.add(swordGroup);
  root.add(rightArmPivot);

  // 5. Elemental Aura VFX (Glowing Rune Ring & Orbiting Orbs)
  // Ground Elemental Ring
  const ringGeo = new THREE.RingGeometry(0.85, 1.1, 24);
  const ringMat = new THREE.MeshBasicMaterial({
    color: elemColorHex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7,
  });
  const elementalRing = new THREE.Mesh(ringGeo, ringMat);
  elementalRing.rotation.x = -Math.PI / 2;
  elementalRing.position.y = 0.03;
  root.add(elementalRing);

  // Orbiting Elemental Orbs with inner core
  const elementalOrbs = new THREE.Group();
  elementalOrbs.position.y = 1.2;
  const orbMat = new THREE.MeshBasicMaterial({ color: elemColorHex });
  for (let i = 0; i < 4; i++) {
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), orbMat);
    const ang = (i / 4) * Math.PI * 2;
    orb.position.set(Math.cos(ang) * 0.95, (i % 2 === 0 ? 0.08 : -0.08), Math.sin(ang) * 0.95);
    elementalOrbs.add(orb);
  }
  root.add(elementalOrbs);

  // Soft Contact Shadow Plane Grounding
  const shadowGeo = new THREE.PlaneGeometry(1.2, 1.2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  root.add(shadowMesh);

  return {
    group: root,
    bodyGroup,
    leftLegPivot,
    rightLegPivot,
    leftArmPivot,
    rightArmPivot,
    swordGroup,
    shieldGroup,
    capeMesh,
    glowMesh: eyeGlow,
    elementalRing,
    elementalOrbs,
  };
}

/**
 * Creates 3D Enemy Models based on archetype
 */
export function createEnemyModel(type: 'melee' | 'archer' | 'brute' | 'caster' | 'boss', color: string): THREE.Group {
  const root = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    metalness: 0.5,
    roughness: 0.4,
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.6,
    roughness: 0.5,
  });

  const eyeGlowMat = new THREE.MeshBasicMaterial({
    color: 0xff0044,
  });

  if (type === 'brute') {
    // Massive Orkish / Golem Warrior
    const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.7, 8), darkMat);
    legs.position.set(0, 0.35, 0);
    root.add(legs);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.6), bodyMat);
    torso.position.set(0, 1.1, 0);
    torso.castShadow = true;
    root.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), darkMat);
    head.position.set(0, 1.7, 0);
    head.castShadow = true;
    root.add(head);

    // Spiked Horns
    const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 4), darkMat);
    hornL.position.set(-0.25, 1.95, 0);
    hornL.rotation.z = 0.5;
    root.add(hornL);

    const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 4), darkMat);
    hornR.position.set(0.25, 1.95, 0);
    hornR.rotation.z = -0.5;
    root.add(hornR);

    // Giant Iron Mace in hand
    const mace = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6), darkMat);
    mace.position.set(0.65, 1.0, 0.3);
    mace.rotation.x = Math.PI / 4;
    root.add(mace);

    const maceHead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), darkMat);
    maceHead.position.set(0.65, 1.5, 0.75);
    root.add(maceHead);
  } else if (type === 'archer') {
    // Slender Hooded Ranger
    const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.6, 6), darkMat);
    legs.position.set(0, 0.3, 0);
    root.add(legs);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.6, 6), bodyMat);
    torso.position.set(0, 0.85, 0);
    root.add(torso);

    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.4, 6), darkMat);
    hood.position.set(0, 1.3, 0);
    root.add(hood);

    // 3D Wooden Recurve Bow in left hand
    const bowGeo = new THREE.TorusGeometry(0.35, 0.03, 4, 8, Math.PI * 0.8);
    const bowMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
    const bow = new THREE.Mesh(bowGeo, bowMat);
    bow.position.set(-0.35, 0.9, 0.2);
    bow.rotation.y = Math.PI / 2;
    root.add(bow);
  } else if (type === 'caster') {
    // Hovering Hooded Necromancer / Mage
    const robe = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.2, 8), bodyMat);
    robe.position.set(0, 0.65, 0);
    root.add(robe);

    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), darkMat);
    hood.position.set(0, 1.35, 0);
    root.add(hood);

    // Eyes
    const eyes = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.08), eyeGlowMat);
    eyes.position.set(0, 1.35, 0.18);
    root.add(eyes);

    // Magic Staff with crystal
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6), darkMat);
    staff.position.set(0.4, 0.9, 0.2);
    root.add(staff);

    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.14),
      new THREE.MeshBasicMaterial({ color: 0xc084fc })
    );
    crystal.position.set(0.4, 1.65, 0.2);
    root.add(crystal);
  } else {
    // Standard Melee Goblin / Bandit
    const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.5, 6), darkMat);
    legs.position.set(0, 0.25, 0);
    root.add(legs);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.55, 6), bodyMat);
    torso.position.set(0, 0.75, 0);
    root.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), bodyMat);
    head.position.set(0, 1.15, 0);
    root.add(head);

    // Iron Helmet
    const helm = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.25, 6), darkMat);
    helm.position.set(0, 1.32, 0);
    root.add(helm);

    // Curved Scimitar / Cleaver
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.02), darkMat);
    blade.position.set(0.35, 0.75, 0.25);
    blade.rotation.x = Math.PI / 4;
    root.add(blade);
  }

  // Shadow disc
  const shadowMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 0.9),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false })
  );
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  root.add(shadowMesh);

  return root;
}

/**
 * Creates Colossal 3D Boss Models with distinct visual silhouettes
 */
export function createBossModel(bossName: string): THREE.Group {
  const root = new THREE.Group();
  root.scale.set(1.65, 1.65, 1.65);

  const bossMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    metalness: 0.8,
    roughness: 0.3,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.95,
    roughness: 0.2,
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    metalness: 0.7,
    roughness: 0.4,
  });

  if (bossName.includes('Ejder') || bossName.includes('Dragon') || bossName.includes('Ignis')) {
    // Red Dragon Ignis
    bossMat.color.set(0xb91c1c);

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.6), bossMat);
    body.position.set(0, 1.1, 0);
    root.add(body);

    // Long Neck & Horned Head
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 1.0, 8), bossMat);
    neck.position.set(0, 1.7, 0.7);
    neck.rotation.x = -Math.PI / 4;
    root.add(neck);

    const head = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 6), bossMat);
    head.position.set(0, 2.05, 1.3);
    head.rotation.x = -Math.PI / 2;
    root.add(head);

    // Glowing Lava Eyes / Throat
    const throat = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xf97316 })
    );
    throat.position.set(0, 1.95, 1.25);
    root.add(throat);

    // Large Dragon Wings
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.9), bossMat);
    wingL.position.set(-1.1, 1.7, -0.2);
    wingL.rotation.z = 0.4;
    root.add(wingL);

    const wingR = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.9), bossMat);
    wingR.position.set(1.1, 1.7, -0.2);
    wingR.rotation.z = -0.4;
    root.add(wingR);

    // Tail
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.6, 6), bossMat);
    tail.position.set(0, 0.8, -1.3);
    tail.rotation.x = Math.PI / 3;
    root.add(tail);
  } else if (bossName.includes('Titan') || bossName.includes('Ymir')) {
    // Frost Titan Ymir
    const iceMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.3,
      roughness: 0.1,
      transparent: true,
      opacity: 0.9,
    });

    const torso = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9), iceMat);
    torso.position.set(0, 1.3, 0);
    root.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), iceMat);
    head.position.set(0, 2.1, 0);
    root.add(head);

    for (let i = 0; i < 4; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 4), iceMat);
      spike.position.set((i - 1.5) * 0.4, 2.0, -0.3);
      spike.rotation.x = -0.4;
      root.add(spike);
    }
  } else {
    // Armored Boss
    const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.8, 8), darkMat);
    legs.position.set(0, 0.4, 0);
    root.add(legs);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.95, 0.55), bossMat);
    torso.position.set(0, 1.25, 0);
    root.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), darkMat);
    head.position.set(0, 1.9, 0);
    root.add(head);

    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.25, 8), goldMat);
    crown.position.set(0, 2.2, 0);
    root.add(crown);

    const sword = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.8, 0.05), goldMat);
    sword.position.set(0.65, 1.3, 0.3);
    sword.rotation.x = Math.PI / 5;
    root.add(sword);
  }

  // Large Boss Shadow
  const shadowMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 2.0),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5, depthWrite: false })
  );
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  root.add(shadowMesh);

  return root;
}
