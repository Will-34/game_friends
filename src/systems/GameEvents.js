/**
 * GameEvents.js — Nombres de eventos compartidos entre escenas (Game → Hud, etc.).
 * Se emiten en `gameScene.events`.
 */
export const GAME_EVENTS = Object.freeze({
    PLAYER_HEALTH: 'player-health',      // (health, maxHealth)
    PLAYER_STATS: 'player-stats',        // (fighter) granadas, carga de habilidad, bajas
    PLAYER_READY: 'player-ready',        // (fighter)
    ENEMIES_LEFT: 'enemies-left',        // (count)
    LEVEL_CLEARED: 'level-cleared',
    PLAYER_DEFEATED: 'player-defeated',
    REQUEST_PAUSE: 'request-pause',
    BOSS_START: 'boss-start',            // (fighter, title)
    BOSS_HEALTH: 'boss-health',          // (health, maxHealth)
    BOSS_END: 'boss-end',
    ALLIES_STATUS: 'allies-status',      // ([{ name, alive, returnsIn, respawnsLeft }])
    MESSAGE: 'message',                  // (texto, color) aviso grande en el centro del HUD
});

/** Eventos que emite cada Fighter sobre sí mismo. */
export const FIGHTER_EVENTS = Object.freeze({
    DAMAGED: 'fighter-damaged',          // (fighter, amount)  amount < 0 = curación
    DIED: 'fighter-died',                // (fighter, killer|null)
    HIT: 'fighter-hit',                  // (attacker, victim) el atacante acertó un golpe
    STATS: 'fighter-stats',              // (fighter) cambió granadas / carga de habilidad / bajas
});
