/**
 * GameEvents.js — Nombres de eventos compartidos entre escenas (Game → Hud, etc.).
 * Se emiten en `gameScene.events`.
 */
export const GAME_EVENTS = Object.freeze({
    PLAYER_HEALTH: 'player-health',      // (health, maxHealth)
    PLAYER_READY: 'player-ready',        // (fighter)
    ENEMIES_LEFT: 'enemies-left',        // (count)
    LEVEL_CLEARED: 'level-cleared',
    PLAYER_DEFEATED: 'player-defeated',
    REQUEST_PAUSE: 'request-pause',
});

/** Eventos que emite cada Fighter sobre sí mismo. */
export const FIGHTER_EVENTS = Object.freeze({
    DAMAGED: 'fighter-damaged',          // (fighter, amount)
    DIED: 'fighter-died',                // (fighter)
});
