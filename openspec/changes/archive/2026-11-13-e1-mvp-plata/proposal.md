# Propuesta: e1-mvp-plata

- **Épica:** E1 MVP Plata · **Historias:** H-011 a H-026
- **Estado:** Archivado (2026-11-13). Aprobado de antemano en el prompt inicial.

## Por qué

Validar de punta a punta la arquitectura guiada por datos con un único personaje jugable antes de incorporar el resto.

## Qué

- Plata jugable: correr, saltar, agacharse, disparar horizontal/agachado/hacia arriba.
- Mapa de prueba Tiled con colisiones, plataformas atravesables, cámara lateral y parallax.
- Enemigos provisionales (Plata con rol ENEMY) con IA simple, que reciben daño y mueren.
- HUD, pausa, menú, visor de animaciones, controles de teclado configurables, táctil básico.
- AudioManager con efectos sintetizados y silencio.

## Alcance

H-011 a H-022. Se registran como pendientes los huecos de arte detectados (H-023 a H-026).

## Fuera de alcance

Granadas, habilidades, cambio de arma (teclas reservadas), selección de personaje/mapa, IA definitiva, música real, pulido móvil (E2+).

## Resultado de pruebas

Probado en Edge (Chromium) sin interfaz mediante DevTools Protocol a 960×540 con `php -S localhost:8000`:
- Menú → Jugar → Plata en el mapa (vida 100, 4 enemigos). Sin errores en consola.
- Correr (`run`), saltar (`jump`/`fall`), disparar (`fire`), agachado (`crouch_fire`), hacia arriba (`fire_up`): estados verificados.
- Combate: 3 enemigos eliminados avanzando; el cuarto (plataforma alta) eliminado disparando hacia arriba; el jugador recibió daño (100 → 70).
- Victoria, derrota y reintento; pausa con Esc y reanudación.
- Táctil emulado (multitáctil): joystick + FUEGO simultáneos, SALTO, botón de pausa.
- Visor de animaciones: 13 animaciones, `fire_up` marcada provisional.
- Pendiente de prueba humana: escucha real del audio y dispositivos móviles reales (ver CHECKLIST).
