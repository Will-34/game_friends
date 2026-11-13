# Delta de especificación: Visor de animaciones

## AGREGADO

### Requisito: Acceso en desarrollo
El visor DEBE estar disponible desde el menú en `localhost` o con `?debug=1`, y oculto en producción.

#### Escenario: Producción
- DADO el juego en un dominio público sin `?debug=1`
- CUANDO se abre el menú
- ENTONCES no aparece "VISOR DE ANIMACIONES"

### Requisito: Revisión de animaciones
El visor DEBE mostrar cada animación de cada personaje ampliada, con sus cuadros, FPS, bucle y origen, marcar las provisionales con su nota, y permitir pausar, avanzar cuadro a cuadro, ver en espejo y mostrar el cuerpo físico y las bocas del arma.

#### Escenario: Animación provisional
- DADO `fire_up` de Plata con `placeholder: true`
- CUANDO se selecciona en el visor
- ENTONCES aparece "PROVISIONAL (placeholder)" y su nota

## MODIFICADO

(ninguno)

## ELIMINADO

(ninguno)
