/**
 * GrenadePool.js — Reserva de granadas (object pooling) y explosiones con daño en área.
 */
import { Grenade, EXPLOSION_TEXTURE } from '../entities/Grenade.js';
import { effectsKey } from './ContentLoader.js';
import { CharacterRoleManager } from './CharacterRoleManager.js';
import { audio } from './AudioManager.js';

export const GRENADE_CONFIG = Object.freeze({
    speedX: 300,
    speedY: -380,
    fuseMs: 1100,
    radius: 85,
    maxDamage: 45,
    minDamage: 15,
});

export class GrenadePool {
    /**
     * @param {Phaser.Scene} scene
     * @param {() => Array} getTargets  personajes que pueden recibir daño
     */
    constructor(scene, getTargets) {
        this.scene = scene;
        this.getTargets = getTargets;
        this.group = scene.physics.add.group({ classType: Grenade, maxSize: 20, runChildUpdate: false });
        scene.events.on('update', this.update, this);
        scene.events.once('shutdown', () => scene.events.off('update', this.update, this));
    }

    /** Lanza una granada del personaje `owner` hacia `dir` (1 / -1). */
    throw(owner, x, y, dir) {
        const g = this.group.get(x, y);
        if (!g) return null;
        const fx = owner.def.effects;
        const own = fx && fx.frames && fx.frames.grenade !== undefined;
        g.launch(x, y, {
            owner,
            team: owner.team,
            vx: GRENADE_CONFIG.speedX * dir + owner.body.velocity.x * 0.3,
            vy: GRENADE_CONFIG.speedY,
            fuseMs: GRENADE_CONFIG.fuseMs,
            texture: own ? effectsKey(owner.def.id) : null,
            frame: own ? fx.frames.grenade : undefined,
        });
        return g;
    }

    update(time) {
        for (const g of this.group.getChildren()) {
            if (!g.active) continue;
            if (time >= g.explodeAt) {
                this.explode(g);
                continue;
            }
            // Explota al tocar a un personaje hostil
            for (const f of this.getTargets()) {
                if (f.dead || !f.active || !CharacterRoleManager.areHostile(g.team, f.team)) continue;
                if (Math.abs(f.x - g.x) < 22 && g.y > f.y - f.def.body.height && g.y < f.y + 4) {
                    this.explode(g);
                    break;
                }
            }
        }
    }

    explode(g) {
        const { x, y, owner, team } = g;
        const c = GRENADE_CONFIG;
        for (const f of this.getTargets()) {
            if (f.dead || !f.active || !CharacterRoleManager.areHostile(team, f.team)) continue;
            const d = Phaser.Math.Distance.Between(x, y, f.x, f.y - f.def.body.height / 2);
            if (d > c.radius) continue;
            const dmg = c.maxDamage - (c.maxDamage - c.minDamage) * (d / c.radius);
            const mult = owner && owner.active ? owner.buffValue('damageMul') : 1;
            f.takeDamage(dmg * mult, { owner: owner && owner.active ? owner : null, x });
        }
        this.showExplosion(x, y, owner);
        g.kill();
    }

    showExplosion(x, y, owner) {
        const scene = this.scene;
        const fx = owner && owner.def && owner.def.effects;
        const own = fx && fx.frames && fx.frames.explosion !== undefined;
        const img = own
            ? scene.add.image(x, y - 10, effectsKey(owner.def.id), fx.frames.explosion)
            : scene.add.image(x, y - 10, EXPLOSION_TEXTURE);
        img.setDepth(26).setScale(0.6);
        scene.tweens.add({ targets: img, scale: 1.7, alpha: 0, duration: 420, onComplete: () => img.destroy() });
        scene.cameras.main.shake(140, 0.006);
        audio.sfx('explosion');
    }
}
