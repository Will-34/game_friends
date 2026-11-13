/**
 * MobileControls.js — Controles táctiles multitáctiles (versión básica de E1).
 *
 * Es una fuente de acciones más: produce moveX / jump / shoot / crouch / aimUp,
 * igual que el teclado. Se dibuja en la escena Hud (cámara fija) y el jugador
 * la lee a través de TouchProxy, que la busca en el registro del juego.
 *
 * E2 completará: granada, habilidad, cambio de arma, zonas seguras, ajustes de tamaño.
 */

export const TOUCH_REGISTRY_KEY = 'touchControls';

export class MobileControls {
    /**
     * @param {Phaser.Scene} scene  escena de HUD
     * @param {object} cfg  sección "touch" de controls.json
     */
    constructor(scene, cfg) {
        this.scene = scene;
        this.cfg = cfg;
        this.stick = cfg.stick;
        this.buttonDefs = cfg.buttons || [];
        this.state = { moveX: 0, buttons: {} };

        scene.input.addPointer(3); // hasta 4 dedos a la vez

        const g = scene.add.graphics().setDepth(1000).setScrollFactor(0);
        this.gfx = g;
        this.labels = this.buttonDefs.map((b) =>
            scene.add
                .text(b.x, b.y, b.label, { fontFamily: 'sans-serif', fontSize: '14px', color: '#ffffff' })
                .setOrigin(0.5)
                .setAlpha(0.8)
                .setDepth(1001)
        );
        this.knob = { x: this.stick.x, y: this.stick.y };
    }

    /** Lee los punteros activos y calcula las acciones. Se llama desde Hud.update(). */
    poll() {
        const s = this.stick;
        const st = this.state;
        st.moveX = 0;
        st.buttons = {};
        this.knob.x = s.x;
        this.knob.y = s.y;
        const pressed = new Set();

        for (const p of this.scene.input.manager.pointers) {
            if (!p.isDown) continue;
            // Joystick: el dedo que empezó en la mitad izquierda de la pantalla
            if (p.downX < this.scene.scale.gameSize.width * 0.45) {
                let dx = p.x - s.x;
                let dy = p.y - s.y;
                const len = Math.hypot(dx, dy);
                if (len > s.radius) {
                    dx = (dx / len) * s.radius;
                    dy = (dy / len) * s.radius;
                }
                this.knob.x = s.x + dx;
                this.knob.y = s.y + dy;
                if (dx > s.radius * 0.3) st.moveX = 1;
                else if (dx < -s.radius * 0.3) st.moveX = -1;
                if (dy > s.radius * 0.55) st.buttons.crouch = true;
                if (dy < -s.radius * 0.55) st.buttons.aimUp = true;
                continue;
            }
            // Botones: cualquier dedo dentro de su radio (con un margen generoso)
            for (const b of this.buttonDefs) {
                if (Math.hypot(p.x - b.x, p.y - b.y) <= b.radius * 1.25) {
                    st.buttons[b.action] = true;
                    pressed.add(b.action);
                }
            }
        }
        this.draw(pressed);
    }

    draw(pressed) {
        const g = this.gfx;
        const s = this.stick;
        g.clear();
        g.fillStyle(0xffffff, 0.12).fillCircle(s.x, s.y, s.radius);
        g.lineStyle(2, 0xffffff, 0.35).strokeCircle(s.x, s.y, s.radius);
        g.fillStyle(0xffffff, 0.4).fillCircle(this.knob.x, this.knob.y, s.radius * 0.42);
        for (const b of this.buttonDefs) {
            const on = pressed.has(b.action);
            g.fillStyle(on ? 0xffd34d : 0xffffff, on ? 0.45 : 0.16).fillCircle(b.x, b.y, b.radius);
            g.lineStyle(2, 0xffffff, 0.4).strokeCircle(b.x, b.y, b.radius);
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
