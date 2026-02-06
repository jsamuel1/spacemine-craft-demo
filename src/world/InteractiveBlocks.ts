import { BlockType } from '../types';
import { Inventory } from '../systems/Inventory';

export class InteractiveBlocks {
  /** Airlock door states: key "x,y,z" -> true if open */
  doorStates = new Map<string, boolean>();
  /** Crate inventories: key "x,y,z" -> Map<BlockType, number> */
  crateInventories = new Map<string, Map<BlockType, number>>();

  private key(x: number, y: number, z: number) { return `${x},${y},${z}`; }

  isDoorOpen(x: number, y: number, z: number): boolean {
    return this.doorStates.get(this.key(x, y, z)) === true;
  }

  toggleDoor(x: number, y: number, z: number): boolean {
    const k = this.key(x, y, z);
    const open = !this.isDoorOpen(x, y, z);
    this.doorStates.set(k, open);
    return open;
  }

  getCrateInventory(x: number, y: number, z: number): Map<BlockType, number> {
    const k = this.key(x, y, z);
    let inv = this.crateInventories.get(k);
    if (!inv) { inv = new Map(); this.crateInventories.set(k, inv); }
    return inv;
  }

  /** Returns true if this block type is interactive */
  isInteractive(type: BlockType): boolean {
    return type === BlockType.AIRLOCK_DOOR || type === BlockType.STORAGE_CRATE;
  }

  /** Deposit a block into a crate */
  depositToCrate(x: number, y: number, z: number, type: BlockType, playerInv: Inventory): boolean {
    if (!playerInv.remove(type)) return false;
    const crate = this.getCrateInventory(x, y, z);
    crate.set(type, (crate.get(type) ?? 0) + 1);
    return true;
  }

  /** Withdraw a block from a crate */
  withdrawFromCrate(x: number, y: number, z: number, type: BlockType, playerInv: Inventory): boolean {
    const crate = this.getCrateInventory(x, y, z);
    const qty = crate.get(type) ?? 0;
    if (qty < 1) return false;
    if (qty === 1) crate.delete(type); else crate.set(type, qty - 1);
    playerInv.add(type);
    return true;
  }
}
