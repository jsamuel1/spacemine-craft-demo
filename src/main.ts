import { Engine } from './core/Engine';
import { World } from './world/World';
import { Player } from './player/Player';
import { Controls } from './player/Controls';
import { AsteroidGenerator } from './world/AsteroidGenerator';
import { BlockInteraction } from './player/BlockInteraction';
import { Hotbar } from './ui/Hotbar';
import { Inventory } from './systems/Inventory';
import { InventoryPanel } from './ui/InventoryPanel';
import { TradingPost } from './systems/TradingPost';
import { TradingPostPanel } from './ui/TradingPostPanel';
import { Crafting } from './systems/Crafting';
import { CraftingPanel } from './ui/CraftingPanel';
import { HelpOverlay } from './ui/HelpOverlay';
import { InteractiveBlocks } from './world/InteractiveBlocks';
import { CratePanel } from './ui/CratePanel';
import { Health } from './systems/Health';
import { Oxygen } from './systems/Oxygen';
import { Fuel } from './systems/Fuel';
import { HUD } from './ui/HUD';
import { Persistence } from './systems/Persistence';

const engine = new Engine();
const world = new World(engine.scene);
const interactive = new InteractiveBlocks();
world.interactive = interactive;

// Procedural asteroid belt
world.generator = new AsteroidGenerator(42);
world.generateAll();

// Player & systems
const player = new Player();
const inventory = new Inventory();
const tradingPost = new TradingPost(inventory);
const health = new Health();
const oxygen = new Oxygen();
const fuel = new Fuel();

// Persistence: load saved state if available
const persistence = new Persistence(world, player, inventory, tradingPost, health, oxygen, fuel, interactive);
const loaded = persistence.load();

if (!loaded) {
  // Start player near the first asteroid
  const first = world.generator.asteroids[0];
  player.position.set(first.cx, first.cy + first.radius + 10, first.cz + first.radius + 10);
}

const controls = new Controls(player, engine.camera, engine.renderer.domElement, world);
controls.fuel = fuel;
controls.health = health;
const interaction = new BlockInteraction(world, engine.camera, engine.renderer.domElement, engine.scene);
interaction.inventory = inventory;
interaction.interactive = interactive;
const cratePanel = new CratePanel(inventory, interactive);
interaction.cratePanel = cratePanel;
const hotbar = new Hotbar();
hotbar.setInventory(inventory);
const _inventoryPanel = new InventoryPanel(inventory);
const _tradingPanel = new TradingPostPanel(tradingPost, inventory);
const crafting = new Crafting(inventory);
const _craftingPanel = new CraftingPanel(crafting);
new HelpOverlay();
const hud = new HUD(health, oxygen, fuel, tradingPost);

// Auto-save every 30 seconds
setInterval(() => persistence.save(), 30000);

// Save on page unload
window.addEventListener('beforeunload', () => persistence.save());

// Key bindings: F5 save, F9 load, F8 new belt
document.addEventListener('keydown', (e) => {
  if (e.code === 'F5') {
    e.preventDefault();
    persistence.save();
  } else if (e.code === 'F9') {
    e.preventDefault();
    persistence.load();
  } else if (e.code === 'F8') {
    e.preventDefault();
    Persistence.clearSave();
    location.reload();
  }
});

engine.onUpdate((dt) => {
  controls.update(dt);
  interaction.selectedBlock = hotbar.selectedBlock;
  interaction.update();
  hotbar.render();

  // Update survival systems
  fuel.update(dt, controls.thrusting);
  oxygen.update(dt, player, world);
  if (oxygen.level <= 0) health.damage(5 * dt);
  hud.update();
});
engine.start();
