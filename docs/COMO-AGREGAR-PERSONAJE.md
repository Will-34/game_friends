# Cómo agregar un personaje

Un personaje se agrega **sin tocar el código del juego**: solo datos y una herramienta.

## 1. Colocar la lámina original

```
assets-originales/<id>/<id>-hoja.png
```

No se modifica nunca. Puede tener fondo transparente (como Plata) u opaco pintado (como el resto): en ese caso se usa `"background": { "mode": "color" }` (ADR-008).

## 2. Configurar el recorte

Copia `tools/config/plata.json` (lámina con transparencia) o `tools/config/domeki.json` (lámina opaca, misma plantilla) como `tools/config/<id>.json` y ajusta:

| Campo | Significado |
| --- | --- |
| `source` / `output` / `characterJson` | Rutas de la lámina, del spritesheet generado y del `character.json` |
| `alphaThreshold` | Alfa GD (0 = opaco, 127 = transparente) por debajo del cual un píxel es "del personaje" |
| `minFrameArea` | Área mínima (px) para considerar una mancha como cuadro; las menores son "detalles" |
| `scale` | Escala de los cuadros (1.0 = sin reescalar, recomendado para pixel art nítido) |
| `frameWidth` / `frameHeight` | Celda fija del spritesheet (Plata usa 144 × 104 para que quepan los fogonazos) |
| `animations.<nombre>.region` | `[x, y, ancho, alto]` en la lámina donde están los cuadros de esa animación |
| `animations.<nombre>.frames` | Alternativa: rectángulos explícitos `[[x,y,w,h], ...]` |
| `animations.<nombre>.scale` | Escala propia de esa animación. Úsala si la lámina dibuja filas a distinto tamaño: iguala la altura de pie de todas las poses (reduciendo) |
| `expected` | Cuadros esperados (si difiere, se avisa) |
| `attachDetails` | Une chispas/fogonazos sueltos al cuadro más cercano |
| `anchor` | `feet` (centro de los pies, por defecto) o `bbox` (centro del recuadro, para poses tumbadas) |
| `placeholderFrom` | Animación que **no existe** en la lámina: reutiliza cuadros de otra y se marca `placeholder: true` |
| `background` | `{ "mode": "alpha" }` (por defecto) o `{ "mode": "color" }` para láminas opacas; parámetros opcionales `lumMin`, `lumMax`, `satMax`, `bluishMin`, `stepMax`, `darkHalo`, `haloRadius`, `lineMinLength`, `lineMaxThickness` |
| `autoScale` | `{ "target": "fire", "groups": { "idle": ["idle","crouch"], … } }`: iguala el tamaño de las filas de la lámina a la altura de la animación `target` |
| `animations.<nombre>.maxFrameWidth` | Ancho máximo de un cuadro (130 por defecto): una mancha más ancha se divide en dos |
| `animations.<nombre>.splitX` | Cortes manuales (x absoluta en la lámina) para cuadros que se tocan, p. ej. un fogonazo que toca al personaje siguiente |
| `eraseRects` | Rectángulos `[x,y,w,h]` de la lámina que se ignoran (restos imposibles de separar) |
| `portrait` | `{ "rect": [x,y,w,h], "size": 96, "output": "content/characters/<id>/portrait.png" }`: retrato para la pantalla de selección y el HUD |
| `effects` | Efectos sueltos (fogonazo `muzzle`, `explosion`, `smoke`…) a una hoja aparte `effects.png`; cada uno con `region` o `rect` |

Para medir regiones, abre la lámina en cualquier editor de imágenes y anota coordenadas, o ejecuta la herramienta con `--debug` y revisa `tools/output/<id>.debug.png`.

## 3. Generar

```bash
php tools/sprite-cutter.php tools/config/<id>.json --debug
```

Genera `content/characters/<id>/spritesheet.png`, `effects.png`, `portrait.png` y actualiza en `character.json` los campos técnicos (`spritesheet`, `frameWidth`, `frameHeight`, `animations`, `effects`, `portrait`). Si `character.json` aún no tiene `body`, `crouchBody` o `muzzle`, los **calcula** a partir de los cuadros. El informe queda en `tools/output/<id>.report.json`.

**Revisa siempre `tools/output/<id>.debug.png`**: que no haya restos de líneas, fogonazos detrás del personaje o cuadros partidos. Si los hay, corrige con `splitX`, `eraseRects` o las regiones.

## 4. Completar `character.json`

```json
{
  "id": "<id>",
  "name": "Nombre visible",
  "archetype": "Rol en la lámina (p. ej. Soporte / Logística)",
  "description": "…",
  "placeholder": false,
  "credits": "Origen del arte",
  "stats": { "maxHealth": 100, "speed": 190, "jumpVelocity": 640, "fireRateMs": 180, "bulletSpeed": 620, "bulletDamage": 10 },
  "body": { "width": 34, "height": 74 },
  "crouchBody": { "width": 40, "height": 52 },
  "muzzle": { "stand": { "x": 48, "y": -40 }, "crouch": { "x": 54, "y": -34 }, "up": { "x": 8, "y": -92 } },
  "ability": { "id": "<id-habilidad>", "name": "…", "description": "…", "implemented": false },
  "enemyAbility": null,
  "canBeEnemy": true
}
```

- `body`, `crouchBody` y `muzzle` se miden desde los **pies** (origen). Ajústalos con el visor (`?debug=1` → Visor de animaciones): el rectángulo verde es el cuerpo y los puntos amarillos son las bocas del arma.
- `canBeEnemy: false` impide que aparezca como enemigo aleatorio (Henry).
- `drone` (opcional): su dron propio para la acción DRON (E): `name`, `description`, `bulletColor` (`#rrggbb` o `rainbow`), `cooldownMs`, `params` (`durationMs`, `fireRateMs`, `range`, `damage`, `bulletSpeed`) y el sprite `image` (`frameWidth`, `frameHeight`, `frameCount`). Para dibujarlo, añade su diseño en `tools/lib/drone-art.php` y ejecuta `php tools/build-drones.php <id>` (respeta los campos de diseño que ya existan). Sin `drone`, usa un dron genérico.
- Animaciones que usa el juego: `idle`, `run`, `jump`, `fall`, `crouch`, `crouch_fire`, `fire`, `fire_up`, `hurt`, `death`, `victory` (y `grenade`, `special` en E4). Si falta alguna, el `Fighter` usa `idle`.

## 5. Registrar y verificar

```bash
php tools/build-catalog.php
```

- Comprueba que aparece en `api/catalog.php`, en la pantalla **Elige tu protagonista** y en el visor de animaciones.
- Registra en `BACKLOG.md` cualquier animación provisional.
- Añade la habilidad en `src/abilities/<id-habilidad>.js` y regístrala en `src/abilities/registry.js` (E4).
