# Contrato · `@cuarzo/core`

Lo que el paquete expone, y **lo que a propósito no expone**. Es la conducta que se publica y se
actualiza con `npm update` (`CU-40`); la forma —carpetas, ruteo, raíz de composición— se copia y
después es de cada aplicación.

## Declarar y navegar

```ts
defineScreen({ id, titulo, ruta, capacidad, componente, seccion })
goTo(screens.companyDetail, { id })
```

De las declaraciones salen el menú, las rutas y el filtrado de los dos lados (`CU-23`), y **los
tipos de `goTo`** (`CU-41`). El menú **no es un mecanismo aparte**: es otro llamador de `goTo`.

## Los cuatro estados

```tsx
<Result query={...} empty={...} noMatches={...}>{(datos) => ...}</Result>
```

Envuelve **la región, no la pantalla** (`CU-24`).

## Acciones

```ts
defineAction({ operaciones, invalida, idempotente })
useAction(accion)   // ejecutar, y en qué estado está
```

La capacidad **se deriva** de las operaciones (`CU-37`). El éxito, los errores de campo, el aviso con
el identificador del pedido y el no-reintentar los pone el marco (`CU-25`).

## Contextos

```ts
useContextoDeTrabajo()   // sucursal (máquina) y cliente actual (pestaña)
usePreferencias()        // tema, globos de ayuda
```

Con las dos reglas de `CU-26` adentro: **estampado con el sujeto**, y **sólo identificadores**.

## Puertos

```ts
configurarNucleo({ config, registro, clientes })
```

El **registro** es un puerto (`CU-35`) y hay cosas que nunca salen por él. **Sólo la raíz de
composición llama a esto** (`CU-36`), y lo verifica `tests/boundaries.mjs`.

---

## Lo que NO expone, y es a propósito

**`getToken()` no existe.** Está en `001` y vale igual acá: una pantalla no puede obtener un token
(`CU-10`). Lo que hay es `authorize(request)`, en `@cuarzo/session`.

**Ningún componente visual propio.** Todo lo que se ve es de granito (principio IV). `Resultado` es
composición y decisión de qué estado mostrar, no dibujo nuevo.

**Ningún término de negocio.** Ni un tipo, ni un rótulo, ni un valor por omisión que suponga un
dominio (principio III).

**Ninguna forma de escribir una ruta a mano.** Si existiera, `CU-23` dejaría de tener una sola
fuente.
