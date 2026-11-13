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
    - tipo/clase `enemy` — propiedades `characterId` (string, id del personaje) y `patrol` (int, tiles a cada lado).
  - Capas de imagen opcionales con **Parallax X** (`parallaxx`): 0 = fija, 1 = se mueve con el mundo.
- Propiedades del mapa: `name` (nombre visible), `music` (id de música en `audio.json`), `backgroundColor` (`#rrggbb`), `placeholder` (bool).

## Pasos

1. Crea la carpeta y el mapa en Tiled (o parte de `content/maps/prueba/map.json`, que se abre en Tiled).
2. Exporta como JSON a `content/maps/<id>/map.json`.
3. Ejecuta `php tools/build-catalog.php`.
4. Abre el juego: el mapa aparece en el catálogo. (La pantalla de selección de mapa llega en E5; hasta entonces se usa `DEFAULTS.mapId` en `src/config.js`.)

## Mapa de prueba generado

`content/maps/prueba/` se genera con:

```bash
php tools/build-test-map.php tools/config/map-prueba.json
```

La definición (`tools/config/map-prueba.json`) describe suelos, plataformas, cajas y apariciones. Los gráficos del tileset y los fondos son **provisionales**.
