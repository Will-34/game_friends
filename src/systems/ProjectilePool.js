/**
 * ProjectilePool.js — Reserva (object pooling) de proyectiles.
 * Los proyectiles nunca se destruyen: se desactivan y se reutilizan.
 */
import { Projectile, PROJECTILE_TEXTURE } from '../entities/Projectile.js';

export class ProjectilePool {
    /**
     * @param {Phaser.Scene} scene
     * @param {{maxSize?: number}} [opts]
     */
    constructor(scene, opts = {}) {
        this.scene = scene;
        this.group = scene.physics.add.group({
            classType: Projectile,
            defaultKey: PROJECTILE_TEXTURE,
            maxSize: opts.maxSize ?? 120,
            runChildUpdate: true,
            allowGravity: false,
        });
    }

    /**
     * Dispara un proyectil. Devuelve null si la reserva está agotada.
     * @param {object} opts { owner, team, damage, lifespanMs }
     */
    fire(x, y, vx, vy, opts) {
        const p = this.group.get(x, y);
        if (!p) return null;
        p.fire(x, y, vx, vy, opts);
        return p;
    }

    /** Número de proyectiles activos (útil para depuración). */
    countActive() {
        return this.group.countActive(true);
    }
}
