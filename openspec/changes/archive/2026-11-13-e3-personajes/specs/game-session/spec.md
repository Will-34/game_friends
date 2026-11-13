# Delta de especificación: Partida (mapa, cámara, HUD, pausa)

## AGREGADO

### Requisito: Enemigos aleatorios
Los puntos de aparición con `characterId: "random"` (o sin él) DEBEN recibir personajes al azar entre los que pueden ser enemigos, sin repetir mientras haya candidatos, y nunca el protagonista ni personajes con `canBeEnemy: false`.

#### Escenario: Henry nunca es enemigo
- DADO cualquier protagonista y 4 apariciones aleatorias
- CUANDO empieza la partida
- ENTONCES ninguno de los enemigos es el protagonista ni Henry

## MODIFICADO

(ninguno)

## ELIMINADO

(ninguno)
