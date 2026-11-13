# Arquitectura — Rescatando a Henry

## Visión general

```
index.php ──> lib/phaser.min.js (global Phaser)
          └─> src/main.js (módulo ES)
                 │
   Boot ──> Preload ──> Menu ──> CharacterSelect ──> Game ◄──► Hud
    │          │          │        │        (vida, enemigos, pausa, silencio, táctil)
    │          │          │        └──> Pause
    │          │          └──> AnimViewer (desarrollo)
    │          └─ encola spritesheets, tilesets, fondos, audio; crea animaciones
    └─ ContentLoader.loadAll(): catálogo (api/catalog.php → respaldo content/catalog.json),
       character.json, map.json, controls.json, audio.json
RotateDevice: superposición automática en móviles en vertical.
```

## Flujo de datos del contenido

1. `BootScene` llama a `ContentLoader.loadAll()`:
   - `api/catalog.php` recorre `content/characters/` y `content/maps/`. Si falla, se usa `content/catalog.json` (se regenera con `php tools/build-catalog.php`).
   - Descarga cada `character.json` y `map.json` y los valida. Lo inválido se omite con un aviso en consola.
   - El resultado (`content`) se guarda en `game.registry` con la clave `content`.
2. `PreloadScene` encola los recursos con claves derivadas de los ids (`char:<id>`, `fx:<id>`, `portrait:<id>`, `map:<id>`, `map:<id>:<imagen>`) y crea las animaciones `<id>_<animación>` (por ejemplo `plata_idle`).
3. `GameScene` recibe `{ characterId, mapId }` y construye todo a partir de los datos.

## Entidades y roles

- **`Fighter`** (`src/entities/Fighter.js`) es la clase base de cualquier personaje. Lee `stats`, `body`, `crouchBody`, `muzzle`, `animations` y `effects` de su `character.json`.
- **`CharacterRoleManager`** asigna el rol en tiempo de ejecución (`PLAYER`, `ENEMY`, `ALLY`, `RESCUE_TARGET`), del que se derivan el bando (`heroes`, `enemies`, `neutral`) y modificadores provisionales (vida, velocidad de bala, cadencia, aturdimiento, invulnerabilidad, tinte).
- Los proyectiles solo dañan a bandos hostiles (`CharacterRoleManager.areHostile`).
- `CharacterRoleManager.pickEnemyIds()` elige los personajes de los enemigos con `characterId: "random"`: nunca el protagonista ni quien tenga `canBeEnemy: false`; se reparten sin repetir mientras haya candidatos.
- **`ProjectilePool`** reutiliza los proyectiles (nunca se destruyen; se desactivan).

## Entrada: acciones abstractas

```
KeyboardControls ─┐
MobileControls ───┼─(TouchProxy)─> Controller ──> ActionState ──> Fighter
DummyEnemyAI ─────┘
```

- Cada fuente implementa `read(raw, time, delta)` y escribe `raw.moveX` y `raw.buttons`.
- `Controller` combina fuentes y `ActionState` calcula flancos (`held`, `pressed`, `released`).
- Acciones: `moveX`, `jump`, `shoot`, `crouch`, `aimUp`, `grenade`, `special`, `switchWeapon`, `pause`.
- `MobileControls` se dibuja en `HudScene` y se publica en el registro (`touchControls`); el jugador lo lee con `TouchProxy`.

## Física y colisiones

- Arcade Physics, gravedad 1500 px/s², velocidad máxima de caída 900 px/s (`src/config.js`).
- El cuerpo físico se centra sobre los pies sin importar el `origin` de la animación (`Fighter.applyBody`).
- Tiles con propiedad `collides` chocan; los que además tienen `oneWay` solo chocan al caer desde arriba (y las balas los atraviesan).

## Mapas

- Formato Tiled JSON en `content/maps/<id>/map.json`. Capas esperadas:
  - `ground` (tiles) — colisión por propiedad `collides`; `oneWay` para plataformas atravesables.
  - `spawns` (objetos) — puntos `player` y `enemy` (propiedades `characterId`, `patrol`).
  - Capas de imagen con `parallaxx` → fondos parallax (`TileSprite` con scroll proporcional).
- Propiedades del mapa: `name`, `music`, `backgroundColor`, `placeholder`.

## Audio

- `AudioManager` (instancia única `audio`): música por escena, efectos, volúmenes separados, silencio, desbloqueo con el primer gesto.
- Efectos con archivo (`content/audio/audio.json`) o, si no hay archivo, sintetizados (`SynthSfx.js`).

## Eventos entre escenas

`src/systems/GameEvents.js` define los nombres. `GameScene` emite en `this.events`: `player-health`, `player-ready`, `enemies-left`, `level-cleared`, `player-defeated`, y escucha `request-pause` (botón de pausa del HUD).

## Depuración

- `?debug=1`: cuerpos físicos visibles y visor de animaciones.
- En desarrollo (`localhost`) `window.__game` expone la instancia de Phaser.
