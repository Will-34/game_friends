/**
 * RobotBossDirector.js — Patrones de ataque del Robot Guardián (E6, H-060).
 *
 * El robot es un Fighter normal (se mueve y dispara con EnemyAI). Este director le añade, según la fase
 * (por vida: > 66 %, 33-66 %, < 33 %), los ataques definidos en su character.json → "bossAttacks":
 *   armor      multiplicador de daño recibido con el pecho cerrado
 *   weakPoint  el pecho se abre (animación "special"): recibe mucho más daño unos segundos
 *   missiles   lanza misiles en arco hacia sus objetivos (fase 1+)
 *   laser      aviso y barrido horizontal: bajo (saltar) o alto (agacharse) (fase 2+)
 *   shockwave  golpe al suelo con ondas a ambos lados (saltar) (fase 3)
 *   minions    mini-robots que invoca al entrar en cada fase
 * Las listas tienen un valor por fase (0 = no lo usa en esa fase).
 */
import { CharacterRoleManager } from './CharacterRoleManager.js';
import { audio } from './AudioManager.js';
import { PHYSICS } from '../config.js';

const phaseValue = (v, phase) => (Array.isArray(v) ? v[Math.min(phase, v.length) - 1] : v) || 0;

export class RobotBossDirector {
    /**
     * @param {Phaser.Scene} scene   GameScene
     * @param {object} boss          Fighter del robot
     * @param {object} cfg           character.json → bossAttacks
     * @param {object} arena         { x, width, groundY }
     */
    constructor(scene, boss, cfg, arena) {
        this.scene = scene;
        this.boss = boss;
        this.cfg = cfg;
        this.arena = arena;
        this.phase = 1;
        const now = scene.time.now;
        this.next = { missiles: now + 3500, laser: now + 6000, shockwave: now + 4000, weak: now + 6500 };
        this.weakShown = false;
        this.effects = [];
        // Blindaje permanente (se anula mientras el pecho está abierto)
        if (cfg.armor) boss.addBuff({ id: 'armor', durationMs: 60 * 60 * 1000, damageTakenMul: cfg.armor });
    }

    update(time) {
        const b = this.boss;
        if (!b.active || b.dead) return this.clearEffects();
        const r = b.health / b.stats.maxHealth;
        const phase = r > 0.66 ? 1 : r > 0.33 ? 2 : 3;
        if (phase !== this.phase) this.enterPhase(phase, time);

        const c = this.cfg;
        const every = (k) => phaseValue(c[k] && c[k].everyMs, this.phase);
        if (c.weakPoint && time >= this.next.weak) {
            this.next.weak = time + phaseValue(c.weakPoint.everyMs, this.phase);
            this.openChest(time);
        }
        if (every('missiles') && time >= this.next.missiles && time >= b.specialPoseUntil) {
            this.next.missiles = time + every('missiles');
            this.fireMissiles(time);
        }
        if (every('laser') && time >= this.next.laser) {
            this.next.laser = time + every('laser');
            this.laserSweep(time);
        }
        if (every('shockwave') && time >= this.next.shockwave && b.body.blocked.down) {
            this.next.shockwave = time + every('shockwave');
            this.shockwave();
        }
        this.updateEffects(time);
    }

    enterPhase(phase, time) {
        this.phase = phase;
        const s = this.scene;
        s.message(phase === 2 ? '¡FASE 2: LÁSER Y DRONES!' : '¡FASE 3: EL ROBOT ESTÁ FURIOSO!', '#ff6b6b');
        s.cameras.main.shake(350, 0.01);
        audio.sfx('special');
        this.boss.ai.restMs *= 0.75;
        this.boss.ai.chaseSpeed = Math.min(1, this.boss.ai.chaseSpeed + 0.15);
        const n = phaseValue(this.cfg.minions, phase);
        if (n > 0) s.spawnMinions(n, true);
        if (phase >= 2) this.boss.droneReadyAt = 0; // lanza su dron al cambiar de fase
        this.next.laser = Math.min(this.next.laser, time + 2500);
        this.next.shockwave = Math.min(this.next.shockwave, time + 2000);
    }

    /** Punto débil: el pecho se abre y el robot se queda quieto unos segundos. */
    openChest(time) {
        const b = this.boss;
        const w = this.cfg.weakPoint;
        b.specialPoseUntil = time + w.durationMs;
        // Se anula el blindaje y se multiplica el daño recibido
        b.addBuff({ id: 'weak', durationMs: w.durationMs, damageTakenMul: w.damageTakenMul / (this.cfg.armor || 1), aura: '#ffcf4d' });
        if (!this.weakShown) {
            this.weakShown = true;
            this.scene.message('¡PUNTO DÉBIL! ¡Disparale cuando abra el pecho!', '#ffcf4d');
        }
    }

    /** Hostiles vivos del robot (protagonista y aliados). */
    targets() {
        return this.scene.fighters.filter((f) => f.active && !f.dead && CharacterRoleManager.areHostile(this.boss.team, f.team));
    }

    /** Misiles en arco desde los hombros hacia los objetivos (reutiliza la reserva de granadas). */
    fireMissiles(time) {
        const b = this.boss;
        const s = this.scene;
        const cfg = this.cfg.missiles;
        const n = phaseValue(cfg.count, this.phase);
        const ts = this.targets();
        if (!ts.length) return;
        b.throwUntil = time + 450; // pose de lanzamiento
        const g = PHYSICS.gravityY;
        const t = (cfg.flightMs || 1100) / 1000;
        for (let i = 0; i < n; i++) {
            s.time.delayedCall(i * 180, () => {
                if (!b.active || b.dead) return;
                const target = ts[i % ts.length];
                if (!target.active) return;
                const sx = b.x + (i % 2 ? -30 : 30);
                const sy = b.y - b.def.body.height * b.sizeScale + 20;
                const tx = target.x + Phaser.Math.Between(-50, 50);
                const ty = target.y - 10;
                const m = s.grenades.throw(b, sx, sy, 1);
                if (!m) return;
                // Velocidad para llegar al objetivo en t segundos con la gravedad del mundo
                m.setVelocity((tx - sx) / t, (ty - sy - 0.5 * g * t * t) / t);
                m.setTint(0xff5a5a);
                m.explodeAt = s.time.now + (cfg.flightMs || 1100) + 600;
            });
        }
        audio.sfx('special');
    }

    /** Barrido láser con aviso: "low" se esquiva saltando, "high" agachándose. */
    laserSweep(time) {
        const s = this.scene;
        const { x, width, groundY } = this.arena;
        const low = Math.random() < 0.5;
        const band = low ? { top: groundY - 34, bottom: groundY - 2 } : { top: groundY - 84, bottom: groundY - 58 };
        const cfg = this.cfg.laser;
        const warn = s.add.rectangle(x + width / 2, (band.top + band.bottom) / 2, width, band.bottom - band.top, 0xff3b3b, 0.18).setDepth(24);
        const line = s.add.rectangle(x + width / 2, (band.top + band.bottom) / 2, width, 2, 0xff3b3b, 0.9).setDepth(24);
        s.tweens.add({ targets: [warn, line], alpha: 0.05, duration: 120, yoyo: true, repeat: -1 });
        s.message(low ? '¡LÁSER BAJO! ¡Saltá!' : '¡LÁSER ALTO! ¡Agachate!', '#ff8a8a');
        const fx = { kind: 'laser', fireAt: time + cfg.warnMs, endAt: time + cfg.warnMs + cfg.beamMs, band, warn, line, beam: null, hit: new Set(), damage: cfg.damage };
        this.effects.push(fx);
    }

    /** Golpe al suelo: dos ondas que recorren la arena (se esquivan saltando). */
    shockwave() {
        const s = this.scene;
        const b = this.boss;
        s.cameras.main.shake(260, 0.012);
        audio.sfx('explosion');
        b.hurtUntil = s.time.now + 250; // pequeño frenazo
        for (const dir of [-1, 1]) {
            const wave = s.add.rectangle(b.x, this.arena.groundY - 12, 26, 24, 0xffcf4d, 0.85).setDepth(24);
            wave.setStrokeStyle(2, 0xff6a1a);
            this.effects.push({ kind: 'wave', wave, dir, hit: new Set(), damage: this.cfg.shockwave.damage, speed: this.cfg.shockwave.speed });
        }
    }

    updateEffects(time) {
        const dt = this.scene.game.loop.delta / 1000;
        for (const fx of this.effects) {
            if (fx.kind === 'laser') {
                if (!fx.beam && time >= fx.fireAt) {
                    fx.warn.destroy();
                    fx.line.destroy();
                    const { x, width } = this.arena;
                    fx.beam = this.scene.add.rectangle(x + width / 2, (fx.band.top + fx.band.bottom) / 2, width, fx.band.bottom - fx.band.top, 0xff3b3b, 0.85).setDepth(24);
                    fx.core = this.scene.add.rectangle(x + width / 2, (fx.band.top + fx.band.bottom) / 2, width, 4, 0xffffff, 1).setDepth(25);
                    this.scene.cameras.main.shake(fx.endAt - time, 0.004);
                    audio.sfx('shoot');
                }
                if (fx.beam) {
                    for (const f of this.targets()) {
                        if (fx.hit.has(f)) continue;
                        const top = f.body.y;
                        const bottom = f.body.y + f.body.height;
                        if (bottom > fx.band.top && top < fx.band.bottom) {
                            fx.hit.add(f);
                            f.takeDamage(fx.damage, { owner: this.boss, x: this.boss.x });
                        }
                    }
                }
                if (time >= fx.endAt) fx.done = true;
            } else if (fx.kind === 'wave') {
                fx.wave.x += fx.dir * fx.speed * dt;
                for (const f of this.targets()) {
                    if (fx.hit.has(f) || !f.body.blocked.down) continue;
                    if (Math.abs(f.x - fx.wave.x) < 22) {
                        fx.hit.add(f);
                        f.takeDamage(fx.damage, { owner: this.boss, x: fx.wave.x });
                    }
                }
                if (fx.wave.x < this.arena.x || fx.wave.x > this.arena.x + this.arena.width) fx.done = true;
            }
        }
        for (const fx of this.effects.filter((e) => e.done)) this.destroyEffect(fx);
        this.effects = this.effects.filter((e) => !e.done);
    }

    destroyEffect(fx) {
        for (const k of ['warn', 'line', 'beam', 'core', 'wave']) if (fx[k] && fx[k].active) fx[k].destroy();
    }

    clearEffects() {
        for (const fx of this.effects) this.destroyEffect(fx);
        this.effects = [];
    }
}

