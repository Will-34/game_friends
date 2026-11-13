/**
 * MobileControls.js — Controles táctiles multitáctiles (E2).
 *
 * Es una fuente de acciones más: produce moveX / jump / shoot / crouch / aimUp / grenade / special,
 * igual que el teclado. Se dibuja en la escena Hud (cámara fija) y el jugador la lee a través de
 * TouchProxy, que la busca en el registro del juego.
 *
 * - Joystick flotante: aparece donde el pulgar toca la zona izquierda (o fijo si "floating": false).
 * - Botones anclados a la esquina inferior derecha ("right"/"bottom"), apartados de la muesca.
 * - Deslizar el dedo de un botón a otro funciona (se lee la posición de cada dedo en cada frame).
 * - Botones con "enabled": false se dibujan atenuados y no envían su acción.
 * - Vibración corta al pulsar (si el navegador la soporta; iPhone no).
 * Toda la disposición está en content/config/controls.json → "touch".
 */
import { device } from '../systems/DeviceManager.js';

export const TOUCH_REGISTRY_KEY = 'touchControls';

/** Altura superior reservada al HUD: los toques ahí no mueven el joystick. */
const HUD_TOP = 110;

export class MobileControls {
    /**
     * @param {Phaser.Scene} scene  escena de HUD
     * @param {object} cfg  sección "touch" de controls.json
     */
    constructor(scene, cfg) {
        this.scene = scene;
        this.cfg = cfg;
        this.stickCfg = { zoneWidth: 0.45, left: 130, bottom: 120, radius: 70, floating: true, ...cfg.stick };
        this.buttonDefs = (cfg.buttons || []).map((b) => ({ enabled: true, ...b }));
        this.opacity = cfg.opacity ?? 0.85;
        this.vibrateMs = cfg.vibrateMs ?? 12;
        this.state = { moveX: 0, buttons: {} };
        this.highlight = {}; // p. ej. { special: true } cuando la habilidad está lista
        this.prevPressed = new Set();

        this.stickPointerId = null;
        this.stickBase = null;
        this.knob = { x: 0, y: 0 };

        scene.input.addPointer(3); // hasta 4 dedos a la vez

        this.gfx = scene.add.graphics().setDepth(1000).setScrollFactor(0);
        this.labels = this.buttonDefs.map((b) =>
            scene.add
                .text(0, 0, b.label, { fontFamily: 'sans-serif', fontSize: b.radius >= 40 ? '14px' : '11px', color: '#ffffff' })
                .setOrigin(0.5)
                .setDepth(1001)
        );
        this.layout();
    }

    /** Calcula posiciones según el tamaño del juego y las zonas seguras. Se llama al redimensionar. */
    layout() {
        const W = this.scene.scale.gameSize.width;
        const H = this.scene.scale.gameSize.height;
        const safe = device.safeInsets();
        this.safe = safe;
        const s = this.stickCfg;
        this.stickHome = { x: s.left + safe.left, y: H - s.bottom - safe.bottom };
        this.zoneRight = W * s.zoneWidth;
        for (const [i, b] of this.buttonDefs.entries()) {
            b.x = W - b.right - safe.right;
            b.y = H - b.bottom - safe.bottom;
            this.labels[i].setPosition(b.x, b.y).setAlpha(b.enabled ? 0.9 : 0.35);
        }
    }

    /** Lee los punteros activos y calcula las acciones. Se llama desde Hud.update(). */
    poll() {
        const st = this.state;
        const s = this.stickCfg;
        st.moveX = 0;
        st.buttons = {};
        const pointers = this.scene.input.manager.pointers;

        // ---- Joystick: un dedo "dueño" mientras siga apoyado
        let stickPtr = this.stickPointerId !== null ? pointers.find((p) => p.id === this.stickPointerId && p.isDown) : null;
        if (!stickPtr) {
            this.stickPointerId = null;
            stickPtr = pointers.find((p) => p.isDown && p.downX < this.zoneRight && p.downY > HUD_TOP && !this.buttonAt(p.downX, p.downY));
            if (stickPtr) {
                this.stickPointerId = stickPtr.id;
                // Flotante: la base aparece donde se apoyó el pulgar (sin salirse de la pantalla)
                const H = this.scene.scale.gameSize.height;
                this.stickBase = s.floating
                    ? {
                          x: Phaser.Math.Clamp(stickPtr.downX, s.radius + this.safe.left, this.zoneRight - s.radius),
                          y: Phaser.Math.Clamp(stickPtr.downY, HUD_TOP + s.radius, H - s.radius - this.safe.bottom),
                      }
                    : { ...this.stickHome };
            }
        }
        const base = stickPtr ? this.stickBase : this.stickHome;
        this.knob.x = base.x;
        this.knob.y = base.y;
        if (stickPtr) {
            let dx = stickPtr.x - base.x;
            let dy = stickPtr.y - base.y;
            const len = Math.hypot(dx, dy);
            if (len > s.radius) {
                dx = (dx / len) * s.radius;
                dy = (dy / len) * s.radius;
            }
            this.knob.x = base.x + dx;
            this.knob.y = base.y + dy;
            if (dx > s.radius * 0.3) st.moveX = 1;
            else if (dx < -s.radius * 0.3) st.moveX = -1;
            if (dy > s.radius * 0.55) st.buttons.crouch = true;
            if (dy < -s.radius * 0.55) st.buttons.aimUp = true;
        }

        // ---- Botones: cualquier otro dedo encima (permite deslizar entre botones)
        const pressed = new Set();
        for (const p of pointers) {
            if (!p.isDown || p === stickPtr) continue;
            const b = this.buttonAt(p.x, p.y);
            if (!b) continue;
            pressed.add(b.action);
            if (b.enabled) st.buttons[b.action] = true;
        }
        // Vibración al empezar a pulsar un botón activo
        for (const a of pressed) {
            if (!this.prevPressed.has(a) && this.buttonDefs.find((b) => b.action === a && b.enabled)) this.vibrate();
        }
        this.prevPressed = pressed;
        this.draw(pressed, stickPtr ? base : null);
    }

    /** Botón bajo el punto (con un margen generoso), o null. */
    buttonAt(x, y) {
        let best = null;
        let bestD = Infinity;
        for (const b of this.buttonDefs) {
            const d = Math.hypot(x - b.x, y - b.y);
            if (d <= b.radius * 1.2 && d < bestD) {
                best = b;
                bestD = d;
            }
        }
        return best;
    }

    vibrate() {
        if (this.vibrateMs > 0 && navigator.vibrate) {
            try {
                navigator.vibrate(this.vibrateMs);
            } catch (e) {
                /* sin vibración */
            }
        }
    }

    draw(pressed, activeBase) {
        const g = this.gfx;
        const s = this.stickCfg;
        const o = this.opacity;
        g.clear();
        // Joystick: guía tenue en reposo; base completa mientras se usa
        const base = activeBase || this.stickHome;
        g.fillStyle(0xffffff, (activeBase ? 0.14 : 0.07) * o).fillCircle(base.x, base.y, s.radius);
        g.lineStyle(2, 0xffffff, (activeBase ? 0.4 : 0.2) * o).strokeCircle(base.x, base.y, s.radius);
        g.fillStyle(0xffffff, (activeBase ? 0.45 : 0.22) * o).fillCircle(this.knob.x, this.knob.y, s.radius * 0.42);

        const t = this.scene.time.now;
        for (const b of this.buttonDefs) {
            const on = pressed.has(b.action) && b.enabled;
            const glow = b.enabled && this.highlight[b.action] && Math.floor(t / 250) % 2 === 0;
            const fill = on ? 0xffd34d : glow ? 0x6fd0ff : 0xffffff;
            const alpha = !b.enabled ? 0.06 : on ? 0.45 : glow ? 0.4 : 0.16;
            g.fillStyle(fill, alpha * o).fillCircle(b.x, b.y, b.radius);
            g.lineStyle(2, glow ? 0xffd34d : 0xffffff, (b.enabled ? 0.45 : 0.18) * o).strokeCircle(b.x, b.y, b.radius);
        }
    }

    /** Implementación de ActionSource */
    read(raw) {
        raw.moveX += this.state.moveX;
        for (const [k, v] of Object.entries(this.state.buttons)) if (v) raw.buttons[k] = true;
    }

    destroy() {
        this.gfx.destroy();
        this.labels.forEach((l) => l.destroy());
    }
}

/**
 * TouchProxy — fuente de acciones que delega en los controles táctiles registrados
 * (si existen). Permite que el Game cree el controlador del jugador antes que el Hud.
 */
export class TouchProxy {
    constructor(registry) {
        this.registry = registry;
    }

    read(raw, time, delta) {
        const touch = this.registry.get(TOUCH_REGISTRY_KEY);
        if (touch) touch.read(raw, time, delta);
    }
}
