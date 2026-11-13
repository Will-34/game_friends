/**
 * MapSelectScene — Pantalla de selección de mapa (E5, H-050).
 *
 * La lista sale del contenido (mapas con `order`); un mapa nuevo en content/maps/ aparece aquí sin tocar código.
 * Cada tarjeta muestra una miniatura hecha con los fondos parallax del propio mapa.
 * Teclado: ←/→ (A/D) elegir, Enter/Espacio/J jugar, Esc volver. Ratón/táctil: tocar elige; tocar de nuevo juega.
 */
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { mapImageKey, tiledProp } from '../systems/ContentLoader.js';
import { selectableLevels } from '../systems/LevelCatalog.js';
import { DifficultyManager } from '../systems/DifficultyManager.js';
import { audio } from '../systems/AudioManager.js';
import { device } from '../systems/DeviceManager.js';
import { makeButton, textStyle } from './ui.js';

const LAST_MAP_KEY = 'lastMapId';
const CARD_H = 330;
const CARD_Y = 262;

export class MapSelectScene extends Phaser.Scene {
    constructor() {
        super('MapSelect');
    }

    init(data) {
        this.characterId = data && data.characterId;
    }

    create() {
        const content = this.registry.get('content');
        this.levels = selectableLevels(content);
        const last = this.registry.get(LAST_MAP_KEY);
        this.index = Math.max(0, this.levels.findIndex((l) => l.entry.id === last));
        this.cameras.main.setBackgroundColor('#0f1622');

        this.add.text(GAME_WIDTH / 2, 34, 'ELIGE EL MAPA', textStyle(32, '#ffd34d')).setOrigin(0.5);
        this.add.text(GAME_WIDTH / 2, 66, 'Santa Cruz de la Sierra · cada mapa termina con su jefe', textStyle(15, '#9fb0cc')).setOrigin(0.5);

        const n = this.levels.length;
        const gap = 18;
        this.cardW = Math.min(290, Math.floor((GAME_WIDTH - 40 - (n - 1) * gap) / n));
        const total = n * this.cardW + (n - 1) * gap;
        this.cards = this.levels.map((l, i) => this.makeCard(l, i, (GAME_WIDTH - total) / 2 + this.cardW / 2 + i * (this.cardW + gap)));

        makeButton(this, 330, 492, 'VOLVER', () => this.back(), { width: 180, height: 48, size: 20 });
        makeButton(this, 630, 492, 'JUGAR', () => this.confirm(), { width: 220, height: 48, size: 24 }).setSelected(true);

        const kb = this.input.keyboard;
        kb.on('keydown-LEFT', () => this.move(-1));
        kb.on('keydown-A', () => this.move(-1));
        kb.on('keydown-RIGHT', () => this.move(1));
        kb.on('keydown-D', () => this.move(1));
        kb.on('keydown-ENTER', () => this.confirm());
        kb.on('keydown-SPACE', () => this.confirm());
        kb.on('keydown-J', () => this.confirm());
        kb.on('keydown-ESC', () => this.back());
        this.refresh();
    }

    makeCard(level, i, x) {
        const w = this.cardW;
        const thumbW = w - 16;
        const thumbH = Math.round((thumbW * 9) / 16);
        const top = -CARD_H / 2;
        const bg = this.add.rectangle(0, 0, w, CARD_H, 0x1b2333, 1).setStrokeStyle(2, 0x5b6b8c);
        const items = [bg];

        // Miniatura: capas de imagen del mapa (de atrás hacia delante), escaladas
        const s = thumbW / GAME_WIDTH;
        const d = level.entry.data;
        const bgColor = tiledProp(d, 'backgroundColor', '#1d2b3a');
        items.push(this.add.rectangle(0, top + 8 + thumbH / 2, thumbW, thumbH, Phaser.Display.Color.HexStringToColor(bgColor).color));
        for (const layer of d.layers) {
            if (layer.type !== 'imagelayer' || !layer.image) continue;
            const key = mapImageKey(level.entry.id, layer.image);
            if (!this.textures.exists(key)) continue;
            const ts = this.add.tileSprite(-thumbW / 2, top + 8, GAME_WIDTH, GAME_HEIGHT, key).setOrigin(0, 0).setScale(s);
            ts.tilePositionX = 300 * (layer.parallaxx ?? 1);
            items.push(ts);
        }
        // Franja de suelo con el color del tileset (aproximado con un rectángulo oscuro)
        items.push(this.add.rectangle(0, top + 8 + thumbH - 8, thumbW, 16, 0x000000, 0.35));

        const info = level.info;
        const label = Number.isFinite(info.order) ? `NIVEL ${info.order}` : 'PRUEBA';
        let y = top + thumbH + 20;
        items.push(this.add.text(0, y, label, textStyle(13, '#6fd0ff')).setOrigin(0.5, 0));
        y += 20;
        items.push(this.add.text(0, y, info.name.toUpperCase(), textStyle(w < 240 ? 16 : 19, '#ffffff', { align: 'center', wordWrap: { width: w - 16 } })).setOrigin(0.5, 0));
        y += w < 240 ? 44 : 48;
        if (info.subtitle) items.push(this.add.text(0, y, info.subtitle, textStyle(13, '#9fb0cc', { align: 'center', wordWrap: { width: w - 16 } })).setOrigin(0.5, 0));
        const stars = this.difficultyStars(tiledProp(d, 'difficulty', ''));
        items.push(this.add.text(0, CARD_H / 2 - 54, `Dificultad ${stars}`, textStyle(14, '#ffb3b3')).setOrigin(0.5, 0));
        if (info.bossName) items.push(this.add.text(0, CARD_H / 2 - 32, `Jefe: ${info.bossName}`, textStyle(12, '#d7a6ff', { align: 'center', wordWrap: { width: w - 12 } })).setOrigin(0.5, 0));

        const card = this.add.container(x, CARD_Y, items).setSize(w, CARD_H);
        card.bg = bg;
        bg.setInteractive({ useHandCursor: true }).on('pointerup', () => {
            if (this.index === i) this.confirm();
            else {
                this.index = i;
                audio.sfx('ui');
                this.refresh();
            }
        });
        return card;
    }

    /** ★ según el peso de los enemigos difíciles del mapa. */
    difficultyStars(text) {
        const w = DifficultyManager.parseWeights(text);
        if (!w) return '★☆☆';
        const total = Object.values(w).reduce((a, b) => a + b, 0) || 1;
        const hard = ((w.dificil || 0) + (w.normal || 0) * 0.4) / total;
        const n = hard < 0.25 ? 1 : hard < 0.4 ? 2 : 3;
        return '★'.repeat(n) + '☆'.repeat(3 - n);
    }

    move(d) {
        const n = this.levels.length;
        this.index = (this.index + d + n) % n;
        audio.sfx('ui');
        this.refresh();
    }

    refresh() {
        this.cards.forEach((card, i) => {
            const on = i === this.index;
            card.bg.setFillStyle(on ? 0x34496e : 0x1b2333, 1);
            card.bg.setStrokeStyle(on ? 3 : 2, on ? 0xffd34d : 0x5b6b8c);
            card.setScale(on ? 1.04 : 0.98);
        });
    }

    confirm() {
        const level = this.levels[this.index];
        if (!level) return;
        this.registry.set(LAST_MAP_KEY, level.entry.id);
        audio.sfx('ui');
        device.enterLandscapeFullscreen();
        this.scene.start('Story', { characterId: this.characterId, mapId: level.entry.id });
    }

    back() {
        this.scene.start('CharacterSelect');
    }
}
