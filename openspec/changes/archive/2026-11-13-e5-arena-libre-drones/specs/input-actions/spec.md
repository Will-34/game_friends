# Delta de especificación: Entrada y acciones abstractas

## AGREGADO

### Requisito: Acción de dron
DEBE existir la acción abstracta `drone`, asignada por defecto a la tecla E y al botón táctil DRON (configurables en `controls.json`), que todas las fuentes (teclado, táctil, IA) pueden producir.

#### Escenario: Dron con teclado
- DADO una partida con el dron listo
- CUANDO se pulsa E
- ENTONCES `pressed.drone` es verdadero en ese frame y el protagonista lanza su dron

## MODIFICADO

### Requisito: Acciones abstractas
El sistema DEBE expresar toda entrada como las acciones `moveX`, `jump`, `shoot`, `crouch`, `aimUp`, `grenade`, `special`, `switchWeapon`, `drone` y `pause`, con estado mantenido y flancos de pulsación/liberación calculados en un único lugar.

#### Escenario: Flanco de salto
- DADO que el botón de salto estaba suelto
- CUANDO una fuente lo reporta pulsado
- ENTONCES `pressed.jump` es verdadero solo en ese frame y `held.jump` mientras siga pulsado

## ELIMINADO

(ninguno)
