# AGENTS.md — Reglas permanentes para cualquier IA que trabaje en este proyecto

Proyecto: **RESCATANDO A HENRY** — videojuego arcade 2D de acción lateral (run-and-gun) en pixel art, 100 % original.

Lee también: `README.md`, `docs/ARQUITECTURA.md`, `docs/GDD.md`, `BACKLOG.md` y `openspec/project.md`.

---

## 1. Restricciones técnicas (obligatorias)

- El servidor de producción solo tiene **PHP, MySQL y CSS**. **No hay Node.js, npm, bundlers ni pasos de compilación.**
- El juego corre **100 % en el navegador**. No se guarda nada entre partidas (sin `localStorage`, sin MySQL por ahora).
- **Phaser** se usa desde el archivo local `lib/phaser.min.js` (versión registrada en `docs/decisiones/ADR-001-phaser-sin-build.md`). Nunca CDN en producción.
- JavaScript con **módulos ES nativos** (`<script type="module">`, `import/export`). Sin TypeScript, sin JSX, sin frameworks extra.
- PHP solo para: servir `index.php` y el endpoint `api/catalog.php`. Compatible con **PHP 7.4 y 8.x**. Si `catalog.php` falla, el juego usa `content/catalog.json`.
- Pruebas locales: `php -S localhost:8000` desde la raíz.
- Resolución lógica **960 × 540**, `pixelArt: true`, Scale Manager `FIT` + centrado, sin barras de desplazamiento.
- Compatibilidad: Chrome, Edge, Firefox, Safari, Android, iPhone/iPad.
- Código, comentarios y documentación **en español**; nombres de archivos, clases y variables **en inglés**.
- Las herramientas de `tools/` usan **PHP CLI + GD** (Python solo si está instalado; Node no está garantizado).

## 2. Principio de arquitectura: el juego se guía por datos

El código **no conoce personajes ni mapas concretos**. Se agrega contenido copiando una carpeta:

```
content/characters/<id>/character.json  + spritesheet.png (+ effects.png)
content/maps/<id>/map.json              (Tiled JSON + tileset + fondos parallax)
src/abilities/<id>.js                   (registrado en src/abilities/registry.js)
```

- **Identidad ≠ rol.** La identidad (apariencia, animaciones, stats, habilidad) está en `character.json`. El rol (`PLAYER`, `ENEMY`, `ALLY`, `RESCUE_TARGET`) se asigna en tiempo de ejecución con `CharacterRoleManager`.
- Teclado, táctil e IA producen las **mismas acciones abstractas** (`moveX`, `jump`, `shoot`, `crouch`, `aimUp`, `grenade`, `special`, `switchWeapon`, `pause`). Las entidades solo leen acciones.
- Una sola clase base **`Fighter`** para cualquier personaje.
- **Object pooling** para proyectiles (`ProjectilePool`).
- Mapas en formato **Tiled JSON**, cargados desde `content/maps/`.
- Las teclas se definen en `content/config/controls.json`, nunca repartidas por el código.

## 3. Reglas de contenido

- **Nunca modificar ni sobrescribir `assets-originales/`.** Todo recurso derivado se genera con herramientas de `tools/` hacia `content/`.
- **No marcar como terminado algo que no se probó.**
- **No fingir animaciones que no existen:** usar recursos provisionales marcados con `placeholder: true` (y una `note`) en `character.json`, y registrarlos en el BACKLOG.
- **No inventar arte nuevo de personajes.** Si un cuadro no es utilizable, repetir otro cuadro o usar un rectángulo con el nombre, marcado como provisional.
- **No usar música ni sonidos de juegos comerciales.** Solo licencias CC0 o CC-BY (con atribución en `CREDITS.md`).

## 4. Flujo de trabajo obligatorio (cada historia del backlog)

1. Tomar la siguiente historia `Pendiente` del `BACKLOG.md` y marcarla `En progreso`.
2. Crear el cambio en `openspec/changes/<id-del-cambio>/` (`proposal.md`, `tasks.md`, `design.md` opcional, `specs/<capacidad>/spec.md` con `## AGREGADO` / `## MODIFICADO` / `## ELIMINADO`).
3. **Mostrar la propuesta al usuario y esperar su aprobación antes de programar.**
4. Implementar y marcar tareas en `tasks.md`.
5. Probar (ver `docs/pruebas/CHECKLIST.md`) y registrar el resultado en el cambio.
6. Archivar: fusionar deltas en `openspec/specs/`, mover la carpeta a `openspec/changes/archive/AAAA-MM-DD-<id>/`, actualizar `CHANGELOG.md` y `BACKLOG.md`.
7. Proponer un mensaje de commit (Conventional Commits, en español). No hacer commit sin que el usuario lo pida.

## 5. Definición de Terminado

- Funciona en el navegador **sin errores en consola**.
- Probado con **teclado**.
- Si afecta controles: probado con **táctil** (o simulación móvil del navegador).
- Specs de OpenSpec actualizadas.
- `BACKLOG.md` y `CHANGELOG.md` actualizados.
- Sin archivos huérfanos (nada generado o temporal fuera de su lugar).

## 6. Entorno local conocido

- En la máquina del autor, PHP está en `C:\xampp\php\php.exe` (no está en el PATH). Ver `README.md`.
- Python no está instalado. Node.js existe localmente pero **no** debe ser requisito del proyecto.
