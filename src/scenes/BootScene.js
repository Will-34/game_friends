/**
 * BootScene — Descubre el contenido (catálogo + definiciones) y prepara el audio.
 */
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { ContentLoader } from '../systems/ContentLoader.js';
import { audio } from '../systems/AudioManager.js';
import { PROJECTILE_TEXTURE } from '../entities/Projectile.js';
import { MUZZLE_TEXTURE } from '../entities/Fighter.js';
import { textStyle } from './ui.js';

export class BootScene extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    create() {
        const msg = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Cargando contenido…', textStyle(22)).setOrigin(0.5);
        this.makeGeneratedTextures();

        ContentLoader.loadAll()
            .then((content) => {
                this.registry.set('content', content);
                audio.init(this.game, content.audio);
                console.info(
                    `[Boot] Catálogo (${content.catalog.source}): ${content.characters.size} personaje(s), ${content.maps.size} mapa(s)`
                );
                this.scene.start('Preload');
            })
            .catch((err) => {
                console.error('[Boot] Error cargando contenido:', err);
                msg.setText(`No se pudo cargar el contenido.\n${err.message}`).setColor('#ff8080').setAlign('center');
            });
    }

    /** Texturas genéricas generadas por código (no dependen de ningún personaje). */
    makeGeneratedTextures() {
        if (!this.textures.exists(PROJECTILE_TEXTURE)) {
            const g = this.make.graphics({ x: 0, y: 0 }, false);
            g.fillStyle(0xfff3a0, 1).fillRoundedRect(0, 0, 14, 6, 3);
            g.fillStyle(0xffffff, 1).fillRect(8, 1, 5, 4);
            g.generateTexture(PROJECTILE_TEXTURE, 14, 6);
            g.destroy();
        }
        if (!this.textures.exists(MUZZLE_TEXTURE)) {
            // Fogonazo genérico para personajes cuya lámina no trae uno
            const g = this.make.graphics({ x: 0, y: 0 }, false);
            g.fillStyle(0xff8a1f, 1).fillTriangle(0, 4, 26, 12, 0, 20);
            g.fillStyle(0xffd23f, 1).fillTriangle(4, 7, 22, 12, 4, 17);
            g.fillStyle(0xfffbe0, 1).fillCircle(6, 12, 4);
            g.generateTexture(MUZZLE_TEXTURE, 28, 24);
            g.destroy();
        }
    }
}
