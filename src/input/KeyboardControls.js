/**
 * KeyboardControls.js — Fuente de acciones desde el teclado.
 * La asignación de teclas viene de content/config/controls.json (nunca fija en el código).
 */
import { BUTTON_ACTIONS } from './Actions.js';

/** Convierte nombres ("LEFT", "A", "SPACE") en objetos Key de Phaser. */
function makeKeys(scene, names = []) {
    const codes = Phaser.Input.Keyboard.KeyCodes;
    const keys = [];
    for (const name of names) {
        const code = codes[name];
        if (code === undefined) {
            console.warn(`[KeyboardControls] Tecla desconocida en controls.json: "${name}"`);
            continue;
        }
        keys.push(scene.input.keyboard.addKey(code, true));
    }
    return keys;
}

const anyDown = (keys) => keys.some((k) => k.isDown);

export class KeyboardControls {
    /**
     * @param {Phaser.Scene} scene
     * @param {object} keymap  sección "keyboard" de controls.json
     */
    constructor(scene, keymap) {
        this.left = makeKeys(scene, keymap.left);
        this.right = makeKeys(scene, keymap.right);
        this.buttons = {};
        for (const action of BUTTON_ACTIONS) {
            this.buttons[action] = makeKeys(scene, keymap[action]);
        }
    }

    read(raw) {
        if (anyDown(this.left)) raw.moveX -= 1;
        if (anyDown(this.right)) raw.moveX += 1;
        for (const action of BUTTON_ACTIONS) {
            if (anyDown(this.buttons[action])) raw.buttons[action] = true;
        }
    }
}

/**
 * Asocia teclas "globales" (no son acciones de personaje), como silenciar.
 * @param {Phaser.Scene} scene
 * @param {object} globalMap  sección "global" de controls.json
 * @param {Record<string, Function>} handlers  p. ej. { mute: () => audio.toggleMute() }
 */
export function bindGlobalKeys(scene, globalMap = {}, handlers = {}) {
    for (const [name, fn] of Object.entries(handlers)) {
        for (const key of makeKeys(scene, globalMap[name])) {
            key.on('down', fn);
        }
    }
}

/** Devuelve true si el evento de teclado corresponde a alguna tecla de la lista. */
export function matchesKey(event, names = []) {
    const codes = Phaser.Input.Keyboard.KeyCodes;
    return names.some((n) => codes[n] === event.keyCode);
}
