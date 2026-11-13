# Delta de especificación: Audio

## AGREGADO

### Requisito: Desbloqueo
El audio DEBE desbloquearse con el primer toque, clic o tecla.

#### Escenario: iOS
- DADO un iPhone recién cargado el juego
- CUANDO el usuario toca la pantalla
- ENTONCES los efectos posteriores se oyen

### Requisito: Efectos
`AudioManager` DEBE reproducir los efectos `shoot`, `jump`, `hit`, `explosion`, `death`, `ui` y `victory`, usando el archivo declarado en `audio.json` o, si no existe, su versión sintetizada; repeticiones del mismo efecto en menos de 45 ms DEBEN ignorarse.

#### Escenario: Sin archivos
- DADO `audio.json` sin efectos declarados
- CUANDO el jugador dispara
- ENTONCES suena el disparo sintetizado

### Requisito: Música por escena
`AudioManager` DEBE iniciar la música asociada a la escena (o a la propiedad `music` del mapa) solo si su archivo existe, cargando `.ogg` y `.mp3`.

#### Escenario: Música no disponible
- DADO `sceneMusic.Menu = "menu"` sin archivo declarado
- CUANDO se abre el menú
- ENTONCES no suena música y no hay errores en consola

### Requisito: Volumen y silencio
El sistema DEBE ofrecer volumen independiente de música y efectos y un silencio global (tecla M, botón del HUD y opción del menú), sin persistirlo.

#### Escenario: Silenciar
- DADO el sonido activo
- CUANDO se pulsa M
- ENTONCES no se oye ningún sonido y el menú/HUD lo reflejan

## MODIFICADO

(ninguno)

## ELIMINADO

(ninguno)
