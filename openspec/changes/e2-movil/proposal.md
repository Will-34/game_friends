# Propuesta: e2-movil

- **Épica:** E2 Móvil · **Historias:** H-030, H-031, H-032, H-033, H-034
- **Estado:** Pendiente de aprobación del usuario

## Por qué

El juego debe jugarse bien en teléfonos. Hoy los controles táctiles son básicos (joystick fijo, FUEGO, SALTO), el aviso de girar se ve pequeño en vertical y no hay pantalla completa ni ajuste a la muesca. El usuario pidió que en móvil el juego quede **en horizontal** para mejorar la jugabilidad.

## Qué

1. **Jugar en horizontal (H-031)**
   - Al pulsar JUGAR en un móvil: pantalla completa y **bloqueo en horizontal** donde el navegador lo permite (Android Chrome/Edge/Firefox).
   - iPhone no permite bloquear la orientación desde una web: se muestra un **aviso a pantalla completa** "Gira tu dispositivo" (hecho con HTML/CSS para que se vea nítido y grande) y la partida se pausa hasta girar.
   - **Manifiesto web** (`manifest.webmanifest`) con orientación horizontal y modo pantalla completa: si se "añade a la pantalla de inicio", Android abre el juego siempre en horizontal y sin barras del navegador. En iPhone, al añadirlo a inicio, se abre sin la barra de Safari.
   - Botón de pantalla completa en el HUD (oculto donde no está soportado, p. ej. iPhone).
2. **Controles táctiles completos (H-030)**
   - **Joystick flotante**: aparece donde el pulgar toca en la mitad izquierda (más cómodo que uno fijo).
   - Botones: FUEGO, SALTO, GRANADA, HABILIDAD, CAMBIAR ARMA. Los tres últimos se ven atenuados hasta E4 (acciones reservadas).
   - Deslizar el dedo de un botón a otro funciona (p. ej. de FUEGO a SALTO sin levantar).
   - Vibración corta al pulsar (solo Android; iPhone no la soporta).
   - Tamaño, posición y opacidad configurables en `content/config/controls.json`.
3. **HUD adaptado (H-032)**
   - Respeta la muesca y las esquinas redondeadas (`safe-area-inset`): HUD y controles se apartan de ellas.
   - Botones de pausa/silencio/pantalla completa más grandes en táctil.
   - Bloqueo de zoom accidental (doble toque, pellizco en iOS) y del menú contextual al mantener pulsado.
4. **Pruebas en dispositivos (H-033, H-034)**
   - Pruebas automáticas con emulación de Android y de iPhone (tamaños reales, multitáctil, vertical/horizontal).
   - Instrucciones en el README para abrir el juego desde el teléfono en la misma red Wi-Fi (`php -S 0.0.0.0:8000`) y casos del CHECKLIST para que el usuario los confirme en sus teléfonos.

## Alcance

Solo entrada táctil, orientación, pantalla completa, HUD/zonas seguras, manifiesto y pruebas móviles. Ninguna regla de juego cambia.

## Fuera de alcance

- Lógica de granada, habilidad y cambio de arma (E4): sus botones existirán pero sin efecto.
- Selección de personaje (E3), nuevos personajes, recorte de láminas (H-045).
- Funcionamiento sin conexión (service worker) y publicación como app.

## Riesgos y limitaciones

- **iPhone (Safari) no permite bloquear la orientación ni pantalla completa** desde una página web; la solución es el aviso + "añadir a pantalla de inicio".
- El bloqueo de orientación en Android requiere pantalla completa (se activa con el toque en JUGAR).
- Las pruebas reales en Android/iPhone las hace el usuario; yo pruebo con emulación del navegador.
