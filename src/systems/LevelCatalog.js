/**
 * LevelCatalog.js — Lee los datos de nivel de los mapas (propiedades de Tiled) sin conocer mapas concretos.
 *
 * Un mapa con la propiedad `order` forma parte de la campaña (orden 1, 2, 3…).
 * Los mapas sin `order` (p. ej. la zona de pruebas) solo se listan en modo desarrollo.
 */
import { tiledProp } from './ContentLoader.js';
import { DEV_MODE } from '../config.js';

/** Información de un nivel a partir de su entrada del contenido ({ id, name, path, data }). */
export function levelInfo(entry) {
    const d = entry.data;
    const p = (name, fallback) => tiledProp(d, name, fallback);
    const story = String(p('story', '') || '');
    return {
        id: entry.id,
        name: p('name', entry.name || entry.id),
        subtitle: p('subtitle', ''),
        order: p('order', null),
        story: story ? story.split('\n') : [],
        clearText: p('clearText', ''),
        bossName: p('bossName', ''),
        bossTaunt: p('bossTaunt', ''),
        placeholder: !!p('placeholder', false),
    };
}

/** Niveles para la pantalla de selección, ordenados por `order` (los de prueba al final, solo en desarrollo). */
export function selectableLevels(content) {
    const all = [...content.maps.values()].map((e) => ({ entry: e, info: levelInfo(e) }));
    const campaign = all.filter((l) => Number.isFinite(l.info.order)).sort((a, b) => a.info.order - b.info.order);
    const extra = DEV_MODE ? all.filter((l) => !Number.isFinite(l.info.order)) : [];
    const list = [...campaign, ...extra];
    return list.length ? list : all; // si ningún mapa tiene orden, se muestran todos
}

/** Id del siguiente nivel de la campaña, o null si es el último (o no es de campaña). */
export function nextLevelId(content, mapId) {
    const levels = selectableLevels(content).filter((l) => Number.isFinite(l.info.order));
    const i = levels.findIndex((l) => l.entry.id === mapId);
    return i >= 0 && i + 1 < levels.length ? levels[i + 1].entry.id : null;
}

/** Primer nivel de la campaña (o el primer mapa disponible). */
export function firstLevelId(content) {
    const levels = selectableLevels(content);
    return levels.length ? levels[0].entry.id : null;
}
