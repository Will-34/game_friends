# Tareas: e5-arena-libre-drones

1. [x] Quitar la barrera; `checkArena` arranca el combate al llegar al centro; pared izquierda solo para el combate (`closeArena`); `countedEnemies` para el HUD.
2. [x] Acción `drone` (Actions, controls.json: tecla E y botón DRON).
3. [x] `tools/lib/drone-art.php` + `tools/build-drones.php`: 10 drones temáticos y bloque `drone` en cada `character.json`.
4. [x] `ContentLoader` carga `drone.png` y crea la animación `<id>_drone`; `SpecialAbilitySystem.activateDrone`; `drone.js` con textura propia, color de bala (o arcoíris), escala y posición delante del dueño.
5. [x] `Fighter.tryUseDrone` (recarga), HUD "NOMBRE LISTO (E)" / segundos, botón táctil resaltado; aliados lanzan su dron.
6. [x] Nombre del dron en la selección de personaje y ayuda del menú.
7. [x] Pruebas en navegador.
8. [x] Documentación y specs.

## Resultado de pruebas (2026-11-13)

Edge 157 sin interfaz vía DevTools Protocol, PHP 8.0.30:

- Casco Viejo con Pablo: con 10 enemigos del nivel vivos, al caminar hasta el centro de la arena empieza el combate; HUD "ENEMIGOS: 2" (solo el jefe y su escolta); al volver hacia la izquierda, el protagonista no sale de la arena (x 4385 > 4160).
- E lanza la Lata Voladora (sprite `drone:pablo` animado); recarga de 20 s; una segunda E durante la recarga no lanza otro.
- Los aliados lanzan su dron solos (`drone:reymar`, `drone:sergio`).
- Henry (Dron Arcoíris), Will (Dron AFK) y Domeki (Canasta Voladora) lanzan su dron en UAGRM.
- Con `?touch=1`: botones FUEGO, SALTO, GRANADA, HABIL., ARMA, **DRON**; el HUD dice "BOTA VOLADORA LISTO (DRON)".
- **Sin errores en consola.**
