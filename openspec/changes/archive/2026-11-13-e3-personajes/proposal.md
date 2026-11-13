# Propuesta: e3-personajes

- **Épica:** E3 Personajes · **Historias:** H-035, H-045, H-036, H-037 (parte jugable), H-038, H-046
- **Estado:** Archivado (2026-11-13). Aprobado por el usuario: "avanza con el E3, implementa los personajes faltantes".

## Por qué

El juego tiene 10 personajes; solo Plata era jugable. El usuario aportó las láminas de los otros 9 y pidió poder elegir protagonista.

## Qué

- Herramienta: eliminación del fondo pintado (las 9 láminas nuevas son opacas), escala automática por fila, corrección de cuadros unidos, retratos y medidas automáticas (ADR-008).
- Los 9 personajes incorporados con su arquetipo y habilidad (descritos en sus láminas). Henry jugable.
- Pantalla "Elige tu protagonista".
- Enemigos aleatorios entre los demás personajes (nunca el protagonista ni Henry).
- Retrato en el HUD y fogonazo genérico.

## Alcance

Contenido, herramienta, selección y asignación de enemigos. Las habilidades no tienen lógica (E4). Henry como objetivo del rescate: E6.

## Fuera de alcance

E2 (móvil) — su propuesta sigue pendiente de aprobación. Disparo hacia arriba real (ninguna lámina lo trae).

## Resultado de pruebas

Edge sin interfaz vía DevTools Protocol, `php -S localhost:8000`:
- Menú → JUGAR → selección (10 tarjetas) → → → Enter → partida con Ruddy; enemigos `plata, will, sergio, reymar`; salir al menú. Sin errores en consola.
- Los 10 personajes iniciados uno a uno: disparo de pie, agachado, hacia arriba y salto; en ningún caso el protagonista o Henry aparecieron como enemigos. Balas a la altura del cañón (revisión visual). Sin errores en consola.
- Revisión visual de los 9 spritesheets (`tools/output/<id>.debug.png`). Defectos menores registrados en H-047.
