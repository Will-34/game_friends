# Delta de especificación: Personajes (Fighter)

## AGREGADO

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

## MODIFICADO

(ninguno)

## ELIMINADO

(ninguno)
