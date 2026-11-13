/**
 * MenuScene — Menú principal: Jugar, Visor de animaciones (modo desarrollo) y Sonido.
 */
import { GAME_WIDTH, GAME_HEIGHT, DEV_MODE, DEFAULTS } from '../config.js';
import { audio } from '../systems/AudioManager.js';
import { textureKey, animKey } from '../systems/ContentLoader.js';
import { bindGlobalKeys } from '../input/KeyboardControls.js';
import { device } from '../systems/DeviceManager.js';
import { makeButton, makeVerticalMenu, textStyle } from './ui.js';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super('Menu');
    }

    create() {
        const content = this.registry.get('content');
        const cx = GAME_WIDTH / 2;
        this.cameras.main.setBackgroundColor('#0b0f17');
        audio.playMusicForScene('Menu');

        // Fondo: franjas simples
        const g = this.add.graphics();
        for (let i = 0; i < 12; i++) {
            g.fillStyle(i % 2 ? 0x121a28 : 0x0f1622, 1).fillRect(0, i * 45, GAME_WIDTH, 45);
        }

        this.add.text(cx, 80, 'RESCATANDO A HENRY', textStyle(52, '#ffd34d')).setOrigin(0.5);
        this.add.text(cx, 130, 'Acción arcade 2D', textStyle(20, '#c9d3e6')).setOrigin(0.5);

        // Protagonista por defecto (la selección llega en E3)
        const hero = content.characters.get(DEFAULTS.playerCharacterId) || [...content.characters.values()][0];
        if (hero) {
            this.add.sprite(200, 420, textureKey(hero.id)).setOrigin(0.5, 1).setScale(2).play(animKey(hero.id, 'idle'));
        }

        const buttons = [
            makeButton(this, cx, 240, 'JUGAR', () => {
                // En móvil: pantalla completa y horizontal (necesita este gesto del usuario)
                device.enterLandscapeFullscreen();
                this.scene.start('CharacterSelect');
            }),
        ];
        if (DEV_MODE) {
            buttons.push(makeButton(this, cx, 304, 'VISOR DE ANIMACIONES', () => this.scene.start('AnimViewer'), { size: 20 }));
        }
        const soundBtn = makeButton(this, cx, DEV_MODE ? 368 : 304, '', () => audio.toggleMute(), { size: 20 });
        buttons.push(soundBtn);
        const refreshSound = () => soundBtn.label.setText(audio.muted ? 'SONIDO: NO' : 'SONIDO: SÍ');
        refreshSound();
        audio.on('mute-changed', refreshSound);
        this.events.once('shutdown', () => audio.off('mute-changed', refreshSound));

        makeVerticalMenu(this, buttons);
        bindGlobalKeys(this, content.controls.global, { mute: () => audio.toggleMute() });

        this.add
            .text(
                cx,
                GAME_HEIGHT - 50,
                device.touch
                    ? 'Joystick (izquierda): mover · abajo agacharse · arriba apuntar\nBotones: FUEGO · SALTO · GRANADA · HABIL. (se carga con 2 bajas)'
                    : 'Mover: ←→ / A D   Saltar: Espacio / K   Disparar: J   Agacharse: ↓ / S   Apuntar arriba: ↑ / W\nGranada: U   Habilidad: L (se carga con 2 bajas)   Pausa: Esc / P   Silencio: M',
                textStyle(14, '#9fb0cc', { align: 'center', strokeThickness: 2 })
            )
            .setOrigin(0.5);
        this.add
            .text(GAME_WIDTH - 10, GAME_HEIGHT - 10, `v0.4.0 · catálogo: ${content.catalog.source}`, textStyle(11, '#56657f'))
            .setOrigin(1, 1);
    }
}
