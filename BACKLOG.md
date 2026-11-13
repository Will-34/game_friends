# BACKLOG — Rescatando a Henry

Estados: `Pendiente` · `En progreso` · `Hecho` · `Bloqueado`
Flujo de trabajo y Definición de Terminado: ver [AGENTS.md](AGENTS.md).

**Hecho:** E2 — Móvil; E3 — Personajes y selección; E4 — Combate (habilidades, granadas, dificultad, grupos de enemigos) (2026-11-13). **Pendiente en E4:** H-039 (armas) y H-044 (IA avanzada). **Siguiente épica:** E5 — Mapas.

### Decisiones del usuario (2026-11-13)
1. Las láminas sin transparencia se usan tal cual: la herramienta quitará el fondo pintado (H-045).
2. Henry también será jugable (además de ser el objetivo del rescate), aunque su habilidad no tenga lógica todavía.
3. Pablo cambió de diseño: vale la lámina nueva (cinta en la cabeza, lata energética), no la imagen grupal.
4. Orden: inicialmente E2 primero; después el usuario pidió avanzar E3 (personajes) antes. E2 queda como siguiente épica.

---

## E0 — Fundaciones

| ID | Historia | Estado |
| --- | --- | --- |
| H-001 | Estructura del proyecto | Hecho |
| H-002 | Phaser local sin build | Hecho |
| H-003 | Catálogo de contenido PHP con respaldo | Hecho |
| H-004 | Documentación base | Hecho |
| H-005 | OpenSpec manual | Hecho |
| H-006 | Repositorio git | Hecho |
| H-007 | Despliegue de prueba | Bloqueado |
| H-008 | Herramienta de recorte de sprites | Hecho |
| H-009 | Mapa de prueba generado en formato Tiled | Hecho |
| H-010 | Incorporar `requisitos-v2.md` y completar el GDD | Bloqueado |

**H-001 — Estructura del proyecto.** Como desarrollador quiero una estructura de carpetas clara para que cualquier persona o IA encuentre cada cosa.
- [x] Estructura del prompt creada; ajustes justificados en ADR-007.
- [x] `assets-originales/` con las láminas copiadas sin modificar.

**H-002 — Phaser local sin build.** Como desarrollador quiero Phaser en un archivo local para desplegar en un servidor sin Node.
- [x] `lib/phaser.min.js` v4.2.1 con versión, origen y SHA-256 en ADR-001.
- [x] Módulos ES nativos; sin paso de compilación.

**H-003 — Catálogo PHP con respaldo.** Como jugador quiero que el juego descubra personajes y mapas automáticamente para que el contenido nuevo aparezca sin tocar código.
- [x] `api/catalog.php` (PHP 7.4/8.x) recorre `content/characters/` y `content/maps/`.
- [x] Si falla, el cliente usa `content/catalog.json` (verificado bloqueando la URL).
- [x] `php tools/build-catalog.php` regenera el respaldo.

**H-004 — Documentación base.** Como colaborador quiero documentación para entender reglas, diseño y arquitectura.
- [x] AGENTS.md, CLAUDE.md, README, GDD, ARQUITECTURA, guías de personaje/mapa/audio, CHECKLIST, ADRs.

**H-005 — OpenSpec manual.** Como equipo queremos especificaciones vivas para saber qué hace el sistema.
- [x] `openspec/project.md`, specs por capacidad, cambios E0/E1 archivados.

**H-006 — Repositorio git.** Como equipo queremos control de versiones.
- [x] `git init`, `.gitignore`. El primer commit queda a decisión del usuario (mensaje propuesto en el CHANGELOG de la sesión).

**H-007 — Despliegue de prueba.** Como equipo queremos ver el juego en el servidor real para validar PHP, rutas y MIME.
- [ ] Subir los archivos (ver README → Despliegue) y abrir la URL pública.
- [ ] `api/catalog.php` responde JSON en el servidor.
- [ ] Sin errores en consola; el juego carga en móvil.
- **Bloqueado:** requiere acceso al servidor de producción (lo realiza el usuario).

**H-008 — Herramienta de recorte de sprites.** Como desarrollador quiero convertir láminas ilustrativas en spritesheets técnicos para incorporar personajes rápido.
- [x] `tools/sprite-cutter.php` (PHP CLI + GD), parámetros en `tools/config/<id>.json`.
- [x] Quita fondo, normaliza a celda fija, alinea pies, genera `effects.png` y actualiza `character.json`.
- [x] Avisa de cuadros faltantes y marca animaciones provisionales.

**H-009 — Mapa de prueba Tiled.** Como desarrollador quiero un mapa de prueba cargado desde `content/maps/`.
- [x] `tools/build-test-map.php` genera `map.json` (Tiled), tileset y fondos provisionales.

**H-010 — Incorporar `requisitos-v2.md`.** Como equipo queremos el GDD completo para diseñar E3–E6.
- [ ] Colocar el documento en `docs/fuente/requisitos-v2.md`.
- [ ] Completar todo lo marcado `[PENDIENTE: requisitos-v2]` en `docs/GDD.md`.
- [ ] Revisar contradicciones con lo implementado y registrar cambios en el BACKLOG.
- **Bloqueado:** el archivo no estaba en el proyecto.

---

## E1 — MVP Plata

| ID | Historia | Estado |
| --- | --- | --- |
| H-011 | Menú principal | Hecho |
| H-012 | Movimiento y carrera | Hecho |
| H-013 | Salto con gravedad | Hecho |
| H-014 | Agacharse | Hecho |
| H-015 | Disparo horizontal y hacia arriba | Hecho (pose hacia arriba provisional) |
| H-016 | Mapa de prueba, colisiones y cámara lateral | Hecho |
| H-017 | Enemigo provisional que recibe daño y muere | Hecho |
| H-018 | HUD básico | Hecho |
| H-019 | Pausa | Hecho |
| H-020 | Controles de teclado configurables | Hecho |
| H-021 | Audio provisional y AudioManager | Hecho |
| H-022 | Visor de animaciones | Hecho |
| H-023 | Pose real de disparo hacia arriba de Plata | Pendiente |
| H-024 | Cuadros faltantes en la lámina de Plata | Pendiente |
| H-025 | Efecto "anillo verde" de Plata | Pendiente |
| H-026 | Animación de correr disparando | Pendiente |
| H-027 | Tamaño inconsistente de Plata entre animaciones | Hecho |

**H-011 — Menú principal.** Como jugador quiero un menú simple para empezar a jugar.
- [x] "JUGAR", "VISOR DE ANIMACIONES" (solo desarrollo), "SONIDO: SÍ/NO"; teclado, ratón y táctil.

**H-012 — Movimiento.** Como jugador quiero caminar/correr a izquierda y derecha para recorrer el nivel.
- [x] ← → / A D; animación `run`; el sprite se voltea.

**H-013 — Salto.** Como jugador quiero saltar para subir a plataformas y esquivar.
- [x] Espacio / K; gravedad; `jump`/`fall`; salto variable; plataformas atravesables desde abajo.

**H-014 — Agacharse.** Como jugador quiero agacharme para esquivar balas altas.
- [x] ↓ / S; cuerpo físico más bajo; no avanza agachado.

**H-015 — Disparo.** Como jugador quiero disparar hacia adelante y hacia arriba para derrotar enemigos.
- [x] J; de pie, agachado (`crouch_fire`) y hacia arriba (↑ + J); fogonazo; proyectiles con object pooling.
- [ ] Pose real hacia arriba → H-023 (hoy `fire_up` es provisional).

**H-016 — Mapa y cámara.** Como jugador quiero un escenario lateral con plataformas y cámara que me siga.
- [x] Mapa Tiled de 120 × 17 tiles; colisiones; cámara con zona muerta; parallax de 2 capas.

**H-017 — Enemigo provisional.** Como jugador quiero enemigos que pueda derrotar para probar el combate.
- [x] 4 enemigos (Plata con rol ENEMY y tinte rojizo); patrullan, giran en bordes, disparan ráfagas si ven al jugador.
- [x] Reciben daño, parpadean, mueren con animación, humo y desaparecen; "¡ZONA DESPEJADA!" al eliminar a todos.

**H-018 — HUD.** Como jugador quiero ver mi vida para saber cuánto aguanto.
- [x] Nombre, barra de vida con colores, enemigos restantes, botones de pausa y silencio.
- [x] Muerte del jugador → "HAS CAÍDO" → reintentar.

**H-019 — Pausa.** Como jugador quiero pausar la partida.
- [x] Esc / P o botón II; continuar o salir al menú; pausa automática al ocultar la pestaña.

**H-020 — Teclado configurable.** Como desarrollador quiero las teclas en un archivo para cambiarlas sin tocar código.
- [x] `content/config/controls.json`; U, L, Q reservadas.

**H-021 — Audio provisional.** Como jugador quiero oír efectos y poder silenciarlos.
- [x] `AudioManager`: música por escena (preparada), efectos sintetizados, volúmenes separados, silencio (M / HUD / menú), desbloqueo con el primer gesto.
- [x] Carga de `.ogg` + `.mp3` desde `content/audio/audio.json` preparada.
- [ ] Prueba auditiva humana (ver CHECKLIST).

**H-022 — Visor de animaciones.** Como desarrollador quiero revisar las animaciones visualmente.
- [x] Escena AnimViewer: todas las animaciones, pausa, cuadro a cuadro, espejo, cuerpo físico y bocas del arma; marca las provisionales.

**H-023 — Disparo hacia arriba real (Plata).** La lámina no incluye esta pose; hoy se usa el cuadro 0 de `idle` (`placeholder: true`). Requiere arte nuevo del autor de la lámina.

**H-024 — Cuadros faltantes (Plata).** La lámina anuncia 8/6/6 cuadros pero dibuja `run` 7, `death` 5, `victory` 5. Las animaciones usan los cuadros reales (no se inventan). Requiere arte si se quieren los cuadros completos.

**H-025 — Anillo verde (Plata).** El efecto es un brillo semitransparente que no se separa del fondo con el umbral de alfa. Resolver en E4 (técnica por color o arte dedicado).

**H-027 — Tamaño inconsistente (corrección).** Como jugador quiero que el personaje mantenga su tamaño en todas las poses.
- [x] Escala por animación en la configuración del recorte; todas las poses de pie miden ~77 px.
- [x] Probado en el navegador: idle, run, fire, crouch_fire y fire_up sin cambios de tamaño.

**H-026 — Correr disparando.** No existe animación; al disparar en movimiento se mantiene `run`. Requiere arte (todas las láminas).

---

## E2 — Móvil

| ID | Historia | Estado |
| --- | --- | --- |
| H-030 | Controles táctiles completos (granada, habilidad, cambio de arma, pausa) | Hecho |
| H-031 | Jugar en horizontal: pantalla completa, bloqueo de orientación y aviso "gira tu dispositivo" | Hecho |
| H-032 | HUD adaptado a móvil y zonas seguras (muesca) | Hecho |
| H-033 | Pruebas en Android (Chrome) | En progreso (prueba del usuario) |
| H-034 | Pruebas en iPhone/iPad (Safari), incluido desbloqueo de audio | En progreso (prueba del usuario) |
| H-029 | Aprovechar pantallas más alargadas que 16:9 (sin franjas negras) | Pendiente |

- H-030: botones táctiles para todas las acciones, tamaño y posición configurables en `controls.json`, sin activaciones fantasma; probado multitáctil.
- H-031: en Android, pantalla completa + bloqueo en horizontal al pulsar JUGAR; en iPhone (no permite bloquear) aviso a pantalla completa; manifiesto web con orientación horizontal.
- H-032: respetar `env(safe-area-inset-*)`, HUD legible en pantallas pequeñas.
- H-033/H-034: probado con emulación (ver CHECKLIST, registro 0.4.0); falta que el usuario confirme en sus teléfonos (CHECKLIST D, README → "Jugar desde el teléfono").
- H-029: hoy el escalado FIT deja franjas negras en teléfonos 19.5:9. Opción: escalado EXPAND con HUD y menús anclados a los bordes; requiere revisar todas las escenas.

## E3 — Personajes

| ID | Historia | Estado |
| --- | --- | --- |
| H-035 | Obtener láminas completas de los 9 personajes restantes y Henry | Hecho |
| H-045 | Quitar el fondo pintado de láminas sin transparencia | Hecho |
| H-036 | Incorporar a los 9 personajes restantes | Hecho |
| H-037 | Henry jugable (hecho) y como `RESCUE_TARGET` en el final (E6) | En progreso |
| H-038 | Pantalla de selección de protagonista | Hecho |
| H-046 | Enemigos aleatorios: otros personajes, nunca el protagonista ni Henry | Hecho |
| H-047 | Retoques de arte de las láminas nuevas | Pendiente |

- H-035: recibidas las 9 láminas (2026-11-13). Sugerido renombrar los archivos a `<nombre>-hoja.png` (sin espacios, tildes ni `&`); si se renombran, actualizar `source` en `tools/config/<id>.json`.
- H-045 (hecho): `sprite-cutter.php` con `background.mode: "color"` (relleno de fondo, halo oscuro, líneas separadoras), escala automática por fila, cortes manuales `splitX`, `eraseRects`, retrato y medidas automáticas. Las láminas nuevas son opacas (fondo gris-morado pintado). Ampliar `tools/sprite-cutter.php` con eliminación de fondo por color (relleno desde los bordes de cada región, frenado por el contorno oscuro). Limitación conocida: los efectos semitransparentes (sombra de Reymar, anillos verdes) no se recuperarán bien.
- H-036: los letreros de algunas láminas no coinciden con lo dibujado (Ruddy JUMP 8/3, FIRE 2/4; Domeki FALL 3/2); se usa lo dibujado.
- H-037: decisión del usuario: Henry es jugable aunque su habilidad (Bandera de Poder) aún no tenga lógica.
- H-038 (hecho): cuadrícula 5×2 con retratos, vista previa animada, arquetipo y habilidad; teclado, ratón y táctil. Menú → JUGAR → selección → partida.
- H-046 (hecho): los enemigos del mapa usan `characterId: "random"`; se reparten sin repetir; Henry (`canBeEnemy: false`) y el protagonista nunca son enemigos.
- H-047: defectos menores conocidos: el especial de Reymar (sombra semitransparente) y los brillos verdes de los especiales salen como bloques sólidos; Will `fire[3]` tiene el fogonazo dibujado sobre su capa; Ruddy `fire[1]` sin fogonazo (borrado porque se superponía a la bandera); `fire_up` provisional en todos (ninguna lámina lo trae); estrellas de `hurt` a veces en el cuadro vecino.

## E4 — Combate

| ID | Historia | Estado |
| --- | --- | --- |
| H-039 | Armas y cambio de arma | Pendiente |
| H-040 | Habilidades de enemigos | Hecho |
| H-041 | Granadas | Hecho |
| H-042 | `SpecialAbilitySystem` y las 10 habilidades | Hecho |
| H-043 | Dificultad aleatoria por enemigo (`DifficultyManager`) y grupos de 2-3 enemigos | Hecho |
| H-044 | IA de enemigos definitiva (máquina de estados, cobertura, persecución) | Pendiente |
| H-048 | Nombre sobre cada personaje (y mini barra de vida en enemigos) | Hecho |
| H-049 | "+1" con el símbolo del personaje en cada baja; gestos de los enemigos | Hecho |

- H-040 (hecho): los enemigos usan su misma habilidad (`enemyAbility: null` = usar `ability`). `EnemyAbilityDirector`: cada 9-16 s elige UN enemigo visible al azar; nunca dos habilidades enemigas a la vez.
- H-041 (hecho): tecla U / botón GRANADA; 5 al empezar (Domeki recarga 3 con su habilidad); parábola, rebote, explosión con daño en área (85 px) y temblor de cámara. Los enemigos difíciles también lanzan.
- H-042 (hecho): la habilidad se carga con 2 bajas y se activa con L / botón HABILIDAD. Tipos: `buff` (8 personajes), `drone` (Plata), `shadow-dash` (Reymar). Ver ADR-009.
- H-043 (hecho): niveles Fácil (verde, 45 %), Normal (amarillo, 35 %), Difícil (rojo, 20 %): vida, cadencia, velocidad de bala, alcance de visión, ráfagas y granadas. El color del nombre indica el nivel.
- H-049 (hecho): símbolos en `character.json → taunt`: Will "AFK", Ignacio 🎂, Carlos 👩, Reymar 😠, Pablo lata verde, Henry 🧔, Sergio bota verde, Plata "TOKEN", Ruddy 😭, Domeki 🧹. Los emojis dependen de la fuente del sistema (se ven distintos en Windows, Android e iOS).

## E5 — Mapas

| ID | Historia | Estado |
| --- | --- | --- |
| H-050 | Pantalla de selección de mapa (diseño pendiente) | Pendiente |
| H-051 | 3 niveles diseñados en Tiled | Pendiente |
| H-052 | Parallax definitivo por nivel | Pendiente |
| H-053 | Obstáculos y peligros | Pendiente |
| H-054 | Progresión de dificultad entre niveles | Pendiente |

## E6 — Final

| ID | Historia | Estado |
| --- | --- | --- |
| H-060 | Robot Guardián de 3 fases | Pendiente |
| H-061 | 4 aliados con máquina de estados | Pendiente |
| H-062 | Rescate de Henry y pantalla de victoria | Pendiente |

## E7 — Pulido

| ID | Historia | Estado |
| --- | --- | --- |
| H-070 | Sprites definitivos (incluye tileset y fondos, que hoy son provisionales) | Pendiente |
| H-071 | Música y efectos finales (CC0/CC-BY) | Pendiente |
| H-072 | Optimización y calidad gráfica | Pendiente |
| H-073 | Pruebas finales en todos los navegadores y dispositivos | Pendiente |
