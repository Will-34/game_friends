<?php
/**
 * drone-art.php — Drones temáticos de cada personaje (accesorio, no personaje), pixel art con GD.
 *
 * Cada dron se pinta a media resolución (DW×DH por cuadro, 2 cuadros: hélice abierta / cerrada)
 * y build-drones.php lo escala ×2. El diseño sale de los rasgos de la lámina de cada personaje.
 * Para un personaje sin entrada aquí, el juego usa un dron genérico.
 */
require_once __DIR__ . '/pixel-art.php';

const DW = 24;
const DH = 20;

/** Datos de juego de cada dron (nombre, color de bala y parámetros). */
function drone_designs()
{
    $base = ['durationMs' => 8000, 'fireRateMs' => 320, 'range' => 460, 'damage' => 7, 'bulletSpeed' => 560];
    $d = function ($name, $desc, $color, $over = []) use ($base) {
        return ['name' => $name, 'description' => $desc, 'bulletColor' => $color, 'cooldownMs' => 20000, 'params' => array_merge($base, $over)];
    };
    return [
        'carlos' => $d('Puro-Dron', 'Dron amarillo con gafas oscuras y su puro encendido.', '#ffd34d'),
        'domeki' => $d('Canasta Voladora', 'Su cesta de ropa con hélice: dispara desde el montón de ropa.', '#ff8fc8'),
        'henry' => $d('Dron Arcoíris', 'Dron que lleva su bandera arcoíris ondeando; dispara balas de colores.', 'rainbow', ['fireRateMs' => 300]),
        'ignacio' => $d('Olla Voladora', 'Una olla con gorro de chef y vapor.', '#ffb347'),
        'pablo' => $d('Lata Voladora', 'Su lata energética verde con hélice y cinta en la cabeza; dispara rápido.', '#7dff5a', ['fireRateMs' => 270, 'damage' => 6]),
        'plata' => $d('Dron Token', 'Dron negro de empresario tech con chip dorado de TOKEN.', '#6fe8ff'),
        'reymar' => $d('Capucha Sombra', 'Capucha morada con ojos enojados; dispara más lento pero más fuerte.', '#b06bff', ['fireRateMs' => 400, 'damage' => 10]),
        'ruddy' => $d('Dron Llorón J&J', 'Carita que llora con su banderita J&J.', '#6fb8ff'),
        'sergio' => $d('Bota Voladora', 'Su bota verde brillante con hélice; dura más.', '#39ff6a', ['durationMs' => 10000]),
        'will' => $d('Dron AFK', 'Gorra AFK, auriculares y capa roja.', '#ff5a5a'),
    ];
}

/** Hélice y mástil comunes. $f = cuadro (0 abierta, 1 cerrada). */
function drone_rotor($im, $ox, $f, $mastBottom = 4)
{
    px_rect($im, $ox + 11, 2, $ox + 12, $mastBottom, '#3a3f48');
    if ($f === 0) {
        px_rect($im, $ox + 3, 1, $ox + 20, 1, '#5b6270');
        px_dot($im, $ox + 3, 1, '#9aa3b0');
        px_dot($im, $ox + 20, 1, '#9aa3b0');
    } else {
        px_rect($im, $ox + 8, 1, $ox + 15, 1, '#5b6270');
        px_dot($im, $ox + 5, 1, '#9aa3b0', 80);
        px_dot($im, $ox + 18, 1, '#9aa3b0', 80);
    }
    px_rect($im, $ox + 10, 0, $ox + 13, 0, '#2b2f36');
}

/** Letra de 3×5 píxeles (A, F, K, J, T, &). */
function drone_glyph($im, $x, $y, $ch, $hex)
{
    $g = [
        'A' => ['.#.', '#.#', '###', '#.#', '#.#'],
        'F' => ['###', '#..', '##.', '#..', '#..'],
        'K' => ['#.#', '##.', '#..', '##.', '#.#'],
        'J' => ['..#', '..#', '..#', '#.#', '.#.'],
        'T' => ['###', '.#.', '.#.', '.#.', '.#.'],
    ];
    if (!isset($g[$ch])) return;
    foreach ($g[$ch] as $r => $row) for ($c = 0; $c < 3; $c++) if ($row[$c] === '#') px_dot($im, $x + $c, $y + $r, $hex);
}

function drone_paint($id, $im, $ox, $f)
{
    $fn = 'drone_' . $id;
    if (!function_exists($fn)) return false;
    $fn($im, $ox, $f);
    return true;
}

// ------------------------------------------------------------------ diseños

function drone_carlos($im, $o, $f)
{
    drone_rotor($im, $o, $f, 5);
    px_ell($im, $o + 12, 11, 15, 11, '#f2c230');
    px_rect($im, $o + 6, 13, $o + 18, 15, '#c99a1a');
    px_ell($im, $o + 12, 11, 15, 11, '#f2c230', 60);
    // gafas oscuras
    px_rect($im, $o + 6, 8, $o + 18, 9, '#1b1b1b');
    px_rect($im, $o + 7, 8, $o + 10, 10, '#1b1b1b');
    px_rect($im, $o + 13, 8, $o + 16, 10, '#1b1b1b');
    px_dot($im, $o + 8, 8, '#ffffff');
    px_dot($im, $o + 14, 8, '#ffffff');
    // puro con brasa y humo
    px_rect($im, $o + 17, 13, $o + 21, 13, '#8a5a32');
    px_dot($im, $o + 22, 13, '#ff6a1a');
    px_dot($im, $o + 22 + ($f ? 0 : 1), 11 - $f, '#c9c9c9');
    px_dot($im, $o + 23, 9 - $f, '#e6e6e6', 50);
    // patas
    px_line($im, $o + 8, 16, $o + 7, 18, '#5b6270');
    px_line($im, $o + 16, 16, $o + 17, 18, '#5b6270');
}

function drone_domeki($im, $o, $f)
{
    drone_rotor($im, $o, $f, 6);
    // ropa asomando
    px_ell($im, $o + 9, 8, 7, 5, '#4da6ff');
    px_ell($im, $o + 14, 7, 7, 5, '#f2f2f2');
    px_ell($im, $o + 17, 9, 5, 4, '#ffe14d');
    // cesta (trapecio) con trenzado
    px_poly($im, [$o + 4, 9, $o + 19, 9, $o + 17, 18, $o + 6, 18], '#e86aa8');
    for ($y = 11; $y <= 17; $y += 2) px_line($im, $o + 5, $y, $o + 18, $y, '#b84d86');
    for ($x = 7; $x <= 17; $x += 3) px_line($im, $o + $x, 10, $o + $x, 17, '#f59bc8');
    px_rect($im, $o + 4, 9, $o + 19, 9, '#f7b8d6');
}

function drone_henry($im, $o, $f)
{
    drone_rotor($im, $o, $f, 4);
    // cuerpo del dron con pañuelo rojo
    px_rect($im, $o + 8, 4, $o + 16, 9, '#e9edf5');
    px_rect($im, $o + 8, 9, $o + 16, 9, '#b9c0cc');
    px_rect($im, $o + 8, 7, $o + 16, 7, '#d63a3a');
    px_dot($im, $o + 15, 5, '#6fe8ff');
    // mástil y bandera arcoíris ondeando
    px_rect($im, $o + 7, 6, $o + 7, 19, '#7a5130');
    $stripes = ['#ff4d4d', '#ff9a3d', '#ffe14d', '#5ee06b', '#4da6ff', '#a66bff'];
    for ($x = 8; $x <= 21; $x++) {
        $wave = (int)round(sin(($x + $f * 3) / 2.2) * 1.2 * (($x - 7) / 14));
        foreach ($stripes as $i => $c) px_dot($im, $o + $x, 11 + $i + $wave, $c);
    }
}

function drone_ignacio($im, $o, $f)
{
    drone_rotor($im, $o, $f, 3);
    // gorro de chef
    px_ell($im, $o + 9, 6, 7, 6, '#ffffff');
    px_ell($im, $o + 14, 5, 8, 7, '#ffffff');
    px_rect($im, $o + 8, 7, $o + 16, 9, '#f2f2f2');
    px_rect($im, $o + 8, 9, $o + 16, 9, '#d9d9d9');
    // olla
    px_rect($im, $o + 5, 10, $o + 18, 17, '#9aa0a6');
    px_rect($im, $o + 5, 10, $o + 18, 10, '#d0d4d8');
    px_rect($im, $o + 5, 17, $o + 18, 17, '#6d737a');
    px_rect($im, $o + 6, 11, $o + 7, 16, '#c3c8cd');
    px_rect($im, $o + 3, 12, $o + 4, 12, '#3a3f48');
    px_rect($im, $o + 19, 12, $o + 20, 12, '#3a3f48');
    // gafas
    px_rect($im, $o + 9, 13, $o + 11, 14, '#1b1b1b');
    px_rect($im, $o + 13, 13, $o + 15, 14, '#1b1b1b');
    px_rect($im, $o + 12, 13, $o + 12, 13, '#1b1b1b');
    // vapor
    px_dot($im, $o + 19 + $f, 7, '#ffffff', 50);
    px_dot($im, $o + 20, 5 + $f, '#ffffff', 70);
}

function drone_pablo($im, $o, $f)
{
    drone_rotor($im, $o, $f, 4);
    // lata energética verde
    px_rect($im, $o + 8, 5, $o + 15, 18, '#3fbf3f');
    px_rect($im, $o + 9, 5, $o + 9, 18, '#8fe08a');
    px_rect($im, $o + 15, 5, $o + 15, 18, '#24822a');
    px_rect($im, $o + 8, 4, $o + 15, 4, '#d0d4d8');
    px_rect($im, $o + 9, 3, $o + 14, 3, '#aeb4ba');
    px_rect($im, $o + 8, 18, $o + 15, 18, '#aeb4ba');
    // cinta en la cabeza
    px_rect($im, $o + 8, 7, $o + 15, 7, '#d63a3a');
    px_dot($im, $o + 16, 7 + $f, '#d63a3a');
    px_dot($im, $o + 17, 8 - $f, '#d63a3a');
    // rayo amarillo
    foreach ([[12, 10], [11, 11], [12, 11], [11, 12], [12, 13], [11, 14], [12, 14], [11, 15]] as $p) px_dot($im, $o + $p[0], $p[1], '#ffe14d');
}

function drone_plata($im, $o, $f)
{
    drone_rotor($im, $o, $f, 6);
    px_rect($im, $o + 4, 7, $o + 19, 13, '#1d1f26');
    px_rect($im, $o + 4, 7, $o + 19, 7, '#3a3f48');
    px_rect($im, $o + 2, 9, $o + 3, 11, '#1d1f26');
    px_rect($im, $o + 20, 9, $o + 21, 11, '#1d1f26');
    // chip dorado con T
    px_rect($im, $o + 9, 8, $o + 14, 12, '#ffd34d');
    drone_glyph($im, $o + 10, 8, 'T', '#1d1f26');
    px_dot($im, $o + 18, 9, $f ? '#6fe8ff' : '#bff6ff');
    px_line($im, $o + 7, 14, $o + 6, 17, '#3a3f48');
    px_line($im, $o + 16, 14, $o + 17, 17, '#3a3f48');
}

function drone_reymar($im, $o, $f)
{
    drone_rotor($im, $o, $f, 4);
    // capucha morada
    px_ell($im, $o + 12, 11, 15, 15, '#6b3fa0');
    px_poly($im, [$o + 6, 8, $o + 12, 3, $o + 18, 8], '#6b3fa0');
    px_ell($im, $o + 12, 12, 9, 8, '#1d1426');
    // ojos enojados
    px_dot($im, $o + 10, 12, '#ff3b3b');
    px_dot($im, $o + 14, 12, '#ff3b3b');
    px_line($im, $o + 9, 10, $o + 11, 11, '#c9b7e8');
    px_line($im, $o + 15, 10, $o + 13, 11, '#c9b7e8');
    // rayas de la sudadera
    px_rect($im, $o + 6, 16, $o + 18, 16, '#c9b7e8');
    px_rect($im, $o + 7, 18, $o + 17, 18, '#c9b7e8');
    px_rect($im, $o + 6, 17, $o + 18, 17, '#6b3fa0');
}

function drone_ruddy($im, $o, $f)
{
    drone_rotor($im, $o, $f, 5);
    px_ell($im, $o + 11, 11, 13, 12, '#f2f2f2');
    px_ell($im, $o + 11, 13, 11, 8, '#e3e3e3');
    // ojos tristes y boca
    px_line($im, $o + 7, 9, $o + 9, 10, '#1b1b1b');
    px_line($im, $o + 15, 9, $o + 13, 10, '#1b1b1b');
    px_dot($im, $o + 8, 11, '#1b1b1b');
    px_dot($im, $o + 14, 11, '#1b1b1b');
    px_line($im, $o + 10, 14, $o + 12, 14, '#1b1b1b'); // boca triste (comisuras hacia abajo)
    px_dot($im, $o + 9, 15, '#1b1b1b');
    px_dot($im, $o + 13, 15, '#1b1b1b');
    // lágrimas que caen
    px_dot($im, $o + 7, 13 + $f * 2, '#4da6ff');
    px_dot($im, $o + 15, 14 + (1 - $f) * 2, '#4da6ff');
    px_dot($im, $o + 7, 18 - $f, '#4da6ff', 50);
    // banderita J&J
    px_rect($im, $o + 19, 6, $o + 19, 17, '#7a5130');
    px_rect($im, $o + 20, 6 + $f, $o + 23, 11 + $f, '#d63a3a');
    drone_glyph($im, $o + 20, 6 + $f, 'J', '#ffffff');
}

function drone_sergio($im, $o, $f)
{
    drone_rotor($im, $o, $f, 5);
    // brillo verde
    foreach ([[5, 8], [19, 10], [7, 17], [21, 15]] as $i => $p) if (($i + $f) % 2 === 0) px_dot($im, $o + $p[0], $p[1], '#b6ffc8');
    // bota verde brillante
    px_rect($im, $o + 8, 5, $o + 14, 14, '#39ff6a');
    px_rect($im, $o + 8, 13, $o + 19, 16, '#39ff6a');
    px_ell($im, $o + 18, 15, 5, 4, '#39ff6a');
    px_rect($im, $o + 9, 5, $o + 9, 15, '#b6ffc8');
    px_rect($im, $o + 14, 5, $o + 14, 12, '#1f9a40');
    px_rect($im, $o + 8, 5, $o + 14, 6, '#1f9a40');
    for ($y = 8; $y <= 12; $y += 2) px_line($im, $o + 10, $y, $o + 13, $y, '#1f9a40');
    px_rect($im, $o + 7, 17, $o + 20, 18, '#1b1b1b');
}

function drone_will($im, $o, $f)
{
    drone_rotor($im, $o, $f, 4);
    // capa roja ondeando
    for ($x = 7; $x <= 17; $x++) {
        $len = 3 + (int)round(sin(($x + $f * 3) / 1.8) + 1);
        px_rect($im, $o + $x, 15, $o + $x, 15 + $len, '#d63a3a');
    }
    // cuerpo y pantalla AFK
    px_rect($im, $o + 6, 7, $o + 17, 15, '#2b2f36');
    px_rect($im, $o + 7, 9, $o + 16, 14, '#11141a');
    drone_glyph($im, $o + 7, 9, 'A', '#ffffff');
    drone_glyph($im, $o + 10, 9, 'F', '#ffffff');
    drone_glyph($im, $o + 13, 9, 'K', '#ffffff');
    // gorra con visera
    px_rect($im, $o + 6, 4, $o + 17, 6, '#1b1b1b');
    px_rect($im, $o + 17, 6, $o + 21, 6, '#1b1b1b');
    // auriculares
    px_line($im, $o + 5, 5, $o + 5, 9, '#555b66');
    px_line($im, $o + 18, 5, $o + 18, 9, '#555b66');
    px_rect($im, $o + 3, 9, $o + 5, 13, '#d63a3a');
    px_rect($im, $o + 18, 9, $o + 20, 13, '#d63a3a');
}
