import { Health } from '../systems/Health';
import { Oxygen } from '../systems/Oxygen';
import { Fuel } from '../systems/Fuel';
import { TradingPost } from '../systems/TradingPost';

export class HUD {
  private el: HTMLDivElement;
  private heartsEl: HTMLSpanElement;
  private oxygenBar: HTMLDivElement;
  private fuelBar: HTMLDivElement;
  private creditsEl: HTMLSpanElement;

  constructor(
    private health: Health,
    private oxygen: Oxygen,
    private fuel: Fuel,
    private trading: TradingPost,
  ) {
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      position: 'fixed', top: '8px', left: '8px', zIndex: '20',
      fontFamily: 'monospace', fontSize: '14px', color: '#fff',
      pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: '4px',
    });
    document.body.appendChild(this.el);

    // Hearts row
    this.heartsEl = document.createElement('span');
    this.el.appendChild(this.heartsEl);

    // Oxygen bar
    this.oxygenBar = this.makeBar('🫧 O₂', '#4488ff');
    // Fuel bar
    this.fuelBar = this.makeBar('🔥 Fuel', '#ff8800');

    // Credits
    this.creditsEl = document.createElement('span');
    this.creditsEl.style.color = '#0f0';
    this.el.appendChild(this.creditsEl);
  }

  private makeBar(label: string, color: string): HTMLDivElement {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '4px';
    const lbl = document.createElement('span');
    lbl.textContent = label;
    lbl.style.width = '60px';
    lbl.style.fontSize = '12px';
    const outer = document.createElement('div');
    Object.assign(outer.style, {
      width: '120px', height: '10px', background: 'rgba(0,0,0,0.5)',
      borderRadius: '3px', overflow: 'hidden',
    });
    const inner = document.createElement('div');
    Object.assign(inner.style, { width: '100%', height: '100%', background: color });
    outer.appendChild(inner);
    row.appendChild(lbl);
    row.appendChild(outer);
    this.el.appendChild(row);
    return inner;
  }

  update() {
    // Hearts: full ❤️ and empty 🖤
    const full = Math.ceil(this.health.hp / 2);
    const empty = 10 - full;
    this.heartsEl.textContent = '❤️'.repeat(full) + '🖤'.repeat(empty);

    // Bars
    this.oxygenBar.style.width = `${this.oxygen.level}%`;
    this.fuelBar.style.width = `${this.fuel.level}%`;

    // Credits
    this.creditsEl.textContent = `💰 ${this.trading.credits}¢`;
  }
}
