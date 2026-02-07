import * as THREE from 'three';
import { Chunk, CHUNK_SIZE } from './Chunk';
import { BlockType } from '../types';
import { buildChunkMesh } from './ChunkMesher';
import { AsteroidGenerator } from './AsteroidGenerator';
import { InteractiveBlocks } from './InteractiveBlocks';
import { buildTextureAtlas, AtlasInfo } from './TextureAtlas';

export class World {
  chunks = new Map<string, Chunk>();
  meshes = new Map<string, THREE.Mesh>();
  private scene: THREE.Scene;
  private atlas: AtlasInfo;
  private material: THREE.MeshLambertMaterial;
  private generated = new Set<string>();
  dirty = new Set<string>(); // chunks modified by player
  generator: AsteroidGenerator | null = null;
  interactive: InteractiveBlocks | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.atlas = buildTextureAtlas();
    this.material = this.atlas.material;
  }

  private key(cx: number, cy: number, cz: number) { return `${cx},${cy},${cz}`; }

  getChunk(cx: number, cy: number, cz: number): Chunk {
    const k = this.key(cx, cy, cz);
    let chunk = this.chunks.get(k);
    if (!chunk) {
      chunk = new Chunk();
      this.chunks.set(k, chunk);
    }
    if (this.generator && !this.generated.has(k)) {
      this.generated.add(k);
      this.generator.generateChunk(chunk, cx, cy, cz);
    }
    return chunk;
  }

  getBlock(wx: number, wy: number, wz: number): BlockType {
    const cx = Math.floor(wx / CHUNK_SIZE), cy = Math.floor(wy / CHUNK_SIZE), cz = Math.floor(wz / CHUNK_SIZE);
    const chunk = this.chunks.get(this.key(cx, cy, cz));
    if (!chunk) return BlockType.AIR;
    const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = ((wy % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return chunk.get(lx, ly, lz);
  }

  setBlock(wx: number, wy: number, wz: number, type: BlockType) {
    const cx = Math.floor(wx / CHUNK_SIZE), cy = Math.floor(wy / CHUNK_SIZE), cz = Math.floor(wz / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cy, cz);
    const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = ((wy % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    chunk.set(lx, ly, lz, type);
    this.dirty.add(this.key(cx, cy, cz));
  }

  rebuildChunkMesh(cx: number, cy: number, cz: number) {
    const k = this.key(cx, cy, cz);
    const chunk = this.chunks.get(k);
    if (!chunk) return;

    const old = this.meshes.get(k);
    if (old) { this.scene.remove(old); old.geometry.dispose(); }

    const geo = buildChunkMesh(chunk, (lx, ly, lz) => {
      // Convert local overflow coords to world coords
      const wx = cx * CHUNK_SIZE + lx, wy = cy * CHUNK_SIZE + ly, wz = cz * CHUNK_SIZE + lz;
      return this.getBlock(wx, wy, wz);
    }, cx, cy, cz, this.interactive ?? undefined, this.atlas);

    if (geo.getAttribute('position').count === 0) return;

    const mesh = new THREE.Mesh(geo, this.material);
    mesh.position.set(cx * CHUNK_SIZE, cy * CHUNK_SIZE, cz * CHUNK_SIZE);
    this.scene.add(mesh);
    this.meshes.set(k, mesh);
  }

  rebuildAllMeshes() {
    for (const k of this.chunks.keys()) {
      const [cx, cy, cz] = k.split(',').map(Number);
      this.rebuildChunkMesh(cx, cy, cz);
    }
  }

  /** Generate and mesh all chunks that overlap any asteroid */
  generateAll() {
    if (!this.generator) return;
    for (const ast of this.generator.asteroids) {
      const r = Math.ceil((ast.radius + 3) / CHUNK_SIZE);
      const ccx = Math.floor(ast.cx / CHUNK_SIZE);
      const ccy = Math.floor(ast.cy / CHUNK_SIZE);
      const ccz = Math.floor(ast.cz / CHUNK_SIZE);
      for (let dz = -r; dz <= r; dz++)
        for (let dy = -r; dy <= r; dy++)
          for (let dx = -r; dx <= r; dx++)
            this.getChunk(ccx + dx, ccy + dy, ccz + dz);
    }
    this.rebuildAllMeshes();
  }
}
