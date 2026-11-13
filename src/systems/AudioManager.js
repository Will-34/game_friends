/**
 * AudioManager.js — Música por escena y efectos de sonido.
 *
 * - Volumen independiente de música y efectos, y silencio global.
 * - Desbloqueo del audio con el primer toque/clic/tecla (requisito de iOS y Chrome).
 * - Música y efectos en archivos .ogg + .mp3 definidos en content/audio/audio.json.
 * - Si un efecto no tiene archivo, se usa su versión sintetizada (SynthSfx.js).
 *
 * No se guarda nada entre partidas (sin localStorage), según los requisitos.
 */
import { SYNTH_SFX } from './SynthSfx.js';

const musicKey = (id) => `music:${id}`;
const sfxKey = (id) => `sfx:${id}`;

/** Intervalo mínimo entre repeticiones del mismo efecto (evita saturar con ráfagas). */
const MIN_REPEAT_MS = 45;

export class AudioManager extends Phaser.Events.EventEmitter {
    constructor() {
        super();
        this.game = null;
        this.config = { music: {}, sfx: {}, sceneMusic: {} };
        this.ctx = null;
        this.sfxBus = null;
        this.muted = false;
        this.musicVolume = 0.5;
        this.sfxVolume = 0.8;
        this.currentMusicId = null;
        this.currentMusic = null;
        this.lastPlayed = new Map();
        this.unlocked = false;
    }

    /** @param {Phaser.Game} game  @param {object} config  contenido de audio.json */
    init(game, config) {
        this.game = game;
        this.config = {
            music: config.music || {},
            sfx: config.sfx || {},
            sceneMusic: config.sceneMusic || {},
        };
        if (typeof config.musicVolume === 'number') this.musicVolume = config.musicVolume;
        if (typeof config.sfxVolume === 'number') this.sfxVolume = config.sfxVolume;
        this._installUnlock();
    }

    /** Encola los archivos de audio declarados en audio.json (ambos formatos). */
    queueFiles(loader) {
        for (const [id, entry] of Object.entries(this.config.music)) {
            if (entry.files && entry.files.length) loader.audio(musicKey(id), entry.files);
        }
        for (const [id, entry] of Object.entries(this.config.sfx)) {
            if (entry.files && entry.files.length) loader.audio(sfxKey(id), entry.files);
        }
    }

    /**
     * Desbloqueo del audio en móviles:
     * - iOS/Android solo permiten sonar tras un gesto del usuario; se intenta en cada toque/tecla
     *   (touchstart, touchend, pointerup, click…) hasta que el contexto quede en "running".
     * - En cada intento se reproduce un búfer silencioso (truco necesario en iOS Safari).
     * - En iPhone, el interruptor de silencio apaga Web Audio; audioSession "playback" lo evita (iOS 17+).
     * - Al volver a la pestaña o tras una llamada, el contexto se reanuda.
     */
    _installUnlock() {
        try {
            if (navigator.audioSession) navigator.audioSession.type = 'playback';
        } catch (e) { /* no soportado */ }
        const events = ['touchstart', 'touchend', 'pointerdown', 'pointerup', 'mousedown', 'click', 'keydown'];
        const unlock = () => {
            const ctx = this._ensureContext();
            if (!ctx) return;
            this._kick(ctx);
            if (this.game && this.game.sound && this.game.sound.context && this.game.sound.context !== ctx) {
                this._kick(this.game.sound.context);
            }
            if (!this.unlocked) {
                this.unlocked = true;
                this.emit('unlocked');
                // Si una escena pidió música antes del desbloqueo, se inicia ahora.
                if (this.currentMusicId && !this.currentMusic) this._startMusic(this.currentMusicId);
            }
            if (ctx.state === 'running') events.forEach((e) => window.removeEventListener(e, unlock, true));
        };
        events.forEach((e) => window.addEventListener(e, unlock, { capture: true, passive: true }));
        // Si el sistema suspende el audio (pantalla apagada, llamada), se vuelve a pedir un gesto.
        const rearm = () => {
            if (document.visibilityState !== 'visible' || !this.ctx) return;
            this.ctx.resume().catch(() => {});
            if (this.ctx.state !== 'running') events.forEach((e) => window.addEventListener(e, unlock, { capture: true, passive: true }));
        };
        document.addEventListener('visibilitychange', rearm);
        window.addEventListener('pageshow', rearm);
    }

    /** Reanuda un contexto y reproduce un búfer silencioso (desbloqueo en iOS). */
    _kick(ctx) {
        try {
            if (ctx.state !== 'running') ctx.resume().catch(() => {});
            const buf = ctx.createBuffer(1, 1, 22050);
            const src = ctx.createBufferSource();
            src.buffer = buf;
            src.connect(ctx.destination);
            src.start(0);
        } catch (e) { /* ignorar */ }
    }

    /** Usa el contexto de Phaser si existe (un solo AudioContext); si no, crea uno propio. */
    _ensureContext() {
        if (this.ctx) return this.ctx;
        const phaserCtx = this.game && this.game.sound && this.game.sound.context;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!phaserCtx && !AC) return null;
        this.ctx = phaserCtx || new AC();
        this.sfxBus = this.ctx.createGain();
        this.sfxBus.gain.value = this.muted ? 0 : this.sfxVolume;
        this.sfxBus.connect(this.ctx.destination);
        return this.ctx;
    }

    /** Reproduce un efecto por nombre: shoot, jump, hit, explosion, death, ui, victory. */
    sfx(name) {
        if (this.muted || !this.unlocked) return;
        const now = performance.now();
        if (now - (this.lastPlayed.get(name) || 0) < MIN_REPEAT_MS) return;
        this.lastPlayed.set(name, now);

        const key = sfxKey(name);
        if (this.game && this.game.cache.audio.exists(key)) {
            const vol = (this.config.sfx[name].volume ?? 1) * this.sfxVolume;
            this.game.sound.play(key, { volume: vol });
            return;
        }
        const synth = SYNTH_SFX[name];
        const ctx = this.ctx;
        if (!synth || !ctx) return;
        if (ctx.state !== 'running') {
            // iOS puede dejarlo "suspended"/"interrupted": se intenta reanudar y se omite este efecto.
            ctx.resume().catch(() => {});
            return;
        }
        synth(ctx, this.sfxBus);
    }

    /** Cambia la música según la escena (clave en audio.json → sceneMusic) o un id explícito. */
    playMusicForScene(sceneKey, explicitId = null) {
        const id = explicitId || this.config.sceneMusic[sceneKey] || null;
        if (id === this.currentMusicId) return;
        this.stopMusic();
        this.currentMusicId = id;
        if (id && this.unlocked) this._startMusic(id);
    }

    _startMusic(id) {
        const key = musicKey(id);
        if (!this.game || !this.game.cache.audio.exists(key)) return; // sin archivo: silencio
        const entry = this.config.music[id] || {};
        this.currentMusic = this.game.sound.add(key, {
            loop: entry.loop !== false,
            volume: (entry.volume ?? 1) * this.musicVolume,
        });
        this.currentMusic.play();
    }

    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.stop();
            this.currentMusic.destroy();
        }
        this.currentMusic = null;
        this.currentMusicId = null;
    }

    setMuted(muted) {
        this.muted = !!muted;
        if (this.game) this.game.sound.mute = this.muted;
        if (this.sfxBus) this.sfxBus.gain.value = this.muted ? 0 : this.sfxVolume;
        this.emit('mute-changed', this.muted);
    }

    toggleMute() {
        this.setMuted(!this.muted);
        return this.muted;
    }

    setMusicVolume(v) {
        this.musicVolume = Phaser.Math.Clamp(v, 0, 1);
        if (this.currentMusic) {
            const entry = this.config.music[this.currentMusicId] || {};
            this.currentMusic.setVolume((entry.volume ?? 1) * this.musicVolume);
        }
    }

    setSfxVolume(v) {
        this.sfxVolume = Phaser.Math.Clamp(v, 0, 1);
        if (this.sfxBus && !this.muted) this.sfxBus.gain.value = this.sfxVolume;
    }
}

/** Instancia única compartida por todas las escenas. */
export const audio = new AudioManager();
