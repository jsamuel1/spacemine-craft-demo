import { BlockType } from '../types';
import { Inventory } from './Inventory';

interface PriceEntry { buy: number; sell: number }

const PRICES: Partial<Record<BlockType, PriceEntry>> = {
  [BlockType.BASALT]:        { buy: 5,   sell: 2 },
  [BlockType.REGOLITH]:      { buy: 5,   sell: 2 },
  [BlockType.ICE]:           { buy: 8,   sell: 4 },
  [BlockType.NICKEL]:        { buy: 20,  sell: 12 },
  [BlockType.IRON_ORE]:      { buy: 30,  sell: 18 },
  [BlockType.STEEL_PLANK]:   { buy: 40,  sell: 25 },
  [BlockType.GLASS]:         { buy: 35,  sell: 20 },
  [BlockType.AIRLOCK_DOOR]:  { buy: 80,  sell: 50 },
  [BlockType.STORAGE_CRATE]: { buy: 60,  sell: 35 },
};

export class TradingPost {
  credits = 1000;
  private inventory: Inventory;

  constructor(inventory: Inventory) {
    this.inventory = inventory;
  }

  getPrice(type: BlockType): PriceEntry | undefined {
    return PRICES[type];
  }

  getTradeable(): [BlockType, PriceEntry][] {
    return Object.entries(PRICES).map(([k, v]) => [Number(k) as BlockType, v!]);
  }

  buy(type: BlockType, qty: number): boolean {
    const p = PRICES[type];
    if (!p) return false;
    const cost = p.buy * qty;
    if (cost > this.credits) return false;
    this.credits -= cost;
    this.inventory.add(type, qty);
    return true;
  }

  sell(type: BlockType, qty: number): boolean {
    const p = PRICES[type];
    if (!p) return false;
    if (!this.inventory.remove(type, qty)) return false;
    this.credits += p.sell * qty;
    return true;
  }
}
