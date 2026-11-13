# ADR-001 — Phaser local, módulos ES nativos, sin paso de compilación

- **Estado:** Aceptada
- **Fecha:** 2026-11-13

## Contexto

El servidor de producción solo tiene PHP, MySQL y CSS. No hay Node.js, npm ni bundlers. El juego debe correr 100 % en el navegador y funcionar en Chrome, Edge, Firefox, Safari, Android e iOS.

## Decisión

- Usar **Phaser v4.2.1** (última versión estable publicada en el repositorio oficial `phaserjs/phaser`, 2026-07-09), descargada como archivo local:
  - Archivo: `lib/phaser.min.js` (build UMD completo: WebGL/Canvas, Web Audio, Arcade Physics, Tilemaps).
  - Origen: `https://github.com/phaserjs/phaser/releases/download/v4.2.1/phaser.min.js`
  - Tamaño: 1 375 976 bytes
  - SHA-256: `66348b1b5141e49b7d5ebbe688cddcb502eab1cb00f21c538686a5b2c5abe4de`
  - Verificado en el archivo: `VERSION:"4.2.1"` y consola `Phaser v4.2.1 (WebGL | Web Audio)`.
- Cargar Phaser como **script clásico** (`<script src="lib/phaser.min.js">`, variable global `Phaser`) antes del módulo `src/main.js`.
- Todo el código del juego en **módulos ES nativos** (`import`/`export`), sin TypeScript, JSX ni frameworks.
- `index.php` añade `?v=` a CSS/JS para invalidar caché al desplegar.

## Alternativas consideradas

- `phaser.esm.min.js` (módulo ES): descartado por ahora; el build UMD global es el más probado y evita diferencias de resolución de módulos entre navegadores.
- Phaser 3.x: descartado; v4 es la versión estable actual. La API usada (escenas, Arcade, Tilemaps, Scale Manager) es compatible y se verificó en el navegador.

## Consecuencias

- Sin herramientas de compilación: cualquier editor sirve; se despliega copiando archivos.
- Sin minificación del código propio (aceptable por tamaño).
- Para actualizar Phaser: descargar el nuevo `phaser.min.js`, actualizar este ADR (versión, tamaño, SHA-256), cambiar `?v=` en `index.php` y pasar el CHECKLIST completo.
