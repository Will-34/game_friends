/**
 * PickupManager.js — Objetos que sueltan los enemigos al morir: armas, vida y granadas.
 *
 * Probabilidades y cantidades en content/config/weapons.json → "drops".
 * Los objetos caen con gravedad, se recogen al tocarlos (solo el protagonista)
 * y desaparecen tras "lifetimeMs" (parpadean los últimos 3 s).
 */
import { FONT } from '../config.js';
import { audio } from './AudioManager.js';

const ICON = 28;

export class PickupManager {
    /**
     * @param {Phaser.Scene} scene
     * @param {object} weaponsCfg  content/config/weapons.json
     */
    constructor(scene, weaponsCfg) {
        this.scene = scene;
        this.cfg = weaponsCfg;
        this.drops = weaponsCfg.drops || { chance: 0, table: [] };
        this.weaponIds = Object.entries(weaponsCfg.weapons)
            .filter(([, w]) => !w.usesCharacterStats)
            .map(([id]) => id);
        this.ensureTextures();
        this.group = scene.physics.add.group({ allowGravity: true });
        scene.events.on('update', this.update, this);
        scene.events.once('shutdown', () => scene.events.off('update', this.update, this));
    }

    /** Iconos de los objetos dibujados en un canvas (cajas con letra, corazón, granada). */
    ensureTextures() {
        const tex = this.scene.textures;
        const box = (key, fill, draw) => {
            if (tex.exists(key)) return;
            const c = tex.createCanvas(key, ICON, ICON);
            const ctx = c.getContext();
            ctx.fillStyle = '#1b1f2a';
            ctx.fillRect(0, 0, ICON, ICON);
            ctx.fillStyle = fill;
            ctx.fillRect(2, 2, ICON - 4, ICON - 4);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(1, 1, ICON - 2, ICON - 2);
            draw(ctx);
            c.refresh();
        };
        for (const id of this.weaponIds) {
            const w = this.cfg.weapons[id];
            box(`pickup-weapon-${id}`, w.color || '#ffb347', (ctx) => {
                ctx.fillStyle = '#1b1f2a';
                ctx.font = `bold 18px ${FONT.family}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(w.letter || id[0].toUpperCase(), ICON / 2, ICON / 2 + 1);
            });
        }
        box('pickup-health', '#e9edf5', (ctx) => {
            ctx.fillStyle = '#e53935';
            ctx.fillRect(11, 5, 6, 18);
            ctx.fillRect(5, 11, 18, 6);
        });
        box('pickup-grenades', '#8fae4a', (ctx) => {
            ctx.fillStyle = '#1d2a12';
            ctx.beginPath();
            ctx.arc(14, 16, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#9a9a9a';
            ctx.fillRect(11, 5, 6, 4);
        });
    }

    /** Al morir un enemigo: suelta un objeto con cierta probabilidad. */
    maybeDrop(x, y) {
        if (Math.random() >= this.drops.chance || this.drops.table.length === 0) return null;
        const total = this.drops.table.reduce((s, e) => s + e.weight, 0);
        let r = Math.random() * total;
        let entry = this.drops.table[0];
        for (const e of this.drops.table) {
            r -= e.weight;
            if (r <= 0) { entry = e; break; }
        }
        if (entry.type === 'weapon') {
            if (this.weaponIds.length === 0) return null;
            return this.spawn(x, y, { type: 'weapon', id: Phaser.Utils.Array.GetRandom(this.weaponIds) });
        }
        return this.spawn(x, y, { type: entry.type, amount: entry.amount });
    }

    spawn(x, y, data) {
        const key = data.type === 'weapon' ? `pickup-weapon-${data.id}` : `pickup-${data.type}`;
        const p = this.group.create(x, y, key);
        p.setDepth(15);
        p.setBounce(0.3);
        p.setVelocity(Phaser.Math.Between(-60, 60), -260);
        p.body.setMaxVelocity(400, 700);
        p.pickup = data;
        p.expireAt = this.scene.time.now + (this.drops.lifetimeMs || 15000);
        return p;
    }

    update(time) {
        for (const p of this.group.getChildren()) {
            if (!p.active) continue;
            const left = p.expireAt - time;
            if (left <= 0) p.destroy();
            else p.setAlpha(left < 3000 && Math.floor(time / 120) % 2 === 0 ? 0.3 : 1);
        }
    }

    /** Aplica el objeto al personaje y muestra un aviso. */
    collect(fighter, p) {
        if (!p.active || fighter.dead) return;
        const d = p.pickup;
        let text = '';
        let color = '#ffffff';
        if (d.type === 'weapon') {
            if (!fighter.giveWeapon(d.id)) return;
            const w = this.cfg.weapons[d.id];
            text = `+${w.name.toUpperCase()}`;
            color = w.color || '#ffb347';
        } else if (d.type === 'health') {
            fighter.heal(d.amount);
            text = `+${d.amount} VIDA`;
            color = '#7dff8a';
        } else if (d.type === 'grenades') {
            fighter.addGrenades(d.amount);
            text = `+${d.amount} GRANADAS`;
            color = '#c6e36a';
        }
        audio.sfx('ui');
        const t = this.scene.add
            .text(p.x, p.y - 20, text, { fontFamily: FONT.family, fontSize: '14px', color, stroke: '#000', strokeThickness: 3 })
            .setOrigin(0.5)
            .setDepth(60);
        this.scene.tweens.add({ targets: t, y: t.y - 30, alpha: 0, duration: 900, onComplete: () => t.destroy() });
        p.destroy();
    }
}
