# ADR-012 — Niveles generados por tema, jefe por nivel y aliados

- **Estado:** Aceptada
- **Fecha:** 2026-11-13

## Contexto

E5 pedía 3 niveles con parallax, obstáculos y progresión. El usuario pidió ambientarlos en Santa Cruz de la Sierra (Casco Viejo, UAGRM, Lomas de Arena), con un jefe al final de cada mapa, aliados que ayudan contra él y jerga cruceña. No hay arte de escenarios todavía y la regla del proyecto prohíbe inventar arte nuevo de **personajes**.

## Decisión

1. **Arte de escenario generado por código** (`tools/build-level.php` + `tools/lib/level-themes.php`): cada tema pinta con PHP GD 4 fondos (cielo, lejos, medio, cerca) y un tileset de 8 tiles a media resolución, escalados ×2 con vecino más cercano. Así el pixel art es uniforme y coherente con los personajes. Los temas solo existen en la herramienta: el juego lee `map.json` y PNG, que pueden reemplazarse por arte propio sin tocar código.
2. **Datos del nivel en propiedades de Tiled** (`order`, `story`, `difficulty`, `boss*`, `allies`, `allyRespawns`, `clearText`) y objetos `arena`/`boss`. `LevelCatalog.js` las lee; el código no menciona mapas concretos.
3. **Terreno especial como propiedades de tile** (`hazard`, `slow`, `bounce`), aplicado por `GameScene.applyTerrain` a cualquier `Fighter`. La IA trata los peligros como un borde (no los pisa).
4. **El jefe es un personaje existente** (un amigo "hackeado" al azar) con escala ×1,5, tinte, más vida y 2 fases, en vez de un sprite nuevo (respeta la regla de no inventar arte de personajes). El Robot Guardián queda para E6.
5. **Aliados con la misma IA** (`EnemyAI`) en modo "seguir al líder"; todas las IA apuntan al hostil más cercano. Reaparición de 5 a 10 s, máximo `allyRespawns` veces.
6. **Arena con barrera:** solo se entra al jefe con el nivel despejado. Así no quedan enemigos rezagados fuera de los límites reducidos del mundo, y el combate empieza limpio. Al morir en la arena se reintenta desde el jefe (`checkpoint: 'boss'`).

## Consecuencias

- Añadir un nivel = un `tools/config/level-<id>.json` (y, si hace falta, un tema nuevo en la herramienta) o un mapa hecho en Tiled con las mismas propiedades.
- El arte generado es provisional respecto a H-070 (arte definitivo), pero ya es jugable y reconocible.
- Volver a ejecutar `build-level.php` sobrescribe los PNG del nivel: si se reemplazan por arte propio, no regenerar ese nivel (o separar la generación del arte en el futuro).
