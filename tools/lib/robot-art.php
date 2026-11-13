<?php
/**
 * robot-art.php — Robots enemigos (no son personajes de las láminas): Robot Guardián y mini-robot.
 * Pixel art con GD a media resolución; build-robots.php los escala ×2 y escribe su character.json.
 * Todos miran a la derecha (el juego los voltea).
 */
require_once __DIR__ . '/pixel-art.php';

const RG_W = 80;   // Robot Guardián: cuadro a media resolución (160×176 finales)
const RG_H = 88;
const MR_W = 28;   // Mini-robot (56×60 finales)
const MR_H = 30;

$GLOBALS['RB'] = [
    'steel' => '#5b6676', 'steelD' => '#3d4552', 'steelL' => '#8a96a8', 'dark' => '#262b33',
    'yellow' => '#ffcf4d', 'black' => '#1b1b1b', 'red' => '#ff3b3b', 'redL' => '#ff8a8a', 'redD' => '#a01e1e',
];

/** Franja de peligro amarilla y negra. */
function rb_hazard($im, $x1, $y1, $x2, $y2)
{
    global $RB;
    for ($y = $y1; $y <= $y2; $y++) for ($x = $x1; $x <= $x2; $x++) px_dot($im, $x, $y, (($x + $y) % 6 < 3) ? $RB['yellow'] : $RB['black']);
}

/**
 * Un cuadro del Robot Guardián.
 * $p: bob (desplazamiento vertical), liftL, liftR (pierna levantada), chest ('closed'|'open'), pods ('closed'|'open'),
 *     hurt (chispas), visorOff, smoke, legsTop (compresión de piernas al caer).
 */
function rg_frame($im, $ox, array $p)
{
    global $RB;
    $p += ['bob' => 0, 'liftL' => 0, 'liftR' => 0, 'chest' => 'closed', 'pods' => 'closed', 'hurt' => false, 'visorOff' => false, 'smoke' => 0, 'legsTop' => 60];
    $b = $p['bob'];
    $X = function ($x) use ($ox) { return $ox + $x; };

    // Brazo trasero (garra)
    px_rect($im, $X(10), 32 + $b, $X(17), 54 + $b, $RB['steelD']);
    px_rect($im, $X(9), 30 + $b, $X(18), 33 + $b, $RB['steel']);
    foreach ([10, 13, 16] as $fx) px_rect($im, $X($fx), 55 + $b, $X($fx + 1), 60 + $b, $RB['dark']);

    // Piernas (pistones)
    foreach ([[26, $p['liftL'], $RB['steelD']], [44, $p['liftR'], $RB['steel']]] as $leg) {
        list($lx, $lift, $col) = $leg;
        $top = $p['legsTop'];
        $bottom = 82 - $lift;
        px_rect($im, $X($lx), $top, $X($lx + 9), min($bottom, $top + 10), $RB['steelD']);
        px_ell($im, $X($lx + 4.5), $top + 11, 9, 7, $RB['steelL']);
        if ($bottom > $top + 12) px_rect($im, $X($lx + 1), $top + 12, $X($lx + 8), $bottom, $col);
        px_rect($im, $X($lx + 3), $top + 13, $X($lx + 4), $bottom - 2, $RB['steelL']);
        px_rect($im, $X($lx - 4), $bottom, $X($lx + 13), $bottom + 5, $RB['dark']);
        px_rect($im, $X($lx + 9), $bottom + 1, $X($lx + 13), $bottom + 2, $RB['yellow']);
    }

    // Cadera
    px_rect($im, $X(24), 56 + $b, $X(56), 63 + $b, $RB['dark']);
    // Torso
    px_poly($im, [$X(16), 24 + $b, $X(64), 24 + $b, $X(60), 58 + $b, $X(20), 58 + $b], $RB['steel']);
    px_poly($im, [$X(52), 24 + $b, $X(64), 24 + $b, $X(60), 58 + $b, $X(50), 58 + $b], $RB['steelD']);
    px_rect($im, $X(18), 22 + $b, $X(62), 25 + $b, $RB['steelL']);
    px_rect($im, $X(17), 26 + $b, $X(18), 50 + $b, $RB['steelL']);
    foreach ([[22, 28], [56, 28], [22, 48], [56, 48]] as $r) px_dot($im, $X($r[0]), $r[1] + $b, $RB['dark']);
    rb_hazard($im, $X(21), 51 + $b, $X(59), 55 + $b);

    // Núcleo del pecho (punto débil)
    px_ell($im, $X(40), 38 + $b, 18, 18, $RB['dark']);
    if ($p['chest'] === 'open') {
        px_ell($im, $X(40), 38 + $b, 15, 15, '#ff9a1f');
        px_ell($im, $X(40), 38 + $b, 11, 11, $RB['yellow']);
        px_ell($im, $X(40), 38 + $b, 6, 6, '#fff3c0');
        px_rect($im, $X(30), 37 + $b, $X(31), 39 + $b, $RB['steelD']);
        px_rect($im, $X(49), 37 + $b, $X(50), 39 + $b, $RB['steelD']);
        foreach ([[40, 27], [40, 49], [29, 38], [51, 38]] as $r) px_dot($im, $X($r[0]), $r[1] + $b, '#fff3c0');
    } else {
        px_rect($im, $X(33), 31 + $b, $X(47), 45 + $b, $RB['steelD']);
        px_rect($im, $X(40), 31 + $b, $X(40), 45 + $b, $RB['dark']);
        px_ell($im, $X(40), 38 + $b, 4, 4, $RB['red']);
    }

    // Lanzamisiles en los hombros
    foreach ([[6, $RB['steelD']], [62, $RB['steel']]] as $pod) {
        list($px, $col) = $pod;
        px_rect($im, $X($px), 18 + $b, $X($px + 12), 32 + $b, $col);
        px_rect($im, $X($px), 18 + $b, $X($px + 12), 19 + $b, $RB['steelL']);
        foreach ([[2, 22], [7, 22], [2, 27], [7, 27]] as $h) {
            px_rect($im, $X($px + $h[0]), $h[1] + $b, $X($px + $h[0] + 2), $h[1] + 2 + $b, $RB['black']);
            if ($p['pods'] === 'open' && $h[1] === 22) {
                px_rect($im, $X($px + $h[0]), 14 + $b, $X($px + $h[0] + 2), 21 + $b, '#d9d9d9');
                px_rect($im, $X($px + $h[0]), 13 + $b, $X($px + $h[0] + 2), 14 + $b, $RB['red']);
            }
        }
    }

    // Cabeza con visor rojo
    px_rect($im, $X(31), 8 + $b, $X(49), 22 + $b, $RB['steel']);
    px_rect($im, $X(45), 8 + $b, $X(49), 22 + $b, $RB['steelD']);
    px_rect($im, $X(31), 8 + $b, $X(49), 9 + $b, $RB['steelL']);
    if ($p['visorOff']) {
        px_rect($im, $X(33), 13 + $b, $X(47), 16 + $b, '#3a1010');
    } else {
        px_rect($im, $X(33), 13 + $b, $X(47), 16 + $b, $RB['red']);
        px_rect($im, $X(33), 13 + $b, $X(47), 13 + $b, $RB['redL']);
        px_rect($im, $X(42), 14 + $b, $X(45), 15 + $b, '#ffffff');
    }
    for ($gx = 34; $gx <= 46; $gx += 3) px_rect($im, $X($gx), 18 + $b, $X($gx + 1), 20 + $b, $RB['dark']);
    px_rect($im, $X(40), 2 + $b, $X(40), 8 + $b, $RB['dark']);
    px_ell($im, $X(40), 2 + $b, 3, 3, $p['visorOff'] ? '#3a1010' : $RB['red']);

    // Brazo cañón delantero
    px_ell($im, $X(62), 38 + $b, 11, 11, $RB['steel']);
    px_rect($im, $X(58), 36 + $b, $X(76), 46 + $b, $RB['dark']);
    px_rect($im, $X(58), 36 + $b, $X(76), 37 + $b, '#4a505a');
    px_rect($im, $X(76), 38 + $b, $X(79), 44 + $b, $RB['steelL']);
    px_rect($im, $X(69), 36 + $b, $X(70), 46 + $b, $RB['yellow']);

    if ($p['hurt']) {
        foreach ([[30, 30], [50, 44], [24, 40], [60, 28], [44, 20]] as $s) {
            px_dot($im, $X($s[0]), $s[1] + $b, '#ffffff');
            px_dot($im, $X($s[0] + 1), $s[1] + $b - 1, $RB['yellow']);
        }
    }
    for ($i = 0; $i < $p['smoke']; $i++) {
        px_ell($im, $X(30 + $i * 9), 6 + $b - $i * 2, 10, 8, '#6d6d6d', 40);
        px_ell($im, $X(34 + $i * 9), 3 + $b - $i * 2, 7, 6, '#9a9a9a', 50);
    }
}

/** Chatarra final (último cuadro de muerte). */
function rg_wreck($im, $ox)
{
    global $RB;
    $X = function ($x) use ($ox) { return $ox + $x; };
    px_poly($im, [$X(10), 87, $X(70), 87, $X(62), 66, $X(18), 70], $RB['steelD']);
    px_poly($im, [$X(18), 70, $X(46), 62, $X(62), 66, $X(40), 74], $RB['steel']);
    rb_hazard($im, $X(24), 76, $X(54), 79);
    px_rect($im, $X(52), 70, $X(70), 76, $RB['dark']);
    px_rect($im, $X(6), 78, $X(20), 86, $RB['steel']);
    px_rect($im, $X(9), 81, $X(17), 82, '#3a1010');
    foreach ([[30, 60], [44, 56], [38, 52]] as $i => $f) {
        px_ell($im, $X($f[0]), $f[1], 8, 10, '#ff6a1a');
        px_ell($im, $X($f[0]), $f[1] + 2, 4, 5, $RB['yellow']);
    }
    px_ell($im, $X(36), 42, 18, 12, '#5a5a5a', 50);
    px_ell($im, $X(44), 34, 14, 10, '#8a8a8a', 70);
}

/** Lista de cuadros del Robot Guardián (índice → función de pintado). */
function rg_frames()
{
    return [
        ['bob' => 0], ['bob' => 1],                                      // 0-1 idle
        ['liftL' => 4, 'bob' => 1], ['bob' => 0], ['liftR' => 4, 'bob' => 1], ['bob' => 0], // 2-5 caminar
        ['bob' => 0], ['bob' => 1],                                      // 6-7 disparo
        ['hurt' => true, 'bob' => 1],                                    // 8 daño
        ['chest' => 'open'], ['chest' => 'open', 'bob' => 1],            // 9-10 pecho abierto
        ['pods' => 'open'],                                              // 11 misiles
        ['visorOff' => true, 'smoke' => 2, 'hurt' => true],              // 12 muerte
        ['visorOff' => true, 'smoke' => 3, 'bob' => 12, 'legsTop' => 70], // 13 muerte
        'wreck',                                                         // 14 chatarra
    ];
}

// ------------------------------------------------------------------ mini-robot

function mr_frame($im, $ox, array $p)
{
    global $RB;
    $p += ['liftL' => 0, 'liftR' => 0, 'hurt' => false, 'dead' => 0, 'fire' => false];
    $X = function ($x) use ($ox) { return $ox + $x; };
    if ($p['dead'] === 2) {
        px_rect($im, $X(4), 24, $X(24), 29, $RB['steelD']);
        px_ell($im, $X(12), 24, 12, 8, $RB['steel']);
        px_dot($im, $X(14), 23, '#3a1010');
        px_ell($im, $X(14), 18, 8, 6, '#7a7a7a', 60);
        return;
    }
    // Patas
    foreach ([[9, $p['liftL']], [16, $p['liftR']]] as $l) {
        px_rect($im, $X($l[0]), 21, $X($l[0] + 3), 27 - $l[1], $RB['steelD']);
        px_rect($im, $X($l[0] - 1), 27 - $l[1], $X($l[0] + 4), 29 - $l[1], $RB['dark']);
    }
    // Cuerpo redondo
    px_ell($im, $X(14), 13, 18, 18, $RB['steel']);
    px_ell($im, $X(17), 15, 10, 12, $RB['steelD']);
    px_ell($im, $X(11), 9, 6, 4, $RB['steelL']);
    rb_hazard($im, $X(7), 19, $X(21), 20);
    // Ojo
    px_ell($im, $X(17), 11, 7, 7, $RB['dark']);
    px_ell($im, $X(17), 11, 4, 4, $p['dead'] ? '#3a1010' : $RB['red']);
    if (!$p['dead']) px_dot($im, $X(18), 10, '#ffffff');
    // Antena
    px_rect($im, $X(13), 1, $X(13), 4, $RB['dark']);
    px_dot($im, $X(13), 1, $RB['red']);
    // Brazo arma
    px_rect($im, $X(20), 14, $X(26), 17, $RB['dark']);
    px_rect($im, $X(26), 15, $X(27), 16, $RB['steelL']);
    if ($p['fire']) px_dot($im, $X(27), 15, $RB['yellow']);
    if ($p['hurt'] || $p['dead'] === 1) {
        px_dot($im, $X(8), 8, '#ffffff');
        px_dot($im, $X(20), 6, $RB['yellow']);
        px_dot($im, $X(10), 18, '#ffffff');
    }
}

function mr_frames()
{
    return [
        [], ['liftL' => 1, 'liftR' => 1],                                       // 0-1 idle
        ['liftL' => 2], [], ['liftR' => 2], [],                                 // 2-5 correr
        ['fire' => true], [],                                                   // 6-7 disparo
        ['hurt' => true],                                                       // 8 daño
        ['dead' => 1], ['dead' => 2],                                           // 9-10 muerte
    ];
}

/** Dron del Robot Guardián: esfera con visor rojo (2 cuadros de 24×20). */
function rg_drone($im, $ox, $f)
{
    global $RB;
    px_rect($im, $ox + 11, 2, $ox + 12, 5, $RB['dark']);
    if ($f === 0) px_rect($im, $ox + 3, 1, $ox + 20, 1, '#5b6270');
    else px_rect($im, $ox + 8, 1, $ox + 15, 1, '#5b6270');
    px_ell($im, $ox + 12, 12, 16, 14, $RB['steel']);
    px_ell($im, $ox + 14, 13, 10, 10, $RB['steelD']);
    px_rect($im, $ox + 6, 10, $ox + 18, 12, $RB['red']);
    px_rect($im, $ox + 6, 10, $ox + 18, 10, $RB['redL']);
    rb_hazard($im, $ox + 7, 16, $ox + 17, 17);
}
