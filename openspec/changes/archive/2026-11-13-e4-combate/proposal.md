# Propuesta: e4-combate

- **Épica:** E4 Combate · **Historias:** H-040, H-041, H-042, H-043, H-048, H-049
- **Estado:** Archivado (2026-11-13). Pedido y aprobado por el usuario ("haz eso").

## Por qué

El combate era solo disparar. El usuario pidió habilidades especiales con sentido, granadas, más enemigos a la vez, dificultad aleatoria, habilidades y gestos de los enemigos, "+1" con un símbolo propio en cada baja y nombres visibles.

## Qué

- Habilidades: carga con 2 bajas, tecla L / botón; tipos `buff`, `drone`, `shadow-dash` (ADR-009).
- Granadas: tecla U / botón; daño en área.
- Grupos de 2-3 enemigos por zona; dificultad aleatoria; habilidades enemigas de una en una.
- "+1" + símbolo en cada baja; gesto del enemigo al acertar; nombres y mini barras de vida.

## Fuera de alcance

Armas y cambio de arma (H-039); IA definitiva (H-044); apoyo a aliados de las habilidades de soporte (E6).

## Resultado de pruebas

Edge sin interfaz vía DevTools Protocol, `php -S localhost:8000`:
- 10-11 enemigos con dificultades variadas; granada: 4 restantes y 3 enemigos dañados; 2 bajas → carga 1 → L activa "Bandera de Poder" (aura arcoíris, animación `special`).
- Las 10 habilidades activadas una a una sin errores (Domeki 5→8 granadas; Reymar avanza 364 px; dron de Plata disparando).
- `EnemyAbilityDirector` activa la habilidad de un solo enemigo.
- Partida automática de ~45 s (correr, saltar, disparar, granadas, habilidad) sin errores en consola.
