# Capacidad: Pipeline de sprites

## Propósito

Convertir láminas ilustrativas de personajes en spritesheets técnicos sin modificar los originales.

## Requisitos

### Requisito: Recorte configurable
La herramienta `tools/sprite-cutter.php` DEBE leer los parámetros de recorte de `tools/config/<id>.json` y generar `content/characters/<id>/spritesheet.png` con celdas de tamaño fijo, fondo transparente y los pies alineados al borde inferior.

#### Escenario: Generar el spritesheet de Plata
- DADO `assets-originales/plata/plata-hoja.png` y `tools/config/plata.json`
- CUANDO se ejecuta `php tools/sprite-cutter.php tools/config/plata.json`
- ENTONCES se genera un spritesheet de celdas 144×104 con 49 cuadros y la lámina original no cambia

### Requisito: Animaciones honestas
La herramienta DEBE avisar cuando el número de cuadros detectados difiere del esperado, y toda animación que no exista en la lámina DEBE generarse marcada como `placeholder: true` con una `note`.

#### Escenario: Animación inexistente
- DADO que la lámina no contiene disparo hacia arriba
- CUANDO se genera el personaje con `fire_up` configurada como `placeholderFrom: "idle"`
- ENTONCES `character.json` contiene `fire_up` con `placeholder: true` y la herramienta lo informa

### Requisito: Conservación de datos de diseño
La herramienta DEBE actualizar solo los campos técnicos de `character.json` (`spritesheet`, `frameWidth`, `frameHeight`, `animations`, `effects`) y conservar el resto.

#### Escenario: Regenerar sin perder stats
- DADO un `character.json` con `stats` editados a mano
- CUANDO se vuelve a ejecutar la herramienta
- ENTONCES los `stats` siguen iguales

### Requisito: Efectos del personaje
La herramienta DEBE poder extraer efectos sueltos definidos por rectángulos a `effects.png` y registrar sus índices en `character.json → effects.frames`.

#### Escenario: Fogonazo disponible
- DADO el efecto `muzzle` configurado
- CUANDO se genera el personaje
- ENTONCES `effects.frames.muzzle` existe y el juego lo usa como fogonazo

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
