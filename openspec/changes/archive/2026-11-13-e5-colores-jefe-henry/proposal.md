# Propuesta: e5-colores-jefe-henry

- **Épica:** E5 Mapas · **Historias:** H-066, H-067, H-068
- **Estado:** Archivado (2026-11-13). Pedido directo del usuario: "los enemigos que tengan nombre rojo y los aliados con verde… el personaje elegido… verde igual, y el jefe final que tenga más vida y tenga su dron, y su nombre sea lila… henry tiene que estar montado en el jefe final… cuando lo derrotemos henry esté feliz y salga de la captura".

## Qué

1. **Colores por bando (H-066):** protagonista y aliados en verde, enemigos en rojo, jefe en lila. La dificultad de cada enemigo ya no se ve por el color: se marca con estrellas junto al nombre (Normal ★, Difícil ★★).
2. **Jefe más fuerte (H-067):** vida ×8 / ×11 / ×14 (antes ×5 / ×7 / ×9) y lanza su propio dron cuando tiene a alguien cerca (en la fase 2 se recarga antes).
3. **Henry capturado (H-068):** propiedad de mapa `captive` (`henry` en los 3 niveles). El capturado va enjaulado sobre los hombros del jefe y pide ayuda; al vencer al jefe la jaula se rompe, salta al suelo, celebra (`victory`) y agradece. Si el protagonista es el capturado, no aparece. Historias y textos finales ajustados (el robot se lo vuelve a llevar al siguiente nivel).
4. Corrección: al reintentar, el estado del jefe (enfurecido, capturado) se reinicia (antes el jefe no se enfurecía en el segundo intento).
