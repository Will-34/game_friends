# Delta de especificación: Entrada y acciones abstractas

## AGREGADO

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
- ENTONCES se producen respectivamente `moveX`, `crouch`, `aimUp`, `jump`, `shoot` y `pause`; U, L y Q producen `grenade`, `special` y `switchWeapon` (reservadas)

### Requisito: Controles táctiles multitáctiles
En dispositivos táctiles (o con `?touch=1`) el HUD DEBE mostrar un joystick y botones que produzcan las mismas acciones, admitiendo varios dedos a la vez.

#### Escenario: Correr y disparar a la vez
- DADO un dispositivo táctil en partida
- CUANDO un dedo empuja el joystick a la derecha y otro mantiene FUEGO
- ENTONCES el personaje corre a la derecha y dispara simultáneamente

### Requisito: Independencia del controlador
Las entidades NO DEBEN conocer el origen de sus acciones; un controlador DEBE poder combinar varias fuentes.

#### Escenario: Enemigo controlado por IA
- DADO un Fighter con rol ENEMY y un `Controller([DummyEnemyAI])`
- CUANDO la IA reporta `shoot`
- ENTONCES el Fighter dispara con la misma lógica que el jugador

## MODIFICADO

(ninguno)

## ELIMINADO

(ninguno)
