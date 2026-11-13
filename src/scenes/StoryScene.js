/**
 * StoryScene — Pantalla de historia antes de cada nivel (E5, H-059).
 *
 * Muestra el título del nivel y su texto (`story` del map.json) línea a línea, sobre los fondos
 * parallax del propio mapa en movimiento. Enter/Espacio/J/toque: completa el texto; de nuevo: jugar.
 * Esc vuelve a la selección de mapa. Si el mapa no tiene historia, pasa directo a la partida.
 */
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { mapImageKey, textureKey, animKey, tiledProp } from '../systems/ContentLoader.js';
import { levelInfo } from '../systems/LevelCatalog.js';
import { audio } from '../systems/AudioManager.js';
import { textStyle } from './ui.js';

const CHAR_MS = 22;     // velocidad de escritura
const LINE_PAUSE_MS = 350;

export class StoryScene extends Phaser.Scene {
    constructor() {
        super('Story');
    }

    init(data) {
        this.data_ = data || {};
    }

    create() {
        const content = this.registry.get('content');
        const entry = content.maps.get(this.data_.mapId);
        if (!entry) {
            this.scene.start('Game', this.data_);
            return;
        }
        const info = levelInfo(entry);
        if (info.story.length === 0) {
            this.startGame();
            return;
        }

        // Fondo: capas del mapa desplazándose despacio
        const d = entry.data;
        this.cameras.main.setBackgroundColor(tiledProp(d, 'backgroundColor', '#0b0f17'));
        this.layers = [];
        for (const layer of d.layers) {
            if (layer.type !== 'imagelayer' || !layer.image) continue;
            const key = mapImageKey(entry.id, layer.image);
            if (!this.textures.exists(key)) continue;
            this.layers.push({ ts: this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, key).setOrigin(0, 0), f: layer.parallaxx ?? 1 });
        }
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.35).setOrigin(0, 0);

        // Título
        const label = Number.isFinite(info.order) ? `NIVEL ${info.order}` : 'MAPA';
        this.add.text(GAME_WIDTH / 2, 50, label, textStyle(20, '#6fd0ff')).setOrigin(0.5);
        this.add.text(GAME_WIDTH / 2, 92, info.name.toUpperCase(), textStyle(44, '#ffd34d')).setOrigin(0.5);
        if (info.subtitle) this.add.text(GAME_WIDTH / 2, 132, info.subtitle, textStyle(18, '#ffffff')).setOrigin(0.5);

        // Protagonista a la izquierda
        const def = content.characters.get(this.data_.characterId);
        if (def) {
            this.add.sprite(120, 470, textureKey(def.id)).setOrigin(0.5, 1).setScale(1.6).play(animKey(def.id, 'idle'));
        }

        // Cuadro de texto
        const boxX = 230;
        const boxW = GAME_WIDTH - boxX - 30;
        const g = this.add.graphics();
        g.fillStyle(0x0b0f17, 0.82).fillRoundedRect(boxX, 200, boxW, 250, 12);
        g.lineStyle(2, 0xffd34d, 0.8).strokeRoundedRect(boxX, 200, boxW, 250, 12);
        this.lines = info.story;
        this.texts = this.lines.map((_, i) =>
            this.add.text(boxX + 22, 222 + i * 56, '', textStyle(19, '#ffffff', { wordWrap: { width: boxW - 44 }, lineSpacing: 2 }))
        );
        this.hint = this.add
            .text(GAME_WIDTH - 40, GAME_HEIGHT - 40, 'Enter / toque: continuar · Esc: volver', textStyle(14, '#c9d3e6'))
            .setOrigin(1, 0.5)
            .setAlpha(0.8);
        this.tweens.add({ targets: this.hint, alpha: 0.35, duration: 700, yoyo: true, repeat: -1 });

        this.lineIdx = 0;
        this.charIdx = 0;
        this.nextAt = this.time.now + 300;
        this.done = false;

        const advance = () => {
            if (this.done) this.startGame();
            else this.completeAll();
        };
        const kb = this.input.keyboard;
        kb.on('keydown-ENTER', advance);
        kb.on('keydown-SPACE', advance);
        kb.on('keydown-J', advance);
        kb.on('keydown-ESC', () => this.scene.start('MapSelect', { characterId: this.data_.characterId }));
        this.input.on('pointerup', advance);
    }

    update(time) {
        if (!this.layers) return;
        for (const l of this.layers) l.ts.tilePositionX = time * 0.04 * l.f;
        if (this.done || time < this.nextAt) return;
        const line = this.lines[this.lineIdx];
        this.charIdx++;
        this.texts[this.lineIdx].setText(line.slice(0, this.charIdx));
        if (this.charIdx % 6 === 0) audio.sfx('ui');
        if (this.charIdx >= line.length) {
            this.lineIdx++;
            this.charIdx = 0;
            this.nextAt = time + LINE_PAUSE_MS;
            if (this.lineIdx >= this.lines.length) this.done = true;
        } else {
            this.nextAt = time + CHAR_MS;
        }
    }

    completeAll() {
        this.lines.forEach((l, i) => this.texts[i].setText(l));
        this.done = true;
    }

    startGame() {
        this.scene.start('Game', { characterId: this.data_.characterId, mapId: this.data_.mapId });
    }
}
