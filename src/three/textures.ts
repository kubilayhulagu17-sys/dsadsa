import * as THREE from 'three';

// Cache generated textures so we don't recreate them repeatedly
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Procedural medieval stone floor texture with flagstone tiles, cracks and roughness
 */
export function createStoneFloorTexture(themeColor: string, floorBaseColor: string): THREE.CanvasTexture {
  const cacheKey = `floor_${themeColor}_${floorBaseColor}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Base background
  ctx.fillStyle = floorBaseColor;
  ctx.fillRect(0, 0, 1024, 1024);

  // Stone flagstone grid
  const cols = 8;
  const rows = 8;
  const tileW = 1024 / cols;
  const tileH = 1024 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * tileW;
      const y = r * tileH;

      // Slight random variation in tile brightness
      const brightnessShift = (Math.random() - 0.5) * 25;
      ctx.fillStyle = adjustBrightness(floorBaseColor, brightnessShift);
      ctx.fillRect(x + 3, y + 3, tileW - 6, tileH - 6);

      // Flagstone border bevel
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.lineWidth = 4;
      ctx.strokeRect(x + 2, y + 2, tileW - 4, tileH - 4);

      // Subtle surface stone noise
      for (let p = 0; p < 40; p++) {
        ctx.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)';
        ctx.fillRect(
          x + 5 + Math.random() * (tileW - 10),
          y + 5 + Math.random() * (tileH - 10),
          Math.random() * 8 + 2,
          Math.random() * 8 + 2
        );
      }

      // Runic/thematic cracks on some stones
      if (Math.random() < 0.3) {
        ctx.strokeStyle = themeColor;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const startX = x + tileW * 0.3;
        const startY = y + tileH * 0.3;
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + (Math.random() - 0.5) * 40, startY + Math.random() * 30);
        ctx.lineTo(startX + (Math.random() - 0.5) * 60, startY + Math.random() * 60);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Procedural sword swing slash arc texture
 */
export function createSlashArcTexture(bladeColor: string, glowColor: string): THREE.CanvasTexture {
  const cacheKey = `slash_${bladeColor}_${glowColor}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, 512, 128);

  // Crescent gradient
  const grad = ctx.createLinearGradient(0, 64, 512, 64);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.3, glowColor);
  grad.addColorStop(0.85, bladeColor);
  grad.addColorStop(1, '#ffffff');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, 64);
  ctx.bezierCurveTo(150, 0, 350, 0, 512, 64);
  ctx.bezierCurveTo(350, 128, 150, 128, 0, 64);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Energy shield / shockwave circle texture
 */
export function createShieldBarrierTexture(glowColor: string): THREE.CanvasTexture {
  const cacheKey = `shield_${glowColor}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const cx = 128;
  const cy = 128;

  // Outer glowing ring
  const radGrad = ctx.createRadialGradient(cx, cy, 70, cx, cy, 120);
  radGrad.addColorStop(0, 'rgba(255,255,255,0.8)');
  radGrad.addColorStop(0.4, glowColor);
  radGrad.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = radGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 120, 0, Math.PI * 2);
  ctx.fill();

  // Hexagonal runic honeycomb lines
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(ang) * 90, cy + Math.sin(ang) * 90);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Particle glow texture
 */
export function createParticleTexture(): THREE.CanvasTexture {
  if (textureCache.has('particle_glow')) {
    return textureCache.get('particle_glow')!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.3, 'rgba(255,255,255,0.8)');
  grad.addColorStop(0.7, 'rgba(255,255,255,0.2)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set('particle_glow', texture);
  return texture;
}

// Color helper
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  if (isNaN(num)) return hex;
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `rgb(${R},${G},${B})`;
}
