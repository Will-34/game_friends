/**
 * Actions.js — Acciones abstractas del juego.
 *
 * Teclado, controles táctiles e IA producen exactamente las mismas acciones.
 * Las entidades (Fighter) solo leen un ActionState y nunca saben quién las controla.
 *
 * Fuentes de acciones ("ActionSource"): cualquier objeto con un método
 *   read(raw, time, delta)
 * que ESCRIBE en `raw`:
 *   raw.moveX   (número entre -1 y 1; las fuentes se suman)
 *   raw.buttons (objeto { jump: true, shoot: true, ... }; las fuentes se combinan con OR)
 */

/** Acciones de tipo botón (pulsado / suelto). `moveX` es analógica y va aparte. */
export const BUTTON_ACTIONS = Object.freeze([
    'jump',
    'shoot',
    'crouch',
    'aimUp',
    'grenade',
    'special',
    'switchWeapon',
    'pause',
]);

/** Todas las acciones abstractas. */
export const ACTIONS = Object.freeze(['moveX', ...BUTTON_ACTIONS]);

/**
 * Estado de acciones de un frame. Calcula los flancos (pressed/released)
 * comparando con el frame anterior, para que ninguna fuente tenga que hacerlo.
 */
export class ActionState {
    constructor() {
        this.moveX = 0;
        this.held = {};
        this.pressed = {};
        this.released = {};
        for (const b of BUTTON_ACTIONS) {
            this.held[b] = false;
            this.pressed[b] = false;
            this.released[b] = false;
        }
    }

    /** Aplica una lectura cruda y actualiza los flancos. */
    apply(moveX, buttons) {
        this.moveX = Math.max(-1, Math.min(1, moveX));
        for (const b of BUTTON_ACTIONS) {
            const was = this.held[b];
            const now = !!buttons[b];
            this.pressed[b] = now && !was;
            this.released[b] = !now && was;
            this.held[b] = now;
        }
    }

    /** Suelta todo (por ejemplo, al pausar). */
    clear() {
        this.apply(0, {});
    }
}

/**
 * Controller — combina varias fuentes de acciones en un único ActionState.
 * Ejemplo: el jugador usa [teclado, táctil]; un enemigo usa [IA].
 */
export class Controller {
    /** @param {Array<{read: Function, destroy?: Function}>} sources */
    constructor(sources = []) {
        this.sources = sources;
        this.actions = new ActionState();
        this._raw = { moveX: 0, buttons: {} };
    }

    update(time, delta) {
        const raw = this._raw;
        raw.moveX = 0;
        for (const b of BUTTON_ACTIONS) raw.buttons[b] = false;
        for (const s of this.sources) s.read(raw, time, delta);
        this.actions.apply(raw.moveX, raw.buttons);
    }

    destroy() {
        for (const s of this.sources) if (typeof s.destroy === 'function') s.destroy();
        this.sources = [];
    }
}
