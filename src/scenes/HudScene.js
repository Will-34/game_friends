/**
 * HudScene — Interfaz sobre la partida: retrato, vida, habilidad, granadas, bajas, enemigos restantes,
 * barra del jefe, estado de los aliados, avisos centrales, pausa, silencio, pantalla completa y controles táctiles.
 *
 * Se adapta a móviles: respeta las zonas seguras (muesca), agranda los botones en pantallas táctiles
 * y crea los controles táctiles también si el primer toque llega después de cargar.
 */
import { GAME_WIDTH } from '../config.js';
import { GAME_EVENTS } from '../systems/GameEvents.js';
import { portraitKey } from '../systems/ContentLoader.js';
import { audio } from '../systems/AudioManager.js';
import { device } from '../systems/DeviceManager.js';
import { MobileControls, TOUCH_REGISTRY_KEY } from '../input/MobileControls.js';
import { textStyle } from './ui.js';

const BAR_W = 220;
const BAR_H = 16;
const BOSS_BAR_W = 260;

export class HudScene extends Phaser.Scene {
    constructor() {
        super('Hud');
    }

    create() {
        const content = this.registry.get('content');
        const game = this.scene.get('Game');
        this.content = content;

        // ---- Bloque izquierdo: retrato, nombre, vida, habilidad, granadas y bajas
        const left = 60;
        this.portrait = this.add.image(0, 0, '__DEFAULT').setOrigin(0, 0).setDisplaySize(52, 52).setVisible(false);
        this.nameText = this.add.text(left, 0, '', textStyle(18, '#ffffff'));
        const hpFrame = this.add.rectangle(left, 30, BAR_W + 4, BAR_H + 4, 0x000000, 0.7).setOrigin(0, 0).setStrokeStyle(2, 0xffffff, 0.8);
        this.healthBar = this.add.rectangle(left + 2, 32, BAR_W, BAR_H, 0x5ee06b).setOrigin(0, 0);
        this.healthText = this.add.text(left + BAR_W + 14, 28, '', textStyle(14, '#ffffff'));
        const spFrame = this.add.rectangle(left, 54, BAR_W + 4, 10, 0x000000, 0.7).setOrigin(0, 0).setStrokeStyle(1, 0xffffff, 0.6);
        this.specialBar = this.add.rectangle(left + 2, 56, 0, 6, 0x6fd0ff).setOrigin(0, 0);
        this.specialText = this.add.text(left + BAR_W + 14, 50, '', textStyle(12, '#6fd0ff'));
        this.grenadeText = this.add.text(left, 70, '', textStyle(13, '#ffffff'));
        this.killsText = this.add.text(left + 140, 70, '', textStyle(13, '#7dff8a'));
        this.weaponText = this.add.text(left, 88, '', textStyle(13, '#ffffff'));
        this.droneText = this.add.text(left, 106, '', textStyle(13, '#6fe8ff'));
        this.alliesText = this.add.text(left - 48, 126, '', textStyle(13, '#7dff8a'));
        this.leftGroup = this.add.container(0, 0, [
            this.portrait, this.nameText, hpFrame, this.healthBar, this.healthText,
            spFrame, this.specialBar, this.specialText, this.grenadeText, this.killsText, this.weaponText, this.droneText, this.alliesText,
        ]);

        // ---- Enemigos restantes
        this.enemiesText = this.add.text(GAME_WIDTH / 2, 16, '', textStyle(18, '#ffb3b3')).setOrigin(0.5, 0);

        // ---- Barra del jefe (oculta hasta que empieza el combate)
        const bw = BOSS_BAR_W;
        this.bossTitle = this.add.text(0, 0, '', textStyle(15, '#d7a6ff')).setOrigin(0.5, 0);
        const bossFrame = this.add.rectangle(0, 28, bw + 4, 14, 0x000000, 0.75).setStrokeStyle(2, 0xd7a6ff, 0.9);
        this.bossBar = this.add.rectangle(-bw / 2, 28, bw, 10, 0xb15cff).setOrigin(0, 0.5);
        this.bossGroup = this.add.container(GAME_WIDTH / 2 + 130, 42, [this.bossTitle, bossFrame, this.bossBar]).setVisible(false);

        // ---- Aviso central
        this.messageText = this.add
            .text(GAME_WIDTH / 2, 150, '', textStyle(26, '#ffd34d', { align: 'center', wordWrap: { width: GAME_WIDTH - 120 } }))
            .setOrigin(0.5)
            .setAlpha(0);

        // ---- Botones de la derecha (más grandes en táctil)
        this.rightButtons = [];
        this.pauseBtn = this.makeIconButton('II', () => game.events.emit(GAME_EVENTS.REQUEST_PAUSE));
        this.muteBtn = this.makeIconButton('', () => audio.toggleMute());
        if (device.fullscreenAvailable) {
            this.fsBtn = this.makeIconButton('⛶', () => device.toggleFullscreen());
        }
        const refreshMute = () => this.muteBtn.label.setText(audio.muted ? '🔇' : '🔊');
        refreshMute();
        audio.on('mute-changed', refreshMute);

        // ---- Controles táctiles (ahora o con el primer toque)
        this.touch = null;
        if (device.touch) this.createTouchControls();
        const onTouchDetected = () => this.createTouchControls();
        device.on('touch-detected', onTouchDetected);

        // ---- Disposición según tamaño de pantalla y zonas seguras
        this.layout();
        const onResize = () => this.layout();
        this.scale.on(Phaser.Scale.Events.RESIZE, onResize);
        document.addEventListener('fullscreenchange', onResize);

        // ---- Suscripción a eventos de la partida
        const onHealth = (hp, max) => this.setHealth(hp, max);
        const onReady = (player) => {
            this.nameText.setText(player.def.name.toUpperCase());
            const key = portraitKey(player.def.id);
            if (this.textures.exists(key)) this.portrait.setTexture(key).setDisplaySize(52, 52).setVisible(true);
        };
        const onEnemies = (n) => this.enemiesText.setText(n > 0 ? `ENEMIGOS: ${n}` : '');
        const onStats = (p) => this.setStats(p);
        const onBossStart = (boss, title) => {
            this.bossTitle.setText(title);
            this.bossGroup.setVisible(true).setAlpha(0);
            this.tweens.add({ targets: this.bossGroup, alpha: 1, duration: 400 });
        };
        const onBossHealth = (hp, max) => {
            this.bossBar.width = BOSS_BAR_W * Phaser.Math.Clamp(hp / max, 0, 1);
            this.bossBar.setFillStyle(hp / max > 0.5 ? 0xb15cff : 0xff4d6d);
        };
        const onBossEnd = () => this.tweens.add({ targets: this.bossGroup, alpha: 0, duration: 600, onComplete: () => this.bossGroup.setVisible(false) });
        const onAllies = (list) => this.setAllies(list);
        const onMessage = (text, color) => this.showMessage(text, color);
        game.events.on(GAME_EVENTS.PLAYER_HEALTH, onHealth);
        game.events.on(GAME_EVENTS.PLAYER_READY, onReady);
        game.events.on(GAME_EVENTS.ENEMIES_LEFT, onEnemies);
        game.events.on(GAME_EVENTS.PLAYER_STATS, onStats);
        game.events.on(GAME_EVENTS.BOSS_START, onBossStart);
        game.events.on(GAME_EVENTS.BOSS_HEALTH, onBossHealth);
        game.events.on(GAME_EVENTS.BOSS_END, onBossEnd);
        game.events.on(GAME_EVENTS.ALLIES_STATUS, onAllies);
        game.events.on(GAME_EVENTS.MESSAGE, onMessage);

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
            game.events.off(GAME_EVENTS.BOSS_START, onBossStart);
            game.events.off(GAME_EVENTS.BOSS_HEALTH, onBossHealth);
            game.events.off(GAME_EVENTS.BOSS_END, onBossEnd);
            game.events.off(GAME_EVENTS.ALLIES_STATUS, onAllies);
            game.events.off(GAME_EVENTS.MESSAGE, onMessage);
            audio.off('mute-changed', refreshMute);
            device.off('touch-detected', onTouchDetected);
            this.scale.off(Phaser.Scale.Events.RESIZE, onResize);
            document.removeEventListener('fullscreenchange', onResize);
            if (this.touch) this.touch.destroy();
            this.touch = null;
            this.registry.remove(TOUCH_REGISTRY_KEY);
        });
    }

    createTouchControls() {
        if (this.touch) return;
        this.touch = new MobileControls(this, this.content.controls.touch);
        this.registry.set(TOUCH_REGISTRY_KEY, this.touch);
        this.layout();
    }

    /** Coloca los bloques del HUD respetando las zonas seguras. */
    layout() {
        const safe = device.safeInsets();
        const W = this.scale.gameSize.width;
        this.leftGroup.setPosition(12 + safe.left, 10 + safe.top);
        const big = device.touch;
        const r = big ? 28 : 24;
        const gap = big ? 66 : 60;
        this.rightButtons.forEach((b, i) => {
            const x = W - 16 - r - safe.right - i * gap;
            const y = 14 + r + safe.top;
            b.setPosition(x, y);
            if (b.radius !== r) {
                b.setRadius(r);
                // La zona táctil se actualiza con el nuevo radio (los eventos del botón se conservan)
                b.removeInteractive();
                b.setInteractive({ hitArea: new Phaser.Geom.Circle(r, r, r), hitAreaCallback: Phaser.Geom.Circle.Contains, useHandCursor: true });
            }
            b.label.setPosition(x, y);
        });
        this.enemiesText.setY(16 + safe.top);
        this.bossGroup.setY(42 + safe.top);
        if (this.touch) this.touch.layout();
    }

    makeIconButton(label, onClick) {
        const bg = this.add.circle(0, 0, 24, 0x000000, 0.45).setStrokeStyle(2, 0xffffff, 0.6);
        const txt = this.add.text(0, 0, label, textStyle(18)).setOrigin(0.5);
        bg.setInteractive({ useHandCursor: true }).on('pointerup', onClick);
        bg.label = txt;
        this.rightButtons.push(bg);
        return bg;
    }

    setHealth(hp, max) {
        const ratio = Phaser.Math.Clamp(hp / max, 0, 1);
        this.healthBar.width = BAR_W * ratio;
        this.healthBar.setFillStyle(ratio > 0.5 ? 0x5ee06b : ratio > 0.25 ? 0xffc94d : 0xff5a5a);
        this.healthText.setText(`${Math.ceil(hp)} / ${max}`);
    }

    /** Aliados del combate final: vivos, cuánto les falta para volver o si ya no vuelven. */
    setAllies(list) {
        if (!list || list.length === 0) {
            this.alliesText.setText('');
            return;
        }
        const parts = list.map((a) => {
            const name = a.name.toUpperCase();
            if (a.alive) return `${name} ✔`;
            if (a.returnsIn > 0) return `${name} vuelve en ${a.returnsIn} s`;
            return `${name} ✖`;
        });
        this.alliesText.setText(`ALIADOS: ${parts.join('  ·  ')}`);
    }

    /** Aviso grande en el centro que se desvanece. */
    showMessage(text, color = '#ffd34d') {
        const t = this.messageText;
        this.tweens.killTweensOf(t);
        t.setText(text).setColor(color).setAlpha(1).setScale(0.8);
        this.tweens.add({ targets: t, scale: 1, duration: 200, ease: 'Back.easeOut' });
        this.tweens.add({ targets: t, alpha: 0, delay: 2200, duration: 500 });
    }

    /** Carga de habilidad, granadas y bajas del protagonista. */
    setStats(p) {
        this.specialReady = p.specialCharge >= 1;
        this.specialBar.width = BAR_W * p.specialCharge;
        const name = p.def.ability ? p.def.ability.name : 'Habilidad';
        const key = device.touch ? 'HABIL.' : 'L';
        this.specialText.setText(this.specialReady ? `${name.toUpperCase()} LISTA (${key})` : name);
        this.grenadeText.setText(device.touch ? `GRANADAS: ${p.grenades}` : `GRANADAS (U): ${p.grenades}`);
        this.killsText.setText(`BAJAS: ${p.kills}`);
        const w = p.currentWeapon();
        const ammo = Number.isFinite(w.ammo) ? ` ${w.ammo}` : ' ∞';
        const more = p.inventory.length > 1 ? (device.touch ? '  (ARMA: cambiar)' : '  (Q: cambiar)') : '';
        this.weaponText.setText(`${w.name.toUpperCase()}${ammo}${more}`).setColor(w.color || '#ffffff');
        if (this.touch) this.touch.highlight.special = this.specialReady;
    }

    update(time) {
        if (this.touch) this.touch.poll();
        // Dron: listo o segundos que faltan (se lee del protagonista; solo se redibuja si cambia)
        const game = this.scene.get('Game');
        const p = game && game.player;
        if (p && p.active) {
            const left = p.droneSecondsLeft(game.time.now);
            if (left !== this.lastDroneLeft) {
                this.lastDroneLeft = left;
                const name = (p.def.drone && p.def.drone.name) || 'Dron';
                const key = device.touch ? 'DRON' : 'E';
                this.droneText.setText(left === 0 ? `${name.toUpperCase()} LISTO (${key})` : `${name}: ${left} s`);
                this.droneText.setColor(left === 0 ? '#6fe8ff' : '#7f93ad');
                if (this.touch) this.touch.highlight.drone = left === 0;
            }
        }
        // La barra de habilidad parpadea cuando está lista
        const on = this.specialReady && Math.floor(time / 250) % 2 === 0;
        this.specialBar.setFillStyle(on ? 0xffd34d : 0x6fd0ff);
        this.specialText.setColor(this.specialReady ? '#ffd34d' : '#6fd0ff');
    }
}
