# Delta de especificación: Entrada y acciones abstractas

## AGREGADO

(ninguno)

## MODIFICADO

### Requisito: Controles táctiles multitáctiles
En dispositivos táctiles (o con `?touch=1`) el HUD DEBE mostrar un joystick flotante en la mitad izquierda y botones para FUEGO, SALTO, GRANADA, HABILIDAD y CAMBIAR ARMA, configurables en `controls.json` (posición relativa a los bordes, tamaño, `enabled`), que produzcan las mismas acciones que el teclado, admitiendo varios dedos a la vez y el deslizamiento entre botones. Los botones con `enabled: false` DEBEN verse atenuados y no producir acción.

#### Escenario: Correr y disparar a la vez
- DADO un dispositivo táctil en partida
- CUANDO un dedo empuja el joystick a la derecha y otro mantiene FUEGO
- ENTONCES el personaje corre a la derecha y dispara simultáneamente

#### Escenario: Joystick flotante
- DADO un dispositivo táctil en partida
- CUANDO el pulgar toca cualquier punto de la mitad izquierda y se desliza a la derecha
- ENTONCES la base del joystick aparece en el punto tocado y el personaje corre a la derecha

#### Escenario: Deslizar entre botones
- DADO un dedo manteniendo FUEGO
- CUANDO se desliza hasta SALTO sin levantarlo
- ENTONCES deja de disparar y salta

#### Escenario: Acción reservada
- DADO el botón GRANADA con `enabled: false`
- CUANDO se toca
- ENTONCES no se produce la acción `grenade` y el botón se ve atenuado

## ELIMINADO

(ninguno)
