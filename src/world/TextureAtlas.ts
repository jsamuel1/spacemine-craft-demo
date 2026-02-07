import * as THREE from 'three';
import { BlockType } from '../types';

const TEX_SIZE = 16; // pixels per block texture
// Atlas layout: one row, one column per block type
const BLOCK_COUNT = 12; // AIR(0) through REINFORCED_HULL(11)

type RGBA = [number, number, number, number];

/** Seeded PRNG for deterministic textures */
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp(v: number, lo = 0, hi = 255) { return Math.max(lo, Math.min(hi, v)); }

function rgba(r: number, g: number, b: number, a = 255): RGBA { return [r, g, b, a]; }

function vary(rng: () => number, base: RGBA, amount: number): RGBA {
  return [
    clamp(base[0] + (rng() - 0.5) * amount),
    clamp(base[1] + (rng() - 0.5) * amount),
    clamp(base[2] + (rng() - 0.5) * amount),
    base[3],
  ];
}

type TexGen = (x: number, y: number, rng: () => number) => RGBA;

/*──────────────────────────────────────────────────────────
 * TEXTURE PROMPTS / DESCRIPTIONS
 * Each describes the intended look for the 16×16 block face.
 * These double as prompts for AI image generation tools.
 *────────────────────────────────────────────────────────*/

export const TEXTURE_PROMPTS: Record<number, string> = {
  [BlockType.AIR]: 'Transparent / not rendered.',

  [BlockType.BASALT]: `Dark volcanic basalt rock texture, 16x16 pixels. 
    Deep charcoal grey base (#3A3A42) with subtle darker cracks and fissures. 
    Occasional tiny lighter grey mineral flecks. Rough, igneous rock appearance. 
    Pixel art style, top-down cubic game block face.`,

  [BlockType.IRON_ORE]: `Iron ore embedded in dark rock, 16x16 pixels. 
    Dark grey-brown stone base (#5A4030) with 3-5 irregular rust-orange ore veins/clusters (#C06830). 
    Ore patches should be 2-4 pixels each, scattered asymmetrically. 
    Pixel art style, cubic voxel game block face.`,

  [BlockType.ICE]: `Space ice / frozen volatile block, 16x16 pixels. 
    Pale blue-white crystalline surface (#B0D8F0) with translucent lighter streaks (#D8F0FF). 
    Subtle crack lines in slightly darker blue. Faint sparkle highlights. 
    Pixel art style, cubic voxel game block face.`,

  [BlockType.NICKEL]: `Nickel ore deposit in rock, 16x16 pixels. 
    Medium grey-green stone base (#6A7060) with silvery-green metallic nodules (#90A880). 
    2-4 pixel metallic clusters with subtle shine highlights. 
    Pixel art style, cubic voxel game block face.`,

  [BlockType.REGOLITH]: `Lunar/asteroid regolith surface, 16x16 pixels. 
    Dusty grey-brown (#8A7A68) with fine granular noise texture. 
    Tiny darker pebble spots and lighter dust patches. Powdery, loose soil look. 
    Pixel art style, cubic voxel game block face.`,

  [BlockType.STEEL_PLANK]: `Brushed steel plank / panel, 16x16 pixels. 
    Metallic blue-grey (#8090A0) with horizontal brushed-metal streaks. 
    Thin darker border lines (1px) on top and bottom edges suggesting panel seams. 
    2 small rivet dots near corners. Industrial space station look. 
    Pixel art style, cubic voxel game block face.`,

  [BlockType.GLASS]: `Space station glass/viewport block, 16x16 pixels. 
    Very light blue-white semi-transparent (#D0E8F8) with thin frame border (2px, darker grey-blue). 
    Subtle diagonal highlight streak across center. Clean, see-through appearance. 
    Pixel art style, cubic voxel game block face.`,

  [BlockType.AIRLOCK_DOOR]: `Heavy airlock door panel, 16x16 pixels. 
    Dark gunmetal grey (#5A6068) with a central vertical seam line. 
    Yellow-black hazard stripe across top 2 rows. 
    Small red/green indicator light pixel at center-right. 
    Reinforced industrial look with subtle panel lines. 
    Pixel art style, cubic voxel game block face.`,

  [BlockType.STORAGE_CRATE]: `Cargo storage crate, 16x16 pixels. 
    Warm brown-tan wooden/composite panels (#A08050) with darker brown border frame (2px). 
    Cross-brace pattern (X) in slightly darker shade across face. 
    Small label/stencil marking area (lighter rectangle) near bottom. 
    Pixel art style, cubic voxel game block face.`,

  [BlockType.WATER_TANK]: `Water storage tank block, 16x16 pixels. 
    Steel grey outer frame/border (#708090, 2px border) with blue liquid interior (#4080C0). 
    Subtle horizontal water level line 3/4 up. Small gauge/valve circle near top-right corner. 
    Pixel art style, cubic voxel game block face.`,

  [BlockType.REINFORCED_HULL]: `Reinforced hull plating, 16x16 pixels. 
    Dark olive-grey (#606858) with diamond/cross-hatch reinforcement pattern. 
    4 bolt/rivet dots near corners. Thicker border lines than steel plank. 
    Heavy-duty armored appearance. 
    Pixel art style, cubic voxel game block face.`,
};

/*──────────────────────────────────────────────────────────
 * PROCEDURAL TEXTURE GENERATORS
 *────────────────────────────────────────────────────────*/

const generators: Record<number, TexGen> = {
  [BlockType.BASALT]: (x, y, rng) => {
    const base: RGBA = [58, 58, 66, 255];
    const v = vary(rng, base, 20);
    // cracks: darker lines
    if ((x + y * 3) % 7 === 0) return rgba(v[0] - 20, v[1] - 20, v[2] - 18);
    // mineral flecks
    if (rng() > 0.93) return rgba(v[0] + 30, v[1] + 28, v[2] + 35);
    return v;
  },

  [BlockType.IRON_ORE]: (x, y, rng) => {
    const base: RGBA = [90, 64, 48, 255];
    const v = vary(rng, base, 18);
    // ore clusters - use deterministic pattern
    const cx1 = 4, cy1 = 5, cx2 = 11, cy2 = 10, cx3 = 7, cy3 = 13;
    const d1 = Math.abs(x - cx1) + Math.abs(y - cy1);
    const d2 = Math.abs(x - cx2) + Math.abs(y - cy2);
    const d3 = Math.abs(x - cx3) + Math.abs(y - cy3);
    if (d1 < 3 || d2 < 2 || d3 < 2) {
      return vary(rng, [192, 104, 48, 255], 20);
    }
    return v;
  },

  [BlockType.ICE]: (x, y, rng) => {
    const base: RGBA = [176, 216, 240, 255];
    const v = vary(rng, base, 12);
    // crack lines
    if ((x === 5 && y > 3 && y < 12) || (y === 8 && x > 2 && x < 10)) {
      return rgba(v[0] - 25, v[1] - 20, v[2] - 10);
    }
    // light streaks
    if (Math.abs(x - y) < 2) return rgba(clamp(v[0] + 30), clamp(v[1] + 25), clamp(v[2] + 15));
    // sparkle
    if (rng() > 0.96) return rgba(255, 255, 255);
    return v;
  },

  [BlockType.NICKEL]: (x, y, rng) => {
    const base: RGBA = [106, 112, 96, 255];
    const v = vary(rng, base, 16);
    // metallic nodules
    const cx1 = 6, cy1 = 4, cx2 = 12, cy2 = 11;
    const d1 = Math.abs(x - cx1) + Math.abs(y - cy1);
    const d2 = Math.abs(x - cx2) + Math.abs(y - cy2);
    if (d1 < 3 || d2 < 2) {
      const n = vary(rng, [144, 168, 128, 255], 15);
      // shine highlight
      if (d1 === 0 || d2 === 0) return rgba(clamp(n[0] + 40), clamp(n[1] + 40), clamp(n[2] + 30));
      return n;
    }
    return v;
  },

  [BlockType.REGOLITH]: (x, y, rng) => {
    const base: RGBA = [138, 122, 104, 255];
    const v = vary(rng, base, 25); // lots of granular noise
    // pebble spots
    if (rng() > 0.9) return rgba(v[0] - 30, v[1] - 28, v[2] - 25);
    // lighter dust
    if (rng() > 0.92) return rgba(clamp(v[0] + 25), clamp(v[1] + 22), clamp(v[2] + 20));
    return v;
  },

  [BlockType.STEEL_PLANK]: (x, y, rng) => {
    const base: RGBA = [128, 144, 160, 255];
    // panel seam borders
    if (y === 0 || y === 15) return rgba(70, 78, 88);
    if (x === 0 || x === 15) return rgba(90, 100, 110);
    // brushed horizontal streaks
    const streak = vary(rng, base, 8);
    streak[0] += (y % 3 === 0 ? 10 : 0);
    streak[1] += (y % 3 === 0 ? 10 : 0);
    streak[2] += (y % 3 === 0 ? 12 : 0);
    // rivets
    if ((x === 2 && y === 2) || (x === 13 && y === 2) || (x === 2 && y === 13) || (x === 13 && y === 13)) {
      return rgba(60, 68, 78);
    }
    return [clamp(streak[0]), clamp(streak[1]), clamp(streak[2]), 255];
  },

  [BlockType.GLASS]: (x, y, rng) => {
    // frame border
    if (x < 2 || x > 13 || y < 2 || y > 13) return rgba(100, 115, 135);
    // inner glass
    const base: RGBA = [208, 232, 248, 220]; // semi-transparent
    const v = vary(rng, base, 6);
    // diagonal highlight
    if (Math.abs(x - y - 2) < 2) return [clamp(v[0] + 20), clamp(v[1] + 15), clamp(v[2] + 10), 230] as RGBA;
    return v;
  },

  [BlockType.AIRLOCK_DOOR]: (x, y, rng) => {
    // hazard stripe top 2 rows
    if (y < 2) {
      return (x + y) % 4 < 2 ? rgba(200, 180, 30) : rgba(40, 40, 40);
    }
    // central vertical seam
    if (x === 7 || x === 8) return rgba(45, 50, 55);
    // indicator light
    if (x === 12 && y === 7) return rgba(40, 200, 60);
    if (x === 12 && y === 8) return rgba(200, 50, 40);
    // base panel
    const base: RGBA = [90, 96, 104, 255];
    const v = vary(rng, base, 10);
    // subtle horizontal panel lines
    if (y === 5 || y === 10) return rgba(v[0] - 15, v[1] - 15, v[2] - 12);
    return v;
  },

  [BlockType.STORAGE_CRATE]: (x, y, rng) => {
    // border frame
    if (x < 2 || x > 13 || y < 2 || y > 13) return rgba(100, 75, 40);
    // cross-brace X pattern
    const dx = x - 7.5, dy = y - 7.5;
    if (Math.abs(Math.abs(dx) - Math.abs(dy)) < 1.2) return rgba(130, 95, 55);
    // label area near bottom
    if (x > 4 && x < 12 && y > 10 && y < 14) return vary(rng, [180, 165, 130, 255], 8);
    // base wood/composite
    return vary(rng, [160, 128, 80, 255], 15);
  },

  [BlockType.WATER_TANK]: (x, y, rng) => {
    // steel frame border
    if (x < 2 || x > 13 || y < 2 || y > 13) return rgba(112, 128, 144);
    // gauge circle top-right
    if (Math.abs(x - 12) + Math.abs(y - 3) < 2) return rgba(180, 200, 210);
    // water level line
    if (y === 4 && x > 2 && x < 14) return rgba(80, 150, 220);
    // blue liquid interior
    const depth = y / 16;
    const b: RGBA = [64, 128, 192, 255];
    return vary(rng, [clamp(b[0] - depth * 20), clamp(b[1] - depth * 15), b[2], 255], 10);
  },

  [BlockType.REINFORCED_HULL]: (x, y, rng) => {
    // thick border
    if (x < 1 || x > 14 || y < 1 || y > 14) return rgba(55, 60, 50);
    // bolt rivets at corners
    if ((x === 2 && y === 2) || (x === 13 && y === 2) || (x === 2 && y === 13) || (x === 13 && y === 13)) {
      return rgba(80, 90, 75);
    }
    // diamond cross-hatch pattern
    if ((x + y) % 4 === 0 || (x - y + 16) % 4 === 0) return rgba(80, 88, 72);
    // base
    return vary(rng, [96, 104, 88, 255], 12);
  },
};

/*──────────────────────────────────────────────────────────
 * ATLAS BUILDER
 *────────────────────────────────────────────────────────*/

function generateBlockTexture(blockType: number): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_SIZE;
  canvas.height = TEX_SIZE;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(TEX_SIZE, TEX_SIZE);
  const gen = generators[blockType];
  const rng = mulberry32(blockType * 7919 + 1337);

  for (let y = 0; y < TEX_SIZE; y++) {
    for (let x = 0; x < TEX_SIZE; x++) {
      const px = gen ? gen(x, y, rng) : [128, 128, 128, 255] as RGBA;
      const i = (y * TEX_SIZE + x) * 4;
      img.data[i] = px[0];
      img.data[i + 1] = px[1];
      img.data[i + 2] = px[2];
      img.data[i + 3] = px[3];
    }
  }
  return img;
}

export interface AtlasInfo {
  texture: THREE.Texture;
  material: THREE.MeshLambertMaterial;
  /** Get UV coords for a block type. Returns [u0, v0, u1, v1] */
  getUVs(blockType: number): [number, number, number, number];
  blockCount: number;
}

export function buildTextureAtlas(): AtlasInfo {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_SIZE * BLOCK_COUNT;
  canvas.height = TEX_SIZE;
  const ctx = canvas.getContext('2d')!;

  // Fill with black for AIR slot
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let bt = 1; bt < BLOCK_COUNT; bt++) {
    const img = generateBlockTexture(bt);
    ctx.putImageData(img, bt * TEX_SIZE, 0);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;

  const material = new THREE.MeshLambertMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.1,
  });

  return {
    texture,
    material,
    blockCount: BLOCK_COUNT,
    getUVs(blockType: number): [number, number, number, number] {
      const u0 = blockType / BLOCK_COUNT;
      const u1 = (blockType + 1) / BLOCK_COUNT;
      return [u0, 0, u1, 1];
    },
  };
}
