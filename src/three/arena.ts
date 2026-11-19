import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ActInfo } from '../types/game';
import { createStoneFloorTexture, createParticleTexture } from './textures';

export interface ArenaComponents {
  scene: THREE.Scene;
  floorMesh: THREE.Mesh;
  particles: THREE.Points;
  torches: THREE.PointLight[];
  update: (time: number) => void;
  dispose: () => void;
}

export function build3DArena(renderer: THREE.WebGLRenderer, actInfo: ActInfo): ArenaComponents {
  const scene = new THREE.Scene();

  // 1. Scene Fog & Background
  scene.background = new THREE.Color(0x070a12);
  scene.fog = new THREE.FogExp2(0x070a12, 0.022);

  // 2. Studio Reflection Map via RoomEnvironment
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  const envTexture = pmremGenerator.fromScene(roomEnv, 0.04).texture;
  scene.environment = envTexture;
  pmremGenerator.dispose();

  // 3. Directional Key Light with Soft Shadows
  const dirLight = new THREE.DirectionalLight(0xfff3d6, 1.8);
  dirLight.position.set(16, 28, 14);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 70;
  const d = 26;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.bias = -0.0004;
  dirLight.shadow.normalBias = 0.02;
  scene.add(dirLight);

  // 4. Cool Hemisphere Ambient Fill
  const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 0.65);
  scene.add(hemiLight);

  // 5. Arena Ground Mesh with Procedural Flagstones
  const floorTexture = createStoneFloorTexture(actInfo.themeColor, actInfo.flooringColor);
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTexture,
    metalness: 0.15,
    roughness: 0.75,
  });
  const arenaWidth = 52;
  const arenaDepth = 38;
  const floorGeo = new THREE.PlaneGeometry(arenaWidth, arenaDepth);
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  // 6. Perimeter Pillars & Wall Ruins
  const pillarGeo = new THREE.CylinderGeometry(0.5, 0.65, 5, 8);
  const pillarMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(actInfo.wallColor),
    roughness: 0.85,
    metalness: 0.2,
  });

  const torches: THREE.PointLight[] = [];
  const pillarCountX = 7;
  const pillarCountZ = 5;

  for (let i = 0; i < pillarCountX; i++) {
    const x = -arenaWidth / 2 + (i / (pillarCountX - 1)) * arenaWidth;
    // Top border
    addPillar(x, -arenaDepth / 2);
    // Bottom border
    addPillar(x, arenaDepth / 2);
  }
  for (let j = 1; j < pillarCountZ - 1; j++) {
    const z = -arenaDepth / 2 + (j / (pillarCountZ - 1)) * arenaDepth;
    // Left border
    addPillar(-arenaWidth / 2, z);
    // Right border
    addPillar(arenaWidth / 2, z);
  }

  function addPillar(px: number, pz: number) {
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(px, 2.5, pz);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    scene.add(pillar);

    // Flaming Torch atop alternate pillars
    if ((Math.abs(px) + Math.abs(pz)) % 4 < 2) {
      const torchMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 6), torchMat);
      flame.position.set(px, 5.2, pz);
      scene.add(flame);

      const torchLight = new THREE.PointLight(0xf97316, 2.0, 14, 2);
      torchLight.position.set(px, 5.4, pz);
      scene.add(torchLight);
      torches.push(torchLight);
    }
  }

  // 7. Ambient Particle System (Leaves, Embers, Frost Snowflakes, or Void Dust)
  const particleCount = 200;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * arenaWidth;
    positions[i * 3 + 1] = Math.random() * 8 + 0.5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * arenaDepth;

    velocities[i * 3] = (Math.random() - 0.5) * 0.04;
    velocities[i * 3 + 1] = -Math.random() * 0.03 - 0.01;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.04;
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  let pColor = 0x22c55e;
  if (actInfo.ambientParticle === 'ember') pColor = 0xf97316;
  else if (actInfo.ambientParticle === 'ghost') pColor = 0xa855f7;
  else if (actInfo.ambientParticle === 'frost') pColor = 0x7dd3fc;
  else if (actInfo.ambientParticle === 'void') pColor = 0xc084fc;
  else if (actInfo.ambientParticle === 'shadow') pColor = 0x818cf8;

  const particleMat = new THREE.PointsMaterial({
    size: 0.35,
    color: pColor,
    transparent: true,
    opacity: 0.75,
    map: createParticleTexture(),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const particleSystem = new THREE.Points(particleGeo, particleMat);
  scene.add(particleSystem);

  // Update tick
  const update = (time: number) => {
    // Torch flicker
    torches.forEach((torch, idx) => {
      torch.intensity = 1.8 + Math.sin(time * 8 + idx * 2.3) * 0.4;
    });

    // Particle motion
    const pos = particleGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] += velocities[i * 3];
      pos[i * 3 + 1] += velocities[i * 3 + 1];
      pos[i * 3 + 2] += velocities[i * 3 + 2];

      // Respawn at top if fallen below ground
      if (pos[i * 3 + 1] < 0.2) {
        pos[i * 3 + 1] = 8;
        pos[i * 3] = (Math.random() - 0.5) * arenaWidth;
        pos[i * 3 + 2] = (Math.random() - 0.5) * arenaDepth;
      }
    }
    particleGeo.attributes.position.needsUpdate = true;
  };

  const dispose = () => {
    floorGeo.dispose();
    floorMat.dispose();
    pillarGeo.dispose();
    pillarMat.dispose();
    particleGeo.dispose();
    particleMat.dispose();
    envTexture.dispose();
  };

  return {
    scene,
    floorMesh,
    particles: particleSystem,
    torches,
    update,
    dispose,
  };
}
