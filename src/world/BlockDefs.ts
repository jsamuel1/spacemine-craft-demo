import { BlockType } from '../types';

export interface BlockDef {
  name: string;
  color: [number, number, number];
  solid: boolean;
}

export const BLOCK_DEFS: Record<number, BlockDef> = {
  [BlockType.AIR]:           { name: 'Air',            color: [0, 0, 0],          solid: false },
  [BlockType.BASALT]:        { name: 'Basalt',         color: [0.25, 0.25, 0.28], solid: true },
  [BlockType.IRON_ORE]:      { name: 'Iron Ore',       color: [0.55, 0.33, 0.2],  solid: true },
  [BlockType.ICE]:           { name: 'Ice',            color: [0.7, 0.85, 0.95],  solid: true },
  [BlockType.NICKEL]:        { name: 'Nickel',         color: [0.5, 0.55, 0.45],  solid: true },
  [BlockType.REGOLITH]:      { name: 'Regolith',       color: [0.45, 0.4, 0.35],  solid: true },
  [BlockType.STEEL_PLANK]:   { name: 'Steel Plank',    color: [0.55, 0.6, 0.65],  solid: true },
  [BlockType.GLASS]:         { name: 'Glass',          color: [0.8, 0.9, 0.95],   solid: true },
  [BlockType.AIRLOCK_DOOR]:  { name: 'Airlock Door',   color: [0.4, 0.45, 0.5],   solid: true },
  [BlockType.STORAGE_CRATE]: { name: 'Storage Crate',  color: [0.6, 0.5, 0.3],    solid: true },
  [BlockType.WATER_TANK]:    { name: 'Water Tank',     color: [0.3, 0.5, 0.8],    solid: true },
  [BlockType.REINFORCED_HULL]:{ name: 'Reinforced Hull',color: [0.4, 0.42, 0.38],  solid: true },
};
