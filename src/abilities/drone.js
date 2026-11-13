/**
 * drone.js — Invoca un dron que sigue a su dueño y dispara solo al enemigo más cercano.
 *
 * Parámetros: durationMs, fireRateMs, range, damage, bulletSpeed.
 * Usa el efecto "drone" del personaje si su lámina lo trae; si no, una figura genérica.
 */
import { effectsKey } from '../systems/ContentLoader.js';
import { audio } from '../systems/AudioManager.js';

export const DroneAbility = {
    activate(fighter, params) {
        const scene = fighter.scene;
        const p = { durationMs: 6000, fireRateMs: 300, range: 480, damage: 8, bulletSpeed: 560, ...params };
        const fx = fighter.def.effects;
        const own = fx && fx.frames && fx.frames.drone !== undefined;
        const drone = own
            ? scene.add.image(fighter.x, fighter.y - 90, effectsKey(fighter.def.id), fx.frames.drone).setScale(0.7)
            : scene.add.circle(fighter.x, fighter.y - 90, 12, 0x7dffb0).setStrokeStyle(3, 0x0b2a10);
        drone.setDepth(22);
        const endAt = scene.time.now + p.durationMs;
        let nextShot = scene.time.now + 300;

        const update = (time) => {
            if (!fighter.active || fighter.dead || time >= endAt) {
                cleanup();
                return;
            }
            // Sigue al dueño, por detrás y arriba, con un pequeño vaivén
            const tx = fighter.x - 34 * fighter.facing;
            const ty = fighter.y - fighter.def.body.height - 34 + Math.sin(time / 180) * 6;
            drone.x += (tx - drone.x) * 0.12;
            drone.y += (ty - drone.y) * 0.12;
            if (time < nextShot) return;
            // Objetivo: el hostil vivo más cercano dentro del alcance
            let best = null;
            let bestD = p.range;
            for (const t of scene.hostilesOf(fighter)) {
                const d = Phaser.Math.Distance.Between(drone.x, drone.y, t.x, t.y - 40);
                if (d < bestD) { bestD = d; best = t; }
            }
            if (!best) return;
            const ang = Phaser.Math.Angle.Between(drone.x, drone.y, best.x, best.y - best.def.body.height / 2);
            fighter.projectiles.fire(drone.x, drone.y, Math.cos(ang) * p.bulletSpeed, Math.sin(ang) * p.bulletSpeed, {
                owner: fighter,
                team: fighter.team,
                damage: fighter.outgoingDamage(p.damage),
                tint: 0x7dffb0,
            });
            audio.sfx('shoot');
            nextShot = time + p.fireRateMs;
        };
        const cleanup = () => {
            scene.events.off('update', update);
            scene.tweens.add({ targets: drone, alpha: 0, y: drone.y - 30, duration: 300, onComplete: () => drone.destroy() });
        };
        scene.events.on('update', update);
        scene.events.once('shutdown', () => scene.events.off('update', update));
        return true;
    },
};
