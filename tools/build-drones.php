<?php
/**
 * build-drones.php — Genera el dron temático de cada personaje (content/characters/<id>/drone.png,
 * 2 cuadros de 48×40) y registra el bloque "drone" en su character.json.
 *
 * Uso (desde la raíz):  php tools/build-drones.php            (todos)
 *                       php tools/build-drones.php pablo henry (solo esos)
 *
 * En character.json se actualizan los campos técnicos (image, frameWidth, frameHeight, frameCount)
 * y los de diseño (name, description, bulletColor, cooldownMs, params) solo si faltan, para que se
 * puedan ajustar a mano sin que esta herramienta los pise.
 */
if (PHP_SAPI !== 'cli') { exit("Solo CLI\n"); }
if (!extension_loaded('gd')) { fwrite(STDERR, "Falta la extensión GD de PHP.\n"); exit(1); }
require_once __DIR__ . '/lib/drone-art.php';

$root = realpath(__DIR__ . '/..');
$designs = drone_designs();
$ids = array_slice($argv, 1) ?: array_keys($designs);
$frames = 2;

foreach ($ids as $id) {
    $dir = "$root/content/characters/$id";
    $charPath = "$dir/character.json";
    if (!is_file($charPath)) { fwrite(STDERR, "Sin character.json: $id (se omite)\n"); continue; }
    $im = px_new(DW * $frames, DH);
    $ok = true;
    for ($f = 0; $f < $frames; $f++) $ok = drone_paint($id, $im, $f * DW, $f) && $ok;
    if (!$ok) { fwrite(STDERR, "Sin diseño de dron para: $id (usará el genérico)\n"); continue; }
    imagepng(px_upscale($im, 2), "$dir/drone.png", 9);

    $char = json_decode(file_get_contents($charPath), true);
    $drone = isset($char['drone']) && is_array($char['drone']) ? $char['drone'] : [];
    $drone = array_merge($designs[$id] ?? [], $drone, [
        'image' => 'drone.png', 'frameWidth' => DW * 2, 'frameHeight' => DH * 2, 'frameCount' => $frames,
    ]);
    $char['drone'] = $drone;
    file_put_contents($charPath, json_encode($char, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n");
    echo "Dron de $id: {$drone['name']}\n";
}
