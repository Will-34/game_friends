# Audio

## Estado actual (E1)

- **Efectos provisionales sintetizados** con Web Audio API (`src/systems/SynthSfx.js`): `shoot`, `jump`, `hit`, `explosion`, `death`, `ui`, `victory`. No usan archivos.
- **Música:** preparada pero sin archivos todavía (las escenas quedan en silencio).
- Silencio global: tecla **M**, botón 🔊 del HUD o "SONIDO" en el menú.
- El audio se desbloquea con un toque, clic o tecla (requisito de iOS y Chrome). Se reintenta en cada gesto hasta que el contexto quede activo, con búfer silencioso para iOS, `navigator.audioSession.type = "playback"` (el interruptor de silencio del iPhone no lo apaga en iOS 17+) y reanudación al volver a la pestaña. Los efectos usan el mismo AudioContext de Phaser.

## Prohibido

**No usar música ni efectos de Metal Slug ni de ningún juego comercial**, ni "remixes" de ellos: tienen derechos de autor.

## Licencias aceptables

| Licencia | ¿Se puede usar? | Condición |
| --- | --- | --- |
| CC0 / dominio público | Sí | Ninguna (se registra igualmente en `CREDITS.md`) |
| CC-BY 3.0 / 4.0 | Sí | Atribución en `CREDITS.md` (autor, fuente, licencia) |
| CC-BY-SA | Evitar | Obliga a compartir el juego con la misma licencia |
| CC-BY-NC / NC-ND | No | Restricciones de uso |
| "Libre de regalías" sin licencia clara | No | — |

Fuentes habituales: OpenGameArt.org (filtrar por CC0/CC-BY), freesound.org (revisar la licencia de cada archivo), Kenney.nl (CC0).

## Cómo agregar un archivo

1. Prepara el archivo en **dos formatos**: `.ogg` (Chrome/Firefox/Android) y `.mp3` (Safari/iOS).
2. Cópialos a `content/audio/music/` o `content/audio/sfx/`.
3. Regístralos en `content/audio/audio.json`:

```json
{
  "musicVolume": 0.5,
  "sfxVolume": 0.8,
  "music": {
    "menu":   { "files": ["content/audio/music/menu.ogg", "content/audio/music/menu.mp3"], "volume": 0.8, "loop": true },
    "level1": { "files": ["content/audio/music/level1.ogg", "content/audio/music/level1.mp3"], "volume": 0.7 }
  },
  "sfx": {
    "shoot": { "files": ["content/audio/sfx/shoot.ogg", "content/audio/sfx/shoot.mp3"], "volume": 0.6 }
  },
  "sceneMusic": { "Menu": "menu", "Game": "level1" }
}
```

- Un efecto con archivo **sustituye** a su versión sintetizada; los que no tengan archivo siguen sintetizándose.
- La música de un nivel se toma de la propiedad `music` del mapa (Tiled); si no existe, de `sceneMusic`.
- **No declares archivos que no existan**: el cargador daría un error 404 en consola.

4. Añade una entrada en `CREDITS.md` con: archivo, autor, fuente (URL), licencia y cambios realizados.
