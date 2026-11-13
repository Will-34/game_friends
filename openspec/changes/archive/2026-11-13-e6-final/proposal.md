# Propuesta: e6-final

- **Épica:** E6 Final · **Historias:** H-060, H-061, H-062, H-074
- **Estado:** Archivado (2026-11-13). Aprobado por el usuario: "ok aplica eso. y a los jefes de los demás mapas también que invoquen robots o algo así".

## Qué

1. **Nivel 4 "Base del Robot Guardián"** (Parque Industrial de noche): tema de arte `base` (`tools/lib/level-theme-base.php`) con piso electrificado, manchas de aceite y resortes.
2. **Robot Guardián** (H-060): jefe final generado por código (`tools/build-robots.php` → `content/bosses/robot-guardian/`), sin arte de personaje. Es un `Fighter` (se mueve y dispara con `EnemyAI`) con `RobotBossDirector` y 3 fases:
   - Fase 1: cañón, misiles en arco desde los hombros.
   - Fase 2: + barridos láser con aviso (bajo: saltar; alto: agacharse), dron centinela, mini-robots.
   - Fase 3: + ondas de choque por el suelo (saltar), más mini-robots y más agresivo.
   - Siempre: blindaje (recibe menos daño) salvo cuando **abre el pecho** (punto débil, recibe mucho más daño).
3. **4 aliados** en el combate final (H-061): misma IA de "seguir al líder", reaparición y drones.
4. **Henry en una cápsula de vidrio** sobre el robot (`captiveStyle: capsule`); al vencerlo se rompe y Henry sale feliz.
5. **Escena final** (H-062): "¡HENRY RESCATADO!", todos los amigos celebrando en la plaza, confeti y créditos.
6. **Mini-robots** (H-074): todos los jefes los invocan cada cierto tiempo (`bossMinion`, `minionEveryMs`, `minionMax`) y al enfurecerse.
7. **Catálogo:** nueva carpeta `content/bosses/` para personajes no jugables (robots).

## Fuera de alcance

- Arte definitivo del robot (H-070) y música/efectos finales (H-071).
