# Cómo agregar un mapa

Los mapas usan el formato **Tiled JSON** ([Tiled](https://www.mapeditor.org/), gratuito) y viven en `content/maps/<id>/`.

## Contenido de la carpeta

```
content/maps/<id>/
├── map.json        exportado desde Tiled (JSON, tilesets INCRUSTADOS)
├── tileset.png     imágenes de los tilesets que use el mapa
└── bg-*.png        fondos parallax (capas de imagen)
```

## Requisitos del mapa

- Orientación ortogonal, tiles de 32 × 32 (recomendado), alto mínimo 17 tiles (544 px ≥ 540 de pantalla).
- **Tilesets incrustados** en el mapa ("Embed tileset"), con la imagen en la misma carpeta.
- Propiedades de tile (en el tileset):
  - `collides` (bool) — el tile es sólido.
  - `oneWay` (bool) — plataforma atravesable desde abajo (requiere también `collides`).
- Capas:
  - `ground` — capa de tiles con la colisión.
  - `spawns` — capa de objetos con puntos:
    - tipo/clase `player` — aparición del protagonista.
    - tipo/clase `enemy` — propiedades `characterId` (string, id del personaje o `random`), `count` (número o rango `"2-3"`) y `patrol` (int, tiles a cada lado).
    - tipo/clase `arena` — borde izquierdo de la arena del jefe (la arena mide 960 px = 30 tiles).
    - tipo/clase `boss` — aparición del jefe. Sin `arena` + `boss` el mapa se gana eliminando a todos los enemigos.
  - Capas de imagen opcionales con **Parallax X** (`parallaxx`): 0 = fija, 1 = se mueve con el mundo.
  - Propiedades de tile opcionales: `hazard` (int, daño cada 0,6 s), `slow` (float, multiplicador de velocidad), `bounce` (int, velocidad del rebote).
- Propiedades del mapa: `name` (nombre visible), `subtitle`, `order` (int, posición en la campaña; sin él solo se ve en desarrollo), `story` (texto de la pantalla de historia, líneas separadas por salto de línea), `difficulty` (`facil:60,normal:30,dificil:10`), `bossName`, `bossTaunt`, `bossHealth` (multiplicador de vida), `bossEscorts`, `bossReinforcements`, `allies`, `allyRespawns`, `clearText`, `music` (id de música en `audio.json`), `backgroundColor` (`#rrggbb`), `placeholder` (bool).

## Pasos

1. Crea la carpeta y el mapa en Tiled (o parte de `content/maps/prueba/map.json`, que se abre en Tiled).
2. Exporta como JSON a `content/maps/<id>/map.json`.
3. Ejecuta `php tools/build-catalog.php`.
4. Abre el juego: el mapa aparece en el catálogo. (La pantalla de selección de mapa llega en E5; hasta entonces se usa `DEFAULTS.mapId` en `src/config.js`.)

## Niveles generados (Santa Cruz)

Los 3 niveles se generan con:

```bash
php tools/build-level.php --all                                # o un solo nivel:
php tools/build-level.php tools/config/level-casco-viejo.json
```

Cada `tools/config/level-<id>.json` define el tema de arte (`casco-viejo`, `uagrm`, `lomas` en `tools/lib/level-themes.php`), el tamaño, el suelo por tramos (`surface`: `ground`, `hazard`, `slow`), las plataformas (`type`: `platform`, `bounce`), las cajas, las apariciones y las propiedades del mapa.

Para usar **arte propio**: reemplaza en `content/maps/<id>/` los PNG con el mismo nombre y tamaño (`bg-sky`, `bg-far`, `bg-mid`, `bg-near` de 1600×540 que se repiten en horizontal, con transparencia excepto el cielo; `tileset.png` de 8 tiles de 32×32 en el orden: superficie, relleno, plataforma, caja, peligro, rebote, terreno lento, relleno bajo el peligro). Ojo: volver a ejecutar `build-level.php` los sobrescribe.

## Mapa de prueba generado

`content/maps/prueba/` se genera con:

```bash
php tools/build-test-map.php tools/config/map-prueba.json
```

La definición (`tools/config/map-prueba.json`) describe suelos, plataformas, cajas y apariciones. Los gráficos del tileset y los fondos son **provisionales**.
