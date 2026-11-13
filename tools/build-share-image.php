<?php
/**
 * build-share-image.php — Genera icons/share.jpg (1200×630), la vista previa al compartir el enlace
 * (WhatsApp, Facebook, Telegram…; etiquetas Open Graph en index.php).
 * Compone el fondo de Casco Viejo, el cuadro "idle" de los personajes y el texto "GAME FICCT".
 *
 * Uso (desde la raíz):  php tools/build-share-image.php
 */
if (PHP_SAPI !== 'cli') { exit("Solo CLI\n"); }
if (!extension_loaded('gd')) { fwrite(STDERR, "Falta la extensión GD de PHP.\n"); exit(1); }
require_once __DIR__ . '/lib/pixel-art.php';

$root = realpath(__DIR__ . '/..');
const SW = 1200;
const SH = 630;

$out = imagecreatetruecolor(SW, SH);
imagealphablending($out, true);

// Fondo: capas del mapa Casco Viejo (1600×540) escaladas a la altura y recortadas al centro.
$scale = SH / 540;
$bw = (int)round(1600 * $scale);
$sx = (int)(($bw - SW) / 2 / $scale);
foreach (['bg-sky', 'bg-far', 'bg-mid', 'bg-near'] as $layer) {
    $src = imagecreatefrompng("$root/content/maps/casco-viejo/$layer.png");
    imagecopyresized($out, $src, 0, 0, $sx, 0, SW, SH, (int)(SW / $scale), 540);
    imagedestroy($src);
}

// Velo oscuro para que se lea el texto.
$veil = imagecolorallocatealpha($out, 8, 10, 24, 70);
imagefilledrectangle($out, 0, 0, SW, SH, $veil);

/** Recorta el cuadro $frame de un spritesheet al área no transparente. */
function sprite_frame($path, $fw, $fh, $frame)
{
    $sheet = imagecreatefrompng($path);
    $cols = (int)(imagesx($sheet) / $fw);
    $ox = ($frame % $cols) * $fw;
    $oy = (int)($frame / $cols) * $fh;
    $minX = $fw; $minY = $fh; $maxX = -1; $maxY = -1;
    for ($y = 0; $y < $fh; $y++) for ($x = 0; $x < $fw; $x++) {
        $a = (imagecolorat($sheet, $ox + $x, $oy + $y) >> 24) & 0x7f;
        if ($a < 100) { $minX = min($minX, $x); $maxX = max($maxX, $x); $minY = min($minY, $y); $maxY = max($maxY, $y); }
    }
    if ($maxX < 0) return null;
    $w = $maxX - $minX + 1; $h = $maxY - $minY + 1;
    $im = imagecreatetruecolor($w, $h);
    imagealphablending($im, false); imagesavealpha($im, true);
    imagefill($im, 0, 0, imagecolorallocatealpha($im, 0, 0, 0, 127));
    imagecopy($im, $sheet, 0, 0, $ox + $minX, $oy + $minY, $w, $h);
    imagedestroy($sheet);
    return $im;
}

// Los 10 personajes en fila sobre el suelo, escala ×2 pixel-perfect.
$cast = ['will', 'plata', 'pablo', 'carlos', 'henry', 'sergio', 'ruddy', 'domeki', 'reymar', 'ignacio'];
$k = 2;
$sprites = [];
$total = 0;
foreach ($cast as $id) {
    $def = json_decode(file_get_contents("$root/content/characters/$id/character.json"), true);
    $idle = $def['animations']['idle']['frames'][0] ?? 0;
    $s = sprite_frame("$root/content/characters/$id/{$def['spritesheet']}", $def['frameWidth'], $def['frameHeight'], $idle);
    if ($s) { $sprites[$id] = $s; $total += imagesx($s) * $k; }
}
$gap = (int)((SW - 80 - $total) / max(1, count($sprites) - 1));
$x = 40;
$floor = SH - 40;
foreach ($sprites as $id => $s) {
    $w = imagesx($s) * $k; $h = imagesy($s) * $k;
    imagecopyresized($out, $s, $x, $floor - $h, 0, 0, $w, $h, imagesx($s), imagesy($s));
    $x += $w + $gap;
    imagedestroy($s);
}

/** Texto pixelado centrado con contorno. */
function title_text($im, $y, $text, $hex, $font, $k, $outline = '#0b0f17')
{
    $w = px_text_width($text, $font, $k);
    $x = (int)((SW - $w) / 2);
    foreach ([[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]] as $d) {
        px_text($im, $x + $d[0] * $k, $y + $d[1] * $k, $text, $outline, $font, $k);
    }
    px_text($im, $x + $k, $y + $k * 2, $text, $outline, $font, $k);
    px_text($im, $x, $y, $text, $hex, $font, $k);
}

title_text($out, 70, 'GAME FICCT', '#ffd34d', 5, 12);
title_text($out, 270, 'RESCATANDO A HENRY', '#ffffff', 5, 4);
title_text($out, 340, 'Accion arcade 2D - Santa Cruz, Bolivia', '#7dff8a', 5, 2);

imagejpeg($out, "$root/icons/share.jpg", 86);
imagedestroy($out);
echo 'icons/share.jpg generado (' . round(filesize("$root/icons/share.jpg") / 1024) . " KB)\n";
