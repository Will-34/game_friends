# Delta de especificación: Selección de protagonista

## AGREGADO

### Requisito: Lista desde el catálogo
La pantalla "ELIGE TU PROTAGONISTA" DEBE mostrar todos los personajes válidos del catálogo, en su orden, con retrato (o el primer cuadro de `idle` si no hay retrato) y nombre, sin que el código conozca personajes concretos.

#### Escenario: Personaje nuevo
- DADO un personaje nuevo en `content/characters/<id>/` incluido en el catálogo
- CUANDO se abre la pantalla de selección
- ENTONCES aparece su tarjeta

### Requisito: Información del seleccionado
La pantalla DEBE mostrar del personaje seleccionado su animación `idle` ampliada, su nombre, su arquetipo y su habilidad, indicando si la habilidad aún no está implementada.

#### Escenario: Cambiar de selección
- DADO la pantalla de selección con Plata seleccionado
- CUANDO el jugador pulsa → dos veces
- ENTONCES queda seleccionado Ruddy y se ven su animación, "Soporte / Motivador" e "Inspiración J&J"

### Requisito: Confirmar y volver
El jugador DEBE poder confirmar con Enter/Espacio/J, el botón JUGAR o tocando la tarjeta ya seleccionada, y volver al menú con Esc o VOLVER. La última elección se recuerda solo durante la sesión.

#### Escenario: Empezar con el elegido
- DADO Ruddy seleccionado
- CUANDO el jugador pulsa Enter
- ENTONCES empieza la partida con Ruddy como protagonista y su retrato en el HUD

## MODIFICADO

(ninguno)

## ELIMINADO

(ninguno)
