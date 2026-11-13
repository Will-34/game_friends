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
| B1 | Jugar | Plata aparece en el mapa de prueba; HUD con vida 100/100 y "ENEMIGOS: 4" |
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
| B13 | Morir | "HAS CAÍDO"; Espacio/J/clic reinicia la partida |
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

## D. Móvil (táctil o simulación del navegador)

En Chrome/Edge: F12 → icono de dispositivo → elegir un teléfono en horizontal. También `?touch=1` en PC.

| # | Caso | Esperado |
| --- | --- | --- |
| D1 | Partida en dispositivo táctil | Joystick a la izquierda y botones FUEGO/SALTO a la derecha |
| D2 | Joystick a la derecha + FUEGO a la vez | Corre y dispara simultáneamente (multitáctil) |
| D3 | Joystick abajo / arriba | Agacharse / apuntar arriba |
| D4 | Botón II del HUD | Pausa |
| D5 | Botón 🔊 del HUD | Silencia |
| D6 | Girar a vertical | Aviso "GIRA TU DISPOSITIVO" y la partida se pausa; al volver a horizontal desaparece |
| D7 | Primer toque | El audio se desbloquea (iOS/Chrome) |

## Registro de ejecuciones

| Fecha | Versión | Entorno | Resultado |
| --- | --- | --- | --- |
| 2026-11-13 | 0.1.0 | Edge (Chromium) sin interfaz vía DevTools Protocol, 960×540, PHP 8.0.30 | A1, A2, A3 (bloqueando la URL), A4, A5 (estado interno), B1–B14, B17, C1–C4, D1–D4, D6 (viewport 400×800 táctil emulado) ✅. Sin errores en consola. |
| 2026-11-13 | 0.3.0 | Edge (Chromium) sin interfaz vía DevTools Protocol, PHP 8.0.30 | F1–F7 ✅ (las 10 habilidades activadas; granada con daño en área; "+1" y carga; habilidad enemiga). Partida automática de ~45 s sin errores en consola. F8 y la sensación de dificultad: pendientes de prueba humana. |
| 2026-11-13 | 0.2.0 | Edge (Chromium) sin interfaz vía DevTools Protocol, PHP 8.0.30 | E1–E6 ✅ (los 10 personajes probados: disparo de pie, agachado, arriba y salto; enemigos aleatorios correctos). Sin errores en consola. E7, E8: pendientes de prueba humana. |
| 2026-11-13 | 0.1.0 | — | **Pendiente de prueba humana:** escucha real de los sonidos (A4, B6), B15, A6, D5, D7 y dispositivos reales Android/iPhone (E2). Nota D6: en vertical el texto del aviso se ve pequeño (H-031). |
