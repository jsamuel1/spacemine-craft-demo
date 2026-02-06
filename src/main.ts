import { Engine } from './core/Engine';
import { World } from './world/World';
import { Player } from './player/Player';
import { Controls } from './player/Controls';
import { AsteroidGenerator } from './world/AsteroidGenerator';

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

engine.onUpdate((dt) => controls.update(dt));
engine.start();
