import { Engine } from './core/Engine';
import { World } from './world/World';
import { Player } from './player/Player';
import { Controls } from './player/Controls';
import { AsteroidGenerator } from './world/AsteroidGenerator';
import { BlockInteraction } from './player/BlockInteraction';
import { Hotbar } from './ui/Hotbar';
import { Inventory } from './systems/Inventory';
import { InventoryPanel } from './ui/InventoryPanel';

const engine = new Engine();
const world = new World(engine.scene);

// Procedural asteroid belt
world.generator = new AsteroidGenerator(42);
world.generateAll();

// Start player near the first asteroid
const first = world.generator.asteroids[0];
const player = new Player();
player.position.set(first.cx, first.cy + first.radius + 10, first.cz + first.radius + 10);

const controls = new Controls(player, engine.camera, engine.renderer.domElement, world);
const inventory = new Inventory();
const interaction = new BlockInteraction(world, engine.camera, engine.renderer.domElement, engine.scene);
interaction.inventory = inventory;
const hotbar = new Hotbar();
hotbar.setInventory(inventory);
const _inventoryPanel = new InventoryPanel(inventory);

engine.onUpdate((dt) => {
  controls.update(dt);
  interaction.selectedBlock = hotbar.selectedBlock;
  interaction.update();
  hotbar.render();
});
engine.start();
