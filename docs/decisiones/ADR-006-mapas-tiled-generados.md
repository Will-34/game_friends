# ADR-006 — Mapas en Tiled JSON; mapa de prueba generado desde datos

- **Estado:** Aceptada
- **Fecha:** 2026-11-13

## Contexto

Los mapas se diseñarán con Tiled. Para E1 basta un mapa de prueba, y el editor Tiled no está instalado en la máquina de desarrollo.

## Decisión

- Formato estándar Tiled JSON (tilesets incrustados), con capas `ground` (tiles), `spawns` (objetos) y capas de imagen con `parallaxx` para fondos.
- Propiedades de tile `collides` y `oneWay`; propiedades de mapa `name`, `music`, `backgroundColor`, `placeholder`.
- El mapa de prueba se genera con `tools/build-test-map.php` a partir de `tools/config/map-prueba.json` (suelos, plataformas, cajas, apariciones), junto con un tileset y fondos **provisionales** dibujados con GD. El resultado es un `map.json` válido que puede abrirse y seguir editándose en Tiled.
- El JSON del mapa se descarga en el arranque (para conocer sus imágenes) y se registra directamente en la caché de tilemaps de Phaser.
- Plataformas `oneWay`: se resuelven con un *process callback* del colisionador (solo chocan al caer desde arriba); las balas las atraviesan.

## Consecuencias

- Los niveles reales (E5) se dibujan en Tiled sin cambiar el código.
- El generador seguirá siendo útil para mapas de prueba rápidos.
