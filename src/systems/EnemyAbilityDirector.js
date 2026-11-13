/**
 * EnemyAbilityDirector.js — Decide cuándo un enemigo usa su habilidad especial.
 *
 * Reglas (para que no sea demasiado difícil):
 *  - Cada cierto tiempo aleatorio (minGapMs..maxGapMs) se elige UN enemigo al azar.
 *  - Solo enemigos vivos y visibles en pantalla.
 *  - Nunca hay dos habilidades enemigas activas a la vez (se espera a que termine la anterior).
 */
export class EnemyAbilityDirector {
    /**
     * @param {Phaser.Scene} scene  GameScene
     * @param {() => Array} getEnemies
     * @param {object} [opts] { minGapMs, maxGapMs, firstDelayMs }
     */
    constructor(scene, getEnemies, opts = {}) {
        this.scene = scene;
        this.getEnemies = getEnemies;
        this.minGap = opts.minGapMs ?? 9000;
        this.maxGap = opts.maxGapMs ?? 16000;
        this.nextAt = scene.time.now + (opts.firstDelayMs ?? 6000);
        this.busyUntil = 0;
    }

    update(time) {
        if (time < this.nextAt || time < this.busyUntil) return;
        const view = this.scene.cameras.main.worldView;
        const candidates = this.getEnemies().filter(
            (e) => e.active && !e.dead && view.contains(e.x, e.y - 20) && this.scene.specials.canUse(e)
        );
        this.nextAt = time + Phaser.Math.Between(this.minGap, this.maxGap);
        if (candidates.length === 0) return;
        const e = Phaser.Utils.Array.GetRandom(candidates);
        if (e.tryUseSpecial(time, true)) {
            const ab = this.scene.specials.abilityOf(e);
            this.busyUntil = time + ((ab.params && ab.params.durationMs) || 4000) + 1000;
        }
    }
}
