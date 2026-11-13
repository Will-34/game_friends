/**
 * Projectile.js — Proyectil reutilizable (lo gestiona ProjectilePool).
 */

/** Textura genérica generada en BootScene. */
export const PROJECTILE_TEXTURE = 'projectile-basic';

export class Projectile extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y, key = PROJECTILE_TEXTURE, frame) {
        super(scene, x, y, key, frame);
        this.owner = null;
        this.team = 'neutral';
        this.damage = 0;
        this.expireAt = 0;
    }

    /** Activa el proyectil desde la reserva. */
    fire(x, y, vx, vy, { owner = null, team = 'neutral', damage = 10, lifespanMs = 1400, tint = null } = {}) {
        this.enableBody(true, x, y, true, true);
        this.body.setAllowGravity(false);
        this.setVelocity(vx, vy);
        this.setRotation(Math.atan2(vy, vx));
        this.setDepth(20);
        if (tint !== null) this.setTint(tint);
        else this.clearTint();
        this.owner = owner;
        this.team = team;
        this.damage = damage;
        this.expireAt = this.scene.time.now + lifespanMs;
    }

    /** Llamado por el grupo (runChildUpdate). */
    update(time) {
        if (!this.active) return;
        const view = this.scene.cameras.main.worldView;
        const margin = 64;
        if (
            time > this.expireAt ||
            this.x < view.x - margin ||
            this.x > view.right + margin ||
            this.y < view.y - margin ||
            this.y > view.bottom + margin
        ) {
            this.kill();
        }
    }

    /** Devuelve el proyectil a la reserva. */
    kill() {
        this.owner = null;
        this.disableBody(true, true);
    }
}
