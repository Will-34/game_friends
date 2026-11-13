# Delta de especificación: Niveles

## AGREGADO

(ninguno)

## MODIFICADO

### Requisito: Arena del jefe
Un mapa con objetos `arena` y `boss` DEBE permitir llegar al jefe sin eliminar a los enemigos del nivel (se pueden esquivar). Cuando el protagonista llega al centro de la arena, la cámara DEBE fijarse en ella, una pared DEBE cerrarla por la izquierda para el protagonista, los aliados y el bando del jefe (no para los enemigos del nivel que quedaron atrás) y DEBE aparecer el jefe con sus escoltas. Durante el combate, el HUD DEBE contar solo a los enemigos del combate; al vencer al jefe DEBEN caer todos los enemigos restantes.

#### Escenario: Esquivar y llegar al jefe
- DADO un nivel con 10 enemigos vivos
- CUANDO el protagonista los esquiva y llega al centro de la arena
- ENTONCES empieza el combate contra el jefe y el HUD muestra solo al jefe y sus escoltas

#### Escenario: No salir de la arena
- DADO el combate contra el jefe empezado
- CUANDO el protagonista camina hacia la izquierda
- ENTONCES se detiene en el borde de la arena

## ELIMINADO

(ninguno)
