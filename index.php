<?php
/**
 * index.php — Punto de entrada del juego RESCATANDO A HENRY.
 * PHP solo sirve esta página; el juego corre 100 % en el navegador.
 */
header('Content-Type: text/html; charset=utf-8');
// Versión para invalidar la caché del navegador al desplegar (cambiar al publicar).
$assetVersion = '1.0.2';
// URL absoluta de la carpeta del juego (las vistas previas de WhatsApp/Facebook exigen URLs absolutas).
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
$baseUrl = ($https ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/') . '/';
$baseUrl = htmlspecialchars($baseUrl, ENT_QUOTES);
?><!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Game Ficct">
    <meta name="theme-color" content="#0b0f17">
    <title>Game Ficct · Rescatando a Henry</title>
    <meta name="description" content="Acción arcade 2D hecha en Santa Cruz: elige a tu cuate y rescata a Henry.">
    <!-- Vista previa al compartir el enlace (Open Graph / Twitter). Imagen: tools/build-share-image.php -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Game Ficct">
    <meta property="og:title" content="Game Ficct">
    <meta property="og:description" content="Rescatando a Henry: acción arcade 2D en Santa Cruz. ¡Elige a tu cuate y juega!">
    <meta property="og:url" content="<?= $baseUrl ?>">
    <meta property="og:image" content="<?= $baseUrl ?>icons/share.jpg?v=<?= $assetVersion ?>">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Game Ficct: los personajes del juego en el Casco Viejo">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="icon" type="image/png" href="favicon.png">
    <link rel="apple-touch-icon" href="icons/icon-192.png">
    <link rel="manifest" href="manifest.webmanifest">
    <link rel="stylesheet" href="css/game.css?v=<?= $assetVersion ?>">
</head>
<body>
    <div id="game"></div>
    <div id="rotate-overlay" role="alert">
        <div class="phone" aria-hidden="true"></div>
        <h1>GIRA TU DISPOSITIVO</h1>
        <p>Rescatando a Henry se juega en horizontal.</p>
        <small>Consejo: en Android, al tocar JUGAR se activa la pantalla completa en horizontal. En iPhone, desactiva el bloqueo de rotación y gira el teléfono. También puedes «Añadir a pantalla de inicio».</small>
    </div>
    <noscript>Este juego necesita JavaScript.</noscript>
    <script src="lib/phaser.min.js?v=4.2.1"></script>
    <script type="module" src="src/main.js?v=<?= $assetVersion ?>"></script>
</body>
</html>
