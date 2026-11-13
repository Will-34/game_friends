# ADR-007 — Ajustes a la estructura de carpetas propuesta

- **Estado:** Aceptada
- **Fecha:** 2026-11-13

## Contexto

El prompt inicial define una estructura y pide justificar cualquier ajuste en un ADR.

## Decisión — elementos añadidos

| Elemento | Motivo |
| --- | --- |
| `api/lib/catalog-lib.php` | Lógica del catálogo compartida entre `api/catalog.php` y `tools/build-catalog.php` (sin duplicar código) |
| `content/config/controls.json` | Las teclas y botones táctiles deben estar en un archivo de configuración |
| `content/audio/audio.json` | Declaración de música/efectos (pedido en el prompt) |
| `content/characters/<id>/effects.png` | Efectos propios del personaje (fogonazo, explosión, humo, dron, granada) |
| `content/maps/<id>/tileset.png`, `bg-*.png` | Imágenes del mapa referenciadas por `map.json` |
| `src/systems/GameEvents.js` | Nombres de eventos compartidos entre escenas |
| `src/systems/SynthSfx.js` | Efectos sintetizados separados del `AudioManager` |
| `src/scenes/ui.js` | Botones y menús reutilizables por varias escenas |
| `tools/config/` | Parámetros de recorte y definición del mapa de prueba (datos, no código) |
| `tools/output/` | Informes y vistas de depuración de las herramientas (ignorado por git) |
| `docs/fuente/LEEME.md` | Indica que falta `requisitos-v2.md` |
| `.htaccess` (raíz) | En Apache, evita servir `assets-originales/`, `tools/`, `docs/`, `openspec/` y `.md` |
| `src/scenes/CharacterSelectScene.js` | Pantalla de selección de protagonista (E3) |
| `content/characters/<id>/portrait.png` | Retrato generado por `sprite-cutter.php` |
| `favicon.png` | Evita el error 404 de `favicon.ico` en consola (derivado del sprite de Plata) |

## Consecuencias

La estructura base del prompt se mantiene intacta; solo se agregan archivos con responsabilidad única.
