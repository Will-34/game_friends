<?php
/**
 * build-level.php — Genera un nivel completo (Tiled JSON + tileset + 4 fondos parallax)
 * a partir de una definición en JSON y un TEMA de arte (tools/lib/level-themes.php).
 *
 * Uso (desde la raíz):  php tools/build-level.php tools/config/level-casco-viejo.json
 *                       php tools/build-level.php --all      (todos los tools/config/level-*.json)
 *
 * El map.json resultante se puede abrir y seguir editando en Tiled (https://www.mapeditor.org/).
 * Para usar arte propio, reemplaza los PNG de content/maps/<id>/ (mismos nombres y tamaños).
 */
if (PHP_SAPI !== 'cli') { exit("Solo CLI\n"); }
if (!extension_loaded('gd')) { fwrite(STDERR, "Falta la extensión GD de PHP.\n"); exit(1); }
require_once __DIR__ . '/lib/level-themes.php';

$root = realpath(__DIR__ . '/..');
$args = array_slice($argv, 1);
if ($args === ['--all']) $args = glob(__DIR__ . '/config/level-*.json');
if (!$args) { fwrite(STDERR, "Uso: php tools/build-level.php tools/config/level-<id>.json | --all\n"); exit(1); }
foreach ($args as $cfgPath) build_level($root, $cfgPath);

function build_level($root, $cfgPath)
{
    $cfg = is_file($cfgPath) ? json_decode(file_get_contents($cfgPath), true) : null;
    if (!is_array($cfg)) { fwrite(STDERR, "Definición inválida: $cfgPath\n"); exit(1); }
    $ts = 32;
    $MW = $cfg['width'];
    $MH = $cfg['height'];
    $outDir = $root . '/' . $cfg['output'];
    if (!is_dir($outDir)) mkdir($outDir, 0775, true);
    $paint = theme_painters($cfg['theme']);

    // ---------- Tileset (8 tiles) ----------
    $tiles = px_new(T * 8, T);
    $paint['tiles']($tiles);
    imagepng(px_upscale($tiles, 2), $outDir . '/tileset.png', 9);

    // ---------- Fondos parallax ----------
    $layers = [
        ['bg-sky', 0.05, 'sky', true],
        ['bg-far', 0.2, 'far', false],
        ['bg-mid', 0.45, 'mid', false],
        ['bg-near', 0.7, 'near', false],
    ];
    foreach ($layers as $l) {
        $im = px_new(LW, LH);
        $paint[$l[2]]($im);
        imagepng(px_upscale($im, 2), $outDir . '/' . $l[0] . '.png', 9);
    }

    // ---------- Capa de tiles ----------
    $data = array_fill(0, $MW * $MH, 0);
    $set = function ($col, $row, $gid) use (&$data, $MW, $MH) {
        if ($col >= 0 && $col < $MW && $row >= 0 && $row < $MH) $data[$row * $MW + $col] = $gid;
    };
    $surfaceGid = ['ground' => [1, 2], 'hazard' => [5, 8], 'slow' => [7, 2]];
    foreach ($cfg['ground'] as $g) {
        $s = $surfaceGid[$g['surface'] ?? 'ground'];
        for ($col = $g['from']; $col <= $g['to']; $col++) {
            $set($col, $g['top'], $s[0]);
            for ($row = $g['top'] + 1; $row < $MH; $row++) $set($col, $row, $s[1]);
        }
    }
    foreach ($cfg['platforms'] as $p) {
        $gid = ($p['type'] ?? 'platform') === 'bounce' ? 6 : 3;
        for ($i = 0; $i < $p['length']; $i++) $set($p['col'] + $i, $p['row'], $gid);
    }
    foreach ($cfg['crates'] as $cr) $set($cr[0], $cr[1], 4);

    // ---------- Capa de objetos (apariciones, arena y jefe) ----------
    $objects = [];
    $oid = 1;
    foreach ($cfg['spawns'] as $s) {
        $props = [];
        foreach ($s as $k => $v) {
            if (in_array($k, ['type', 'col', 'row'], true)) continue;
            $props[] = ['name' => $k, 'type' => tiled_type($v), 'value' => $v];
        }
        $objects[] = [
            'id' => $oid++, 'name' => $s['type'] . '_spawn', 'type' => $s['type'], 'class' => $s['type'],
            'x' => $s['col'] * $ts + $ts / 2, 'y' => ($s['row'] + 1) * $ts, 'width' => 0, 'height' => 0,
            'point' => true, 'rotation' => 0, 'visible' => true, 'properties' => $props,
        ];
    }

    $tiledProps = [];
    foreach ($cfg['properties'] as $k => $v) {
        if (is_array($v)) $v = implode("\n", $v); // textos de varias líneas
        $tiledProps[] = ['name' => $k, 'type' => tiled_type($v), 'value' => $v];
    }

    $b = function ($n, $v) { return ['name' => $n, 'type' => 'bool', 'value' => $v]; };
    $hz = $cfg['hazardDamage'] ?? 12;
    $tileProps = [
        [$b('collides', true)],
        [$b('collides', true)],
        [$b('collides', true), $b('oneWay', true)],
        [$b('collides', true)],
        [$b('collides', true), ['name' => 'hazard', 'type' => 'int', 'value' => $hz]],
        [$b('collides', true), $b('oneWay', true), ['name' => 'bounce', 'type' => 'int', 'value' => $cfg['bounce'] ?? 860]],
        [$b('collides', true), ['name' => 'slow', 'type' => 'float', 'value' => $cfg['slow'] ?? 0.5]],
        [$b('collides', true)],
    ];
    $tilesDef = [];
    foreach ($tileProps as $i => $props) $tilesDef[] = ['id' => $i, 'properties' => $props];

    $imageLayer = function ($id, $name, $parallax) {
        return ['id' => $id, 'name' => $name, 'type' => 'imagelayer', 'image' => $name . '.png', 'repeatx' => true,
            'parallaxx' => $parallax, 'parallaxy' => 1, 'opacity' => 1, 'visible' => true,
            'x' => 0, 'y' => 0, 'offsetx' => 0, 'offsety' => 0];
    };
    $mapLayers = [];
    foreach ($layers as $i => $l) $mapLayers[] = $imageLayer($i + 1, $l[0], $l[1]);
    $mapLayers[] = ['id' => 5, 'name' => 'ground', 'type' => 'tilelayer', 'width' => $MW, 'height' => $MH, 'data' => $data,
        'opacity' => 1, 'visible' => true, 'x' => 0, 'y' => 0];
    $mapLayers[] = ['id' => 6, 'name' => 'spawns', 'type' => 'objectgroup', 'draworder' => 'topdown', 'objects' => $objects,
        'opacity' => 1, 'visible' => true, 'x' => 0, 'y' => 0];

    $map = [
        'type' => 'map', 'version' => '1.10', 'tiledversion' => '1.10.2',
        'orientation' => 'orthogonal', 'renderorder' => 'right-down', 'infinite' => false,
        'width' => $MW, 'height' => $MH, 'tilewidth' => $ts, 'tileheight' => $ts,
        'nextlayerid' => 7, 'nextobjectid' => $oid, 'compressionlevel' => -1,
        'properties' => $tiledProps,
        'tilesets' => [[
            'firstgid' => 1, 'name' => 'tileset', 'image' => 'tileset.png',
            'imagewidth' => $ts * 8, 'imageheight' => $ts, 'tilewidth' => $ts, 'tileheight' => $ts,
            'tilecount' => 8, 'columns' => 8, 'margin' => 0, 'spacing' => 0,
            'tiles' => $tilesDef,
        ]],
        'layers' => $mapLayers,
    ];
    file_put_contents($outDir . '/map.json', json_encode($map, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n");
    echo "Nivel generado en {$cfg['output']}/ (map.json, tileset.png, bg-sky/far/mid/near.png)\n";
}

function tiled_type($v)
{
    if (is_bool($v)) return 'bool';
    if (is_int($v)) return 'int';
    if (is_float($v)) return 'float';
    return 'string';
}
