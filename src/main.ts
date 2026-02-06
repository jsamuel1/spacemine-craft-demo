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
import { CreditDisplay } from './ui/CreditDisplay';
import { Crafting } from './systems/Crafting';
import { CraftingPanel } from './ui/CraftingPanel';
import { HelpOverlay } from './ui/HelpOverlay';
import { InteractiveBlocks } from './world/InteractiveBlocks';
import { CratePanel } from './ui/CratePanel';

const engine = new Engine();
const world = new World(engine.scene);
const interactive = new InteractiveBlocks();
world.interactive = interactive;

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
interaction.interactive = interactive;
const cratePanel = new CratePanel(inventory, interactive);
interaction.cratePanel = cratePanel;
const hotbar = new Hotbar();
hotbar.setInventory(inventory);
const _inventoryPanel = new InventoryPanel(inventory);
const tradingPost = new TradingPost(inventory);
const _tradingPanel = new TradingPostPanel(tradingPost, inventory);
const creditDisplay = new CreditDisplay(tradingPost);
const crafting = new Crafting(inventory);
const _craftingPanel = new CraftingPanel(crafting);
new HelpOverlay();

engine.onUpdate((dt) => {
  controls.update(dt);
  interaction.selectedBlock = hotbar.selectedBlock;
  interaction.update();
  hotbar.render();
  creditDisplay.update();
});
engine.start();
