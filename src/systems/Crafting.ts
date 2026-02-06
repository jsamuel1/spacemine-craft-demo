import { BlockType } from '../types';
import { Inventory } from './Inventory';

export interface Recipe {
  inputs: [BlockType, number][];
  outputs: [BlockType, number][];
  label: string;
}

export const RECIPES: Recipe[] = [
  { inputs: [[BlockType.IRON_ORE, 4]], outputs: [[BlockType.STEEL_PLANK, 2]], label: '4 Iron Ore → 2 Steel Plank' },
  { inputs: [[BlockType.ICE, 2]], outputs: [[BlockType.WATER_TANK, 1]], label: '2 Ice → 1 Water Tank' },
  { inputs: [[BlockType.BASALT, 4]], outputs: [[BlockType.REGOLITH, 4]], label: '4 Basalt → 4 Regolith' },
  { inputs: [[BlockType.STEEL_PLANK, 4], [BlockType.GLASS, 2]], outputs: [[BlockType.AIRLOCK_DOOR, 1]], label: '4 Steel Plank + 2 Glass → 1 Airlock Door' },
  { inputs: [[BlockType.STEEL_PLANK, 6]], outputs: [[BlockType.STORAGE_CRATE, 1]], label: '6 Steel Plank → 1 Storage Crate' },
  { inputs: [[BlockType.NICKEL, 2], [BlockType.IRON_ORE, 2]], outputs: [[BlockType.REINFORCED_HULL, 1]], label: '2 Nickel + 2 Iron Ore → 1 Reinforced Hull' },
];

export class Crafting {
  constructor(private inventory: Inventory) {}

  canCraft(recipe: Recipe): boolean {
    return recipe.inputs.every(([type, qty]) => this.inventory.get(type) >= qty);
  }

  craft(recipe: Recipe): boolean {
    if (!this.canCraft(recipe)) return false;
    for (const [type, qty] of recipe.inputs) this.inventory.remove(type, qty);
    for (const [type, qty] of recipe.outputs) this.inventory.add(type, qty);
    return true;
  }
}
