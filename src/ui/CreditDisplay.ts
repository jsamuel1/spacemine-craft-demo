import { TradingPost } from '../systems/TradingPost';

export class CreditDisplay {
  private el: HTMLDivElement;
  private trading: TradingPost;

  constructor(trading: TradingPost) {
    this.trading = trading;
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      position: 'fixed', top: '10px', right: '10px', zIndex: '20',
      fontFamily: 'monospace', fontSize: '16px', color: '#0f0',
      background: 'rgba(0,0,0,0.5)', padding: '6px 12px', borderRadius: '4px',
      pointerEvents: 'none',
    });
    document.body.appendChild(this.el);
  }

  update() {
    this.el.textContent = `💰 ${this.trading.credits}¢`;
  }
}
