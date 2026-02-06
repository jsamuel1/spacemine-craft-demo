import { Engine } from './core/Engine';
import { World } from './world/World';
import { BlockType } from './types';

const engine = new Engine();
const world = new World(engine.scene);

// Test asteroid: rough sphere of basalt with iron_ore patches
const center = { x: 8, y: 8, z: 8 };
const radius = 7;
for (let z = 0; z < 16; z++) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const dx = x - center.x, dy = y - center.y, dz = z - center.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < radius + (Math.sin(x * 1.3) * Math.cos(z * 1.7) * 1.5)) {
        const type = (Math.sin(x * 3.1 + z * 2.7) > 0.6) ? BlockType.IRON_ORE : BlockType.BASALT;
        world.setBlock(x, y, z, type);
      }
    }
  }
}
world.rebuildAllMeshes();

engine.camera.position.set(8, 20, 30);
engine.camera.lookAt(8, 8, 8);
engine.start();
