<?php
/**
 * GET api/catalog.php — Devuelve en JSON el catálogo de personajes y mapas disponibles.
 * Si este endpoint falla, el juego usa content/catalog.json como respaldo.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/lib/catalog-lib.php';

try {
    $catalog = build_catalog(dirname(__DIR__) . '/content');
    echo json_encode($catalog, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(array('error' => 'No se pudo construir el catálogo'));
}
