import * as THREE from 'three';
import { Chunk, CHUNK_SIZE } from './Chunk';
import { BlockType } from '../types';
import { InteractiveBlocks } from './InteractiveBlocks';
import { AtlasInfo } from './TextureAtlas';

const FACES = [
  { dir: [ 1, 0, 0], verts: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]] },
  { dir: [-1, 0, 0], verts: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]] },
  { dir: [ 0, 1, 0], verts: [[0,1,0],[0,1,1],[1,1,1],[1,1,0]] },
  { dir: [ 0,-1, 0], verts: [[0,0,1],[0,0,0],[1,0,0],[1,0,1]] },
  { dir: [ 0, 0, 1], verts: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]] },
  { dir: [ 0, 0,-1], verts: [[1,0,0],[0,0,0],[0,1,0],[1,1,0]] },
];

const SLAB_T = 0.2;
const SLAB_FACES = [
  { dir: [ 1, 0, 0], verts: [[SLAB_T,0,0],[SLAB_T,1,0],[SLAB_T,1,1],[SLAB_T,0,1]] },
  { dir: [-1, 0, 0], verts: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]] },
  { dir: [ 0, 1, 0], verts: [[0,1,0],[0,1,1],[SLAB_T,1,1],[SLAB_T,1,0]] },
  { dir: [ 0,-1, 0], verts: [[0,0,1],[0,0,0],[SLAB_T,0,0],[SLAB_T,0,1]] },
  { dir: [ 0, 0, 1], verts: [[0,0,1],[SLAB_T,0,1],[SLAB_T,1,1],[0,1,1]] },
  { dir: [ 0, 0,-1], verts: [[SLAB_T,0,0],[0,0,0],[0,1,0],[SLAB_T,1,0]] },
];

// UV corners for a quad: bottom-left, bottom-right, top-right, top-left
const UV_CORNERS: [number, number][] = [[0,0],[1,0],[1,1],[0,1]];

export function buildChunkMesh(
  chunk: Chunk,
  getNeighborBlock: (x: number, y: number, z: number) => BlockType,
  chunkX = 0, chunkY = 0, chunkZ = 0,
  interactive?: InteractiveBlocks,
  atlas?: AtlasInfo
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let z = 0; z < CHUNK_SIZE; z++) {
    for (let y = 0; y < CHUNK_SIZE; y++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const block = chunk.get(x, y, z);
        if (block === BlockType.AIR) continue;

        const isOpenDoor = block === BlockType.AIRLOCK_DOOR && interactive?.isDoorOpen(
          chunkX * CHUNK_SIZE + x, chunkY * CHUNK_SIZE + y, chunkZ * CHUNK_SIZE + z
        );
        const faceset = isOpenDoor ? SLAB_FACES : FACES;

        // Get UVs for this block type from atlas
        const [u0, v0, u1, v1] = atlas ? atlas.getUVs(block) : [0, 0, 1, 1];

        for (const face of faceset) {
          const nx = x + face.dir[0], ny = y + face.dir[1], nz = z + face.dir[2];
          const neighbor = (nx >= 0 && nx < CHUNK_SIZE && ny >= 0 && ny < CHUNK_SIZE && nz >= 0 && nz < CHUNK_SIZE)
            ? chunk.get(nx, ny, nz)
            : getNeighborBlock(nx, ny, nz);

          if (!isOpenDoor && neighbor !== BlockType.AIR) continue;

          const vi = positions.length / 3;
          for (let i = 0; i < face.verts.length; i++) {
            const v = face.verts[i];
            positions.push(x + v[0], y + v[1], z + v[2]);
            const [cu, cv] = UV_CORNERS[i];
            uvs.push(u0 + cu * (u1 - u0), v0 + cv * (v1 - v0));
          }
          indices.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3);
        }
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
