# Fase 1 · Los estados y sus datos

El módulo tiene **una** máquina de estados, y todo lo demás cuelga de ella. Los nombres de código
van en inglés (convención); acá se explican en castellano.

## Los estados

| estado | qué significa | qué ve el operador |
|---|---|---|
| `resolving` | Todavía no se sabe si hay sesión | **Nada**, hasta pasado el umbral; después, un indicador |
| `anonymous` | No hay sesión | Se va al proveedor |
| `active` | Hay sesión y hay capacidades | La aplicación |
| `unauthorized` | **Entró, y no tiene ninguna capacidad acá** | Pantalla propia. **No redirige** |
| `expiring` | La renovación falló; se pide volver a entrar | El diálogo con su botón |
| `waiting` | La ventana está abierta | La pantalla, bloqueada y visible |
| `ended` | Se acabó: plazo vencido, salida, o sujeto distinto | Se descarta y se recarga |

### Las transiciones que importan

```
resolving → anonymous | active | unauthorized

active → expiring          la renovación no se pudo (CU-8)
expiring → waiting         el operador apretó el botón
waiting → active           volvió, y es el mismo sujeto
waiting → ended            volvió otro sujeto · se cerró la ventana sin entrar ·
                           venció el plazo de dos minutos
active → ended             se cerró sesión, acá o en otra aplicación (CU-12)
```

**`unauthorized` no tiene salida hacia el proveedor.** Es la única prohibición dura de la máquina, y
existe porque el camino natural —«no tiene permisos, mandalo a entrar»— es un bucle infinito.

**`ended` es terminal.** No se vuelve a `active` sin recargar el documento. Eso es lo que garantiza
que no queda nada de la sesión anterior en memoria (CU-9).

## Lo que se guarda

### La sesión viva

| | |
|---|---|
| `state` | Uno de los siete de arriba |
| `subject` | El `sub` del token. **Lo único que se compara** para saber si volvió otra persona |
| `claims` | Lo que el token trae, sin interpretar |
| `capabilities` | Lo que devolvió la función de la aplicación. El módulo no las lee, sólo mira si está vacío |

**No hay campo para el token.** No es un olvido: la puerta autoriza pedidos, así que nada fuera del
proveedor necesita verlo, y no exponerlo es lo que hace que «una pantalla no pueda obtener un token»
sea una verdad del tipo y no una convención (CU-10).

### La configuración, leída al arrancar

| | por omisión |
|---|---|
| `issuer` | — · **obligatorio** |
| `clientId` | — · **obligatorio** |
| `storage` | `memory` · la otra opción es `sessionStorage` (CU-15) |
| `reentryTimeout` | 2 minutos (CU-9) |
| `idleTimeout` | **apagado** (CU-9) |
| `toCapabilities` | — · **obligatoria**, la da la aplicación |

**Si falta un obligatorio, la aplicación no arranca y lo dice** (CU-17). No sigue con un valor por
omisión hasta fallar en el primer pedido con un `401` que manda a buscar el problema donde no está.

## Lo que NO es una entidad de este módulo

**Las capacidades.** El módulo las transporta y nunca las interpreta (principio III).

**El usuario.** No hay perfil, ni nombre, ni foto: hay claims. Lo que la barra muestra lo arma la
aplicación con lo que el token trajo.

**El token.** No se modela porque no se expone.
