export class Health {
  hp = 20;
  maxHp = 20;

  damage(amount: number) {
    this.hp = Math.max(0, this.hp - amount);
  }

  heal(amount: number) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  get dead() { return this.hp <= 0; }
}
