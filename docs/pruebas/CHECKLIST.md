# Checklist de pruebas manuales

Antes de dar algo por terminado: `php -S localhost:8000`, abrir el juego, **revisar la consola del navegador (F12)** y recorrer los casos que apliquen.

Leyenda de resultado: ✅ OK · ❌ falla · ⏭ no aplica / no probado

## A. Carga y menú (PC)

| # | Caso | Esperado |
| --- | --- | --- |
| A1 | Abrir `http://localhost:8000` | Barra de carga → menú. Sin errores en consola |
| A2 | Pie del menú | Dice `catálogo: api` |
| A3 | Romper temporalmente `api/catalog.php` (renombrarlo) y recargar | Juego carga igual; pie dice `catálogo: fallback`; en consola solo el aviso informativo y el 404 de la petición |
| A4 | ↑/↓ y Enter en el menú; clic en botones | Navega y activa; sonido de interfaz tras la primera interacción |
| A5 | "SONIDO: SÍ/NO" y tecla M | Alterna el silencio |
| A6 | Redimensionar la ventana | El juego escala manteniendo 16:9, centrado, sin barras de desplazamiento |

## B. Partida con teclado (PC)

| # | Caso | Esperado |
| --- | --- | --- |
| B1 | Jugar (Zona de pruebas, en desarrollo) | El protagonista aparece en el mapa; HUD con vida 100/100 y enemigos restantes |
| B2 | ← → / A D | Camina en ambos sentidos (animación `run`), se voltea |
| B3 | Espacio / K | Salta (`jump` → `fall`); soltar antes reduce la altura |
| B4 | Subir a plataformas grises desde abajo | Se atraviesan desde abajo y se puede aterrizar encima |
| B5 | ↓ / S | Se agacha y no avanza |
| B6 | J | Dispara hacia adelante con fogonazo y sonido |
| B7 | ↓ + J | Dispara agachado (`crouch_fire`), balas más bajas |
| B8 | ↑ + J | Dispara hacia arriba (pose provisional) |
| B9 | Disparar a un enemigo | Parpadea, retrocede; tras 5 impactos muere (animación `death`), humo y desaparece; el contador baja |
| B10 | Dejarse disparar | La vida baja de 10 en 10, parpadeo de invulnerabilidad, barra cambia de color |
| B11 | Eliminar al enemigo de la plataforma alta | Posible disparando hacia arriba desde debajo |
| B12 | Eliminar a todos | "¡ZONA DESPEJADA!", pose de victoria; Esc/clic vuelve al menú |
| B13 | Morir | "¡QUÉ MACANA!"; Espacio/J/clic reinicia la partida; Esc vuelve al menú |
| B14 | Esc / P | Pausa; Esc / P / CONTINUAR reanuda; SALIR AL MENÚ vuelve |
| B15 | Cambiar de pestaña durante la partida | Al volver, el juego está en pausa |
| B16 | U, L, Q | No hacen nada todavía (reservadas), sin errores |
| B17 | La cámara | Sigue a Plata; los fondos se desplazan más lento (parallax) |

## C. Visor de animaciones

| # | Caso | Esperado |
| --- | --- | --- |
| C1 | Menú → VISOR DE ANIMACIONES (en localhost o con `?debug=1`) | Se ve Plata ampliado |
| C2 | ←/→, botones ◀ ▶ | Recorre las 13 animaciones; `fire_up` aparece como PROVISIONAL |
| C3 | Espacio / F / X / B | Pausa, avanza un cuadro, espejo, muestra/oculta cuerpo y bocas del arma |
| C4 | Esc / VOLVER | Regresa al menú |

## E. Selección de personaje y personajes (E3)

| # | Caso | Esperado |
| --- | --- | --- |
| E1 | Menú → JUGAR | Pantalla "ELIGE TU PROTAGONISTA" con 10 retratos |
| E2 | Flechas / WASD; clic en una tarjeta | Cambia la selección, vista previa animada, arquetipo y habilidad |
| E3 | Enter / Espacio / J, botón JUGAR o tocar la tarjeta ya seleccionada | Empieza la partida con ese personaje; retrato y nombre en el HUD |
| E4 | Esc / VOLVER | Vuelve al menú |
| E5 | Jugar con cada uno de los 10 | Corre, salta, se agacha, dispara (de pie, agachado, arriba) sin errores; el fogonazo sale delante del arma |
| E6 | Enemigos | Son otros personajes; nunca el protagonista ni Henry |
| E7 | Visor de animaciones, ↑/↓ | Recorre los 10 personajes |
| E8 | Volver al menú y entrar otra vez a la selección | Queda seleccionado el último personaje elegido (solo durante la sesión) |

## F. Combate (E4)

| # | Caso | Esperado |
| --- | --- | --- |
| F1 | Empezar partida | 10-11 enemigos en grupos de 2-3, cada uno con su nombre (color = dificultad) y mini barra de vida; el protagonista con su nombre en celeste |
| F2 | U | Lanza una granada en parábola; explota, daña en área y tiembla la cámara; el contador baja |
| F3 | Eliminar a un enemigo | "+1" + el símbolo del protagonista sobre su cabeza; BAJAS sube |
| F4 | 2 bajas | La barra de habilidad se llena y parpadea "… LISTA (L)" |
| F5 | L con la habilidad lista | Animación especial, aviso "¡NOMBRE!", aura de color y efecto de la habilidad (probar los 10) |
| F6 | Dejarse disparar | El enemigo que acierta muestra su símbolo (como mucho cada 2,5 s) |
| F7 | Esperar cerca de enemigos | De vez en cuando UN enemigo usa su habilidad (aviso en rojo); nunca dos a la vez |
| F8 | Enemigo difícil (nombre rojo) a media distancia | A veces lanza granadas |
| F9 | Recoger una caja de arma (M, E, L) | Se equipa; el HUD muestra nombre y munición; Q cambia entre las armas |
| F10 | Gastar toda la munición | Vuelve a la pistola |
| F11 | Lanzallamas contra un grupo | Las llamas crecen y atraviesan, dañando a varios |
| F12 | Recoger vida / granadas | +30 vida / +3 granadas con aviso flotante |
| F13 | Subirse a una plataforma sobre un enemigo | Te persigue o te dispara hacia arriba; salta paredes |
| F14 | Ganar o perder | El cartel muestra personaje, bajas y tiempo |

## G. Mapas, jefe y aliados (E5)

| # | Paso | Resultado esperado |
| --- | --- | --- |
| G1 | Elegir protagonista | Pantalla "ELIGE EL MAPA" con Casco Viejo, UAGRM y Lomas de Arena (miniatura, dificultad ★, jefe) |
| G2 | ←/→ y Enter; tocar una tarjeta dos veces | Elige el mapa y pasa a la historia |
| G3 | Historia | Texto con escritura progresiva sobre los fondos en movimiento; Enter completa; Enter otra vez juega; Esc vuelve |
| G4 | Avanzar por cada nivel | 4 capas parallax a distinta velocidad; sin costuras visibles |
| G5 | Pisar parrilla / laguna / curichi | Pierde vida y da un saltito |
| G6 | Pisar charco / barro / arena movediza | Camina más lento |
| G7 | Caer sobre un toldo o una llanta | Rebota muy alto |
| G8 | Esquivar a los enemigos (saltarlos o pasar entre ellos) y llegar al centro de la arena | Empieza el combate aunque queden enemigos; el HUD cuenta solo los del combate; no se puede salir de la arena por la izquierda |
| G9 | Eliminar a todos los enemigos del nivel antes del jefe | "¡ZONA DESPEJADA! Avanzá hacia el jefe →"; flecha "JEFE →" en la entrada de la arena |
| G10 | Llegar al centro de la arena | La cámara se fija; el jefe (más grande) cae con su frase; escoltas; barra del jefe arriba; llegan 2 aliados ("¡Llegamos, chango!") |
| G11 | Dejar que un aliado muera | HUD "NOMBRE vuelve en N s"; vuelve a los 5-10 s ("¡Volví, pues!"); como máximo 2 veces |
| G12 | Bajar al jefe a la mitad | "¡… SE PICÓ!", barra roja, refuerzos |
| G13 | Vencer al jefe | Escoltas caen; "¡FUERZA CAMBA!" + texto del nivel + resumen; Enter → historia del siguiente nivel |
| G14 | Morir contra el jefe y pulsar Espacio | Reaparece en la arena sin los enemigos del nivel |
| G15 | Vencer al jefe de Lomas de Arena | Mensaje de la base del Robot Guardián; Enter vuelve al menú |
| G16 | E (o botón DRON) con cada personaje | Sale su dron temático (p. ej. Pablo: lata verde; Henry: bandera arcoíris y balas de colores), dispara solo ~8 s; el HUD cuenta 20 s de recarga |
| G17 | E durante la recarga | No sale otro dron |
| G18 | Combate contra el jefe | Los aliados lanzan su dron de vez en cuando |
| G19 | Selección de personaje | Muestra "Dron (E): nombre del dron" |

## D. Móvil (E2)

En Chrome/Edge: F12 → icono de dispositivo → elegir un teléfono. Para pruebas reales ver README → "Jugar desde el teléfono".

| # | Caso | Esperado |
| --- | --- | --- |
| D1 | Partida en dispositivo táctil | Joystick (guía tenue a la izquierda) y botones FUEGO, SALTO, GRANADA, HABIL. y ARMA (atenuado) a la derecha |
| D2 | Apoyar el pulgar en cualquier punto de la mitad izquierda y deslizar | La base del joystick aparece bajo el pulgar; el personaje se mueve |
| D3 | Joystick a la derecha + FUEGO a la vez | Corre y dispara (multitáctil) |
| D4 | Mantener FUEGO y deslizar hasta SALTO sin levantar | Deja de disparar y salta |
| D5 | Joystick abajo / arriba | Agacharse / apuntar arriba |
| D6 | GRANADA / HABIL. (con 2 bajas: el botón parpadea) | Lanza granada / activa la habilidad |
| D7 | Botones II, 🔊 y ⛶ del HUD | Pausa, silencio, pantalla completa (⛶ no aparece en iPhone) |
| D8 | Teléfono en vertical | Aviso "GIRA TU DISPOSITIVO" a pantalla completa; la partida se pausa; al girar se reanuda |
| D9 | Android: tocar JUGAR | Pantalla completa y orientación horizontal bloqueada |
| D10 | iPhone con muesca, en horizontal | El retrato/vida y el joystick no quedan bajo la muesca |
| D11 | Primer toque | El audio se desbloquea (iOS/Chrome); vibración corta al pulsar botones (Android) |
| D12 | Doble toque rápido / pellizco | No hace zoom |
| D13 | Activar la emulación móvil con la página ya abierta y tocar | Aparecen los controles táctiles sin recargar |
| D14 | "Añadir a pantalla de inicio" y abrir desde el ícono | Se abre sin barras del navegador (Android: siempre en horizontal) |

## Registro de ejecuciones

| Fecha | Versión | Entorno | Resultado |
| --- | --- | --- | --- |
| 2026-11-13 | 0.1.0 | Edge (Chromium) sin interfaz vía DevTools Protocol, 960×540, PHP 8.0.30 | A1, A2, A3 (bloqueando la URL), A4, A5 (estado interno), B1–B14, B17, C1–C4, D1–D4, D6 (viewport 400×800 táctil emulado) ✅. Sin errores en consola. |
| 2026-11-13 | 0.7.0 | Edge 157 sin interfaz vía DevTools Protocol, PHP 8.0.30, también con `?touch=1` | G8 (jefe con 10 enemigos del nivel vivos; pared izquierda), G16–G18 ✅ (Pablo, Henry, Will, Domeki; aliados con dron; botón DRON). Sin errores en consola. |
| 2026-11-13 | 0.6.0 | Edge 157 sin interfaz vía DevTools Protocol, PHP 8.0.30 | G1–G14 ✅ (selección de mapa, historia, terreno, barrera caminando, arena, jefe ×1,5, aliados y reaparición, fase 2, reintento desde el jefe, victoria → nivel 2; UAGRM y Lomas cargan y se juegan con IA). Sin errores en consola. G15 y la sensación del combate: prueba humana (H-063). |
| 2026-11-13 | 0.5.0 | Edge sin interfaz vía DevTools Protocol, PHP 8.0.30 | F9–F12, F14 ✅ (las 4 armas, munición, Q, objetos, resumen); IA: transición patrulla → alerta → ataque verificada; partida automática ~45 s sin errores en consola. F13 (sensación de la IA): prueba humana. |
| 2026-11-13 | 0.4.0 | Edge sin interfaz, emulación táctil 412×915 / 915×412, PHP 8.0.30 | D1–D3, D5, D7 (II y 🔊), D8, D13 ✅. Sin errores en consola. Pendientes de prueba en teléfono real: D4, D6, D9–D12, D14. |
| 2026-11-13 | 0.3.0 | Edge (Chromium) sin interfaz vía DevTools Protocol, PHP 8.0.30 | F1–F7 ✅ (las 10 habilidades activadas; granada con daño en área; "+1" y carga; habilidad enemiga). Partida automática de ~45 s sin errores en consola. F8 y la sensación de dificultad: pendientes de prueba humana. |
| 2026-11-13 | 0.2.0 | Edge (Chromium) sin interfaz vía DevTools Protocol, PHP 8.0.30 | E1–E6 ✅ (los 10 personajes probados: disparo de pie, agachado, arriba y salto; enemigos aleatorios correctos). Sin errores en consola. E7, E8: pendientes de prueba humana. |
| 2026-11-13 | 0.1.0 | — | **Pendiente de prueba humana:** escucha real de los sonidos (A4, B6), B15, A6, D5, D7 y dispositivos reales Android/iPhone (E2). Nota D6: en vertical el texto del aviso se ve pequeño (H-031). |
