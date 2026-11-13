# PROMPT INICIAL — RESCATANDO A HENRY

> Copia todo desde "INICIO DEL PROMPT" hasta "FIN DEL PROMPT" y pégalo en Claude Code (VS Code), con la carpeta del proyecto abierta.
> Antes de pegarlo, crea la carpeta del proyecto y coloca:
> - `assets-originales/referencia/personajes-todos.png` → la imagen grupal de los 10 personajes
> - `assets-originales/plata/plata-hoja.png` → la hoja de Plata
> - `docs/fuente/requisitos-v2.md` → tu documento "AMPLIACIÓN DE REQUISITOS — VERSIÓN 2.0"

---

## INICIO DEL PROMPT

Actúa como desarrollador senior de videojuegos 2D con Phaser, JavaScript moderno, HTML5 y CSS3, y también como líder técnico que organiza el proyecto de forma profesional.

Vamos a iniciar el proyecto **RESCATANDO A HENRY**: un videojuego arcade de acción lateral 2D, estilo run-and-gun en pixel art (inspirado en los clásicos arcade, pero 100 % original), donde 9 amigos pueden ser protagonistas o enemigos y al final 4 de ellos se vuelven aliados para rescatar a Henry de un robot gigante.

Los requisitos completos están en `docs/fuente/requisitos-v2.md`. Léelos completos, pero **en esta sesión solo implementarás las Etapas E0 y E1** descritas abajo. Todo lo demás debe quedar planificado en el backlog, no programado.

### 0. Primero inspecciona

Antes de crear archivos:
1. Lista el contenido actual de la carpeta del proyecto.
2. Revisa las imágenes de `assets-originales/` y descríbeme lo que encuentras (tamaño, fondo, si los cuadros están en una cuadrícula uniforme, si contienen textos o letreros).
3. Revisa qué herramientas hay disponibles en mi máquina: `php -v`, `git --version`, `python --version`. **No asumas que existe Node.js.**
4. Muéstrame un resumen y un plan breve; luego continúa.

### 1. Restricciones técnicas (obligatorias)

- El servidor de producción solo tiene **PHP, MySQL y CSS**. No hay Node.js, npm, bundlers ni pasos de compilación.
- El juego corre **100 % en el navegador**. No se guarda nada: cada vez que se carga, empieza de nuevo. No usar MySQL por ahora.
- Usar **Phaser** descargado como archivo local en `lib/phaser.min.js` (no CDN en producción). Usa la última versión estable que encuentres en el sitio oficial de Phaser y registra la versión exacta en `docs/decisiones/ADR-001-phaser-sin-build.md`. Si no puedes descargarlo, dime la URL exacta para que yo lo descargue.
- JavaScript con **módulos ES nativos** (`<script type="module">`, `import/export`). Sin TypeScript, sin JSX, sin frameworks extra.
- PHP solo para: servir `index.php` y el endpoint `api/catalog.php`, que recorre `content/characters/` y `content/maps/` y devuelve en JSON el catálogo de personajes y mapas disponibles. Debe funcionar en PHP 7.4 y 8.x. Si `catalog.php` falla, el juego debe usar como respaldo `content/catalog.json`.
- Para pruebas locales: `php -S localhost:8000` desde la raíz del proyecto. Documentarlo en el README.
- Resolución lógica 960 × 540 (16:9), `pixelArt: true`, Scale Manager con `FIT` + centrado, sin barras de desplazamiento.
- Compatible con Chrome, Edge, Firefox, Safari, Android e iPhone/iPad.
- Código, comentarios y documentación **en español**; nombres de archivos, clases y variables en inglés.

### 2. Principio de arquitectura: el juego se guía por datos

El código NO debe conocer personajes ni mapas concretos. Todo personaje, mapa y habilidad se define con datos, para poder agregar contenido copiando una carpeta:

```
content/characters/<id>/character.json   + spritesheet.png
content/maps/<id>/map.json               (+ tileset, fondos parallax)
src/abilities/<id>.js                    (registrado en src/abilities/registry.js)
```

Reglas:
- La **identidad** de un personaje (apariencia, animaciones, stats, habilidad) es independiente de su **rol** (`PLAYER`, `ENEMY`, `ALLY`, `RESCUE_TARGET`), que se asigna en tiempo de ejecución mediante `CharacterRoleManager`.
- `character.json` incluye: `id`, `name`, `stats`, `ability` (habilidad como protagonista o aliado), `enemyAbility` (habilidad como enemigo; puede ser `null` por ahora), `animations` (frames, fps, loop, origin, offset), `frameWidth`, `frameHeight`, `placeholder` (true/false) y `credits`.
- Teclado, controles táctiles e IA producen las **mismas acciones abstractas** (`moveX`, `jump`, `shoot`, `crouch`, `aimUp`, `grenade`, `special`, `switchWeapon`, `pause`). Las entidades solo leen acciones y nunca saben quién las controla.
- Una clase base común `Fighter` para cualquier personaje, independientemente de su rol.
- Object pooling para proyectiles desde el inicio.
- Los mapas se diseñarán con el editor **Tiled** (formato JSON). Para E1 basta un mapa de prueba simple; puede estar hecho en Tiled o generado desde datos, pero debe cargarse desde `content/maps/`.

### 3. Estructura del proyecto

Crea esta estructura (ajústala solo si lo justificas en un ADR):

```
/
├── index.php
├── api/catalog.php
├── lib/phaser.min.js
├── css/game.css
├── src/
│   ├── main.js
│   ├── config.js
│   ├── scenes/        Boot, Preload, Menu, Game, Hud, Pause, RotateDevice, AnimViewer
│   ├── entities/      Fighter.js, Projectile.js
│   ├── systems/       CharacterRoleManager.js, ContentLoader.js, ProjectilePool.js, AudioManager.js
│   ├── input/         Actions.js, KeyboardControls.js, MobileControls.js
│   ├── ai/            DummyEnemyAI.js
│   └── abilities/     registry.js
├── content/
│   ├── catalog.json
│   ├── characters/plata/
│   ├── maps/prueba/
│   └── audio/         music/, sfx/
├── assets-originales/       ← NUNCA modificar ni sobrescribir
├── tools/                   ← scripts de procesamiento de sprites (PHP CLI con GD, o Python si está instalado)
├── docs/
│   ├── fuente/requisitos-v2.md
│   ├── GDD.md
│   ├── ARQUITECTURA.md
│   ├── COMO-AGREGAR-PERSONAJE.md
│   ├── COMO-AGREGAR-MAPA.md
│   ├── AUDIO.md
│   ├── decisiones/          ADR-001..., un archivo por decisión técnica
│   └── pruebas/CHECKLIST.md
├── openspec/
│   ├── project.md
│   ├── specs/
│   └── changes/  (+ archive/)
├── BACKLOG.md
├── CHANGELOG.md
├── CREDITS.md
├── README.md
├── AGENTS.md
└── CLAUDE.md                ← solo indica: "Lee y sigue AGENTS.md"
```

### 4. Documentación y metodología

**AGENTS.md** (reglas permanentes para cualquier IA que trabaje en el proyecto). Debe incluir:
- Las restricciones de la sección 1 y el principio de la sección 2.
- "Nunca modificar `assets-originales/`."
- "No marcar como terminado algo que no se probó; no fingir animaciones que no existen: usar recursos provisionales marcados con `placeholder: true`."
- El flujo de trabajo obligatorio (abajo).
- La Definición de Terminado (abajo).

**OpenSpec sin CLI** (no hay Node, así que se sigue la convención manualmente):
- `openspec/project.md`: contexto, stack, convenciones.
- `openspec/specs/<capacidad>/spec.md`: estado actual del sistema. Requisitos con "DEBE" y al menos un `#### Escenario:` con formato DADO / CUANDO / ENTONCES.
- `openspec/changes/<id-del-cambio>/`: `proposal.md` (por qué, qué, alcance, fuera de alcance), `tasks.md` (checklist numerado), `design.md` (opcional, decisiones técnicas) y `specs/<capacidad>/spec.md` con secciones `## AGREGADO`, `## MODIFICADO`, `## ELIMINADO`.
- Al terminar un cambio: fusionar sus deltas en `openspec/specs/`, mover la carpeta a `openspec/changes/archive/AAAA-MM-DD-<id>/` y actualizar CHANGELOG y BACKLOG.

**Flujo de trabajo para cada historia del backlog:**
1. Tomar la siguiente historia `Pendiente` del BACKLOG y marcarla `En progreso`.
2. Crear el cambio en `openspec/changes/`.
3. **Mostrarme la propuesta y esperar mi aprobación** antes de programar (excepto en esta sesión inicial, en la que E0 y E1 ya están aprobadas).
4. Implementar y marcar tareas en `tasks.md`.
5. Probar (sección 7) y registrar el resultado.
6. Archivar el cambio, actualizar specs, CHANGELOG y BACKLOG.
7. Proponer un mensaje de commit (formato Conventional Commits, en español).

**Definición de Terminado:** funciona en el navegador sin errores en consola; probado con teclado; si afecta controles, probado con táctil (o simulación móvil del navegador); specs actualizadas; BACKLOG y CHANGELOG actualizados; sin archivos huérfanos.

**BACKLOG.md**: organizado por épicas, con historias que tengan ID (`H-001`…), descripción en formato "Como jugador quiero… para…", criterios de aceptación y estado (`Pendiente` / `En progreso` / `Hecho` / `Bloqueado`). Crea estas épicas, con historias detalladas para E0 y E1, y más generales para el resto:

- **E0 Fundaciones**: estructura, Phaser local, `catalog.php`, documentación, OpenSpec, git, despliegue de prueba.
- **E1 MVP Plata**: Plata se mueve, corre, salta, se agacha, dispara (horizontal y hacia arriba), gravedad, colisiones, cámara lateral, mapa de prueba, enemigo provisional que recibe daño y muere, HUD básico (vida), pausa, controles de teclado, audio provisional.
- **E2 Móvil**: controles táctiles multitáctiles completos, pantalla "gira tu dispositivo", ajuste del HUD, pruebas en Android y iPhone.
- **E3 Personajes**: incorporar los 9 personajes restantes y Henry desde sus hojas, pantalla de selección de protagonista.
- **E4 Combate**: armas, granadas, `SpecialAbilitySystem` y las 9 habilidades, habilidades de enemigos (por definir), enemigos aleatorios con `DifficultyManager`, IA de enemigos.
- **E5 Mapas**: pantalla de selección de mapa, 3 niveles, parallax, obstáculos, progresión de dificultad.
- **E6 Final**: Robot Guardián de 3 fases, 4 aliados con máquina de estados, rescate de Henry y pantalla de victoria.
- **E7 Pulido**: sprites definitivos, música y efectos finales, optimización y calidad gráfica, pruebas finales.

**docs/GDD.md**: reorganiza `requisitos-v2.md` como documento de diseño claro (visión, personajes y habilidades, roles, niveles, jefe final, controles, audio, rendimiento), agregando la **selección de mapa** y las **habilidades de enemigos** como "pendientes de definir".

### 5. Sprites de Plata

- La hoja de Plata es una **lámina ilustrativa**, no un spritesheet técnico: probablemente tiene letreros, fondo no transparente y cuadros de distinto tamaño. Verifícalo.
- Crea en `tools/` un script reutilizable (preferentemente PHP CLI con GD, porque PHP sí está garantizado; Python solo si está instalado) que: recorte los cuadros, quite el fondo, normalice cada cuadro a un tamaño fijo (por ejemplo 96 × 96) con los pies alineados abajo, y genere `content/characters/plata/spritesheet.png`. Los parámetros de recorte de cada personaje deben ir en un archivo de configuración, no en el código.
- Si algún cuadro no sale utilizable, usa un cuadro provisional (repetir otro cuadro o un rectángulo de color con el nombre) y regístralo en `character.json` y en el BACKLOG. **No inventes arte nuevo.**
- Crea la escena `AnimViewer` (accesible desde el menú en modo desarrollo o con `?debug=1`) que muestre todas las animaciones de un personaje, para revisarlas visualmente.

### 6. Audio

- **No uses música ni sonidos de Metal Slug ni de ningún juego comercial**: tienen derechos de autor.
- Crea un `AudioManager` con: música por escena, efectos (disparo, salto, golpe, explosión, muerte), volumen independiente de música y efectos, botón de silencio, y desbloqueo del audio con el primer toque o clic (requisito de iOS y Chrome).
- Para E1, genera **efectos provisionales sintetizados con Web Audio API** en código (estilo 8 bits), sin archivos externos.
- Deja preparada la carga de archivos `.ogg` y `.mp3` (ambos formatos, por compatibilidad con Safari) desde `content/audio/`, definidos en `content/audio/audio.json`.
- `docs/AUDIO.md` debe explicar cómo agregar música, qué licencias son aceptables (CC0 o CC-BY con atribución) y que cada archivo debe registrarse en `CREDITS.md` con autor, fuente y licencia.

### 7. Pruebas

- `docs/pruebas/CHECKLIST.md` con casos manuales para PC (teclado) y móvil (táctil o simulación de dispositivo del navegador).
- Antes de dar algo por terminado: abre el juego con `php -S`, revisa la consola del navegador y corrige errores.
- Si puedes ejecutar un navegador, pruébalo tú; si no, indícame exactamente qué debo probar.

### 8. Controles de teclado para E1

- Mover: ← → o A D. Agacharse: ↓ o S. Apuntar arriba: ↑ o W.
- Saltar: Espacio o K. Disparar: J. Granada: U (reservada). Habilidad: L (reservada). Cambio de arma: Q (reservada). Pausa: Esc o P.
- Las teclas deben definirse en un archivo de configuración, no repartidas por el código.

### 9. Entregables de esta sesión

Al terminar E0 y E1 debo poder:
1. Ejecutar `php -S localhost:8000` y abrir el juego.
2. Ver un menú simple → "Jugar" → Plata en el mapa de prueba.
3. Caminar, saltar, agacharme, disparar hacia adelante y hacia arriba, y derrotar al enemigo provisional.
4. Escuchar efectos de sonido provisionales y silenciarlos.
5. Pausar el juego.
6. Abrir el visor de animaciones de Plata.
7. Ver BACKLOG, specs, ADRs y CHANGELOG actualizados.

Termina con un **resumen** que incluya: qué se hizo, qué quedó provisional, problemas encontrados con los sprites, cómo probarlo y cuál es la siguiente historia sugerida del backlog.

Si algo de este prompt contradice `requisitos-v2.md`, este prompt tiene prioridad en temas de stack y metodología; los requisitos tienen prioridad en temas de diseño del juego. Si hay dudas que afecten decisiones importantes, pregúntame antes de continuar.

## FIN DEL PROMPT

---

## PROMPT PARA AGREGAR UN PERSONAJE (usar más adelante)

> Coloca primero la hoja en `assets-originales/<nombre>/<nombre>-hoja.png`.

```
Sigue AGENTS.md. Toma la historia del BACKLOG correspondiente a agregar al personaje [NOMBRE]
(créala si no existe). La hoja está en assets-originales/[nombre]/.
1. Crea el cambio OpenSpec y muéstrame la propuesta.
2. Inspecciona la hoja y configura su recorte en tools/.
3. Genera content/characters/[nombre]/ con spritesheet.png y character.json,
   respetando su apariencia y accesorios (ver docs/GDD.md).
4. Registra su habilidad: [describir o "la definida en el GDD"].
   Habilidad como enemigo: [describir o "pendiente"].
5. Verifica que aparece en el catálogo y en el AnimViewer, y que se puede jugar con él.
6. Prueba, archiva el cambio y actualiza BACKLOG, specs y CHANGELOG.
```
