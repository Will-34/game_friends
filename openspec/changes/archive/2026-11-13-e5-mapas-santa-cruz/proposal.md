# Propuesta: e5-mapas-santa-cruz

- **Épica:** E5 Mapas · **Historias:** H-050, H-051, H-052, H-053, H-054, H-057, H-058, H-059
- **Estado:** Archivado (2026-11-13). Aprobado por el usuario (2026-11-13): "por el momento hazlo a tu manera… haz el commit y el merge".

## Por qué

El juego solo tenía la "Zona de pruebas" con gráficos provisionales. El usuario quiere que el juego se vea más real y tenga más vida, ambientado en **Santa Cruz de la Sierra (Bolivia)**, con jerga cruceña, un jefe al final de cada mapa y aliados que te ayudan contra él.

## Qué

1. **3 niveles** de Santa Cruz (H-051), generados en formato Tiled con `tools/build-level.php`:
   1. **Casco Viejo – Plaza 24 de Septiembre** (Catedral, casas coloniales con galerías, toborochis).
   2. **Ciudad Universitaria UAGRM** (módulos de facultad, laguna, palmeras; según la foto del usuario).
   3. **Lomas de Arena** (dunas rosadas al atardecer, curichis, arena movediza).
2. **Parallax definitivo por nivel** (H-052): 4 capas de pixel art generadas por tema (cielo, lejos, medio, cerca).
3. **Obstáculos y peligros** (H-053) como propiedades de tile: `hazard` (daño: parrilla, laguna, curichi), `slow` (charco, arena movediza), `bounce` (toldos y llantas que hacen rebotar).
4. **Progresión de dificultad** (H-054): cada mapa define el reparto Fácil/Normal/Difícil, el tamaño de los grupos y la vida del jefe.
5. **Selección de mapa** (H-050): pantalla nueva tras elegir protagonista; al superar un nivel se puede seguir al siguiente.
6. **Jefe por nivel** (H-057): al despejar el nivel se abre la arena del jefe. El jefe es un amigo "hackeado" al azar (más grande, con mucha vida y 2 fases), con escoltas aleatorias y refuerzos.
7. **Aliados contra el jefe** (H-058): llegan 2 aliados aleatorios controlados por IA; si caen, vuelven a los 5-10 s (máximo 2 veces cada uno).
8. **Historia y jerga cruceña** (H-059): pantalla de historia antes de cada nivel, frase del jefe, carteles de victoria y derrota con jerga ("¡Qué macana!", "chango", "¡Ahijuna!", "pues").

## Fuera de alcance

- El Robot Guardián y el rescate final de Henry (E6).
- Arte dibujado a mano: los fondos y tilesets son pixel art generado por código y se podrán cambiar por imágenes del usuario sin tocar código (H-070).
- Guardar el progreso (no se guarda nada entre sesiones).

## Impacto

- Nuevas escenas: `MapSelectScene`, `StoryScene`.
- `GameScene`: arena del jefe, aliados, terreno especial y continuación al siguiente nivel.
- `EnemyAI`: objetivo = hostil más cercano; modo "seguir al líder" para aliados; evita peligros.
- `Fighter`: soporte de escala (jefe más grande) y título propio.
- Nueva herramienta `tools/build-level.php` y configuraciones `tools/config/level-*.json`.
- Specs: nueva capacidad `levels` y `story`; se modifica `game-session`.
