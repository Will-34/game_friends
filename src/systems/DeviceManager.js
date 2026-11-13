/**
 * DeviceManager.js — Todo lo específico de móviles en un solo lugar.
 *
 * - Detecta pantalla táctil (al cargar y, por si acaso, con el primer toque real).
 * - Juego en horizontal: pantalla completa + bloqueo de orientación donde el navegador lo permite
 *   (Android). En iPhone no existe esa API para páginas web: se muestra el aviso "Gira tu dispositivo".
 * - Aviso de orientación hecho en HTML/CSS (#rotate-overlay) para que se vea nítido en vertical;
 *   mientras se muestra, la partida queda en pausa.
 * - Zonas seguras (muesca, esquinas redondeadas) convertidas a coordenadas del juego.
 * - Evita el zoom accidental (doble toque, pellizco en iOS) y el menú contextual.
 */
import { FORCE_TOUCH } from '../config.js';

function detectTouch() {
    return (
        FORCE_TOUCH ||
        'ontouchstart' in window ||
        (navigator.maxTouchPoints || 0) > 0 ||
        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
    );
}

class DeviceManager extends Phaser.Events.EventEmitter {
    constructor() {
        super();
        this.game = null;
        this.touch = false;
        this.isIOS = false;
        this.rotateShown = false;
        this.pausedByRotate = false;
    }

    /** @param {Phaser.Game} game */
    init(game) {
        this.game = game;
        this.touch = detectTouch();
        const ua = navigator.userAgent || '';
        this.isIOS = /iP(hone|ad|od)/.test(ua) || (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);

        // Primer toque real: activa el modo táctil aunque la detección inicial haya fallado
        // (p. ej. al activar la emulación móvil del navegador con la página ya cargada).
        window.addEventListener(
            'touchstart',
            () => {
                if (this.touch) return;
                this.touch = true;
                this.emit('touch-detected');
                this.checkOrientation();
            },
            { passive: true, capture: true }
        );

        const check = () => this.checkOrientation();
        window.addEventListener('resize', check);
        window.addEventListener('orientationchange', check);
        game.events.once(Phaser.Core.Events.READY, check);

        // Sin zoom por pellizco (iOS ignora user-scalable=no) ni por doble toque, sin menú contextual
        document.addEventListener('gesturestart', (e) => e.preventDefault());
        let lastTouchEnd = 0;
        document.addEventListener(
            'touchend',
            (e) => {
                const now = Date.now();
                if (now - lastTouchEnd < 300) e.preventDefault();
                lastTouchEnd = now;
            },
            { passive: false }
        );
        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    isPortrait() {
        return window.innerHeight > window.innerWidth;
    }

    /** Elemento que pasa a pantalla completa (el contenedor del juego). */
    get fullscreenTarget() {
        return document.getElementById('game') || document.documentElement;
    }

    /** ¿Se puede poner el juego a pantalla completa? (no disponible en iPhone) */
    get fullscreenAvailable() {
        const el = this.fullscreenTarget;
        return !!(el.requestFullscreen || el.webkitRequestFullscreen);
    }

    get isFullscreen() {
        return !!(document.fullscreenElement || document.webkitFullscreenElement);
    }

    /**
     * Pantalla completa y horizontal. Debe llamarse dentro de un gesto del usuario (pointerup).
     * Si el navegador no lo permite o lo rechaza, no hace nada y no deja errores en consola.
     * (Se usa la API del navegador directamente para poder capturar el rechazo de la promesa.)
     */
    enterLandscapeFullscreen() {
        if (!this.touch) return;
        if (!this.fullscreenAvailable || this.isFullscreen) {
            this.lockLandscape();
            return;
        }
        const el = this.fullscreenTarget;
        try {
            const req = el.requestFullscreen || el.webkitRequestFullscreen;
            const p = req.call(el, { navigationUI: 'hide' });
            if (p && typeof p.then === 'function') p.then(() => this.lockLandscape()).catch(() => {});
            else this.lockLandscape();
        } catch (err) {
            // Sin pantalla completa: se juega igual (y se muestra el aviso si está en vertical)
        }
    }

    lockLandscape() {
        try {
            const o = window.screen && window.screen.orientation;
            if (o && typeof o.lock === 'function') o.lock('landscape').catch(() => {});
        } catch (err) {
            // Navegador sin bloqueo de orientación: se usa el aviso.
        }
    }

    toggleFullscreen() {
        if (!this.fullscreenAvailable) return;
        if (this.isFullscreen) {
            const exit = document.exitFullscreen || document.webkitExitFullscreen;
            try {
                const p = exit && exit.call(document);
                if (p && typeof p.catch === 'function') p.catch(() => {});
            } catch (err) {
                /* nada */
            }
        } else {
            const wasTouch = this.touch;
            this.touch = true; // el botón ⛶ también sirve en PC
            this.enterLandscapeFullscreen();
            this.touch = wasTouch;
        }
    }

    /** Muestra/oculta el aviso de girar y pausa/reanuda la partida. */
    checkOrientation() {
        const show = this.touch && this.isPortrait();
        if (show === this.rotateShown) return;
        this.rotateShown = show;
        document.body.classList.toggle('show-rotate', show);
        const sm = this.game && this.game.scene;
        if (!sm) return;
        if (show) {
            if (sm.isActive('Game')) {
                sm.pause('Game');
                this.pausedByRotate = true;
            }
        } else {
            if (this.pausedByRotate && sm.isPaused('Game') && !sm.isActive('Pause')) sm.resume('Game');
            this.pausedByRotate = false;
        }
        this.emit('orientation', show);
    }

    /**
     * Márgenes seguros (muesca, esquinas) en coordenadas del juego, descontando las franjas negras
     * que ya deja el escalado FIT.
     * @returns {{top:number,right:number,bottom:number,left:number}}
     */
    safeInsets() {
        const out = { top: 0, right: 0, bottom: 0, left: 0 };
        if (!this.game) return out;
        const css = getComputedStyle(document.documentElement);
        const read = (name) => parseFloat(css.getPropertyValue(name)) || 0;
        const sm = this.game.scale;
        const canvas = this.game.canvas;
        if (!canvas) return out;
        const rect = canvas.getBoundingClientRect();
        const k = sm.displayScale.x; // px del juego por px CSS
        out.left = Math.max(0, read('--safe-left') - rect.left) * k;
        out.right = Math.max(0, read('--safe-right') - (window.innerWidth - rect.right)) * k;
        out.top = Math.max(0, read('--safe-top') - rect.top) * sm.displayScale.y;
        out.bottom = Math.max(0, read('--safe-bottom') - (window.innerHeight - rect.bottom)) * sm.displayScale.y;
        return out;
    }
}

/** Instancia única. */
export const device = new DeviceManager();
