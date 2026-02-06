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

    // Simple collision: stop if moving into a solid block
    const next = p.position.clone().add(p.velocity.clone().multiplyScalar(dt));
    const nx = Math.floor(next.x), ny = Math.floor(next.y), nz = Math.floor(next.z);
    if (this.world.getBlock(nx, ny, nz) !== BlockType.AIR ||
        this.world.getBlock(nx, Math.floor(next.y - 1.5), nz) !== BlockType.AIR && !p.magneticBoots) {
      // Only zero out velocity components that cause collision
      const testX = p.position.clone(); testX.x = next.x;
      if (this.world.getBlock(Math.floor(testX.x), Math.floor(p.position.y), Math.floor(p.position.z)) !== BlockType.AIR) p.velocity.x = 0;
      const testY = p.position.clone(); testY.y = next.y;
      if (this.world.getBlock(Math.floor(p.position.x), Math.floor(testY.y), Math.floor(p.position.z)) !== BlockType.AIR) p.velocity.y = 0;
      const testZ = p.position.clone(); testZ.z = next.z;
      if (this.world.getBlock(Math.floor(p.position.x), Math.floor(p.position.y), Math.floor(testZ.z)) !== BlockType.AIR) p.velocity.z = 0;
    }

    p.position.add(p.velocity.clone().multiplyScalar(dt));

    // Update camera
    this.camera.position.copy(p.position);
    this.camera.rotation.set(p.pitch, p.yaw, 0, 'YXZ');
  }
}
