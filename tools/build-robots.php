<?php
/**
 * build-robots.php — Genera los robots enemigos en content/bosses/:
 *   robot-guardian/  (jefe final, E6): spritesheet.png (15 cuadros de 160×176), drone.png, character.json
 *   mini-robot/      (invocado por los jefes): spritesheet.png (11 cuadros de 56×60), character.json
 *
 * Uso (desde la raíz):  php tools/build-robots.php
 * Los character.json de content/bosses/ los escribe esta herramienta (se sobrescriben enteros):
 * para ajustar valores, edita este archivo y vuelve a ejecutarlo.
 */
if (PHP_SAPI !== 'cli') { exit("Solo CLI\n"); }
if (!extension_loaded('gd')) { fwrite(STDERR, "Falta la extensión GD de PHP.\n"); exit(1); }
require_once __DIR__ . '/lib/robot-art.php';

$root = realpath(__DIR__ . '/..');

/** Animación con origen en los pies. */
function anim($frames, $fps, $loop)
{
    return ['frames' => $frames, 'fps' => $fps, 'loop' => $loop, 'origin' => [0.5, 1], 'offset' => [0, 0], 'placeholder' => false];
}

function save_json($path, $data)
{
    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n");
}

// ------------------------------------------------------------------ Robot Guardián
$dir = "$root/content/bosses/robot-guardian";
if (!is_dir($dir)) mkdir($dir, 0775, true);
$frames = rg_frames();
$im = px_new(RG_W * count($frames), RG_H);
foreach ($frames as $i => $p) {
    if ($p === 'wreck') rg_wreck($im, $i * RG_W);
    else rg_frame($im, $i * RG_W, $p);
}
imagepng(px_upscale($im, 2), "$dir/spritesheet.png", 9);
$dr = px_new(48, 20);
rg_drone($dr, 0, 0);
rg_drone($dr, 24, 1);
imagepng(px_upscale($dr, 2), "$dir/drone.png", 9);

save_json("$dir/character.json", [
    'id' => 'robot-guardian',
    'name' => 'Robot Guardián',
    'archetype' => 'Jefe final',
    'description' => 'El robot gigante que secuestró a Henry. Lanzamisiles, cañón, láser y núcleo en el pecho.',
    'placeholder' => false,
    'credits' => 'Arte generado por código (tools/build-robots.php).',
    'canBeEnemy' => false,
    'bossScale' => 1,
    'stats' => ['maxHealth' => 150, 'speed' => 85, 'jumpVelocity' => 0, 'fireRateMs' => 240, 'bulletSpeed' => 560, 'bulletDamage' => 12],
    'body' => ['width' => 76, 'height' => 164],
    'crouchBody' => ['width' => 76, 'height' => 164],
    'muzzle' => ['stand' => ['x' => 80, 'y' => -94], 'crouch' => ['x' => 80, 'y' => -94], 'up' => ['x' => 0, 'y' => -176]],
    'ability' => null,
    'enemyAbility' => null,
    'taunt' => ['label' => 'ERROR', 'color' => '#ff3b3b'],
    'bossAttacks' => [
        '_comment' => 'Patrones del Robot Guardián (src/systems/RobotBossDirector.js). Listas = valor por fase 1, 2 y 3 (0 = no lo usa).',
        'armor' => 0.6,
        'weakPoint' => ['everyMs' => [10000, 9000, 7500], 'durationMs' => 3200, 'damageTakenMul' => 2.2],
        'missiles' => ['everyMs' => [5200, 4200, 3400], 'count' => [3, 4, 5], 'flightMs' => 1100],
        'laser' => ['everyMs' => [0, 7500, 6000], 'warnMs' => 1000, 'beamMs' => 500, 'damage' => 25],
        'shockwave' => ['everyMs' => [0, 0, 5500], 'speed' => 430, 'damage' => 22],
        'minions' => [0, 2, 3],
    ],
    'drone' => [
        'name' => 'Dron Centinela', 'description' => 'Esfera de vigilancia con visor rojo.', 'bulletColor' => '#ff3b3b',
        'cooldownMs' => 16000, 'params' => ['durationMs' => 8000, 'fireRateMs' => 340, 'range' => 520, 'damage' => 7, 'bulletSpeed' => 560],
        'image' => 'drone.png', 'frameWidth' => 48, 'frameHeight' => 40, 'frameCount' => 2,
    ],
    'spritesheet' => 'spritesheet.png',
    'frameWidth' => RG_W * 2,
    'frameHeight' => RG_H * 2,
    'animations' => [
        'idle' => anim([0, 1], 3, true),
        'run' => anim([2, 3, 4, 5], 6, true),
        'jump' => anim([0], 1, false),
        'fall' => anim([0], 1, false),
        'crouch' => anim([0], 1, false),
        'crouch_fire' => anim([6, 7], 10, true),
        'fire' => anim([6, 7], 10, true),
        'fire_up' => anim([6], 1, true),
        'hurt' => anim([8], 8, false),
        'special' => anim([9, 10], 6, true),
        'grenade' => anim([11], 3, false),
        'death' => anim([12, 13, 14], 3, false),
        'victory' => anim([0, 1], 3, true),
    ],
]);
echo "Robot Guardián generado en content/bosses/robot-guardian/\n";

// ------------------------------------------------------------------ Mini-robot
$dir = "$root/content/bosses/mini-robot";
if (!is_dir($dir)) mkdir($dir, 0775, true);
$frames = mr_frames();
$im = px_new(MR_W * count($frames), MR_H);
foreach ($frames as $i => $p) mr_frame($im, $i * MR_W, $p);
imagepng(px_upscale($im, 2), "$dir/spritesheet.png", 9);
save_json("$dir/character.json", [
    'id' => 'mini-robot',
    'name' => 'Mini-Robot',
    'archetype' => 'Esbirro',
    'description' => 'Robot pequeño que invocan los jefes.',
    'placeholder' => false,
    'credits' => 'Arte generado por código (tools/build-robots.php).',
    'canBeEnemy' => false,
    'stats' => ['maxHealth' => 45, 'speed' => 150, 'jumpVelocity' => 520, 'fireRateMs' => 320, 'bulletSpeed' => 540, 'bulletDamage' => 7],
    'body' => ['width' => 30, 'height' => 50],
    'crouchBody' => ['width' => 30, 'height' => 50],
    'muzzle' => ['stand' => ['x' => 28, 'y' => -30], 'crouch' => ['x' => 28, 'y' => -30], 'up' => ['x' => 0, 'y' => -60]],
    'ability' => null,
    'enemyAbility' => null,
    'taunt' => ['label' => 'BIP', 'color' => '#ff5a5a'],
    'spritesheet' => 'spritesheet.png',
    'frameWidth' => MR_W * 2,
    'frameHeight' => MR_H * 2,
    'animations' => [
        'idle' => anim([0, 1], 4, true),
        'run' => anim([2, 3, 4, 5], 10, true),
        'jump' => anim([2], 1, false),
        'fall' => anim([3], 1, false),
        'crouch' => anim([0], 1, false),
        'crouch_fire' => anim([6, 7], 10, true),
        'fire' => anim([6, 7], 10, true),
        'fire_up' => anim([6], 1, true),
        'hurt' => anim([8], 8, false),
        'special' => anim([0], 1, false),
        'grenade' => anim([0], 1, false),
        'death' => anim([9, 10], 4, false),
        'victory' => anim([0, 1], 4, true),
    ],
]);
echo "Mini-robot generado en content/bosses/mini-robot/\n";
