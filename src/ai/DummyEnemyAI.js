/**
 * DummyEnemyAI.js — IA PROVISIONAL de enemigo (E1).
 *
 * Es una fuente de acciones más (como el teclado): solo escribe moveX y botones.
 * Comportamiento: patrulla alrededor de su punto de aparición, gira en bordes y paredes;
 * si ve al objetivo (misma altura aproximada y dentro del rango), lo encara y dispara ráfagas.
 * La IA definitiva (máquina de estados, dificultad) llega en E4.
 */
export class DummyEnemyAI {
    /**
     * @param {object} opts
     * @param {() => object|null} opts.getTarget       devuelve el Fighter objetivo
     * @param {Phaser.Tilemaps.TilemapLayer} [opts.groundLayer]  para detectar bordes
     * @param {number} [opts.patrolDistance]           px a cada lado del punto de aparición
     */
    constructor(opts) {
        this.getTarget = opts.getTarget;
        this.groundLayer = opts.groundLayer || null;
        this.patrolDistance = opts.patrolDistance ?? 128;
        this.sightRange = opts.sightRange ?? 440;
        this.verticalTolerance = opts.verticalTolerance ?? 70;
        this.burstMs = opts.burstMs ?? 500;
        this.restMs = opts.restMs ?? 1500;
        this.patrolSpeed = opts.patrolSpeed ?? 0.45; // fracción de la velocidad del personaje
        /** Cada cuánto puede lanzar una granada (0 = nunca). Lo fija la dificultad. */
        this.grenadeEveryMs = opts.grenadeEveryMs ?? 0;
        this.nextGrenadeAt = 0;

        this.self = null;
        this.homeX = 0;
        this.dir = -1;
        this.burstUntil = 0;
        this.nextBurstAt = 0;
    }

    /** Asocia la IA al Fighter que controla. */
    attach(fighter) {
        this.self = fighter;
        this.homeX = fighter.x;
        this.nextBurstAt = 600 + Math.random() * 800;
        this.nextGrenadeAt = 3000 + Math.random() * this.grenadeEveryMs;
    }

    read(raw, time) {
        const me = this.self;
        if (!me || me.dead || !me.body) return;

        const target = this.getTarget();
        if (target && !target.dead) {
            const dx = target.x - me.x;
            const dy = target.y - me.y;
            if (Math.abs(dx) < this.sightRange && Math.abs(dy) < this.verticalTolerance) {
                const want = Math.sign(dx) || 1;
                if (me.facing !== want) {
                    raw.moveX += want; // un paso para girar
                    return;
                }
                if (time >= this.nextBurstAt) {
                    this.burstUntil = time + this.burstMs;
                    this.nextBurstAt = time + this.burstMs + this.restMs + Math.random() * 700;
                }
                if (time < this.burstUntil) raw.buttons.shoot = true;
                // Granada a media distancia (solo si su dificultad lo permite)
                if (this.grenadeEveryMs > 0 && time >= this.nextGrenadeAt && Math.abs(dx) > 120 && Math.abs(dx) < 340) {
                    raw.buttons.grenade = true;
                    this.nextGrenadeAt = time + this.grenadeEveryMs + Math.random() * 3000;
                }
                return;
            }
        }

        // Patrulla
        if (me.x < this.homeX - this.patrolDistance) this.dir = 1;
        else if (me.x > this.homeX + this.patrolDistance) this.dir = -1;
        if (me.body.blocked.left) this.dir = 1;
        else if (me.body.blocked.right) this.dir = -1;
        if (this.groundLayer && me.body.blocked.down && this._edgeAhead(me)) this.dir = -this.dir;

        raw.moveX += this.dir * this.patrolSpeed;
    }

    _edgeAhead(me) {
        const probeX = me.x + this.dir * (me.body.width / 2 + 6);
        const tile = this.groundLayer.getTileAtWorldXY(probeX, me.y + 4);
        return !tile || !tile.collides;
    }
}
