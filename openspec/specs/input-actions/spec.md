# Capacidad: Entrada y acciones abstractas

## Propósito

Que teclado, táctil e IA controlen a cualquier personaje mediante las mismas acciones.

## Requisitos

### Requisito: Acciones abstractas
El sistema DEBE expresar toda entrada como las acciones `moveX`, `jump`, `shoot`, `crouch`, `aimUp`, `grenade`, `special`, `switchWeapon` y `pause`, con estado mantenido y flancos de pulsación/liberación calculados en un único lugar.

#### Escenario: Flanco de salto
- DADO que el botón de salto estaba suelto
- CUANDO una fuente lo reporta pulsado
- ENTONCES `pressed.jump` es verdadero solo en ese frame y `held.jump` mientras siga pulsado

### Requisito: Teclas configurables
La asignación de teclas DEBE leerse de `content/config/controls.json`.

#### Escenario: Teclas por defecto
- DADO la configuración inicial
- CUANDO el jugador pulsa ← → / A D, ↓ / S, ↑ / W, Espacio / K, J, Esc / P
- ENTONCES se producen respectivamente `moveX`, `crouch`, `aimUp`, `jump`, `shoot` y `pause`; U produce `grenade`, L `special` y Q `switchWeapon` (reservada hasta H-039)

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
- DADO el botón ARMA con `enabled: false`
- CUANDO se toca
- ENTONCES no se produce la acción `switchWeapon` y el botón se ve atenuado

### Requisito: Independencia del controlador
Las entidades NO DEBEN conocer el origen de sus acciones; un controlador DEBE poder combinar varias fuentes.

#### Escenario: Enemigo controlado por IA
- DADO un Fighter con rol ENEMY y un `Controller([DummyEnemyAI])`
- CUANDO la IA reporta `shoot`
- ENTONCES el Fighter dispara con la misma lógica que el jugador
