<?php
/**
 * catalog-lib.php — Construye el catálogo de contenido (personajes y mapas)
 * recorriendo content/characters/ y content/maps/. Compatible con PHP 7.4 y 8.x.
 * Lo usan api/catalog.php (en vivo) y tools/build-catalog.php (genera content/catalog.json).
 */

/**
 * @param string $contentDir Ruta absoluta a la carpeta content/
 * @return array
 */
function build_catalog($contentDir)
{
    $catalog = array(
        'version' => 1,
        'characters' => array(),
        'maps' => array(),
        'warnings' => array(),
    );

    // ---- Personajes ----
    foreach (list_subdirs($contentDir . '/characters') as $id) {
        $file = $contentDir . '/characters/' . $id . '/character.json';
        $data = read_json_file($file);
        if ($data === null) {
            $catalog['warnings'][] = "characters/$id: character.json ausente o inválido";
            continue;
        }
        $catalog['characters'][] = array(
            'id' => $id,
            'name' => isset($data['name']) ? (string)$data['name'] : $id,
            'path' => 'content/characters/' . $id . '/',
            'placeholder' => !empty($data['placeholder']),
        );
    }

    // ---- Mapas (formato Tiled JSON) ----
    foreach (list_subdirs($contentDir . '/maps') as $id) {
        $file = $contentDir . '/maps/' . $id . '/map.json';
        $data = read_json_file($file);
        if ($data === null) {
            $catalog['warnings'][] = "maps/$id: map.json ausente o inválido";
            continue;
        }
        $name = $id;
        if (isset($data['properties']) && is_array($data['properties'])) {
            foreach ($data['properties'] as $p) {
                if (isset($p['name'], $p['value']) && $p['name'] === 'name') {
                    $name = (string)$p['value'];
                }
            }
        }
        $catalog['maps'][] = array(
            'id' => $id,
            'name' => $name,
            'path' => 'content/maps/' . $id . '/',
        );
    }

    return $catalog;
}

/** Lista subcarpetas válidas (id en minúsculas, números, guiones y guion bajo), ordenadas. */
function list_subdirs($dir)
{
    $out = array();
    if (!is_dir($dir)) {
        return $out;
    }
    foreach (scandir($dir) as $entry) {
        if ($entry === '.' || $entry === '..') {
            continue;
        }
        if (!preg_match('/^[a-z0-9_-]+$/', $entry)) {
            continue;
        }
        if (is_dir($dir . '/' . $entry)) {
            $out[] = $entry;
        }
    }
    sort($out);
    return $out;
}

/** Lee y decodifica un JSON; devuelve null si no existe o es inválido. */
function read_json_file($file)
{
    if (!is_file($file)) {
        return null;
    }
    $data = json_decode((string)file_get_contents($file), true);
    return is_array($data) ? $data : null;
}
