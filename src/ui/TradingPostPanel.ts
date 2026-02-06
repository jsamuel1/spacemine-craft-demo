import { BlockType } from '../types';
import { BLOCK_DEFS } from '../world/BlockDefs';
import { TradingPost } from '../systems/TradingPost';
import { Inventory } from '../systems/Inventory';

export class TradingPostPanel {
  private el: HTMLDivElement;
  private trading: TradingPost;
  private inventory: Inventory;
  visible = false;

  constructor(trading: TradingPost, inventory: Inventory) {
    this.trading = trading;
    this.inventory = inventory;

    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.85)', display: 'none', zIndex: '50',
      justifyContent: 'center', alignItems: 'center', fontFamily: 'monospace', color: '#fff',
    });
    document.body.appendChild(this.el);

    this.el.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('[data-action]') as HTMLElement;
      if (!btn) return;
      const action = btn.dataset.action!;
      const type = Number(btn.dataset.type) as BlockType;
      if (action === 'buy') this.trading.buy(type, 1);
      else if (action === 'sell') this.trading.sell(type, 1);
      this.render();
    });

    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyM') { this.toggle(); e.preventDefault(); }
    });
  }

  private toggle() {
    this.visible = !this.visible;
    this.el.style.display = this.visible ? 'flex' : 'none';
    if (this.visible) this.render();
  }

  private render() {
    const items = this.trading.getTradeable();
    let rows = '';
    for (const [type, price] of items) {
      const def = BLOCK_DEFS[type];
      const qty = this.inventory.get(type);
      const [r, g, b] = def.color;
      const canBuy = this.trading.credits >= price.buy;
      const canSell = qty > 0;
      rows += `<tr>
        <td><span style="display:inline-block;width:14px;height:14px;background:rgb(${r*255|0},${g*255|0},${b*255|0});vertical-align:middle;border-radius:2px;margin-right:6px"></span>${def.name}</td>
        <td style="text-align:center">${qty}</td>
        <td style="text-align:right">${price.buy}¢</td>
        <td><button data-action="buy" data-type="${type}" style="cursor:pointer;padding:2px 8px;opacity:${canBuy?1:0.4}">Buy</button></td>
        <td style="text-align:right">${price.sell}¢</td>
        <td><button data-action="sell" data-type="${type}" style="cursor:pointer;padding:2px 8px;opacity:${canSell?1:0.4}">Sell</button></td>
      </tr>`;
    }

    this.el.innerHTML = `<div style="background:#1a1a2e;padding:20px 28px;border:1px solid #555;border-radius:8px;max-width:550px">
      <h2 style="margin:0 0 8px;text-align:center;color:#fc0">⚡ Space Trading Post</h2>
      <div style="text-align:center;margin-bottom:12px;font-size:16px">Credits: <b style="color:#0f0">${this.trading.credits}¢</b></div>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tr style="color:#888"><th style="text-align:left">Item</th><th>Owned</th><th style="text-align:right">Buy</th><th></th><th style="text-align:right">Sell</th><th></th></tr>
        ${rows}
      </table>
      <div style="text-align:center;margin-top:12px;font-size:11px;color:#666">Press M to close</div>
    </div>`;
  }
}
