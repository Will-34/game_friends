/**
 * Fighter.js — Clase base de CUALQUIER personaje, sea cual sea su rol.
 *
 * - Su identidad viene de character.json (stats, animaciones, cuerpo físico, boca del arma, habilidad).
 * - Su comportamiento viene de un Controller que entrega acciones abstractas.
 *   El Fighter no sabe si lo controla el teclado, el táctil o la IA.
 * - Su rol (PLAYER/ENEMY/ALLY/RESCUE_TARGET) solo aporta bando y modificadores.
 * - Las habilidades se aplican como "buffs" temporales (velocidad, daño, defensa, escudo, regeneración…).
 */
import { PHYSICS, FONT } from '../config.js';
import { textureKey, effectsKey, animKey } from '../systems/ContentLoader.js';
import { FIGHTER_EVENTS } from '../systems/GameEvents.js';
import { audio } from '../systems/AudioManager.js';

/** Textura de fogonazo genérica (generada en BootScene). */
export const MUZZLE_TEXTURE = 'muzzle-generic';

const DEFAULT_STATS = {
    maxHealth: 100,
    speed: 180,
    jumpVelocity: 580,
    fireRateMs: 200,
    bulletSpeed: 600,
    bulletDamage: 10,
};

/** Cuánto dura la pose de disparo después del último tiro. */
const FIRE_POSE_MS = 200;
/** Duración de la pose de lanzar granada. */
const THROW_POSE_MS = 380;
/** Carga de habilidad por baja (2 bajas = habilidad lista). */
export const SPECIAL_CHARGE_PER_KILL = 0.5;

/** Multiplicadores neutros de un buff. */
const NEUTRAL = { speedMul: 1, damageMul: 1, damageTakenMul: 1, jumpMul: 1, regenPerSec: 0 };

export class Fighter extends Phaser.Physics.Arcade.Sprite {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y  posición de los PIES
     * @param {object} def  character.json
     * @param {object} opts { role, team, modifiers, controller, projectiles, grenades, specials, grenadeCount, nameColor, weapons, title, scale }
     */
    constructor(scene, x, y, def, opts) {
        super(scene, x, y, textureKey(def.id), def.animations.idle ? def.animations.idle.frames[0] : 0);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.def = def;
        this.role = opts.role;
        this.team = opts.team;
        this.mods = opts.modifiers;
        this.controller = opts.controller;
        this.projectiles = opts.projectiles;
        this.grenadePool = opts.grenades || null;
        this.specials = opts.specials || null;

        const base = { ...DEFAULT_STATS, ...def.stats };
        this.stats = {
            ...base,
            maxHealth: Math.max(1, Math.round(base.maxHealth * this.mods.health)),
            bulletSpeed: base.bulletSpeed * this.mods.bulletSpeed,
            fireRateMs: base.fireRateMs * this.mods.fireRate,
            bulletDamage: base.bulletDamage * (this.mods.damage ?? 1),
        };
        this.health = this.stats.maxHealth;

        this.facing = 1;
        this.dead = false;
        this.crouching = false;
        this.celebrating = false;
        this.nextShotAt = 0;
        this.firingUntil = 0;
        this.lastShotUp = false;
        this.hurtUntil = 0;
        this.invulnerableUntil = 0;
        this.throwUntil = 0;
        this.specialPoseUntil = 0;
        this.currentAnim = null;

        this.grenades = opts.grenadeCount ?? 0;
        // Armas: siempre empieza con la de por defecto (munición infinita)
        this.weaponDefs = opts.weapons ? opts.weapons.weapons : null;
        this.inventory = [{ id: (opts.weapons && opts.weapons.default) || 'pistola', ammo: Number.POSITIVE_INFINITY }];
        this.weaponIdx = 0;
        this.specialCharge = 0;
        // Dron propio (acción DRON): listo al empezar, luego con recarga
        this.droneReadyAt = 0;
        this.droneCooldownMs = (def.drone && def.drone.cooldownMs) || 20000;
        this.kills = 0;
        this.lastAttacker = null;
        /** @type {Array<object>} buffs activos */
        this.buffs = [];

        this.setDepth(10);
        // Escala (el jefe es más grande). El cuerpo físico de Arcade escala solo con el sprite.
        this.sizeScale = opts.scale || 1;
        if (this.sizeScale !== 1) this.setScale(this.sizeScale);
        this.body.setCollideWorldBounds(true);
        this.body.setMaxVelocity(2000, PHYSICS.maxFallSpeed);

        // Fogonazo del arma: el del propio personaje si su lámina lo trae; si no, uno genérico
        const hasOwnMuzzle = def.effects && def.effects.frames && def.effects.frames.muzzle !== undefined;
        this.flash = (hasOwnMuzzle
            ? scene.add.image(x, y, effectsKey(def.id), def.effects.frames.muzzle)
            : scene.add.image(x, y, MUZZLE_TEXTURE)
        )
            .setVisible(false)
            .setDepth(11);

        // Aura de habilidad y etiqueta con el nombre (y mini barra de vida si no es el jugador)
        this.aura = scene.add.graphics().setDepth(9);
        this.nameTag = scene.add
            .text(x, y, opts.title || def.name.toUpperCase(), {
                fontFamily: FONT.family,
                fontSize: '12px',
                color: opts.nameColor || '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
            })
            .setOrigin(0.5, 1)
            .setDepth(30);
        this.showHealthBar = this.role !== 'PLAYER';
        this.hpBar = this.showHealthBar ? scene.add.graphics().setDepth(30) : null;

        this.playAnim('idle');
    }

    // ------------------------------------------------------------------ cuerpo físico

    /** Ajusta el cuerpo físico para que quede centrado sobre los pies (sea cual sea el origin). */
    applyBody(shape) {
        const w = shape.width;
        const h = shape.height;
        this.body.setSize(w, h, false);
        this.body.setOffset(this.displayOriginX - w / 2, this.displayOriginY - h);
    }

    currentBodyShape() {
        return this.crouching && this.def.crouchBody ? this.def.crouchBody : this.def.body;
    }

    // ------------------------------------------------------------------ buffs (habilidades)

    /**
     * Añade un efecto temporal. Campos: id, durationMs, speedMul, damageMul, damageTakenMul, jumpMul,
     * regenPerSec, invulnerable, forceVX, alpha, aura (color '#rrggbb' o 'rainbow').
     * Un buff con el mismo id reemplaza al anterior.
     */
    addBuff(buff) {
        const now = this.scene.time.now;
        this.buffs = this.buffs.filter((b) => b.id !== buff.id);
        this.buffs.push({ ...NEUTRAL, ...buff, until: now + (buff.durationMs || 0) });
    }

    /** Producto/suma de un campo entre los buffs activos. */
    buffValue(field) {
        if (field === 'regenPerSec') return this.buffs.reduce((s, b) => s + (b.regenPerSec || 0), 0);
        return this.buffs.reduce((m, b) => m * (b[field] ?? 1), 1);
    }

    hasBuffFlag(field) {
        return this.buffs.some((b) => b[field]);
    }

    heal(amount) {
        if (this.dead) return;
        this.health = Math.min(this.stats.maxHealth, this.health + amount);
        this.emit(FIGHTER_EVENTS.DAMAGED, this, -amount);
    }

    addGrenades(n) {
        if (Number.isFinite(this.grenades)) this.grenades += n;
        this.emit(FIGHTER_EVENTS.STATS, this);
    }

    /** Suma carga a la habilidad especial (0..1). */
    addSpecialCharge(v) {
        this.specialCharge = Math.min(1, this.specialCharge + v);
        this.emit(FIGHTER_EVENTS.STATS, this);
    }

    // ------------------------------------------------------------------ animaciones

    playAnim(name) {
        const anims = this.def.animations;
        if (!anims[name]) name = 'idle';
        if (this.currentAnim === name) return;
        this.currentAnim = name;
        const a = anims[name];
        const fw = this.def.frameWidth;
        const fh = this.def.frameHeight;
        const origin = a.origin || [0.5, 1];
        const offset = a.offset || [0, 0];
        this.setOrigin(origin[0] - offset[0] / fw, origin[1] - offset[1] / fh);
        this.applyBody(this.currentBodyShape());
        this.play(animKey(this.def.id, name), true);
    }

    // ------------------------------------------------------------------ ciclo principal

    /** Se llama desde la escena cada frame, después de controller.update(). */
    update(time, delta) {
        if (this.dead) {
            this.syncLabels();
            return;
        }
        // Buffs vencidos
        if (this.buffs.length) this.buffs = this.buffs.filter((b) => time < b.until);
        const regen = this.buffValue('regenPerSec');
        if (regen > 0 && this.health < this.stats.maxHealth) this.heal((regen * delta) / 1000);

        const a = this.controller.actions;
        const body = this.body;
        const onGround = body.blocked.down || body.touching.down;
        const stunned = time < this.hurtUntil;
        const posing = time < this.specialPoseUntil;

        // Agacharse (solo en el suelo)
        const wantsCrouch = a.held.crouch && onGround && !stunned && !posing;
        if (wantsCrouch !== this.crouching) {
            this.crouching = wantsCrouch;
            this.applyBody(this.currentBodyShape());
        }

        const forced = this.buffs.find((b) => b.forceVX);
        if (forced) {
            body.setVelocityX(forced.forceVX);
            this.facing = Math.sign(forced.forceVX);
        } else if (posing) {
            body.setVelocityX(0);
        } else if (!stunned) {
            if (a.moveX !== 0) this.facing = Math.sign(a.moveX);
            body.setVelocityX(this.crouching ? 0 : a.moveX * this.stats.speed * this.buffValue('speedMul'));

            if (a.pressed.jump && onGround && !this.crouching) {
                body.setVelocityY(-this.stats.jumpVelocity * this.buffValue('jumpMul'));
                audio.sfx('jump');
            }
            // Salto variable: soltar el botón corta la subida
            if (a.released.jump && body.velocity.y < -150) {
                body.setVelocityY(body.velocity.y * 0.45);
            }
            if (a.held.shoot && time >= this.nextShotAt && time >= this.throwUntil) {
                this.shoot(time, a.held.aimUp && !this.crouching);
            }
            if (a.pressed.grenade) this.throwGrenade(time);
            if (a.pressed.special) this.tryUseSpecial(time);
            if (a.pressed.drone) this.tryUseDrone(time);
            if (a.pressed.switchWeapon) this.cycleWeapon();
        } else {
            body.setVelocityX(body.velocity.x * 0.88);
        }

        this.setFlipX(this.facing < 0);

        // Parpadeo durante la invulnerabilidad; transparencia de buffs (sombra)
        const blinking = Number.isFinite(this.invulnerableUntil) && time < this.invulnerableUntil;
        const buffAlpha = this.buffs.reduce((m, b) => Math.min(m, b.alpha ?? 1), 1);
        this.setAlpha(blinking && Math.floor(time / 70) % 2 === 0 ? 0.35 : buffAlpha);

        this.updateAnimation(time, onGround);
        this.updateFlash(time);
        this.drawAura(time);
        this.syncLabels();
    }

    updateAnimation(time, onGround) {
        const firing = time < this.firingUntil;
        const moving = Math.abs(this.body.velocity.x) > 10;
        let anim;
        if (time < this.specialPoseUntil) anim = 'special';
        else if (time < this.hurtUntil) anim = 'hurt';
        else if (time < this.throwUntil) anim = 'grenade';
        else if (!onGround) anim = this.body.velocity.y < 0 ? 'jump' : 'fall';
        else if (this.crouching) anim = firing ? 'crouch_fire' : 'crouch';
        else if (firing && this.lastShotUp) anim = 'fire_up';
        else if (firing && !moving) anim = 'fire';
        else if (moving) anim = 'run'; // no existe animación de correr disparando
        else anim = this.celebrating ? 'victory' : 'idle';
        this.playAnim(anim);
    }

    /** Posición mundial de la boca del arma según la postura. */
    muzzlePoint(up) {
        const m = this.def.muzzle || {};
        const p = up ? m.up : this.crouching ? m.crouch : m.stand;
        const off = p || { x: 30, y: -40 };
        const s = this.sizeScale;
        return { x: this.x + off.x * s * this.facing, y: this.y + off.y * s };
    }

    /** Daño de un disparo propio, con los buffs aplicados. */
    outgoingDamage(base) {
        return base * this.buffValue('damageMul');
    }

    // ------------------------------------------------------------------ armas

    /**
     * Arma actual con sus valores efectivos. La pistola usa los stats del personaje (ya ajustados
     * por rol y dificultad); las demás, los de content/config/weapons.json.
     */
    currentWeapon() {
        const slot = this.inventory[this.weaponIdx] || this.inventory[0];
        const w = (this.weaponDefs && this.weaponDefs[slot.id]) || { usesCharacterStats: true };
        if (w.usesCharacterStats) {
            return {
                id: slot.id, name: w.name || 'Pistola', ammo: slot.ammo, texture: w.texture,
                fireRateMs: this.stats.fireRateMs, damage: this.stats.bulletDamage, bulletSpeed: this.stats.bulletSpeed,
                pellets: 1, spreadDeg: 0, lifespanMs: 1400, pierce: false, grow: 1, color: '#ffffff',
            };
        }
        return { pellets: 1, spreadDeg: 0, lifespanMs: 1200, grow: 1, ...w, id: slot.id, ammo: slot.ammo };
    }

    /** Cambia a la siguiente arma del inventario (Q / botón ARMA). */
    cycleWeapon() {
        if (this.inventory.length < 2) return;
        this.weaponIdx = (this.weaponIdx + 1) % this.inventory.length;
        audio.sfx('ui');
        this.emit(FIGHTER_EVENTS.STATS, this);
    }

    /** Recoge un arma: si ya la tiene suma munición; si no, la añade y la equipa. */
    giveWeapon(id) {
        const def = this.weaponDefs && this.weaponDefs[id];
        if (!def) return false;
        const ammo = def.ammo ?? Number.POSITIVE_INFINITY;
        const slot = this.inventory.find((s) => s.id === id);
        if (slot) slot.ammo += ammo;
        else {
            this.inventory.push({ id, ammo });
            this.weaponIdx = this.inventory.length - 1;
        }
        this.emit(FIGHTER_EVENTS.STATS, this);
        return true;
    }

    shoot(time, up) {
        const w = this.currentWeapon();
        const { x, y } = this.muzzlePoint(up);
        const base = up ? -90 : this.facing > 0 ? 0 : 180;
        const n = Math.max(1, w.pellets);
        for (let i = 0; i < n; i++) {
            // Varios perdigones: abanico repartido; uno solo: pequeña dispersión aleatoria
            const off = n > 1 ? -w.spreadDeg / 2 + (w.spreadDeg * i) / (n - 1) : (Math.random() - 0.5) * w.spreadDeg;
            const ang = Phaser.Math.DegToRad(base + off);
            this.projectiles.fire(x, y, Math.cos(ang) * w.bulletSpeed, Math.sin(ang) * w.bulletSpeed, {
                owner: this,
                team: this.team,
                damage: this.outgoingDamage(w.damage),
                tint: this.team === 'enemies' ? 0xff7b6b : null,
                texture: w.texture,
                lifespanMs: w.lifespanMs,
                pierce: w.pierce,
                grow: w.grow,
            });
        }
        this.nextShotAt = time + w.fireRateMs;
        this.firingUntil = time + FIRE_POSE_MS;
        this.lastShotUp = up;
        this.flashUntil = time + 50;
        audio.sfx('shoot');
        // Munición: al agotarse, se pierde el arma y se vuelve a la pistola
        const slot = this.inventory[this.weaponIdx];
        if (slot && Number.isFinite(slot.ammo)) {
            slot.ammo--;
            if (slot.ammo <= 0) {
                this.inventory.splice(this.weaponIdx, 1);
                this.weaponIdx = 0;
            }
            this.emit(FIGHTER_EVENTS.STATS, this);
        }
    }

    throwGrenade(time) {
        if (!this.grenadePool || this.grenades <= 0 || time < this.throwUntil) return false;
        const g = this.grenadePool.throw(this, this.x + 14 * this.facing * this.sizeScale, this.y - 50 * this.sizeScale, this.facing);
        if (!g) return false;
        if (Number.isFinite(this.grenades)) this.grenades--;
        this.throwUntil = time + THROW_POSE_MS;
        this.emit(FIGHTER_EVENTS.STATS, this);
        return true;
    }

    /** Usa la habilidad especial si la carga está completa (o si `force`, para la IA). */
    tryUseSpecial(time, force = false) {
        if (!this.specials || this.dead) return false;
        if (!force && this.specialCharge < 1) return false;
        if (!this.specials.activate(this)) return false;
        if (!force) this.specialCharge = 0;
        this.specialPoseUntil = time + Math.min(700, this.animDuration('special'));
        this.emit(FIGHTER_EVENTS.STATS, this);
        return true;
    }

/** Lanza su dron si ya se recargó. */
    tryUseDrone(time) {
        if (!this.specials || this.dead || time < this.droneReadyAt) return false;
        if (!this.specials.activateDrone(this)) return false;
        this.droneReadyAt = time + this.droneCooldownMs;
        this.emit(FIGHTER_EVENTS.STATS, this);
        return true;
    }

    /** Segundos que faltan para el dron (0 = listo). */
    droneSecondsLeft(time) {
        return Math.max(0, Math.ceil((this.droneReadyAt - time) / 1000));
    }

    updateFlash(time) {
        if (!this.flash) return;
        const show = time < (this.flashUntil || 0);
        this.flash.setVisible(show);
        if (!show) return;
        const { x, y } = this.muzzlePoint(this.lastShotUp);
        this.flash.setPosition(x + (this.lastShotUp ? 0 : 8 * this.facing), y - (this.lastShotUp ? 8 : 0));
        this.flash.setFlipX(this.facing < 0);
        this.flash.setAngle(this.lastShotUp ? -90 * this.facing : 0);
    }

    /** Anillo de color mientras hay una habilidad activa. */
    drawAura(time) {
        const g = this.aura;
        g.clear();
        const b = this.buffs.find((x) => x.aura);
        if (!b) return;
        const h = this.def.body.height * this.sizeScale;
        let color;
        if (b.aura === 'rainbow') color = Phaser.Display.Color.HSVToRGB((time / 1200) % 1, 0.8, 1).color;
        else color = Phaser.Display.Color.HexStringToColor(b.aura).color;
        const pulse = 0.35 + 0.25 * Math.sin(time / 120);
        g.lineStyle(3, color, 0.5 + pulse);
        const w = 58 * this.sizeScale;
        g.strokeEllipse(this.x, this.y - h / 2, w, h + 18);
        if (b.invulnerable) {
            g.fillStyle(color, 0.12).fillEllipse(this.x, this.y - h / 2, w, h + 18);
        }
    }

    /** Coloca el nombre y la mini barra de vida sobre la cabeza. */
    syncLabels() {
        const top = this.y - this.def.body.height * this.sizeScale - 14 - (this.labelOffset || 0);
        this.nameTag.setPosition(this.x, top);
        this.nameTag.setVisible(!this.dead);
        if (this.hpBar) {
            const g = this.hpBar;
            g.clear();
            if (this.dead) return;
            const w = 36;
            const r = Phaser.Math.Clamp(this.health / this.stats.maxHealth, 0, 1);
            g.fillStyle(0x000000, 0.7).fillRect(this.x - w / 2 - 1, top + 1, w + 2, 5);
            g.fillStyle(r > 0.5 ? 0x5ee06b : r > 0.25 ? 0xffc94d : 0xff5a5a, 1).fillRect(this.x - w / 2, top + 2, w * r, 3);
        }
    }

    /** Punto sobre la cabeza (para mensajes flotantes). */
    headPoint() {
        return { x: this.x, y: this.y - this.def.body.height * this.sizeScale - 30 };
    }

    // ------------------------------------------------------------------ daño y muerte

    /**
     * Recibe daño. Devuelve true si el daño se aplicó.
     * @param {number} amount
     * @param {object} [source]  proyectil/granada (con .owner y .x) o el Fighter atacante
     */
    takeDamage(amount, source = null) {
        const now = this.scene.time.now;
        if (this.dead || now < this.invulnerableUntil || this.hasBuffFlag('invulnerable')) return false;
        const attacker = source ? (source.owner !== undefined ? source.owner : source) : null;
        if (attacker && attacker !== this && attacker instanceof Fighter) {
            this.lastAttacker = attacker;
            attacker.emit(FIGHTER_EVENTS.HIT, attacker, this);
        }
        this.health = Math.max(0, this.health - amount * this.buffValue('damageTakenMul'));
        this.emit(FIGHTER_EVENTS.DAMAGED, this, amount);
        if (this.health <= 0) {
            this.die();
            return true;
        }
        audio.sfx('hit');
        this.hurtUntil = now + this.mods.stunMs;
        this.invulnerableUntil = now + this.mods.invulnerableMs;
        if (source && source.x !== undefined && this.mods.stunMs > 0) {
            const dir = source.x < this.x ? 1 : -1;
            this.body.setVelocityX(140 * dir);
        }
        return true;
    }

    die() {
        if (this.dead) return;
        this.dead = true;
        this.crouching = false;
        this.buffs = [];
        this.setAlpha(1);
        this.aura.clear();
        if (this.flash) this.flash.setVisible(false);
        this.body.setVelocityX(0);
        this.playAnim('death');
        audio.sfx('death');
        this.emit(FIGHTER_EVENTS.DIED, this, this.lastAttacker);
    }

    /** Pose de victoria cuando está quieto. */
    celebrate() {
        this.celebrating = true;
    }

    /** Duración en ms de una animación (útil para encadenar eventos). */
    animDuration(name) {
        const a = this.def.animations[name];
        return a ? (a.frames.length / a.fps) * 1000 : 0;
    }

    destroy(fromScene) {
        if (this.flash) this.flash.destroy();
        this.flash = null;
        if (this.aura) this.aura.destroy();
        this.aura = null;
        if (this.nameTag) this.nameTag.destroy();
        this.nameTag = null;
        if (this.hpBar) this.hpBar.destroy();
        this.hpBar = null;
        if (this.controller) this.controller.destroy();
        this.controller = null;
        super.destroy(fromScene);
    }
}
