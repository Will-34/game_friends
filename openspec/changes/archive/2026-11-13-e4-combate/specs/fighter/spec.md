# Delta de especificación: Personajes (Fighter)

## AGREGADO

### Requisito: Habilidad especial
Un Fighter DEBE acumular 0,5 de carga por baja y, con la carga completa, activar su habilidad con la acción `special` (animación `special`, aviso con el nombre y efecto según `ability.type`/`params`). Las mejoras temporales (buffs) DEBEN caducar solas.

#### Escenario: Bandera de Poder
- DADO Henry con 2 bajas
- CUANDO pulsa L
- ENTONCES reproduce `special`, muestra "¡BANDERA DE PODER!", gana velocidad y daño durante 8 s con aura arcoíris y su carga vuelve a 0

### Requisito: Granadas
Un Fighter DEBE poder lanzar granadas con la acción `grenade` mientras le queden; la granada DEBE explotar al cumplir la mecha o al tocar a un hostil y dañar en área a los hostiles.

#### Escenario: Granada contra un grupo
- DADO un grupo de 3 enemigos a 150 px
- CUANDO el jugador lanza una granada hacia ellos
- ENTONCES los tres pierden vida y el contador de granadas baja en 1

### Requisito: Nombre visible
Todo Fighter DEBE mostrar su nombre sobre la cabeza; los que no son el protagonista, también una mini barra de vida.

#### Escenario: Identificar enemigos
- DADO un enemigo Will de dificultad difícil
- CUANDO aparece en pantalla
- ENTONCES se ve "WILL" en rojo sobre él con su barra de vida

## MODIFICADO

(ninguno)

## ELIMINADO

(ninguno)
