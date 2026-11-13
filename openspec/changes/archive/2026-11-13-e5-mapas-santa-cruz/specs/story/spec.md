# Delta de especificación: Historia

## AGREGADO

### Requisito: Pantalla de historia
Antes de cada nivel con propiedad `story`, el juego DEBE mostrar el número, nombre y subtítulo del nivel y su texto línea a línea (escritura progresiva) sobre los fondos del propio mapa en movimiento, con el protagonista elegido. Enter/Espacio/J/toque DEBE completar el texto y, una segunda vez, empezar la partida; Esc DEBE volver a la selección de mapa. Un mapa sin `story` DEBE pasar directo a la partida.

#### Escenario: Saltar la historia
- DADO la historia de Casco Viejo escribiéndose
- CUANDO se pulsa Enter dos veces
- ENTONCES se muestra todo el texto y luego empieza la partida

### Requisito: Jerga cruceña
Los textos de historia, jefes, aliados y carteles DEBEN usar jerga cruceña y voseo ("¡Qué macana!", "chango", "¡Ahijuna!", "pues", "¡Fuerza camba!") sin palabras ofensivas.

#### Escenario: Llegan los aliados
- DADO el inicio del combate contra el jefe
- CUANDO entra el primer aliado
- ENTONCES dice "¡Llegamos, chango! ¡Vamos con todo!"

## MODIFICADO

(ninguno)

## ELIMINADO

(ninguno)
