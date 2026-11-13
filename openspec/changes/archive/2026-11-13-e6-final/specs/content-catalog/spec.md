# Delta de especificación: Catálogo de contenido

## AGREGADO

### Requisito: Jefes no jugables
El catálogo DEBE listar en `bosses` las carpetas de `content/bosses/<id>/` con `character.json` (mismo formato que un personaje). Se cargan como personajes pero NO aparecen en la selección de protagonista ni como enemigos aleatorios.

#### Escenario: Robot Guardián
- DADO `content/bosses/robot-guardian/character.json`
- CUANDO se solicita el catálogo
- ENTONCES `bosses` incluye `robot-guardian` y no aparece en `characters`

## MODIFICADO

(ninguno)

## ELIMINADO

(ninguno)
