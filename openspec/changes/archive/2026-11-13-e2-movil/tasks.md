# Tareas: e2-movil

1. [x] `src/systems/DeviceManager.js`: táctil (incluido el primer toque), iOS, pantalla completa, bloqueo de orientación, zonas seguras.
2. [x] `manifest.webmanifest` (horizontal, pantalla completa, íconos 192/512) + metaetiquetas en `index.php`.
3. [x] Aviso "Gira tu dispositivo" en HTML/CSS con animación; pausa/reanudación. Se elimina `RotateDeviceScene` (ADR-010).
4. [x] JUGAR (menú) y confirmar personaje: pantalla completa + `screen.orientation.lock('landscape')`, sin errores si se rechaza.
5. [x] Botón ⛶ de pantalla completa en el HUD (solo si el navegador lo soporta; no en iPhone).
6. [x] `MobileControls`: joystick flotante, GRANADA/HABILIDAD/ARMA, deslizar entre botones, vibración, botón HABILIDAD resaltado al estar lista.
7. [x] `controls.json → touch`: posiciones ancladas (right/bottom), tamaño, opacidad, `enabled`.
8. [x] Zonas seguras: HUD y controles desplazados según `env(safe-area-inset-*)`.
9. [x] Sin zoom por doble toque/pellizco ni menú contextual.
10. [x] README: jugar desde el teléfono en la red local; añadir a pantalla de inicio.
11. [x] Pruebas con emulación (vertical/horizontal, multitáctil, joystick flotante).
12. [x] CHECKLIST móvil actualizado.
13. [x] Specs fusionadas, CHANGELOG y BACKLOG.
14. [ ] Prueba del usuario en Android y iPhone reales (H-033, H-034).
