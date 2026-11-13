# Delta de especificación: Pipeline de sprites

## AGREGADO

### Requisito: Láminas con fondo pintado
Con `background.mode = "color"` la herramienta DEBE eliminar el fondo opaco de cada región (relleno desde los bordes, halo oscuro y líneas separadoras) sin borrar el contorno del personaje, y DEBE permitir corregir casos difíciles con `splitX` y `eraseRects`.

#### Escenario: Lámina opaca de Domeki
- DADO `assets-originales/domeki/` sin transparencia y `tools/config/domeki.json` con `background.mode = "color"`
- CUANDO se ejecuta la herramienta
- ENTONCES se generan 48 cuadros con fondo transparente, sin líneas separadoras ni fogonazos detrás del personaje

### Requisito: Tamaño uniforme entre filas
La herramienta DEBE poder igualar el tamaño de las filas de una lámina (`scale` por animación o `autoScale` por grupos), reduciendo y nunca ampliando.

#### Escenario: Escala automática
- DADO `autoScale` con `target: "fire"`
- CUANDO se genera el spritesheet
- ENTONCES las poses de pie de todas las animaciones miden aproximadamente lo mismo que `fire`

### Requisito: Retrato y medidas automáticas
La herramienta DEBE generar `portrait.png` cuando se configure `portrait`, y DEBE calcular `body`, `crouchBody` y `muzzle` solo si `character.json` aún no los tiene.

#### Escenario: Personaje nuevo sin medidas
- DADO un `character.json` sin `muzzle`
- CUANDO se ejecuta la herramienta
- ENTONCES `muzzle.stand` y `muzzle.crouch` se calculan desde la punta del arma en `fire` y `crouch_fire`

## MODIFICADO

(ninguno)

## ELIMINADO

(ninguno)
