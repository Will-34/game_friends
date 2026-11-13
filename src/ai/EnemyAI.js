/**
 * EnemyAI.js — IA de los enemigos (E4, H-044). Reemplaza a la IA provisional de E1.
 *
 * Es una fuente de acciones más (como el teclado): solo escribe moveX y botones.
 * Estados:
 *   PATROL  patrulla alrededor de su punto de aparición, gira en bordes y paredes.
 *   ALERT   ha visto al objetivo: lo encara y espera su "tiempo de reacción" (según dificultad).
 *   ATTACK  dispara en ráfagas; si el objetivo está encima, apunta arriba; si está a otra altura
 *           o lejos, lo persigue (salta paredes y plataformas, baja de plataformas) sin alejarse
 *           más de "leash" px de su zona; lanza granadas si su dificultad lo permite.
 * Además mantiene distancia con sus compañeros para no amontonarse y no pisa peligros (tiles con hazard).
 *
 * Con `getLeader` (aliados, E5) no patrulla: sigue al líder (el protagonista) y su zona se mueve con él.
 */

const STATE = Object.freeze({ PATROL: 'patrol', ALERT: 'alert', ATTACK: 'attack' });

export class EnemyAI {
    /**
     * @param {object} opts
     * @param {() => object|null} opts.getTarget       Fighter objetivo (p. ej. el hostil más cercano)
     * @param {() => object|null} [opts.getLeader]     Fighter al que seguir cuando no hay objetivo (aliados)
     * @param {() => Array} [opts.getPeers]            compañeros (para separarse)
     * @param {Phaser.Tilemaps.TilemapLayer} [opts.groundLayer]
     * @param {number} [opts.patrolDistance]           px a cada lado del punto de aparición
     * @param {number} [opts.sightRange]  @param {number} [opts.burstMs]  @param {number} [opts.restMs]
     * @param {number} [opts.reactionMs]  @param {number} [opts.leash]    @param {number} [opts.grenadeEveryMs]
     */
    constructor(opts) {
        this.getTarget = opts.getTarget;
        this.getPeers = opts.getPeers || (() => []);
        this.getLeader = opts.getLeader || null;
        this.followDistance = opts.followDistance ?? 110;
        this.groundLayer = opts.groundLayer || null;
        this.patrolDistance = opts.patrolDistance ?? 128;
        this.sightRange = opts.sightRange ?? 440;
        this.verticalSight = opts.verticalSight ?? 200;
        this.verticalTolerance = opts.verticalTolerance ?? 70;
        this.burstMs = opts.burstMs ?? 500;
        this.restMs = opts.restMs ?? 1500;
        this.reactionMs = opts.reactionMs ?? 450;
        this.leash = opts.leash ?? 360;
        this.preferredRange = opts.preferredRange ?? 260;
        this.patrolSpeed = opts.patrolSpeed ?? 0.45;
        this.chaseSpeed = opts.chaseSpeed ?? 0.75;
        this.grenadeEveryMs = opts.grenadeEveryMs ?? 0;

        this.self = null;
        this.state = STATE.PATROL;
        this.homeX = 0;
        this.dir = -1;
        this.alertUntil = 0;
        this.lastSeenAt = -Infinity;
        this.burstUntil = 0;
        this.nextBurstAt = 0;
        this.nextGrenadeAt = 0;
        this.jumpHoldUntil = 0;
        this.nextJumpAt = 0;
    }

    attach(fighter) {
        this.self = fighter;
        this.homeX = fighter.x;
        this.nextBurstAt = 600 + Math.random() * 800;
        this.nextGrenadeAt = 3000 + Math.random() * this.grenadeEveryMs;
    }

    read(raw, time) {
        const me = this.self;
        if (!me || me.dead || !me.body) return;
        // Mantener pulsado el salto unos ms para que no se corte (salto variable)
        if (time < this.jumpHoldUntil) raw.buttons.jump = true;

        const leader = this.getLeader ? this.getLeader() : null;
        const hasLeader = leader && leader.active && !leader.dead;
        if (hasLeader) this.homeX = leader.x;

        const target = this.getTarget();
        const alive = target && target.active && !target.dead;
        const dx = alive ? target.x - me.x : 0;
        const dy = alive ? target.y - me.y : 0;
        const sees = alive && Math.abs(dx) < this.sightRange && Math.abs(dy) < this.verticalSight;
        if (sees) this.lastSeenAt = time;

        // Transiciones
        if (this.state === STATE.PATROL && sees) {
            this.state = STATE.ALERT;
            this.alertUntil = time + this.reactionMs;
        } else if (this.state !== STATE.PATROL && (!alive || time - this.lastSeenAt > 3000)) {
            this.state = STATE.PATROL;
        } else if (this.state === STATE.ALERT && time >= this.alertUntil) {
            this.state = STATE.ATTACK;
        }

        if (this.state === STATE.PATROL) return hasLeader ? this.follow(raw, time, me, leader) : this.patrol(raw, me);
        const want = Math.sign(dx) || 1;
        if (this.state === STATE.ALERT) {
            if (me.facing !== want) raw.moveX += want; // un paso para girar
            return;
        }
        this.attack(raw, time, me, target, dx, dy, want);
    }

    patrol(raw, me) {
        if (me.x < this.homeX - this.patrolDistance) this.dir = 1;
        else if (me.x > this.homeX + this.patrolDistance) this.dir = -1;
        if (me.body.blocked.left) this.dir = 1;
        else if (me.body.blocked.right) this.dir = -1;
        if (this.groundLayer && me.body.blocked.down && this.edgeAhead(me, this.dir)) this.dir = -this.dir;
        if (this.peerAhead(me, this.dir)) this.dir = -this.dir;
        raw.moveX += this.dir * this.patrolSpeed;
    }

    attack(raw, time, me, target, dx, dy, want) {
        const onGround = me.body.blocked.down;
        const sameLevel = Math.abs(dy) < this.verticalTolerance;
        const above = dy < -this.verticalTolerance;
        const below = dy > this.verticalTolerance;

        // ¿Se puede disparar ahora? (misma altura, o justo encima → apuntar arriba)
        const canShootFlat = sameLevel && Math.abs(dx) < this.sightRange;
        const canShootUp = above && Math.abs(dx) < 50;

        // Movimiento: acercarse si está lejos o a otra altura (sin pasar la correa)
        let move = 0;
        if (!canShootUp && (!sameLevel || Math.abs(dx) > this.preferredRange)) move = want * this.chaseSpeed;
        const fromHome = me.x - this.homeX;
        if (move !== 0 && Math.abs(fromHome) > this.leash && Math.sign(fromHome) === Math.sign(move)) move = 0;
        if (move !== 0 && this.peerAhead(me, Math.sign(move))) move = 0;
        // No caerse de una plataforma salvo para perseguir a alguien que está abajo
        if (move !== 0 && onGround && !below && this.groundLayer && this.edgeAhead(me, Math.sign(move))) move = 0;

        if (move !== 0) raw.moveX += move;
        else if (me.facing !== want && !canShootUp) raw.moveX += want; // girar hacia el objetivo

        // Saltar: pared delante, o el objetivo está arriba y cerca
        if (onGround && time >= this.nextJumpAt) {
            const wall = move !== 0 && (me.body.blocked.left || me.body.blocked.right);
            const climb = above && Math.abs(dx) < 170 && !canShootUp;
            if (wall || climb) {
                this.jumpHoldUntil = time + 260;
                this.nextJumpAt = time + 900 + Math.random() * 600;
                raw.buttons.jump = true;
            }
        }

        // Disparo en ráfagas
        if (canShootFlat || canShootUp) {
            if (time >= this.nextBurstAt) {
                this.burstUntil = time + this.burstMs;
                this.nextBurstAt = time + this.burstMs + this.restMs + Math.random() * 700;
            }
            if (time < this.burstUntil && (canShootUp || me.facing === want)) {
                raw.buttons.shoot = true;
                if (canShootUp) raw.buttons.aimUp = true;
            }
        }

        // Granada a media distancia (solo si su dificultad lo permite)
        if (this.grenadeEveryMs > 0 && sameLevel && time >= this.nextGrenadeAt && Math.abs(dx) > 120 && Math.abs(dx) < 340) {
            raw.buttons.grenade = true;
            this.nextGrenadeAt = time + this.grenadeEveryMs + Math.random() * 3000;
        }
    }

    /** Sigue al líder: se acerca si está lejos y salta paredes, peligros o hacia donde esté él. */
    follow(raw, time, me, leader) {
        const dx = leader.x - me.x;
        const dy = leader.y - me.y;
        if (Math.abs(dx) <= this.followDistance) return;
        const dir = Math.sign(dx);
        if (this.peerAhead(me, dir)) return;
        raw.moveX += dir * this.chaseSpeed;
        const onGround = me.body.blocked.down;
        if (!onGround || time < this.nextJumpAt) return;
        const wall = me.body.blocked.left || me.body.blocked.right;
        const climb = dy < -this.verticalTolerance && Math.abs(dx) < 220;
        const gap = this.groundLayer && this.edgeAhead(me, dir) && dy <= this.verticalTolerance;
        if (wall || climb || gap) {
            this.jumpHoldUntil = time + 260;
            this.nextJumpAt = time + 700 + Math.random() * 400;
            raw.buttons.jump = true;
        }
    }

    /** ¿No hay suelo (o hay un peligro) justo delante? */
    edgeAhead(me, dir) {
        const probeX = me.x + dir * (me.body.width / 2 + 6);
        const tile = this.groundLayer.getTileAtWorldXY(probeX, me.y + 4);
        return !tile || !tile.collides || !!(tile.properties && tile.properties.hazard);
    }

    /** ¿Hay un compañero muy cerca en esa dirección y a la misma altura? */
    peerAhead(me, dir) {
        for (const p of this.getPeers()) {
            if (p === me || p.dead || !p.active) continue;
            const d = (p.x - me.x) * dir;
            if (d > 0 && d < 44 && Math.abs(p.y - me.y) < 30) return true;
        }
        return false;
    }
}
