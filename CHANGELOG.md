# CHANGELOG

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versiones con [SemVer](https://semver.org/lang/es/).

## [0.3.0] — 2026-11-13

### E4 — Combate

#### Agregado
- **Habilidades especiales** de los 10 personajes (`SpecialAbilitySystem` + tipos `buff`, `drone`, `shadow-dash` en `src/abilities/`). Se cargan con 2 bajas y se activan con L / botón HABILIDAD; animación `special`, aura de color y aviso con el nombre de la habilidad.
- **"+1" con el símbolo** de cada personaje al hacer una baja; los enemigos hacen su gesto (solo el símbolo) al acertarte.
- **Granadas** (U / botón GRANADA): 5 iniciales, parábola, rebote, daño en área, explosión y temblor de cámara.
- **Grupos de 2-3 enemigos** por zona (10-11 enemigos en el mapa de prueba).
- **Dificultad aleatoria** por enemigo (Fácil / Normal / Difícil), visible por el color de su nombre.
- **Habilidades de enemigos**: aleatorias, una sola a la vez en todo el mapa.
- **Nombre sobre cada personaje** y mini barra de vida en los enemigos.
- HUD: barra de habilidad (parpadea al estar lista), granadas y bajas. Botones táctiles GRANADA y HABILIDAD.
- Sonido sintetizado `special`; texturas generadas para granada, explosión e iconos (lata y bota verdes).

#### Corregido
- La lista de personajes ya no se reasigna al morir un enemigo (los colisionadores conservaban la lista vieja).

## [0.2.0] — 2026-11-13

### E3 — Personajes

#### Agregado
- Los 9 personajes restantes jugables: Carlos, Domeki, Henry, Ignacio, Pablo, Reymar, Ruddy, Sergio y Will (spritesheet, retrato, efectos y `character.json` con su arquetipo y habilidad tomados de cada lámina).
- Pantalla **Elige tu protagonista** (Menú → JUGAR → selección → partida) con retratos, vista previa animada y habilidad; teclado, ratón y táctil.
- Enemigos aleatorios: los puntos de aparición usan `characterId: "random"`; nunca el protagonista ni Henry (`canBeEnemy: false`).
- Retrato del protagonista en el HUD. Fogonazo genérico para personajes cuya lámina no trae uno.
- `sprite-cutter.php`: eliminación de fondo pintado por color (láminas opacas), halo oscuro, líneas separadoras y bordes de letreros; escala automática por fila (`autoScale`); división de cuadros unidos (`maxFrameWidth`, `splitX`); `eraseRects`; efectos por región; retrato; cálculo automático de `body` y `muzzle` (ADR-008).

#### Cambiado
- El catálogo conserva el orden de `content/characters/` (antes dependía del orden de descarga).
- Tinte de enemigos más suave (ahora cada enemigo es un personaje distinto).

#### Provisional
- `fire_up` en todos los personajes reutiliza un cuadro de `idle` (ninguna lámina lo trae). Habilidades sin lógica hasta E4. Defectos de arte menores en H-047.

## [0.1.1] — 2026-11-13

### Corregido
- Plata cambiaba de tamaño al disparar: la lámina original dibuja cada fila a distinta escala (idle/victory ~93 px, run/jump ~84 px, fire/special ~77 px). `sprite-cutter.php` acepta ahora `scale` por animación y `tools/config/plata.json` iguala todas las poses de pie a ~77 px (solo reduciendo). Ajustados `body`, `crouchBody` y `muzzle` de Plata (H-027).

## [0.1.0] — 2026-11-13

### E0 — Fundaciones

#### Agregado
- Estructura del proyecto, `index.php`, `css/game.css` y `.htaccess` de producción.
- Phaser v4.2.1 local en `lib/phaser.min.js` (ADR-001).
- Catálogo de contenido: `api/catalog.php` + `api/lib/catalog-lib.php` y respaldo `content/catalog.json` (ADR-002).
- Herramientas PHP CLI: `tools/sprite-cutter.php`, `tools/build-test-map.php`, `tools/build-catalog.php` (ADR-003, ADR-006).
- Documentación: AGENTS.md, CLAUDE.md, README, GDD, ARQUITECTURA, guías, CHECKLIST, ADR-001 a ADR-007.
- OpenSpec manual: `openspec/project.md`, specs por capacidad y cambios archivados.
- Repositorio git inicializado con `.gitignore`.

### E1 — MVP Plata

#### Agregado
- Plata como primer personaje: spritesheet (49 cuadros, celdas 144×104), efectos y `character.json` generados desde la lámina original.
- Escenas: Boot, Preload, Menu, Game, Hud, Pause, RotateDevice, AnimViewer.
- `Fighter` (clase base de cualquier personaje): correr, saltar (salto variable), agacharse, disparar horizontal/agachado/hacia arriba, daño, invulnerabilidad, muerte, victoria.
- `CharacterRoleManager` (roles y bandos), `ProjectilePool` (object pooling), `ContentLoader`.
- Acciones abstractas con `Controller`; teclado configurable (`content/config/controls.json`); controles táctiles básicos multitáctiles.
- `DummyEnemyAI`: patrulla, gira en bordes y dispara ráfagas.
- Mapa de prueba en formato Tiled con plataformas atravesables y parallax de 2 capas (gráficos provisionales).
- HUD: vida, enemigos restantes, pausa y silencio. Banners de victoria y derrota.
- `AudioManager` con efectos sintetizados provisionales, volúmenes separados, silencio y desbloqueo con el primer gesto; carga `.ogg`/`.mp3` preparada.

#### Provisional
- `fire_up` de Plata reutiliza un cuadro de `idle` (la lámina no tiene esa pose).
- Tileset, fondos y efectos de sonido son marcadores de posición.
- Los enemigos son Plata con tinte rojizo.
