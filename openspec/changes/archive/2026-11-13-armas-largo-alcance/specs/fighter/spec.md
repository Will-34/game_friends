# Delta de especificación: Personajes (Fighter)

## AGREGADO

(ninguno)

## MODIFICADO

### Requisito: Armas e inventario
Un Fighter DEBE disparar con su arma actual (valores de `weapons.json`; la pistola con sus propios stats), gastar munición si es limitada, volver a la pistola al agotarla y cambiar de arma con `switchWeapon`. Todas las armas DEBEN ser de largo alcance (pistola, metralleta, láser y rifle de plasma).

#### Escenario: Láser
- DADO el protagonista con el láser (60 cargas)
- CUANDO dispara a un grupo de enemigos alineados
- ENTONCES el rayo los atraviesa dañando a cada uno una vez y quedan 59 cargas

## ELIMINADO

(ninguno)
