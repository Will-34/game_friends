/**
 * CharacterSelectScene — Pantalla de selección de protagonista.
 *
 * La lista sale del catálogo: un personaje nuevo en content/characters/ aparece aquí sin tocar código.
 * Teclado: flechas/WASD para moverse, Enter/Espacio/J para jugar, Esc para volver.
 * Ratón/táctil: tocar una tarjeta la selecciona; tocar la seleccionada (o JUGAR) empieza la partida.
 */
import { GAME_WIDTH, GAME_HEIGHT, DEFAULTS } from '../config.js';
import { textureKey, animKey, portraitKey } from '../systems/ContentLoader.js';
import { audio } from '../systems/AudioManager.js';
import { device } from '../systems/DeviceManager.js';
import { makeButton, textStyle } from './ui.js';

const COLS = 5;
const CARD_W = 96;
const CARD_H = 122;
const GRID_X = 455; // centro de la primera tarjeta
const GRID_Y = 150;
const GAP_X = 102;
const GAP_Y = 134;
/** Clave del registro con la última elección (solo dura la sesión; no se guarda nada). */
const LAST_CHOICE_KEY = 'lastCharacterId';

export class CharacterSelectScene extends Phaser.Scene {
    constructor() {
        super('CharacterSelect');
    }

    create() {
        const content = this.registry.get('content');
        this.chars = [...content.characters.values()];
        const last = this.registry.get(LAST_CHOICE_KEY) || DEFAULTS.playerCharacterId;
        this.index = Math.max(0, this.chars.findIndex((c) => c.id === last));
        this.cameras.main.setBackgroundColor('#0f1622');

        this.add.text(GAME_WIDTH / 2, 34, 'ELIGE TU PROTAGONISTA', textStyle(32, '#ffd34d')).setOrigin(0.5);

        // ---- Panel izquierdo: personaje grande e información
        const panel = this.add.graphics();
        panel.fillStyle(0x182234, 1).fillRoundedRect(20, 66, 370, 450, 12);
        panel.lineStyle(2, 0x34496e, 1).strokeRoundedRect(20, 66, 370, 450, 12);
        panel.lineStyle(2, 0x6fd0ff, 0.5).lineBetween(60, 300, 350, 300);
        this.preview = this.add.sprite(205, 300, textureKey(this.chars[0].id)).setScale(2.2);
        this.nameText = this.add.text(205, 316, '', textStyle(30, '#ffffff')).setOrigin(0.5, 0);
        this.archText = this.add.text(205, 352, '', textStyle(16, '#9fb0cc')).setOrigin(0.5, 0);
        this.abilityText = this.add
            .text(40, 384, '', textStyle(15, '#ffd34d', { wordWrap: { width: 330 }, lineSpacing: 2 }))
            .setOrigin(0, 0);

        // ---- Cuadrícula de tarjetas
        this.cards = this.chars.map((c, i) => this.makeCard(c, i));

        // ---- Botones
        makeButton(this, 560, 492, 'VOLVER', () => this.scene.start('Menu'), { width: 180, height: 48, size: 20 });
        makeButton(this, 800, 492, 'JUGAR', () => this.confirm(), { width: 220, height: 48, size: 24 }).setSelected(true);

        // ---- Teclado
        const kb = this.input.keyboard;
        const move = (dx, dy) => this.moveSelection(dx, dy);
        kb.on('keydown-LEFT', () => move(-1, 0));
        kb.on('keydown-A', () => move(-1, 0));
        kb.on('keydown-RIGHT', () => move(1, 0));
        kb.on('keydown-D', () => move(1, 0));
        kb.on('keydown-UP', () => move(0, -1));
        kb.on('keydown-W', () => move(0, -1));
        kb.on('keydown-DOWN', () => move(0, 1));
        kb.on('keydown-S', () => move(0, 1));
        kb.on('keydown-ENTER', () => this.confirm());
        kb.on('keydown-SPACE', () => this.confirm());
        kb.on('keydown-J', () => this.confirm());
        kb.on('keydown-ESC', () => this.scene.start('Menu'));

        this.refresh();
    }

    makeCard(def, i) {
        const x = GRID_X + (i % COLS) * GAP_X;
        const y = GRID_Y + Math.floor(i / COLS) * GAP_Y;
        const bg = this.add.rectangle(0, 0, CARD_W, CARD_H, 0x1b2333, 1).setStrokeStyle(2, 0x5b6b8c);
        const items = [bg];
        if (this.textures.exists(portraitKey(def.id))) {
            items.push(this.add.image(0, -12, portraitKey(def.id)).setDisplaySize(84, 84));
        } else {
            // Sin retrato: primer cuadro de idle
            items.push(this.add.sprite(0, 26, textureKey(def.id), def.animations.idle.frames[0]).setOrigin(0.5, 1).setScale(0.8));
        }
        items.push(this.add.text(0, 44, def.name.toUpperCase(), textStyle(14, '#ffffff')).setOrigin(0.5));
        const card = this.add.container(x, y, items).setSize(CARD_W, CARD_H);
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

    moveSelection(dx, dy) {
        const n = this.chars.length;
        const rows = Math.ceil(n / COLS);
        let col = this.index % COLS;
        let row = Math.floor(this.index / COLS);
        col = (col + dx + COLS) % COLS;
        row = (row + dy + rows) % rows;
        let next = row * COLS + col;
        if (next >= n) next = dy !== 0 ? col : n - 1; // fila incompleta
        this.index = Math.min(next, n - 1);
        audio.sfx('ui');
        this.refresh();
    }

    refresh() {
        const def = this.chars[this.index];
        this.cards.forEach((card, i) => {
            const on = i === this.index;
            card.bg.setFillStyle(on ? 0x34496e : 0x1b2333, 1);
            card.bg.setStrokeStyle(on ? 3 : 2, on ? 0xffd34d : 0x5b6b8c);
            card.setScale(on ? 1.06 : 1);
        });
        const a = def.animations.idle;
        this.preview.setTexture(textureKey(def.id));
        this.preview.setOrigin(a.origin[0], a.origin[1]);
        this.preview.play(animKey(def.id, 'idle'));
        this.nameText.setText(def.name.toUpperCase());
        this.archText.setText(def.archetype || '');
        const ab = def.ability;
        const lines = ab ? [`Habilidad: ${ab.name}`, ab.description] : [];
        if (ab && !ab.implemented) lines.push('(se activa en una próxima versión)');
        this.abilityText.setText(lines);
    }

    confirm() {
        const def = this.chars[this.index];
        this.registry.set(LAST_CHOICE_KEY, def.id);
        audio.sfx('ui');
        device.enterLandscapeFullscreen(); // por si se salió de la pantalla completa
        this.scene.start('MapSelect', { characterId: def.id });
    }
}
