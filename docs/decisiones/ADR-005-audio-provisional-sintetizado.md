# ADR-005 — Audio: efectos provisionales sintetizados y archivos .ogg + .mp3

- **Estado:** Aceptada
- **Fecha:** 2026-11-13

## Contexto

Se necesitan efectos desde E1 sin infringir derechos de autor y sin archivos todavía. iOS y Chrome exigen un gesto del usuario para reproducir audio.

## Decisión

- `AudioManager` único (`audio`) con volumen de música y de efectos independientes, silencio global y desbloqueo con el primer `pointerdown`/`keydown`/`touchend`.
- Efectos provisionales generados con Web Audio API (`SynthSfx.js`, osciladores y ruido filtrado) en un `AudioContext` propio.
- Archivos reales declarados en `content/audio/audio.json` en **dos formatos** (`.ogg` y `.mp3`) para cubrir Safari; Phaser elige el compatible. Un efecto con archivo sustituye a su versión sintetizada.
- No se persiste el estado de silencio (requisito: no se guarda nada).

## Consecuencias

- E1 tiene sonido sin depender de licencias.
- En E7 se sustituyen por archivos CC0/CC-BY registrados en `CREDITS.md` (ver `docs/AUDIO.md`).
