/**
 * drone.js — Invoca un dron que sigue a su dueño y dispara solo al enemigo más cercano.
 *
 * Lo usan la habilidad de Plata ("ChatGPT Attack") y la acción DRON de todos los personajes (E5).
 * Parámetros: durationMs, fireRateMs, range, damage, bulletSpeed, bulletColor ('#rrggbb' o 'rainbow'),
 *             texture + anim (sprite del dron propio del personaje), slot (posición: 0 detrás, 1 delante).
 * Sin textura usa el efecto "drone" de la lámina del personaje si existe; si no, una figura genérica.
 */
import { effectsKey } from '../systems/ContentLoader.js';
import { audio } from '../systems/AudioManager.js';

const RAINBOW = [0xff4d4d, 0xff9a3d, 0xffe14d, 0x5ee06b, 0x4da6ff, 0xa66bff];

export const DroneAbility = {
    activate(fighter, params) {
        const scene = fighter.scene;
        const p = { durationMs: 6000, fireRateMs: 300, range: 480, damage: 8, bulletSpeed: 560, slot: 0, ...params };
        const fx = fighter.def.effects;
        let drone;
        if (p.texture && scene.textures.exists(p.texture)) {
            drone = scene.add.sprite(fighter.x, fighter.y - 90, p.texture, 0).setScale(p.scale ?? 1.3);
            if (p.anim && scene.anims.exists(p.anim)) drone.play(p.anim);
        } else if (fx && fx.frames && fx.frames.drone !== undefined) {
            drone = scene.add.image(fighter.x, fighter.y - 90, effectsKey(fighter.def.id), fx.frames.drone).setScale(0.7);
        } else {
            drone = scene.add.circle(fighter.x, fighter.y - 90, 12, 0x7dffb0).setStrokeStyle(3, 0x0b2a10);
        }
        drone.setDepth(22);
        const endAt = scene.time.now + p.durationMs;
        let nextShot = scene.time.now + 300;
        let shots = 0;
        const color = p.bulletColor && p.bulletColor !== 'rainbow' ? Phaser.Display.Color.HexStringToColor(p.bulletColor).color : 0x7dffb0;
        const side = p.slot === 1 ? 1 : -1; // detrás (0) o delante (1) del dueño

        const update = (time) => {
            if (!fighter.active || fighter.dead || time >= endAt) {
                cleanup();
                return;
            }
            // Sigue al dueño, arriba, con un pequeño vaivén; mira hacia donde mira el dueño
            const tx = fighter.x + 34 * side * fighter.facing;
            const ty = fighter.y - fighter.def.body.height * (fighter.sizeScale || 1) - 34 - p.slot * 10 + Math.sin(time / 180 + p.slot) * 6;
            drone.x += (tx - drone.x) * 0.12;
            drone.y += (ty - drone.y) * 0.12;
            if (drone.setFlipX) drone.setFlipX(fighter.facing < 0);
            // Parpadea el último segundo
            drone.setAlpha(endAt - time < 1000 && Math.floor(time / 100) % 2 === 0 ? 0.4 : 1);
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
                tint: p.bulletColor === 'rainbow' ? RAINBOW[shots % RAINBOW.length] : color,
            });
            shots++;
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
