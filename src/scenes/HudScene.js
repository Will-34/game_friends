/**
 * HudScene — Interfaz sobre la partida: vida, enemigos restantes, pausa, silencio
 * y controles táctiles (si el dispositivo es táctil o ?touch=1).
 */
import { GAME_WIDTH, FORCE_TOUCH } from '../config.js';
import { GAME_EVENTS } from '../systems/GameEvents.js';
import { portraitKey } from '../systems/ContentLoader.js';
import { audio } from '../systems/AudioManager.js';
import { MobileControls, TOUCH_REGISTRY_KEY } from '../input/MobileControls.js';
import { textStyle } from './ui.js';

const BAR_W = 220;
const BAR_H = 16;

export class HudScene extends Phaser.Scene {
    constructor() {
        super('Hud');
    }

    create() {
        const content = this.registry.get('content');
        const game = this.scene.get('Game');

        // ---- Retrato, nombre y vida del protagonista
        this.portrait = this.add.image(16, 12, '__DEFAULT').setOrigin(0, 0).setDisplaySize(52, 52).setVisible(false);
        const left = 76;
        this.nameText = this.add.text(left, 12, '', textStyle(18, '#ffffff'));
        this.add.rectangle(left, 42, BAR_W + 4, BAR_H + 4, 0x000000, 0.7).setOrigin(0, 0).setStrokeStyle(2, 0xffffff, 0.8);
        this.healthBar = this.add.rectangle(left + 2, 44, BAR_W, BAR_H, 0x5ee06b).setOrigin(0, 0);
        this.healthText = this.add.text(left + BAR_W + 14, 40, '', textStyle(14, '#ffffff'));

        // ---- Habilidad especial (se carga con 2 bajas), granadas y bajas
        this.add.rectangle(left, 66, BAR_W + 4, 10, 0x000000, 0.7).setOrigin(0, 0).setStrokeStyle(1, 0xffffff, 0.6);
        this.specialBar = this.add.rectangle(left + 2, 68, 0, 6, 0x6fd0ff).setOrigin(0, 0);
        this.specialText = this.add.text(left + BAR_W + 14, 62, '', textStyle(12, '#6fd0ff'));
        this.grenadeText = this.add.text(left, 82, '', textStyle(13, '#ffffff'));
        this.killsText = this.add.text(left + 120, 82, '', textStyle(13, '#7dff8a'));

        // ---- Enemigos restantes
        this.enemiesText = this.add.text(GAME_WIDTH / 2, 16, '', textStyle(18, '#ffb3b3')).setOrigin(0.5, 0);

        // ---- Botones de pausa y silencio (funcionan con ratón y táctil)
        this.pauseBtn = this.makeIconButton(GAME_WIDTH - 40, 34, 'II', () => game.events.emit(GAME_EVENTS.REQUEST_PAUSE));
        this.muteBtn = this.makeIconButton(GAME_WIDTH - 100, 34, '', () => audio.toggleMute());
        const refreshMute = () => this.muteBtn.label.setText(audio.muted ? '🔇' : '🔊');
        refreshMute();
        audio.on('mute-changed', refreshMute);

        // ---- Controles táctiles
        this.touch = null;
        if (this.sys.game.device.input.touch || FORCE_TOUCH) {
            this.touch = new MobileControls(this, content.controls.touch);
            this.registry.set(TOUCH_REGISTRY_KEY, this.touch);
        }

        // ---- Suscripción a eventos de la partida
        const onHealth = (hp, max) => this.setHealth(hp, max);
        const onReady = (player) => {
            this.nameText.setText(player.def.name.toUpperCase());
            const key = portraitKey(player.def.id);
            if (this.textures.exists(key)) this.portrait.setTexture(key).setDisplaySize(52, 52).setVisible(true);
        };
        const onEnemies = (n) => this.enemiesText.setText(n > 0 ? `ENEMIGOS: ${n}` : '');
        const onStats = (p) => this.setStats(p);
        game.events.on(GAME_EVENTS.PLAYER_HEALTH, onHealth);
        game.events.on(GAME_EVENTS.PLAYER_READY, onReady);
        game.events.on(GAME_EVENTS.ENEMIES_LEFT, onEnemies);
        game.events.on(GAME_EVENTS.PLAYER_STATS, onStats);

        // El Game emite su estado inicial en create(); si ya ocurrió, se lee directamente.
        if (game.player) {
            onReady(game.player);
            onHealth(game.player.health, game.player.stats.maxHealth);
            onEnemies(game.aliveEnemies());
            onStats(game.player);
        }

        this.events.once('shutdown', () => {
            game.events.off(GAME_EVENTS.PLAYER_HEALTH, onHealth);
            game.events.off(GAME_EVENTS.PLAYER_READY, onReady);
            game.events.off(GAME_EVENTS.ENEMIES_LEFT, onEnemies);
            game.events.off(GAME_EVENTS.PLAYER_STATS, onStats);
            audio.off('mute-changed', refreshMute);
            if (this.touch) this.touch.destroy();
            this.touch = null;
            this.registry.remove(TOUCH_REGISTRY_KEY);
        });
    }

    makeIconButton(x, y, label, onClick) {
        const bg = this.add.circle(x, y, 24, 0x000000, 0.45).setStrokeStyle(2, 0xffffff, 0.6);
        const txt = this.add.text(x, y, label, textStyle(18)).setOrigin(0.5);
        bg.setInteractive({ useHandCursor: true }).on('pointerup', onClick);
        bg.label = txt;
        return bg;
    }

    setHealth(hp, max) {
        const ratio = Phaser.Math.Clamp(hp / max, 0, 1);
        this.healthBar.width = BAR_W * ratio;
        this.healthBar.setFillStyle(ratio > 0.5 ? 0x5ee06b : ratio > 0.25 ? 0xffc94d : 0xff5a5a);
        this.healthText.setText(`${Math.ceil(hp)} / ${max}`);
    }

    /** Carga de habilidad, granadas y bajas del protagonista. */
    setStats(p) {
        this.specialReady = p.specialCharge >= 1;
        this.specialBar.width = BAR_W * p.specialCharge;
        const name = p.def.ability ? p.def.ability.name : 'Habilidad';
        this.specialText.setText(this.specialReady ? `${name.toUpperCase()} LISTA (L)` : name);
        this.grenadeText.setText(`GRANADAS (U): ${p.grenades}`);
        this.killsText.setText(`BAJAS: ${p.kills}`);
    }

    update(time) {
        if (this.touch) this.touch.poll();
        // La barra de habilidad parpadea cuando está lista
        if (this.specialBar) {
            const on = this.specialReady && Math.floor(time / 250) % 2 === 0;
            this.specialBar.setFillStyle(on ? 0xffd34d : 0x6fd0ff);
            this.specialText.setColor(this.specialReady ? '#ffd34d' : '#6fd0ff');
        }
    }
}
