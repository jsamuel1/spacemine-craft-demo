import { BlockType } from '../types';

export const CHUNK_SIZE = 16;

export class Chunk {
  blocks = new Uint8Array(CHUNK_SIZE ** 3);

  private index(x: number, y: number, z: number) {
    return x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE;
  }

  get(x: number, y: number, z: number): BlockType {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) return BlockType.AIR;
    return this.blocks[this.index(x, y, z)];
  }

  set(x: number, y: number, z: number, type: BlockType) {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) return;
    this.blocks[this.index(x, y, z)] = type;
  }
}
