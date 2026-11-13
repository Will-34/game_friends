/**
 * Grenade.js — Granada reutilizable (la gestiona GrenadePool).
 * Vuela en parábola, rebota en el suelo y explota al cumplir la mecha o al tocar a un enemigo.
 */

/** Texturas genéricas generadas en BootScene. */
export const GRENADE_TEXTURE = 'grenade-generic';
export const EXPLOSION_TEXTURE = 'explosion-generic';

export class Grenade extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y, key = GRENADE_TEXTURE, frame) {
        super(scene, x, y, key, frame);
        this.owner = null;
        this.team = 'neutral';
        this.explodeAt = 0;
    }

    /**
     * @param {object} opts { owner, team, vx, vy, fuseMs, texture, frame }
     */
    launch(x, y, opts) {
        this.enableBody(true, x, y, true, true);
        if (opts.texture) this.setTexture(opts.texture, opts.frame);
        else this.setTexture(GRENADE_TEXTURE);
        this.setDisplaySize(18, 20);
        this.body.setAllowGravity(true);
        this.body.setSize(this.width * 0.6, this.height * 0.6, true);
        this.setBounce(0.35, 0.3);
        this.setDrag(60, 0);
        this.setVelocity(opts.vx, opts.vy);
        this.setAngularVelocity(opts.vx >= 0 ? 540 : -540);
        this.setDepth(21);
        this.owner = opts.owner;
        this.team = opts.team;
        this.explodeAt = this.scene.time.now + (opts.fuseMs ?? 1100);
    }

    kill() {
        this.owner = null;
        this.setAngularVelocity(0);
        this.disableBody(true, true);
    }
}
