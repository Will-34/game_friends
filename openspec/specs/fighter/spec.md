# Capacidad: Personajes (Fighter)

## Propósito

Una clase base común para cualquier personaje, independiente de su rol.

## Requisitos

### Requisito: Identidad desde datos
Un Fighter DEBE tomar stats, cuerpo físico (`body`, `crouchBody`), bocas del arma (`muzzle`), animaciones y efectos de su `character.json`, y usar `idle` cuando falte una animación.

#### Escenario: Cuerpo sobre los pies
- DADO cualquier `origin` en la animación actual
- CUANDO el Fighter cambia de animación
- ENTONCES su cuerpo físico sigue centrado horizontalmente sobre los pies y apoyado en ellos

### Requisito: Rol asignado en ejecución
`CharacterRoleManager` DEBE asignar el rol (`PLAYER`, `ENEMY`, `ALLY`, `RESCUE_TARGET`), del que se deriva el bando y modificadores; los proyectiles DEBEN dañar solo a bandos hostiles.

#### Escenario: Mismo personaje, rol enemigo
- DADO Plata con rol ENEMY
- CUANDO es creado
- ENTONCES pertenece al bando `enemies`, tiene la mitad de vida y tinte rojizo, y sus balas no dañan a otros enemigos

### Requisito: Movimiento
Un Fighter DEBE correr según `moveX`, saltar solo en el suelo (con salto variable al soltar), agacharse en el suelo sin avanzar y voltearse según la dirección.

#### Escenario: Salto variable
- DADO un Fighter subiendo tras saltar
- CUANDO se suelta el botón de salto
- ENTONCES su velocidad de subida se reduce

### Requisito: Disparo
Un Fighter DEBE disparar respetando su cadencia, horizontalmente (de pie o agachado) o hacia arriba con `aimUp`, desde la boca del arma correspondiente, usando la reserva de proyectiles.

#### Escenario: Disparo agachado
- DADO un Fighter agachado
- CUANDO mantiene `shoot`
- ENTONCES reproduce `crouch_fire` y las balas salen desde `muzzle.crouch`

### Requisito: Daño y muerte
Un Fighter DEBE perder vida al recibir daño, aturdirse e invulnerabilizarse según su rol (parpadeando), y al llegar a 0 reproducir `death` y emitir `fighter-died`.

#### Escenario: Enemigo derrotado
- DADO un enemigo con 50 de vida
- CUANDO recibe 5 balas de 10
- ENTONCES muere, reproduce `death`, suelta humo y desaparece

### Requisito: Reserva de proyectiles
Los proyectiles DEBEN reutilizarse (object pooling) y desactivarse al chocar, al expirar o al salir de la vista.

#### Escenario: Bala fuera de pantalla
- DADO una bala activa
- CUANDO sale de la vista de la cámara
- ENTONCES vuelve a la reserva

### Requisito: Fogonazo
Un Fighter DEBE mostrar al disparar el fogonazo de su lámina (`effects.frames.muzzle`) o, si no lo tiene, un fogonazo genérico.

#### Escenario: Personaje sin fogonazo propio
- DADO Will, cuya lámina no trae fogonazo
- CUANDO dispara
- ENTONCES se ve el fogonazo genérico en la boca del arma

### Requisito: Habilidad especial
Un Fighter DEBE acumular 0,5 de carga por baja y, con la carga completa, activar su habilidad con la acción `special` (animación `special`, aviso con el nombre y efecto según `ability.type`/`params`). Las mejoras temporales (buffs) DEBEN caducar solas.

#### Escenario: Bandera de Poder
- DADO Henry con 2 bajas
- CUANDO pulsa L
- ENTONCES reproduce `special`, muestra "¡BANDERA DE PODER!", gana velocidad y daño durante 8 s con aura arcoíris y su carga vuelve a 0

### Requisito: Granadas
Un Fighter DEBE poder lanzar granadas con la acción `grenade` mientras le queden; la granada DEBE explotar al cumplir la mecha o al tocar a un hostil y dañar en área a los hostiles.

#### Escenario: Granada contra un grupo
- DADO un grupo de 3 enemigos a 150 px
- CUANDO el jugador lanza una granada hacia ellos
- ENTONCES los tres pierden vida y el contador de granadas baja en 1

### Requisito: Nombre visible
Todo Fighter DEBE mostrar su nombre sobre la cabeza; los que no son el protagonista, también una mini barra de vida.

#### Escenario: Identificar enemigos
- DADO un enemigo Will de dificultad difícil
- CUANDO aparece en pantalla
- ENTONCES se ve "WILL" en rojo sobre él con su barra de vida

### Requisito: Armas e inventario
Un Fighter DEBE disparar con su arma actual (valores de `weapons.json`; la pistola con sus propios stats), gastar munición si es limitada, volver a la pistola al agotarla y cambiar de arma con `switchWeapon`.

#### Escenario: Escopeta
- DADO el protagonista con la escopeta (24 cartuchos)
- CUANDO dispara una vez
- ENTONCES salen 6 perdigones en abanico y quedan 23 cartuchos
