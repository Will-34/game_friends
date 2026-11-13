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
DeviceManager (sin escena): táctil, pantalla completa/horizontal, aviso HTML "Gira tu dispositivo", zonas seguras.
```

## Flujo de datos del contenido

1. `BootScene` llama a `ContentLoader.loadAll()`:
   - `api/catalog.php` recorre `content/characters/` y `content/maps/`. Si falla, se usa `content/catalog.json` (se regenera con `php tools/build-catalog.php`).
   - Descarga cada `character.json` y `map.json` y los valida. Lo inválido se omite con un aviso en consola.
   - El resultado (`content`) se guarda en `game.registry` con la clave `content`.
2. `PreloadScene` encola los recursos con claves derivadas de los ids (`char:<id>`, `fx:<id>`, `portrait:<id>`, `map:<id>`, `map:<id>:<imagen>`) y crea las animaciones `<id>_<animación>` (por ejemplo `plata_idle`).
3. Flujo de escenas: `Menu` → `CharacterSelect` → `MapSelect` → `Story` → `Game` (+ `Hud`). Al vencer al jefe, `Game` pasa a la `Story` del siguiente nivel.
4. `GameScene` recibe `{ characterId, mapId, checkpoint }` y construye todo a partir de los datos (`checkpoint: 'boss'` = reintentar desde el jefe).

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
EnemyAI ──────────┘
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
  - `spawns` (objetos) — puntos `player`, `enemy` (propiedades `characterId`, `count`, `patrol`), `arena` (borde izquierdo de la arena del jefe) y `boss`.
  - Capas de imagen con `parallaxx` → fondos parallax (`TileSprite` con scroll proporcional).
- Propiedades del mapa: `name`, `subtitle`, `order` (campaña), `story`, `difficulty`, `bossName`, `bossTaunt`, `bossHealth`, `bossEscorts`, `bossReinforcements`, `allies`, `allyRespawns`, `clearText`, `music`, `backgroundColor`, `placeholder`. `LevelCatalog.js` las lee (sin conocer mapas concretos).
- Propiedades de tile: `collides`, `oneWay`, `hazard` (daño), `slow` (multiplicador de velocidad), `bounce` (rebote). `GameScene.applyTerrain` las aplica a cualquier `Fighter` que las pise.
- Los niveles de Santa Cruz se generan con `tools/build-level.php` (tema de arte + definición); ver ADR-012.

## Jefe y aliados (E5)

- El jefe es un personaje al azar con rol `ENEMY`, escala ×1,5 (`Fighter` escala la boca del arma, el nombre y el aura; el cuerpo de Arcade escala solo) y 2 fases.
- Los aliados son `ALLY` (bando `heroes`) con la misma `EnemyAI` en modo "seguir al líder". Todas las IA apuntan al **hostil más cercano** (`GameScene.nearestHostile`).
- `EnemyAbilityDirector` se usa dos veces: una para enemigos y otra para aliados.
- La arena no tiene barrera: el combate empieza al llegar a su centro; `closeArena` crea una pared invisible a la izquierda que no afecta a los enemigos del nivel (`isLevelEnemy`).

## Jefes no jugables y final (E6)

- `content/bosses/<id>/character.json` (mismo formato que un personaje) se lista en `catalog.bosses` y se carga en `content.bosses`: no aparece en la selección ni como enemigo aleatorio. Los genera `tools/build-robots.php`.
- Mapa con `bossType` → ese jefe; con `bossMinion` → el jefe invoca ese enemigo (`GameScene.spawnMinions`).
- Un jefe con `bossAttacks` usa `RobotBossDirector` (fases por vida, blindaje y punto débil con buffs, misiles con `GrenadePool`, láser y ondas como efectos de la escena).
- `final: true` en el mapa → al vencer, `FinalScene` (celebración y créditos).

## Drones

- Acción abstracta `drone` → `Fighter.tryUseDrone` (recarga `cooldownMs`) → `SpecialAbilitySystem.activateDrone` → `DroneAbility` (`src/abilities/drone.js`) con el sprite `drone:<id>` y la animación `<id>_drone`, cargados por `ContentLoader` desde `character.json → drone`. La habilidad de Plata usa el mismo `DroneAbility`.

## Audio

- `AudioManager` (instancia única `audio`): música por escena, efectos, volúmenes separados, silencio, desbloqueo con el primer gesto.
- Efectos con archivo (`content/audio/audio.json`) o, si no hay archivo, sintetizados (`SynthSfx.js`).

## Eventos entre escenas

`src/systems/GameEvents.js` define los nombres. `GameScene` emite en `this.events`: `player-health`, `player-ready`, `enemies-left`, `level-cleared`, `player-defeated`, `boss-start`, `boss-health`, `boss-end`, `allies-status`, `message`, y escucha `request-pause` (botón de pausa del HUD).

## Depuración

- `?debug=1`: cuerpos físicos visibles y visor de animaciones.
- En desarrollo (`localhost`) `window.__game` expone la instancia de Phaser.

## Combate (E4)

- `SpecialAbilitySystem` + `src/abilities/` (tipos `buff`, `drone`, `shadow-dash`); `EnemyAbilityDirector` (una habilidad enemiga a la vez).
- `GrenadePool` (granadas), `PickupManager` (objetos), `DifficultyManager` (nivel por enemigo), `FloatingText` ("+1", gestos, avisos).
- Armas: `content/config/weapons.json`; el inventario vive en el `Fighter` (`currentWeapon`, `cycleWeapon`, `giveWeapon`).
- IA: `src/ai/EnemyAI.js` (estados patrulla / alerta / ataque).
