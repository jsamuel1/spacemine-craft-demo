export class HelpOverlay {
  private el: HTMLDivElement;
  get visible() { return this.el.style.display !== 'none'; }

  constructor() {
    this.el = document.createElement('div');
    this.el.id = 'help-overlay';
    this.el.innerHTML = `
      <h2>Controls</h2>
      <table>
        <tr><td>Mouse</td><td>Look around</td></tr>
        <tr><td>W A S D</td><td>Move / Thrust</td></tr>
        <tr><td>Space</td><td>Thrust up</td></tr>
        <tr><td>Shift</td><td>Thrust down</td></tr>
        <tr><td>G</td><td>Toggle magnetic boots</td></tr>
        <tr><td>Left Click / O</td><td>Mine block</td></tr>
        <tr><td>Right Click / P</td><td>Place block</td></tr>
        <tr><td>1-9</td><td>Select hotbar slot</td></tr>
        <tr><td>Scroll Wheel</td><td>Cycle hotbar</td></tr>
        <tr><td>E</td><td>Inventory</td></tr>
        <tr><td>M</td><td>Trading Post</td></tr>
        <tr><td>C</td><td>Crafting Station</td></tr>
        <tr><td>F + Click</td><td>Interact (doors/crates)</td></tr>
        <tr><td>H</td><td>Toggle this help</td></tr>
      </table>
    `;
    Object.assign(this.el.style, {
      display: 'none', position: 'fixed', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.5)',
      color: '#fff', padding: '24px 32px', borderRadius: '8px',
      fontFamily: 'monospace', fontSize: '14px', zIndex: '100',
      border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
    });
    const style = document.createElement('style');
    style.textContent = `
      #help-overlay h2 { margin: 0 0 12px; font-size: 18px; color: #8cf; }
      #help-overlay table { border-collapse: collapse; }
      #help-overlay td { padding: 4px 16px 4px 0; }
      #help-overlay td:first-child { color: #fc0; font-weight: bold; }
    `;
    document.head.appendChild(style);
    document.body.appendChild(this.el);

    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyH') {
        e.preventDefault();
        e.stopPropagation();
        this.el.style.display = this.el.style.display === 'none' ? 'block' : 'none';
      }
    }, true);

    const hint = document.createElement('div');
    Object.assign(hint.style, {
      position: 'fixed', bottom: '8px', right: '12px',
      color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace',
      fontSize: '12px', pointerEvents: 'none', zIndex: '10',
    });
    hint.textContent = 'Press H for help';
    document.body.appendChild(hint);
  }
}
