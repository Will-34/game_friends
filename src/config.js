/**
 * config.js — Constantes globales del juego.
 * Los datos de contenido (personajes, mapas, controles, audio) NO van aquí: están en content/.
 */

const params = new URLSearchParams(window.location.search);

/** Resolución lógica (16:9). El Scale Manager la ajusta a la pantalla. */
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

/** Modo depuración: ?debug=1 (muestra cuerpos físicos y el visor de animaciones). */
export const DEBUG = params.get('debug') === '1';

/** Modo desarrollo: servidor local o ?debug=1. Habilita el acceso al visor de animaciones en el menú. */
export const DEV_MODE = DEBUG || ['localhost', '127.0.0.1'].includes(window.location.hostname);

/** Fuerza los controles táctiles aunque el dispositivo no sea táctil: ?touch=1 */
export const FORCE_TOUCH = params.get('touch') === '1';

export const PHYSICS = {
    gravityY: 1500,
    /** Velocidad máxima de caída (px/s) */
    maxFallSpeed: 900,
};

/** Rutas de contenido */
export const PATHS = {
    catalogApi: 'api/catalog.php',
    catalogFallback: 'content/catalog.json',
    controls: 'content/config/controls.json',
    audio: 'content/audio/audio.json',
};

/** Personaje y mapa por defecto mientras no exista la selección (E3/E5). */
export const DEFAULTS = {
    playerCharacterId: 'plata',
    mapId: 'prueba',
};

/** Estilos de texto comunes */
export const FONT = {
    family: '"Trebuchet MS", "Segoe UI", system-ui, sans-serif',
};
