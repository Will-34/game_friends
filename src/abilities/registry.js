/**
 * registry.js — Registro de TIPOS de habilidad especial.
 *
 * Cada personaje declara su habilidad en character.json:
 *   "ability": { "id": "bandera-de-poder", "name": "...", "type": "buff", "params": { ... } }
 * El "type" elige la implementación (src/abilities/<type>.js) y "params" la ajusta.
 * Así 10 habilidades distintas se resuelven con pocas implementaciones reutilizables (ADR-009).
 *
 * Para un tipo nuevo: crear src/abilities/<tipo>.js con un objeto { activate(fighter, params) }
 * y registrarlo aquí.
 */
import { BuffAbility } from './buff.js';
import { DroneAbility } from './drone.js';
import { ShadowDashAbility } from './shadow-dash.js';

const abilities = new Map();

/**
 * @param {string} type
 * @param {{activate: (fighter: object, params: object) => boolean}} impl
 */
export function registerAbility(type, impl) {
    if (abilities.has(type)) console.warn(`[abilities] El tipo "${type}" ya estaba registrado; se reemplaza.`);
    abilities.set(type, impl);
}

/** Devuelve la implementación del tipo o null si no existe. */
export function getAbility(type) {
    return (type && abilities.get(type)) || null;
}

export function hasAbility(type) {
    return abilities.has(type);
}

export function listAbilities() {
    return [...abilities.keys()];
}

registerAbility('buff', BuffAbility);
registerAbility('drone', DroneAbility);
registerAbility('shadow-dash', ShadowDashAbility);
