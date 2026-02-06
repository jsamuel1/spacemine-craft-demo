import * as THREE from 'three';
import { World } from '../world/World';
import { BlockType } from '../types';
import { CHUNK_SIZE } from '../world/Chunk';
import { Inventory } from '../systems/Inventory';
import { InteractiveBlocks } from '../world/InteractiveBlocks';
import { CratePanel } from '../ui/CratePanel';

export class BlockInteraction {
  private world: World;
  private camera: THREE.PerspectiveCamera;
  private highlight: THREE.LineSegments;
  private canvas: HTMLCanvasElement;
  selectedBlock: BlockType = BlockType.BASALT;
  inventory: Inventory | null = null;
  interactive: InteractiveBlocks | null = null;
  cratePanel: CratePanel | null = null;
  private maxDist = 8;
  private interactKey = false;

  constructor(world: World, camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement, scene: THREE.Scene) {
    this.world = world;
    this.camera = camera;
    this.canvas = canvas;

    // Wireframe highlight cube
    const geo = new THREE.BoxGeometry(1.01, 1.01, 1.01);
    const edges = new THREE.EdgesGeometry(geo);
    this.highlight = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
    this.highlight.visible = false;
    scene.add(this.highlight);

    canvas.addEventListener('mousedown', (e) => {
      if (document.pointerLockElement !== canvas) return;
      if (e.button === 0) this.onLeftClick();
      else if (e.button === 2) this.place();
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyO') this.onLeftClick();
      else if (e.code === 'KeyP') this.place();
      else if (e.code === 'KeyF' && this.cratePanel?.visible) { this.cratePanel.close(); e.preventDefault(); }
      else if (e.code === 'KeyF') this.interactKey = true;
    });
    document.addEventListener('keyup', (e) => {
      if (e.code === 'KeyF') this.interactKey = false;
    });
  }

  /** DDA voxel raycast. Returns {hit, pos, normal} */
  private raycast(): { pos: THREE.Vector3; normal: THREE.Vector3 } | null {
    const origin = this.camera.position.clone();
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();

    let x = Math.floor(origin.x), y = Math.floor(origin.y), z = Math.floor(origin.z);
    const stepX = dir.x >= 0 ? 1 : -1;
    const stepY = dir.y >= 0 ? 1 : -1;
    const stepZ = dir.z >= 0 ? 1 : -1;
    const tDeltaX = dir.x !== 0 ? Math.abs(1 / dir.x) : Infinity;
    const tDeltaY = dir.y !== 0 ? Math.abs(1 / dir.y) : Infinity;
    const tDeltaZ = dir.z !== 0 ? Math.abs(1 / dir.z) : Infinity;
    let tMaxX = dir.x !== 0 ? ((dir.x > 0 ? x + 1 - origin.x : origin.x - x) * tDeltaX) : Infinity;
    let tMaxY = dir.y !== 0 ? ((dir.y > 0 ? y + 1 - origin.y : origin.y - y) * tDeltaY) : Infinity;
    let tMaxZ = dir.z !== 0 ? ((dir.z > 0 ? z + 1 - origin.z : origin.z - z) * tDeltaZ) : Infinity;

    const normal = new THREE.Vector3();
    let t = 0;

    for (let i = 0; i < this.maxDist * 3; i++) {
      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) { t = tMaxX; x += stepX; tMaxX += tDeltaX; normal.set(-stepX, 0, 0); }
        else { t = tMaxZ; z += stepZ; tMaxZ += tDeltaZ; normal.set(0, 0, -stepZ); }
      } else {
        if (tMaxY < tMaxZ) { t = tMaxY; y += stepY; tMaxY += tDeltaY; normal.set(0, -stepY, 0); }
        else { t = tMaxZ; z += stepZ; tMaxZ += tDeltaZ; normal.set(0, 0, -stepZ); }
      }
      if (t > this.maxDist) break;
      if (this.world.getBlock(x, y, z) !== BlockType.AIR) {
        return { pos: new THREE.Vector3(x, y, z), normal };
      }
    }
    return null;
  }

  private rebuildAt(wx: number, wy: number, wz: number) {
    const cx = Math.floor(wx / CHUNK_SIZE), cy = Math.floor(wy / CHUNK_SIZE), cz = Math.floor(wz / CHUNK_SIZE);
    this.world.rebuildChunkMesh(cx, cy, cz);
    // Rebuild neighbors if block is on chunk edge
    const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = ((wy % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    if (lx === 0) this.world.rebuildChunkMesh(cx - 1, cy, cz);
    if (lx === CHUNK_SIZE - 1) this.world.rebuildChunkMesh(cx + 1, cy, cz);
    if (ly === 0) this.world.rebuildChunkMesh(cx, cy - 1, cz);
    if (ly === CHUNK_SIZE - 1) this.world.rebuildChunkMesh(cx, cy + 1, cz);
    if (lz === 0) this.world.rebuildChunkMesh(cx, cy, cz - 1);
    if (lz === CHUNK_SIZE - 1) this.world.rebuildChunkMesh(cx, cy, cz + 1);
  }

  private onLeftClick() {
    if (this.interactKey && this.interactive) {
      const hit = this.raycast();
      if (!hit) return;
      const { x, y, z } = hit.pos;
      const block = this.world.getBlock(x, y, z);
      if (block === BlockType.AIRLOCK_DOOR) {
        this.interactive.toggleDoor(x, y, z);
        this.rebuildAt(x, y, z);
      } else if (block === BlockType.STORAGE_CRATE && this.cratePanel) {
        this.cratePanel.open(x, y, z);
      }
      return;
    }
    this.destroy();
  }

  private destroy() {
    const hit = this.raycast();
    if (!hit) return;
    const { x, y, z } = hit.pos;
    const blockType = this.world.getBlock(x, y, z);
    this.world.setBlock(x, y, z, BlockType.AIR);
    this.rebuildAt(x, y, z);
    if (this.inventory && blockType !== BlockType.AIR) this.inventory.add(blockType);
  }

  private place() {
    const hit = this.raycast();
    if (!hit) return;
    if (this.inventory && !this.inventory.remove(this.selectedBlock)) return;
    const px = hit.pos.x + hit.normal.x;
    const py = hit.pos.y + hit.normal.y;
    const pz = hit.pos.z + hit.normal.z;
    // Don't place inside the player
    const cp = this.camera.position;
    if (Math.floor(cp.x) === px && (Math.floor(cp.y) === py || Math.floor(cp.y - 1) === py) && Math.floor(cp.z) === pz) {
      if (this.inventory) this.inventory.add(this.selectedBlock); // refund
      return;
    }
    this.world.setBlock(px, py, pz, this.selectedBlock);
    this.rebuildAt(px, py, pz);
  }

  update() {
    const hit = this.raycast();
    if (hit) {
      this.highlight.visible = true;
      this.highlight.position.set(hit.pos.x + 0.5, hit.pos.y + 0.5, hit.pos.z + 0.5);
    } else {
      this.highlight.visible = false;
    }
  }
}
