<?php
/**
 * level-theme-base.php — Tema "base": Base del Robot Guardián en el Parque Industrial, de noche (E6).
 * Lo incluye level-themes.php; usa sus constantes (LW, LH, LG, T) y ayudantes.
 */

function bs_sky($im)
{
    px_gradient($im, 0, 0, LW - 1, LH - 1, [[0, '#070a1c'], [0.5, '#141a3a'], [0.85, '#3a2a4a'], [1, '#6a3a3a']]);
    mt_srand(71);
    for ($i = 0; $i < 140; $i++) px_dot($im, mt_rand(0, LW - 1), mt_rand(0, 150), mt_rand(0, 4) ? '#c9d3ff' : '#ffffff', mt_rand(0, 60));
    // Luna creciente
    px_ell($im, 600, 50, 30, 30, '#f2ecd0');
    px_ell($im, 608, 46, 26, 26, '#141a3a');
    // Resplandor rojo de la base en el horizonte
    for ($y = 200; $y < LH; $y++) for ($x = 0; $x < LW; $x++) if (px_bayer($x, $y) < ($y - 200) / 140) px_dot($im, $x, $y, '#8a2a2a');
}

function bs_far($im)
{
    // Siluetas de fábricas, chimeneas con humo y luces rojas de aviso
    mt_srand(72);
    $x = 0;
    while ($x < LW) {
        $w = mt_rand(30, 70);
        $h = mt_rand(30, 80);
        px_rect($im, $x, LG - $h, $x + $w, LG + 10, '#1c2033');
        if (mt_rand(0, 1)) {
            $cx = $x + mt_rand(5, $w - 8);
            $ch = $h + mt_rand(30, 70);
            px_rect($im, $cx, LG - $ch, $cx + 5, LG, '#1c2033');
            px_dot($im, $cx + 2, LG - $ch - 1, '#ff3b3b');
            for ($s = 0; $s < 4; $s++) px_ell($im, $cx + 3 + $s * 5, LG - $ch - 6 - $s * 7, 8 + $s * 3, 6 + $s * 2, '#3a3a52', 70);
        }
        for ($wy = LG - $h + 6; $wy < LG - 4; $wy += 9) {
            for ($wx = $x + 4; $wx < $x + $w - 4; $wx += 8) if (mt_rand(0, 4) === 0) px_rect($im, $wx, $wy, $wx + 2, $wy + 2, '#ffcf4d');
        }
        $x += $w + mt_rand(4, 16);
    }
}

/** Nave industrial con techo en diente de sierra, ventanas iluminadas, portón y tuberías. */
function bs_factory($im, $x, $w, $h, $seed)
{
    mt_srand($seed);
    $top = LG - $h;
    px_rect($im, $x, $top, $x + $w, LG, '#2e3448');
    px_rect($im, $x, $top, $x + $w, $top + 3, '#454d66');
    for ($sx = $x; $sx < $x + $w - 10; $sx += 20) px_poly($im, [$sx, $top, $sx + 20, $top, $sx + 20, $top - 12], '#3a4158');
    for ($wy = $top + 10; $wy < LG - 30; $wy += 16) {
        for ($wx = $x + 6; $wx < $x + $w - 12; $wx += 14) {
            $lit = mt_rand(0, 3) > 0;
            px_rect($im, $wx, $wy, $wx + 8, $wy + 8, $lit ? '#ffcf4d' : '#151a2a');
            if ($lit) px_rect($im, $wx, $wy, $wx + 8, $wy + 1, '#fff3c0');
        }
    }
    $gx = $x + (int)($w / 2);
    px_rect($im, $gx - 16, LG - 26, $gx + 16, LG, '#20263a');
    for ($i = 0; $i < 32; $i += 4) px_rect($im, $gx - 16 + $i, LG - 28, $gx - 14 + $i, LG - 26, ($i % 8) ? '#1b1b1b' : '#ffcf4d');
    px_rect($im, $x - 10, $top + 20, $x + 4, $top + 24, '#6d7488');
    px_rect($im, $x - 10, $top + 20, $x - 6, LG, '#6d7488');
}

function bs_mid($im)
{
    bs_factory($im, 30, 220, 110, 81);
    // Tanque con rayo
    px_rect($im, 300, LG - 80, 360, LG, '#4a5266');
    px_ell($im, 330, LG - 80, 60, 16, '#5b6478');
    px_rect($im, 300, LG - 50, 360, LG - 46, '#ffcf4d');
    px_poly($im, [330, LG - 72, 322, LG - 58, 330, LG - 58, 326, LG - 48, 338, LG - 64, 330, LG - 64], '#ff3b3b');
    // Grúa
    px_rect($im, 400, LG - 150, 404, LG, '#ffcf4d');
    px_rect($im, 360, LG - 150, 480, LG - 146, '#ffcf4d');
    for ($i = 404; $i < 480; $i += 8) px_line($im, $i, LG - 150, $i + 8, LG - 146, '#b8902a');
    px_line($im, 470, LG - 146, 470, LG - 90, '#3a3f48');
    px_rect($im, 464, LG - 90, 476, LG - 82, '#6d7488');
    px_dot($im, 402, LG - 152, '#ff3b3b');
    bs_factory($im, 520, 250, 130, 82);
}

function bs_near($im)
{
    // Cerca de malla
    for ($x = 0; $x < LW; $x += 60) {
        px_rect($im, $x, LG - 34, $x + 2, LG + 4, '#5b6270');
        for ($y = LG - 30; $y < LG + 4; $y += 4) for ($k = 0; $k < 60; $k += 4) px_dot($im, $x + $k + (((int)($y / 4)) % 2) * 2, $y, '#3d4252');
    }
    px_rect($im, 0, LG - 34, LW - 1, LG - 33, '#5b6270');
    // Barriles
    foreach ([[90, '#2f6fd8'], [104, '#2f6fd8'], [330, '#d63a3a'], [610, '#3fae4a'], [624, '#2f6fd8']] as $b) {
        px_wrap(LW, $b[0], function ($x) use ($im, $b) {
            px_rect($im, $x - 6, LG - 16, $x + 6, LG + 4, $b[1]);
            px_rect($im, $x - 6, LG - 12, $x + 6, LG - 11, '#1b1b1b');
            px_rect($im, $x - 6, LG - 4, $x + 6, LG - 3, '#1b1b1b');
            px_rect($im, $x - 4, LG - 16, $x - 3, LG + 4, px_shade($b[1], 0.3));
        });
    }
    // Faroles con cono de luz
    foreach ([200, 470, 740] as $lx) {
        px_wrap(LW, $lx, function ($x) use ($im) {
            px_rect($im, $x, LG - 70, $x + 1, LG + 4, '#3a3f48');
            px_rect($im, $x - 6, LG - 72, $x + 6, LG - 69, '#3a3f48');
            px_ell($im, $x, LG - 66, 10, 4, '#ffcf4d');
            for ($y = LG - 64; $y < LG + 4; $y++) {
                $half = ($y - (LG - 64)) * 0.35;
                for ($k = -$half; $k <= $half; $k++) if (px_bayer((int)($x + $k), $y) < 0.12) px_dot($im, $x + $k, $y, '#ffcf4d', 70);
            }
        });
    }
}

function bs_tiles($im)
{
    // 0 superficie: placa de metal con franja amarilla
    $o = 0;
    px_rect($im, $o, 0, $o + T - 1, T - 1, '#4a5266');
    px_rect($im, $o, 0, $o + T - 1, 1, '#8a96a8');
    for ($x = 0; $x < T; $x++) px_dot($im, $o + $x, 2, ($x % 4 < 2) ? '#ffcf4d' : '#1b1b1b');
    px_rect($im, $o, 3, $o + T - 1, 3, '#2e3448');
    foreach ([[2, 6], [13, 6], [2, 13], [13, 13]] as $r) px_dot($im, $o + $r[0], $r[1], '#8a96a8');
    // 1 relleno: hormigón oscuro
    tile_texture($im, T, '#2e3448', ['#262b3a', '#3a4158'], 83, 18);
    // 2 plataforma: viga oscura con franja amarilla (igual lectura que en los demás mapas)
    tile_platform($im, T * 2, '#1b2030', '#3a4158');
    // 3 caja de acero
    tile_crate($im, T * 3, ['#5b6478', '#2e3448', '#8a96a8']);
    // 4 peligro: piso electrificado
    $o = T * 4;
    px_rect($im, $o, 0, $o + T - 1, T - 1, '#1d2a4a');
    px_rect($im, $o, 0, $o + T - 1, 1, '#6fe8ff');
    foreach ([[1, 3, 4, 6], [4, 6, 2, 9], [8, 2, 11, 5], [11, 5, 9, 8], [12, 9, 15, 11]] as $l) px_line($im, $o + $l[0], $l[1], $o + $l[2], $l[3], '#bff6ff');
    px_dot($im, $o + 6, 0, '#ffffff');
    // 5 rebote: resorte
    $o = T * 5;
    px_rect($im, $o + 1, 0, $o + T - 2, 2, '#ffcf4d');
    for ($y = 3; $y < 9; $y += 2) px_line($im, $o + 3, $y, $o + T - 4, $y + 1, '#9aa3b6');
    px_rect($im, $o + 1, 9, $o + T - 2, 10, '#3a3f48');
    // 6 lento: mancha de aceite sobre el metal
    $o = T * 6;
    px_rect($im, $o, 0, $o + T - 1, T - 1, '#4a5266');
    px_ell($im, $o + 8, 3, 16, 5, '#14161c');
    px_dot($im, $o + 5, 2, '#7a5aa8');
    px_dot($im, $o + 10, 3, '#3fae8a');
    // 7 relleno bajo el piso eléctrico
    tile_texture($im, T * 7, '#141a2e', ['#1d2a4a', '#0e1220'], 87, 14);
}
