/**
 * GameScene — Partida: mapa (Tiled), protagonista, enemigos, proyectiles y cámara.
 * No conoce personajes ni mapas concretos: todo llega por datos (ids en `data` y content/).
 */
import { GAME_WIDTH, GAME_HEIGHT, DEFAULTS } from '../config.js';
import { mapKey, mapImageKey, effectsKey, tiledProp } from '../systems/ContentLoader.js';
import { CharacterRoleManager, ROLES } from '../systems/CharacterRoleManager.js';
import { ProjectilePool } from '../systems/ProjectilePool.js';
import { GAME_EVENTS, FIGHTER_EVENTS } from '../systems/GameEvents.js';
import { audio } from '../systems/AudioManager.js';
import { Controller } from '../input/Actions.js';
import { KeyboardControls, bindGlobalKeys } from '../input/KeyboardControls.js';
import { TouchProxy } from '../input/MobileControls.js';
import { DummyEnemyAI } from '../ai/DummyEnemyAI.js';
import { Projectile } from '../entities/Projectile.js';
import { GrenadePool } from '../systems/GrenadePool.js';
import { SpecialAbilitySystem } from '../systems/SpecialAbilitySystem.js';
import { EnemyAbilityDirector } from '../systems/EnemyAbilityDirector.js';
import { DifficultyManager } from '../systems/DifficultyManager.js';
import { SPECIAL_CHARGE_PER_KILL } from '../entities/Fighter.js';
import { showKillPopup, showEmote } from '../systems/FloatingText.js';

/** Granadas iniciales del protagonista. */
const PLAYER_GRENADES = 5;
/** Tiempo mínimo entre gestos de un mismo enemigo. */
const EMOTE_COOLDOWN_MS = 2500;
/** Separación horizontal entre enemigos de un mismo grupo. */
const GROUP_SPACING = 64;
import { textStyle } from './ui.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    init(data) {
        this.characterId = (data && data.characterId) || DEFAULTS.playerCharacterId;
        this.mapId = (data && data.mapId) || DEFAULTS.mapId;
        this.ended = false;
    }

    create() {
        const content = this.registry.get('content');
        this.content = content;
        this.roles = new CharacterRoleManager();
        this.roles.assign(this.characterId, ROLES.PLAYER);

        this.buildMap();
        this.projectiles = new ProjectilePool(this);
        this.fighters = [];
        this.grenades = new GrenadePool(this, () => this.fighters);
        this.specials = new SpecialAbilitySystem(this);
        this.spawnFromMap();
        this.enemyDirector = new EnemyAbilityDirector(this, () => this.enemies);
        this.setupCollisions();
        this.setupCamera();

        bindGlobalKeys(this, content.controls.global, { mute: () => audio.toggleMute() });
        audio.playMusicForScene('Game', tiledProp(this.mapEntry.data, 'music', null));

        // HUD en paralelo (también crea los controles táctiles)
        this.scene.launch('Hud');
        this.scene.bringToTop('Hud');
        this.events.on(GAME_EVENTS.REQUEST_PAUSE, this.openPause, this);
        // Pausa automática si la pestaña se oculta (p. ej. al cambiar de app en el móvil)
        this.game.events.on(Phaser.Core.Events.HIDDEN, this.onHidden, this);

        this.events.once('shutdown', this.cleanup, this);
        this.emitInitialState();
    }

    // ------------------------------------------------------------------ mapa

    buildMap() {
        this.mapEntry = this.content.maps.get(this.mapId) || [...this.content.maps.values()][0];
        const id = this.mapEntry.id;
        const raw = this.mapEntry.data;
        const map = this.make.tilemap({ key: mapKey(id) });
        this.map = map;

        const bg = tiledProp(raw, 'backgroundColor', '#1d2b3a');
        this.cameras.main.setBackgroundColor(bg);

        // Fondos parallax: capas de imagen de Tiled con parallaxx
        this.parallax = [];
        for (const layer of raw.layers) {
            if (layer.type !== 'imagelayer' || !layer.image || layer.visible === false) continue;
            const key = mapImageKey(id, layer.image);
            const ts = this.add
                .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, key)
                .setOrigin(0, 0)
                .setScrollFactor(0)
                .setAlpha(layer.opacity ?? 1)
                .setDepth(-10 + this.parallax.length);
            this.parallax.push({ sprite: ts, factor: layer.parallaxx ?? 1 });
        }

        const tilesets = raw.tilesets.map((ts) => map.addTilesetImage(ts.name, mapImageKey(id, ts.image)));
        this.ground = map.createLayer('ground', tilesets, 0, 0);
        this.ground.setCollisionByProperty({ collides: true });

        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    }

    // ------------------------------------------------------------------ personajes

    spawnFromMap() {
        const objects = (this.map.getObjectLayer('spawns') || { objects: [] }).objects;
        const playerSpawn = objects.find((o) => o.type === 'player' || o.name === 'player_spawn') || { x: 64, y: 64 };

        const playerDef = this.content.characters.get(this.characterId);
        const playerController = new Controller([
            new KeyboardControls(this, this.content.controls.keyboard),
            new TouchProxy(this.registry),
        ]);
        this.player = this.roles.createFighter(this, playerDef, ROLES.PLAYER, playerSpawn.x, playerSpawn.y, {
            controller: playerController,
            projectiles: this.projectiles,
            grenades: this.grenades,
            specials: this.specials,
            grenadeCount: PLAYER_GRENADES,
            nameColor: '#6fd0ff',
        });
        this.player.on(FIGHTER_EVENTS.DAMAGED, (f) => this.events.emit(GAME_EVENTS.PLAYER_HEALTH, f.health, f.stats.maxHealth));
        this.player.on(FIGHTER_EVENTS.STATS, (f) => this.events.emit(GAME_EVENTS.PLAYER_STATS, f));
        this.player.on(FIGHTER_EVENTS.DIED, (f, killer) => this.onPlayerDied(killer));
        this.fighters.push(this.player);

        this.enemies = [];
        // Cada punto de aparición crea un GRUPO de enemigos ("count": número o rango "2-3").
        // "random" (o sin characterId): personaje al azar entre los que pueden ser enemigos, nunca el protagonista.
        const groups = objects
            .filter((o) => o.type === 'enemy')
            .map((o) => ({ o, n: parseCount(tiledProp(o, 'count', 1)) }));
        const randomCount = groups
            .filter(({ o }) => (tiledProp(o, 'characterId') || 'random') === 'random')
            .reduce((sum, g) => sum + g.n, 0);
        const randomIds = this.roles.pickEnemyIds(this.content.characters, randomCount);
        for (const { o, n } of groups) {
            for (let k = 0; k < n; k++) {
                let charId = tiledProp(o, 'characterId') || 'random';
                if (charId === 'random') charId = randomIds.shift();
                const def = this.content.characters.get(charId);
                if (!def) {
                    console.warn(`[Game] Enemigo con personaje desconocido "${charId}"; se omite.`);
                    continue;
                }
                const x = o.x + (k - (n - 1) / 2) * GROUP_SPACING;
                const e = this.spawnEnemy(def, x, o.y, tiledProp(o, 'patrol', 3) * this.map.tileWidth);
                e.labelOffset = (k % 2) * 13; // alterna la altura del nombre dentro del grupo
            }
        }
    }

    /** Crea un enemigo con dificultad aleatoria. */
    spawnEnemy(def, x, y, patrolDistance) {
        const tier = DifficultyManager.pick();
        const ai = new DummyEnemyAI({
            getTarget: () => this.player,
            groundLayer: this.ground,
            patrolDistance,
            ...tier.ai,
        });
        const enemy = this.roles.createFighter(this, def, ROLES.ENEMY, x, y, {
            controller: new Controller([ai]),
            projectiles: this.projectiles,
            grenades: this.grenades,
            specials: this.specials,
            grenadeCount: Number.POSITIVE_INFINITY,
            modsOverride: tier.mods,
            nameColor: tier.nameColor,
        });
        enemy.difficulty = tier.id;
        enemy.facing = -1;
        enemy.nextEmoteAt = 0;
        ai.attach(enemy);
        enemy.on(FIGHTER_EVENTS.DIED, (f, killer) => this.onEnemyDied(f, killer));
        // Gesto (su símbolo) cuando acierta al protagonista
        enemy.on(FIGHTER_EVENTS.HIT, (att, victim) => {
            if (victim === this.player) this.enemyEmote(att);
        });
        this.enemies.push(enemy);
        this.fighters.push(enemy);
        return enemy;
    }

    enemyEmote(enemy) {
        const now = this.time.now;
        if (!enemy.active || now < enemy.nextEmoteAt) return;
        enemy.nextEmoteAt = now + EMOTE_COOLDOWN_MS;
        showEmote(this, enemy);
    }

    /** Personajes vivos hostiles para `fighter` (lo usan las habilidades). */
    hostilesOf(fighter) {
        return this.fighters.filter((o) => o.active && !o.dead && CharacterRoleManager.areHostile(fighter.team, o.team));
    }

    // ------------------------------------------------------------------ física

    setupCollisions() {
        // Plataformas "oneWay": solo se chocan al caer desde arriba
        const oneWayFilter = (obj, tile) => {
            if (!tile.properties || !tile.properties.oneWay) return true;
            const body = obj.body;
            return body.velocity.y >= 0 && body.prev.y + body.height <= tile.pixelY + 6;
        };
        this.physics.add.collider(this.fighters, this.ground, null, oneWayFilter, this);
        this.physics.add.collider(this.grenades.group, this.ground, null, oneWayFilter, this);

        // Proyectiles contra el escenario (atraviesan plataformas oneWay)
        this.physics.add.collider(
            this.projectiles.group,
            this.ground,
            (p) => this.impact(p),
            (p, tile) => !(tile.properties && tile.properties.oneWay),
            this
        );

        // Proyectiles contra personajes de bandos hostiles
        this.physics.add.overlap(
            this.projectiles.group,
            this.fighters,
            (a, b) => {
                const [p, f] = a instanceof Projectile ? [a, b] : [b, a];
                if (f.takeDamage(p.damage, p)) this.impact(p);
                else p.kill();
            },
            (a, b) => {
                const [p, f] = a instanceof Projectile ? [a, b] : [b, a];
                return p.active && !f.dead && p.owner !== f && CharacterRoleManager.areHostile(p.team, f.team);
            },
            this
        );
    }

    /** Pequeño destello en el punto de impacto y devuelve el proyectil a la reserva. */
    impact(p) {
        const spark = this.add.circle(p.x, p.y, 5, 0xfff3a0).setDepth(25);
        this.tweens.add({ targets: spark, scale: 2.2, alpha: 0, duration: 140, onComplete: () => spark.destroy() });
        p.kill();
    }

    setupCamera() {
        const cam = this.cameras.main;
        cam.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        cam.startFollow(this.player, true, 0.12, 0.12, 0, 40);
        cam.setDeadzone(140, 90);
        cam.setRoundPixels(true);
    }

    // ------------------------------------------------------------------ ciclo

    update(time, delta) {
        for (const f of this.fighters) {
            if (!f.active) continue;
            if (f.controller) f.controller.update(time, delta);
            f.update(time, delta);
        }
        if (!this.ended) this.enemyDirector.update(time);
        const cam = this.cameras.main;
        for (const p of this.parallax) p.sprite.tilePositionX = cam.scrollX * p.factor;

        if (!this.ended && this.player.controller && this.player.controller.actions.pressed.pause) {
            this.openPause();
        }
    }

    // ------------------------------------------------------------------ eventos de partida

    emitInitialState() {
        this.events.emit(GAME_EVENTS.PLAYER_READY, this.player);
        this.events.emit(GAME_EVENTS.PLAYER_HEALTH, this.player.health, this.player.stats.maxHealth);
        this.events.emit(GAME_EVENTS.ENEMIES_LEFT, this.aliveEnemies());
        this.events.emit(GAME_EVENTS.PLAYER_STATS, this.player);
    }

    aliveEnemies() {
        return this.enemies.filter((e) => !e.dead).length;
    }

    onEnemyDied(enemy, killer) {
        // Baja del protagonista: "+1" con su símbolo y carga de habilidad
        if (killer === this.player && !this.player.dead) {
            this.player.kills++;
            this.player.addSpecialCharge(SPECIAL_CHARGE_PER_KILL);
            showKillPopup(this, this.player);
        }
        const left = this.aliveEnemies();
        this.events.emit(GAME_EVENTS.ENEMIES_LEFT, left);
        // Tras la animación de muerte: humo y desaparición
        this.time.delayedCall(enemy.animDuration('death') + 700, () => {
            if (!enemy.active) return;
            const fx = enemy.def.effects;
            if (fx && fx.frames.smoke !== undefined) {
                const smoke = this.add.image(enemy.x, enemy.y - 20, effectsKey(enemy.def.id), fx.frames.smoke).setDepth(12).setAlpha(0.9);
                this.tweens.add({ targets: smoke, y: smoke.y - 30, alpha: 0, scale: 1.4, duration: 600, onComplete: () => smoke.destroy() });
            }
            this.tweens.add({
                targets: enemy,
                alpha: 0,
                duration: 400,
                onComplete: () => {
                    // Se modifica la lista en el sitio: los colisionadores guardan la referencia al array
                    const i = this.fighters.indexOf(enemy);
                    if (i >= 0) this.fighters.splice(i, 1);
                    enemy.destroy();
                },
            });
        });
        if (left === 0 && !this.ended) {
            this.ended = true;
            this.player.invulnerableUntil = Number.POSITIVE_INFINITY; // balas en vuelo ya no cuentan
            this.time.delayedCall(600, () => {
                this.player.celebrate();
                audio.sfx('victory');
                this.events.emit(GAME_EVENTS.LEVEL_CLEARED);
                this.showBanner('¡ZONA DESPEJADA!', 'Pulsa Esc o toca para volver al menú');
            });
        }
    }

    onPlayerDied(killer) {
        if (killer && killer.active) showEmote(this, killer);
        this.events.emit(GAME_EVENTS.PLAYER_HEALTH, 0, this.player.stats.maxHealth);
        if (this.ended) return;
        this.ended = true;
        this.events.emit(GAME_EVENTS.PLAYER_DEFEATED);
        this.time.delayedCall(this.player.animDuration('death') + 500, () => {
            this.showBanner('HAS CAÍDO', 'Pulsa Espacio / J o toca para reintentar', () => this.scene.restart());
        });
    }

    /** Mensaje central de fin de partida; la acción continúa con tecla o toque. */
    showBanner(title, subtitle, onContinue = () => this.exitToMenu()) {
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;
        const bg = this.add.rectangle(cx, cy, GAME_WIDTH, 150, 0x000000, 0.6).setScrollFactor(0).setDepth(100);
        const t1 = this.add.text(cx, cy - 22, title, textStyle(44, '#ffd34d')).setOrigin(0.5).setScrollFactor(0).setDepth(101);
        const t2 = this.add.text(cx, cy + 30, subtitle, textStyle(18)).setOrigin(0.5).setScrollFactor(0).setDepth(101);
        this.tweens.add({ targets: [bg, t1, t2], alpha: { from: 0, to: 1 }, duration: 250 });

        const done = () => {
            this.input.keyboard.off('keydown', onKey);
            this.input.off('pointerup', done);
            onContinue();
        };
        const onKey = (ev) => {
            if (['Space', 'KeyJ', 'Enter', 'Escape', 'KeyP'].includes(ev.code)) done();
        };
        // Pequeña espera para no tomar la última pulsación de la partida
        this.time.delayedCall(400, () => {
            this.input.keyboard.on('keydown', onKey);
            this.input.on('pointerup', done);
        });
    }

    openPause() {
        if (this.ended || !this.scene.isActive()) return;
        this.scene.pause();
        this.scene.launch('Pause');
        this.scene.bringToTop('Pause');
    }

    onHidden() {
        if (this.scene.isActive() && !this.ended) this.openPause();
    }

    exitToMenu() {
        this.scene.stop('Hud');
        this.scene.start('Menu');
    }

    cleanup() {
        this.game.events.off(Phaser.Core.Events.HIDDEN, this.onHidden, this);
        this.events.off(GAME_EVENTS.REQUEST_PAUSE, this.openPause, this);
        for (const f of [...this.fighters]) if (f.active) f.destroy();
        this.fighters.length = 0;
        this.scene.stop('Hud');
        audio.stopMusic();
    }
}

/** "count" de Tiled: número (2) o rango ("2-3"). */
function parseCount(v) {
    if (typeof v === 'number') return Math.max(1, Math.round(v));
    const m = /^(\d+)\s*-\s*(\d+)$/.exec(String(v));
    if (m) return Phaser.Math.Between(Number(m[1]), Number(m[2]));
    return Math.max(1, parseInt(v, 10) || 1);
}
