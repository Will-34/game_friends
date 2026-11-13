# Capacidad: Partida (mapa, cámara, HUD, pausa)

## Propósito

Jugar un nivel definido por datos, con interfaz y estados de fin de partida.

## Requisitos

### Requisito: Mapa Tiled
La partida DEBE construirse desde `content/maps/<id>/map.json` (Tiled): capa `ground` con colisión por la propiedad `collides`, plataformas `oneWay` atravesables desde abajo, apariciones de la capa `spawns` y fondos parallax de las capas de imagen.

#### Escenario: Plataforma atravesable
- DADO una plataforma con `oneWay`
- CUANDO el jugador salta desde debajo
- ENTONCES la atraviesa y puede aterrizar encima

### Requisito: Cámara lateral
La cámara DEBE seguir al protagonista dentro de los límites del mapa con una zona muerta.

#### Escenario: Avanzar por el nivel
- DADO el protagonista corriendo a la derecha
- CUANDO sale de la zona muerta
- ENTONCES la cámara lo sigue y los fondos se desplazan más lento

### Requisito: HUD
El HUD DEBE mostrar el nombre y la vida del protagonista, los enemigos restantes y botones de pausa y silencio.

#### Escenario: Recibir daño
- DADO el protagonista con 100 de vida
- CUANDO recibe una bala enemiga
- ENTONCES la barra muestra 90 / 100

### Requisito: Pausa
La partida DEBE pausarse con la acción `pause`, el botón del HUD o al ocultarse la pestaña, y DEBE poder reanudarse o salir al menú.

#### Escenario: Pausa con teclado
- DADO una partida en curso
- CUANDO se pulsa Esc
- ENTONCES aparece "PAUSA" y una segunda pulsación reanuda

### Requisito: Fin de partida
Al eliminar a todos los enemigos la partida DEBE mostrar "¡ZONA DESPEJADA!" y la pose de victoria; al morir el protagonista DEBE mostrar "HAS CAÍDO" y permitir reintentar.

#### Escenario: Derrota
- DADO el protagonista con vida 0
- CUANDO termina su animación de muerte
- ENTONCES aparece "HAS CAÍDO" y Espacio/J/toque reinicia la partida

### Requisito: Orientación en móvil
En dispositivos táctiles en vertical el juego DEBE mostrar un aviso "GIRA TU DISPOSITIVO" que ocupe toda la pantalla de forma legible, y pausar la partida hasta volver a horizontal.

#### Escenario: Girar a vertical
- DADO una partida en un teléfono en horizontal
- CUANDO se gira a vertical
- ENTONCES aparece el aviso a pantalla completa y la partida queda pausada hasta volver a horizontal


### Requisito: Enemigos aleatorios
Los puntos de aparición con `characterId: "random"` (o sin él) DEBEN recibir personajes al azar entre los que pueden ser enemigos, sin repetir mientras haya candidatos, y nunca el protagonista ni personajes con `canBeEnemy: false`.

#### Escenario: Henry nunca es enemigo
- DADO cualquier protagonista y 4 apariciones aleatorias
- CUANDO empieza la partida
- ENTONCES ninguno de los enemigos es el protagonista ni Henry

### Requisito: Grupos y dificultad de enemigos
Cada punto de aparición de enemigos DEBE crear un grupo de `count` enemigos (número o rango "2-3") y cada enemigo DEBE recibir una dificultad aleatoria (Fácil/Normal/Difícil) que ajusta sus stats y su IA y colorea su nombre.

#### Escenario: Mapa de prueba
- DADO el mapa de prueba con 4 zonas
- CUANDO empieza la partida
- ENTONCES hay entre 8 y 11 enemigos, en grupos

### Requisito: Bajas y gestos
Cuando el protagonista elimina a un enemigo DEBE mostrarse "+1" con su símbolo (`taunt`) y sumar una baja; cuando un enemigo acierta al protagonista DEBE mostrar su símbolo (como mucho cada 2,5 s).

#### Escenario: Baja de Ignacio
- DADO Ignacio como protagonista
- CUANDO elimina a un enemigo
- ENTONCES aparece "+1 🎂" sobre él y el contador de bajas sube

### Requisito: Habilidades de enemigos
Los enemigos DEBEN usar su habilidad de forma aleatoria, de uno en uno: nunca dos habilidades enemigas activas a la vez, y solo enemigos visibles.

#### Escenario: Tres enemigos en pantalla
- DADO tres enemigos visibles
- CUANDO el director decide usar una habilidad
- ENTONCES solo uno la activa y no habrá otra hasta que termine

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

### Requisito: Objetos de los enemigos
Al morir un enemigo, con la probabilidad de `weapons.json → drops`, DEBE caer un objeto (arma, vida o granadas) que el protagonista recoge al tocarlo y que desaparece tras su tiempo de vida.

#### Escenario: Recoger vida
- DADO el protagonista con 50 de vida y una cruz roja en el suelo
- CUANDO la toca
- ENTONCES pasa a 80 de vida y se muestra "+30 VIDA"

### Requisito: IA de enemigos
Los enemigos DEBEN patrullar, alertarse al ver al protagonista (tiempo de reacción según dificultad) y atacar: disparar en ráfagas, apuntar arriba si el protagonista está encima, perseguirlo sin alejarse más de su correa, saltar paredes y no amontonarse.

#### Escenario: Jugador en una plataforma
- DADO el protagonista sobre una plataforma justo encima de un enemigo
- CUANDO el enemigo está en ataque
- ENTONCES dispara hacia arriba o salta para alcanzarlo

### Requisito: Resumen
Los carteles de victoria y derrota DEBEN mostrar el personaje, las bajas y el tiempo de la partida.

#### Escenario: Zona despejada
- DADO el último enemigo eliminado
- CUANDO aparece "¡ZONA DESPEJADA!"
- ENTONCES se lee, por ejemplo, "SERGIO · BAJAS: 8 · TIEMPO: 0:06"
