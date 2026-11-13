# ADR-008 — Eliminar el fondo pintado de láminas opacas por color

- **Estado:** Aceptada
- **Fecha:** 2026-11-13

## Contexto

Las láminas de Carlos, Domeki, Henry, Ignacio, Pablo, Reymar, Ruddy, Sergio y Will son **opacas** (0 % de píxeles transparentes): el fondo gris-morado degradado está pintado. La de Plata sí tenía alfa. Decisión del usuario: usar las imágenes tal cual y quitar el fondo con la herramienta.

## Decisión

`tools/sprite-cutter.php` admite `"background": { "mode": "color" }`. Para cada región configurada (animaciones y efectos):

1. **Relleno del fondo desde los bordes de la región**: se aceptan píxeles "de fondo" (poco saturados, azulados, luminosidad 14–135) y el paso entre vecinos debe ser suave (≤ 40). El contorno oscuro del personaje frena el relleno.
2. **Halo oscuro** (`darkHalo`): los píxeles muy oscuros unidos al fondo se borran salvo que estén a ≤ 3 px del personaje (contorno).
3. **Líneas finas** (separadores de filas y bordes de letreros, grises o lilas): se borran los tramos finos (≤ 6 px) y largos (≥ 40 px).
4. Escala automática por fila (`autoScale`): las láminas dibujan cada fila a distinto tamaño; se iguala a la altura de `fire`.
5. Cuadros que se tocan: división automática si exceden `maxFrameWidth`, y **cortes manuales `splitX`** cuando el fogonazo de un cuadro toca al siguiente. `eraseRects` para casos que no se separan por columnas.

Se intentó detectar automáticamente los fogonazos "prestados" por color; no fue fiable (partía fogonazos o capas de color similar) y se reemplazó por `splitX` manual, revisado visualmente.

## Consecuencias

- Una lámina opaca nueva con la misma plantilla se incorpora copiando una configuración y revisando `tools/output/<id>.debug.png`.
- Los efectos semitransparentes (brillos verdes, sombra de Reymar) quedan como bloques sólidos (H-047).
- Los parámetros dependen de que el fondo sea oscuro y azulado; un fondo distinto requiere ajustar `lumMin`, `lumMax`, `satMax`, `bluishMin`.
