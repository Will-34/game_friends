<?php
/**
 * pixel-art.php — Primitivas de dibujo pixel art con GD para las herramientas de niveles.
 *
 * Todo se pinta a media resolución y luego se escala ×2 con vecino más cercano (px_upscale),
 * así los fondos y tiles tienen el mismo "tamaño de píxel" grueso que los personajes.
 * Las funciones que reciben $W dibujan "envolviendo" horizontalmente (la imagen se repite sin costuras).
 */

/** Imagen nueva transparente. */
function px_new($w, $h)
{
    $im = imagecreatetruecolor($w, $h);
    imagealphablending($im, false);
    imagesavealpha($im, true);
    imagefill($im, 0, 0, imagecolorallocatealpha($im, 0, 0, 0, 127));
    imagealphablending($im, true);
    return $im;
}

/** '#rrggbb' → [r, g, b] */
function px_rgb($hex)
{
    $hex = ltrim($hex, '#');
    return [hexdec(substr($hex, 0, 2)), hexdec(substr($hex, 2, 2)), hexdec(substr($hex, 4, 2))];
}

/** Color GD a partir de '#rrggbb' (alpha 0 = opaco … 127 = transparente). */
function px_c($im, $hex, $alpha = 0)
{
    list($r, $g, $b) = px_rgb($hex);
    return imagecolorallocatealpha($im, $r, $g, $b, $alpha);
}

/** Mezcla dos colores (t = 0 → a, 1 → b). */
function px_mix($a, $b, $t)
{
    $ca = px_rgb($a);
    $cb = px_rgb($b);
    $o = '#';
    for ($i = 0; $i < 3; $i++) $o .= sprintf('%02x', (int)round($ca[$i] + ($cb[$i] - $ca[$i]) * $t));
    return $o;
}

/** Aclara (f > 0) u oscurece (f < 0) un color. */
function px_shade($hex, $f)
{
    return $f >= 0 ? px_mix($hex, '#ffffff', $f) : px_mix($hex, '#000000', -$f);
}

function px_rect($im, $x1, $y1, $x2, $y2, $hex, $alpha = 0)
{
    imagefilledrectangle($im, (int)round($x1), (int)round($y1), (int)round($x2), (int)round($y2), px_c($im, $hex, $alpha));
}

function px_ell($im, $cx, $cy, $w, $h, $hex, $alpha = 0)
{
    imagefilledellipse($im, (int)round($cx), (int)round($cy), max(1, (int)round($w)), max(1, (int)round($h)), px_c($im, $hex, $alpha));
}

function px_dot($im, $x, $y, $hex, $alpha = 0)
{
    imagesetpixel($im, (int)round($x), (int)round($y), px_c($im, $hex, $alpha));
}

function px_line($im, $x1, $y1, $x2, $y2, $hex, $thick = 1)
{
    imagesetthickness($im, $thick);
    imageline($im, (int)round($x1), (int)round($y1), (int)round($x2), (int)round($y2), px_c($im, $hex));
    imagesetthickness($im, 1);
}

/** Polígono relleno (compatible con PHP 7.4 y 8.1+). */
function px_poly($im, array $pts, $hex)
{
    $pts = array_map(function ($v) { return (int)round($v); }, $pts);
    if (PHP_VERSION_ID >= 80100) imagefilledpolygon($im, $pts, px_c($im, $hex));
    else imagefilledpolygon($im, $pts, count($pts) / 2, px_c($im, $hex));
}

/** Ejecuta $fn($x) también desplazado ±W para que el dibujo se repita sin costuras. */
function px_wrap($W, $x, callable $fn)
{
    $fn($x);
    $fn($x - $W);
    $fn($x + $W);
}

/** Escala entera con vecino más cercano (mantiene la transparencia). */
function px_upscale($im, $s)
{
    $w = imagesx($im);
    $h = imagesy($im);
    $out = imagecreatetruecolor($w * $s, $h * $s);
    imagealphablending($out, false);
    imagesavealpha($out, true);
    imagecopyresized($out, $im, 0, 0, 0, 0, $w * $s, $h * $s, $w, $h);
    return $out;
}

/** Matriz de Bayer 4×4 para tramado ordenado. */
function px_bayer($x, $y)
{
    static $m = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
    return ($m[$y & 3][$x & 3] + 0.5) / 16;
}

/**
 * Degradado vertical con tramado (estilo pixel art).
 * @param array $stops [[t, '#rrggbb'], …] con t de 0 (arriba) a 1 (abajo)
 */
function px_gradient($im, $x1, $y1, $x2, $y2, array $stops)
{
    $h = max(1, $y2 - $y1);
    for ($y = $y1; $y <= $y2; $y++) {
        $t = ($y - $y1) / $h;
        $a = $stops[0];
        $b = $stops[count($stops) - 1];
        for ($i = 0; $i < count($stops) - 1; $i++) {
            if ($t >= $stops[$i][0] && $t <= $stops[$i + 1][0]) { $a = $stops[$i]; $b = $stops[$i + 1]; break; }
        }
        $lt = ($b[0] - $a[0]) > 0 ? ($t - $a[0]) / ($b[0] - $a[0]) : 0;
        // Cuantiza a 4 tonos entre las dos paradas y trama entre ellos
        $steps = 4;
        $q = $lt * $steps;
        $lo = floor($q);
        $frac = $q - $lo;
        $cLo = px_c($im, px_mix($a[1], $b[1], min(1, $lo / $steps)));
        $cHi = px_c($im, px_mix($a[1], $b[1], min(1, ($lo + 1) / $steps)));
        for ($x = $x1; $x <= $x2; $x++) {
            imagesetpixel($im, $x, $y, $frac > px_bayer($x, $y) ? $cHi : $cLo);
        }
    }
}

/** Nube de cúmulos: varias bolas con sombra abajo y luz arriba; base plana. */
function px_cloud($im, $W, $cx, $cy, $w, array $cols, $seed)
{
    mt_srand($seed);
    $n = max(3, (int)($w / 12));
    $puffs = [];
    for ($i = 0; $i < $n; $i++) {
        $u = ($i + 0.5) / $n;
        $r = ($w * 0.28) * (1 - abs($u * 2 - 1) * 0.55) * (mt_rand(80, 115) / 100);
        $puffs[] = [$cx - $w / 2 + $u * $w, $r];
    }
    list($light, $mid, $shade) = $cols;
    px_wrap($W, 0, function ($o) use ($im, $puffs, $cy, $w, $cx, $light, $mid, $shade) {
        foreach ($puffs as $p) px_ell($im, $p[0] + $o, $cy - $p[1] * 0.35 + 2, $p[1] * 2.1, $p[1] * 1.6, $shade);
        px_rect($im, $cx - $w / 2 + $o + 4, $cy, $cx + $w / 2 + $o - 4, $cy + 4, $shade);
        foreach ($puffs as $p) px_ell($im, $p[0] + $o - 1, $cy - $p[1] * 0.45, $p[1] * 1.9, $p[1] * 1.45, $mid);
        foreach ($puffs as $p) px_ell($im, $p[0] + $o - 3, $cy - $p[1] * 0.7, $p[1] * 1.1, $p[1] * 0.8, $light);
    });
}

/** Palmera: tronco anillado (ligeramente curvo) y hojas caídas. */
function px_palm($im, $W, $x, $base, $h, $lean, array $c)
{
    px_wrap($W, $x, function ($x) use ($im, $base, $h, $lean, $c) {
        $tx = $x;
        $ty = $base;
        for ($t = 0; $t <= $h; $t++) {
            $u = $t / $h;
            $tx = $x + $lean * $u * $u;
            $ty = $base - $t;
            px_rect($im, $tx - 1, $ty, $tx + 1, $ty, ($t % 4 === 0) ? $c['trunkDark'] : $c['trunk']);
            px_dot($im, $tx + 1, $ty, $c['trunkDark']);
        }
        $fronds = [[8, 1.0], [30, 0.9], [62, 0.7], [118, 0.7], [150, 0.9], [172, 1.0], [95, 0.5]];
        foreach ($fronds as $f) {
            $a = deg2rad($f[0]);
            $L = $h * 0.42 * $f[1] + 6;
            $prev = null;
            for ($s = 0; $s <= $L; $s += 1) {
                $px = $tx + cos($a) * $s;
                $py = $ty - sin($a) * $s + 0.9 * $L * pow($s / $L, 2) * 0.8;
                px_dot($im, $px, $py, $c['leaf']);
                px_dot($im, $px, $py + 1, $c['leafDark']);
                if ($s % 2 === 0 && $s > 3) {
                    $ll = 2 + (int)(3 * (1 - $s / $L));
                    px_line($im, $px, $py + 1, $px + ($f[0] < 90 ? 1 : -1), $py + $ll, $c['leafDark']);
                }
            }
        }
        px_ell($im, $tx - 1, $ty + 2, 3, 3, $c['nut']);
        px_ell($im, $tx + 2, $ty + 2, 3, 3, $c['nut']);
    });
}

/** Árbol de copa redonda (tajibo, mango…) con manchas de luz. */
function px_tree($im, $W, $x, $base, $h, $r, array $c, $seed)
{
    mt_srand($seed);
    $blobs = [];
    $n = 7 + (int)($r / 6);
    for ($i = 0; $i < $n; $i++) {
        $a = mt_rand(0, 628) / 100;
        $d = mt_rand(0, 100) / 100 * $r * 0.75;
        $blobs[] = [cos($a) * $d, sin($a) * $d * 0.7, $r * mt_rand(45, 75) / 100];
    }
    px_wrap($W, $x, function ($x) use ($im, $base, $h, $r, $c, $blobs) {
        $cy = $base - $h;
        px_rect($im, $x - 2, $cy, $x + 1, $base, $c['trunk']);
        px_rect($im, $x + 1, $cy, $x + 2, $base, $c['trunkDark']);
        px_line($im, $x, $cy + $r * 0.6, $x - $r * 0.5, $cy + 2, $c['trunk']);
        px_line($im, $x, $cy + $r * 0.5, $x + $r * 0.5, $cy, $c['trunk']);
        foreach ($blobs as $b) px_ell($im, $x + $b[0], $cy + $b[1] + 2, $b[2] * 2, $b[2] * 1.7, $c['dark']);
        foreach ($blobs as $b) px_ell($im, $x + $b[0] - 1, $cy + $b[1] - 1, $b[2] * 1.7, $b[2] * 1.4, $c['mid']);
        foreach ($blobs as $b) if ($b[1] < 0 || $b[0] < 0) px_ell($im, $x + $b[0] - 3, $cy + $b[1] - 3, $b[2] * 0.9, $b[2] * 0.7, $c['light']);
    });
}

/** Toborochi: tronco en forma de botella y copa de flores rosadas. */
function px_toborochi($im, $W, $x, $base, $h, array $c, $seed)
{
    mt_srand($seed);
    $blobs = [];
    for ($i = 0; $i < 9; $i++) $blobs[] = [mt_rand(-16, 16), mt_rand(-7, 5), mt_rand(7, 12)];
    px_wrap($W, $x, function ($x) use ($im, $base, $h, $c, $blobs) {
        $belly = $base - $h * 0.3;
        px_ell($im, $x, $belly, 15, $h * 0.55, $c['trunk']);
        px_ell($im, $x + 3, $belly, 6, $h * 0.45, $c['trunkDark']);
        px_rect($im, $x - 2, $base - $h, $x + 2, $belly, $c['trunk']);
        px_line($im, $x, $base - $h * 0.8, $x - 12, $base - $h - 2, $c['trunkDark']);
        px_line($im, $x, $base - $h * 0.8, $x + 12, $base - $h - 4, $c['trunkDark']);
        $cy = $base - $h - 4;
        foreach ($blobs as $b) px_ell($im, $x + $b[0], $cy + $b[1] + 2, $b[2] * 2, $b[2] * 1.5, $c['dark']);
        foreach ($blobs as $b) px_ell($im, $x + $b[0] - 1, $cy + $b[1], $b[2] * 1.6, $b[2] * 1.2, $c['mid']);
        foreach ($blobs as $b) if ($b[1] < 0) px_ell($im, $x + $b[0] - 2, $cy + $b[1] - 2, $b[2] * 0.8, $b[2] * 0.6, $c['light']);
    });
}

/** Arbusto bajo. */
function px_bush($im, $W, $x, $base, $w, array $c, $seed, $flowers = null)
{
    mt_srand($seed);
    $pts = [];
    for ($i = 0; $i < max(3, (int)($w / 6)); $i++) $pts[] = [mt_rand(-(int)($w / 2), (int)($w / 2)), mt_rand(5, 9)];
    $fl = [];
    if ($flowers) for ($i = 0; $i < (int)($w / 3); $i++) $fl[] = [mt_rand(-(int)($w / 2), (int)($w / 2)), mt_rand(-10, -2)];
    px_wrap($W, $x, function ($x) use ($im, $base, $c, $pts, $fl, $flowers) {
        foreach ($pts as $p) px_ell($im, $x + $p[0], $base - $p[1] * 0.6, $p[1] * 2.4, $p[1] * 1.6, $c['dark']);
        foreach ($pts as $p) px_ell($im, $x + $p[0] - 1, $base - $p[1] * 0.8, $p[1] * 1.8, $p[1] * 1.1, $c['mid']);
        foreach ($fl as $f) px_dot($im, $x + $f[0], $base + $f[1], $flowers);
    });
}

/** Farol de plaza. */
function px_lamp($im, $W, $x, $base, $h)
{
    px_wrap($W, $x, function ($x) use ($im, $base, $h) {
        px_rect($im, $x - 2, $base - 3, $x + 2, $base, '#2b2f36');
        px_rect($im, $x, $base - $h, $x, $base, '#2b2f36');
        px_line($im, $x - 4, $base - $h, $x + 4, $base - $h, '#2b2f36');
        px_ell($im, $x - 4, $base - $h - 3, 5, 6, '#fff6d8');
        px_ell($im, $x + 4, $base - $h - 3, 5, 6, '#fff6d8');
        px_dot($im, $x - 4, $base - $h - 6, '#2b2f36');
        px_dot($im, $x + 4, $base - $h - 6, '#2b2f36');
    });
}

/** Banco de plaza. */
function px_bench($im, $W, $x, $base, $col)
{
    px_wrap($W, $x, function ($x) use ($im, $base, $col) {
        px_rect($im, $x - 9, $base - 6, $x + 9, $base - 5, $col);
        px_rect($im, $x - 9, $base - 10, $x + 9, $base - 9, $col);
        px_rect($im, $x - 8, $base - 4, $x - 7, $base, '#2b2f36');
        px_rect($im, $x + 7, $base - 4, $x + 8, $base, '#2b2f36');
    });
}

/** Texto pixel con las fuentes internas de GD, escalado ×k (vecino más cercano). */
function px_text($im, $x, $y, $text, $hex, $font = 1, $k = 1)
{
    $w = imagefontwidth($font) * strlen($text);
    $h = imagefontheight($font);
    $tmp = px_new($w, $h);
    imagealphablending($tmp, true);
    imagestring($tmp, $font, 0, 0, $text, px_c($tmp, $hex));
    imagecopyresized($im, $tmp, (int)$x, (int)$y, 0, 0, $w * $k, $h * $k, $w, $h);
    imagedestroy($tmp);
    return $w * $k;
}

/** Ancho en píxeles de un texto con px_text. */
function px_text_width($text, $font = 1, $k = 1)
{
    return imagefontwidth($font) * strlen($text) * $k;
}

/**
 * Silueta de dunas o colinas que se repite cada $W: suma de senos con periodos divisores de $W.
 * Colorea la cara iluminada y la sombreada según la pendiente.
 */
function px_dunes($im, $W, $H, $baseY, $amp, array $c, $seed, $ripples = true)
{
    mt_srand($seed);
    $waves = [];
    foreach ([2, 3, 5, 7] as $k) $waves[] = [$k + mt_rand(0, 1), mt_rand(0, 628) / 100, $amp * mt_rand(40, 100) / 100 / ($k / 2)];
    $hgt = function ($x) use ($waves, $W, $baseY) {
        $y = $baseY;
        foreach ($waves as $w) $y -= $w[2] * (0.5 + 0.5 * sin($x / $W * 2 * M_PI * $w[0] + $w[1]));
        return $y;
    };
    for ($x = 0; $x < $W; $x++) {
        $y = (int)round($hgt($x));
        $slope = $hgt($x + 1) - $hgt($x);
        $col = $slope > 0.05 ? $c['shade'] : $c['light'];
        px_rect($im, $x, $y, $x, $H - 1, $col);
        px_dot($im, $x, $y, $slope > 0.05 ? $c['shade'] : $c['ridge']);
        if ($ripples) {
            for ($r = $y + 5; $r < $H; $r += 6) {
                if (((int)($x / 3) + (int)($r / 6)) % 4 === 0) px_dot($im, $x, $r + (int)(2 * sin($x / 9)), $c['ripple']);
            }
        }
    }
}
