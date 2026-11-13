# Capacidad: Final (Robot Guardián y rescate)

## Propósito

Cerrar la historia: combate final contra el Robot Guardián, rescate definitivo de Henry y escena final con créditos.

## Requisitos

### Requisito: Robot Guardián
El jefe del último nivel (`bossType: "robot-guardian"`) DEBE ser el Robot Guardián de `content/bosses/`, con sus patrones de `bossAttacks` en 3 fases según su vida (> 66 %, 33-66 %, < 33 %): misiles en arco (fase 1+), barridos láser con aviso que se esquivan saltando (bajo) o agachándose (alto) y su dron (fase 2+), ondas de choque por el suelo que se esquivan saltando (fase 3). Al entrar en las fases 2 y 3 DEBE avisar y llamar mini-robots.

#### Escenario: Láser bajo
- DADO el robot en fase 2
- CUANDO aparece el aviso "¡LÁSER BAJO! ¡Saltá!" y luego el rayo
- ENTONCES quien esté en el suelo recibe daño y quien esté saltando no

### Requisito: Punto débil
El robot DEBE tener blindaje (recibe menos daño) y abrir el pecho cada cierto tiempo durante unos segundos, quedándose quieto y recibiendo mucho más daño.

#### Escenario: Pecho abierto
- DADO el robot con el pecho abierto
- CUANDO recibe un disparo de 10
- ENTONCES pierde 22 de vida (con el pecho cerrado perdería 6)

### Requisito: Combate final
En el combate final DEBEN llegar 4 aliados, y Henry DEBE estar en una cápsula de vidrio sobre el robot; al vencerlo la cápsula DEBE romperse y Henry salir feliz.

#### Escenario: Llegan los 4
- DADO el inicio del combate contra el Robot Guardián
- CUANDO pasan 3 segundos
- ENTONCES hay 4 aliados en la arena

### Requisito: Escena final
Al vencer al Robot Guardián, el cartel DEBE decir "¡HENRY RESCATADO!" y llevar a la escena final: título, resumen, todos los personajes del catálogo celebrando (Henry al centro), confeti y créditos; Enter/toque DEBE volver al menú.

#### Escenario: Fin del juego
- DADO el Robot Guardián vencido
- CUANDO se pulsa Enter en el cartel
- ENTONCES aparece la escena final con los 10 amigos celebrando y los créditos
