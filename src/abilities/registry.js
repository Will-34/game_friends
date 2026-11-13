/**
 * registry.js — Registro de habilidades especiales.
 *
 * Cada habilidad vive en src/abilities/<id>.js y se registra aquí con su id,
 * el mismo que aparece en character.json → "ability.id" / "enemyAbility.id".
 *
 * En E1 no hay habilidades implementadas: SpecialAbilitySystem y las 9 habilidades
 * llegan en E4. Ejemplo de registro futuro:
 *
 *   import { ChatGptAttack } from './chatgpt-attack.js';
 *   registerAbility('chatgpt-attack', ChatGptAttack);
 */

const abilities = new Map();

/**
 * @param {string} id
 * @param {Function} factory  clase o función que crea la habilidad para un Fighter
 */
export function registerAbility(id, factory) {
    if (abilities.has(id)) console.warn(`[abilities] La habilidad "${id}" ya estaba registrada; se reemplaza.`);
    abilities.set(id, factory);
}

/** Devuelve la fábrica de la habilidad o null si aún no existe. */
export function getAbility(id) {
    return (id && abilities.get(id)) || null;
}

export function hasAbility(id) {
    return abilities.has(id);
}

export function listAbilities() {
    return [...abilities.keys()];
}
