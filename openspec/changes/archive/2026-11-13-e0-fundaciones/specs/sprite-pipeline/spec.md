# Delta de especificación: Pipeline de sprites

## AGREGADO

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

## MODIFICADO

(ninguno)

## ELIMINADO

(ninguno)
