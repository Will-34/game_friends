# GDD — Rescatando a Henry

> **Aviso importante:** este documento debía reorganizar `docs/fuente/requisitos-v2.md` ("AMPLIACIÓN DE REQUISITOS — VERSIÓN 2.0"), pero **ese archivo no estaba en el proyecto** al iniciar E0/E1. Esta versión se construyó con el prompt inicial y las dos láminas de `assets-originales/`. Todo lo marcado como **[PENDIENTE: requisitos-v2]** debe completarse cuando el documento esté disponible (historia H-010).

## 1. Visión

Videojuego arcade de acción lateral 2D, estilo run-and-gun en pixel art, inspirado en los clásicos arcade pero **100 % original**. Nueve amigos pueden ser protagonistas o enemigos; al final, cuatro de ellos se vuelven aliados para rescatar a Henry de un robot gigante.

- Plataforma: navegador (PC y móvil), 960 × 540 lógicos, horizontal.
- Sesiones cortas; no se guarda progreso (cada carga empieza de nuevo).
- Tono: humor entre amigos; cada personaje tiene accesorios que lo identifican.

## 2. Personajes

Identidad (apariencia, stats, habilidad) independiente del rol. Rasgos visuales según la lámina de referencia (`assets-originales/referencia/personajes-todos.png`):

| Id | Nombre | Rasgos visuales en la lámina | Habilidad (protagonista/aliado) | Habilidad como enemigo |
| --- | --- | --- | --- | --- |
| `carlos` | Carlos | **Lámina 2026-11-13:** gafas, puro, traje amarillo, mochila con muñeca rubia. Apoyo / Estratégico | **Motivación de Equipo**: aumenta la velocidad y el daño de los aliados cercanos por un tiempo | Pendiente de definir |
| `domeki` | Domeki | Cesta de ropa a la espalda, delantal rosa. Soporte / Logística | **Reposición Express**: lanza un kit de suministros que recupera vida o munición a los aliados | Pendiente de definir |
| `ignacio` | Ignacio | Gorro de chef, gafas, espátula y cucharón. Soporte / Utilitario | **Chef de Apoyo**: refuerzo que recupera vida, otorga un escudo temporal o un bono al equipo | Pendiente de definir |
| `pablo` | Pablo | **Nuevo diseño (lámina 2026-11-13):** cinta en la cabeza, mochila de explorador, lata energética. Explorador / Asalto | **Energía Verde**: consume una lata energética que aumenta velocidad, resistencia y recuperación por un tiempo | Pendiente de definir |
| `plata` | Plata | Traje negro, mochila con logo; "empresario tech" | **ChatGPT Attack**: invoca un dron que dispara automáticamente durante 6 s | Pendiente de definir |
| `reymar` | Reymar | Sudadera rayada y capucha morada, expresión enfadada. Asesino / Infiltrador | **Sombra Veloz**: se desplaza a gran velocidad, se vuelve momentáneamente invisible y realiza un ataque sorpresa | Pendiente de definir |
| `ruddy` | Ruddy | Llorando, camiseta y bandera "J&J". Soporte / Motivador | **Inspiración J&J**: grito de motivación que recupera vida del equipo, reduce el daño por un tiempo y mejora el ánimo | Pendiente de definir |
| `sergio` | Sergio | Equipo táctico negro, mochila, botas verdes brillantes. Táctico / Soporte | **Bota Verde**: impulso de velocidad, mayor agilidad y resistencia temporal | Pendiente de definir |
| `will` | Will | Gorra "AFK", auriculares, capa roja. Operador / Ingeniero | **Modo AFK**: reduce el daño recibido y recupera energía por un corto tiempo | Pendiente de definir |
| `henry` | Henry | Capa con bandera arcoíris, pañuelo rojo. Ataque / Ofensivo | **Bandera de Poder**: despliega su bandera para aumentar velocidad y daño por un tiempo. **También jugable** (decisión 2026-11-13), además de objetivo del rescate | — |

Las habilidades provienen de las láminas de cada personaje en `assets-originales/`.

### Selección de protagonista (E3)

Menú → JUGAR → **Elige tu protagonista** → partida. Se puede elegir cualquiera de los 10 (Henry incluido). Los enemigos del nivel se eligen al azar entre los demás; nunca el protagonista ni Henry.

- Cada personaje tiene su lámina completa en `assets-originales/<id>/` (11 animaciones). Ninguna incluye disparo hacia arriba (provisional).
- **Habilidades de enemigos: pendientes de definir** (decisión de diseño abierta, historia H-040).

## 3. Roles

| Rol | Descripción |
| --- | --- |
| `PLAYER` | Protagonista elegido por el jugador |
| `ENEMY` | Cualquier amigo que no sea el protagonista puede aparecer como enemigo |
| `ALLY` | En el final, 4 personajes se vuelven aliados controlados por IA |
| `RESCUE_TARGET` | Henry, a quien hay que rescatar |

[PENDIENTE: requisitos-v2] Reglas exactas de qué personajes son enemigos/aliados en cada nivel y cómo se eligen los 4 aliados.

> E1 usa a Plata también como enemigo provisional (con tinte rojizo) para validar que identidad y rol son independientes.

## 4. Controles

| Acción | Teclado | Táctil |
| --- | --- | --- |
| Mover | ← → / A D | Joystick izquierdo |
| Agacharse | ↓ / S | Joystick abajo |
| Apuntar arriba | ↑ / W | Joystick arriba |
| Saltar | Espacio / K | Botón SALTO |
| Disparar | J | Botón FUEGO |
| Granada | U | (E2) |
| Habilidad especial | L | (E2) |
| Cambiar arma | Q | (E2) |
| Pausa | Esc / P | Botón II |

## 5. Combate

- Disparo horizontal (de pie y agachado) y hacia arriba.
- Armas, granadas y habilidades especiales: E4. [PENDIENTE: requisitos-v2] lista de armas y munición.
- Enemigos aleatorios con `DifficultyManager` (E4).

## 6. Niveles y mapas

- **Selección de mapa: pendiente de definir** (pantalla nueva, historia H-050).
- 3 niveles con parallax, obstáculos y progresión de dificultad (E5). [PENDIENTE: requisitos-v2] temática de cada nivel.
- E1 incluye un mapa de prueba ("Zona de pruebas") con gráficos provisionales.

## 7. Jefe final

- **Robot Guardián** con 3 fases (E6). [PENDIENTE: requisitos-v2] ataques por fase y puntos débiles.
- 4 aliados con máquina de estados ayudan en el combate final.
- Al derrotarlo: rescate de Henry y pantalla de victoria.

## 8. Audio

- Música por escena y efectos (disparo, salto, golpe, explosión, muerte).
- Solo audio con licencia CC0 o CC-BY (ver `docs/AUDIO.md`). Nada de audio de juegos comerciales.

## 9. Rendimiento y compatibilidad

- 60 FPS objetivo en móviles de gama media.
- Object pooling para proyectiles; pocos objetos por pantalla.
- Chrome, Edge, Firefox, Safari, Android, iPhone/iPad. Aviso "gira tu dispositivo" en vertical.
- [PENDIENTE: requisitos-v2] límites concretos (tamaño de descarga, dispositivos mínimos).
