import { World } from '../world/World';
import { Player } from '../player/Player';
import { Inventory } from './Inventory';
import { TradingPost } from './TradingPost';
import { Health } from './Health';
import { Oxygen } from './Oxygen';
import { Fuel } from './Fuel';
import { InteractiveBlocks } from '../world/InteractiveBlocks';
import { BlockType } from '../types';

const STORAGE_KEY = 'space-minecraft-save';

interface SaveData {
  // Modified chunks only: key -> base64 of Uint8Array
  chunks: Record<string, string>;
  // Asteroid generator seed
  generatorSeed: number;
  // Player
  player: { x: number; y: number; z: number; vx: number; vy: number; vz: number; yaw: number; pitch: number };
  // Systems
  inventory: Record<number, number>;
  credits: number;
  health: number;
  oxygen: number;
  fuel: number;
  // Interactive blocks
  doorStates: [string, boolean][];
  crateInventories: [string, [number, number][]][];
}

function uint8ToBase64(arr: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin);
}

function base64ToUint8(b64: string): Uint8Array {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

export class Persistence {
  constructor(
    private world: World,
    private player: Player,
    private inventory: Inventory,
    private tradingPost: TradingPost,
    private health: Health,
    private oxygen: Oxygen,
    private fuel: Fuel,
    private interactive: InteractiveBlocks,
  ) {}

  save() {
    const chunks: Record<string, string> = {};
    for (const key of this.world.dirty) {
      const chunk = this.world.chunks.get(key);
      if (chunk) chunks[key] = uint8ToBase64(chunk.blocks);
    }

    const p = this.player;
    const inv: Record<number, number> = {};
    for (const [k, v] of this.inventory.getAll()) inv[k] = v;

    const doorStates = Array.from(this.interactive.doorStates.entries());
    const crateInventories: [string, [number, number][]][] = [];
    for (const [k, m] of this.interactive.crateInventories) {
      crateInventories.push([k, Array.from(m.entries())]);
    }

    const data: SaveData = {
      chunks,
      generatorSeed: 42, // default seed; could be dynamic
      player: { x: p.position.x, y: p.position.y, z: p.position.z, vx: p.velocity.x, vy: p.velocity.y, vz: p.velocity.z, yaw: p.yaw, pitch: p.pitch },
      inventory: inv,
      credits: this.tradingPost.credits,
      health: this.health.hp,
      oxygen: this.oxygen.level,
      fuel: this.fuel.level,
      doorStates,
      crateInventories,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log('Game saved');
  }

  load(): boolean {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    try {
      const data: SaveData = JSON.parse(raw);

      // Restore modified chunks over regenerated world
      for (const [key, b64] of Object.entries(data.chunks)) {
        const chunk = this.world.chunks.get(key);
        if (chunk) {
          chunk.blocks.set(base64ToUint8(b64));
          this.world.dirty.add(key);
        }
      }
      this.world.rebuildAllMeshes();

      // Player
      const pp = data.player;
      this.player.position.set(pp.x, pp.y, pp.z);
      this.player.velocity.set(pp.vx, pp.vy, pp.vz);
      this.player.yaw = pp.yaw;
      this.player.pitch = pp.pitch;

      // Inventory: clear and restore
      const allItems = this.inventory.getAll();
      for (const k of Array.from(allItems.keys())) {
        this.inventory.remove(k, allItems.get(k)!);
      }
      for (const [k, v] of Object.entries(data.inventory)) {
        this.inventory.add(Number(k) as BlockType, v);
      }

      // Systems
      this.tradingPost.credits = data.credits;
      this.health.hp = data.health;
      this.oxygen.level = data.oxygen;
      this.fuel.level = data.fuel;

      // Interactive blocks
      this.interactive.doorStates.clear();
      for (const [k, v] of data.doorStates) this.interactive.doorStates.set(k, v);
      this.interactive.crateInventories.clear();
      for (const [k, entries] of data.crateInventories) {
        this.interactive.crateInventories.set(k, new Map(entries.map(([bt, qty]) => [bt as BlockType, qty])));
      }

      console.log('Game loaded');
      return true;
    } catch (e) {
      console.error('Failed to load save:', e);
      return false;
    }
  }

  hasSave(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  static clearSave() {
    localStorage.removeItem(STORAGE_KEY);
    console.log('Save cleared');
  }
}
