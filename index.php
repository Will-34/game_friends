<?php
/**
 * index.php — Punto de entrada del juego RESCATANDO A HENRY.
 * PHP solo sirve esta página; el juego corre 100 % en el navegador.
 */
header('Content-Type: text/html; charset=utf-8');
// Versión para invalidar la caché del navegador al desplegar (cambiar al publicar).
$assetVersion = '0.2.0';
?><!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#0b0f17">
    <title>Rescatando a Henry</title>
    <link rel="icon" type="image/png" href="favicon.png">
    <link rel="stylesheet" href="css/game.css?v=<?= $assetVersion ?>">
</head>
<body>
    <div id="game"></div>
    <noscript>Este juego necesita JavaScript.</noscript>
    <script src="lib/phaser.min.js?v=4.2.1"></script>
    <script type="module" src="src/main.js?v=<?= $assetVersion ?>"></script>
</body>
</html>
