# Diseño: e5-mapas-santa-cruz

## Datos del mapa (propiedades de Tiled)

| Propiedad | Tipo | Uso |
| --- | --- | --- |
| `name` | string | Nombre visible del nivel |
| `subtitle` | string | Lugar o descripción corta |
| `order` | int | Orden en la campaña. Sin `order` el mapa solo aparece en modo desarrollo |
| `story` | string | Texto de la pantalla de historia (líneas separadas por `\n`) |
| `difficulty` | string | Pesos de dificultad: `facil:60,normal:30,dificil:10` |
| `bossName` | string | Título del jefe (p. ej. "EL CAPO DE LA PLAZA") |
| `bossTaunt` | string | Frase del jefe al aparecer |
| `bossHealth` | int | Multiplicador de la vida base del personaje jefe |
| `bossEscorts` | int | Escoltas al empezar el combate |
| `bossReinforcements` | int | Refuerzos al bajar el jefe a la mitad de vida |
| `allies` | int | Aliados que llegan al combate del jefe (2) |
| `allyRespawns` | int | Veces que cada aliado puede volver (2) |
| `clearText` | string | Texto al vencer al jefe |
| `music`, `backgroundColor` | string | Como antes |

Objetos de `spawns`: `player`, `enemy` (como antes), **`arena`** (borde izquierdo de la arena del jefe) y **`boss`** (aparición del jefe). Sin `arena` ni `boss`, el mapa funciona como antes: gana quien elimina a todos los enemigos.

Propiedades de tile nuevas: `hazard` (int, daño por toque cada 0,6 s), `slow` (float, multiplicador de velocidad), `bounce` (int, velocidad del rebote en px/s).

## Flujo

```
Menú → Protagonista → Mapa → Historia → Partida ─┬─ jefe vencido → Siguiente nivel (Historia) / Menú
                                                 └─ derrota → Reintentar (desde el jefe si ya había empezado)
```

## Arena del jefe

1. Mientras queden enemigos del nivel, una barrera (cinta amarilla) cierra la arena. Al tocarla se avisa: "¡Faltan N, chango!".
2. Con el nivel despejado, la barrera cae y aparece una flecha "JEFE →".
3. Cuando el protagonista llega al centro de la arena: la cámara se desliza y se bloquea en la arena (960 px), los límites del mundo se reducen a ella, el jefe cae con su título y su frase, aparecen las escoltas y entran 2 aliados por la izquierda.
4. **Fase 2** (vida ≤ 50 %): el jefe se enfurece (dispara más rápido y usa su habilidad), llegan los refuerzos.
5. Al vencer al jefe se desconectan las escoltas que queden y se muestra "¡FUERZA CAMBA!" con el texto `clearText`.

Al morir en la arena se puede reintentar **desde el jefe** (`checkpoint: 'boss'`): el protagonista aparece en la arena sin los enemigos del nivel.

## Jefe

- Personaje al azar (ni el protagonista, ni Henry, ni los aliados), rol `ENEMY`, escala ×1,5, tinte morado, sin aturdimiento.
- Vida = vida base × `bossHealth`. IA de dificultad alta con más alcance, granadas frecuentes y correa que cubre toda la arena.
- HUD: barra grande arriba al centro con el título del jefe.

## Aliados

- 2 personajes al azar entre los que pueden ser enemigos, sin repetir el protagonista ni el jefe. Rol `ALLY`, bando `heroes`.
- IA: la misma `EnemyAI` con objetivo = hostil más cercano y **líder** = protagonista (lo siguen cuando no hay a quién disparar).
- Al morir: "vuelve en N s" (5-10 s al azar), reaparece cayendo junto al protagonista; máximo `allyRespawns` veces cada uno.
- Usan su habilidad de vez en cuando (`EnemyAbilityDirector` con su propia lista).
- Las bajas de los aliados no cargan la habilidad del protagonista.

## Arte generado

`tools/build-level.php` pinta con PHP GD a media resolución y escala ×2 (vecino más cercano) para un pixel art uniforme:

- **Tileset** de 8 tiles de 32×32 por tema: superficie, relleno, plataforma, caja, peligro, rebote, terreno lento, relleno bajo el peligro.
- **Fondos** de 1600×540 que se repiten horizontalmente: `bg-sky` (0,05), `bg-far` (0,2), `bg-mid` (0,45), `bg-near` (0,7).

Los temas (`casco-viejo`, `uagrm`, `lomas`) solo existen en la herramienta. El juego solo lee `map.json`. Cambiar el arte por imágenes propias = reemplazar los PNG.
