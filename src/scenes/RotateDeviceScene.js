/**
 * RotateDeviceScene — Aviso "Gira tu dispositivo" en móviles en vertical.
 * Versión básica de E1; E2 la pule (animación, pruebas en Android/iPhone).
 */
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { textStyle } from './ui.js';

const KEY = 'RotateDevice';

export class RotateDeviceScene extends Phaser.Scene {
    constructor() {
        super(KEY);
    }

    create() {
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0b0f17, 1).setOrigin(0, 0).setInteractive();
        const g = this.add.graphics();
        const cx = GAME_WIDTH / 2;
        g.lineStyle(6, 0xffd34d, 1).strokeRoundedRect(cx - 45, 120, 90, 160, 12);
        g.fillStyle(0xffd34d, 1).fillCircle(cx, 262, 6);
        this.add.text(cx, 340, 'GIRA TU DISPOSITIVO', textStyle(34, '#ffd34d')).setOrigin(0.5);
        this.add.text(cx, 386, 'Este juego se juega en horizontal', textStyle(18)).setOrigin(0.5);
    }

    /**
     * Vigila la orientación y muestra/oculta el aviso. Pausa la partida mientras está en vertical.
     * @param {Phaser.Game} game
     */
    static install(game) {
        let pausedGame = false;
        const check = () => {
            const sm = game.scene;
            const portrait = window.innerHeight > window.innerWidth;
            const touch = game.device.input.touch;
            const showing = sm.isActive(KEY);
            if (portrait && touch && !showing) {
                if (sm.isActive('Game')) {
                    sm.pause('Game');
                    pausedGame = true;
                }
                sm.start(KEY);
                sm.bringToTop(KEY);
            } else if ((!portrait || !touch) && showing) {
                sm.stop(KEY);
                if (pausedGame && sm.isPaused('Game') && !sm.isActive('Pause')) sm.resume('Game');
                pausedGame = false;
            }
        };
        window.addEventListener('resize', check);
        window.addEventListener('orientationchange', check);
        game.events.once(Phaser.Core.Events.READY, check);
    }
}
