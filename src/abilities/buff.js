/**
 * buff.js — Habilidad genérica de mejora temporal (la mayoría de los personajes).
 *
 * Parámetros (character.json → ability.params):
 *   durationMs      duración del efecto
 *   heal            vida que recupera al activarse
 *   grenades        granadas que recibe
 *   speedMul        multiplicador de velocidad
 *   damageMul       multiplicador del daño que hace
 *   damageTakenMul  multiplicador del daño que recibe (0.5 = la mitad)
 *   jumpMul         multiplicador del salto
 *   regenPerSec     vida por segundo
 *   invulnerable    escudo: no recibe daño
 *   aura            color del aura ('#rrggbb' o 'rainbow')
 */
export const BuffAbility = {
    activate(fighter, params) {
        if (params.heal) fighter.heal(params.heal);
        if (params.grenades) fighter.addGrenades(params.grenades);
        fighter.addBuff({
            id: 'ability',
            durationMs: params.durationMs ?? 6000,
            speedMul: params.speedMul ?? 1,
            damageMul: params.damageMul ?? 1,
            damageTakenMul: params.damageTakenMul ?? 1,
            jumpMul: params.jumpMul ?? 1,
            regenPerSec: params.regenPerSec ?? 0,
            invulnerable: !!params.invulnerable,
            aura: params.aura || null,
        });
        return true;
    },
};
