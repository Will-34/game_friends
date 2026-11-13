# Diseño: e2-movil

## Orientación horizontal

| Plataforma | Qué se puede hacer | Solución |
| --- | --- | --- |
| Android (Chrome/Edge/Firefox) | Pantalla completa + `screen.orientation.lock('landscape')` tras un gesto del usuario | Se activa al tocar JUGAR; si falla, se usa el aviso |
| iPhone (Safari) | No hay bloqueo de orientación ni pantalla completa para páginas | Aviso "Gira tu dispositivo" + pausa; recomendación de "Añadir a pantalla de inicio" |
| iPad | Pantalla completa parcial; sin bloqueo | Igual que iPhone; en horizontal juega normal |
| Instalado desde inicio (Android) | El manifiesto fija `orientation: landscape` | Siempre horizontal, sin barras |

- El aviso se hace en **HTML/CSS** (`#rotate-overlay`) y no en el canvas: en vertical el canvas 16:9 queda diminuto, mientras que el HTML ocupa toda la pantalla y se ve nítido. `RotateDeviceScene` se conserva solo para pausar/reanudar la partida (o se sustituye por `DeviceManager`; se decidirá en la implementación y se documentará).
- Detección de vertical con `matchMedia('(orientation: portrait)')` + `resize`/`orientationchange`, solo en dispositivos táctiles.

## Controles táctiles

- Zona izquierda (≈ 45 % del ancho): joystick **flotante**; la base aparece donde toca el pulgar y se oculta al soltar (queda una guía tenue en su posición por defecto).
- Zona derecha: botones con posición **relativa a la esquina inferior derecha** (`right`, `bottom` en px lógicos), para que no dependan del tamaño de pantalla.
- Un botón está activo mientras haya un dedo encima (permite deslizar entre botones).
- `controls.json → touch.buttons[]`: `action`, `label`, `right`, `bottom`, `radius`, `enabled`. Las acciones reservadas (grenade, special, switchWeapon) usan `enabled: false` → se dibujan atenuadas y no envían la acción.
- Vibración: `navigator.vibrate(10)` al pulsar, si existe.

## Zonas seguras

- CSS expone `env(safe-area-inset-*)` en variables; `DeviceManager` las lee (px de pantalla), las convierte a coordenadas lógicas con la escala actual y las publica en el registro. El HUD y los controles suman ese margen. Se recalcula en cada `resize`.
- `viewport-fit=cover` ya está en `index.php`.

## Antizoom (iOS)

- `touch-action: none` (ya existe) + `preventDefault` en `gesturestart` y en `touchend` con doble toque rápido; `contextmenu` bloqueado sobre el juego.

## Pruebas

- Script de pruebas con Edge sin interfaz: emulación de Pixel 7 (412×915) e iPhone 14 (390×844) con `mobile: true`, multitáctil, rotación vertical↔horizontal y verificación de consola sin errores.
- El bloqueo real de orientación y la pantalla completa no se pueden probar en emulación: quedan como casos del CHECKLIST para el usuario.
