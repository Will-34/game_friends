# Capacidad: Niveles (mapas, terreno, jefe y aliados)

## Propósito

Ofrecer una campaña de niveles definidos por datos (Tiled), con terreno especial, progresión de dificultad, un jefe al final de cada mapa y aliados que ayudan contra él.

## Requisitos

### Requisito: Selección de mapa
Tras elegir protagonista, el juego DEBE mostrar "ELIGE EL MAPA" con los mapas que tengan la propiedad `order`, ordenados por ella, cada uno con miniatura (sus fondos), nombre, subtítulo, dificultad y jefe. Los mapas sin `order` solo DEBEN aparecer en modo desarrollo.

#### Escenario: Elegir un nivel
- DADO la pantalla de selección de mapa
- CUANDO se pulsa → y luego Enter (o se toca dos veces una tarjeta)
- ENTONCES empieza la historia del nivel elegido y después la partida

### Requisito: Niveles de Santa Cruz
El juego DEBE incluir 4 niveles en formato Tiled: Casco Viejo (1), Ciudad Universitaria UAGRM (2), Lomas de Arena (3) y Base del Robot Guardián en el Parque Industrial (4, final), cada uno con 4 fondos parallax y su tileset, generados con `tools/build-level.php`.

#### Escenario: Fondos parallax
- DADO el nivel UAGRM
- CUANDO el protagonista avanza
- ENTONCES el cielo, los árboles lejanos, los módulos y la vegetación cercana se desplazan a distinta velocidad

### Requisito: Terreno especial
Los tiles DEBEN poder tener `hazard` (daño cada 0,6 s a quien lo pisa, con un pequeño salto), `slow` (multiplica la velocidad mientras se pisa) y `bounce` (lanza hacia arriba al aterrizar). La IA NO DEBE caminar hacia un tile `hazard`.

#### Escenario: Pisar la parrilla
- DADO el protagonista con 88 de vida
- CUANDO pisa una parrilla con `hazard: 10`
- ENTONCES su vida baja a 78 y da un pequeño salto

#### Escenario: Toldo
- DADO un toldo con `bounce`
- CUANDO el protagonista cae sobre él
- ENTONCES sale despedido hacia arriba más alto que con un salto normal

### Requisito: Progresión de dificultad
Cada mapa DEBE poder definir los pesos de dificultad de sus enemigos (`difficulty: "facil:60,normal:30,dificil:10"`), la vida del jefe (`bossHealth`), sus escoltas y refuerzos.

#### Escenario: Nivel 3 más difícil
- DADO Lomas de Arena con `facil:25,normal:40,dificil:35`
- CUANDO aparecen los enemigos
- ENTONCES hay más enemigos difíciles (nombre rojo) que en Casco Viejo

### Requisito: Arena del jefe
Un mapa con objetos `arena` y `boss` DEBE permitir llegar al jefe sin eliminar a los enemigos del nivel (se pueden esquivar). Cuando el protagonista llega al centro de la arena, la cámara DEBE fijarse en ella, una pared DEBE cerrarla por la izquierda para el protagonista, los aliados y el bando del jefe (no para los enemigos del nivel que quedaron atrás) y DEBE aparecer el jefe con sus escoltas. Durante el combate, el HUD DEBE contar solo a los enemigos del combate; al vencer al jefe DEBEN caer todos los enemigos restantes.

#### Escenario: Esquivar y llegar al jefe
- DADO un nivel con 10 enemigos vivos
- CUANDO el protagonista los esquiva y llega al centro de la arena
- ENTONCES empieza el combate contra el jefe y el HUD muestra solo al jefe y sus escoltas

#### Escenario: No salir de la arena
- DADO el combate contra el jefe empezado
- CUANDO el protagonista camina hacia la izquierda
- ENTONCES se detiene en el borde de la arena

### Requisito: Jefe
El jefe DEBE ser un personaje al azar (nunca el protagonista, Henry ni los aliados), con escala ×1,5, nombre en lila, vida = vida base × `bossHealth` (8, 11 y 14 en los niveles 1-3), barra en el HUD, frase `bossTaunt` y su propio dron, que lanza cuando tiene a alguien cerca. Al bajar al 50 % DEBE enfurecerse (más agresivo, usa su habilidad, el dron se recarga antes) y llamar `bossReinforcements` refuerzos. Al vencerlo, las escoltas restantes DEBEN caer y el nivel DEBE darse por superado. Al reintentar, el jefe DEBE empezar de nuevo sin enfurecer.

#### Escenario: Fase 2
- DADO el jefe con más de la mitad de vida
- CUANDO baja del 50 %
- ENTONCES aparece "¡… SE PICÓ!", la barra se vuelve roja y llegan refuerzos

#### Escenario: Dron del jefe
- DADO el combate contra el jefe con el protagonista cerca
- CUANDO el dron del jefe está listo
- ENTONCES el jefe lanza su dron, que dispara al hostil más cercano

### Requisito: Aliados
En el combate del jefe DEBEN llegar `allies` (2) aliados al azar (nunca el protagonista, Henry ni el jefe), controlados por IA, que siguen al protagonista y atacan al hostil más cercano. Si un aliado cae DEBE volver a los 5-10 s, como máximo `allyRespawns` (2) veces. El HUD DEBE mostrar su estado. Los aliados DEBEN tener 2,5× de vida, un aura verde permanente (además del nombre verde) y su llegada DEBE anunciarse con "¡LLEGARON LOS ALIADOS!" (y "¡<NOMBRE> VOLVIÓ A AYUDARTE!" al volver).

### Requisito: Oleadas de enemigos
Los enemigos del nivel NO DEBEN crearse todos al empezar: DEBEN aparecer de a poco al acercarse el jugador a su sitio (cayendo desde arriba si ya está a la vista), con 1 a la vez al empezar y un tope que sube con las bajas o el tiempo hasta 3 enemigos cerca de la pantalla. Los que el jugador deja muy atrás ya no aparecen. Durante el jefe, las escoltas y mini-robots vivos a la vez NO DEBEN pasar de 3.

#### Escenario: Inicio tranquilo
- DADO que empieza un nivel
- CUANDO pasan los primeros segundos
- ENTONCES solo hay 1 enemigo cerca y luego van apareciendo más, nunca más de 3 a la vez

#### Escenario: Aliado caído
- DADO un aliado con 2 reapariciones
- CUANDO muere
- ENTONCES el HUD muestra "NOMBRE vuelve en N s" y entre 5 y 10 s después reaparece junto al protagonista con 1 reaparición restante

### Requisito: Continuar al siguiente nivel
Al vencer al jefe, el cartel DEBE mostrar "¡FUERZA CAMBA!", el texto `clearText` y el resumen; Enter/toque DEBE llevar a la historia del siguiente nivel (por `order`) o al menú si era el último; Esc DEBE volver al menú.

#### Escenario: De Casco Viejo a la UAGRM
- DADO el jefe de Casco Viejo vencido
- CUANDO se pulsa Enter en el cartel
- ENTONCES aparece la historia de "Ciudad Universitaria UAGRM"

### Requisito: Personaje capturado
Un mapa con la propiedad `captive` (id de personaje) DEBE mostrar a ese personaje enjaulado sobre los hombros del jefe durante el combate, pidiendo ayuda con globos de diálogo, sin recibir daño. Al vencer al jefe, la jaula DEBE romperse y el personaje DEBE saltar al suelo, celebrar (animación `victory`) y agradecer. Si el protagonista es ese personaje, NO DEBE aparecer capturado.

#### Escenario: Liberar a Henry
- DADO el jefe con Henry enjaulado
- CUANDO el jefe cae
- ENTONCES la jaula se rompe, Henry salta al suelo, celebra y dice "¡Gracias, changos! ¡Soy libre!"

### Requisito: Mini-robots
Un mapa con `bossMinion` DEBE hacer que su jefe invoque ese enemigo (2 a la vez) cada `minionEveryMs`, sin pasar de `minionMax` vivos (ni del tope de 3 escoltas/mini-robots), y además al enfurecerse.

#### Escenario: Invocación
- DADO el jefe de Casco Viejo con `minionEveryMs: 18000`
- CUANDO pasa ese tiempo
- ENTONCES caen 2 mini-robots a los lados de la arena y el jefe dice "¡Vengan, mis robots!"

### Requisito: Plataformas visibles
Las plataformas donde se salta DEBEN distinguirse del fondo en todos los mapas: cuerpo oscuro, borde negro y franja superior amarilla.
