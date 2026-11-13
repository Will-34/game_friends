/**
 * BootScene — Descubre el contenido (catálogo + definiciones) y prepara el audio.
 */
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { ContentLoader } from '../systems/ContentLoader.js';
import { audio } from '../systems/AudioManager.js';
import { PROJECTILE_TEXTURE } from '../entities/Projectile.js';
import { MUZZLE_TEXTURE } from '../entities/Fighter.js';
import { GRENADE_TEXTURE, EXPLOSION_TEXTURE } from '../entities/Grenade.js';
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

    /**
     * Iconos pixel art para los símbolos de los personajes que no tienen un emoji adecuado
     * (character.json → taunt.icon) y texturas de granada/explosión genéricas.
     */
    makeIcons() {
        const px = (g, color, cells) => {
            g.fillStyle(color, 1);
            for (const [x, y, w = 1, h = 1] of cells) g.fillRect(x * 2, y * 2, w * 2, h * 2);
        };
        if (!this.textures.exists('icon-green-can')) {
            // Lata energética verde con un rayo
            const g = this.make.graphics({ x: 0, y: 0 }, false);
            px(g, 0x0b2a10, [[3, 0, 10, 16]]);
            px(g, 0x2ecc40, [[4, 1, 8, 14]]);
            px(g, 0xbfc7c2, [[4, 1, 8, 2], [4, 13, 8, 2]]);
            px(g, 0x7dff5a, [[5, 3, 2, 10]]);
            px(g, 0xfff35a, [[9, 4, 2, 3], [7, 7, 3, 1], [7, 8, 2, 3]]);
            g.generateTexture('icon-green-can', 32, 32);
            g.destroy();
        }
        if (!this.textures.exists('icon-green-boot')) {
            // Bota verde brillante
            const g = this.make.graphics({ x: 0, y: 0 }, false);
            px(g, 0x0b2a10, [[3, 1, 7, 10], [3, 10, 12, 5]]);
            px(g, 0x39ff6a, [[4, 2, 5, 9], [4, 11, 10, 2]]);
            px(g, 0x1a9c3a, [[4, 13, 10, 1]]);
            px(g, 0xc8ffd2, [[5, 3, 1, 6], [6, 11, 3, 1]]);
            g.generateTexture('icon-green-boot', 32, 32);
            g.destroy();
        }
        if (!this.textures.exists(GRENADE_TEXTURE)) {
            const g = this.make.graphics({ x: 0, y: 0 }, false);
            g.fillStyle(0x1d2a12, 1).fillCircle(9, 11, 8);
            g.fillStyle(0x5c7a2e, 1).fillCircle(9, 11, 6);
            g.fillStyle(0x8fae4a, 1).fillCircle(7, 9, 2);
            g.fillStyle(0x9a9a9a, 1).fillRect(6, 1, 6, 4);
            g.generateTexture(GRENADE_TEXTURE, 18, 20);
            g.destroy();
        }
        if (!this.textures.exists(EXPLOSION_TEXTURE)) {
            const g = this.make.graphics({ x: 0, y: 0 }, false);
            g.fillStyle(0xff4d1a, 1).fillCircle(32, 32, 30);
            g.fillStyle(0xff9a1f, 1).fillCircle(30, 34, 22);
            g.fillStyle(0xffe066, 1).fillCircle(33, 30, 13);
            g.fillStyle(0xfffbe0, 1).fillCircle(32, 31, 6);
            g.generateTexture(EXPLOSION_TEXTURE, 64, 64);
            g.destroy();
        }
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
        this.makeIcons();
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
