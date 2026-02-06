import { Crafting, RECIPES } from '../systems/Crafting';

export class CraftingPanel {
  private el: HTMLDivElement;
  private crafting: Crafting;
  visible = false;

  constructor(crafting: Crafting) {
    this.crafting = crafting;
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.85)', display: 'none', zIndex: '50',
      justifyContent: 'center', alignItems: 'center', fontFamily: 'monospace', color: '#fff',
    });
    document.body.appendChild(this.el);

    this.el.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('[data-recipe]') as HTMLElement;
      if (!btn) return;
      const idx = Number(btn.dataset.recipe);
      this.crafting.craft(RECIPES[idx]);
      this.render();
    });

    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyC') { this.toggle(); e.preventDefault(); }
    });
  }

  private toggle() {
    this.visible = !this.visible;
    this.el.style.display = this.visible ? 'flex' : 'none';
    if (this.visible) this.render();
  }

  private render() {
    let rows = '';
    RECIPES.forEach((r, i) => {
      const can = this.crafting.canCraft(r);
      rows += `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(255,255,255,${can ? 0.08 : 0.02});border-radius:4px;margin-bottom:4px;opacity:${can ? 1 : 0.4}">
        <span style="font-size:13px">${r.label}</span>
        <button data-recipe="${i}" style="cursor:pointer;padding:4px 12px;border:1px solid #888;background:${can ? '#2a5' : '#444'};color:#fff;border-radius:3px;font-family:monospace">Craft</button>
      </div>`;
    });

    this.el.innerHTML = `<div style="background:#1a1a2e;padding:20px 28px;border:1px solid #555;border-radius:8px;max-width:520px;width:100%">
      <h2 style="margin:0 0 12px;text-align:center;color:#8cf">🔧 Crafting Station</h2>
      ${rows}
      <div style="text-align:center;margin-top:12px;font-size:11px;color:#666">Press C to close</div>
    </div>`;
  }
}
