# Delta de especificación: Catálogo de contenido

## AGREGADO

### Requisito: Catálogo en vivo
El endpoint `api/catalog.php` DEBE recorrer `content/characters/` y `content/maps/` y devolver en JSON la lista de personajes (`id`, `name`, `path`, `placeholder`) y mapas (`id`, `name`, `path`), funcionando en PHP 7.4 y 8.x.

#### Escenario: Personaje nuevo aparece en el catálogo
- DADO una carpeta `content/characters/<id>/` con un `character.json` válido
- CUANDO se solicita `api/catalog.php`
- ENTONCES la respuesta incluye un personaje con ese `id` y su `name`

#### Escenario: Carpeta inválida se ignora
- DADO una carpeta de personaje sin `character.json` o con JSON inválido
- CUANDO se solicita el catálogo
- ENTONCES esa carpeta no aparece en `characters` y se agrega un aviso en `warnings`

### Requisito: Respaldo estático
El juego DEBE usar `content/catalog.json` cuando `api/catalog.php` no responda o devuelva un formato inválido.

#### Escenario: PHP no disponible
- DADO que la petición a `api/catalog.php` falla
- CUANDO el juego arranca
- ENTONCES carga el catálogo desde `content/catalog.json` y el menú indica `catálogo: fallback`

### Requisito: Validación de definiciones
El cliente DEBE descargar cada `character.json` y `map.json` del catálogo, omitir los inválidos con un aviso en consola y detenerse con un mensaje visible si no queda ningún personaje o mapa válido.

#### Escenario: Mapa que no es Tiled
- DADO un `map.json` sin `type: "map"` o sin `layers`
- CUANDO el juego carga el contenido
- ENTONCES ese mapa se omite y se muestra un aviso en consola

## MODIFICADO

(ninguno)

## ELIMINADO

(ninguno)
