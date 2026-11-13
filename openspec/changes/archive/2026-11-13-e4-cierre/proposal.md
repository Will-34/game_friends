# Propuesta: e4-cierre

- **Épica:** E4 Combate · **Historias:** H-039, H-044, H-055, H-056
- **Estado:** Archivado (2026-11-13). Aprobado por el usuario ("hazlo con tu recomendación, completa el E4").

## Por qué

Tras el análisis de E4: todos usaban la misma pistola, las granadas se agotaban sin recarga, la IA solo disparaba a la misma altura y se amontonaba, y no había resumen al terminar.

## Qué

Armas como datos con munición, objetos que sueltan los enemigos, IA por estados, resumen final, daño de enemigos según dificultad.

## Fuera de alcance

Armas para enemigos, que los enemigos recojan objetos, apoyo a aliados (E6).

## Resultado de pruebas

Edge sin interfaz vía DevTools Protocol: las 4 armas (lanzallamas 6 llamas activas, escopeta 10 perdigones en vuelo, munición descontada), Q cambia de arma, objetos recogidos (vida 50→80, granadas 5→8, metralleta +150), IA alerta → ataque, cartel final con resumen. Partida automática ~45 s sin errores en consola.
