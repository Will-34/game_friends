# ADR-010 — Móvil: DeviceManager, aviso en HTML y pantalla completa nativa

- **Estado:** Aceptada
- **Fecha:** 2026-11-13

## Contexto

En móvil hay que jugar en horizontal, con controles táctiles cómodos y sin que la muesca tape el HUD. Hallazgos:
- La detección táctil de Phaser se hace una sola vez al cargar: al activar la emulación móvil con la página abierta, no había controles.
- En vertical, un aviso dibujado en el canvas 16:9 se veía diminuto.
- `ScaleManager.startFullscreen()` no captura el rechazo de la promesa del navegador ("not granted"), lo que deja una excepción en consola.
- iPhone (Safari) no permite pantalla completa de elementos ni bloquear la orientación desde una página web.

## Decisión

- `src/systems/DeviceManager.js` (instancia `device`) centraliza: detección táctil (también con el primer toque, evento `touch-detected`), iOS, pantalla completa con la API del navegador (capturando el rechazo), `screen.orientation.lock('landscape')`, aviso de girar, zonas seguras y antizoom.
- El aviso "Gira tu dispositivo" es HTML/CSS (`#rotate-overlay`), con pausa/reanudación de `Game`. **Se elimina `RotateDeviceScene`** (ajuste a la estructura de ADR-007).
- Pantalla completa + horizontal se piden al tocar JUGAR (gesto del usuario) y al confirmar personaje.
- `manifest.webmanifest` con `orientation: landscape` y `display: fullscreen` para "Añadir a pantalla de inicio".
- Controles táctiles anclados a los bordes (`right`/`bottom`) y desplazados por las zonas seguras.

## Consecuencias

- Android: experiencia tipo app (pantalla completa, horizontal fija).
- iPhone: aviso al estar en vertical; la mejor experiencia es "Añadir a pantalla de inicio" (sin barra de Safari).
- En pantallas más alargadas que 16:9 quedan franjas negras laterales (escalado FIT); aprovecharlas requiere un modo de escalado que adapte el ancho del mundo (H-029).
