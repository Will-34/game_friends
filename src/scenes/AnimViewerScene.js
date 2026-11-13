/**
 * AnimViewerScene — Visor de animaciones para revisar visualmente cada personaje.
 * Acceso: menú en modo desarrollo (localhost o ?debug=1).
 *
 * Teclas: ←/→ animación · ↑/↓ personaje · Espacio pausa/reanuda · F avanza un cuadro
 *         X espejo · B cuerpo físico · Esc volver.  También hay botones táctiles.
 */
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { textureKey, animKey } from '../systems/ContentLoader.js';
import { makeButton, textStyle } from './ui.js';

const ZOOM = 3;
const STAGE_X = 300;
const STAGE_Y = 430; // línea del suelo (pies)

export class AnimViewerScene extends Phaser.Scene {
    constructor() {
        super('AnimViewer');
    }

    create() {
        const content = this.registry.get('content');
        this.chars = [...content.characters.values()];
        this.charIndex = 0;
        this.animIndex = 0;
        this.flip = false;
        this.showBody = true;
        this.cameras.main.setBackgroundColor('#2a2f3a');

        // Escenario con cuadrícula para ver el pixel art y la línea del suelo
        const g = this.add.graphics();
        g.lineStyle(1, 0x3a4150, 1);
        for (let x = 0; x < 600; x += 24) g.lineBetween(x, 60, x, GAME_HEIGHT - 60);
        for (let y = 60; y < GAME_HEIGHT - 60; y += 24) g.lineBetween(0, y, 600, y);
        g.lineStyle(2, 0x6fd0ff, 1).lineBetween(20, STAGE_Y, 580, STAGE_Y);
        g.lineStyle(1, 0xff6f6f, 1).lineBetween(STAGE_X, 70, STAGE_X, GAME_HEIGHT - 70);

        this.sprite = this.add.sprite(STAGE_X, STAGE_Y, textureKey(this.chars[0].id)).setScale(ZOOM);
        this.overlay = this.add.graphics().setDepth(5);

        this.add.text(16, 12, 'VISOR DE ANIMACIONES', textStyle(22, '#ffd34d'));
        this.info = this.add.text(620, 70, '', textStyle(16, '#ffffff', { lineSpacing: 6, wordWrap: { width: 320 } }));
        this.list = this.add.text(620, 262, '', textStyle(13, '#c9d3e6', { lineSpacing: 0 }));
        this.add.text(
            16,
            GAME_HEIGHT - 26,
            '←/→ animación  ↑/↓ personaje  Espacio pausa  F cuadro  X espejo  B cuerpo  Esc volver',
            textStyle(13, '#9fb0cc')
        );

        // Botones táctiles
        const opt = { width: 64, height: 40, size: 18 };
        makeButton(this, 640, 500, '◀', () => this.changeAnim(-1), opt);
        makeButton(this, 712, 500, '▶', () => this.changeAnim(1), opt);
        makeButton(this, 784, 500, '⏯', () => this.togglePause(), opt);
        makeButton(this, 870, 500, 'VOLVER', () => this.scene.start('Menu'), { width: 96, height: 40, size: 16 });

        const kb = this.input.keyboard;
        kb.on('keydown-LEFT', () => this.changeAnim(-1));
        kb.on('keydown-RIGHT', () => this.changeAnim(1));
        kb.on('keydown-UP', () => this.changeChar(-1));
        kb.on('keydown-DOWN', () => this.changeChar(1));
        kb.on('keydown-SPACE', () => this.togglePause());
        kb.on('keydown-F', () => this.stepFrame());
        kb.on('keydown-X', () => {
            this.flip = !this.flip;
            this.sprite.setFlipX(this.flip);
        });
        kb.on('keydown-B', () => (this.showBody = !this.showBody));
        kb.on('keydown-ESC', () => this.scene.start('Menu'));

        this.showCurrent();
    }

    get char() {
        return this.chars[this.charIndex];
    }

    get animNames() {
        return Object.keys(this.char.animations);
    }

    changeAnim(d) {
        const n = this.animNames.length;
        this.animIndex = (this.animIndex + d + n) % n;
        this.showCurrent();
    }

    changeChar(d) {
        const n = this.chars.length;
        this.charIndex = (this.charIndex + d + n) % n;
        this.animIndex = 0;
        this.showCurrent();
    }

    togglePause() {
        if (this.sprite.anims.isPaused) this.sprite.anims.resume();
        else this.sprite.anims.pause();
    }

    stepFrame() {
        if (!this.sprite.anims.isPaused) this.sprite.anims.pause();
        this.sprite.anims.nextFrame();
    }

    showCurrent() {
        const c = this.char;
        const name = this.animNames[this.animIndex];
        const a = c.animations[name];
        const fw = c.frameWidth;
        const fh = c.frameHeight;
        this.sprite.setOrigin(a.origin[0] - a.offset[0] / fw, a.origin[1] - a.offset[1] / fh);
        this.sprite.play(animKey(c.id, name));

        const lines = [
            `${c.name}  (${c.id})`,
            `Animación: ${name}`,
            `Cuadros: ${a.frames.length}  [${a.frames.join(', ')}]`,
            `FPS: ${a.fps}   Bucle: ${a.loop ? 'sí' : 'no'}`,
            `Celda: ${fw}×${fh}   Origen: ${a.origin.join(', ')}`,
        ];
        if (a.placeholder) lines.push('⚠ PROVISIONAL (placeholder)');
        if (a.note) lines.push(`Nota: ${a.note}`);
        this.info.setText(lines);
        this.info.setColor(a.placeholder ? '#ffb070' : '#ffffff');

        this.list.setText(this.animNames.map((n, i) => `${i === this.animIndex ? '▶ ' : '   '}${n}${c.animations[n].placeholder ? ' *' : ''}`));
    }

    update() {
        // Marco de la celda y cuerpo físico (para ajustar character.json → body/crouchBody)
        const o = this.overlay;
        o.clear();
        const s = this.sprite;
        const c = this.char;
        const frameText = s.anims.currentFrame ? `Cuadro actual: ${s.anims.currentFrame.textureFrame}` : '';
        if (this.frameLabel) this.frameLabel.setText(frameText);
        else this.frameLabel = this.add.text(16, 44, frameText, textStyle(14, '#9fb0cc'));

        o.lineStyle(1, 0x8888ff, 0.6).strokeRect(s.x - s.displayOriginX * ZOOM, s.y - s.displayOriginY * ZOOM, c.frameWidth * ZOOM, c.frameHeight * ZOOM);
        if (this.showBody) {
            const name = this.animNames[this.animIndex];
            const body = name.startsWith('crouch') && c.crouchBody ? c.crouchBody : c.body;
            if (body) o.lineStyle(2, 0x5ee06b, 0.9).strokeRect(s.x - (body.width / 2) * ZOOM, s.y - body.height * ZOOM, body.width * ZOOM, body.height * ZOOM);
            // Bocas del arma
            const m = c.muzzle || {};
            const dir = this.flip ? -1 : 1;
            o.fillStyle(0xffd34d, 1);
            for (const p of Object.values(m)) o.fillCircle(s.x + p.x * dir * ZOOM, s.y + p.y * ZOOM, 4);
        }
    }
}
