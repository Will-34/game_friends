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
En dispositivos táctiles en vertical el juego DEBE mostrar "GIRA TU DISPOSITIVO" y pausar la partida.

#### Escenario: Girar a vertical
- DADO una partida en un teléfono en horizontal
- CUANDO se gira a vertical
- ENTONCES aparece el aviso y la partida queda pausada hasta volver a horizontal

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
