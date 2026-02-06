export class Fuel {
  level = 100;
  maxLevel = 100;
  private depleteRate = 15; // per second while thrusting
  private rechargeRate = 3; // per second while idle

  /** Returns true if fuel is available for thrust */
  get canThrust() { return this.level > 0; }

  update(dt: number, thrusting: boolean) {
    if (thrusting && this.level > 0) {
      this.level = Math.max(0, this.level - this.depleteRate * dt);
    } else if (!thrusting) {
      this.level = Math.min(this.maxLevel, this.level + this.rechargeRate * dt);
    }
  }
}
