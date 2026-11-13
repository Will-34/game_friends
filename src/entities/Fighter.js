/**
 * Fighter.js — Clase base de CUALQUIER personaje, sea cual sea su rol.
 *
 * - Su identidad viene de character.json (stats, animaciones, cuerpo físico, boca del arma).
 * - Su comportamiento viene de un Controller que entrega acciones abstractas.
 *   El Fighter no sabe si lo controla el teclado, el táctil o la IA.
 * - Su rol (PLAYER/ENEMY/ALLY/RESCUE_TARGET) solo aporta bando y modificadores.
 */
import { PHYSICS } from '../config.js';
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

export class Fighter extends Phaser.Physics.Arcade.Sprite {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y  posición de los PIES
     * @param {object} def  character.json
     * @param {object} opts { role, team, modifiers, controller, projectiles }
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

        const base = { ...DEFAULT_STATS, ...def.stats };
        this.stats = {
            ...base,
            maxHealth: Math.max(1, Math.round(base.maxHealth * this.mods.health)),
            bulletSpeed: base.bulletSpeed * this.mods.bulletSpeed,
            fireRateMs: base.fireRateMs * this.mods.fireRate,
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
        this.currentAnim = null;

        this.setDepth(10);
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
    update(time) {
        if (this.dead) return;
        const a = this.controller.actions;
        const body = this.body;
        const onGround = body.blocked.down || body.touching.down;
        const stunned = time < this.hurtUntil;

        // Agacharse (solo en el suelo)
        const wantsCrouch = a.held.crouch && onGround && !stunned;
        if (wantsCrouch !== this.crouching) {
            this.crouching = wantsCrouch;
            this.applyBody(this.currentBodyShape());
        }

        if (!stunned) {
            if (a.moveX !== 0) this.facing = Math.sign(a.moveX);
            body.setVelocityX(this.crouching ? 0 : a.moveX * this.stats.speed);

            if (a.pressed.jump && onGround && !this.crouching) {
                body.setVelocityY(-this.stats.jumpVelocity);
                audio.sfx('jump');
            }
            // Salto variable: soltar el botón corta la subida
            if (a.released.jump && body.velocity.y < -150) {
                body.setVelocityY(body.velocity.y * 0.45);
            }
            if (a.held.shoot && time >= this.nextShotAt) {
                this.shoot(time, a.held.aimUp && !this.crouching);
            }
            // grenade / special / switchWeapon: acciones reservadas, se implementan en E4.
        } else {
            body.setVelocityX(body.velocity.x * 0.88);
        }

        this.setFlipX(this.facing < 0);

        // Parpadeo durante la invulnerabilidad
        const blinking = Number.isFinite(this.invulnerableUntil) && time < this.invulnerableUntil;
        this.setAlpha(blinking && Math.floor(time / 70) % 2 === 0 ? 0.35 : 1);

        this.updateAnimation(time, onGround, a);
        this.updateFlash(time);
    }

    updateAnimation(time, onGround, a) {
        const firing = time < this.firingUntil;
        const moving = Math.abs(this.body.velocity.x) > 10;
        let anim;
        if (time < this.hurtUntil) anim = 'hurt';
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
        return { x: this.x + off.x * this.facing, y: this.y + off.y };
    }

    shoot(time, up) {
        const { x, y } = this.muzzlePoint(up);
        const speed = this.stats.bulletSpeed;
        const vx = up ? 0 : speed * this.facing;
        const vy = up ? -speed : 0;
        this.projectiles.fire(x, y, vx, vy, {
            owner: this,
            team: this.team,
            damage: this.stats.bulletDamage,
            tint: this.team === 'enemies' ? 0xff7b6b : null,
        });
        this.nextShotAt = time + this.stats.fireRateMs;
        this.firingUntil = time + FIRE_POSE_MS;
        this.lastShotUp = up;
        this.flashUntil = time + 50;
        audio.sfx('shoot');
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

    // ------------------------------------------------------------------ daño y muerte

    /**
     * Recibe daño. Devuelve true si el daño se aplicó.
     * @param {number} amount
     * @param {{x:number}} [source]  para el retroceso
     */
    takeDamage(amount, source = null) {
        const now = this.scene.time.now;
        if (this.dead || now < this.invulnerableUntil) return false;
        this.health = Math.max(0, this.health - amount);
        this.emit(FIGHTER_EVENTS.DAMAGED, this, amount);
        if (this.health <= 0) {
            this.die();
            return true;
        }
        audio.sfx('hit');
        this.hurtUntil = now + this.mods.stunMs;
        this.invulnerableUntil = now + this.mods.invulnerableMs;
        if (source && this.mods.stunMs > 0) {
            const dir = source.x < this.x ? 1 : -1;
            this.body.setVelocityX(140 * dir);
        }
        return true;
    }

    die() {
        if (this.dead) return;
        this.dead = true;
        this.crouching = false;
        this.setAlpha(1);
        if (this.flash) this.flash.setVisible(false);
        this.body.setVelocityX(0);
        this.playAnim('death');
        audio.sfx('death');
        this.emit(FIGHTER_EVENTS.DIED, this);
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
        if (this.controller) this.controller.destroy();
        this.controller = null;
        super.destroy(fromScene);
    }
}
