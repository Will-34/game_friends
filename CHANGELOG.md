# CHANGELOG

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versiones con [SemVer](https://semver.org/lang/es/).

## [0.7.0] — 2026-11-13

### E5 — Arena libre y drones

#### Agregado
- **Dron para todos** (tecla **E** / botón **DRON**): cada personaje lanza su dron temático (Puro-Dron, Canasta Voladora, Dron Arcoíris, Olla Voladora, Lata Voladora, Dron Token, Capucha Sombra, Dron Llorón J&J, Bota Voladora, Dron AFK), con recarga de 20 s. Sprites generados con `tools/build-drones.php`. Los aliados también lo usan.
- El HUD muestra el estado del dron; la selección de personaje muestra su nombre.

#### Cambiado
- **Sin barrera** antes del jefe: se puede esquivar a los enemigos y llegar a la arena; el HUD cuenta solo los enemigos del combate.

#### Eliminado
- Barrera "NO PASAR" y el aviso "¡Faltan N, chango!".

## [0.6.0] — 2026-11-13

### E5 — Mapas de Santa Cruz

#### Agregado
- **3 niveles** de Santa Cruz de la Sierra: **Casco Viejo** (Plaza 24 de Septiembre), **Ciudad Universitaria UAGRM** y **Lomas de Arena**, con 4 capas parallax y tileset de pixel art generados por `tools/build-level.php` (temas en `tools/lib/level-themes.php`).
- **Selección de mapa** (`MapSelectScene`) e **historia** antes de cada nivel (`StoryScene`) con jerga cruceña.
- **Terreno especial**: peligros (parrilla, laguna, curichi), terreno lento (charco, barro, arena movediza) y rebote (toldos, llantas).
- **Jefe al final de cada mapa**: amigo "hackeado" al azar, más grande, con barra de vida, frase, escoltas, fase 2 con refuerzos. Barrera "NO PASAR" hasta despejar el nivel.
- **2 aliados aleatorios** contra el jefe que siguen al protagonista; si caen vuelven a los 5-10 s (máximo 2 veces). Estado en el HUD.
- Victoria "¡FUERZA CAMBA!" con paso al siguiente nivel; reintento desde el jefe.
- ADR-012; capacidades `levels` y `story` en OpenSpec.

#### Cambiado
- La IA apunta al hostil más cercano (enemigos atacan también a los aliados) y no pisa peligros.
- Dificultad de enemigos por mapa (`difficulty`).
- Derrota: "¡QUÉ MACANA!"; Esc vuelve al menú.
- Mapa por defecto: `casco-viejo`. La "Zona de pruebas" solo aparece en desarrollo.

## [0.5.0] — 2026-11-13

### E4 — Combate (cierre)

#### Agregado
- **Armas** (`content/config/weapons.json`): pistola, metralleta, escopeta y lanzallamas con munición; cambio con Q / botón ARMA; HUD con arma y munición.
- **Objetos** que sueltan los enemigos: armas, vida y granadas (`PickupManager`).
- **IA de enemigos** `EnemyAI`: estados patrulla / alerta / ataque, persecución con límite, saltos, disparo hacia arriba y separación del grupo.
- **Resumen** en los carteles de victoria y derrota (personaje, bajas, tiempo).
- Proyectiles con textura por arma, alcance, perforación y crecimiento (llamas).

#### Cambiado
- El daño de los enemigos depende de su dificultad (60 / 80 / 100 %).
- Icono de la bota verde de Sergio más reconocible; iconos pixel art más grandes en el "+1".

#### Eliminado
- `src/ai/DummyEnemyAI.js` (reemplazada por `EnemyAI`).

## [0.4.0] — 2026-11-13

### E2 — Móvil

#### Agregado
- `DeviceManager`: detección táctil (también con el primer toque), pantalla completa + horizontal al tocar JUGAR (Android), zonas seguras, sin zoom accidental ni menú contextual.
- Aviso "GIRA TU DISPOSITIVO" en HTML/CSS (animado, a pantalla completa) que pausa y reanuda la partida.
- Controles táctiles completos: joystick flotante, botones FUEGO, SALTO, GRANADA, HABIL. y ARMA (atenuado hasta H-039), deslizar entre botones, vibración, HABIL. parpadea cuando está lista. Disposición anclada a los bordes en `controls.json`.
- HUD adaptado: respeta la muesca, botones más grandes en táctil, botón ⛶ de pantalla completa.
- `manifest.webmanifest` e íconos para "Añadir a pantalla de inicio" (horizontal, pantalla completa).
- README: cómo jugar desde el teléfono en la red local.

#### Eliminado
- `RotateDeviceScene` (reemplazada por el aviso HTML de `DeviceManager`, ADR-010).

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
