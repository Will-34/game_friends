/**
 * GameScene — Partida: mapa (Tiled), protagonista, enemigos, jefe, aliados, proyectiles y cámara.
 * No conoce personajes ni mapas concretos: todo llega por datos (ids en `data` y content/).
 *
 * Flujo de un nivel con jefe (E5): enemigos del nivel → se abre la arena → jefe + escoltas
 * y llegan 2 aliados → fase 2 con refuerzos → victoria y paso al siguiente nivel.
 * Un mapa sin objetos `arena`/`boss` se gana eliminando a todos los enemigos (como antes).
 */
import { GAME_WIDTH, GAME_HEIGHT, DEFAULTS } from '../config.js';
import { mapKey, mapImageKey, effectsKey, textureKey, animKey, tiledProp } from '../systems/ContentLoader.js';
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
import { RobotBossDirector } from '../systems/RobotBossDirector.js';
import { textStyle } from './ui.js';

/** Granadas iniciales del protagonista. */
const PLAYER_GRENADES = 5;
/** Tiempo mínimo entre gestos de un mismo enemigo. */
const EMOTE_COOLDOWN_MS = 2500;
/** Separación horizontal entre enemigos de un mismo grupo. */
const GROUP_SPACING = 64;
/** Escala del jefe. */
const BOSS_SCALE = 1.5;
/** Colores de nombre por bando: protagonista y aliados en verde, enemigos en rojo, jefe en lila. */
export const NAME_COLORS = Object.freeze({ hero: '#7dff8a', enemy: '#ff5a5a', boss: '#d7a6ff', captive: '#ffd34d' });
/** Marca de dificultad junto al nombre del enemigo (el color ya no la indica). */
const DIFFICULTY_MARK = Object.freeze({ facil: '', normal: ' ★', dificil: ' ★★' });
/** Escala del personaje capturado sobre el jefe. */
const CAPTIVE_SCALE = 0.8;
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
        // La instancia de la escena se reutiliza al reiniciar: se limpia el estado del combate anterior
        this.boss = null;
        this.bossEnraged = false;
        this.captive = null;
        this.robotDirector = null;
        this.nextMinionAt = 0;
        this.minionsAnnounced = false;
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
            nameColor: NAME_COLORS.hero,
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
            nameColor: boss ? NAME_COLORS.boss : NAME_COLORS.enemy,
            title: opts.title || `${def.name.toUpperCase()}${DIFFICULTY_MARK[tier.id] || ''}`,
            scale: boss ? def.bossScale ?? BOSS_SCALE : 1,
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
            nameColor: NAME_COLORS.hero,
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
                    // Atraviesa (láser): daña una sola vez a cada personaje y sigue
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
        if (!this.hasBoss) return;
        this.arenaX = this.arenaObj.x - this.map.tileWidth / 2;
        // Sin barrera: se puede llegar al jefe sin eliminar a todos (esquivándolos). Una flecha marca la arena.
        this.arrow = this.add.text(this.arenaX + 90, this.arenaObj.y - 150, 'JEFE →', textStyle(26, '#ffd34d')).setOrigin(0.5).setDepth(40);
        this.tweens.add({ targets: this.arrow, x: this.arrow.x + 24, duration: 450, yoyo: true, repeat: -1 });
    }

    aliveLevelEnemies() {
        return this.enemies.filter((e) => e.isLevelEnemy && !e.dead).length;
    }

    /** Enemigos que cuentan en el HUD: durante el jefe, solo los del combate. */
    countedEnemies() {
        return this.enemies.filter((e) => !e.dead && (!this.bossStarted || !e.isLevelEnemy)).length;
    }

    /** El combate empieza al llegar al centro de la arena. */
    checkArena() {
        if (!this.hasBoss || this.bossStarted || this.ended) return;
        if (this.player.x >= this.arenaX + GAME_WIDTH / 2 - 40 && !this.player.dead) this.startBoss();
    }

    /**
     * Cierra la arena por la izquierda con una pared invisible para el protagonista, los aliados y el bando
     * del jefe. Los enemigos del nivel que quedaron atrás no la cruzan ni quedan encerrados.
     */
    closeArena() {
        const h = this.map.heightInPixels;
        this.arenaWall = this.add.zone(this.arenaX - 20, 0, 20, h).setOrigin(0, 0);
        this.physics.add.existing(this.arenaWall, true);
        this.physics.add.collider(this.fighters, this.arenaWall, null, (f) => !f.isLevelEnemy, this);
    }

    /** Empieza el combate: cámara fija en la arena, jefe, escoltas y aliados. */
    startBoss() {
        this.bossStarted = true;
        if (this.arrow) this.arrow.destroy();
        const h = this.map.heightInPixels;
        const ax = this.arenaX;
        this.closeArena();
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
        // bossType: jefe fijo de content/bosses/ (Robot Guardián); si no, un amigo "hackeado" al azar
        const bossType = this.prop('bossType', null);
        const fixedBoss = bossType ? this.content.bosses.get(bossType) : null;
        const bossId = fixedBoss ? fixedBoss.id : this.roles.pickEnemyIds(this.content.characters, 1, allyIds)[0];
        const escorts = Math.max(0, this.prop('bossEscorts', 1));
        this.reinforcements = Math.max(0, this.prop('bossReinforcements', 2));
        this.escortPool = [...allyIds, bossId];

        const bossDef = fixedBoss || this.content.characters.get(bossId);
        const groundY = this.bossObj.y;
        const title = this.level.bossName || 'JEFE';
        this.boss = this.spawnEnemy(bossDef, this.bossObj.x, groundY - 260, 240, { boss: true, title: `★ ${bossDef.name.toUpperCase()} ★` });
        if (bossDef.bossAttacks) {
            this.robotDirector = new RobotBossDirector(this, this.boss, bossDef.bossAttacks, { x: ax, width: GAME_WIDTH, groundY });
        }
        this.boss.on(FIGHTER_EVENTS.DAMAGED, (f) => {
            this.events.emit(GAME_EVENTS.BOSS_HEALTH, f.health, f.stats.maxHealth);
            // Los jefes con patrones propios (robot) llevan sus fases en su director
            if (!this.robotDirector && !this.bossEnraged && !f.dead && f.health <= f.stats.maxHealth / 2) this.enrageBoss();
        });
        this.nextMinionAt = this.time.now + Math.max(6000, this.prop('minionEveryMs', 0) * 0.6);
        const hudTitle = fixedBoss ? title : `${title} · ${bossDef.name.toUpperCase()}`;
        this.events.emit(GAME_EVENTS.BOSS_START, this.boss, hudTitle);
        this.events.emit(GAME_EVENTS.BOSS_HEALTH, this.boss.health, this.boss.stats.maxHealth);
        audio.sfx('special');
        this.cameras.main.shake(300, 0.006);
        if (this.level.bossTaunt) this.time.delayedCall(900, () => this.boss.active && !this.boss.dead && showSpeech(this, this.boss, this.level.bossTaunt, 3200));
        this.spawnEscorts(escorts, 700);
        this.spawnCaptive(this.boss);

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
        this.events.emit(GAME_EVENTS.ENEMIES_LEFT, this.countedEnemies());
    }

    /** El jefe lanza su dron cuando lo tiene listo y hay a quién disparar (en fase 2 se recarga antes). */
    updateBoss(time) {
        const b = this.boss;
        if (b && b.active && !b.dead && time >= b.droneReadyAt) {
            const t = this.nearestHostile(b);
            if (t && Math.abs(t.x - b.x) < 600 && b.tryUseDrone(time)) {
                if (this.bossEnraged) b.droneReadyAt = time + b.droneCooldownMs * 0.6;
            }
        }
        if (this.robotDirector) this.robotDirector.update(time);
        const every = this.prop('minionEveryMs', 0);
        if (every > 0 && b && b.active && !b.dead && time >= this.nextMinionAt) {
            this.nextMinionAt = time + every;
            this.spawnMinions(2);
        }
        this.updateCaptive(time);
    }

    /**
     * El jefe invoca mini-robots (`bossMinion` del mapa) que caen a los lados de la arena.
     * Sin `force`, respeta el máximo de vivos (`minionMax`).
     */
    spawnMinions(n, force = false) {
        const id = this.prop('bossMinion', null);
        const def = id && this.content.bosses.get(id);
        if (!def || this.ended || !this.bossStarted) return;
        const alive = this.enemies.filter((e) => e.isMinion && !e.dead).length;
        const max = this.prop('minionMax', 3);
        const count = force ? n : Math.min(n, max - alive);
        if (count <= 0) return;
        if (!this.minionsAnnounced) {
            this.minionsAnnounced = true;
            this.message('¡El jefe invoca MINI-ROBOTS!', '#ff8a8a');
        }
        if (this.boss && this.boss.active) showSpeech(this, this.boss, '¡Vengan, mis robots!', 1400, '#7a1d1d');
        for (let i = 0; i < count; i++) {
            this.time.delayedCall(250 + i * 300, () => {
                if (this.ended) return;
                const side = i % 2 === 0 ? -1 : 1;
                const x = this.arenaX + GAME_WIDTH / 2 + side * (260 + Math.random() * 160);
                const e = this.spawnEnemy(def, x, this.bossObj.y - 320, 200);
                e.isMinion = true;
                e.labelOffset = (i % 2) * 13;
                this.events.emit(GAME_EVENTS.ENEMIES_LEFT, this.countedEnemies());
            });
        }
    }

    // ------------------------------------------------------------------ personaje capturado (Henry)

    /**
     * El personaje de la propiedad `captive` del mapa va montado y enjaulado sobre el jefe.
     * No es un Fighter (no recibe balas): es un sprite que sigue al jefe. Si es el protagonista, no aparece.
     */
    spawnCaptive(boss) {
        const id = this.prop('captive', null);
        if (!id || id === this.characterId) return;
        const def = this.content.characters.get(id);
        if (!def) return;
        const s = this.add.sprite(boss.x, boss.y, textureKey(id)).setScale(CAPTIVE_SCALE).setDepth(11);
        s.def = def;
        s.headPoint = () => ({ x: s.x, y: s.y - def.body.height * CAPTIVE_SCALE - 30 });
        playCaptiveAnim(s, def, 'idle');
        const cage = this.add.graphics().setDepth(12);
        const label = this.add.text(0, 0, def.name.toUpperCase(), textStyle(12, NAME_COLORS.captive)).setOrigin(0.5, 1).setDepth(30);
        this.captive = { def, sprite: s, cage, label, free: false, nextCryAt: this.time.now + 10000 };
        label.setVisible(false); // dentro de la jaula basta con el globo; el nombre vuelve al quedar libre
        // El nombre del jefe pasa por encima de la jaula
        boss.labelOffset = def.body.height * CAPTIVE_SCALE + 16;
        this.time.delayedCall(4300, () => this.captive && !this.captive.free && showSpeech(this, s, '¡Ayúdenme, changos! ¡Sáquenme de aquí!', 2600, '#7a1d1d'));
    }

    updateCaptive(time) {
        const c = this.captive;
        if (!c || c.free) return;
        const b = this.boss;
        const s = c.sprite;
        if (!b || !b.active) return;
        // Montado sobre los hombros del jefe
        s.setPosition(b.x - 4 * b.facing, b.y - b.def.body.height * b.sizeScale + 10);
        s.setFlipX(b.facing < 0);
        const w = c.def.body.width * CAPTIVE_SCALE + 18;
        const h = c.def.body.height * CAPTIVE_SCALE + 12;
        const x0 = s.x - w / 2;
        const y0 = s.y - h;
        const g = c.cage;
        g.clear();
        if (this.prop('captiveStyle', 'cage') === 'capsule') {
            // Cápsula de vidrio con base metálica y brillo
            g.fillStyle(0x6fe8ff, 0.18).fillEllipse(s.x, s.y - h / 2, w + 6, h + 8);
            g.lineStyle(3, 0x9ff3ff, 0.9).strokeEllipse(s.x, s.y - h / 2, w + 6, h + 8);
            g.fillStyle(0xffffff, 0.5).fillEllipse(s.x - w / 4, s.y - h * 0.75, 6, 18);
            g.fillStyle(0x5b6676, 1).fillRect(x0 - 4, s.y - 4, w + 8, 8);
            g.fillStyle(0xff3b3b, 1).fillRect(s.x - 2, s.y - 2, 4, 3);
        } else {
            g.lineStyle(3, 0x3a3f48, 1);
            for (let x = x0; x <= x0 + w; x += 9) g.lineBetween(x, y0, x, s.y);
            g.lineStyle(4, 0x6d737a, 1).strokeRect(x0, y0, w, h);
            g.fillStyle(0xffd34d, 1).fillRect(s.x - 3, s.y - h / 2 - 3, 6, 6); // candado
        }
        c.label.setPosition(s.x, y0 - 4);
        if (time >= c.nextCryAt) {
            c.nextCryAt = time + 9000 + Math.random() * 5000;
            const lines = ['¡Sáquenme de aquí!', '¡Qué macana, me tienen enjaulado!', '¡Apurate, chango!'];
            showSpeech(this, s, Phaser.Utils.Array.GetRandom(lines), 2000, '#7a1d1d');
        }
    }

    /** Al caer el jefe: la jaula se rompe, el capturado salta al suelo feliz y celebra. */
    freeCaptive(boss) {
        const c = this.captive;
        if (!c || c.free) return;
        c.free = true;
        const s = c.sprite;
        // Barrotes que salen volando
        for (let i = 0; i < 8; i++) {
            const capsule = this.prop('captiveStyle', 'cage') === 'capsule';
            const bar = capsule ? this.add.triangle(s.x, s.y - 30, 0, 0, 8, 2, 3, 12, 0x9ff3ff, 0.8).setDepth(13) : this.add.rectangle(s.x, s.y - 30, 3, 18, 0x6d737a).setDepth(13);
            this.tweens.add({
                targets: bar,
                x: bar.x + Phaser.Math.Between(-90, 90),
                y: bar.y + Phaser.Math.Between(-80, 40),
                angle: Phaser.Math.Between(-360, 360),
                alpha: 0,
                duration: 700,
                onComplete: () => bar.destroy(),
            });
        }
        c.cage.destroy();
        c.label.setVisible(true);
        boss.labelOffset = 0;
        audio.sfx('explosion');
        const groundY = boss.y;
        const landX = Phaser.Math.Clamp(s.x + 60, this.cameras.main.worldView.x + 40, this.cameras.main.worldView.right - 40);
        playCaptiveAnim(s, c.def, 'jump');
        this.tweens.add({
            targets: s,
            x: landX,
            duration: 650,
            ease: 'Linear',
        });
        this.tweens.add({
            targets: s,
            y: s.y - 70,
            duration: 300,
            ease: 'Quad.easeOut',
            onComplete: () =>
                this.tweens.add({
                    targets: s,
                    y: groundY,
                    duration: 350,
                    ease: 'Quad.easeIn',
                    onComplete: () => {
                        s.setScale(1);
                        playCaptiveAnim(s, c.def, 'victory', true);
                        showEmote(this, s);
                        showSpeech(this, s, '¡Gracias, changos! ¡Soy libre! ¡Fuerza camba!', 2400, '#14532d');
                    },
                }),
        });
        const follow = () => {
            if (c.label.active) c.label.setPosition(s.x, s.y - c.def.body.height * s.scaleY - 8);
        };
        this.events.on('update', follow);
        this.events.once('shutdown', () => this.events.off('update', follow));
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
                this.events.emit(GAME_EVENTS.ENEMIES_LEFT, this.countedEnemies());
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
        this.spawnMinions(2, true);
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
            this.checkArena();
            this.updateBoss(time);
            if (this.allies.length && time >= (this.nextAllyDroneAt || 0)) {
                // Los aliados lanzan su dron cuando lo tienen listo y hay un enemigo cerca
                this.nextAllyDroneAt = time + 1500;
                for (const a of this.allies) {
                    const t = !a.dead && this.nearestHostile(a);
                    if (t && Math.abs(t.x - a.x) < 450 && Math.random() < 0.5) a.tryUseDrone(time);
                }
            }
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
        this.events.emit(GAME_EVENTS.ENEMIES_LEFT, this.countedEnemies());
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
        this.events.emit(GAME_EVENTS.ENEMIES_LEFT, this.countedEnemies());
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
            this.freeCaptive(enemy);
            this.events.emit(GAME_EVENTS.BOSS_END);
            this.winLevel();
        } else if (this.hasBoss) {
            if (!this.bossStarted && this.aliveLevelEnemies() === 0) this.message('¡ZONA DESPEJADA! Avanzá hacia el jefe →', '#7dff8a');
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
        this.time.delayedCall(this.captive ? 2200 : 900, () => {
            this.player.celebrate();
            for (const a of this.allies) if (a.active && !a.dead) a.celebrate();
            audio.sfx('victory');
            this.events.emit(GAME_EVENTS.LEVEL_CLEARED);
            if (!this.hasBoss) {
                this.showBanner('¡ZONA DESPEJADA!', 'Pulsa Esc o toca para volver al menú', { summary: this.summaryText() });
                return;
            }
            const final = !!this.prop('final', false);
            const go = final
                ? () => this.goTo('Final', { characterId: this.characterId, summary: this.summaryText() })
                : next
                ? () => this.goTo('Story', { characterId: this.characterId, mapId: next })
                : () => this.exitToMenu();
            const hint = final ? 'Enter / toque: ver el final' : next ? 'Enter / toque: siguiente nivel · Esc: menú' : 'Enter / toque / Esc: volver al menú';
            this.showBanner(final ? '¡HENRY RESCATADO!' : '¡FUERZA CAMBA!', hint, {
                summary: this.summaryText(),
                extra: this.level.clearText,
                onPrimary: go,
                onSecondary: final ? go : undefined,
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
        if (this.robotDirector) this.robotDirector.clearEffects();
        for (const f of [...this.fighters]) if (f.active) f.destroy();
        this.fighters.length = 0;
        this.enemies.length = 0;
        this.allies.length = 0;
        this.scene.stop('Hud');
        audio.stopMusic();
    }
}

/** Pone una animación al sprite de un personaje que no es Fighter (origen y desplazamiento de character.json). */
function playCaptiveAnim(sprite, def, name, loop = false) {
    const a = def.animations[name] || def.animations.idle;
    const key = def.animations[name] ? name : 'idle';
    const origin = a.origin || [0.5, 1];
    const offset = a.offset || [0, 0];
    sprite.setOrigin(origin[0] - offset[0] / def.frameWidth, origin[1] - offset[1] / def.frameHeight);
    sprite.play(loop ? { key: animKey(def.id, key), repeat: -1 } : animKey(def.id, key), true);
}

/** "count" de Tiled: número (2) o rango ("2-3"). */
function parseCount(v) {
    if (typeof v === 'number') return Math.max(1, Math.round(v));
    const m = /^(\d+)\s*-\s*(\d+)$/.exec(String(v));
    if (m) return Phaser.Math.Between(Number(m[1]), Number(m[2]));
    return Math.max(1, parseInt(v, 10) || 1);
}
