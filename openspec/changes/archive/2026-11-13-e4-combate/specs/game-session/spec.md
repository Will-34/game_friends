# Delta de especificación: Partida (mapa, cámara, HUD, pausa)

## AGREGADO

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

## MODIFICADO

(ninguno)

## ELIMINADO

(ninguno)
