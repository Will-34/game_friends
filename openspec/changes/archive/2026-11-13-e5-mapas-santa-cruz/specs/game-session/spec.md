# Delta de especificación: Partida (mapa, cámara, HUD, pausa)

## AGREGADO

### Requisito: Objetivo de la IA
Las IA (enemigos y aliados) DEBEN apuntar al hostil vivo más cercano, de modo que los enemigos también ataquen a los aliados.

#### Escenario: Enemigo cerca de un aliado
- DADO un aliado más cerca de un enemigo que el protagonista
- CUANDO el enemigo está en ataque
- ENTONCES dispara al aliado

## MODIFICADO

### Requisito: HUD
El HUD DEBE mostrar el nombre y la vida del protagonista, los enemigos restantes, botones de pausa y silencio y, durante el combate contra un jefe, su barra de vida con título y el estado de los aliados; además DEBE mostrar avisos grandes en el centro (zona despejada, faltan enemigos, jefe enfurecido).

#### Escenario: Recibir daño
- DADO el protagonista con 100 de vida
- CUANDO recibe una bala enemiga
- ENTONCES la barra muestra 90 / 100

#### Escenario: Barra del jefe
- DADO el inicio del combate contra el jefe
- CUANDO el jefe recibe daño
- ENTONCES su barra (arriba, junto al título "EL CAPO DE LA PLAZA · NOMBRE") baja

### Requisito: Fin de partida
En un mapa sin jefe, al eliminar a todos los enemigos la partida DEBE mostrar "¡ZONA DESPEJADA!" y la pose de victoria. En un mapa con jefe, al vencerlo DEBE mostrar "¡FUERZA CAMBA!" (ver capacidad `levels`). Al morir el protagonista DEBE mostrar "¡QUÉ MACANA!" con "Te bajaron, chango" y permitir reintentar con Espacio/J/toque (desde el jefe si el combate ya había empezado) o volver al menú con Esc.

#### Escenario: Derrota
- DADO el protagonista con vida 0
- CUANDO termina su animación de muerte
- ENTONCES aparece "¡QUÉ MACANA!" y Espacio/J/toque reinicia la partida

#### Escenario: Derrota contra el jefe
- DADO el combate contra el jefe empezado
- CUANDO el protagonista muere y se pulsa Espacio
- ENTONCES la partida se reinicia en la arena, sin los enemigos del nivel

## ELIMINADO

(ninguno)
