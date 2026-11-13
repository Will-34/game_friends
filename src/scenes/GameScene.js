/**
 * GameScene — Partida: mapa (Tiled), protagonista, enemigos, jefe, aliados, proyectiles y cámara.
 * No conoce personajes ni mapas concretos: todo llega por datos (ids en `data` y content/).
 *
 * Flujo de un nivel con jefe (E5): enemigos del nivel → se abre la arena → jefe + escoltas
 * y llegan 2 aliados → fase 2 con refuerzos → victoria y paso al siguiente nivel.
 * Un mapa sin objetos `arena`/`boss` se gana eliminando a todos los enemigos (como antes).
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
import { EnemyAI } from '../ai/EnemyAI.js';
import { PickupManager } from '../systems/PickupManager.js';
import { Projectile } from '../entities/Projectile.js';
import { GrenadePool } from '../systems/GrenadePool.js';
import { SpecialAbilitySystem } from '../systems/SpecialAbilitySystem.js';
import { EnemyAbilityDirector } from '../systems/EnemyAbilityDirector.js';
import { DifficultyManager, DIFFICULTY_TIERS } from '../systems/DifficultyManager.js';
import { SPECIAL_CHARGE_PER_KILL } from '../entities/Fighter.js';
import { showKillPopup, showEmote, showSpeech } from '../systems/FloatingText.js';
import { levelInfo, nextLevelId } from '../systems/LevelCatalog.js';
import { textStyle } from './ui.js';

/** Granadas iniciales del protagonista. */
const PLAYER_GRENADES = 5;
/** Tiempo mínimo entre gestos de un mismo enemigo. */
const EMOTE_COOLDOWN_MS = 2500;
/** Separación horizontal entre enemigos de un mismo grupo. */
const GROUP_SPACING = 64;
/** Escala del jefe. */
const BOSS_SCALE = 1.5;
/** Rango (ms) de espera para que un aliado caído vuelva. */
const ALLY_RETURN_MS = [5000, 10000];
/** Cada cuánto daña un tile de peligro a quien lo pisa. */
const HAZARD_TICK_MS = 600;

export class GameScene extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    init(data) {
        this.characterId = (data && data.characterId) || DEFAULTS.playerCharacterId;
        this.mapId = (data && data.mapId) || DEFAULTS.mapId;
        this.checkpoint = (data && data.checkpoint) || null;
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
        this.enemies = [];
        this.allies = [];
        this.allySlots = [];
        this.grenades = new GrenadePool(this, () => this.fighters);
        this.specials = new SpecialAbilitySystem(this);
        this.pickups = new PickupManager(this, this.content.weapons);
        this.startedAt = this.time.now;
        this.spawnFromMap();
        this.enemyDirector = new EnemyAbilityDirector(this, () => this.enemies);
        this.allyDirector = new EnemyAbilityDirector(this, () => this.allies, { minGapMs: 8000, maxGapMs: 14000, firstDelayMs: 5000 });
        this.setupCollisions();
        this.setupCamera();
        this.setupArena();

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
        this.mapId = this.mapEntry.id;
        const id = this.mapEntry.id;
        const raw = this.mapEntry.data;
        this.level = levelInfo(this.mapEntry);
        this.prop = (name, fallback) => tiledProp(raw, name, fallback);
        this.difficultyWeights = DifficultyManager.parseWeights(this.prop('difficulty', ''));
        const map = this.make.tilemap({ key: mapKey(id) });
        this.map = map;

        const bg = this.prop('backgroundColor', '#1d2b3a');
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
        this.arenaObj = objects.find((o) => o.type === 'arena') || null;
        this.bossObj = objects.find((o) => o.type === 'boss') || null;
        this.hasBoss = !!(this.arenaObj && this.bossObj);
        const fromBoss = this.hasBoss && this.checkpoint === 'boss';

        let playerSpawn = objects.find((o) => o.type === 'player' || o.name === 'player_spawn') || { x: 64, y: 64 };
        if (fromBoss) playerSpawn = { x: this.arenaObj.x + 96, y: this.arenaObj.y };

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
            weapons: this.content.weapons,
            nameColor: '#6fd0ff',
        });
        this.player.on(FIGHTER_EVENTS.DAMAGED, (f) => this.events.emit(GAME_EVENTS.PLAYER_HEALTH, f.health, f.stats.maxHealth));
        this.player.on(FIGHTER_EVENTS.STATS, (f) => this.events.emit(GAME_EVENTS.PLAYER_STATS, f));
        this.player.on(FIGHTER_EVENTS.DIED, (f, killer) => this.onPlayerDied(killer));
        this.fighters.push(this.player);

        // Al reintentar desde el jefe no vuelven los enemigos del nivel
        if (fromBoss) return;

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
                e.isLevelEnemy = true;
            }
        }
    }

    /**
     * Crea un enemigo. Normal: dificultad aleatoria según los pesos del mapa. Jefe: escala, vida y IA propias.
     * @param {object} [opts] { boss: bool, title }
     */
    spawnEnemy(def, x, y, patrolDistance, opts = {}) {
        const boss = !!opts.boss;
        const tier = boss ? { id: 'jefe', ...DIFFICULTY_TIERS.dificil } : DifficultyManager.pick(this.difficultyWeights);
        let self = null;
        const aiOpts = boss
            ? { ...tier.ai, sightRange: 960, verticalSight: 320, leash: 1000, reactionMs: 200, grenadeEveryMs: 5200, preferredRange: 320, burstMs: 800, restMs: 950, chaseSpeed: 0.7 }
            : tier.ai;
        const ai = new EnemyAI({
            getTarget: () => this.nearestHostile(self),
            getPeers: () => this.enemies,
            groundLayer: this.ground,
            patrolDistance,
            ...aiOpts,
        });
        const mods = boss
            ? { health: Math.max(1, this.prop('bossHealth', 6)), bulletSpeed: 0.75, fireRate: 0.95, damage: 1.1, stunMs: 0, invulnerableMs: 40, tint: 0xdcb8ff }
            : tier.mods;
        const enemy = this.roles.createFighter(this, def, ROLES.ENEMY, x, y, {
            controller: new Controller([ai]),
            projectiles: this.projectiles,
            grenades: this.grenades,
            specials: this.specials,
            grenadeCount: Number.POSITIVE_INFINITY,
            weapons: this.content.weapons,
            modsOverride: mods,
            nameColor: boss ? '#d7a6ff' : tier.nameColor,
            title: opts.title,
            scale: boss ? BOSS_SCALE : 1,
        });
        self = enemy;
        enemy.ai = ai;
        enemy.isBoss = boss;
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

    /** Aliado controlado por IA que sigue al protagonista y ataca al hostil más cercano. */
    spawnAlly(slot, x, y) {
        let self = null;
        const ai = new EnemyAI({
            getTarget: () => this.nearestHostile(self),
            getPeers: () => this.allies,
            getLeader: () => this.player,
            groundLayer: this.ground,
            patrolDistance: 60,
            sightRange: 640,
            verticalSight: 260,
            burstMs: 650,
            restMs: 800,
            reactionMs: 220,
            leash: 460,
            preferredRange: 230,
            chaseSpeed: 0.9,
            followDistance: 90 + this.allySlots.indexOf(slot) * 50,
        });
        const ally = this.roles.createFighter(this, slot.def, ROLES.ALLY, x, y, {
            controller: new Controller([ai]),
            projectiles: this.projectiles,
            grenades: this.grenades,
            specials: this.specials,
            grenadeCount: 0,
            weapons: this.content.weapons,
            nameColor: '#7dff8a',
        });
        self = ally;
        ai.attach(ally);
        ally.slot = slot;
        slot.fighter = ally;
        slot.returnAt = 0;
        ally.on(FIGHTER_EVENTS.DIED, () => this.onAllyDied(ally));
        this.allies.push(ally);
        this.fighters.push(ally);
        this.emitAllies();
        return ally;
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

    /** Hostil vivo más cercano (objetivo de la IA). */
    nearestHostile(fighter) {
        if (!fighter || !fighter.active) return null;
        let best = null;
        let bestD = Infinity;
        for (const o of this.fighters) {
            if (!o.active || o.dead || !CharacterRoleManager.areHostile(fighter.team, o.team)) continue;
            const d = Math.abs(o.x - fighter.x) + Math.abs(o.y - fighter.y) * 1.5;
            if (d < bestD) {
                bestD = d;
                best = o;
            }
        }
        return best;
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
        this.physics.add.collider(this.pickups.group, this.ground, null, oneWayFilter, this);
        this.physics.add.overlap(this.player, this.pickups.group, (a, b) => this.pickups.collect(this.player, a === this.player ? b : a));

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
                if (p.pierce) {
                    // Atraviesa (lanzallamas): daña una sola vez a cada personaje y sigue
                    p.hitSet.add(f);
                    f.takeDamage(p.damage, p);
                    return;
                }
                if (f.takeDamage(p.damage, p)) this.impact(p);
                else p.kill();
            },
            (a, b) => {
                const [p, f] = a instanceof Projectile ? [a, b] : [b, a];
                return (
                    p.active && !f.dead && p.owner !== f && !p.hitSet.has(f) && CharacterRoleManager.areHostile(p.team, f.team)
                );
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

    // ------------------------------------------------------------------ terreno especial (H-053)

    /** Rebote (toldos, llantas), terreno lento (charco, arena movediza) y peligros (parrilla, laguna, curichi). */
    applyTerrain(f, time) {
        if (f.dead || !f.body || !f.body.blocked.down) return;
        const tile = this.ground.getTileAtWorldXY(f.x, f.y + 2);
        const p = tile && tile.properties;
        if (!p) return;
        if (p.bounce) {
            f.body.setVelocityY(-p.bounce);
            audio.sfx('jump');
            return;
        }
        if (p.slow) f.addBuff({ id: 'terrain', durationMs: 150, speedMul: p.slow, jumpMul: 0.85 });
        if (p.hazard && time >= (f.nextHazardAt || 0)) {
            f.nextHazardAt = time + HAZARD_TICK_MS;
            if (f.takeDamage(p.hazard, null) && !f.dead) f.body.setVelocityY(-330);
        }
    }

    // ------------------------------------------------------------------ arena del jefe (H-057)

    setupArena() {
        this.bossStarted = false;
        this.arenaOpen = false;
        this.nextHintAt = 0;
        if (!this.hasBoss) return;
        this.arenaX = this.arenaObj.x - this.map.tileWidth / 2;
        const h = this.map.heightInPixels;
        const groundY = this.arenaObj.y;

        // Barrera: cinta de peligro + campo semitransparente; solo frena al protagonista
        const g = this.add.graphics().setDepth(8);
        g.fillStyle(0xffd34d, 0.12).fillRect(this.arenaX - 10, 0, 20, h);
        for (let y = groundY - 220, i = 0; y < groundY; y += 16, i++) {
            g.fillStyle(i % 2 ? 0x1b1b1b : 0xffd34d, 1).fillRect(this.arenaX - 6, y, 12, 16);
        }
        g.fillStyle(0xffd34d, 1).fillRect(this.arenaX - 70, groundY - 150, 140, 22);
        const sign = this.add.text(this.arenaX, groundY - 139, 'NO PASAR', textStyle(14, '#1b1b1b', { stroke: '#ffd34d', strokeThickness: 1 })).setOrigin(0.5).setDepth(8);
        this.barrierGfx = [g, sign];
        this.barrier = this.add.zone(this.arenaX - 10, 0, 20, h).setOrigin(0, 0);
        this.physics.add.existing(this.barrier, true);
        this.barrierCollider = this.physics.add.collider(this.player, this.barrier);

        if (this.checkpoint === 'boss' || this.aliveLevelEnemies() === 0) this.openArena(true);
    }

    aliveLevelEnemies() {
        return this.enemies.filter((e) => e.isLevelEnemy && !e.dead).length;
    }

    /** El nivel quedó despejado: cae la barrera y una flecha señala al jefe. */
    openArena(silent = false) {
        if (this.arenaOpen || !this.hasBoss) return;
        this.arenaOpen = true;
        if (this.barrierCollider) this.physics.world.removeCollider(this.barrierCollider);
        if (this.barrier) this.barrier.destroy();
        for (const o of this.barrierGfx || []) this.tweens.add({ targets: o, alpha: 0, duration: 500, onComplete: () => o.destroy() });
        if (!silent) this.message('¡ZONA DESPEJADA! Avanzá hacia el jefe →', '#7dff8a');
        this.arrow = this.add.text(this.arenaX + 90, this.arenaObj.y - 150, 'JEFE →', textStyle(26, '#ffd34d')).setOrigin(0.5).setDepth(40);
        this.tweens.add({ targets: this.arrow, x: this.arrow.x + 24, duration: 450, yoyo: true, repeat: -1 });
    }

    /** Aviso si el protagonista intenta entrar a la arena antes de tiempo. */
    checkArena(time) {
        if (!this.hasBoss || this.bossStarted || this.ended) return;
        if (!this.arenaOpen) {
            if (this.player.x > this.arenaX - 60 && time >= this.nextHintAt) {
                this.nextHintAt = time + 3000;
                const n = this.aliveLevelEnemies();
                this.message(`¡Faltan ${n}, chango! Bajalos a todos primero.`, '#ffb3b3');
            }
            return;
        }
        if (this.player.x >= this.arenaX + GAME_WIDTH / 2 - 40 && !this.player.dead) this.startBoss();
    }

    /** Empieza el combate: cámara fija en la arena, jefe, escoltas y aliados. */
    startBoss() {
        this.bossStarted = true;
        if (this.arrow) this.arrow.destroy();
        const h = this.map.heightInPixels;
        const ax = this.arenaX;
        this.physics.world.setBounds(ax, 0, GAME_WIDTH, h);
        const cam = this.cameras.main;
        cam.stopFollow();
        cam.pan(ax + GAME_WIDTH / 2, cam.midPoint.y, 600, 'Sine.easeInOut', true, (c, progress) => {
            if (progress < 1) return;
            cam.setBounds(ax, 0, GAME_WIDTH, h);
            cam.startFollow(this.player, true, 0.12, 0.12, 0, 40);
        });

        // Reparto: aliados primero (para que el jefe y las escoltas no los repitan)
        const nAllies = Math.max(0, this.prop('allies', 2));
        const allyIds = this.roles.pickIds(this.content.characters, nAllies);
        const [bossId] = this.roles.pickEnemyIds(this.content.characters, 1, allyIds);
        const escorts = Math.max(0, this.prop('bossEscorts', 1));
        this.reinforcements = Math.max(0, this.prop('bossReinforcements', 2));
        this.escortPool = [...allyIds, bossId];

        const bossDef = this.content.characters.get(bossId);
        const groundY = this.bossObj.y;
        const title = this.level.bossName || 'JEFE';
        this.boss = this.spawnEnemy(bossDef, this.bossObj.x, groundY - 260, 240, { boss: true, title: `★ ${bossDef.name.toUpperCase()} ★` });
        this.boss.on(FIGHTER_EVENTS.DAMAGED, (f) => {
            this.events.emit(GAME_EVENTS.BOSS_HEALTH, f.health, f.stats.maxHealth);
            if (!this.bossEnraged && !f.dead && f.health <= f.stats.maxHealth / 2) this.enrageBoss();
        });
        this.events.emit(GAME_EVENTS.BOSS_START, this.boss, `${title} · ${bossDef.name.toUpperCase()}`);
        this.events.emit(GAME_EVENTS.BOSS_HEALTH, this.boss.health, this.boss.stats.maxHealth);
        audio.sfx('special');
        this.cameras.main.shake(300, 0.006);
        if (this.level.bossTaunt) this.time.delayedCall(900, () => this.boss.active && !this.boss.dead && showSpeech(this, this.boss, this.level.bossTaunt, 3200));
        this.spawnEscorts(escorts, 700);

        // Aliados: entran por la izquierda de la arena
        const respawns = Math.max(0, this.prop('allyRespawns', 2));
        allyIds.forEach((id, i) => {
            const def = this.content.characters.get(id);
            if (!def) return;
            const slot = { def, respawnsLeft: respawns, fighter: null, returnAt: 0 };
            this.allySlots.push(slot);
            this.time.delayedCall(1300 + i * 500, () => {
                if (this.ended) return;
                const a = this.spawnAlly(slot, ax + 40 + i * 60, this.player.y - 220);
                if (i === 0) showSpeech(this, a, '¡Llegamos, chango! ¡Vamos con todo!', 2400, '#14532d');
            });
        });
        this.events.emit(GAME_EVENTS.ENEMIES_LEFT, this.aliveEnemies());
    }

    /** Escoltas/refuerzos del jefe: caen desde arriba a los lados de la arena. */
    spawnEscorts(n, delay = 0) {
        if (n <= 0) return;
        const ids = this.roles.pickEnemyIds(this.content.characters, n, this.escortPool);
        ids.forEach((id, i) => {
            this.time.delayedCall(delay + i * 350, () => {
                if (this.ended) return;
                const def = this.content.characters.get(id);
                if (!def) return;
                const side = i % 2 === 0 ? 1 : -1;
                const x = this.arenaX + GAME_WIDTH / 2 + side * (200 + Math.random() * 180);
                const e = this.spawnEnemy(def, x, this.bossObj.y - 300, 160);
                e.labelOffset = (i % 2) * 13;
                this.events.emit(GAME_EVENTS.ENEMIES_LEFT, this.aliveEnemies());
            });
        });
    }

    /** Fase 2: el jefe se enfurece, usa su habilidad y llegan refuerzos. */
    enrageBoss() {
        this.bossEnraged = true;
        const b = this.boss;
        b.ai.restMs *= 0.55;
        b.ai.burstMs *= 1.3;
        b.ai.chaseSpeed = 0.9;
        b.ai.grenadeEveryMs = 3800;
        b.addBuff({ id: 'enrage', durationMs: 10 * 60 * 1000, speedMul: 1.15, aura: '#ff4d6d' });
        this.message(`¡${this.level.bossName || 'EL JEFE'} SE PICÓ!`, '#ff6b6b');
        this.cameras.main.shake(250, 0.008);
        b.tryUseSpecial(this.time.now, true);
        this.spawnEscorts(this.reinforcements, 400);
    }

    // ------------------------------------------------------------------ aliados (H-058)

    onAllyDied(ally) {
        const slot = ally.slot;
        this.time.delayedCall(ally.animDuration('death') + 600, () => this.removeFighter(ally));
        if (this.ended) return;
        if (slot.respawnsLeft > 0) {
            slot.respawnsLeft--;
            const wait = Phaser.Math.Between(ALLY_RETURN_MS[0], ALLY_RETURN_MS[1]);
            slot.returnAt = this.time.now + wait;
            this.time.delayedCall(wait, () => {
                if (this.ended || this.player.dead) return;
                const cam = this.cameras.main.worldView;
                const x = Phaser.Math.Clamp(this.player.x - 70 * this.player.facing, cam.x + 40, cam.right - 40);
                const a = this.spawnAlly(slot, x, this.player.y - 240);
                showSpeech(this, a, '¡Volví, pues!', 1800, '#14532d');
            });
        } else {
            slot.returnAt = 0;
        }
        slot.fighter = null;
        this.emitAllies();
    }

    emitAllies() {
        const now = this.time.now;
        const list = this.allySlots.map((s) => ({
            name: s.def.name,
            alive: !!(s.fighter && !s.fighter.dead),
            returnsIn: s.returnAt > now ? Math.ceil((s.returnAt - now) / 1000) : 0,
            respawnsLeft: s.respawnsLeft,
        }));
        this.events.emit(GAME_EVENTS.ALLIES_STATUS, list);
    }

    /** Quita a un personaje de la escena con un desvanecido. */
    removeFighter(f, fade = true) {
        if (!f.active) return;
        const done = () => {
            // Se modifican las listas en el sitio: los colisionadores guardan la referencia al array
            for (const list of [this.fighters, this.enemies, this.allies]) {
                const i = list.indexOf(f);
                if (i >= 0) list.splice(i, 1);
            }
            f.destroy();
        };
        if (!fade) return done();
        this.tweens.add({ targets: f, alpha: 0, duration: 400, onComplete: done });
    }

    // ------------------------------------------------------------------ ciclo

    update(time, delta) {
        for (const f of this.fighters) {
            if (!f.active) continue;
            if (f.controller) f.controller.update(time, delta);
            f.update(time, delta);
            this.applyTerrain(f, time);
        }
        if (!this.ended) {
            this.enemyDirector.update(time);
            if (this.allies.length) this.allyDirector.update(time);
            this.checkArena(time);
            if (this.allySlots.length && time >= (this.nextAllyStatusAt || 0)) {
                this.nextAllyStatusAt = time + 250;
                this.emitAllies();
            }
        }
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

    /** Aviso grande en el centro (lo dibuja el HUD). */
    message(text, color = '#ffd34d') {
        this.events.emit(GAME_EVENTS.MESSAGE, text, color);
    }

    onEnemyDied(enemy, killer) {
        if (!this.ended) {
            // Baja del protagonista: "+1" con su símbolo y carga de habilidad
            if (killer === this.player && !this.player.dead) {
                this.player.kills++;
                this.player.addSpecialCharge(SPECIAL_CHARGE_PER_KILL);
                showKillPopup(this, this.player);
            } else if (killer && killer.role === ROLES.ALLY && killer.active) {
                showKillPopup(this, killer);
            }
            if (!enemy.isBoss) this.pickups.maybeDrop(enemy.x, enemy.y - 30);
        }
        this.events.emit(GAME_EVENTS.ENEMIES_LEFT, this.aliveEnemies());
        // Tras la animación de muerte: humo y desaparición
        this.time.delayedCall(enemy.animDuration('death') + 700, () => {
            if (!enemy.active) return;
            const fx = enemy.def.effects;
            if (fx && fx.frames.smoke !== undefined) {
                const smoke = this.add.image(enemy.x, enemy.y - 20, effectsKey(enemy.def.id), fx.frames.smoke).setDepth(12).setAlpha(0.9);
                this.tweens.add({ targets: smoke, y: smoke.y - 30, alpha: 0, scale: 1.4, duration: 600, onComplete: () => smoke.destroy() });
            }
            this.removeFighter(enemy);
        });
        if (this.ended) return;
        if (enemy.isBoss) {
            this.events.emit(GAME_EVENTS.BOSS_END);
            this.winLevel();
        } else if (this.hasBoss) {
            if (!this.bossStarted && this.aliveLevelEnemies() === 0) this.openArena();
        } else if (this.aliveEnemies() === 0) {
            this.winLevel();
        }
    }

    /** Victoria: con jefe → "¡FUERZA CAMBA!" y siguiente nivel; sin jefe → "¡ZONA DESPEJADA!". */
    winLevel() {
        if (this.ended) return;
        this.ended = true;
        this.player.invulnerableUntil = Number.POSITIVE_INFINITY; // balas en vuelo ya no cuentan
        // Las escoltas que queden se "desconectan"
        for (const e of [...this.enemies]) if (!e.dead) e.die();
        for (const a of this.allies) if (!a.dead) a.invulnerableUntil = Number.POSITIVE_INFINITY;
        const next = this.hasBoss ? nextLevelId(this.content, this.mapId) : null;
        this.time.delayedCall(900, () => {
            this.player.celebrate();
            for (const a of this.allies) if (a.active && !a.dead) a.celebrate();
            audio.sfx('victory');
            this.events.emit(GAME_EVENTS.LEVEL_CLEARED);
            if (!this.hasBoss) {
                this.showBanner('¡ZONA DESPEJADA!', 'Pulsa Esc o toca para volver al menú', { summary: this.summaryText() });
                return;
            }
            const go = next
                ? () => this.goTo('Story', { characterId: this.characterId, mapId: next })
                : () => this.exitToMenu();
            this.showBanner('¡FUERZA CAMBA!', next ? 'Enter / toque: siguiente nivel · Esc: menú' : 'Enter / toque / Esc: volver al menú', {
                summary: this.summaryText(),
                extra: this.level.clearText,
                onPrimary: go,
            });
        });
    }

    onPlayerDied(killer) {
        if (killer && killer.active) showEmote(this, killer);
        this.events.emit(GAME_EVENTS.PLAYER_HEALTH, 0, this.player.stats.maxHealth);
        if (this.ended) return;
        this.ended = true;
        this.events.emit(GAME_EVENTS.PLAYER_DEFEATED);
        const fromBoss = this.bossStarted;
        this.time.delayedCall(this.player.animDuration('death') + 500, () => {
            this.showBanner('¡QUÉ MACANA!', `Te bajaron, chango. Espacio / J / toque: reintentar${fromBoss ? ' desde el jefe' : ''} · Esc: menú`, {
                summary: this.summaryText(),
                onPrimary: () => this.scene.restart({ characterId: this.characterId, mapId: this.mapId, checkpoint: fromBoss ? 'boss' : null }),
            });
        });
    }

    /**
     * Mensaje central de fin de partida.
     * Espacio/J/Enter/toque → onPrimary; Esc/P → onSecondary (por defecto, volver al menú).
     */
    showBanner(title, subtitle, { summary = '', extra = '', onPrimary = () => this.exitToMenu(), onSecondary = () => this.exitToMenu() } = {}) {
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;
        const tall = (summary ? 40 : 0) + (extra ? 46 : 0);
        const bg = this.add.rectangle(cx, cy, GAME_WIDTH, 150 + tall, 0x000000, 0.68).setScrollFactor(0).setDepth(100);
        const items = [bg];
        let y = cy - (75 + tall / 2) + 42;
        items.push(this.add.text(cx, y, title, textStyle(44, '#ffd34d')).setOrigin(0.5).setScrollFactor(0).setDepth(101));
        y += 48;
        if (extra) {
            items.push(this.add.text(cx, y, extra, textStyle(17, '#ffffff', { align: 'center', wordWrap: { width: GAME_WIDTH - 120 } })).setOrigin(0.5).setScrollFactor(0).setDepth(101));
            y += 46;
        }
        if (summary) {
            items.push(this.add.text(cx, y, summary, textStyle(18, '#9fe8ff')).setOrigin(0.5).setScrollFactor(0).setDepth(101));
            y += 38;
        }
        items.push(this.add.text(cx, y, subtitle, textStyle(15)).setOrigin(0.5).setScrollFactor(0).setDepth(101));
        this.tweens.add({ targets: items, alpha: { from: 0, to: 1 }, duration: 250 });

        let used = false;
        const finish = (fn) => {
            if (used) return;
            used = true;
            this.input.keyboard.off('keydown', onKey);
            this.input.off('pointerup', onPointer);
            fn();
        };
        const onPointer = () => finish(onPrimary);
        const onKey = (ev) => {
            if (['Space', 'KeyJ', 'Enter'].includes(ev.code)) finish(onPrimary);
            else if (['Escape', 'KeyP'].includes(ev.code)) finish(onSecondary);
        };
        // Pequeña espera para no tomar la última pulsación de la partida
        this.time.delayedCall(450, () => {
            this.input.keyboard.on('keydown', onKey);
            this.input.on('pointerup', onPointer);
        });
    }

    /** Resumen de la partida: personaje, bajas y tiempo. */
    summaryText() {
        const secs = Math.floor((this.time.now - this.startedAt) / 1000);
        const time = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
        return `${this.player.def.name.toUpperCase()}  ·  BAJAS: ${this.player.kills}  ·  TIEMPO: ${time}`;
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

    goTo(sceneKey, data) {
        this.scene.stop('Hud');
        this.scene.start(sceneKey, data);
    }

    exitToMenu() {
        this.goTo('Menu');
    }

    cleanup() {
        this.game.events.off(Phaser.Core.Events.HIDDEN, this.onHidden, this);
        this.events.off(GAME_EVENTS.REQUEST_PAUSE, this.openPause, this);
        for (const f of [...this.fighters]) if (f.active) f.destroy();
        this.fighters.length = 0;
        this.enemies.length = 0;
        this.allies.length = 0;
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
