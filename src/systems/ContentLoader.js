/**
 * ContentLoader.js — Descubre y carga el contenido guiado por datos.
 *
 * 1. Catálogo: api/catalog.php (en vivo) o content/catalog.json (respaldo).
 * 2. Definiciones: character.json de cada personaje y map.json (Tiled) de cada mapa.
 * 3. Recursos: encola en el Loader de Phaser spritesheets, tilesets, fondos y audio.
 * 4. Animaciones: crea las animaciones de Phaser a partir de character.json.
 *
 * El código nunca menciona personajes ni mapas concretos.
 */
import { PATHS } from '../config.js';

// ---------- Claves de Phaser derivadas de los ids (únicas en todo el juego) ----------
export const textureKey = (charId) => `char:${charId}`;
export const effectsKey = (charId) => `fx:${charId}`;
export const portraitKey = (charId) => `portrait:${charId}`;
export const animKey = (charId, anim) => `${charId}_${anim}`;
export const mapKey = (mapId) => `map:${mapId}`;
export const mapImageKey = (mapId, image) => `map:${mapId}:${image}`;

const REQUIRED_CHARACTER_FIELDS = ['id', 'name', 'stats', 'animations', 'frameWidth', 'frameHeight', 'spritesheet'];

async function fetchJson(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status} al cargar ${url}`);
    return res.json();
}

function isValidCatalog(c) {
    return c && Array.isArray(c.characters) && Array.isArray(c.maps);
}

export class ContentLoader {
    /** Obtiene el catálogo; si el PHP falla, usa el JSON estático. */
    static async loadCatalog() {
        try {
            const catalog = await fetchJson(PATHS.catalogApi);
            if (!isValidCatalog(catalog)) throw new Error('Catálogo con formato inválido');
            catalog.source = 'api';
            return catalog;
        } catch (err) {
            console.info(`[ContentLoader] catalog.php no disponible (${err.message}); usando ${PATHS.catalogFallback}`);
            const catalog = await fetchJson(PATHS.catalogFallback);
            if (!isValidCatalog(catalog)) throw new Error('content/catalog.json inválido');
            catalog.source = 'fallback';
            return catalog;
        }
    }

    /**
     * Carga todo lo necesario antes del Preload: catálogo, definiciones, controles y audio.
     * @returns {Promise<object>} objeto "content" que se guarda en game.registry
     */
    static async loadAll() {
        const catalog = await ContentLoader.loadCatalog();
        const [controls, audioConfig, weapons] = await Promise.all([
            fetchJson(PATHS.controls),
            fetchJson(PATHS.audio),
            fetchJson(PATHS.weapons),
        ]);

        // Se descargan en paralelo pero se guardan en el orden del catálogo (orden de la pantalla de selección)
        const defs = await Promise.all(
            catalog.characters.map(async (entry) => {
                try {
                    const def = await fetchJson(`${entry.path}character.json`);
                    const missing = REQUIRED_CHARACTER_FIELDS.filter((f) => def[f] === undefined);
                    if (missing.length) throw new Error(`faltan campos: ${missing.join(', ')}`);
                    def.basePath = entry.path;
                    return def;
                } catch (err) {
                    console.warn(`[ContentLoader] Personaje "${entry.id}" omitido: ${err.message}`);
                    return null;
                }
            })
        );
        const characters = new Map();
        for (const def of defs) if (def) characters.set(def.id, def);

        const maps = new Map();
        await Promise.all(
            catalog.maps.map(async (entry) => {
                try {
                    const data = await fetchJson(`${entry.path}map.json`);
                    if (data.type !== 'map' || !Array.isArray(data.layers)) throw new Error('no es un mapa Tiled JSON');
                    maps.set(entry.id, { ...entry, data });
                } catch (err) {
                    console.warn(`[ContentLoader] Mapa "${entry.id}" omitido: ${err.message}`);
                }
            })
        );

        if (characters.size === 0) throw new Error('No hay ningún personaje válido en content/characters/');
        if (maps.size === 0) throw new Error('No hay ningún mapa válido en content/maps/');

        return { catalog, characters, maps, controls, audio: audioConfig, weapons };
    }

    /** Encola en el Loader de Phaser los recursos de todos los personajes y mapas. */
    static queueAssets(scene, content) {
        const load = scene.load;
        for (const def of content.characters.values()) {
            load.spritesheet(textureKey(def.id), def.basePath + def.spritesheet, {
                frameWidth: def.frameWidth,
                frameHeight: def.frameHeight,
            });
            if (def.portrait) {
                load.image(portraitKey(def.id), def.basePath + def.portrait);
            }
            if (def.effects) {
                load.spritesheet(effectsKey(def.id), def.basePath + def.effects.image, {
                    frameWidth: def.effects.frameWidth,
                    frameHeight: def.effects.frameHeight,
                });
            }
        }
        for (const map of content.maps.values()) {
            // El JSON ya está descargado: se registra directamente en la caché de tilemaps.
            scene.cache.tilemap.add(mapKey(map.id), { format: Phaser.Tilemaps.Formats.TILED_JSON, data: map.data });
            for (const ts of map.data.tilesets || []) {
                if (ts.image) load.image(mapImageKey(map.id, ts.image), map.path + ts.image);
            }
            for (const layer of map.data.layers) {
                if (layer.type === 'imagelayer' && layer.image) {
                    load.image(mapImageKey(map.id, layer.image), map.path + layer.image);
                }
            }
        }
    }

    /** Crea las animaciones de Phaser de un personaje a partir de su character.json. */
    static createAnimations(scene, def) {
        const anims = scene.anims;
        for (const [name, a] of Object.entries(def.animations)) {
            const key = animKey(def.id, name);
            if (anims.exists(key)) continue;
            anims.create({
                key,
                frames: anims.generateFrameNumbers(textureKey(def.id), { frames: a.frames }),
                frameRate: a.fps,
                repeat: a.loop ? -1 : 0,
            });
        }
    }
}

/** Lee una propiedad personalizada de Tiled (array [{name, value}]) */
export function tiledProp(obj, name, fallback = undefined) {
    const p = (obj && obj.properties ? obj.properties : []).find((x) => x.name === name);
    return p ? p.value : fallback;
}
