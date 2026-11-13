# Delta de especificación: Personajes (Fighter)

## AGREGADO

### Requisito: Armas e inventario
Un Fighter DEBE disparar con su arma actual (valores de `weapons.json`; la pistola con sus propios stats), gastar munición si es limitada, volver a la pistola al agotarla y cambiar de arma con `switchWeapon`.

#### Escenario: Escopeta
- DADO el protagonista con la escopeta (24 cartuchos)
- CUANDO dispara una vez
- ENTONCES salen 6 perdigones en abanico y quedan 23 cartuchos

## MODIFICADO

(ninguno)

## ELIMINADO

(ninguno)
