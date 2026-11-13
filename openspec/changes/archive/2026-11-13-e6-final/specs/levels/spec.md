# Delta de especificación: Niveles

## AGREGADO

### Requisito: Mini-robots
Un mapa con `bossMinion` DEBE hacer que su jefe invoque ese enemigo (2 a la vez) cada `minionEveryMs`, sin pasar de `minionMax` vivos, y además al enfurecerse.

#### Escenario: Invocación
- DADO el jefe de Casco Viejo con `minionEveryMs: 18000`
- CUANDO pasa ese tiempo
- ENTONCES caen 2 mini-robots a los lados de la arena y el jefe dice "¡Vengan, mis robots!"

## MODIFICADO

### Requisito: Niveles de Santa Cruz
El juego DEBE incluir 4 niveles en formato Tiled: Casco Viejo (1), Ciudad Universitaria UAGRM (2), Lomas de Arena (3) y Base del Robot Guardián en el Parque Industrial (4, final), cada uno con 4 fondos parallax y su tileset, generados con `tools/build-level.php`.

#### Escenario: Fondos parallax
- DADO el nivel UAGRM
- CUANDO el protagonista avanza
- ENTONCES el cielo, los árboles lejanos, los módulos y la vegetación cercana se desplazan a distinta velocidad

## ELIMINADO

(ninguno)
