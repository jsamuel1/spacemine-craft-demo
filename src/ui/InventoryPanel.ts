import { BlockType } from '../types';
import { BLOCK_DEFS } from '../world/BlockDefs';
import { Inventory } from '../systems/Inventory';

export class InventoryPanel {
  private el: HTMLDivElement;
  private inventory: Inventory;
  visible = false;

  constructor(inventory: Inventory) {
    this.inventory = inventory;
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.8)', display: 'none', zIndex: '50',
      justifyContent: 'center', alignItems: 'center', fontFamily: 'monospace', color: '#fff',
    });
    document.body.appendChild(this.el);

    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyE') { this.toggle(); e.preventDefault(); }
    });
  }

  private toggle() {
    this.visible = !this.visible;
    this.el.style.display = this.visible ? 'flex' : 'none';
    if (this.visible) this.render();
  }

  private render() {
    let html = '<div style="background:#222;padding:20px;border:1px solid #555;border-radius:8px;max-width:500px">';
    html += '<h2 style="margin:0 0 12px;text-align:center">Inventory</h2><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">';

    for (const [typeVal, def] of Object.entries(BLOCK_DEFS)) {
      const type = Number(typeVal) as BlockType;
      if (type === BlockType.AIR) continue;
      const qty = this.inventory.get(type);
      const [r, g, b] = def.color;
      html += `<div style="background:rgba(255,255,255,0.1);padding:8px;border-radius:4px;text-align:center">
        <div style="width:30px;height:30px;margin:0 auto 4px;background:rgb(${r*255|0},${g*255|0},${b*255|0});border-radius:3px"></div>
        <div style="font-size:10px">${def.name}</div>
        <div style="font-size:14px;font-weight:bold">${qty}</div>
      </div>`;
    }

    html += '</div></div>';
    this.el.innerHTML = html;
  }
}
