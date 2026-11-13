# Tareas: e2-movil

1. [ ] Detección de dispositivo táctil/móvil centralizada (`src/systems/DeviceManager.js`): táctil, iOS, soporte de pantalla completa y de bloqueo de orientación, zonas seguras.
2. [ ] `manifest.webmanifest` (horizontal, pantalla completa, íconos) + metaetiquetas en `index.php`.
3. [ ] Aviso "Gira tu dispositivo" en HTML/CSS (nítido en vertical) y pausa/reanudación de la partida; retirar el dibujo en canvas de `RotateDeviceScene` o reducirlo a la lógica.
4. [ ] Al pulsar JUGAR en móvil: pantalla completa + `screen.orientation.lock('landscape')` con manejo de errores silencioso.
5. [ ] Botón de pantalla completa en el HUD (solo donde esté soportado).
6. [ ] `MobileControls`: joystick flotante, botones GRANADA/HABILIDAD/CAMBIAR ARMA (atenuados si la acción está reservada), deslizar entre botones, vibración opcional.
7. [ ] Configuración táctil ampliada en `controls.json` (posiciones relativas a los bordes, tamaño, opacidad, `enabled`).
8. [ ] Zonas seguras: HUD y controles desplazados según `env(safe-area-inset-*)`.
9. [ ] Bloquear zoom por doble toque/pellizco (iOS) y menú contextual.
10. [ ] README: jugar desde el teléfono en la red local; "añadir a pantalla de inicio".
11. [ ] Pruebas con emulación: Android (Pixel) e iPhone, vertical/horizontal, multitáctil, pantalla completa.
12. [ ] CHECKLIST móvil actualizado; registro de resultados.
13. [ ] Archivar: fusionar deltas en `openspec/specs/`, actualizar CHANGELOG y BACKLOG.
14. [ ] Prueba del usuario en Android y iPhone reales (H-033, H-034).
