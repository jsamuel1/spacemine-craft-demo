import * as THREE from 'three';
import { Chunk, CHUNK_SIZE } from './Chunk';
import { BlockType } from '../types';
import { BLOCK_DEFS } from './BlockDefs';
import { InteractiveBlocks } from './InteractiveBlocks';

const FACES = [
  { dir: [ 1, 0, 0], verts: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]] },
  { dir: [-1, 0, 0], verts: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]] },
  { dir: [ 0, 1, 0], verts: [[0,1,0],[0,1,1],[1,1,1],[1,1,0]] },
  { dir: [ 0,-1, 0], verts: [[0,0,1],[0,0,0],[1,0,0],[1,0,1]] },
  { dir: [ 0, 0, 1], verts: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]] },
  { dir: [ 0, 0,-1], verts: [[1,0,0],[0,0,0],[0,1,0],[1,1,0]] },
];

// Thin slab faces for open airlock doors (offset to x=0 side, 0.2 thick)
const SLAB_T = 0.2;
const SLAB_FACES = [
  { dir: [ 1, 0, 0], verts: [[SLAB_T,0,0],[SLAB_T,1,0],[SLAB_T,1,1],[SLAB_T,0,1]] },
  { dir: [-1, 0, 0], verts: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]] },
  { dir: [ 0, 1, 0], verts: [[0,1,0],[0,1,1],[SLAB_T,1,1],[SLAB_T,1,0]] },
  { dir: [ 0,-1, 0], verts: [[0,0,1],[0,0,0],[SLAB_T,0,0],[SLAB_T,0,1]] },
  { dir: [ 0, 0, 1], verts: [[0,0,1],[SLAB_T,0,1],[SLAB_T,1,1],[0,1,1]] },
  { dir: [ 0, 0,-1], verts: [[SLAB_T,0,0],[0,0,0],[0,1,0],[SLAB_T,1,0]] },
];

export function buildChunkMesh(
  chunk: Chunk,
  getNeighborBlock: (x: number, y: number, z: number) => BlockType,
  chunkX = 0, chunkY = 0, chunkZ = 0,
  interactive?: InteractiveBlocks
): THREE.BufferGeometry {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  for (let z = 0; z < CHUNK_SIZE; z++) {
    for (let y = 0; y < CHUNK_SIZE; y++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const block = chunk.get(x, y, z);
        if (block === BlockType.AIR) continue;
        const [r, g, b] = BLOCK_DEFS[block].color;

        // Check if this is an open airlock door
        const isOpenDoor = block === BlockType.AIRLOCK_DOOR && interactive?.isDoorOpen(
          chunkX * CHUNK_SIZE + x, chunkY * CHUNK_SIZE + y, chunkZ * CHUNK_SIZE + z
        );

        const faceset = isOpenDoor ? SLAB_FACES : FACES;

        for (const face of faceset) {
          const nx = x + face.dir[0], ny = y + face.dir[1], nz = z + face.dir[2];
          const neighbor = (nx >= 0 && nx < CHUNK_SIZE && ny >= 0 && ny < CHUNK_SIZE && nz >= 0 && nz < CHUNK_SIZE)
            ? chunk.get(nx, ny, nz)
            : getNeighborBlock(nx, ny, nz);

          // Open doors always render all faces; normal blocks cull against solid neighbors
          if (!isOpenDoor && neighbor !== BlockType.AIR) continue;

          const vi = positions.length / 3;
          for (const v of face.verts) {
            positions.push(x + v[0], y + v[1], z + v[2]);
            colors.push(r, g, b);
          }
          indices.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3);
        }
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
