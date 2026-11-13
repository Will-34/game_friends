# Propuesta: e0-fundaciones

- **Épica:** E0 Fundaciones · **Historias:** H-001 a H-010
- **Estado:** Archivado (2026-11-13). Aprobado de antemano en el prompt inicial.

## Por qué

El proyecto parte de cero y debe poder crecer con contenido guiado por datos, desplegarse en un servidor solo PHP y ser trabajado por personas e IAs con reglas comunes.

## Qué

- Estructura de carpetas, `index.php`, CSS, Phaser local (v4.2.1).
- Catálogo de contenido `api/catalog.php` con respaldo `content/catalog.json`.
- Herramientas PHP CLI: recorte de sprites, mapa de prueba Tiled, regeneración del catálogo.
- Documentación (AGENTS, README, GDD, ARQUITECTURA, guías, CHECKLIST, ADRs), OpenSpec manual y git.

## Alcance

H-001 a H-009.

## Fuera de alcance

- H-007 despliegue de prueba (requiere acceso al servidor: bloqueado).
- H-010 incorporación de `requisitos-v2.md` (archivo ausente: bloqueado).
- Cualquier funcionalidad de juego (E1).

## Resultado de pruebas

- `php -l` sin errores en `index.php`, `api/catalog.php`, `api/lib/catalog-lib.php`.
- `api/catalog.php` responde JSON con 1 personaje y 1 mapa (PHP 8.0.30).
- Respaldo verificado bloqueando `api/catalog.php` en el navegador: el juego carga con `catálogo: fallback`.
- `tools/sprite-cutter.php` genera 49 cuadros sin recortes; avisos de cuadros faltantes registrados (H-024).
