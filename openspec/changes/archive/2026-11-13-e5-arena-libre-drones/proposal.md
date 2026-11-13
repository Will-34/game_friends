# Propuesta: e5-arena-libre-drones

- **Épica:** E5 Mapas · **Historias:** H-064, H-065
- **Estado:** Archivado (2026-11-13). Pedido directo del usuario: "quita eso [el límite]… que sea posible esquivar a los enemigos… que todos tengan la opción de activar un dron… a Pablo una lata, a Henry un dron como su bandera… si puedes hazlo".

## Por qué

1. La barrera de la arena obligaba a eliminar a todos los enemigos del nivel para llegar al jefe. El usuario quiere poder esquivarlos y avanzar.
2. Solo Plata tenía dron (su habilidad). El usuario quiere que todos puedan lanzar un dron, cada uno con un diseño acorde a su personaje.

## Qué

1. **Arena libre (H-064):** sin barrera. El combate contra el jefe empieza al llegar al centro de la arena aunque queden enemigos del nivel. Una pared invisible cierra la arena por la izquierda solo para el protagonista, los aliados y el bando del jefe; los enemigos rezagados se quedan fuera y caen al vencer al jefe. El HUD cuenta solo a los enemigos del combate.
2. **Dron para todos (H-065):** acción abstracta nueva `drone` (tecla **E**, botón táctil **DRON**), con recarga de 20 s y listo al empezar. Cada personaje tiene su dron en `character.json → drone` (nombre, color de bala, parámetros) y su sprite `drone.png` generado por `tools/build-drones.php`:
   Carlos (Puro-Dron), Domeki (Canasta Voladora), Henry (Dron Arcoíris, con su bandera; balas de colores), Ignacio (Olla Voladora), Pablo (Lata Voladora), Plata (Dron Token), Reymar (Capucha Sombra), Ruddy (Dron Llorón J&J), Sergio (Bota Voladora), Will (Dron AFK).
   Los aliados también lanzan su dron. Los enemigos no (para no subir la dificultad).

## Fuera de alcance

- Un movimiento de esquiva nuevo (rodar o impulso): los personajes ya no chocan entre sí, así que se puede pasar saltando o corriendo entre los enemigos.
