/**
 * PreloadScene — Carga spritesheets, tilesets, fondos y audio declarados en el contenido.
 */
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { ContentLoader } from '../systems/ContentLoader.js';
import { audio } from '../systems/AudioManager.js';
import { textStyle } from './ui.js';

export class PreloadScene extends Phaser.Scene {
    constructor() {
        super('Preload');
    }

    preload() {
        const content = this.registry.get('content');
        const w = 420;
        const x = (GAME_WIDTH - w) / 2;
        const y = GAME_HEIGHT / 2;
        this.add.text(GAME_WIDTH / 2, y - 40, 'RESCATANDO A HENRY', textStyle(28, '#ffd34d')).setOrigin(0.5);
        const frame = this.add.rectangle(x, y, w, 18).setOrigin(0, 0.5).setStrokeStyle(2, 0xffffff);
        const bar = this.add.rectangle(x + 3, y, 0, 12, 0xffd34d).setOrigin(0, 0.5);
        this.load.on('progress', (p) => (bar.width = (w - 6) * p));
        this.load.on('loaderror', (file) => console.error(`[Preload] No se pudo cargar: ${file.src}`));
        frame.setDepth(1);

        ContentLoader.queueAssets(this, content);
        audio.queueFiles(this.load);
    }

    create() {
        const content = this.registry.get('content');
        for (const def of content.characters.values()) {
            ContentLoader.createAnimations(this, def);
        }
        this.scene.start('Menu');
    }
}
