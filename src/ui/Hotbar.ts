import { BlockType } from '../types';
import { BLOCK_DEFS } from '../world/BlockDefs';
import { Inventory } from '../systems/Inventory';

const SLOTS: BlockType[] = [
  BlockType.BASALT, BlockType.IRON_ORE, BlockType.ICE, BlockType.NICKEL,
  BlockType.REGOLITH, BlockType.STEEL_PLANK, BlockType.GLASS,
  BlockType.AIRLOCK_DOOR, BlockType.STORAGE_CRATE,
];

export class Hotbar {
  activeIndex = 0;
  slots = SLOTS;
  private el: HTMLDivElement;
  private slotEls: HTMLDivElement[] = [];
  private qtyEls: HTMLSpanElement[] = [];
  private inventory: Inventory | null = null;

  get selectedBlock(): BlockType {
    return this.slots[this.activeIndex];
  }

  constructor() {
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      position: 'fixed', bottom: '10px', left: '50%', transform: 'translateX(-50%)',
      display: 'flex', gap: '2px', zIndex: '20', pointerEvents: 'none',
    });
    document.body.appendChild(this.el);

    for (let i = 0; i < 9; i++) {
      const slot = document.createElement('div');
      const def = BLOCK_DEFS[this.slots[i]];
      const [r, g, b] = def.color;
      Object.assign(slot.style, {
        width: '50px', height: '50px', border: '2px solid rgba(255,255,255,0.3)',
        background: `rgb(${r * 255 | 0},${g * 255 | 0},${b * 255 | 0})`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
        fontSize: '8px', color: '#fff', fontFamily: 'monospace', padding: '2px',
        textShadow: '0 0 2px #000', userSelect: 'none', position: 'relative',
      });
      const qtySpan = document.createElement('span');
      Object.assign(qtySpan.style, { position: 'absolute', top: '1px', right: '3px', fontSize: '10px', fontWeight: 'bold' });
      slot.appendChild(qtySpan);
      slot.innerHTML += `<span style="font-size:10px;opacity:0.7">${i + 1}</span><span>${def.name}</span>`;
      this.el.appendChild(slot);
      this.slotEls.push(slot);
      this.qtyEls.push(qtySpan);
    }

    this.render();

    document.addEventListener('keydown', (e) => {
      const n = parseInt(e.key);
      if (n >= 1 && n <= 9) { this.activeIndex = n - 1; this.render(); }
    });
    document.addEventListener('wheel', (e) => {
      this.activeIndex = ((this.activeIndex + Math.sign(e.deltaY)) % 9 + 9) % 9;
      this.render();
    });
  }

  setInventory(inv: Inventory) {
    this.inventory = inv;
  }

  render() {
    this.slotEls.forEach((s, i) => {
      s.style.border = i === this.activeIndex
        ? '2px solid #fff'
        : '2px solid rgba(255,255,255,0.3)';
    });
    if (this.inventory) {
      this.qtyEls.forEach((el, i) => {
        el.textContent = String(this.inventory!.get(this.slots[i]));
      });
    }
  }
}
