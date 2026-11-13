<?php
/**
 * build-catalog.php — Regenera content/catalog.json (respaldo estático del catálogo).
 * Ejecutar cada vez que se agregue o quite un personaje o mapa:
 *   php tools/build-catalog.php
 */
if (PHP_SAPI !== 'cli') { exit("Solo CLI\n"); }
require_once __DIR__ . '/../api/lib/catalog-lib.php';

$root = realpath(__DIR__ . '/..');
$catalog = build_catalog($root . '/content');
file_put_contents($root . '/content/catalog.json',
    json_encode($catalog, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n");

echo "content/catalog.json: " . count($catalog['characters']) . " personajes, " . count($catalog['maps']) . " mapas\n";
foreach ($catalog['warnings'] as $w) echo "  aviso: $w\n";
