# Delta de especificación: Niveles

## AGREGADO

### Requisito: Personaje capturado
Un mapa con la propiedad `captive` (id de personaje) DEBE mostrar a ese personaje enjaulado sobre los hombros del jefe durante el combate, pidiendo ayuda con globos de diálogo, sin recibir daño. Al vencer al jefe, la jaula DEBE romperse y el personaje DEBE saltar al suelo, celebrar (animación `victory`) y agradecer. Si el protagonista es ese personaje, NO DEBE aparecer capturado.

#### Escenario: Liberar a Henry
- DADO el jefe con Henry enjaulado
- CUANDO el jefe cae
- ENTONCES la jaula se rompe, Henry salta al suelo, celebra y dice "¡Gracias, changos! ¡Soy libre!"

## MODIFICADO

### Requisito: Jefe
El jefe DEBE ser un personaje al azar (nunca el protagonista, Henry ni los aliados), con escala ×1,5, nombre en lila, vida = vida base × `bossHealth` (8, 11 y 14 en los niveles 1-3), barra en el HUD, frase `bossTaunt` y su propio dron, que lanza cuando tiene a alguien cerca. Al bajar al 50 % DEBE enfurecerse (más agresivo, usa su habilidad, el dron se recarga antes) y llamar `bossReinforcements` refuerzos. Al vencerlo, las escoltas restantes DEBEN caer y el nivel DEBE darse por superado. Al reintentar, el jefe DEBE empezar de nuevo sin enfurecer.

#### Escenario: Fase 2
- DADO el jefe con más de la mitad de vida
- CUANDO baja del 50 %
- ENTONCES aparece "¡… SE PICÓ!", la barra se vuelve roja y llegan refuerzos

#### Escenario: Dron del jefe
- DADO el combate contra el jefe con el protagonista cerca
- CUANDO el dron del jefe está listo
- ENTONCES el jefe lanza su dron, que dispara al hostil más cercano

## ELIMINADO

(ninguno)
