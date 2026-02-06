import { Player } from '../player/Player';
import { World } from '../world/World';
import { BlockType } from '../types';

export class Oxygen {
  level = 100;
  maxLevel = 100;
  private depleteRate = 1; // per second

  update(dt: number, player: Player, world: World) {
    // Check if near any solid block (within 2 blocks)
    const px = Math.floor(player.position.x);
    const py = Math.floor(player.position.y);
    const pz = Math.floor(player.position.z);
    let nearBlock = false;
    for (let dx = -2; dx <= 2 && !nearBlock; dx++)
      for (let dy = -2; dy <= 2 && !nearBlock; dy++)
        for (let dz = -2; dz <= 2 && !nearBlock; dz++)
          if (world.getBlock(px + dx, py + dy, pz + dz) !== BlockType.AIR)
            nearBlock = true;

    if (nearBlock && player.velocity.length() < 1) {
      this.level = Math.min(this.maxLevel, this.level + 5 * dt);
    } else {
      this.level = Math.max(0, this.level - this.depleteRate * dt);
    }
  }
}
