import { BlockType } from '../types';
import { Chunk, CHUNK_SIZE } from './Chunk';

export interface AsteroidDef {
  cx: number; cy: number; cz: number; // center in world coords
  radius: number;
  seed: number;
}

// Seeded pseudo-random
function mulberry32(a: number) {
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// 3D value noise with seeded permutation
class Noise3D {
  private perm: Uint8Array;

  constructor(seed: number) {
    const rng = mulberry32(seed);
    this.perm = new Uint8Array(512);
    for (let i = 0; i < 256; i++) this.perm[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = (rng() * (i + 1)) | 0;
      [this.perm[i], this.perm[j]] = [this.perm[j], this.perm[i]];
    }
    this.perm.copyWithin(256, 0, 256);
  }

  private fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
  private lerp(a: number, b: number, t: number) { return a + t * (b - a); }

  private grad(hash: number, x: number, y: number, z: number) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }

  get(x: number, y: number, z: number): number {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y), zf = z - Math.floor(z);
    const u = this.fade(xf), v = this.fade(yf), w = this.fade(zf);
    const p = this.perm;
    const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z;
    const B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;
    return this.lerp(
      this.lerp(
        this.lerp(this.grad(p[AA], xf, yf, zf), this.grad(p[BA], xf - 1, yf, zf), u),
        this.lerp(this.grad(p[AB], xf, yf - 1, zf), this.grad(p[BB], xf - 1, yf - 1, zf), u), v),
      this.lerp(
        this.lerp(this.grad(p[AA + 1], xf, yf, zf - 1), this.grad(p[BA + 1], xf - 1, yf, zf - 1), u),
        this.lerp(this.grad(p[AB + 1], xf, yf - 1, zf - 1), this.grad(p[BB + 1], xf - 1, yf - 1, zf - 1), u), v), w);
  }
}

export class AsteroidGenerator {
  asteroids: AsteroidDef[];
  private noiseCache = new Map<number, Noise3D>();

  constructor(seed = 42) {
    const rng = mulberry32(seed);
    this.asteroids = [];
    const count = 12 + (rng() * 8) | 0; // 12-19 asteroids
    for (let i = 0; i < count; i++) {
      this.asteroids.push({
        cx: ((rng() - 0.5) * 200) | 0,
        cy: ((rng() - 0.5) * 200) | 0,
        cz: ((rng() - 0.5) * 200) | 0,
        radius: 4 + (rng() * 10) | 0, // 4-13
        seed: (rng() * 0x7fffffff) | 0,
      });
    }
  }

  private getNoise(seed: number): Noise3D {
    let n = this.noiseCache.get(seed);
    if (!n) { n = new Noise3D(seed); this.noiseCache.set(seed, n); }
    return n;
  }

  generateChunk(chunk: Chunk, chunkX: number, chunkY: number, chunkZ: number) {
    const wx0 = chunkX * CHUNK_SIZE, wy0 = chunkY * CHUNK_SIZE, wz0 = chunkZ * CHUNK_SIZE;

    for (const ast of this.asteroids) {
      // Quick bounding box check: skip if chunk is too far from asteroid
      const margin = ast.radius + 3;
      if (wx0 + CHUNK_SIZE < ast.cx - margin || wx0 > ast.cx + margin) continue;
      if (wy0 + CHUNK_SIZE < ast.cy - margin || wy0 > ast.cy + margin) continue;
      if (wz0 + CHUNK_SIZE < ast.cz - margin || wz0 > ast.cz + margin) continue;

      const noise = this.getNoise(ast.seed);
      const freq = 0.15;

      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        for (let ly = 0; ly < CHUNK_SIZE; ly++) {
          for (let lx = 0; lx < CHUNK_SIZE; lx++) {
            const wx = wx0 + lx, wy = wy0 + ly, wz = wz0 + lz;
            const dx = wx - ast.cx, dy = wy - ast.cy, dz = wz - ast.cz;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist > ast.radius + 3) continue;

            const n = noise.get(wx * freq, wy * freq, wz * freq);
            const threshold = dist / ast.radius; // 0 at center, 1 at edge
            if (n + (1 - threshold) * 1.2 < 0.5) continue;

            // Already has a block from another asteroid? skip
            if (chunk.get(lx, ly, lz) !== BlockType.AIR) continue;

            // Assign block type by layer + noise
            const n2 = noise.get(wx * 0.3 + 100, wy * 0.3, wz * 0.3 + 100);
            let type: BlockType;
            if (dist > ast.radius * 0.75) {
              type = BlockType.REGOLITH; // outer shell
            } else if (n2 > 0.4) {
              type = BlockType.IRON_ORE;
            } else if (n2 < -0.3) {
              type = BlockType.ICE;
            } else if (n2 < -0.1) {
              type = BlockType.NICKEL;
            } else {
              type = BlockType.BASALT; // core
            }
            chunk.set(lx, ly, lz, type);
          }
        }
      }
    }
  }
}
