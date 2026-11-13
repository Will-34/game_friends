# ADR-002 — Contenido guiado por datos y catálogo PHP con respaldo estático

- **Estado:** Aceptada
- **Fecha:** 2026-11-13

## Contexto

Habrá 10 personajes, varios mapas y habilidades. Agregar contenido no debe requerir tocar el código del juego.

## Decisión

- Cada personaje es una carpeta `content/characters/<id>/` con `character.json` + `spritesheet.png` (+ `effects.png`).
- Cada mapa es una carpeta `content/maps/<id>/` con `map.json` (Tiled JSON) + imágenes.
- `api/catalog.php` recorre ambas carpetas y devuelve el catálogo en JSON. La lógica vive en `api/lib/catalog-lib.php` (compatible con PHP 7.4/8.x) y la reutiliza `tools/build-catalog.php` para generar `content/catalog.json`.
- El cliente intenta `api/catalog.php`; si falla (sin PHP, error 500, red), usa `content/catalog.json`.
- Las claves de Phaser se derivan de los ids (`char:<id>`, `fx:<id>`, `<id>_<anim>`, `map:<id>`), así no hay colisiones ni nombres fijos en el código.
- La identidad del personaje (JSON) es independiente de su rol (asignado en ejecución por `CharacterRoleManager`).

## Consecuencias

- Agregar un personaje o mapa = copiar una carpeta + `php tools/build-catalog.php`.
- El respaldo estático debe regenerarse antes de cada despliegue (documentado en README).
- Validación mínima en el cliente: lo inválido se omite con aviso en consola en lugar de romper el juego.
