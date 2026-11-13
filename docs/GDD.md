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
| `ALLY` | 2 aliados al azar en cada combate contra un jefe (E5); en el final, 4 (E6) |
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
| Cambiar arma | Q | Botón ARMA |
| Dron | E | Botón DRON |
| Pausa | Esc / P | Botón II |

## 5. Combate

- Disparo horizontal (de pie y agachado) y hacia arriba.
- **Granadas** (U): 5 al empezar; daño en área. Los enemigos difíciles también las lanzan.
- **Dron** (E / botón DRON): **todos** los personajes lanzan su propio dron, que los sigue y dispara solo al enemigo más cercano durante ~8 s. Listo al empezar; recarga de 20 s. Cada dron va acorde a su personaje (`character.json → drone`, sprite generado con `tools/build-drones.php`):
  | Personaje | Dron | Detalle |
  | --- | --- | --- |
  | Carlos | Puro-Dron | Amarillo con gafas oscuras y puro |
  | Domeki | Canasta Voladora | Su cesta de ropa con hélice |
  | Henry | Dron Arcoíris | Lleva su bandera arcoíris; balas de colores |
  | Ignacio | Olla Voladora | Olla con gorro de chef y vapor |
  | Pablo | Lata Voladora | Su lata energética verde con cinta; dispara más rápido |
  | Plata | Dron Token | Negro con chip dorado (además de su habilidad ChatGPT Attack) |
  | Reymar | Capucha Sombra | Capucha morada con ojos enojados; más lento y fuerte |
  | Ruddy | Dron Llorón J&J | Carita que llora con banderita J&J |
  | Sergio | Bota Voladora | Su bota verde brillante; dura más |
  | Will | Dron AFK | Gorra AFK, auriculares y capa roja |
  Los aliados y el jefe también lanzan su dron; los enemigos comunes no.
- **Habilidad especial** (L): se carga con **2 bajas**. Cada personaje tiene la suya (tabla de la sección 2):
  | Personaje | Efecto en el juego |
  | --- | --- |
  | Plata | Dron que dispara solo al enemigo más cercano durante 6 s |
  | Carlos | +25 % velocidad, +50 % daño durante 8 s |
  | Domeki | +40 de vida y +3 granadas |
  | Henry | +35 % velocidad, +60 % daño durante 8 s (aura arcoíris) |
  | Ignacio | +30 de vida y escudo (sin daño) durante 6 s |
  | Pablo | +30 % velocidad, mitad de daño recibido y regeneración durante 7 s |
  | Reymar | Embestida casi invisible e invulnerable que daña a quien atraviesa |
  | Ruddy | +25 de vida y mitad de daño recibido durante 8 s |
  | Sergio | +60 % velocidad, +20 % salto, menos daño recibido durante 6 s |
  | Will | 70 % menos daño y regeneración durante 6 s |
- **Bajas**: al eliminar a un enemigo aparece "+1" con el símbolo del personaje (Will "AFK", Ignacio 🎂, Carlos 👩, Reymar 😠, Pablo lata verde, Henry 🧔, Sergio bota verde, Plata "TOKEN", Ruddy 😭, Domeki 🧹).
- **Enemigos**: aparecen en grupos de 2-3, cada uno con dificultad aleatoria (Fácil verde, Normal amarillo, Difícil rojo). Al acertarte hacen su gesto (su símbolo). Usan su habilidad de vez en cuando, **nunca dos a la vez**.
- Todos los personajes muestran su nombre encima; los enemigos, también una mini barra de vida.
- **Armas** (Q / botón ARMA para cambiar):
  | Arma | Munición | Características |
  | --- | --- | --- |
  | Pistola | Infinita | Usa los stats de cada personaje |
  | Metralleta | 150 | Muy rápida, poco daño, algo de dispersión |
  | Láser | 60 | Rayo muy rápido de largo alcance; atraviesa enemigos |
  | Rifle de Plasma | 30 | Disparo lento, mucho daño, largo alcance |
  Solo armas de **largo alcance** (decisión del usuario: sin escopeta ni lanzallamas).
  Al agotar la munición se vuelve a la pistola. Valores en `content/config/weapons.json`.
- **Objetos**: los enemigos sueltan a veces (40 %) una caja de arma, vida (+30) o granadas (+3).
- **IA**: los enemigos patrullan, reaccionan al verte (más rápido cuanto más difíciles), te persiguen sin abandonar su zona, saltan y te disparan hacia arriba si estás encima.
- Al terminar (victoria o derrota) se muestra el resumen: personaje, bajas y tiempo.

## 6. Niveles y mapas (E5)

Ambientados en **Santa Cruz de la Sierra (Bolivia)**, con jerga cruceña ("¡Qué macana!", "chango", "¡Ahijuna!", "pues", voseo).

Flujo: Menú → protagonista → **mapa** → **historia** (texto del nivel) → partida. Al vencer al jefe: "¡FUERZA CAMBA!" y se sigue al siguiente nivel.

| # | Nivel | Ambiente | Peligros y obstáculos | Jefe |
| --- | --- | --- | --- | --- |
| 1 | **Casco Viejo** (Plaza 24 de Septiembre) | Día: Catedral, casas coloniales con galerías, toborochis, palmeras | Charcos de lluvia (lento), parrillas (daño), toldos de puestos (rebote) | El Capo de la Plaza |
| 2 | **Ciudad Universitaria UAGRM** | Cielo azul: módulos de facultad, letrero UAGRM, laguna, palmeras | Laguna (daño), barro (lento), toldos de la feria azul y rojo (rebote) | El Inge del Cero |
| 3 | **Lomas de Arena** | Atardecer: dunas rosadas, monte, árboles secos | Curichis (daño), arena movediza (lento), llantas (rebote) | El Rey de las Dunas |
| 4 | **Base del Robot Guardián** (Parque Industrial) | Noche: fábricas iluminadas, grúa, chimeneas | Piso electrificado (daño), aceite (lento), resortes (rebote) | **Robot Guardián** (final) |

- **Progresión:** más enemigos y más difíciles en cada nivel (Fácil/Normal/Difícil 60/30/10 → 40/40/20 → 25/40/35); vida del jefe ×8 → ×11 → ×14.
- **Colores de nombre:** protagonista y aliados en **verde**, enemigos en **rojo** (dificultad con estrellas: Normal ★, Difícil ★★), jefe en **lila**, Henry capturado en amarillo.
- **Henry capturado:** en cada nivel el jefe lleva a **Henry enjaulado sobre los hombros**, pidiendo ayuda. Al vencer al jefe, la jaula se rompe, Henry salta al suelo feliz, celebra y agradece. El robot se lo vuelve a llevar al siguiente nivel (rescate definitivo en E6). Si juegas con Henry, no aparece capturado.
- **Arena del jefe:** no hace falta eliminar a todos: se puede **esquivar** a los enemigos (no hay choque entre personajes) y llegar al jefe. Al llegar al centro de la arena: cámara fija, la arena se cierra por la izquierda, el jefe cae con su frase y llegan sus escoltas. Los enemigos que quedaron atrás no entran y caen al vencer al jefe.
- **Jefe:** un amigo "hackeado" al azar, más grande (×1,5), nombre en lila, con barra de vida propia y **su propio dron**. **Fase 2** (≤ 50 % de vida): se enfurece ("¡… SE PICÓ!"), dispara más, usa su habilidad y llegan refuerzos. Al caer, las escoltas se desconectan.
- **Aliados:** en el combate del jefe llegan **2 aliados al azar** (nunca el protagonista, Henry ni el jefe). Siguen al protagonista y atacan al enemigo más cercano. Si caen, **vuelven a los 5-10 s, como máximo 2 veces cada uno**. El HUD muestra su estado.
- **Reintento:** si caes en la arena, puedes reintentar **desde el jefe**.
- Arte (fondos de 4 capas parallax y tilesets) **generado por código** con `tools/build-level.php`; se podrá reemplazar por imágenes propias sin tocar código (H-070).
- La "Zona de pruebas" solo aparece en modo desarrollo.

## 7. Jefe final (E6)

- **Robot Guardián**: robot gigante generado por código (`content/bosses/robot-guardian/`), 2700 de vida, con blindaje.
  | Fase | Vida | Ataques |
  | --- | --- | --- |
  | 1 | > 66 % | Cañón y **misiles** en arco desde los hombros |
  | 2 | 33-66 % | + **barrido láser** con aviso (bajo: ¡saltá!; alto: ¡agachate!), **Dron Centinela**, mini-robots |
  | 3 | < 33 % | + **ondas de choque** por el suelo (¡saltá!), más mini-robots, más agresivo |
  **Punto débil:** cada cierto tiempo abre el pecho (núcleo naranja), se queda quieto y recibe mucho más daño.
- **4 aliados** al azar en el combate final (vuelven a los 5-10 s, máximo 2 veces).
- **Henry en una cápsula de vidrio** sobre el robot; al vencerlo se rompe y Henry sale feliz.
- **Final:** "¡HENRY RESCATADO!" → escena en la plaza con los 10 amigos celebrando, confeti y créditos.
- **Mini-robots:** todos los jefes (también los de los niveles 1-3) invocan mini-robots cada cierto tiempo y al enfurecerse.

## 8. Audio

- Música por escena y efectos (disparo, salto, golpe, explosión, muerte).
- Solo audio con licencia CC0 o CC-BY (ver `docs/AUDIO.md`). Nada de audio de juegos comerciales.

## 9. Rendimiento y compatibilidad

- 60 FPS objetivo en móviles de gama media.
- Object pooling para proyectiles; pocos objetos por pantalla.
- Chrome, Edge, Firefox, Safari, Android, iPhone/iPad. Aviso "gira tu dispositivo" en vertical.
- [PENDIENTE: requisitos-v2] límites concretos (tamaño de descarga, dispositivos mínimos).
