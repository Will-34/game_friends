# Delta de especificación: Partida (mapa, cámara, HUD, pausa)

## AGREGADO

### Requisito: Pantalla completa y horizontal en móvil
Al iniciar una partida desde un dispositivo táctil, el juego DEBE solicitar pantalla completa y bloquear la orientación en horizontal cuando el navegador lo permita, sin mostrar errores si no lo permite.

#### Escenario: Android
- DADO Chrome en Android en vertical
- CUANDO el jugador toca JUGAR
- ENTONCES el juego pasa a pantalla completa y queda en horizontal

#### Escenario: Navegador sin soporte
- DADO Safari en iPhone
- CUANDO el jugador toca JUGAR
- ENTONCES la partida empieza sin errores en consola y, si el teléfono está en vertical, se muestra el aviso de girar

### Requisito: Instalación en pantalla de inicio
El juego DEBE incluir un manifiesto web con orientación horizontal y modo pantalla completa.

#### Escenario: Añadir a inicio en Android
- DADO el juego añadido a la pantalla de inicio
- CUANDO se abre desde el ícono
- ENTONCES se muestra en horizontal y sin barras del navegador

### Requisito: Zonas seguras
El HUD y los controles táctiles DEBEN apartarse de la muesca y de las esquinas redondeadas según `env(safe-area-inset-*)`.

#### Escenario: iPhone con muesca en horizontal
- DADO un iPhone con muesca en horizontal
- CUANDO se muestra el HUD
- ENTONCES ni la barra de vida ni el joystick quedan bajo la muesca

## MODIFICADO

### Requisito: Orientación en móvil
En dispositivos táctiles en vertical el juego DEBE mostrar un aviso "GIRA TU DISPOSITIVO" que ocupe toda la pantalla de forma legible, y pausar la partida hasta volver a horizontal.

#### Escenario: Girar a vertical
- DADO una partida en un teléfono en horizontal
- CUANDO se gira a vertical
- ENTONCES aparece el aviso a pantalla completa y la partida queda pausada hasta volver a horizontal

## ELIMINADO

(ninguno)
