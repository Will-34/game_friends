# Proyecto: Rescatando a Henry

## Contexto

Videojuego arcade 2D de acción lateral (run-and-gun) en pixel art, 100 % original, para navegador (PC y móvil). Nueve amigos pueden ser protagonistas o enemigos; al final cuatro se vuelven aliados para rescatar a Henry de un robot gigante. Diseño: `docs/GDD.md`. Reglas: `AGENTS.md`.

## Stack

- Phaser v4.2.1 local (`lib/phaser.min.js`), JavaScript con módulos ES nativos, HTML5, CSS3.
- PHP 7.4/8.x solo para `index.php` y `api/catalog.php`. Sin Node.js ni compilación en producción.
- Herramientas: PHP CLI + GD (`tools/`). Mapas: Tiled JSON.
- Sin persistencia (no MySQL ni `localStorage` por ahora).

## Convenciones

- Código, comentarios y documentación en español; nombres de archivos, clases y variables en inglés.
- Contenido guiado por datos: `content/characters/<id>/`, `content/maps/<id>/`, `src/abilities/<id>.js`.
- Claves de Phaser derivadas de ids: `char:<id>`, `fx:<id>`, `<id>_<anim>`, `map:<id>`.
- Commits: Conventional Commits en español (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`…).
- Recursos provisionales: `placeholder: true` + `note`, y registro en el BACKLOG.

## Metodología OpenSpec (sin CLI)

- `openspec/specs/<capacidad>/spec.md`: estado ACTUAL del sistema. Requisitos con **DEBE** y al menos un `#### Escenario:` con DADO / CUANDO / ENTONCES.
- `openspec/changes/<id>/`: `proposal.md` (por qué, qué, alcance, fuera de alcance), `tasks.md`, `design.md` (opcional), `specs/<capacidad>/spec.md` con `## AGREGADO`, `## MODIFICADO`, `## ELIMINADO`.
- Al terminar: fusionar deltas en `specs/`, mover a `changes/archive/AAAA-MM-DD-<id>/`, actualizar CHANGELOG y BACKLOG.

## Capacidades actuales

| Capacidad | Spec |
| --- | --- |
| Catálogo de contenido | `specs/content-catalog/spec.md` |
| Pipeline de sprites | `specs/sprite-pipeline/spec.md` |
| Entrada y acciones | `specs/input-actions/spec.md` |
| Personajes (Fighter) | `specs/fighter/spec.md` |
| Partida (mapa, cámara, HUD, pausa) | `specs/game-session/spec.md` |
| Audio | `specs/audio/spec.md` |
| Visor de animaciones | `specs/anim-viewer/spec.md` |
| Selección de protagonista | `specs/character-select/spec.md` |
| Niveles (mapas, terreno, jefe y aliados) | `specs/levels/spec.md` |
| Historia | `specs/story/spec.md` |
| Final (Robot Guardián y rescate) | `specs/final/spec.md` |
