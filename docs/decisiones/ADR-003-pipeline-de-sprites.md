# ADR-003 — Pipeline de sprites con PHP CLI + GD y celdas de 144 × 104

- **Estado:** Aceptada
- **Fecha:** 2026-11-13

## Contexto

Las láminas de personajes son **ilustrativas**, no spritesheets técnicos: tienen letreros, retrato, recuadro de especificaciones, efectos y cuadros de distinto tamaño. La de Plata (1536 × 1024) tiene canal alfa: el fondo es casi transparente (alfa GD 103–125 de 127) y los personajes y letreros son opacos.

En la máquina de desarrollo hay PHP 8.0 con GD (XAMPP) y no hay Python. PHP está garantizado en el proyecto.

## Decisión

- Herramienta `tools/sprite-cutter.php` (PHP CLI + GD), con los parámetros de cada personaje en `tools/config/<id>.json` (nunca en el código).
- Algoritmo: máscara de opacidad → componentes conectados → por cada animación se toman las manchas grandes cuyo centro cae en su `region`, ordenadas por X; los detalles pequeños (chispas, fogonazos) se adjuntan opcionalmente. Cada cuadro se ancla por el **centro de masa de los pies** (o por el recuadro, en poses tumbadas) y se pega en una celda fija con 2 px de margen inferior. Los píxeles aceptados pasan a opacos (bordes nítidos).
- **Celda de 144 × 104** y **escala 1.0** en lugar del ejemplo 96 × 96 del prompt: a escala 1.0 los cuadros miden hasta 109 × 94 px; reescalar a 96 × 96 desenfocaría el pixel art y con 128 de ancho se recortaban los fogonazos de `crouch_fire`. 144 × 104 no recorta ningún cuadro.
- Animaciones que no existen en la lámina se generan como **provisionales** (`placeholderFrom`) y quedan marcadas `placeholder: true` con una `note`.
- La herramienta solo actualiza los campos técnicos de `character.json` (`spritesheet`, `frameWidth`, `frameHeight`, `animations`, `effects`); los datos de diseño (stats, cuerpo, habilidad) se editan a mano y se conservan.
- Informes y vistas de depuración van a `tools/output/` (ignorado por git, no se publica).

- **Actualización (0.1.1):** las láminas pueden dibujar cada fila a distinta escala. Cada animación admite `scale` propia; se iguala la altura de pie a la fila más pequeña reduciendo (nunca ampliando, para no emborronar). Revisar siempre las alturas con `--debug` al incorporar un personaje.

## Consecuencias

- Un personaje nuevo con una lámina parecida solo necesita su JSON de configuración.
- Efectos semitransparentes (brillos como el anillo verde de Plata) no se extraen bien con umbral de alfa; requerirán otra técnica o arte dedicado (E4/E7).
- Tras igualar escalas, Plata mide ~77 px de alto de pie en una pantalla de 540 px, proporción adecuada para el género.
