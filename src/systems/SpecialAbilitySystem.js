/**
 * SpecialAbilitySystem.js — Activa la habilidad especial de un Fighter según su character.json.
 *
 * - Protagonista/aliado: usa "ability".
 * - Enemigo: usa "enemyAbility" si existe; si no, la misma "ability".
 * La carga (2 bajas) la gestiona el Fighter; la frecuencia de los enemigos, EnemyAbilityDirector.
 */
import { getAbility } from '../abilities/registry.js';
import { DroneAbility } from '../abilities/drone.js';
import { droneKey, animKey } from './ContentLoader.js';
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

    /** Dron por defecto si el personaje no define el suyo en character.json → "drone". */
    static get DEFAULT_DRONE() {
        return { name: 'Dron', bulletColor: '#7dffb0', cooldownMs: 20000, params: { durationMs: 8000, fireRateMs: 320, range: 460, damage: 7 } };
    }

    /** Dron propio del personaje (acción DRON, todos los personajes). */
    droneOf(fighter) {
        return fighter.def.drone || SpecialAbilitySystem.DEFAULT_DRONE;
    }

    /** Lanza el dron del personaje; devuelve true si salió. */
    activateDrone(fighter) {
        const d = this.droneOf(fighter);
        const id = fighter.def.id;
        const ok = DroneAbility.activate(fighter, {
            ...(d.params || {}),
            bulletColor: d.bulletColor,
            texture: d.image ? droneKey(id) : null,
            anim: d.image ? animKey(id, 'drone') : null,
            slot: 1,
        });
        if (ok) {
            showAbilityBanner(this.scene, fighter, d.name || 'Dron', fighter.role === 'ENEMY' ? '#ff8a8a' : '#6fe8ff');
            audio.sfx('special');
        }
        return ok;
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
