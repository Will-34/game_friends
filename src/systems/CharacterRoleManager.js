/**
 * CharacterRoleManager.js — Asigna ROLES a personajes en tiempo de ejecución.
 *
 * La identidad (character.json: apariencia, stats, habilidad) es independiente del rol.
 * Un mismo personaje puede ser PLAYER en una partida y ENEMY en otra.
 */
import { Fighter } from '../entities/Fighter.js';

export const ROLES = Object.freeze({
    PLAYER: 'PLAYER',
    ENEMY: 'ENEMY',
    ALLY: 'ALLY',
    RESCUE_TARGET: 'RESCUE_TARGET',
});

/** Bando de cada rol: los proyectiles solo dañan a bandos hostiles. */
const TEAM_BY_ROLE = Object.freeze({
    PLAYER: 'heroes',
    ALLY: 'heroes',
    ENEMY: 'enemies',
    RESCUE_TARGET: 'neutral',
});

/**
 * Modificadores por rol. Se aplican sobre los stats base del personaje.
 * (Provisional en E1; DifficultyManager los ajustará en E4.)
 */
const ROLE_MODIFIERS = Object.freeze({
    PLAYER: { health: 1, bulletSpeed: 1, fireRate: 1, stunMs: 280, invulnerableMs: 900, tint: null },
    ALLY: { health: 1, bulletSpeed: 0.8, fireRate: 1.25, damage: 0.8, stunMs: 200, invulnerableMs: 500, tint: null },
    ENEMY: { health: 0.5, bulletSpeed: 0.55, fireRate: 1.4, stunMs: 120, invulnerableMs: 60, tint: 0xffc2c2 },
    RESCUE_TARGET: { health: 1, bulletSpeed: 1, fireRate: 1, stunMs: 0, invulnerableMs: 0, tint: null },
});

export class CharacterRoleManager {
    constructor() {
        /** @type {Map<string, string>} characterId → rol asignado para la partida */
        this.assignments = new Map();
    }

    assign(characterId, role) {
        if (!ROLES[role]) throw new Error(`Rol desconocido: ${role}`);
        this.assignments.set(characterId, role);
    }

    roleOf(characterId) {
        return this.assignments.get(characterId) || null;
    }

    /** Personajes con un rol dado. */
    withRole(role) {
        return [...this.assignments].filter(([, r]) => r === role).map(([id]) => id);
    }

    /**
     * Elige personajes para N enemigos: nunca el protagonista ni quien tenga canBeEnemy: false (p. ej. Henry).
     * Reparte sin repetir mientras haya candidatos (baraja y recorre).
     * @param {Map<string, object>} characters
     * @param {number} count
     * @param {Iterable<string>} [exclude]  ids que no se deben elegir (p. ej. el jefe y los aliados)
     * @returns {string[]} ids
     */
    pickEnemyIds(characters, count, exclude = []) {
        const out = this.pickIds(characters, count, exclude);
        for (const id of new Set(out)) if (!this.assignments.has(id)) this.assign(id, ROLES.ENEMY);
        return out;
    }

    /**
     * Elige N personajes al azar entre los que pueden aparecer como no jugadores (canBeEnemy !== false),
     * sin el protagonista ni los excluidos. Sin repetir mientras haya candidatos.
     * Si al excluir no queda nadie, se ignoran los excluidos (nunca el protagonista).
     */
    pickIds(characters, count, exclude = []) {
        const players = new Set(this.withRole(ROLES.PLAYER));
        const base = [...characters.values()].filter((d) => !players.has(d.id) && d.canBeEnemy !== false).map((d) => d.id);
        const ex = new Set(exclude);
        let pool = base.filter((id) => !ex.has(id));
        if (pool.length === 0) pool = base;
        if (pool.length === 0) return [];
        const out = [];
        let bag = [];
        while (out.length < count) {
            if (bag.length === 0) bag = Phaser.Utils.Array.Shuffle([...pool]);
            out.push(bag.pop());
        }
        return out;
    }

    static teamOf(role) {
        return TEAM_BY_ROLE[role] || 'neutral';
    }

    static modifiersOf(role) {
        return ROLE_MODIFIERS[role] || ROLE_MODIFIERS.RESCUE_TARGET;
    }

    /** ¿Puede un bando dañar a otro? */
    static areHostile(teamA, teamB) {
        return teamA !== teamB && teamA !== 'neutral' && teamB !== 'neutral';
    }

    /**
     * Crea un Fighter con el rol indicado.
     * @param {Phaser.Scene} scene
     * @param {object} def        character.json
     * @param {string} role       ROLES.*
     * @param {number} x
     * @param {number} y          coordenada de los pies
     * @param {object} deps       { controller, projectiles, grenades, specials, grenadeCount, modsOverride, nameColor, title, scale }
     */
    createFighter(scene, def, role, x, y, deps) {
        const mods = { ...CharacterRoleManager.modifiersOf(role), ...(deps.modsOverride || {}) };
        const fighter = new Fighter(scene, x, y, def, {
            role,
            team: CharacterRoleManager.teamOf(role),
            modifiers: mods,
            controller: deps.controller,
            projectiles: deps.projectiles,
            grenades: deps.grenades,
            specials: deps.specials,
            grenadeCount: deps.grenadeCount,
            nameColor: deps.nameColor,
            weapons: deps.weapons,
            title: deps.title,
            scale: deps.scale,
            passiveRegen: deps.passiveRegen,
        });
        if (mods.tint !== null) fighter.setTint(mods.tint);
        return fighter;
    }
}
