/**
 * shadow-dash.js — Se lanza hacia adelante a gran velocidad, casi invisible e invulnerable,
 * dañando a los enemigos que atraviesa (ataque sorpresa).
 *
 * Parámetros: durationMs, speed, damage, aura.
 */
export const ShadowDashAbility = {
    activate(fighter, params) {
        const scene = fighter.scene;
        const p = { durationMs: 700, speed: 640, damage: 40, aura: '#b06bff', ...params };
        fighter.addBuff({
            id: 'ability',
            durationMs: p.durationMs,
            forceVX: p.speed * fighter.facing,
            invulnerable: true,
            alpha: 0.35,
            aura: p.aura,
        });
        const hit = new Set();
        const endAt = scene.time.now + p.durationMs;
        const update = (time) => {
            if (!fighter.active || fighter.dead || time >= endAt) {
                scene.events.off('update', update);
                return;
            }
            for (const t of scene.hostilesOf(fighter)) {
                if (hit.has(t)) continue;
                if (Math.abs(t.x - fighter.x) < 36 && Math.abs(t.y - fighter.y) < 60) {
                    hit.add(t);
                    t.takeDamage(fighter.outgoingDamage(p.damage), { owner: fighter, x: fighter.x });
                }
            }
        };
        scene.events.on('update', update);
        scene.events.once('shutdown', () => scene.events.off('update', update));
        return true;
    },
};
