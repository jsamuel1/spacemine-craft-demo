import * as THREE from 'three';
import { Player } from './Player';
import { World } from '../world/World';
import { BlockType } from '../types';

const THRUST = 20;
const DRAG = 0.97;
const MOUSE_SENS = 0.002;
const BOOT_GRAVITY = 15;

export class Controls {
  private keys = new Set<string>();
  private player: Player;
  private camera: THREE.PerspectiveCamera;
  private canvas: HTMLCanvasElement;
  private world: World;

  constructor(player: Player, camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement, world: World) {
    this.player = player;
    this.camera = camera;
    this.canvas = canvas;
    this.world = world;

    canvas.addEventListener('click', () => canvas.requestPointerLock());
    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement !== canvas) return;
      this.player.yaw -= e.movementX * MOUSE_SENS;
      this.player.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.player.pitch - e.movementY * MOUSE_SENS));
    });
    document.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'KeyG') this.player.magneticBoots = !this.player.magneticBoots;
    });
    document.addEventListener('keyup', (e) => this.keys.delete(e.code));
  }

  /** Check if player AABB at (ex,ey,ez) eye position overlaps any solid block */
  private collidesAt(ex: number, ey: number, ez: number, hw: number, h: number): boolean {
    const minX = Math.floor(ex - hw), maxX = Math.floor(ex + hw);
    const minY = Math.floor(ey - h),  maxY = Math.floor(ey + 0.1);
    const minZ = Math.floor(ez - hw), maxZ = Math.floor(ez + hw);
    for (let bx = minX; bx <= maxX; bx++)
      for (let by = minY; by <= maxY; by++)
        for (let bz = minZ; bz <= maxZ; bz++)
          if (this.world.getBlock(bx, by, bz) !== BlockType.AIR) return true;
    return false;
  }

  update(dt: number) {
    const p = this.player;
    // Camera direction vectors
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(p.pitch, p.yaw, 0, 'YXZ'));
    const right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, p.yaw, 0));
    const up = new THREE.Vector3(0, 1, 0);

    // Thrust input
    const thrust = new THREE.Vector3();
    if (this.keys.has('KeyW')) thrust.add(forward);
    if (this.keys.has('KeyS')) thrust.sub(forward);
    if (this.keys.has('KeyA')) thrust.sub(right);
    if (this.keys.has('KeyD')) thrust.add(right);
    if (this.keys.has('Space')) thrust.add(up);
    if (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) thrust.sub(up);
    if (thrust.length() > 0) thrust.normalize().multiplyScalar(THRUST * dt);
    p.velocity.add(thrust);

    // Magnetic boots: apply gravity toward nearest surface below
    if (p.magneticBoots) {
      const below = Math.floor(p.position.y - 1.6);
      const bx = Math.floor(p.position.x), bz = Math.floor(p.position.z);
      if (this.world.getBlock(bx, below, bz) !== BlockType.AIR) {
        p.velocity.y = Math.max(p.velocity.y, 0);
        p.position.y = Math.max(p.position.y, below + 2.6);
      } else {
        p.velocity.y -= BOOT_GRAVITY * dt;
      }
    }

    // Drag
    p.velocity.multiplyScalar(DRAG);

    // AABB collision: player is 0.6 wide, 1.7 tall (eyes at top)
    const W = 0.3; // half-width
    const H = 1.7; // total height below eye
    const move = p.velocity.clone().multiplyScalar(dt);

    // Check each axis independently
    // X axis
    const nx = p.position.x + move.x;
    if (this.collidesAt(nx, p.position.y, p.position.z, W, H)) {
      move.x = 0; p.velocity.x = 0;
    }
    // Y axis
    const ny = p.position.y + move.y;
    if (this.collidesAt(p.position.x + move.x, ny, p.position.z, W, H)) {
      move.y = 0; p.velocity.y = 0;
    }
    // Z axis
    const nz = p.position.z + move.z;
    if (this.collidesAt(p.position.x + move.x, p.position.y + move.y, nz, W, H)) {
      move.z = 0; p.velocity.z = 0;
    }

    p.position.add(move);

    // Update camera
    this.camera.position.copy(p.position);
    this.camera.rotation.set(p.pitch, p.yaw, 0, 'YXZ');
  }
}
