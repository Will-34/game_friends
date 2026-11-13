# RESCATANDO A HENRY

Videojuego arcade de acción lateral 2D (run-and-gun) en pixel art, 100 % original. Nueve amigos pueden ser protagonistas o enemigos; al final, cuatro se vuelven aliados para rescatar a Henry de un robot gigante.

**Estado:** E0 (Fundaciones), E1 (MVP) y E3 (10 personajes jugables y pantalla de selección) terminadas. Siguiente: E2 (móvil). Ver [BACKLOG.md](BACKLOG.md) y [CHANGELOG.md](CHANGELOG.md).

## Requisitos

- **PHP 7.4 o 8.x** (solo para servir la página y `api/catalog.php`). Las herramientas de `tools/` necesitan la extensión **GD**.
- Un navegador moderno (Chrome, Edge, Firefox, Safari; Android e iPhone/iPad).
- No se necesita Node.js, npm ni ningún paso de compilación.

## Ejecutar en local

Desde la raíz del proyecto:

```bash
php -S localhost:8000
```

Si `php` no está en el PATH (por ejemplo con XAMPP en Windows):

```powershell
C:\xampp\php\php.exe -S localhost:8000
```

Abre <http://localhost:8000>: Menú → JUGAR → **Elige tu protagonista** → partida.

- `?debug=1` → muestra los cuerpos físicos y habilita el visor de animaciones en el menú (en `localhost` el visor ya está habilitado).
- `?touch=1` → fuerza los controles táctiles en un equipo de escritorio.

## Controles (teclado)

| Acción | Teclas |
| --- | --- |
| Mover | ← → o A D |
| Agacharse | ↓ o S |
| Apuntar arriba | ↑ o W |
| Saltar | Espacio o K |
| Disparar | J |
| Granada (reservada) | U |
| Habilidad (reservada) | L |
| Cambiar arma (reservada) | Q |
| Pausa | Esc o P |
| Silencio | M |

Las teclas se configuran en [content/config/controls.json](content/config/controls.json).

## Estructura

| Carpeta | Contenido |
| --- | --- |
| `index.php`, `api/` | Página del juego y catálogo de contenido (PHP) |
| `lib/` | Phaser 4.2.1 local |
| `src/` | Código del juego (módulos ES) |
| `content/` | Personajes, mapas, audio y configuración (datos) |
| `assets-originales/` | Láminas originales — **nunca se modifican** |
| `tools/` | Herramientas PHP CLI (recorte de sprites, mapas, catálogo) |
| `docs/` | GDD, arquitectura, guías, ADRs y pruebas |
| `openspec/` | Especificaciones y cambios (metodología OpenSpec manual) |

## Herramientas

```bash
php tools/sprite-cutter.php tools/config/<id>.json [--debug]    # lámina → spritesheet, retrato, efectos y character.json
php tools/build-test-map.php tools/config/map-prueba.json       # mapa de prueba en formato Tiled
php tools/build-catalog.php                                     # regenera content/catalog.json (respaldo)
```

## Despliegue

Copiar al servidor PHP todo excepto `assets-originales/`, `tools/`, `docs/`, `openspec/` y archivos `.md` (no son necesarios en producción). Antes de subir, ejecutar `php tools/build-catalog.php` para actualizar el respaldo del catálogo y cambiar `$assetVersion` en `index.php` para invalidar la caché.

## Documentación

- [AGENTS.md](AGENTS.md) — reglas para IAs y flujo de trabajo
- [docs/GDD.md](docs/GDD.md) — diseño del juego
- [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) — arquitectura técnica
- [docs/COMO-AGREGAR-PERSONAJE.md](docs/COMO-AGREGAR-PERSONAJE.md) · [docs/COMO-AGREGAR-MAPA.md](docs/COMO-AGREGAR-MAPA.md) · [docs/AUDIO.md](docs/AUDIO.md)
- [docs/pruebas/CHECKLIST.md](docs/pruebas/CHECKLIST.md) — pruebas manuales
- [docs/decisiones/](docs/decisiones/) — decisiones técnicas (ADR)
