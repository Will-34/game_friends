/**
 * FinalScene — Final del juego (E6, H-062): Henry rescatado, todos los amigos celebrando y créditos.
 *
 * El fondo es el del primer nivel de la campaña (de vuelta en la plaza). Los personajes salen del
 * catálogo: un amigo nuevo en content/characters/ aparece aquí sin tocar código.
 * Enter/Espacio/J/toque: volver al menú (tras un momento, para no saltarlo sin querer).
 */
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { mapImageKey, textureKey, animKey } from '../systems/ContentLoader.js';
import { selectableLevels } from '../systems/LevelCatalog.js';
import { audio } from '../systems/AudioManager.js';
import { textStyle } from './ui.js';

const RESCUED_ID_KEY = 'captive';
const CONFETTI = [0xff4d4d, 0xff9a3d, 0xffe14d, 0x5ee06b, 0x4da6ff, 0xa66bff, 0xffffff];

export class FinalScene extends Phaser.Scene {
    constructor() {
        super('Final');
    }

    init(data) {
        this.data_ = data || {};
    }

    create() {
        const content = this.registry.get('content');
        audio.playMusicForScene('Menu');
        audio.sfx('victory');

        // Fondo: el primer nivel (la plaza), con un velo para que se lea el texto
        const first = selectableLevels(content)[0];
        this.layers = [];
        if (first) {
            for (const layer of first.entry.data.layers) {
                if (layer.type !== 'imagelayer' || !layer.image) continue;
                const key = mapImageKey(first.entry.id, layer.image);
                if (this.textures.exists(key)) this.layers.push({ ts: this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, key).setOrigin(0, 0), f: layer.parallaxx ?? 1 });
            }
        }
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.25).setOrigin(0, 0);
        this.add.rectangle(0, 470, GAME_WIDTH, 70, 0x6d655a, 1).setOrigin(0, 0);
        this.add.rectangle(0, 468, GAME_WIDTH, 4, 0xcfc6b2, 1).setOrigin(0, 0);

        // Todos los amigos celebrando; el rescatado al centro y más grande
        const rescuedId = this.findRescued(content);
        const chars = [...content.characters.values()];
        const others = chars.filter((d) => d.id !== rescuedId);
        const n = others.length;
        others.forEach((def, i) => {
            const half = Math.ceil(n / 2);
            const side = i < half ? -1 : 1;
            const k = i < half ? half - i : i - half + 1;
            const x = GAME_WIDTH / 2 + side * (70 + k * 72);
            this.addCharacter(def, x, 470, 1, def.id === this.data_.characterId);
        });
        const rescued = content.characters.get(rescuedId);
        if (rescued) {
            const h = this.addCharacter(rescued, GAME_WIDTH / 2, 470, 1.35, false);
            this.tweens.add({ targets: h, y: 450, duration: 380, yoyo: true, repeat: -1, ease: 'Quad.easeOut' });
        }

        // Títulos
        const t1 = this.add.text(GAME_WIDTH / 2, 60, `¡${(rescued ? rescued.name : 'HENRY').toUpperCase()} RESCATADO!`, textStyle(48, '#ffd34d')).setOrigin(0.5);
        this.tweens.add({ targets: t1, scale: 1.06, duration: 600, yoyo: true, repeat: -1 });
        this.add.text(GAME_WIDTH / 2, 112, '¡FUERZA CAMBA! La gallada está completa otra vez.', textStyle(20, '#ffffff')).setOrigin(0.5);
        if (this.data_.summary) this.add.text(GAME_WIDTH / 2, 142, this.data_.summary, textStyle(16, '#9fe8ff')).setOrigin(0.5);

        this.makeCredits(chars);
        this.confetti();

        this.hint = this.add.text(GAME_WIDTH - 20, GAME_HEIGHT - 16, 'Enter / toque: volver al menú', textStyle(14, '#ffffff')).setOrigin(1, 1).setDepth(50).setAlpha(0);
        this.time.delayedCall(2500, () => {
            this.hint.setAlpha(1);
            const go = () => this.scene.start('Menu');
            this.input.keyboard.once('keydown-ENTER', go);
            this.input.keyboard.once('keydown-SPACE', go);
            this.input.keyboard.once('keydown-J', go);
            this.input.keyboard.once('keydown-ESC', go);
            this.input.once('pointerup', go);
        });
    }

    /** Id del capturado del último nivel (propiedad `captive`), o el primero que no pueda ser enemigo. */
    findRescued(content) {
        const levels = selectableLevels(content);
        for (const l of levels.slice().reverse()) {
            const p = (l.entry.data.properties || []).find((x) => x.name === RESCUED_ID_KEY);
            if (p && content.characters.has(p.value)) return p.value;
        }
        const fallback = [...content.characters.values()].find((d) => d.canBeEnemy === false);
        return fallback ? fallback.id : null;
    }

    addCharacter(def, x, y, scale, isPlayer) {
        const a = def.animations.victory || def.animations.idle;
        const key = def.animations.victory ? 'victory' : 'idle';
        const s = this.add.sprite(x, y, textureKey(def.id)).setScale(scale).setDepth(10);
        s.setOrigin(a.origin[0] - (a.offset ? a.offset[0] / def.frameWidth : 0), a.origin[1] - (a.offset ? a.offset[1] / def.frameHeight : 0));
        s.play({ key: animKey(def.id, key), repeat: -1, delay: Math.random() * 400 });
        s.setFlipX(x > GAME_WIDTH / 2);
        this.add
            .text(x, y - def.body.height * scale - 14, def.name.toUpperCase(), textStyle(12, isPlayer ? '#7dff8a' : '#ffffff'))
            .setOrigin(0.5, 1)
            .setDepth(11);
        return s;
    }

    /** Créditos que suben por el centro. */
    makeCredits(chars) {
        const lines = [
            'RESCATANDO A HENRY',
            '',
            'Un juego de la gallada, hecho en',
            'Santa Cruz de la Sierra, Bolivia',
            '',
            'PROTAGONISTAS',
            ...chars.map((d) => d.name),
            '',
            'Mapas: Casco Viejo · UAGRM',
            'Lomas de Arena · Parque Industrial',
            '',
            'Personajes: láminas del equipo',
            'Mapas, drones y robots: generados por código',
            'Motor: Phaser (licencia MIT)',
            '',
            '¡Gracias por jugar, chango!',
        ];
        // Franja de créditos bajo los títulos: cada línea solo se ve dentro de la franja (ver update)
        const top = 165;
        const bottom = 380;
        this.creditsBand = { top, bottom };
        const box = this.add.container(GAME_WIDTH / 2, bottom).setDepth(5);
        this.creditsBox = box;
        lines.forEach((l, i) => {
            const big = i === 0 || l === 'PROTAGONISTAS';
            box.add(this.add.text(0, i * 24, l, textStyle(big ? 22 : 16, big ? '#ffd34d' : '#ffffff')).setOrigin(0.5, 0));
        });
        const height = lines.length * 24;
        // Fondo semitransparente detrás de los créditos
        const bg = this.add.rectangle(GAME_WIDTH / 2, top, 420, bottom - top, 0x000000, 0.4).setOrigin(0.5, 0).setDepth(4);
        bg.setAlpha(0);
        this.tweens.add({ targets: bg, alpha: 1, delay: 1500, duration: 600 });
        this.tweens.add({
            targets: box,
            y: top - height,
            delay: 1500,
            duration: 20000,
            ease: 'Linear',
            onComplete: () => this.tweens.add({ targets: bg, alpha: 0, duration: 600 }),
        });
    }

    /** Lluvia de confeti de colores. */
    confetti() {
        this.time.addEvent({
            delay: 90,
            loop: true,
            callback: () => {
                const c = this.add
                    .rectangle(Phaser.Math.Between(0, GAME_WIDTH), -10, 6, 10, Phaser.Utils.Array.GetRandom(CONFETTI))
                    .setDepth(30)
                    .setAngle(Phaser.Math.Between(0, 360));
                this.tweens.add({
                    targets: c,
                    y: GAME_HEIGHT + 20,
                    x: c.x + Phaser.Math.Between(-80, 80),
                    angle: c.angle + Phaser.Math.Between(-360, 360),
                    duration: Phaser.Math.Between(2200, 3800),
                    onComplete: () => c.destroy(),
                });
            },
        });
    }

    update(time) {
        for (const l of this.layers) l.ts.tilePositionX = time * 0.02 * l.f;
        // Créditos: visibles solo dentro de la franja, con fundido en los bordes
        const box = this.creditsBox;
        if (!box) return;
        const { top, bottom } = this.creditsBand;
        for (const t of box.list) {
            const y = box.y + t.y;
            const fade = Math.min(y - top, bottom - (y + 20)) / 24;
            t.setAlpha(Phaser.Math.Clamp(fade, 0, 1));
        }
    }
}
