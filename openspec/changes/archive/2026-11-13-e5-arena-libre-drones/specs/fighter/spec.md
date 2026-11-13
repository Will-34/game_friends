# Delta de especificación: Personajes (Fighter)

## AGREGADO

### Requisito: Dron propio
Todo personaje DEBE poder lanzar su dron con la acción `drone`: un dron que lo sigue y dispara solo al hostil más cercano durante `params.durationMs`, con recarga `cooldownMs` (20 s por defecto) y listo al empezar la partida. El aspecto, el nombre y el color de bala DEBEN venir de `character.json → drone` (`image`, `frameWidth`, `frameHeight`, `frameCount`, `name`, `bulletColor` o `rainbow`, `params`); un personaje sin `drone` DEBE usar un dron genérico. El HUD DEBE mostrar si está listo o cuántos segundos faltan.

#### Escenario: Lata de Pablo
- DADO Pablo con el dron listo
- CUANDO pulsa E
- ENTONCES aparece la "Lata Voladora" (lata verde con hélice), dispara balas verdes y el HUD muestra "Lata Voladora: 20 s"

#### Escenario: Recarga
- DADO un dron lanzado hace 5 s
- CUANDO se vuelve a pulsar E
- ENTONCES no sale otro dron

## MODIFICADO

(ninguno)

## ELIMINADO

(ninguno)
