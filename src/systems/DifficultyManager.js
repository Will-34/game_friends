/**
 * DifficultyManager.js — Dificultad aleatoria de cada enemigo.
 *
 * Cada enemigo recibe un nivel al aparecer. El nivel ajusta sus stats (sobre los modificadores
 * del rol ENEMY), su IA y el color de su nombre, para que el jugador lo identifique.
 */

export const DIFFICULTY_TIERS = Object.freeze({
    facil: {
        label: 'Fácil',
        weight: 45,
        nameColor: '#8dff9a',
        mods: { health: 0.4, bulletSpeed: 0.5, fireRate: 1.7, damage: 0.6 },
        ai: { sightRange: 380, burstMs: 380, restMs: 1900, reactionMs: 750, leash: 220, chaseSpeed: 0.55, grenadeEveryMs: 0 },
    },
    normal: {
        label: 'Normal',
        weight: 35,
        nameColor: '#ffd34d',
        mods: { health: 0.55, bulletSpeed: 0.58, fireRate: 1.35, damage: 0.8 },
        ai: { sightRange: 440, burstMs: 500, restMs: 1400, reactionMs: 480, leash: 340, chaseSpeed: 0.7, grenadeEveryMs: 0 },
    },
    dificil: {
        label: 'Difícil',
        weight: 20,
        nameColor: '#ff6b6b',
        mods: { health: 0.8, bulletSpeed: 0.7, fireRate: 1.05, damage: 1 },
        ai: { sightRange: 520, burstMs: 650, restMs: 1000, reactionMs: 250, leash: 480, chaseSpeed: 0.85, grenadeEveryMs: 7000 },
    },
});

export class DifficultyManager {
    /** Elige un nivel al azar según los pesos. */
    static pick() {
        const tiers = Object.entries(DIFFICULTY_TIERS);
        const total = tiers.reduce((s, [, t]) => s + t.weight, 0);
        let r = Math.random() * total;
        for (const [id, t] of tiers) {
            r -= t.weight;
            if (r <= 0) return { id, ...t };
        }
        return { id: 'normal', ...DIFFICULTY_TIERS.normal };
    }
}
