#!/usr/bin/env node
/**
 * Texture Generator Script
 * 
 * Generates 16x16 pixel PNG textures for each block type.
 * Uses pure Node.js - writes raw PNG files without external dependencies.
 * 
 * Usage: node scripts/generate-textures.mjs
 * Output: public/textures/<block_name>.png + atlas.png
 * 
 * These textures are also generated at runtime in the browser via TextureAtlas.ts.
 * This script is for previewing, editing, or replacing textures externally.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'textures');
const TEX_SIZE = 16;

// Block types matching src/types/index.ts
const BlockType = {
  AIR: 0, BASALT: 1, IRON_ORE: 2, ICE: 3, NICKEL: 4, REGOLITH: 5,
  STEEL_PLANK: 6, GLASS: 7, AIRLOCK_DOOR: 8, STORAGE_CRATE: 9,
  WATER_TANK: 10, REINFORCED_HULL: 11,
};

const BLOCK_NAMES = {
  [BlockType.BASALT]: 'basalt',
  [BlockType.IRON_ORE]: 'iron_ore',
  [BlockType.ICE]: 'ice',
  [BlockType.NICKEL]: 'nickel',
  [BlockType.REGOLITH]: 'regolith',
  [BlockType.STEEL_PLANK]: 'steel_plank',
  [BlockType.GLASS]: 'glass',
  [BlockType.AIRLOCK_DOOR]: 'airlock_door',
  [BlockType.STORAGE_CRATE]: 'storage_crate',
  [BlockType.WATER_TANK]: 'water_tank',
  [BlockType.REINFORCED_HULL]: 'reinforced_hull',
};

const BLOCK_COUNT = 12;

/*──────────────────────────────────────────────────────────
 * TEXTURE PROMPTS (for AI image generation or artist reference)
 *────────────────────────────────────────────────────────*/

const TEXTURE_PROMPTS = {
  basalt: `Dark volcanic basalt rock texture, 16x16 pixels. Deep charcoal grey base (#3A3A42) with subtle darker cracks and fissures. Occasional tiny lighter grey mineral flecks. Rough, igneous rock appearance. Pixel art style, top-down cubic game block face.`,

  iron_ore: `Iron ore embedded in dark rock, 16x16 pixels. Dark grey-brown stone base (#5A4030) with 3-5 irregular rust-orange ore veins/clusters (#C06830). Ore patches should be 2-4 pixels each, scattered asymmetrically. Pixel art style, cubic voxel game block face.`,

  ice: `Space ice / frozen volatile block, 16x16 pixels. Pale blue-white crystalline surface (#B0D8F0) with translucent lighter streaks (#D8F0FF). Subtle crack lines in slightly darker blue. Faint sparkle highlights. Pixel art style, cubic voxel game block face.`,

  nickel: `Nickel ore deposit in rock, 16x16 pixels. Medium grey-green stone base (#6A7060) with silvery-green metallic nodules (#90A880). 2-4 pixel metallic clusters with subtle shine highlights. Pixel art style, cubic voxel game block face.`,

  regolith: `Lunar/asteroid regolith surface, 16x16 pixels. Dusty grey-brown (#8A7A68) with fine granular noise texture. Tiny darker pebble spots and lighter dust patches. Powdery, loose soil look. Pixel art style, cubic voxel game block face.`,

  steel_plank: `Brushed steel plank / panel, 16x16 pixels. Metallic blue-grey (#8090A0) with horizontal brushed-metal streaks. Thin darker border lines (1px) on top and bottom edges suggesting panel seams. 2 small rivet dots near corners. Industrial space station look. Pixel art style, cubic voxel game block face.`,

  glass: `Space station glass/viewport block, 16x16 pixels. Very light blue-white semi-transparent (#D0E8F8) with thin frame border (2px, darker grey-blue). Subtle diagonal highlight streak across center. Clean, see-through appearance. Pixel art style, cubic voxel game block face.`,

  airlock_door: `Heavy airlock door panel, 16x16 pixels. Dark gunmetal grey (#5A6068) with a central vertical seam line. Yellow-black hazard stripe across top 2 rows. Small red/green indicator light pixel at center-right. Reinforced industrial look with subtle panel lines. Pixel art style, cubic voxel game block face.`,

  storage_crate: `Cargo storage crate, 16x16 pixels. Warm brown-tan wooden/composite panels (#A08050) with darker brown border frame (2px). Cross-brace pattern (X) in slightly darker shade across face. Small label/stencil marking area (lighter rectangle) near bottom. Pixel art style, cubic voxel game block face.`,

  water_tank: `Water storage tank block, 16x16 pixels. Steel grey outer frame/border (#708090, 2px border) with blue liquid interior (#4080C0). Subtle horizontal water level line 3/4 up. Small gauge/valve circle near top-right corner. Pixel art style, cubic voxel game block face.`,

  reinforced_hull: `Reinforced hull plating, 16x16 pixels. Dark olive-grey (#606858) with diamond/cross-hatch reinforcement pattern. 4 bolt/rivet dots near corners. Thicker border lines than steel plank. Heavy-duty armored appearance. Pixel art style, cubic voxel game block face.`,
};

/*──────────────────────────────────────────────────────────
 * PROCEDURAL GENERATION (mirrors TextureAtlas.ts)
 *────────────────────────────────────────────────────────*/

function mulberry32(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const clamp = (v, lo = 0, hi = 255) => Math.max(lo, Math.min(hi, Math.round(v)));
const rgba = (r, g, b, a = 255) => [r, g, b, a];
const vary = (rng, base, amt) => [
  clamp(base[0] + (rng() - 0.5) * amt),
  clamp(base[1] + (rng() - 0.5) * amt),
  clamp(base[2] + (rng() - 0.5) * amt),
  base[3] ?? 255,
];

const generators = {
  [BlockType.BASALT]: (x, y, rng) => {
    const base = [58, 58, 66, 255];
    const v = vary(rng, base, 20);
    if ((x + y * 3) % 7 === 0) return rgba(v[0] - 20, v[1] - 20, v[2] - 18);
    if (rng() > 0.93) return rgba(v[0] + 30, v[1] + 28, v[2] + 35);
    return v;
  },
  [BlockType.IRON_ORE]: (x, y, rng) => {
    const base = [90, 64, 48, 255];
    const v = vary(rng, base, 18);
    const d1 = Math.abs(x - 4) + Math.abs(y - 5);
    const d2 = Math.abs(x - 11) + Math.abs(y - 10);
    const d3 = Math.abs(x - 7) + Math.abs(y - 13);
    if (d1 < 3 || d2 < 2 || d3 < 2) return vary(rng, [192, 104, 48, 255], 20);
    return v;
  },
  [BlockType.ICE]: (x, y, rng) => {
    const base = [176, 216, 240, 255];
    const v = vary(rng, base, 12);
    if ((x === 5 && y > 3 && y < 12) || (y === 8 && x > 2 && x < 10)) return rgba(v[0] - 25, v[1] - 20, v[2] - 10);
    if (Math.abs(x - y) < 2) return rgba(clamp(v[0] + 30), clamp(v[1] + 25), clamp(v[2] + 15));
    if (rng() > 0.96) return rgba(255, 255, 255);
    return v;
  },
  [BlockType.NICKEL]: (x, y, rng) => {
    const base = [106, 112, 96, 255];
    const v = vary(rng, base, 16);
    const d1 = Math.abs(x - 6) + Math.abs(y - 4);
    const d2 = Math.abs(x - 12) + Math.abs(y - 11);
    if (d1 < 3 || d2 < 2) {
      const n = vary(rng, [144, 168, 128, 255], 15);
      if (d1 === 0 || d2 === 0) return rgba(clamp(n[0] + 40), clamp(n[1] + 40), clamp(n[2] + 30));
      return n;
    }
    return v;
  },
  [BlockType.REGOLITH]: (x, y, rng) => {
    const v = vary(rng, [138, 122, 104, 255], 25);
    if (rng() > 0.9) return rgba(v[0] - 30, v[1] - 28, v[2] - 25);
    if (rng() > 0.92) return rgba(clamp(v[0] + 25), clamp(v[1] + 22), clamp(v[2] + 20));
    return v;
  },
  [BlockType.STEEL_PLANK]: (x, y, rng) => {
    if (y === 0 || y === 15) return rgba(70, 78, 88);
    if (x === 0 || x === 15) return rgba(90, 100, 110);
    const s = vary(rng, [128, 144, 160, 255], 8);
    if (y % 3 === 0) { s[0] += 10; s[1] += 10; s[2] += 12; }
    if ((x === 2 && y === 2) || (x === 13 && y === 2) || (x === 2 && y === 13) || (x === 13 && y === 13)) return rgba(60, 68, 78);
    return [clamp(s[0]), clamp(s[1]), clamp(s[2]), 255];
  },
  [BlockType.GLASS]: (x, y, rng) => {
    if (x < 2 || x > 13 || y < 2 || y > 13) return rgba(100, 115, 135);
    const v = vary(rng, [208, 232, 248, 220], 6);
    if (Math.abs(x - y - 2) < 2) return [clamp(v[0] + 20), clamp(v[1] + 15), clamp(v[2] + 10), 230];
    return v;
  },
  [BlockType.AIRLOCK_DOOR]: (x, y, rng) => {
    if (y < 2) return (x + y) % 4 < 2 ? rgba(200, 180, 30) : rgba(40, 40, 40);
    if (x === 7 || x === 8) return rgba(45, 50, 55);
    if (x === 12 && y === 7) return rgba(40, 200, 60);
    if (x === 12 && y === 8) return rgba(200, 50, 40);
    const v = vary(rng, [90, 96, 104, 255], 10);
    if (y === 5 || y === 10) return rgba(v[0] - 15, v[1] - 15, v[2] - 12);
    return v;
  },
  [BlockType.STORAGE_CRATE]: (x, y, rng) => {
    if (x < 2 || x > 13 || y < 2 || y > 13) return rgba(100, 75, 40);
    const dx = x - 7.5, dy = y - 7.5;
    if (Math.abs(Math.abs(dx) - Math.abs(dy)) < 1.2) return rgba(130, 95, 55);
    if (x > 4 && x < 12 && y > 10 && y < 14) return vary(rng, [180, 165, 130, 255], 8);
    return vary(rng, [160, 128, 80, 255], 15);
  },
  [BlockType.WATER_TANK]: (x, y, rng) => {
    if (x < 2 || x > 13 || y < 2 || y > 13) return rgba(112, 128, 144);
    if (Math.abs(x - 12) + Math.abs(y - 3) < 2) return rgba(180, 200, 210);
    if (y === 4 && x > 2 && x < 14) return rgba(80, 150, 220);
    const depth = y / 16;
    return vary(rng, [clamp(64 - depth * 20), clamp(128 - depth * 15), 192, 255], 10);
  },
  [BlockType.REINFORCED_HULL]: (x, y, rng) => {
    if (x < 1 || x > 14 || y < 1 || y > 14) return rgba(55, 60, 50);
    if ((x === 2 && y === 2) || (x === 13 && y === 2) || (x === 2 && y === 13) || (x === 13 && y === 13)) return rgba(80, 90, 75);
    if ((x + y) % 4 === 0 || (x - y + 16) % 4 === 0) return rgba(80, 88, 72);
    return vary(rng, [96, 104, 88, 255], 12);
  },
};

/*──────────────────────────────────────────────────────────
 * MINIMAL PNG ENCODER (no dependencies)
 *────────────────────────────────────────────────────────*/

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
  }
  return (crc ^ -1) >>> 0;
}

function adler32(buf) {
  let a = 1, b = 0;
  for (let i = 0; i < buf.length; i++) {
    a = (a + buf[i]) % 65521;
    b = (b + a) % 65521;
  }
  return (b << 16) | a;
}

function deflateStore(data) {
  // Store blocks (no compression) - simple but works for tiny 16x16 images
  const blocks = [];
  const BLOCK_SIZE = 65535;
  for (let i = 0; i < data.length; i += BLOCK_SIZE) {
    const chunk = data.subarray(i, Math.min(i + BLOCK_SIZE, data.length));
    const last = i + BLOCK_SIZE >= data.length ? 1 : 0;
    const header = Buffer.alloc(5);
    header[0] = last;
    header.writeUInt16LE(chunk.length, 1);
    header.writeUInt16LE(chunk.length ^ 0xFFFF, 3);
    blocks.push(header, chunk);
  }
  return Buffer.concat(blocks);
}

function zlibWrap(data) {
  const raw = deflateStore(data);
  const adler = adler32(data);
  const header = Buffer.from([0x78, 0x01]); // zlib header (no compression)
  const checksum = Buffer.alloc(4);
  checksum[0] = (adler >>> 24) & 0xFF;
  checksum[1] = (adler >>> 16) & 0xFF;
  checksum[2] = (adler >>> 8) & 0xFF;
  checksum[3] = adler & 0xFF;
  return Buffer.concat([header, raw, checksum]);
}

function encodePNG(width, height, rgba) {
  // Build raw scanlines with filter byte 0 (None) per row
  const rowBytes = width * 4 + 1;
  const raw = Buffer.alloc(height * rowBytes);
  for (let y = 0; y < height; y++) {
    raw[y * rowBytes] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const si = (y * width + x) * 4;
      const di = y * rowBytes + 1 + x * 4;
      raw[di] = rgba[si];
      raw[di + 1] = rgba[si + 1];
      raw[di + 2] = rgba[si + 2];
      raw[di + 3] = rgba[si + 3];
    }
  }

  const compressed = zlibWrap(raw);

  function pngChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeData = Buffer.concat([Buffer.from(type), data]);
    const c = crc32(typeData);
    const crcBuf = Buffer.alloc(4);
    crcBuf[0] = (c >>> 24) & 0xFF;
    crcBuf[1] = (c >>> 16) & 0xFF;
    crcBuf[2] = (c >>> 8) & 0xFF;
    crcBuf[3] = c & 0xFF;
    return Buffer.concat([len, typeData, crcBuf]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/*──────────────────────────────────────────────────────────
 * GENERATE
 *────────────────────────────────────────────────────────*/

function generateTexture(blockType) {
  const gen = generators[blockType];
  if (!gen) return null;
  const rng = mulberry32(blockType * 7919 + 1337);
  const pixels = new Uint8Array(TEX_SIZE * TEX_SIZE * 4);
  for (let y = 0; y < TEX_SIZE; y++) {
    for (let x = 0; x < TEX_SIZE; x++) {
      const px = gen(x, y, rng);
      const i = (y * TEX_SIZE + x) * 4;
      pixels[i] = clamp(px[0]);
      pixels[i + 1] = clamp(px[1]);
      pixels[i + 2] = clamp(px[2]);
      pixels[i + 3] = clamp(px[3] ?? 255);
    }
  }
  return pixels;
}

// Main
mkdirSync(OUT_DIR, { recursive: true });

console.log('🎨 Generating space block textures...\n');
console.log('Texture Prompts (for AI image generation):');
console.log('═'.repeat(60));

// Generate individual textures
for (const [bt, name] of Object.entries(BLOCK_NAMES)) {
  const blockType = Number(bt);
  console.log(`\n▸ ${name.toUpperCase()}`);
  console.log(`  ${TEXTURE_PROMPTS[name]}\n`);

  const pixels = generateTexture(blockType);
  if (!pixels) continue;

  const png = encodePNG(TEX_SIZE, TEX_SIZE, pixels);
  const path = join(OUT_DIR, `${name}.png`);
  writeFileSync(path, png);
  console.log(`  ✓ Written: textures/${name}.png (${png.length} bytes)`);
}

// Generate atlas (all blocks in a row)
console.log('\n' + '═'.repeat(60));
console.log('Generating texture atlas...');

const atlasWidth = TEX_SIZE * BLOCK_COUNT;
const atlasPixels = new Uint8Array(atlasWidth * TEX_SIZE * 4);

for (let bt = 1; bt < BLOCK_COUNT; bt++) {
  const pixels = generateTexture(bt);
  if (!pixels) continue;
  for (let y = 0; y < TEX_SIZE; y++) {
    for (let x = 0; x < TEX_SIZE; x++) {
      const si = (y * TEX_SIZE + x) * 4;
      const di = (y * atlasWidth + bt * TEX_SIZE + x) * 4;
      atlasPixels[di] = pixels[si];
      atlasPixels[di + 1] = pixels[si + 1];
      atlasPixels[di + 2] = pixels[si + 2];
      atlasPixels[di + 3] = pixels[si + 3];
    }
  }
}

const atlasPng = encodePNG(atlasWidth, TEX_SIZE, atlasPixels);
writeFileSync(join(OUT_DIR, 'atlas.png'), atlasPng);
console.log(`✓ Written: textures/atlas.png (${atlasPng.length} bytes)`);

// Write prompts to a text file for reference
let promptsText = 'TEXTURE GENERATION PROMPTS\n';
promptsText += 'Use these with AI image generators (DALL-E, Midjourney, Stable Diffusion)\n';
promptsText += 'to create replacement textures. Output should be 16x16 PNG with transparency.\n\n';
for (const [name, prompt] of Object.entries(TEXTURE_PROMPTS)) {
  promptsText += `=== ${name.toUpperCase()} ===\n${prompt}\n\n`;
}
writeFileSync(join(OUT_DIR, 'PROMPTS.txt'), promptsText);
console.log(`✓ Written: textures/PROMPTS.txt`);

console.log('\n🚀 Done! Textures generated in public/textures/');
console.log('   Replace any PNG with a custom 16x16 texture and rebuild.');
