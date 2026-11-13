# Delta de especificación: Partida (mapa, cámara, HUD, pausa)

## AGREGADO

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

## MODIFICADO

(ninguno)

## ELIMINADO

(ninguno)
