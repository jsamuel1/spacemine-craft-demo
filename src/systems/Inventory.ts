import { BlockType } from '../types';

export class Inventory {
  private items = new Map<BlockType, number>();

  constructor() {
    // Space starter kit
    this.items.set(BlockType.BASALT, 64);
    this.items.set(BlockType.STEEL_PLANK, 32);
    this.items.set(BlockType.GLASS, 16);
    this.items.set(BlockType.AIRLOCK_DOOR, 8);
    this.items.set(BlockType.STORAGE_CRATE, 4);
  }

  get(type: BlockType): number {
    return this.items.get(type) ?? 0;
  }

  add(type: BlockType, count = 1) {
    this.items.set(type, this.get(type) + count);
  }

  remove(type: BlockType, count = 1): boolean {
    const cur = this.get(type);
    if (cur < count) return false;
    const next = cur - count;
    if (next === 0) this.items.delete(type);
    else this.items.set(type, next);
    return true;
  }

  getAll(): Map<BlockType, number> {
    return this.items;
  }
}
