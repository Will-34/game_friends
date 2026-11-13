# Delta de especificación: Partida

## AGREGADO

### Requisito: Colores de nombre por bando
El nombre sobre cada personaje DEBE indicar su bando: protagonista y aliados en verde, enemigos en rojo, jefe en lila, personaje capturado en amarillo.

#### Escenario: Combate contra el jefe
- DADO el combate con 2 aliados, escoltas y el jefe
- CUANDO se miran los nombres
- ENTONCES el protagonista y los aliados son verdes, las escoltas rojas y el jefe lila

## MODIFICADO

### Requisito: Grupos y dificultad de enemigos
Cada punto de aparición de enemigos DEBE crear un grupo de `count` enemigos (número o rango "2-3") y cada enemigo DEBE recibir una dificultad aleatoria (Fácil/Normal/Difícil) que ajusta sus stats y su IA y se marca junto a su nombre (Normal ★, Difícil ★★).

#### Escenario: Mapa de prueba
- DADO el mapa de prueba con 4 zonas
- CUANDO empieza la partida
- ENTONCES hay entre 8 y 11 enemigos, en grupos

## ELIMINADO

(ninguno)
