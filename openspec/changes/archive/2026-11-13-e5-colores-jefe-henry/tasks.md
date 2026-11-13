# Tareas: e5-colores-jefe-henry

1. [x] `NAME_COLORS` en `GameScene` (verde / rojo / lila) y estrellas de dificultad en el nombre.
2. [x] `bossHealth` 8 / 11 / 14; `updateBoss` lanza el dron del jefe.
3. [x] `spawnCaptive` / `updateCaptive` / `freeCaptive` (jaula, globos, liberación con salto y `victory`); propiedad `captive` en los niveles; textos de historia.
4. [x] Reinicio del estado del jefe en `init`.
5. [x] Pruebas en navegador.
6. [x] Documentación y specs.

## Resultado de pruebas (2026-11-13)

Edge 157 sin interfaz vía DevTools Protocol, PHP 8.0.30:

- Nombres: SERGIO (protagonista) `#7dff8a`, enemigos `#ff5a5a` con ★/★★, aliados `#7dff8a`, jefe "★ RUDDY ★" `#d7a6ff`.
- Jefe de Casco Viejo con 800 de vida; UAGRM 1100; Lomas 1400. El jefe lanzó su dron (`drone:ruddy`).
- Henry enjaulado sobre el jefe (sigue su posición), globo "¡Ayúdenme, changos!"; al vencer al jefe: jaula rota, Henry en el suelo con `henry_victory` y "¡Gracias, changos! ¡Soy libre!".
- Reintento desde el jefe en UAGRM: estado limpio; el jefe vuelve a enfurecerse y Henry vuelve a estar capturado.
- Jugando con Henry: no hay capturado.
- **Sin errores en consola.**
