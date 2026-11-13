/**
 * Projectile.js — Proyectil reutilizable (lo gestiona ProjectilePool).
 * Cada arma define su textura, alcance (lifespan), si atraviesa enemigos (pierce) y si crece (llamas).
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
        this.bornAt = 0;
        this.lifespan = 0;
        this.pierce = false;
        this.grow = 1;
        /** Personajes ya alcanzados (para proyectiles que atraviesan) */
        this.hitSet = new Set();
    }

    /**
     * Activa el proyectil desde la reserva.
     * @param {object} opts { owner, team, damage, lifespanMs, tint, texture, pierce, grow }
     */
    fire(x, y, vx, vy, opts = {}) {
        const { owner = null, team = 'neutral', damage = 10, lifespanMs = 1400, tint = null } = opts;
        this.enableBody(true, x, y, true, true);
        this.setTexture(opts.texture && this.scene.textures.exists(opts.texture) ? opts.texture : PROJECTILE_TEXTURE);
        this.setScale(1).setAlpha(1);
        this.body.setSize(this.width, this.height, true);
        this.body.setAllowGravity(false);
        this.setVelocity(vx, vy);
        this.setRotation(Math.atan2(vy, vx));
        this.setDepth(20);
        if (tint !== null) this.setTint(tint);
        else this.clearTint();
        this.owner = owner;
        this.team = team;
        this.damage = damage;
        this.bornAt = this.scene.time.now;
        this.lifespan = lifespanMs;
        this.expireAt = this.bornAt + lifespanMs;
        this.pierce = !!opts.pierce;
        this.grow = opts.grow || 1;
        this.hitSet.clear();
    }

    /** Llamado por el grupo (runChildUpdate). */
    update(time) {
        if (!this.active) return;
        if (this.grow !== 1) {
            // Llamas: crecen y se desvanecen con la distancia
            const t = Phaser.Math.Clamp((time - this.bornAt) / this.lifespan, 0, 1);
            this.setScale(1 + (this.grow - 1) * t);
            this.setAlpha(1 - 0.7 * t);
        }
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
        this.hitSet.clear();
        this.disableBody(true, true);
    }
}
