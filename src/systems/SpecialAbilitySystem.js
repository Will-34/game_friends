/**
 * SpecialAbilitySystem.js — Activa la habilidad especial de un Fighter según su character.json.
 *
 * - Protagonista/aliado: usa "ability".
 * - Enemigo: usa "enemyAbility" si existe; si no, la misma "ability".
 * La carga (2 bajas) la gestiona el Fighter; la frecuencia de los enemigos, EnemyAbilityDirector.
 */
import { getAbility } from '../abilities/registry.js';
import { showAbilityBanner } from './FloatingText.js';
import { audio } from './AudioManager.js';

export class SpecialAbilitySystem {
    constructor(scene) {
        this.scene = scene;
    }

    abilityOf(fighter) {
        const d = fighter.def;
        return fighter.role === 'ENEMY' ? d.enemyAbility || d.ability : d.ability;
    }

    /** ¿Tiene este personaje una habilidad que se pueda usar? */
    canUse(fighter) {
        const ab = this.abilityOf(fighter);
        return !!(ab && getAbility(ab.type));
    }

    /** Activa la habilidad; devuelve true si se activó. */
    activate(fighter) {
        const ab = this.abilityOf(fighter);
        const impl = ab && getAbility(ab.type);
        if (!impl) return false;
        const ok = impl.activate(fighter, ab.params || {});
        if (ok) {
            showAbilityBanner(this.scene, fighter, ab.name, fighter.role === 'ENEMY' ? '#ff8a8a' : '#ffd34d');
            audio.sfx('special');
        }
        return ok;
    }
}
