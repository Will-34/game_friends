# ADR-004 — Acciones abstractas y controladores combinables

- **Estado:** Aceptada
- **Fecha:** 2026-11-13

## Contexto

Un mismo personaje puede ser controlado por teclado, táctil o IA según su rol. Las entidades no deben saber quién las controla.

## Decisión

- Acciones abstractas: `moveX` (analógica, −1…1) y botones `jump`, `shoot`, `crouch`, `aimUp`, `grenade`, `special`, `switchWeapon`, `pause` (`src/input/Actions.js`).
- Toda fuente de entrada implementa `read(raw, time, delta)` y solo escribe el estado "mantenido". `Controller` combina varias fuentes (suma de `moveX`, OR de botones) y `ActionState` calcula los flancos `pressed`/`released` en un único lugar.
- El jugador usa `Controller([KeyboardControls, TouchProxy])`; los enemigos `Controller([DummyEnemyAI])`.
- Las teclas se definen en `content/config/controls.json`; los botones táctiles también.
- Los controles táctiles se dibujan en el `HudScene` (cámara fija) y se publican en `game.registry`; `TouchProxy` permite que el jugador los lea aunque el HUD se cree después.

## Consecuencias

- Cambiar teclas, añadir mando (gamepad) o una IA nueva = una fuente nueva, sin tocar `Fighter`.
- Un aliado (E6) será un `Fighter` con rol `ALLY` y un controlador de IA.
