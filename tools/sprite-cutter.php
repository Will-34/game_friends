<?php
/**
 * sprite-cutter.php — Recorta una lámina ilustrativa de personaje y genera
 * un spritesheet técnico (cuadros de tamaño fijo, fondo transparente, pies
 * alineados abajo), sus efectos, su retrato y actualiza character.json.
 *
 * Uso (desde la raíz del proyecto):
 *   php tools/sprite-cutter.php tools/config/<id>.json [--debug]
 *
 * Requisitos: PHP 7.4+ con la extensión GD. No modifica nunca la imagen original.
 *
 * Funcionamiento:
 *  1. Máscara de píxeles del personaje:
 *     - background.mode = "alpha" (por defecto): píxeles con alfa GD < alphaThreshold (láminas con transparencia).
 *     - background.mode = "color": la lámina es opaca; dentro de cada región se rellena el fondo desde los
 *       bordes aceptando colores "de fondo" (poco saturados, azulados) y se frena en el contorno oscuro.
 *       Con darkHalo, el halo oscuro difuminado alrededor del sprite también se elimina (se conserva solo el
 *       contorno pegado al personaje).
 *  2. Componentes conectados ("manchas") de la máscara.
 *  3. Por animación: manchas grandes cuyo centro cae en su "region", ordenadas de izquierda a derecha;
 *     los detalles pequeños (chispas, fogonazos) se adjuntan si "attachDetails" es true.
 *  4. Escala por animación ("scale") o automática por grupos ("autoScale") para igualar tamaños entre filas.
 *  5. Anclaje por los pies y pegado en celdas fijas.
 */

if (PHP_SAPI !== 'cli') { exit("Solo CLI\n"); }
if (!extension_loaded('gd')) { fwrite(STDERR, "Falta la extensión GD de PHP.\n"); exit(1); }

$configPath = $argv[1] ?? null;
$debug = in_array('--debug', $argv, true);
if (!$configPath || !is_file($configPath)) {
    fwrite(STDERR, "Uso: php tools/sprite-cutter.php tools/config/<personaje>.json [--debug]\n");
    exit(1);
}
ini_set('memory_limit', '3G');

$root = realpath(__DIR__ . '/..');
$cfg = json_decode(file_get_contents($configPath), true);
if (!is_array($cfg)) { fwrite(STDERR, "Config JSON inválida: $configPath\n"); exit(1); }

$src = imagecreatefrompng($root . '/' . $cfg['source']);
if (!$src) { fwrite(STDERR, "No se pudo abrir {$cfg['source']}\n"); exit(1); }
$W = imagesx($src); $H = imagesy($src);

$thr       = $cfg['alphaThreshold'] ?? 60;
$minMain   = $cfg['minFrameArea'] ?? 1500;
$minSmall  = $cfg['minDetailArea'] ?? 12;
$attachPad = $cfg['attachMargin'] ?? 8;
$fw = $cfg['frameWidth']; $fh = $cfg['frameHeight'];
$scale = $cfg['scale'] ?? 1.0;
$bottomPad = $cfg['bottomPadding'] ?? 2;
$cols = $cfg['columns'] ?? 8;
$bgCfg = ($cfg['background'] ?? []) + ['mode' => 'alpha'];
$report = ['source' => $cfg['source'], 'warnings' => [], 'animations' => []];

// =====================================================================
// 1. Máscara
// =====================================================================
$mask = [];

/** Regiones a procesar (animaciones + efectos), recortadas a la imagen. */
function allRegions($cfg, $W, $H) {
    $rs = [];
    foreach ($cfg['animations'] as $a) if (!empty($a['region'])) $rs[] = $a['region'];
    foreach (($cfg['effects']['items'] ?? []) as $it) {
        if (!empty($it['region'])) $rs[] = $it['region'];
        if (!empty($it['rect'])) $rs[] = $it['rect'];
    }
    return array_map(function ($r) use ($W, $H) {
        $x = max(0, $r[0]); $y = max(0, $r[1]);
        return [$x, $y, min($W - $x, $r[2] - ($x - $r[0])), min($H - $y, $r[3] - ($y - $r[1]))];
    }, $rs);
}

/**
 * Marca como fondo las líneas finas y largas (separadores de la lámina, bordes de letreros).
 * Solo se borran tramos FINOS consecutivos largos: los cañones de arma son cortos y se conservan.
 * @param bool $vertical  false = líneas horizontales; true = verticales
 */
function removeThinLines(&$bg, $rw, $rh, $o, $vertical, $px) {
    $alongN = $vertical ? $rh : $rw;   // dirección de la línea
    $acrossN = $vertical ? $rw : $rh;  // dirección del grosor
    $idx = $vertical ? function ($a, $c) use ($rw) { return $a * $rw + $c; }  // a = y, c = x
                     : function ($a, $c) use ($rw) { return $c * $rw + $a; }; // a = x, c = y
    $maxThick = $o['lineMaxThickness'];
    $line = [];
    for ($c = 0; $c < $acrossN; $c++) {
        $a = 0;
        while ($a < $alongN) {
            if (isset($bg[$idx($a, $c)])) { $a++; continue; }
            $start = $a;
            while ($a < $alongN && !isset($bg[$idx($a, $c)])) $a++;
            if ($a - $start < $o['lineMinLength']) continue;
            $thin = [];
            for ($p = $start; $p <= $a; $p++) {
                $isThin = false; $t0 = $t1 = $c;
                if ($p < $a) {
                    while ($t0 > 0 && !isset($bg[$idx($p, $t0 - 1)])) $t0--;
                    while ($t1 < $acrossN - 1 && !isset($bg[$idx($p, $t1 + 1)])) $t1++;
                    $isThin = $t1 - $t0 + 1 <= $maxThick;
                }
                if ($isThin) { $thin[] = [$p, $t0, $t1]; continue; }
                if (count($thin) >= $o['lineMinThinLength']) {
                    // Solo si es gris claro (separadores y bordes de letreros), nunca partes de color del personaje
                    $n = 0; $grey = 0;
                    foreach ($thin as [$tp, $u0, $u1]) for ($u = $u0; $u <= $u1; $u++) {
                        $q = $px[$idx($tp, $u)]; $n++;
                        $ql = ($q[0] + $q[1] + $q[2]) / 3;
                        if (($ql >= 100 && max($q) - min($q) <= 45) || ($ql >= 70 && $q[2] >= $q[0] + 20 && $q[2] >= $q[1] + 20)) $grey++;
                    }
                    if ($grey >= $n * 0.5) {
                        foreach ($thin as [$tp, $u0, $u1]) for ($u = $u0; $u <= $u1; $u++) $line[$idx($tp, $u)] = 1;
                    }
                }
                $thin = [];
            }
        }
    }
    foreach ($line as $i => $_) $bg[$i] = 1;
}

/** Elimina el fondo pintado de una región y marca en $mask los píxeles del personaje. */
function colorMaskRegion($src, $r, $o, &$mask, $W) {
    [$rx, $ry, $rw, $rh] = $r;
    $px = [];
    for ($y = 0; $y < $rh; $y++) for ($x = 0; $x < $rw; $x++) {
        $c = imagecolorat($src, $rx + $x, $ry + $y);
        $px[$y * $rw + $x] = [($c >> 16) & 255, ($c >> 8) & 255, $c & 255];
    }
    $bgLike = function ($p) use ($o) {
        [$r, $g, $b] = $p;
        $l = ($r + $g + $b) / 3;
        return (max($p) - min($p)) <= $o['satMax'] && $b >= $r - 6 && $b >= $g - 2
            && $l >= $o['lumMin'] && $l <= $o['lumMax'] && ($l >= 30 || $b - $r >= $o['bluishMin']);
    };
    $bg = []; $st = [];
    $seed = function ($x, $y) use (&$bg, &$st, $px, $rw, $bgLike) {
        $i = $y * $rw + $x;
        if (!isset($bg[$i]) && $bgLike($px[$i])) { $bg[$i] = 1; $st[] = $i; }
    };
    for ($x = 0; $x < $rw; $x++) { $seed($x, 0); $seed($x, $rh - 1); }
    for ($y = 0; $y < $rh; $y++) { $seed(0, $y); $seed($rw - 1, $y); }
    $N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while ($st) {
        $i = array_pop($st); $x = $i % $rw; $y = intdiv($i, $rw); $p = $px[$i];
        foreach ($N4 as $d) {
            $nx = $x + $d[0]; $ny = $y + $d[1];
            if ($nx < 0 || $ny < 0 || $nx >= $rw || $ny >= $rh) continue;
            $j = $ny * $rw + $nx;
            if (isset($bg[$j])) continue;
            $q = $px[$j];
            if ($bgLike($q) && abs($q[0] - $p[0]) + abs($q[1] - $p[1]) + abs($q[2] - $p[2]) <= $o['stepMax']) {
                $bg[$j] = 1; $st[] = $j;
            }
        }
    }
    if (!empty($o['darkHalo'])) {
        // Píxeles muy oscuros unidos al fondo: halo (se borra) o contorno (se conserva si toca al personaje)
        $dark = function ($p) use ($o) { return ($p[0] + $p[1] + $p[2]) / 3 < $o['darkLum'] && (max($p) - min($p)) <= 24; };
        $D = []; $st = [];
        foreach ($bg as $i => $_) {
            $x = $i % $rw; $y = intdiv($i, $rw);
            foreach ($N4 as $d) {
                $nx = $x + $d[0]; $ny = $y + $d[1];
                if ($nx < 0 || $ny < 0 || $nx >= $rw || $ny >= $rh) continue;
                $j = $ny * $rw + $nx;
                if (!isset($bg[$j]) && !isset($D[$j]) && $dark($px[$j])) { $D[$j] = 1; $st[] = $j; }
            }
        }
        while ($st) {
            $i = array_pop($st); $x = $i % $rw; $y = intdiv($i, $rw);
            foreach ($N4 as $d) {
                $nx = $x + $d[0]; $ny = $y + $d[1];
                if ($nx < 0 || $ny < 0 || $nx >= $rw || $ny >= $rh) continue;
                $j = $ny * $rw + $nx;
                if (!isset($bg[$j]) && !isset($D[$j]) && $dark($px[$j])) { $D[$j] = 1; $st[] = $j; }
            }
        }
        $R = $o['haloRadius'];
        $remove = [];
        foreach ($D as $i => $_) {
            $x = $i % $rw; $y = intdiv($i, $rw); $near = false;
            for ($dy = -$R; $dy <= $R && !$near; $dy++) for ($dx = -$R; $dx <= $R; $dx++) {
                $nx = $x + $dx; $ny = $y + $dy;
                if ($nx < 0 || $ny < 0 || $nx >= $rw || $ny >= $rh) continue;
                $j = $ny * $rw + $nx;
                if (!isset($bg[$j]) && !isset($D[$j])) { $near = true; break; }
            }
            if (!$near) $remove[] = $i;
        }
        foreach ($remove as $i) $bg[$i] = 1;
    }
    // Líneas separadoras y bordes de letreros: tramos largos y finos → fondo
    removeThinLines($bg, $rw, $rh, $o, false, $px);
    removeThinLines($bg, $rw, $rh, $o, true, $px);
    for ($y = 0; $y < $rh; $y++) for ($x = 0; $x < $rw; $x++) {
        if (!isset($bg[$y * $rw + $x])) $mask[($ry + $y) * $W + $rx + $x] = 1;
    }
}

if ($bgCfg['mode'] === 'color') {
    $opts = $bgCfg + ['lumMin' => 14, 'lumMax' => 135, 'satMax' => 48, 'bluishMin' => 8, 'stepMax' => 40,
                      'darkHalo' => true, 'darkLum' => 24, 'haloRadius' => 3,
                      'lineMinLength' => 40, 'lineMaxThickness' => 6, 'lineMinThinLength' => 40];
    foreach (allRegions($cfg, $W, $H) as $r) colorMaskRegion($src, $r, $opts, $mask, $W);
} else {
    for ($y = 0; $y < $H; $y++) for ($x = 0; $x < $W; $x++) {
        if (((imagecolorat($src, $x, $y) >> 24) & 127) < $thr) $mask[$y * $W + $x] = 1;
    }
}

// Zonas a borrar de la máscara (p. ej. un fogonazo que se superpone al cuadro siguiente y no se puede separar)
foreach (($cfg['eraseRects'] ?? []) as $er) {
    for ($y = $er[1]; $y < $er[1] + $er[3]; $y++) for ($x = $er[0]; $x < $er[0] + $er[2]; $x++) unset($mask[$y * $W + $x]);
}

// =====================================================================
// 2. Componentes conectados
// =====================================================================
$label = [];
$blobs = [];
foreach ($mask as $i => $_) {
    if (isset($label[$i])) continue;
    $id = count($blobs);
    $stack = [$i]; $label[$i] = $id;
    $b = ['id' => $id, 'x0' => $W, 'y0' => $H, 'x1' => 0, 'y1' => 0, 'area' => 0];
    while ($stack) {
        $p = array_pop($stack);
        $x = $p % $W; $y = intdiv($p, $W);
        $b['area']++;
        if ($x < $b['x0']) $b['x0'] = $x; if ($x > $b['x1']) $b['x1'] = $x;
        if ($y < $b['y0']) $b['y0'] = $y; if ($y > $b['y1']) $b['y1'] = $y;
        foreach ([[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]] as $d) {
            $nx = $x + $d[0]; $ny = $y + $d[1];
            if ($nx < 0 || $ny < 0 || $nx >= $W || $ny >= $H) continue;
            $q = $ny * $W + $nx;
            if (isset($mask[$q]) && !isset($label[$q])) { $label[$q] = $id; $stack[] = $q; }
        }
    }
    $b['cx'] = ($b['x0'] + $b['x1']) / 2; $b['cy'] = ($b['y0'] + $b['y1']) / 2;
    $blobs[] = $b;
}

function insideRegion($b, $r) {
    return $b['cx'] >= $r[0] && $b['cx'] <= $r[0] + $r[2] && $b['cy'] >= $r[1] && $b['cy'] <= $r[1] + $r[3];
}

// =====================================================================
// 3. Selección de cuadros
// =====================================================================
/** Cuadros de una animación: ['rect'=>[x0,y0,x1,y1], 'blobIds'=>[...]|null, 'mainH'=>alto de la mancha principal] */
function framesForAnimation($anim, $blobs, $minMain, $minSmall, $attachPad) {
    if (!empty($anim['frames'])) {
        $out = [];
        foreach ($anim['frames'] as $r) {
            $out[] = ['rect' => [$r[0], $r[1], $r[0] + $r[2] - 1, $r[1] + $r[3] - 1], 'blobIds' => null,
                      'alphaThreshold' => $anim['alphaThreshold'] ?? null, 'mainH' => $r[3]];
        }
        return $out;
    }
    $r = $anim['region'];
    $main = []; $small = [];
    foreach ($blobs as $b) {
        if (!insideRegion($b, $r)) continue;
        if ($b['area'] >= ($anim['minFrameArea'] ?? $minMain)) $main[] = $b;
        elseif ($b['area'] >= $minSmall) $small[] = $b;
    }
    usort($main, function ($a, $b) { return $a['x0'] <=> $b['x0']; });
    $frames = [];
    $maxW = $anim['maxFrameWidth'] ?? 130;
    foreach ($main as $m) {
        // Manchas demasiado anchas = dos cuadros unidos (p. ej. un fogonazo que toca al siguiente): se dividen
        $pieces = [[$m['x0'], $m['x1']]];
        // Cortes manuales (x absoluta en la lámina) para cuadros que se tocan en muchas filas
        foreach (($anim['splitX'] ?? []) as $sx) {
            foreach ($pieces as $k => [$a, $b]) {
                if ($sx > $a && $sx <= $b) { array_splice($pieces, $k, 1, [[$a, $sx - 1], [$sx, $b]]); break; }
            }
        }
        while (true) {
            $changed = false;
            foreach ($pieces as $k => [$a, $b]) {
                if ($b - $a + 1 <= $maxW) continue;
                // Columna con menos píxeles, penalizando la distancia al centro (evita cortar por un cañón fino)
                $bestX = -1; $bestN = PHP_INT_MAX; $mid = ($a + $b) / 2;
                for ($x = $a + 40; $x <= $b - 40; $x++) {
                    $n = 0;
                    for ($y = $m['y0']; $y <= $m['y1']; $y++) if (($GLOBALS['label'][$y * $GLOBALS['W'] + $x] ?? -1) === $m['id']) $n++;
                    $score = $n + abs($x - $mid) * 0.3;
                    if ($score < $bestN) { $bestN = $score; $bestX = $x; }
                }
                if ($bestX < 0) continue;
                array_splice($pieces, $k, 1, [[$a, $bestX - 1], [$bestX, $b]]);
                $changed = true;
                break;
            }
            if (!$changed) break;
        }
        foreach ($pieces as [$a, $b]) {
            // Ajustar el alto al contenido real de la pieza
            $y0 = $m['y1']; $y1 = $m['y0'];
            for ($y = $m['y0']; $y <= $m['y1']; $y++) for ($x = $a; $x <= $b; $x++) {
                if (($GLOBALS['label'][$y * $GLOBALS['W'] + $x] ?? -1) === $m['id']) { $y0 = min($y0, $y); $y1 = max($y1, $y); break; }
            }
            $frames[] = ['rect' => [$a, $y0, $b, $y1], 'blobIds' => [$m['id']], 'mainH' => $y1 - $y0 + 1];
        }
    }
    if (!empty($anim['attachDetails'])) {
        foreach ($small as $s) {
            $sw = $s['x1'] - $s['x0'] + 1; $sh = $s['y1'] - $s['y0'] + 1;
            // Resto de borde de letrero: alto, estrecho y "hueco" (poca área para su recuadro)
            if ($sh >= 30 && $sw <= 16 && $s['area'] < 0.35 * $sw * $sh) continue;
            $best = -1; $bestDist = PHP_INT_MAX;
            foreach ($frames as $k => $f) {
                $overlap = $s['x1'] >= $f['rect'][0] - $attachPad && $s['x0'] <= $f['rect'][2] + $attachPad
                        && $s['y1'] >= $f['rect'][1] - 40 && $s['y0'] <= $f['rect'][3] + 10;
                if (!$overlap) continue;
                // Distancia entre bordes (0 si se solapan). Los personajes miran a la derecha, así que
                // un detalle entre dos cuadros (fogonazo) pertenece al de la izquierda: se le da ventaja.
                $gap = max(0, $f['rect'][0] - $s['x1'], $s['x0'] - $f['rect'][2]);
                $dist = $gap + ($s['cx'] < ($f['rect'][0] + $f['rect'][2]) / 2 ? 6 : 0);
                if ($dist < $bestDist) { $bestDist = $dist; $best = $k; }
            }
            if ($best >= 0) {
                $f = &$frames[$best];
                $f['blobIds'][] = $s['id'];
                $f['rect'] = [min($f['rect'][0], $s['x0']), min($f['rect'][1], $s['y0']),
                              max($f['rect'][2], $s['x1']), max($f['rect'][3], $s['y1'])];
                unset($f);
            }
        }
    }
    return $frames;
}

/** Copia un cuadro a una imagen nueva con transparencia limpia. */
function extractFrame($src, $frame, $label, $mask, $W, $thrDefault, $alphaMode) {
    [$x0, $y0, $x1, $y1] = $frame['rect'];
    $w = $x1 - $x0 + 1; $h = $y1 - $y0 + 1;
    $img = imagecreatetruecolor($w, $h);
    imagealphablending($img, false); imagesavealpha($img, true);
    imagefill($img, 0, 0, imagecolorallocatealpha($img, 0, 0, 0, 127));
    $allowed = $frame['blobIds'] ? array_flip($frame['blobIds']) : null;
    $thr = $frame['alphaThreshold'] ?? $thrDefault;
    for ($y = $y0; $y <= $y1; $y++) {
        for ($x = $x0; $x <= $x1; $x++) {
            $i = $y * $W + $x;
            if ($allowed !== null) {
                if (!isset($allowed[$label[$i] ?? -1])) continue;
            } elseif ($alphaMode) {
                if (((imagecolorat($src, $x, $y) >> 24) & 127) >= $thr) continue;
            } elseif (!isset($mask[$i])) {
                continue;
            }
            imagesetpixel($img, $x - $x0, $y - $y0, imagecolorat($src, $x, $y) & 0xFFFFFF);
        }
    }
    return $img;
}

function scaleFrame($img, $scale) {
    if (abs($scale - 1.0) < 0.001) return $img;
    $w = max(1, (int)round(imagesx($img) * $scale)); $h = max(1, (int)round(imagesy($img) * $scale));
    $out = imagecreatetruecolor($w, $h);
    imagealphablending($out, false); imagesavealpha($out, true);
    imagefill($out, 0, 0, imagecolorallocatealpha($out, 0, 0, 0, 127));
    imagecopyresampled($out, $img, 0, 0, 0, 0, $w, $h, imagesx($img), imagesy($img));
    $clear = imagecolorallocatealpha($out, 0, 0, 0, 127);
    for ($y = 0; $y < $h; $y++) for ($x = 0; $x < $w; $x++) {
        $c = imagecolorat($out, $x, $y);
        imagesetpixel($out, $x, $y, (($c >> 24) & 127) < 64 ? ($c & 0xFFFFFF) : $clear);
    }
    return $out;
}

/** Ancla: X = centro de masa de la franja inferior (pies) o centro del recuadro; Y = fila opaca más baja. */
function anchorOf($img, $mode) {
    $w = imagesx($img); $h = imagesy($img);
    $bottom = 0; $minX = $w; $maxX = 0;
    for ($y = 0; $y < $h; $y++) for ($x = 0; $x < $w; $x++) {
        if (((imagecolorat($img, $x, $y) >> 24) & 127) < 64) {
            if ($y > $bottom) $bottom = $y;
            if ($x < $minX) $minX = $x; if ($x > $maxX) $maxX = $x;
        }
    }
    if ($mode === 'bbox') return [($minX + $maxX) / 2, $bottom];
    $band = max(4, (int)round($h * 0.35));
    $sum = 0; $n = 0;
    for ($y = max(0, $bottom - $band); $y <= $bottom; $y++) for ($x = 0; $x < $w; $x++) {
        if (((imagecolorat($img, $x, $y) >> 24) & 127) < 64) { $sum += $x; $n++; }
    }
    return [$n ? $sum / $n : $w / 2, $bottom];
}

/** Recorta los bordes transparentes; null si la imagen está vacía. */
function trimImage($img) {
    $w = imagesx($img); $h = imagesy($img);
    $x0 = $w; $y0 = $h; $x1 = -1; $y1 = -1;
    for ($y = 0; $y < $h; $y++) for ($x = 0; $x < $w; $x++) {
        if (((imagecolorat($img, $x, $y) >> 24) & 127) < 64) {
            $x0 = min($x0, $x); $y0 = min($y0, $y); $x1 = max($x1, $x); $y1 = max($y1, $y);
        }
    }
    if ($x1 < 0) return null;
    $out = imagecreatetruecolor($x1 - $x0 + 1, $y1 - $y0 + 1);
    imagealphablending($out, false); imagesavealpha($out, true);
    imagecopy($out, $img, 0, 0, $x0, $y0, $x1 - $x0 + 1, $y1 - $y0 + 1);
    return $out;
}

function median($xs) { if (!$xs) return 0; sort($xs); return $xs[intdiv(count($xs), 2)]; }

$alphaMode = $bgCfg['mode'] !== 'color';
$detected = [];
foreach ($cfg['animations'] as $name => $anim) {
    if (!empty($anim['placeholderFrom'])) continue;
    $detected[$name] = framesForAnimation($anim, $blobs, $minMain, $minSmall, $attachPad);
}

// ---------- Escala automática por grupos (filas dibujadas a distinto tamaño) ----------
$animScale = [];
if (!empty($cfg['autoScale'])) {
    $as = $cfg['autoScale'];
    $refH = [];
    foreach ($as['groups'] as $ref => $members) {
        $refH[$ref] = median(array_map(function ($f) { return $f['mainH']; }, $detected[$ref] ?? []));
    }
    $target = $refH[$as['target']] ?? 0;
    foreach ($as['groups'] as $ref => $members) {
        $s = ($refH[$ref] > 0 && $target > 0) ? min(1.0, $target / $refH[$ref]) : 1.0;
        foreach ($members as $m) $animScale[$m] = round($s, 3);
    }
    $report['autoScale'] = ['referenceHeights' => $refH, 'target' => $target, 'scales' => $animScale];
}

// =====================================================================
// 4. Spritesheet
// =====================================================================
$sheetFrames = [];
$animOut = [];
foreach ($cfg['animations'] as $name => $anim) {
    if (!empty($anim['placeholderFrom'])) continue;
    $frames = $detected[$name];
    $expected = $anim['expected'] ?? null;
    if ($expected !== null && count($frames) !== $expected) {
        $report['warnings'][] = "$name: se esperaban $expected cuadros y se detectaron " . count($frames);
    }
    $s = $anim['scale'] ?? ($animScale[$name] ?? $scale);
    $start = count($sheetFrames);
    foreach ($frames as $i => $f) {
        $img = scaleFrame(extractFrame($src, $f, $label, $mask, $W, $thr, $alphaMode), $s);
        $sheetFrames[] = ['img' => $img, 'anim' => $name, 'i' => $i,
                          'anchor' => $anim['anchor'] ?? 'feet', 'dx' => $anim['dx'][$i] ?? 0, 'dy' => $anim['dy'][$i] ?? 0];
    }
    $animOut[$name] = ['start' => $start, 'count' => count($frames)];
    $report['animations'][$name] = ['detected' => count($frames), 'expected' => $expected, 'scale' => $s,
        'rects' => array_map(function ($f) { return $f['rect']; }, $frames)];
}

$total = count($sheetFrames);
if ($total === 0) { fwrite(STDERR, "No se detectó ningún cuadro. Revisa 'background' y las regiones.\n"); exit(1); }
$rows = (int)ceil($total / $cols);
$sheet = imagecreatetruecolor($cols * $fw, $rows * $fh);
imagealphablending($sheet, false); imagesavealpha($sheet, true);
imagefill($sheet, 0, 0, imagecolorallocatealpha($sheet, 0, 0, 0, 127));
$placed = []; // índice de cuadro => [cellX, cellY]
foreach ($sheetFrames as $k => $sf) {
    $img = $sf['img'];
    [$ax, $ay] = anchorOf($img, $sf['anchor']);
    $cellX = ($k % $cols) * $fw; $cellY = intdiv($k, $cols) * $fh;
    $dstX = (int)round($fw / 2 - $ax) + $sf['dx'];
    $dstY = (int)round($fh - $bottomPad - 1 - $ay) + $sf['dy'];
    $w = imagesx($img); $h = imagesy($img);
    $sx = max(0, -$dstX); $sy = max(0, -$dstY);
    $cw = min($w - $sx, $fw - max(0, $dstX)); $ch = min($h - $sy, $fh - max(0, $dstY));
    if ($sx > 0 || $sy > 0 || $cw < $w - $sx || $ch < $h - $sy) {
        $report['warnings'][] = "{$sf['anim']}[{$sf['i']}]: el cuadro ({$w}x{$h}) no cabe en la celda {$fw}x{$fh}; se recortó";
    }
    imagecopy($sheet, $img, $cellX + max(0, $dstX), $cellY + max(0, $dstY), $sx, $sy, $cw, $ch);
    $placed[$k] = [$cellX, $cellY];
}
$outPath = $root . '/' . $cfg['output'];
if (!is_dir(dirname($outPath))) mkdir(dirname($outPath), 0775, true);
imagepng($sheet, $outPath, 9);

/** Mide un cuadro ya colocado: altura sobre los pies y punta derecha (boca del arma). */
function measureCell($sheet, $cell, $fw, $fh, $bottomPad) {
    [$cx, $cy] = $cell;
    $top = -1; $tipX = -1; $tipY = 0;
    for ($y = 0; $y < $fh; $y++) for ($x = 0; $x < $fw; $x++) {
        if (((imagecolorat($sheet, $cx + $x, $cy + $y) >> 24) & 127) < 64) {
            if ($top < 0) $top = $y;
            if ($x > $tipX) { $tipX = $x; $tipY = $y; }
        }
    }
    $footY = $fh - $bottomPad - 1;
    return ['height' => $top < 0 ? 0 : $footY - $top + 1, 'tipX' => $tipX - $fw / 2, 'tipY' => $tipY - $footY];
}

// =====================================================================
// 5. Efectos (cuadros sueltos en celdas cuadradas)
// =====================================================================
$effectsOut = null;
if (!empty($cfg['effects']['items'])) {
    $e = $cfg['effects'];
    $cell = $e['cellSize'];
    $names = array_keys($e['items']);
    $ecols = $e['columns'] ?? count($names);
    $esheet = imagecreatetruecolor($ecols * $cell, (int)ceil(count($names) / $ecols) * $cell);
    imagealphablending($esheet, false); imagesavealpha($esheet, true);
    imagefill($esheet, 0, 0, imagecolorallocatealpha($esheet, 0, 0, 0, 127));
    $effectsOut = ['image' => basename($e['output']), 'frameWidth' => $cell, 'frameHeight' => $cell, 'frames' => []];
    $k = 0;
    foreach ($names as $n) {
        $it = $e['items'][$n];
        // "region" o "rect": rectángulo de la lámina; se toman los píxeles de la máscara y se recorta el margen vacío
        $r = $it['region'] ?? $it['rect'];
        $frame = ['rect' => [$r[0], $r[1], $r[0] + $r[2] - 1, $r[1] + $r[3] - 1], 'blobIds' => null,
                  'alphaThreshold' => $it['alphaThreshold'] ?? null];
        $img = trimImage(extractFrame($src, $frame, $label, $mask, $W, $thr, $alphaMode));
        if (!$img) { $report['warnings'][] = "efecto $n: no se encontró nada en su región"; continue; }
        $img = scaleFrame($img, $it['scale'] ?? ($e['scale'] ?? 1.0));
        $w = imagesx($img); $h = imagesy($img);
        if ($w > $cell || $h > $cell) $report['warnings'][] = "efecto $n ({$w}x{$h}) no cabe en $cell; se recortó";
        $cx = ($k % $ecols) * $cell; $cy = intdiv($k, $ecols) * $cell;
        imagecopy($esheet, $img, $cx + max(0, intdiv($cell - $w, 2)), $cy + max(0, intdiv($cell - $h, 2)), 0, 0, min($w, $cell), min($h, $cell));
        $effectsOut['frames'][$n] = $k;
        $k++;
    }
    imagepng($esheet, $root . '/' . $e['output'], 9);
}

// =====================================================================
// 6. Retrato (para la pantalla de selección)
// =====================================================================
$portraitFile = null;
if (!empty($cfg['portrait'])) {
    $p = $cfg['portrait'];
    $size = $p['size'] ?? 96;
    $r = $p['rect'];
    $im = imagecreatetruecolor($size, $size);
    imagecopyresampled($im, $src, 0, 0, $r[0], $r[1], $size, $size, $r[2], $r[3]);
    imagepng($im, $root . '/' . $p['output'], 9);
    $portraitFile = basename($p['output']);
}

// =====================================================================
// 7. character.json (campos técnicos; los de diseño solo si faltan)
// =====================================================================
$charPath = $root . '/' . $cfg['characterJson'];
$char = is_file($charPath) ? json_decode(file_get_contents($charPath), true) : [];
if (!is_array($char)) { fwrite(STDERR, "character.json existente es inválido; no se toca.\n"); exit(1); }
$char['spritesheet'] = basename($cfg['output']);
$char['frameWidth'] = $fw;
$char['frameHeight'] = $fh;
if ($portraitFile) $char['portrait'] = $portraitFile;
$animations = [];
foreach ($cfg['animations'] as $name => $anim) {
    $meta = ['fps' => $anim['fps'] ?? 10, 'loop' => $anim['loop'] ?? true,
             'origin' => $anim['origin'] ?? [0.5, round(($fh - $bottomPad) / $fh, 4)],
             'offset' => $anim['offset'] ?? [0, 0]];
    if (!empty($anim['placeholderFrom'])) {
        $from = $animOut[$anim['placeholderFrom']];
        $idx = $anim['placeholderFrames'] ?? range(0, $from['count'] - 1);
        $frames = array_map(function ($i) use ($from) { return $from['start'] + $i; }, $idx);
        $animations[$name] = ['frames' => $frames] + $meta + ['placeholder' => true,
            'note' => $anim['note'] ?? "No existe en la lámina; reutiliza cuadros de '{$anim['placeholderFrom']}'."];
        $report['warnings'][] = "$name: animación provisional (reutiliza '{$anim['placeholderFrom']}')";
        continue;
    }
    $o = $animOut[$name];
    if ($o['count'] === 0) {
        // Sin cuadros detectados: provisional con el primer cuadro de idle
        $animations[$name] = ['frames' => [$animOut['idle']['start'] ?? 0]] + $meta + ['placeholder' => true,
            'note' => 'No se pudo extraer de la lámina; se usa un cuadro de idle.'];
        $report['warnings'][] = "$name: sin cuadros; provisional";
        continue;
    }
    $animations[$name] = ['frames' => range($o['start'], $o['start'] + $o['count'] - 1)] + $meta + ['placeholder' => false];
    if (!empty($anim['note'])) $animations[$name]['note'] = $anim['note'];
}
$char['animations'] = $animations;
if ($effectsOut) $char['effects'] = $effectsOut; else unset($char['effects']);

// Medidas automáticas (solo si character.json aún no las tiene)
$m = function ($anim, $i = 0) use ($animOut, $placed, $sheet, $fw, $fh, $bottomPad) {
    if (empty($animOut[$anim]['count'])) return null;
    return measureCell($sheet, $placed[$animOut[$anim]['start'] + $i], $fw, $fh, $bottomPad);
};
$idleM = $m('idle'); $fireM = $m('fire'); $crouchFireM = $m('crouch_fire'); $crouchM = $m('crouch');
$standH = $idleM ? $idleM['height'] : 76;
if (!isset($char['body'])) $char['body'] = ['width' => 32, 'height' => (int)round($standH * 0.88)];
if (!isset($char['crouchBody'])) $char['crouchBody'] = ['width' => 38, 'height' => (int)round(($crouchM ? $crouchM['height'] : $standH * 0.7) * 0.85)];
if (!isset($char['muzzle'])) {
    $char['muzzle'] = [
        'stand' => $fireM ? ['x' => (int)$fireM['tipX'] - 2, 'y' => (int)$fireM['tipY']] : ['x' => 48, 'y' => -40],
        'crouch' => $crouchFireM ? ['x' => (int)$crouchFireM['tipX'] - 2, 'y' => (int)$crouchFireM['tipY']] : ['x' => 50, 'y' => -32],
        'up' => ['x' => 6, 'y' => -($standH + 3)],
    ];
    $report['muzzleAuto'] = $char['muzzle'];
}
file_put_contents($charPath, json_encode($char, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n");

// =====================================================================
// 8. Informe y vista de depuración (tools/output/, no se publican)
// =====================================================================
$outDir = __DIR__ . '/output';
if (!is_dir($outDir)) mkdir($outDir, 0775, true);
$cfgName = pathinfo($configPath, PATHINFO_FILENAME);
if ($debug) {
    $dbg = imagecreatetruecolor(imagesx($sheet), imagesy($sheet));
    imagefill($dbg, 0, 0, imagecolorallocate($dbg, 255, 0, 255));
    imagealphablending($dbg, true);
    imagecopy($dbg, $sheet, 0, 0, 0, 0, imagesx($sheet), imagesy($sheet));
    $grid = imagecolorallocate($dbg, 0, 255, 0);
    for ($k = 0; $k < $rows * $cols; $k++) {
        $x = ($k % $cols) * $fw; $y = intdiv($k, $cols) * $fh;
        imagerectangle($dbg, $x, $y, $x + $fw - 1, $y + $fh - 1, $grid);
        imagestring($dbg, 2, $x + 3, $y + 2, (string)$k, imagecolorallocate($dbg, 255, 255, 255));
    }
    imagepng($dbg, "$outDir/$cfgName.debug.png");
    echo "Vista de depuración: tools/output/$cfgName.debug.png\n";
}
file_put_contents("$outDir/$cfgName.report.json", json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n");

echo "Spritesheet: {$cfg['output']} ({$total} cuadros, {$cols}x{$rows} celdas de {$fw}x{$fh})\n";
foreach ($animations as $n => $a) {
    echo sprintf("  %-12s %2d cuadros%s\n", $n, count($a['frames']), $a['placeholder'] ? '  [PROVISIONAL]' : '');
}
if ($report['warnings']) { echo "Avisos:\n"; foreach ($report['warnings'] as $w) echo "  - $w\n"; }
echo "Informe: tools/output/$cfgName.report.json\n";
