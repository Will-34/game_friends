<?php
/**
 * level-themes.php — Arte generado de cada tema de nivel (fondos parallax y tileset).
 *
 * Cada tema define 5 pintores: sky, far, mid, near (fondos a media resolución LW×LH)
 * y tiles (8 tiles de 16×16 a media resolución). build-level.php los escala ×2.
 * Los temas viven SOLO en esta herramienta: el juego lee los PNG y el map.json resultantes.
 *
 * Tiles (en orden, gid = índice + 1):
 *   0 superficie · 1 relleno · 2 plataforma (oneWay) · 3 caja · 4 peligro (hazard)
 *   5 rebote (oneWay + bounce) · 6 terreno lento (slow) · 7 relleno bajo el peligro
 */
require_once __DIR__ . '/pixel-art.php';
require_once __DIR__ . '/level-theme-base.php';

const LW = 800;   // ancho a media resolución (1600 px finales)
const LH = 270;   // alto a media resolución (540 px finales)
const LG = 226;   // línea del suelo en pantalla (≈ fila 14 de tiles) a media resolución
const T = 16;     // tile a media resolución (32 px finales)

/** Devuelve los pintores de un tema. */
function theme_painters($theme)
{
    $map = [
        'casco-viejo' => 'cv_',
        'uagrm' => 'ua_',
        'lomas' => 'lo_',
        'base' => 'bs_',
    ];
    if (!isset($map[$theme])) throw new RuntimeException("Tema desconocido: $theme");
    $p = $map[$theme];
    return [
        'sky' => $p . 'sky', 'far' => $p . 'far', 'mid' => $p . 'mid', 'near' => $p . 'near', 'tiles' => $p . 'tiles',
    ];
}

// ======================================================================== comunes

$GLOBALS['PALM'] = ['trunk' => '#9a7a52', 'trunkDark' => '#6e5536', 'leaf' => '#3f9a3a', 'leafDark' => '#23682a', 'nut' => '#5a3d1e'];
$GLOBALS['TREE'] = ['trunk' => '#6b4a2e', 'trunkDark' => '#4a321e', 'dark' => '#1f5a2a', 'mid' => '#2f7d32', 'light' => '#5fae4a'];
$GLOBALS['TOBO'] = ['trunk' => '#9fb07a', 'trunkDark' => '#7d8c5c', 'dark' => '#b8457f', 'mid' => '#e3679f', 'light' => '#f7a8cb'];

/** Caja de madera genérica (tile 3). */
function tile_crate($im, $ox, $c = ['#a46a36', '#7a4a22', '#c88a4c'])
{
    px_rect($im, $ox, 0, $ox + T - 1, T - 1, $c[0]);
    px_rect($im, $ox, 0, $ox + T - 1, 0, $c[2]);
    px_rect($im, $ox, 0, $ox, T - 1, $c[2]);
    imagerectangle($im, $ox, 0, $ox + T - 1, T - 1, px_c($im, $c[1]));
    imagerectangle($im, $ox + 2, 2, $ox + T - 3, T - 3, px_c($im, $c[1]));
    px_line($im, $ox + 2, 2, $ox + T - 3, T - 3, $c[1]);
    px_dot($im, $ox + 1, 1, '#d9d9d9');
    px_dot($im, $ox + T - 2, 1, '#d9d9d9');
    px_dot($im, $ox + 1, T - 2, '#d9d9d9');
    px_dot($im, $ox + T - 2, T - 2, '#d9d9d9');
}

/** Toldo a rayas (tile de rebote): parte superior con borde festoneado. */
function tile_awning($im, $ox, $a, $b)
{
    for ($x = 0; $x < T; $x++) {
        $col = ((int)($x / 4)) % 2 ? $b : $a;
        px_rect($im, $ox + $x, 1, $ox + $x, 6, $col);
        $scallop = ($x % 4 === 1 || $x % 4 === 2) ? 8 : 7;
        px_rect($im, $ox + $x, 7, $ox + $x, $scallop, $col);
    }
    px_rect($im, $ox, 0, $ox + T - 1, 0, '#3b2a20');
    px_rect($im, $ox, 3, $ox + T - 1, 3, '#ffffff', 100);
    px_rect($im, $ox, 9, $ox + T - 1, 9, '#000000', 90);
}

/** Ladrillo/tierra con textura. */
function tile_texture($im, $ox, $base, $spots, $seed, $density = 14)
{
    mt_srand($seed);
    px_rect($im, $ox, 0, $ox + T - 1, T - 1, $base);
    for ($i = 0; $i < $density; $i++) px_dot($im, $ox + mt_rand(0, T - 1), mt_rand(0, T - 1), $spots[mt_rand(0, count($spots) - 1)]);
}

/** Puntos sueltos sobre un tile ya pintado (parte inferior). */
function tile_texture_dots($im, $ox, $spots, $seed)
{
    mt_srand($seed);
    for ($i = 0; $i < 10; $i++) px_dot($im, $ox + mt_rand(0, T - 1), mt_rand(10, T - 1), $spots[mt_rand(0, count($spots) - 1)]);
}

/** Agua (laguna, curichi, charco): superficie con brillos. */
function tile_water($im, $ox, $deep, $mid, $hi, $top = 2)
{
    px_rect($im, $ox, $top, $ox + T - 1, T - 1, $deep);
    px_rect($im, $ox, $top, $ox + T - 1, $top + 3, $mid);
    px_rect($im, $ox, $top, $ox + T - 1, $top, $hi);
    px_line($im, $ox + 2, $top + 6, $ox + 6, $top + 6, $mid);
    px_line($im, $ox + 9, $top + 10, $ox + 13, $top + 10, $mid);
    px_dot($im, $ox + 4, $top + 2, '#ffffff');
    px_dot($im, $ox + 12, $top + 1, '#ffffff');
}

// ======================================================================== CASCO VIEJO

function cv_sky($im)
{
    px_gradient($im, 0, 0, LW - 1, LH - 1, [[0, '#2f7fd8'], [0.45, '#5aa6ea'], [0.8, '#a6d6f5'], [1, '#d8eefa']]);
    $cloud = ['#ffffff', '#eef4fb', '#c9daee'];
    px_cloud($im, LW, 110, 60, 120, $cloud, 1);
    px_cloud($im, LW, 330, 35, 70, $cloud, 2);
    px_cloud($im, LW, 520, 80, 150, $cloud, 3);
    px_cloud($im, LW, 720, 45, 90, $cloud, 4);
    // Sol
    px_ell($im, 640, 40, 26, 26, '#fff6c8');
    px_ell($im, 640, 40, 20, 20, '#ffffff');
}

function cv_far($im)
{
    // Edificios modernos lejanos (Equipetrol, el centro) en azul brumoso
    mt_srand(21);
    $x = 0;
    while ($x < LW) {
        $w = mt_rand(16, 34);
        $h = mt_rand(30, 95);
        $tall = mt_rand(0, 5) === 0;
        if ($tall) $h += 40;
        $col = px_mix('#8fb3d6', '#b9d3ea', mt_rand(0, 100) / 100);
        px_rect($im, $x, LG - $h, $x + $w - 2, LG + 10, $col);
        for ($wy = LG - $h + 4; $wy < LG; $wy += 6) {
            for ($wx = $x + 3; $wx < $x + $w - 4; $wx += 5) px_rect($im, $wx, $wy, $wx + 1, $wy + 2, px_shade($col, 0.25));
        }
        $x += $w + mt_rand(0, 6);
    }
    for ($i = 0; $i < 18; $i++) px_tree($im, LW, mt_rand(0, LW), LG + 6, 8, 9,
        ['trunk' => '#7f9f9a', 'trunkDark' => '#7f9f9a', 'dark' => '#7fa59a', 'mid' => '#8fb5a8', 'light' => '#a3c4b6'], 100 + $i);
}

/** Casa colonial con galería, columnas de madera y techo de teja. */
function cv_house($im, $x, $w, $h, $wall, $twoStory, $seed)
{
    mt_srand($seed);
    $top = LG - $h;
    $roof = '#b8532e';
    $wood = '#5a3a22';
    // Pared y techo
    px_rect($im, $x, $top, $x + $w, LG, $wall);
    px_rect($im, $x, $top, $x + $w, $top + 7, px_shade($wall, -0.25)); // sombra bajo el alero
    if ($twoStory) {
        $top2 = $top - 34;
        px_rect($im, $x + 4, $top2, $x + $w - 4, $top, px_shade($wall, 0.05));
        px_poly($im, [$x, $top2, $x + $w, $top2, $x + $w - 8, $top2 - 9, $x + 8, $top2 - 9], $roof);
        for ($ry = $top2 - 8; $ry < $top2; $ry += 3) px_line($im, $x + 4, $ry, $x + $w - 4, $ry, px_shade($roof, -0.2));
        // Ventanas con balcón de madera
        for ($wx = $x + 10; $wx < $x + $w - 14; $wx += 20) {
            px_rect($im, $wx, $top2 + 8, $wx + 9, $top2 + 24, '#4b5d3a');
            px_rect($im, $wx + 1, $top2 + 9, $wx + 8, $top2 + 23, '#6f8a52');
            px_rect($im, $wx - 3, $top2 + 22, $wx + 12, $top2 + 23, $wood);
            for ($bx = $wx - 3; $bx <= $wx + 12; $bx += 3) px_rect($im, $bx, $top2 + 18, $bx, $top2 + 22, $wood);
        }
        px_rect($im, $x, $top - 2, $x + $w, $top + 1, $wood); // viga del balcón corrido
    }
    // Alero de teja sobre la galería
    px_poly($im, [$x - 6, $top + 2, $x + $w + 6, $top + 2, $x + $w + 2, $top - 6, $x - 2, $top - 6], $roof);
    for ($ry = $top - 5; $ry < $top + 2; $ry += 2) px_line($im, $x - 4, $ry, $x + $w + 4, $ry, px_shade($roof, -0.18));
    for ($rx = $x - 4; $rx < $x + $w + 4; $rx += 4) px_line($im, $rx, $top - 5, $rx, $top + 1, px_shade($roof, 0.12));
    px_line($im, $x - 6, $top + 2, $x + $w + 6, $top + 2, px_shade($roof, -0.4));
    // Puertas y ventanas con rejas
    for ($dx = $x + 6; $dx < $x + $w - 12; $dx += 18) {
        if (mt_rand(0, 2) === 0) {
            px_rect($im, $dx, LG - 26, $dx + 10, LG, '#3e2a1c');
            px_rect($im, $dx + 1, LG - 25, $dx + 9, LG, '#6b4529');
            px_line($im, $dx + 5, LG - 25, $dx + 5, LG, '#3e2a1c');
        } else {
            px_rect($im, $dx, LG - 24, $dx + 10, LG - 10, '#2f3b46');
            for ($bx = $dx + 1; $bx < $dx + 10; $bx += 2) px_line($im, $bx, LG - 24, $bx, LG - 10, '#1c1c1c');
            px_rect($im, $dx - 1, LG - 25, $dx + 11, LG - 25, '#efe6d0');
        }
    }
    // Columnas de madera de la galería
    for ($cx = $x; $cx <= $x + $w; $cx += 14) {
        px_rect($im, $cx - 1, $top + 2, $cx + 1, LG, $wood);
        px_rect($im, $cx - 2, $top + 2, $cx + 2, $top + 3, $wood);
        px_rect($im, $cx - 2, LG - 2, $cx + 2, LG, '#cfc6b4');
    }
}

/** Catedral de ladrillo con dos torres (inspirada en la Catedral de la plaza). */
function cv_cathedral($im, $cx)
{
    $brick = '#b5623c';
    $brickL = '#cb7c52';
    $brickD = '#8a4529';
    $cream = '#efe2c2';
    $dark = '#3a1f16';
    $baseY = LG;
    // Nave central
    $fw = 50;
    $fTop = $baseY - 100;
    px_rect($im, $cx - $fw, $fTop, $cx + $fw, $baseY, $brick);
    px_poly($im, [$cx - $fw - 2, $fTop, $cx + $fw + 2, $fTop, $cx, $fTop - 28], $brick);
    px_line($im, $cx - $fw - 2, $fTop, $cx, $fTop - 28, $cream, 2);
    px_line($im, $cx, $fTop - 28, $cx + $fw + 2, $fTop, $cream, 2);
    px_rect($im, $cx - 1, $fTop - 40, $cx + 1, $fTop - 28, $dark);
    px_rect($im, $cx - 5, $fTop - 36, $cx + 5, $fTop - 34, $dark);
    px_rect($im, $cx - $fw, $fTop, $cx + $fw, $fTop + 2, $cream);
    px_rect($im, $cx - $fw, $baseY - 46, $cx + $fw, $baseY - 44, $cream);
    // Rosetón
    px_ell($im, $cx, $fTop + 22, 22, 22, $cream);
    px_ell($im, $cx, $fTop + 22, 16, 16, '#5d2f22');
    px_ell($im, $cx, $fTop + 22, 6, 6, '#e8b04a');
    // Portada principal en arco
    px_ell($im, $cx, $baseY - 30, 26, 22, $cream);
    px_rect($im, $cx - 13, $baseY - 30, $cx + 13, $baseY, $cream);
    px_ell($im, $cx, $baseY - 30, 20, 16, '#4a2a1a');
    px_rect($im, $cx - 10, $baseY - 30, $cx + 10, $baseY, '#4a2a1a');
    px_line($im, $cx, $baseY - 36, $cx, $baseY, '#2c180f');
    // Pilastras
    foreach ([-38, -22, 22, 38] as $p) px_rect($im, $cx + $p - 1, $fTop + 4, $cx + $p + 1, $baseY, $brickL);
    // Ladrillo: juntas
    for ($y = $fTop + 4; $y < $baseY; $y += 3) for ($x = $cx - $fw + (($y / 3) % 2) * 3; $x < $cx + $fw; $x += 6) px_dot($im, $x, $y, $brickD);
    // Torres
    foreach ([-1, 1] as $s) {
        $tx = $cx + $s * ($fw + 14);
        $tw = 15;
        $tTop = $baseY - 150;
        px_rect($im, $tx - $tw, $tTop, $tx + $tw, $baseY, $brick);
        px_rect($im, $tx + ($s > 0 ? $tw - 4 : -$tw), $tTop, $tx + ($s > 0 ? $tw : -$tw + 4), $baseY, $s > 0 ? $brickD : $brickL);
        foreach ([$baseY - 46, $baseY - 92, $tTop + 30] as $cy) px_rect($im, $tx - $tw - 2, $cy, $tx + $tw + 2, $cy + 2, $cream);
        // Campanario: arcos
        foreach ([-7, 7] as $ax) {
            px_ell($im, $tx + $ax, $tTop + 14, 9, 10, $cream);
            px_rect($im, $tx + $ax - 4, $tTop + 14, $tx + $ax + 4, $tTop + 27, $cream);
            px_ell($im, $tx + $ax, $tTop + 14, 6, 7, $dark);
            px_rect($im, $tx + $ax - 3, $tTop + 14, $tx + $ax + 3, $tTop + 27, $dark);
        }
        px_ell($im, $tx - 7, $tTop + 22, 4, 4, '#d9a441'); // campana
        // Ventanas de la torre
        foreach ([$baseY - 70, $baseY - 116] as $wy) {
            px_ell($im, $tx, $wy, 8, 8, $cream);
            px_rect($im, $tx - 4, $wy, $tx + 4, $wy + 12, $cream);
            px_ell($im, $tx, $wy, 5, 5, $dark);
            px_rect($im, $tx - 2, $wy, $tx + 2, $wy + 11, $dark);
        }
        // Cúpula y cruz
        px_ell($im, $tx, $tTop, $tw * 2 - 2, 20, $brickL);
        px_ell($im, $tx - 3, $tTop - 3, 10, 8, '#e09a6c');
        px_rect($im, $tx - $tw, $tTop, $tx + $tw, $tTop + 3, $cream);
        px_rect($im, $tx - 2, $tTop - 18, $tx + 2, $tTop - 8, $cream);
        px_rect($im, $tx, $tTop - 26, $tx, $tTop - 18, $dark);
        px_rect($im, $tx - 3, $tTop - 23, $tx + 3, $tTop - 23, $dark);
        for ($y = $tTop + 4; $y < $baseY; $y += 3) for ($x = $tx - $tw + (($y / 3) % 2) * 3; $x < $tx + $tw; $x += 6) px_dot($im, $x, $y, $brickD);
    }
}

function cv_mid($im)
{
    $walls = ['#f1e3b5', '#e9d6a0', '#f3efe2', '#cfe3e8', '#f2c9a8', '#e8e0f0'];
    $x = 0;
    $i = 0;
    // Casas a la izquierda y derecha de la catedral (centro en x = 400)
    $spans = [[0, 270], [530, LW]];
    foreach ($spans as $sp) {
        $x = $sp[0];
        while ($x < $sp[1] - 40) {
            $w = min($sp[1] - $x, 60 + ($i * 37) % 50);
            cv_house($im, $x, $w - 4, 40 + ($i * 13) % 14, $walls[$i % count($walls)], $i % 3 === 1, 50 + $i);
            $x += $w;
            $i++;
        }
    }
    cv_cathedral($im, 400);
}

function cv_near($im)
{
    global $PALM, $TOBO, $TREE;
    px_palm($im, LW, 40, LG + 4, 92, 6, $PALM);
    px_toborochi($im, LW, 150, LG + 4, 54, $TOBO, 7);
    px_bench($im, LW, 200, LG + 2, '#3f7a3a');
    px_lamp($im, LW, 250, LG + 4, 42);
    px_palm($im, LW, 330, LG + 4, 110, -8, $PALM);
    px_tree($im, LW, 470, LG + 4, 34, 26, $TREE, 9);
    px_lamp($im, LW, 560, LG + 4, 42);
    px_bench($im, LW, 600, LG + 2, '#3f7a3a');
    px_toborochi($im, LW, 660, LG + 4, 60, $TOBO, 11);
    px_palm($im, LW, 750, LG + 4, 98, 10, $PALM);
    for ($x = 0; $x < LW; $x += 52) px_bush($im, LW, $x + 20, LG + 4, 18, ['dark' => '#2e6b2c', 'mid' => '#4d9440'], 300 + $x, '#ff5d8f');
}

function cv_tiles($im)
{
    // 0 superficie: bordillo de piedra + adoquines
    $o = 0;
    px_rect($im, $o, 0, $o + T - 1, T - 1, '#6d655a');
    px_rect($im, $o, 0, $o + T - 1, 2, '#cfc6b2');
    px_rect($im, $o, 3, $o + T - 1, 3, '#8a8170');
    for ($r = 0; $r < 3; $r++) for ($c = 0; $c < 4; $c++) {
        $sx = $o + $c * 4 + ($r % 2) * 2;
        $sy = 5 + $r * 4;
        px_rect($im, $sx, $sy, min($o + T - 1, $sx + 2), $sy + 2, ($r + $c) % 2 ? '#9a9080' : '#8a8172');
        px_dot($im, $sx, $sy, '#b3a993');
    }
    // 1 relleno: tierra con ladrillo
    $o = T;
    tile_texture($im, $o, '#6b4a36', ['#5a3c2b', '#7d5a42', '#4c3324'], 3, 22);
    for ($y = 3; $y < T; $y += 5) px_line($im, $o, $y, $o + T - 1, $y, '#5a3c2b');
    // 2 plataforma: alero/balcón de madera
    $o = T * 2;
    px_rect($im, $o, 0, $o + T - 1, 4, '#8a5a32');
    px_rect($im, $o, 0, $o + T - 1, 0, '#c08a52');
    px_rect($im, $o, 4, $o + T - 1, 5, '#4f321b');
    px_line($im, $o + 7, 1, $o + 7, 4, '#5f3d22');
    px_line($im, $o + 2, 6, $o + 5, 9, '#5f3d22', 2);
    px_line($im, $o + 13, 6, $o + 10, 9, '#5f3d22', 2);
    // 3 caja
    tile_crate($im, T * 3);
    // 4 peligro: parrilla con brasas
    $o = T * 4;
    px_rect($im, $o, 3, $o + T - 1, T - 1, '#2a2522');
    mt_srand(4);
    for ($i = 0; $i < 26; $i++) px_dot($im, $o + mt_rand(0, T - 1), mt_rand(5, T - 2), ['#ff5a1a', '#ffb02e', '#c43a12'][mt_rand(0, 2)]);
    for ($y = 4; $y < 8; $y += 2) px_line($im, $o, $y, $o + T - 1, $y, '#8a8a8a');
    foreach ([2, 7, 12] as $fx) { px_dot($im, $o + $fx, 2, '#ffd23a'); px_dot($im, $o + $fx + 1, 1, '#ff8a1a'); px_dot($im, $o + $fx, 0, '#ffef9a'); }
    // 5 rebote: toldo rojo y blanco de un puesto
    tile_awning($im, T * 5, '#d63a3a', '#f2ece0');
    // 6 lento: charco de lluvia sobre el adoquín
    $o = T * 6;
    px_rect($im, $o, 0, $o + T - 1, T - 1, '#6d655a');
    tile_water($im, $o, '#5c5444', '#7d7462', '#b9b09c', 1);
    // 7 relleno bajo la parrilla
    tile_texture($im, T * 7, '#3e2c22', ['#2c1f17', '#4c3628'], 5, 18);
}

// ======================================================================== UAGRM

function ua_sky($im)
{
    px_gradient($im, 0, 0, LW - 1, LH - 1, [[0, '#1a62cf'], [0.5, '#3f8fe6'], [0.85, '#8cc4f2'], [1, '#c4e2f8']]);
    $cloud = ['#ffffff', '#f2f6fb', '#c6d6ea'];
    px_cloud($im, LW, 90, 40, 110, $cloud, 11);
    px_cloud($im, LW, 260, 70, 160, $cloud, 12);
    px_cloud($im, LW, 470, 30, 90, $cloud, 13);
    px_cloud($im, LW, 640, 62, 140, $cloud, 14);
    px_cloud($im, LW, 760, 105, 80, $cloud, 15);
}

function ua_far($im)
{
    // Módulos lejanos y fila de árboles
    foreach ([[40, 70, 60], [300, 90, 46], [560, 80, 70]] as $b) {
        px_rect($im, $b[0], LG - $b[2], $b[0] + $b[1], LG, '#c7d6e6');
        for ($y = LG - $b[2] + 6; $y < LG; $y += 9) px_rect($im, $b[0] + 3, $y, $b[0] + $b[1] - 3, $y + 3, '#a9bdd3');
    }
    mt_srand(31);
    for ($x = 0; $x < LW; $x += 9) {
        $r = mt_rand(10, 18);
        px_ell($im, $x, LG - 4 - mt_rand(0, 8), $r * 2, $r * 1.6, '#4f8a63');
    }
    for ($x = 4; $x < LW; $x += 13) px_ell($im, $x, LG - 8 - mt_rand(0, 6), 12, 9, '#6aa57a');
    px_rect($im, 0, LG - 4, LW - 1, LG + 10, '#4f8a63');
}

/** Módulo de facultad: bloque blanco de varios pisos, pilares grises, torre oscura y letrero. */
function ua_faculty($im, $x, $w, $floors, $sign, $number, $seed)
{
    mt_srand($seed);
    $fh = 17;
    $h = $floors * $fh + 12;
    $top = LG - $h;
    $white = '#eef0ee';
    $shade = '#cfd4d3';
    $char = '#474b54';
    $glass = ['#86aed6', '#9fc0e0', '#7f98c8', '#8c74c8'];
    // Cuerpo principal
    px_rect($im, $x, $top, $x + $w, LG, $white);
    px_rect($im, $x + $w - 6, $top, $x + $w, LG, $shade);
    for ($f = 0; $f < $floors; $f++) {
        $fy = $top + 12 + $f * $fh;
        px_rect($im, $x, $fy, $x + $w, $fy + 1, '#ffffff');
        px_rect($im, $x, $fy + 2, $x + $w, $fy + 2, $shade);
        // Ventanas
        for ($wx = $x + 4; $wx < $x + $w * 0.74 - 8; $wx += 10) {
            $g = $glass[mt_rand(0, 9) < 7 ? mt_rand(0, 1) : mt_rand(2, 3)];
            px_rect($im, $wx, $fy + 5, $wx + 7, $fy + 13, $g);
            px_rect($im, $wx, $fy + 5, $wx + 7, $fy + 6, px_shade($g, 0.35));
            px_line($im, $wx + 3, $fy + 5, $wx + 3, $fy + 13, '#ffffff');
        }
    }
    // Sección de pilares grises verticales
    $p1 = $x + (int)($w * 0.12);
    $p2 = $x + (int)($w * 0.42);
    for ($px = $p1; $px < $p2; $px += 9) px_rect($im, $px, $top + 12, $px + 3, LG - 18, $char);
    // Núcleo de escaleras abierto
    $s1 = $x + (int)($w * 0.58);
    $s2 = $x + (int)($w * 0.70);
    px_rect($im, $s1, $top + 14, $s2, LG - 18, '#9aa3ab');
    for ($f = 0; $f < $floors - 1; $f++) {
        $fy = $top + 12 + $f * $fh;
        px_rect($im, $s1, $fy + 10, $s2, $fy + 12, $white);
        for ($rx = $s1; $rx < $s2; $rx += 3) px_dot($im, $rx, $fy + 8, '#5b6066');
        px_line($im, $s1, $fy + 8, $s2, $fy + 8, '#5b6066');
        if (mt_rand(0, 1)) px_rect($im, $s1 + 4 + mt_rand(0, 6), $fy + 3, $s1 + 5 + mt_rand(0, 6), $fy + 9, '#2c3a5a');
    }
    // Banda superior oscura con el letrero
    px_rect($im, $x - 2, $top - 2, $x + (int)($w * 0.74), $top + 11, $char);
    px_rect($im, $x + 6, $top + 2, $x + 13, $top + 8, '#ffffff');
    px_text($im, $x + 7, $top + 1, 'U', '#1f3c9a', 1);
    px_text($im, $x + 18, $top + 1, $sign, '#ffffff', 1);
    // Torre oscura a la derecha
    $t1 = $x + (int)($w * 0.76);
    px_rect($im, $t1, $top - 8, $x + $w + 4, LG, $char);
    for ($f = 0; $f < $floors; $f++) {
        $fy = $top + 6 + $f * $fh;
        for ($wx = $t1 + 4; $wx < $x + $w; $wx += 8) {
            $g = mt_rand(0, 3) === 0 ? '#9a7ad8' : '#b9c9dc';
            px_rect($im, $wx, $fy, $wx + 5, $fy + 8, $g);
        }
    }
    px_text($im, $t1 + 4, $top - 7, $number, '#ffffff', 1);
    px_rect($im, $x + $w - 4, $top - 11, $x + $w + 2, $top - 8, '#c84a3a');
    // Planta baja con columnas
    px_rect($im, $x, LG - 18, $x + $w, LG, '#dfe3e2');
    for ($cx = $x + 3; $cx < $x + $w; $cx += 14) px_rect($im, $cx, LG - 18, $cx + 2, LG, '#f6f7f6');
    for ($dx = $x + 8; $dx < $x + $w - 10; $dx += 28) px_rect($im, $dx, LG - 14, $dx + 9, LG, '#4d5a66');
    // Bordillo rojo
    px_rect($im, $x - 10, LG - 2, $x + $w + 10, LG, '#d63a2f');
}

function ua_mid($im)
{
    ua_faculty($im, 30, 300, 5, 'FACULTAD DE HUMANIDADES', '254B', 41);
    ua_faculty($im, 470, 250, 4, 'FAC. CIENCIAS EXACTAS', '236', 42);
}

/** Letrero "UAGRM" con los colores de la U (azul y rojo). */
function ua_sign($im, $x)
{
    px_wrap(LW, $x, function ($x) use ($im) {
        $base = LG + 2;
        px_rect($im, $x - 2, $base - 14, $x + 1, $base, '#6a6f78');
        px_rect($im, $x + 56, $base - 14, $x + 59, $base, '#6a6f78');
        px_rect($im, $x - 6, $base - 38, $x + 63, $base - 13, '#ffffff');
        px_rect($im, $x - 6, $base - 38, $x + 63, $base - 37, '#d9dde3');
        px_poly($im, [$x + 63, $base - 38, $x + 63, $base - 13, $x + 50, $base - 13], '#1f3c9a');
        px_poly($im, [$x + 63, $base - 13, $x + 54, $base - 13, $x + 63, $base - 24], '#d63a2f');
        px_text($im, $x - 2, $base - 37, 'U', '#1f3c9a', 5, 1);
        px_text($im, $x + 8, $base - 37, 'AGRM', '#d63a2f', 5, 1);
        px_rect($im, $x - 2, $base - 21, $x + 46, $base - 21, '#1f2a44');
        px_text($im, $x - 2, $base - 19, 'CIUDAD UNIV.', '#1f2a44', 1, 1);
    });
}

function ua_near($im)
{
    global $PALM, $TREE;
    $tree2 = ['trunk' => '#6b4a2e', 'trunkDark' => '#4a321e', 'dark' => '#2c6e2a', 'mid' => '#3f9a3a', 'light' => '#86c85a'];
    px_tree($im, LW, 20, LG + 4, 50, 34, $TREE, 21);
    px_palm($im, LW, 120, LG + 4, 96, 8, $PALM);
    ua_sign($im, 175);
    px_tree($im, LW, 300, LG + 4, 30, 20, $tree2, 22);
    px_palm($im, LW, 390, LG + 4, 104, -6, $PALM);
    px_palm($im, LW, 430, LG + 4, 84, 6, $PALM);
    px_lamp($im, LW, 520, LG + 4, 44);
    px_tree($im, LW, 640, LG + 4, 44, 32, $tree2, 23);
    px_tree($im, LW, 760, LG + 4, 28, 18, $TREE, 24);
    for ($x = 0; $x < LW; $x += 40) px_bush($im, LW, $x + 10, LG + 4, 16, ['dark' => '#2e6b2c', 'mid' => '#58a447'], 400 + $x, $x % 80 ? '#9b6bd6' : null);
}

function ua_tiles($im)
{
    // 0 superficie: pasto, bordillo rojo y vereda de cemento
    $o = 0;
    px_rect($im, $o, 0, $o + T - 1, T - 1, '#bdbdb7');
    px_rect($im, $o, 0, $o + T - 1, 2, '#5fae4a');
    foreach ([1, 5, 9, 13] as $gx) px_dot($im, $o + $gx, 0, '#8fd36a');
    px_rect($im, $o, 3, $o + T - 1, 4, '#d63a2f');
    px_rect($im, $o, 5, $o + T - 1, 5, '#8a2a22');
    px_line($im, $o + 7, 6, $o + 7, T - 1, '#a2a29c');
    px_line($im, $o, 11, $o + T - 1, 11, '#a2a29c');
    px_dot($im, $o + 3, 8, '#d3d3cd');
    px_dot($im, $o + 12, 14, '#d3d3cd');
    // 1 relleno: tierra
    tile_texture($im, T, '#6b5038', ['#5a422e', '#7f6248', '#8c8c86'], 13, 20);
    // 2 plataforma: losa de cemento blanca (balcón de módulo)
    $o = T * 2;
    px_rect($im, $o, 0, $o + T - 1, 5, '#e9ebea');
    px_rect($im, $o, 0, $o + T - 1, 0, '#ffffff');
    px_rect($im, $o, 5, $o + T - 1, 6, '#9aa0a3');
    px_rect($im, $o, 7, $o + T - 1, 7, '#5b6066');
    // 3 caja de cartón
    tile_crate($im, T * 3, ['#b8875a', '#7f5a36', '#d4a77a']);
    // 4 peligro: laguna con camalotes
    $o = T * 4;
    tile_water($im, $o, '#1f6a70', '#3a9a9e', '#9fe0dc', 2);
    px_ell($im, $o + 4, 4, 6, 3, '#4c9a3c');
    px_ell($im, $o + 12, 6, 5, 2, '#5fae4a');
    // 5 rebote: toldo de feria azul y rojo
    tile_awning($im, T * 5, '#1f4fae', '#d63a2f');
    // 6 lento: barro
    $o = T * 6;
    tile_texture($im, $o, '#6b4f33', ['#5a4028', '#80603f'], 17, 20);
    px_rect($im, $o, 0, $o + T - 1, 2, '#4f8a3a');
    px_ell($im, $o + 5, 6, 7, 3, '#8a6a46');
    px_ell($im, $o + 11, 11, 6, 2, '#8a6a46');
    // 7 agua profunda
    tile_texture($im, T * 7, '#16525a', ['#1f6a70', '#124449'], 19, 12);
}

// ======================================================================== LOMAS DE ARENA

function lo_sky($im)
{
    px_gradient($im, 0, 0, LW - 1, LH - 1, [[0, '#2a2c6c'], [0.35, '#7a3f8a'], [0.6, '#d0557a'], [0.8, '#ff9a52'], [1, '#ffd27a']]);
    // Sol bajo con halo tramado
    $cx = 520;
    $cy = 175;
    for ($r = 60; $r > 26; $r -= 2) {
        for ($a = 0; $a < 360; $a += 1) {
            $x = $cx + cos(deg2rad($a)) * $r;
            $y = $cy + sin(deg2rad($a)) * $r * 0.9;
            if (px_bayer((int)$x, (int)$y) > ($r - 26) / 34) px_dot($im, $x, $y, '#ffb36a');
        }
    }
    px_ell($im, $cx, $cy, 52, 48, '#ffe28a');
    px_ell($im, $cx, $cy, 42, 38, '#fff3c0');
    $cloud = ['#f7a6a0', '#d77a8c', '#8a4a7a'];
    px_cloud($im, LW, 150, 70, 110, $cloud, 31);
    px_cloud($im, LW, 380, 40, 70, $cloud, 32);
    px_cloud($im, LW, 700, 90, 120, $cloud, 33);
    // Aves
    foreach ([[300, 90], [312, 96], [640, 70], [652, 64]] as $b) {
        px_line($im, $b[0] - 3, $b[1] - 2, $b[0], $b[1], '#3a2346');
        px_line($im, $b[0], $b[1], $b[0] + 3, $b[1] - 2, '#3a2346');
    }
}

function lo_far($im)
{
    // Monte lejano (línea de bosque) y dunas lejanas
    mt_srand(41);
    for ($x = 0; $x < LW; $x += 6) {
        $r = mt_rand(8, 14);
        px_ell($im, $x, LG - 18 - mt_rand(0, 8), $r * 2, $r * 1.4, '#4a3557');
    }
    px_rect($im, 0, LG - 20, LW - 1, LH - 1, '#4a3557');
    px_dunes($im, LW, LH, LG - 2, 22, ['light' => '#c9837a', 'shade' => '#a8656e', 'ridge' => '#e0a08a', 'ripple' => '#b8737a'], 42, false);
}

function lo_mid($im)
{
    px_dunes($im, LW, LH, LG + 6, 70, ['light' => '#f0a77e', 'shade' => '#c9786a', 'ridge' => '#ffd0a8', 'ripple' => '#d98c72'], 51);
}

function lo_near($im)
{
    // Matorrales, pastos secos y árboles secos al borde de las dunas
    $dry = ['trunk' => '#4a3428', 'trunkDark' => '#3a281e', 'dark' => '#4f5a2a', 'mid' => '#6f7a34', 'light' => '#9aa04a'];
    px_tree($im, LW, 90, LG + 4, 40, 16, $dry, 61);
    px_tree($im, LW, 520, LG + 4, 34, 14, $dry, 62);
    foreach ([[240, 70], [700, 60]] as $d) {
        px_wrap(LW, $d[0], function ($x) use ($im, $d) {
            px_line($im, $x, LG + 4, $x + 2, LG - $d[1], '#3a281e', 2);
            px_line($im, $x + 1, LG - $d[1] * 0.6, $x - 14, LG - $d[1] * 0.9, '#3a281e');
            px_line($im, $x + 2, LG - $d[1] * 0.75, $x + 16, LG - $d[1] - 6, '#3a281e');
            px_line($im, $x - 8, LG - $d[1] * 0.78, $x - 12, LG - $d[1] * 0.98, '#3a281e');
        });
    }
    mt_srand(63);
    for ($i = 0; $i < 70; $i++) {
        $x = mt_rand(0, LW);
        $h = mt_rand(3, 9);
        px_wrap(LW, $x, function ($x) use ($im, $h) {
            px_line($im, $x, LG + 4, $x - 1, LG + 4 - $h, '#b9a24a');
            px_line($im, $x + 1, LG + 4, $x + 2, LG + 4 - $h + 2, '#8f7d34');
        });
    }
    for ($x = 0; $x < LW; $x += 70) px_bush($im, LW, $x + 30, LG + 4, 20, ['dark' => '#4f5a2a', 'mid' => '#7a8a3a'], 600 + $x);
}

function lo_tiles($im)
{
    // 0 superficie: arena rosada con ondas
    $o = 0;
    px_rect($im, $o, 0, $o + T - 1, T - 1, '#e3a07a');
    px_rect($im, $o, 0, $o + T - 1, 1, '#f8c9a6');
    for ($y = 4; $y < T; $y += 4) for ($x = 0; $x < T; $x++) if (($x + $y) % 6 < 3) px_dot($im, $o + $x, $y + (int)(sin($x / 2.5)), '#cf8a66');
    // 1 relleno: arena compacta
    tile_texture($im, T, '#c9845f', ['#b5704f', '#d99a74', '#a8664a'], 23, 24);
    // 2 plataforma: tronco
    $o = T * 2;
    px_rect($im, $o, 0, $o + T - 1, 6, '#7a5130');
    px_rect($im, $o, 0, $o + T - 1, 1, '#a0703f');
    px_rect($im, $o, 6, $o + T - 1, 6, '#4a301a');
    px_line($im, $o + 1, 3, $o + 6, 3, '#5a3a20');
    px_line($im, $o + 9, 4, $o + 14, 4, '#5a3a20');
    // 3 caja
    tile_crate($im, T * 3);
    // 4 peligro: curichi (agua estancada con juncos)
    $o = T * 4;
    tile_water($im, $o, '#2f4a4a', '#4a6a5e', '#a0c0a0', 3);
    foreach ([2, 6, 11, 14] as $rx) { px_line($im, $o + $rx, 3, $o + $rx, 0, '#6a8f3a'); px_dot($im, $o + $rx, 0, '#8a5a2a'); }
    // 5 rebote: llanta semienterrada
    $o = T * 5;
    px_ell($im, $o + 8, 6, 16, 12, '#1e1e22');
    px_ell($im, $o + 8, 6, 8, 5, '#e3a07a');
    for ($x = 1; $x < T - 1; $x += 3) px_dot($im, $o + $x, 1, '#4a4a52');
    px_rect($im, $o, 8, $o + T - 1, 9, '#e3a07a');
    // 6 lento: arena movediza
    $o = T * 6;
    px_rect($im, $o, 0, $o + T - 1, T - 1, '#b9774f');
    imageellipse($im, $o + 8, 6, 14, 7, px_c($im, '#9a5e3c'));
    imageellipse($im, $o + 8, 6, 7, 3, px_c($im, '#8e5636'));
    px_dot($im, $o + 8, 6, '#6e3f24');
    tile_texture_dots($im, $o, ['#a86a44', '#c98a5e'], 37);
    px_rect($im, $o, 0, $o + T - 1, 0, '#d39064');
    // 7 barro bajo el curichi
    tile_texture($im, T * 7, '#3f3a2c', ['#2f2b20', '#4f4a38'], 29, 16);
}
