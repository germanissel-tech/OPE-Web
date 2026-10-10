# Cómo se comprueba · La identidad en el panel

**Carpeta**: `007-la-identidad-en-el-panel` · **Fecha**: 2026-10-09

Lo que una persona corre para ver que la feature hace lo que la spec dice. Las cifras de estado no
van acá: las informan `npm test` y `ope-check`.

## Lo que hace falta

- OPE-Backend al lado (`../backend`) en su `main` con la 041 unida y `npm run contract:types`
  corrido: deja `generated/contract/`.
- El operador de desarrollo de `config/dev-operators.json` del backend (tiene `displayName`) y su
  token.
- Granito en su carpeta hermana de Tandilia, sólo lectura.

```sh
# en ope/mvp/web
npm run contract:sync      # copia los ocho archivos; no emite nada
npm test                   # ope-check, pruebas de core, session y console
```

## Contra el backend real

```sh
# terminal 1 — en ope/mvp/backend
npm run dev

# terminal 2 — en ope/mvp/web
npm run dev
```

Abrir `http://localhost:5173/?dev.bearer=1`, pegar el token del operador de desarrollo.

### Escenario 1 · Quién entró

1. La barra dice **«Operador de desarrollo»** (el `displayName` del backend) y «Todos los merchants».
2. Con un operador sin `displayName` en `config/dev-operators.json` del backend (agregar uno y
   reiniciar), la barra dice su `operatorId`.

### Escenario 2 · La grilla y la ficha

1. La grilla lista por nombre: «Tienda de desarrollo» primero, el identificador al lado en tipografía
   de código; un merchant creado antes de la 041 muestra su identificador en el lugar del nombre.
2. Abrir «Tienda de desarrollo»: el encabezado dice el nombre; la sección «Identidad» muestra la URL
   como enlace que abre en otra pestaña; sin contacto, no hay campos de contacto.

### Escenario 3 · El alta con identidad

1. «Nuevo merchant» → la sección de identidad va primero: nombre (obligatorio), URL, contacto, notas.
2. Guardar sin nombre: el campo marca «obligatorio» y **no se envía**.
3. Guardar con nombre, URL y un contacto con nombre y email: `201`, las credenciales una vez,
   «continuar» cae en la ficha con la identidad.

### Escenario 4 · La edición

1. En la ficha, «Editar identidad» → la pantalla precargada con lo que hay; la sección dice que
   guarda la identidad entera.
2. Cambiar el nombre, vaciar la URL, guardar: el aviso dice «la identidad se guardó · <nombre>»; la
   ficha ya no muestra la URL.
3. Editar de nuevo y poner `" Tienda "` con espacios: `422 invalid-merchant-profile` en el campo del
   nombre, con el texto del servidor.
4. Poner `https://` como URL: `422` en el campo de la URL.
5. Cargar sólo el nombre del contacto: el email marca «obligatorio» sin ir al servidor.
6. Vaciar nombre y email del contacto: guardar; la ficha ya no tiene contacto.
7. Desactivar el merchant (ficha → desactivar → confirmar) y editar la identidad: `200`.

### Escenario 5 · Lo que no se ve

1. `?dev.papel=lectura`: la ficha muestra la identidad y no ofrece «Editar identidad» ni «Nuevo».
2. Con un operador de alcance acotado (`scope: ["otro"]` en el backend), pegar la URL de edición de
   un merchant ajeno: `403 merchant-out-of-scope` en el aviso, **con su identificador de pedido**.

### Escenario 6 · El sincronizador

1. En el backend, mover `generated/contract/` a un lado y correr `npm run contract:sync` acá: falla
   diciendo que hay que correr `npm run contract:types` en el backend. Devolver la carpeta.

## Romperle algo a cada comprobación

| se rompe | lo agarra |
|---|---|
| `identify` que devuelva claims sin `operatorId` | la prueba de `api/ope/identity` |
| un `required` tocado en `contracts/ope/constraints.js` | `ope-check conformity` |
| `profileBodyOf` que recorte espacios | la prueba de `data/identity` |
| un `422` con `/body/contact/email` que no cae en el campo | la prueba de la pantalla de edición |
| el contacto en el aviso de la acción | la prueba de telemetría y avisos de la edición |
| `contract-sync` que vuelva a emitir sin `generated/contract/` | la prueba del sincronizador |
| «Editar identidad» visible sin `merchants:write` | la prueba de la ficha con la sesión de lectura |

## Lo corrido

**Tramo 1 (2026-10-09)** · `npm run contract:sync` copió los ocho archivos del backend en `main`
con la 041; con `generated/contract/` movida a un lado falló diciendo que hay que correr
`contract:types` en el backend (escenario 6). Escenario 1: la barra dice «Operador de desarrollo».

**Tramo 2 (2026-10-09)** · Escenario 2: la grilla lista por nombre, con el identificador en código al
lado; los merchants anteriores a la 041 que había en el almacén ocupan el lugar del nombre con su
identificador. La ficha de `dev-merchant` encabeza por nombre, la URL abre en otra pestaña, y el
contacto y las notas se ven. Recargar por URL pierde la sesión y el `401` muestra su identificador de
pedido con «copiar»: la 040 se ve.

**Tramo 3 (2026-10-09)** · Escenario 3: sin nombre, el campo marca obligatorio y no se envía; con
nombre, URL y contacto, `201`, credenciales una vez, y la ficha de «Tienda Sur» con su identidad.
Escenario 4: el editor precarga los siete valores; `" Tienda Sur "` da `422` en el nombre y
`https://` da `422` en la URL, cada uno con el texto del servidor (llegan de a uno: el backend juzga
un campo por vez); vaciar la URL y agregar una nota guarda con `200`, el aviso dice «La identidad se
guardó · Tienda Sur» y la ficha ya no muestra la URL; vaciar sólo el email deja «Es obligatorio.» sin
ninguna petición. El paso 6 (vaciar el contacto), el 7 (editar un desactivado) y el escenario 5 no
se corrieron a mano: los afirman las pruebas de `data/identity`, de la ficha (sin `merchants:write`
no hay botón, también sobre un desactivado) y de la ruta de edición (responde «sin permisos»).

**Tramo 4 (2026-10-09)** · `npm test`, `npm run revisar` y `npm run build` en verde.
