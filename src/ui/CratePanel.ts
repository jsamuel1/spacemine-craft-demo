import { BlockType } from '../types';
import { BLOCK_DEFS } from '../world/BlockDefs';
import { Inventory } from '../systems/Inventory';
import { InteractiveBlocks } from '../world/InteractiveBlocks';

export class CratePanel {
  private el: HTMLDivElement;
  private inventory: Inventory;
  private interactive: InteractiveBlocks;
  private cratePos: { x: number; y: number; z: number } | null = null;
  visible = false;

  constructor(inventory: Inventory, interactive: InteractiveBlocks) {
    this.inventory = inventory;
    this.interactive = interactive;
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.8)', display: 'none', zIndex: '60',
      justifyContent: 'center', alignItems: 'center', fontFamily: 'monospace', color: '#fff',
    });
    this.el.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.dataset.action;
      const typeStr = target.dataset.type;
      if (!action || !typeStr || !this.cratePos) return;
      const type = Number(typeStr) as BlockType;
      const { x, y, z } = this.cratePos;
      if (action === 'deposit') this.interactive.depositToCrate(x, y, z, type, this.inventory);
      else if (action === 'withdraw') this.interactive.withdrawFromCrate(x, y, z, type, this.inventory);
      this.render();
    });
    document.body.appendChild(this.el);
  }

  open(x: number, y: number, z: number) {
    this.cratePos = { x, y, z };
    this.visible = true;
    this.el.style.display = 'flex';
    this.render();
  }

  close() {
    this.visible = false;
    this.cratePos = null;
    this.el.style.display = 'none';
  }

  private render() {
    if (!this.cratePos) return;
    const { x, y, z } = this.cratePos;
    const crate = this.interactive.getCrateInventory(x, y, z);

    let html = '<div style="background:#222;padding:20px;border:1px solid #555;border-radius:8px;max-width:600px;max-height:80vh;overflow-y:auto">';
    html += '<h2 style="margin:0 0 12px;text-align:center">Storage Crate</h2>';
    html += '<div style="display:flex;gap:20px">';

    // Crate contents
    html += '<div style="flex:1"><h3 style="margin:0 0 8px;font-size:12px">Crate Contents</h3><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px">';
    for (const [type, qty] of crate) {
      const def = BLOCK_DEFS[type];
      if (!def) continue;
      const [r, g, b] = def.color;
      html += `<div style="background:rgba(255,255,255,0.1);padding:6px;border-radius:4px;text-align:center;cursor:pointer" data-action="withdraw" data-type="${type}">
        <div style="width:24px;height:24px;margin:0 auto 2px;background:rgb(${r*255|0},${g*255|0},${b*255|0});border-radius:2px;pointer-events:none"></div>
        <div style="font-size:9px;pointer-events:none">${def.name}</div>
        <div style="font-size:12px;font-weight:bold;pointer-events:none">${qty}</div>
        <div style="font-size:8px;color:#8f8;pointer-events:none">← Take</div>
      </div>`;
    }
    if (crate.size === 0) html += '<div style="color:#888;font-size:11px;grid-column:1/-1;text-align:center">Empty</div>';
    html += '</div></div>';

    // Player inventory
    html += '<div style="flex:1"><h3 style="margin:0 0 8px;font-size:12px">Your Inventory</h3><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px">';
    for (const [type, qty] of this.inventory.getAll()) {
      const def = BLOCK_DEFS[type];
      if (!def || qty <= 0) continue;
      const [r, g, b] = def.color;
      html += `<div style="background:rgba(255,255,255,0.1);padding:6px;border-radius:4px;text-align:center;cursor:pointer" data-action="deposit" data-type="${type}">
        <div style="width:24px;height:24px;margin:0 auto 2px;background:rgb(${r*255|0},${g*255|0},${b*255|0});border-radius:2px;pointer-events:none"></div>
        <div style="font-size:9px;pointer-events:none">${def.name}</div>
        <div style="font-size:12px;font-weight:bold;pointer-events:none">${qty}</div>
        <div style="font-size:8px;color:#f88;pointer-events:none">Store →</div>
      </div>`;
    }
    html += '</div></div></div>';
    html += '<div style="text-align:center;margin-top:12px;font-size:11px;color:#888">Click items to transfer · Press F to close</div>';
    html += '</div>';
    this.el.innerHTML = html;
  }
}
