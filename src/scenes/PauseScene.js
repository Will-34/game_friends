/**
 * PauseScene — Superposición de pausa. Continuar con Esc/P, botón o toque; o salir al menú.
 */
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { audio } from '../systems/AudioManager.js';
import { matchesKey, bindGlobalKeys } from '../input/KeyboardControls.js';
import { makeButton, makeVerticalMenu, textStyle } from './ui.js';

export class PauseScene extends Phaser.Scene {
    constructor() {
        super('Pause');
    }

    create() {
        const content = this.registry.get('content');
        const cx = GAME_WIDTH / 2;
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0, 0).setInteractive();
        this.add.text(cx, 150, 'PAUSA', textStyle(56, '#ffd34d')).setOrigin(0.5);

        const buttons = [
            makeButton(this, cx, 260, 'CONTINUAR', () => this.resumeGame()),
            makeButton(this, cx, 324, 'SALIR AL MENÚ', () => this.exitToMenu()),
        ];
        makeVerticalMenu(this, buttons);

        const pauseKeys = content.controls.keyboard.pause || [];
        this.input.keyboard.on('keydown', (ev) => {
            if (!ev.repeat && matchesKey(ev, pauseKeys)) this.resumeGame();
        });
        bindGlobalKeys(this, content.controls.global, { mute: () => audio.toggleMute() });
    }

    resumeGame() {
        this.scene.stop();
        this.scene.resume('Game');
    }

    exitToMenu() {
        this.scene.stop('Hud');
        this.scene.stop('Game');
        this.scene.start('Menu');
    }
}
