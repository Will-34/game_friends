/**
 * main.js — Punto de entrada. Crea el juego de Phaser con la configuración global.
 * Phaser se carga antes como script clásico desde lib/phaser.min.js (variable global `Phaser`).
 */
import { GAME_WIDTH, GAME_HEIGHT, PHYSICS, DEBUG, DEV_MODE } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { CharacterSelectScene } from './scenes/CharacterSelectScene.js';
import { GameScene } from './scenes/GameScene.js';
import { HudScene } from './scenes/HudScene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { AnimViewerScene } from './scenes/AnimViewerScene.js';
import { device } from './systems/DeviceManager.js';

if (typeof window.Phaser === 'undefined') {
    document.body.textContent = 'No se pudo cargar lib/phaser.min.js';
    throw new Error('Phaser no está disponible');
}

const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#0b0f17',
    pixelArt: true,
    roundPixels: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: {
        activePointers: 4, // multitáctil
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: PHYSICS.gravityY },
            debug: DEBUG,
        },
    },
    scene: [BootScene, PreloadScene, MenuScene, CharacterSelectScene, GameScene, HudScene, PauseScene, AnimViewerScene],
});

// Móvil: táctil, horizontal/pantalla completa, aviso de girar, zonas seguras (ver DeviceManager)
device.init(game);

// Acceso para depuración desde la consola del navegador (solo en desarrollo)
if (DEV_MODE) window.__game = game;
