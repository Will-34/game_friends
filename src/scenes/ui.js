/**
 * ui.js — Utilidades de interfaz compartidas por las escenas (botones, textos, menús).
 */
import { FONT } from '../config.js';
import { audio } from '../systems/AudioManager.js';

export function textStyle(size = 24, color = '#ffffff', extra = {}) {
    return {
        fontFamily: FONT.family,
        fontSize: `${size}px`,
        color,
        stroke: '#000000',
        strokeThickness: Math.max(2, Math.round(size / 8)),
        ...extra,
    };
}

/**
 * Botón de texto con fondo, clicable/tocable.
 * @returns {Phaser.GameObjects.Container} con métodos setSelected(bool) y activate()
 */
export function makeButton(scene, x, y, label, onClick, { width = 280, height = 52, size = 24 } = {}) {
    const bg = scene.add.rectangle(0, 0, width, height, 0x1b2333, 0.92).setStrokeStyle(2, 0x5b6b8c);
    const txt = scene.add.text(0, 0, label, textStyle(size)).setOrigin(0.5);
    const c = scene.add.container(x, y, [bg, txt]);
    c.setSize(width, height);
    c.label = txt;
    c.setSelected = (on) => {
        bg.setFillStyle(on ? 0x34496e : 0x1b2333, 0.95);
        bg.setStrokeStyle(2, on ? 0xffd34d : 0x5b6b8c);
        txt.setColor(on ? '#ffd34d' : '#ffffff');
    };
    c.activate = () => {
        audio.sfx('ui');
        onClick();
    };
    bg.setInteractive({ useHandCursor: true })
        .on('pointerover', () => c.emit('hover'))
        .on('pointerup', () => c.activate());
    return c;
}

/**
 * Menú vertical navegable con teclado (↑/↓/W/S + Enter/Espacio/J) y con puntero.
 * @param {Phaser.Scene} scene
 * @param {Array<Phaser.GameObjects.Container>} buttons  creados con makeButton
 */
export function makeVerticalMenu(scene, buttons) {
    let index = 0;
    const refresh = () => buttons.forEach((b, i) => b.setSelected(i === index));
    buttons.forEach((b, i) =>
        b.on('hover', () => {
            index = i;
            refresh();
        })
    );
    const move = (d) => {
        index = (index + d + buttons.length) % buttons.length;
        audio.sfx('ui');
        refresh();
    };
    const kb = scene.input.keyboard;
    kb.on('keydown-UP', () => move(-1));
    kb.on('keydown-W', () => move(-1));
    kb.on('keydown-DOWN', () => move(1));
    kb.on('keydown-S', () => move(1));
    const go = () => buttons[index] && buttons[index].activate();
    kb.on('keydown-ENTER', go);
    kb.on('keydown-SPACE', go);
    kb.on('keydown-J', go);
    refresh();
    return { refresh, get index() { return index; } };
}
