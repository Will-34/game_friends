# Tareas: e5-mapas-santa-cruz

1. [x] Propuesta, diseño y deltas de specs (`levels`, `story`, `game-session`).
2. [x] `tools/lib/pixel-art.php` (primitivas GD) y `tools/lib/level-themes.php` (temas Casco Viejo, UAGRM, Lomas).
3. [x] `tools/build-level.php` y `tools/config/level-{casco-viejo,uagrm,lomas}.json`; niveles generados en `content/maps/`.
4. [x] `LevelCatalog.js`, `MapSelectScene`, `StoryScene`; flujo Protagonista → Mapa → Historia → Partida.
5. [x] Terreno especial (`hazard`, `slow`, `bounce`) en `GameScene.applyTerrain`; la IA evita los peligros.
6. [x] Dificultad por mapa (`DifficultyManager.parseWeights`/`pick(weights)`).
7. [x] Arena del jefe: barrera, apertura al despejar, cámara y límites fijos, jefe ×1,5 con 2 fases, escoltas y refuerzos.
8. [x] Aliados: 2 al azar, IA "seguir al líder", reaparición 5-10 s (máx. 2), habilidad ocasional, estado en el HUD.
9. [x] HUD: barra del jefe, aliados, avisos centrales. Globos de diálogo (`showSpeech`).
10. [x] Victoria → siguiente nivel; derrota → reintentar (desde el jefe si ya había empezado). Jerga cruceña.
11. [x] Pruebas en navegador (Edge sin interfaz vía DevTools Protocol).
12. [x] Documentación: GDD, ARQUITECTURA, COMO-AGREGAR-MAPA, ADR-012, CHECKLIST, README, BACKLOG, CHANGELOG.
13. [ ] Prueba humana: sensación del combate contra el jefe, equilibrio de vida del jefe y de los aliados, legibilidad del arte en móvil.

## Resultado de pruebas (2026-11-13)

Edge 157 sin interfaz vía DevTools Protocol, PHP 8.0.30, 960×540:

- Menú → protagonista → **ELIGE EL MAPA** (casco-viejo, uagrm, lomas y prueba en desarrollo) → historia con escritura progresiva → partida.
- Terreno: charco → buff `terrain` (lento); parrilla → −10 de vida; toldo → velocidad vertical −710 (rebote).
- Barrera: caminando hacia la arena con enemigos vivos, el protagonista se detiene en x = 4614 (arena en 4640) y aparece el aviso; al despejar se abre y, al llegar al centro, empieza el combate.
- Combate: jefe ×1,5 con 500 de vida (×5), 1-2 escoltas, 2 aliados distintos del protagonista y del jefe; límites del mundo = arena.
- Aliado eliminado → "vuelve en 6 s" → reaparece (quedan 1 de 2 reapariciones).
- Fase 2 al 45 %: jefe enfurecido y refuerzos (4 enemigos vivos).
- Derrota en la arena → reintento con `checkpoint: 'boss'` (sin enemigos del nivel, arena abierta).
- Victoria → "¡FUERZA CAMBA!" con el texto del nivel → Enter → historia del nivel 2 (uagrm).
- UAGRM (17 enemigos) y Lomas (20-21 enemigos) cargan y se juegan con IA automática.
- **Sin errores en consola** en todo el recorrido.
