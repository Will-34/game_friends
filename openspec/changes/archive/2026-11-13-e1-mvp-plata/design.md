# Diseño: e1-mvp-plata

## Decisiones

- **Celdas 144×104 a escala 1.0** (ADR-003): sin reescalado para mantener el pixel art nítido.
- **Origen en los pies** (`origin ≈ [0.5, 0.98]`); el cuerpo físico se recalcula en cada cambio de animación para quedar sobre los pies (`Fighter.applyBody`).
- **Controladores combinables** (ADR-004): `Controller([KeyboardControls, TouchProxy])` para el jugador; `Controller([DummyEnemyAI])` para enemigos.
- **Modificadores por rol** provisionales en `CharacterRoleManager` (enemigos: 50 % de vida, balas al 55 % de velocidad, cadencia ×1.4, aturdimiento 120 ms).
- **Plataformas oneWay** con *process callback* (solo colisionan al caer; las balas las atraviesan).
- **HUD como escena paralela** que escucha eventos de `GameScene` (`GameEvents.js`) y aloja los controles táctiles.
- **Audio sintetizado** en un `AudioContext` propio; los archivos, cuando existan, se reproducen con el gestor de sonido de Phaser (ADR-005).

## Parámetros de juego (provisionales)

| Parámetro | Valor |
| --- | --- |
| Gravedad | 1500 px/s² |
| Velocidad máx. de caída | 900 px/s |
| Plata: velocidad / salto | 190 px/s / 640 px/s (≈136 px de altura) |
| Plata: cadencia / velocidad de bala / daño | 180 ms / 620 px/s / 10 |
| Invulnerabilidad del jugador tras golpe | 900 ms |
