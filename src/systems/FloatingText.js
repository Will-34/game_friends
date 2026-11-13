/**
 * FloatingText.js — Mensajes que flotan sobre los personajes:
 *  - showKillPopup: "+1" seguido del símbolo del personaje (cuando el jugador hace una baja).
 *  - showEmote: solo el símbolo (gesto de un enemigo cuando acierta al jugador).
 *  - showAbilityBanner: nombre de la habilidad al activarla.
 *
 * El símbolo viene de character.json → "taunt":
 *   { "emoji": "🎂" }            emoji del sistema
 *   { "icon": "icon-green-can" } textura generada en BootScene
 *   { "label": "AFK" }           texto
 */
import { FONT } from '../config.js';

const baseStyle = (size, color = '#ffffff') => ({
    fontFamily: FONT.family,
    fontSize: `${size}px`,
    color,
    stroke: '#000000',
    strokeThickness: Math.max(3, Math.round(size / 6)),
});

/** Crea el objeto visual del símbolo (texto, emoji o icono) centrado en (0,0). */
function makeSymbol(scene, taunt, size) {
    if (!taunt) return null;
    if (taunt.icon && scene.textures.exists(taunt.icon)) {
        return scene.add.image(0, 0, taunt.icon).setDisplaySize(size, size);
    }
    if (taunt.emoji) {
        return scene.add.text(0, 0, taunt.emoji, { fontSize: `${size}px`, padding: { top: 4, bottom: 4 } }).setOrigin(0.5);
    }
    if (taunt.label) {
        return scene.add.text(0, 0, taunt.label, baseStyle(size * 0.75, taunt.color || '#ffd34d')).setOrigin(0.5);
    }
    return null;
}

/** Sube y se desvanece. */
function floatAway(scene, container, rise = 46, duration = 1100) {
    scene.tweens.add({
        targets: container,
        y: container.y - rise,
        alpha: { from: 1, to: 0 },
        ease: 'Cubic.easeOut',
        duration,
        onComplete: () => container.destroy(),
    });
}

/** "+1" + símbolo sobre la cabeza del personaje. */
export function showKillPopup(scene, fighter) {
    const { x, y } = fighter.headPoint();
    const plus = scene.add.text(0, 0, '+1', baseStyle(22, '#7dff8a')).setOrigin(1, 0.5);
    const sym = makeSymbol(scene, fighter.def.taunt, 24);
    // "+1" ocupa [-anchoTexto, 0]; el símbolo va a su derecha. Se centra el conjunto sobre la cabeza.
    const items = [plus];
    const symW = sym ? sym.displayWidth + 4 : 0;
    if (sym) {
        sym.setX(4 + sym.displayWidth / 2);
        items.push(sym);
    }
    const c = scene.add.container(x - (symW - plus.displayWidth) / 2, y, items).setDepth(60);
    c.setScale(0.6);
    scene.tweens.add({ targets: c, scale: 1, duration: 160, ease: 'Back.easeOut' });
    floatAway(scene, c, 52, 1200);
}

/** Solo el símbolo (gesto) sobre la cabeza. */
export function showEmote(scene, fighter) {
    const { x, y } = fighter.headPoint();
    const sym = makeSymbol(scene, fighter.def.taunt, 26);
    if (!sym) return;
    const c = scene.add.container(x, y, [sym]).setDepth(60);
    c.setScale(0.4);
    scene.tweens.add({ targets: c, scale: 1, duration: 180, ease: 'Back.easeOut' });
    floatAway(scene, c, 30, 1000);
}

/** Nombre de la habilidad al activarla. */
export function showAbilityBanner(scene, fighter, text, color = '#ffd34d') {
    const { x, y } = fighter.headPoint();
    const t = scene.add.text(x, y - 18, `¡${text.toUpperCase()}!`, baseStyle(16, color)).setOrigin(0.5).setDepth(61);
    floatAway(scene, t, 36, 1400);
}
