# Tareas: e6-final

1. [x] `tools/lib/robot-art.php` + `tools/build-robots.php`: Robot Guardián (15 cuadros de 160×176, dron), mini-robot (11 cuadros de 56×60) y sus `character.json` en `content/bosses/`.
2. [x] `api/lib/catalog-lib.php` y `ContentLoader`: lista `bosses`; carga de sprites y animaciones.
3. [x] Tema `base` y `tools/config/level-base-robot.json` (nivel 4, `final: true`).
4. [x] `RobotBossDirector`: fases, blindaje, punto débil, misiles, láser, ondas de choque, mini-robots por fase.
5. [x] `GameScene`: `bossType`, escala del jefe por definición, mini-robots (`spawnMinions`) para todos los jefes, cápsula de vidrio, paso a la escena final.
6. [x] `FinalScene`: rescate, celebración, confeti y créditos.
7. [x] Lomas de Arena lleva al nivel 4; versión 1.0.0.
8. [x] Pruebas en navegador.
9. [x] Documentación y specs.

## Resultado de pruebas (2026-11-13)

Edge 157 sin interfaz vía DevTools Protocol, PHP 8.0.30:

- Catálogo: jefes `mini-robot` y `robot-guardian`; selección de mapa con 4 niveles (+ prueba en desarrollo).
- Casco Viejo: el jefe invoca 2 mini-robots.
- Base del Robot: 19 enemigos del nivel; combate con Robot Guardián (2700 de vida, escala 1), director activo, **4 aliados**, Henry en cápsula.
- Fase 2: barridos láser (aviso y rayo) y 2 mini-robots; fase 3: ondas de choque.
- Punto débil: 10 de daño → 22 aplicados con el pecho abierto (blindaje 0,6 anulado, ×2,2).
- Victoria: cápsula rota, "¡HENRY RESCATADO!" → escena final con los 10 amigos, confeti y créditos → Enter → menú.
- Regresión E5 (colores, Henry enjaulado, reintento, drones, arena libre): OK.
- **Sin errores en consola.**
