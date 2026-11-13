# ADR-011 — Armas como datos, objetos de los enemigos e IA por estados

- **Estado:** Aceptada
- **Fecha:** 2026-11-13

## Decisión

- **Armas** en `content/config/weapons.json` (cadencia, daño, velocidad, perdigones, dispersión, munición, alcance, `pierce`, `grow`, textura). La pistola usa los stats de cada personaje (ya ajustados por rol y dificultad), así los enemigos siguen siendo más débiles. Inventario en el `Fighter`: la pistola siempre está; las demás se pierden al agotar la munición.
- **Objetos** (`PickupManager`): probabilidad y tabla de pesos en el mismo JSON. Iconos generados en un canvas (sin arte externo).
- **IA** (`EnemyAI`) por estados simples en lugar de un árbol de comportamiento: suficiente para un run-and-gun y fácil de ajustar por dificultad (`reactionMs`, `leash`, `chaseSpeed`, `sightRange`, ráfagas, granadas). Los enemigos usan solo la pistola.

## Consecuencias

- Añadir un arma = una entrada en el JSON (y opcionalmente una textura en `BootScene`).
- Los enemigos no recogen objetos ni usan otras armas (posible mejora futura).
