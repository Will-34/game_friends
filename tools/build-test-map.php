<?php
/**
 * build-test-map.php — Genera un mapa en formato Tiled JSON (+ tileset y fondos
 * parallax PROVISIONALES) a partir de una definición sencilla en JSON.
 *
 * Uso (desde la raíz):  php tools/build-test-map.php tools/config/map-prueba.json
 *
 * El resultado se puede abrir y seguir editando en el editor Tiled (https://www.mapeditor.org/).
 * Los gráficos generados son marcadores de posición (placeholder) y se reemplazarán en E5/E7.
 */
if (PHP_SAPI !== 'cli') { exit("Solo CLI\n"); }
if (!extension_loaded('gd')) { fwrite(STDERR, "Falta la extensión GD de PHP.\n"); exit(1); }

$root = realpath(__DIR__ . '/..');
$cfgPath = $argv[1] ?? '';
$cfg = is_file($cfgPath) ? json_decode(file_get_contents($cfgPath), true) : null;
if (!is_array($cfg)) { fwrite(STDERR, "Uso: php tools/build-test-map.php tools/config/map-<id>.json\n"); exit(1); }

$ts = $cfg['tileSize']; $MW = $cfg['width']; $MH = $cfg['height'];
$outDir = $root . '/' . $cfg['output'];
if (!is_dir($outDir)) mkdir($outDir, 0775, true);

// ---------- Tileset provisional (4 tiles) ----------
// gid 1 = suelo superior, 2 = suelo relleno, 3 = plataforma atravesable, 4 = caja sólida
$tileset = imagecreatetruecolor($ts * 4, $ts);
imagealphablending($tileset, false); imagesavealpha($tileset, true);
imagefill($tileset, 0, 0, imagecolorallocatealpha($tileset, 0, 0, 0, 127));
$c = function ($r, $g, $b, $a = 0) use ($tileset) { return imagecolorallocatealpha($tileset, $r, $g, $b, $a); };
// 1: suelo superior (concreto con franja de advertencia)
imagefilledrectangle($tileset, 0, 0, $ts - 1, $ts - 1, $c(92, 98, 110));
imagefilledrectangle($tileset, 0, 0, $ts - 1, 5, $c(214, 170, 52));
for ($i = 0; $i < $ts; $i += 8) imagefilledrectangle($tileset, $i, 0, $i + 3, 5, $c(40, 40, 46));
imagefilledrectangle($tileset, 0, 6, $ts - 1, 7, $c(60, 64, 74));
imagesetpixel($tileset, 9, 16, $c(70, 74, 84)); imagesetpixel($tileset, 22, 24, $c(70, 74, 84));
// 2: suelo relleno
imagefilledrectangle($tileset, $ts, 0, $ts * 2 - 1, $ts - 1, $c(58, 62, 72));
imagerectangle($tileset, $ts, 0, $ts * 2 - 1, $ts - 1, $c(48, 51, 60));
imagesetpixel($tileset, $ts + 7, 9, $c(72, 76, 88)); imagesetpixel($tileset, $ts + 20, 21, $c(72, 76, 88));
// 3: plataforma (viga metálica)
imagefilledrectangle($tileset, $ts * 2, 0, $ts * 3 - 1, 9, $c(120, 128, 140));
imagefilledrectangle($tileset, $ts * 2, 0, $ts * 3 - 1, 2, $c(170, 178, 190));
imagefilledrectangle($tileset, $ts * 2, 8, $ts * 3 - 1, 9, $c(70, 74, 84));
imageline($tileset, $ts * 2 + 4, 10, $ts * 2 + 14, 20, $c(90, 96, 106));
imageline($tileset, $ts * 3 - 5, 10, $ts * 3 - 15, 20, $c(90, 96, 106));
// 4: caja
imagefilledrectangle($tileset, $ts * 3, 0, $ts * 4 - 1, $ts - 1, $c(140, 96, 52));
imagerectangle($tileset, $ts * 3, 0, $ts * 4 - 1, $ts - 1, $c(84, 54, 26));
imagerectangle($tileset, $ts * 3 + 3, 3, $ts * 4 - 4, $ts - 4, $c(110, 72, 36));
imageline($tileset, $ts * 3 + 3, 3, $ts * 4 - 4, $ts - 4, $c(110, 72, 36));
imagepng($tileset, $outDir . '/tileset.png', 9);

// ---------- Fondos parallax provisionales ----------
function makeSkyline($path, $w, $h, $color, $minH, $maxH, $seed, $windows) {
    mt_srand($seed);
    $im = imagecreatetruecolor($w, $h);
    imagealphablending($im, false); imagesavealpha($im, true);
    imagefill($im, 0, 0, imagecolorallocatealpha($im, 0, 0, 0, 127));
    $col = imagecolorallocate($im, $color[0], $color[1], $color[2]);
    $win = imagecolorallocate($im, min(255, $color[0] + 60), min(255, $color[1] + 50), min(255, $color[2] + 20));
    $x = 0;
    while ($x < $w) {
        $bw = mt_rand(40, 90); $bh = mt_rand($minH, $maxH);
        imagefilledrectangle($im, $x, $h - $bh, min($w - 1, $x + $bw - 4), $h - 1, $col);
        if ($windows) {
            for ($wy = $h - $bh + 10; $wy < $h - 20; $wy += 18) for ($wx = $x + 8; $wx < $x + $bw - 12; $wx += 14) {
                if (mt_rand(0, 3) === 0) imagefilledrectangle($im, $wx, $wy, $wx + 5, $wy + 7, $win);
            }
        }
        $x += $bw;
    }
    imagepng($im, $path, 9);
}
makeSkyline($outDir . '/bg-far.png', 512, 540, [44, 60, 86], 120, 300, 7, false);
makeSkyline($outDir . '/bg-near.png', 512, 540, [30, 40, 58], 60, 200, 11, true);

// ---------- Capa de tiles ----------
$data = array_fill(0, $MW * $MH, 0);
$set = function ($col, $row, $gid) use (&$data, $MW, $MH) {
    if ($col >= 0 && $col < $MW && $row >= 0 && $row < $MH) $data[$row * $MW + $col] = $gid;
};
foreach ($cfg['ground'] as $g) {
    for ($col = $g['from']; $col <= $g['to']; $col++) {
        $set($col, $g['top'], 1);
        for ($row = $g['top'] + 1; $row < $MH; $row++) $set($col, $row, 2);
    }
}
foreach ($cfg['platforms'] as $p) for ($i = 0; $i < $p['length']; $i++) $set($p['col'] + $i, $p['row'], 3);
foreach ($cfg['crates'] as $cr) $set($cr[0], $cr[1], 4);

// ---------- Capa de objetos (puntos de aparición) ----------
$objects = []; $oid = 1;
foreach ($cfg['spawns'] as $s) {
    $props = [];
    foreach ($s as $k => $v) {
        if (in_array($k, ['type', 'col', 'row'], true)) continue;
        $props[] = ['name' => $k, 'type' => is_int($v) ? 'int' : (is_bool($v) ? 'bool' : 'string'), 'value' => $v];
    }
    $objects[] = [
        'id' => $oid++, 'name' => $s['type'] . '_spawn', 'type' => $s['type'], 'class' => $s['type'],
        'x' => $s['col'] * $ts + $ts / 2, 'y' => ($s['row'] + 1) * $ts, 'width' => 0, 'height' => 0,
        'point' => true, 'rotation' => 0, 'visible' => true, 'properties' => $props,
    ];
}

$tiledProps = [];
foreach ($cfg['properties'] as $k => $v) {
    $tiledProps[] = ['name' => $k, 'type' => is_bool($v) ? 'bool' : (is_int($v) ? 'int' : 'string'), 'value' => $v];
}

$map = [
    'type' => 'map', 'version' => '1.10', 'tiledversion' => '1.10.2',
    'orientation' => 'orthogonal', 'renderorder' => 'right-down', 'infinite' => false,
    'width' => $MW, 'height' => $MH, 'tilewidth' => $ts, 'tileheight' => $ts,
    'nextlayerid' => 5, 'nextobjectid' => $oid, 'compressionlevel' => -1,
    'properties' => $tiledProps,
    'tilesets' => [[
        'firstgid' => 1, 'name' => 'tileset', 'image' => 'tileset.png',
        'imagewidth' => $ts * 4, 'imageheight' => $ts, 'tilewidth' => $ts, 'tileheight' => $ts,
        'tilecount' => 4, 'columns' => 4, 'margin' => 0, 'spacing' => 0,
        'tiles' => [
            ['id' => 0, 'properties' => [['name' => 'collides', 'type' => 'bool', 'value' => true]]],
            ['id' => 1, 'properties' => [['name' => 'collides', 'type' => 'bool', 'value' => true]]],
            ['id' => 2, 'properties' => [['name' => 'collides', 'type' => 'bool', 'value' => true],
                                          ['name' => 'oneWay', 'type' => 'bool', 'value' => true]]],
            ['id' => 3, 'properties' => [['name' => 'collides', 'type' => 'bool', 'value' => true]]],
        ],
    ]],
    'layers' => [
        ['id' => 1, 'name' => 'bg-far', 'type' => 'imagelayer', 'image' => 'bg-far.png', 'repeatx' => true,
         'parallaxx' => 0.2, 'parallaxy' => 1, 'opacity' => 1, 'visible' => true, 'x' => 0, 'y' => 0, 'offsetx' => 0, 'offsety' => 0],
        ['id' => 2, 'name' => 'bg-near', 'type' => 'imagelayer', 'image' => 'bg-near.png', 'repeatx' => true,
         'parallaxx' => 0.5, 'parallaxy' => 1, 'opacity' => 1, 'visible' => true, 'x' => 0, 'y' => 0, 'offsetx' => 0, 'offsety' => 0],
        ['id' => 3, 'name' => 'ground', 'type' => 'tilelayer', 'width' => $MW, 'height' => $MH, 'data' => $data,
         'opacity' => 1, 'visible' => true, 'x' => 0, 'y' => 0],
        ['id' => 4, 'name' => 'spawns', 'type' => 'objectgroup', 'draworder' => 'topdown', 'objects' => $objects,
         'opacity' => 1, 'visible' => true, 'x' => 0, 'y' => 0],
    ],
];
file_put_contents($outDir . '/map.json', json_encode($map, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n");
echo "Mapa generado en {$cfg['output']}/ (map.json, tileset.png, bg-far.png, bg-near.png)\n";
