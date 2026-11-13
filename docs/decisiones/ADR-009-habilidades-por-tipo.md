# ADR-009 — Habilidades especiales por tipo reutilizable y buffs

- **Estado:** Aceptada
- **Fecha:** 2026-11-13

## Contexto

Hay 10 habilidades distintas (descritas en las láminas). Escribir 10 implementaciones separadas duplicaría código: la mayoría son mejoras temporales (velocidad, daño, defensa, curación, escudo).

## Decisión

- `character.json → ability` declara `type` y `params`. `src/abilities/registry.js` registra **tipos**:
  - `buff`: mejora temporal configurable (`speedMul`, `damageMul`, `damageTakenMul`, `jumpMul`, `regenPerSec`, `invulnerable`, `heal`, `grenades`, `aura`). Lo usan 8 personajes.
  - `drone`: dron que sigue al dueño y dispara (Plata).
  - `shadow-dash`: embestida invulnerable que daña al atravesar (Reymar).
- El `Fighter` mantiene una lista de **buffs** con caducidad; sus valores se combinan (producto de multiplicadores, suma de regeneración).
- Carga: 0,5 por baja → con 2 bajas se puede usar (L). Los enemigos no usan carga: `EnemyAbilityDirector` decide (uno a la vez, cada 9-16 s, solo enemigos visibles).
- `enemyAbility: null` significa "usar la misma habilidad"; un valor propio permitiría una habilidad distinta como enemigo.

## Consecuencias

- Ajustar una habilidad = editar números en `character.json`.
- Un efecto nuevo (p. ej. una torreta) requiere un tipo nuevo en `src/abilities/`.
- El "apoyo a aliados" de algunas descripciones (Carlos, Domeki, Ignacio, Ruddy) se aplica de momento al propio personaje; se extenderá a los aliados en E6.
