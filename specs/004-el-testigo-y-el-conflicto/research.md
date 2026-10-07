# Investigación · El testigo y el conflicto

**Carpeta**: `004-el-testigo-y-el-conflicto` · **Fecha**: 2026-08-29

Cinco incógnitas, medidas **antes** de escribir el plan. Dos cambiaron lo que iba a proponer y una
achicó el trabajo a la mitad.

---

## §1 · El testigo ya tiene dónde viajar de vuelta

**La pregunta**: cómo llega el `ETag` del servidor hasta la pantalla sin cablearlo en cada servicio.

**Lo medido**: `unwrap` —el único lugar por donde pasa toda respuesta— **ya recibe la respuesta cruda
y ya lee un encabezado de ahí**:

```ts
export function unwrap<T>(result: { data?; error?; response: Response }): Page<T>

function requestIdFrom(response: Response): string {
  return response.headers.get('X-Request-Id') ?? 'sin-identificador'
}
```

Y lo que devuelve, `Page<T>`, tiene un `meta` que **ya transporta un dato sacado de un encabezado**:
el identificador del pedido.

**La decisión**: el testigo entra por el mismo camino. Un campo más en `Meta`, leído del encabezado
en `unwrap`. **Cero cableado nuevo**: toda pantalla que ya recibe `Page<T>` lo recibe.

**Lo que esto descarta**: un canal aparte, un tipo `Versioned<T>` que envuelva a los datos, o que
cada servicio lo devuelva por su cuenta. Los tres agregaban una forma nueva donde ya había una.

> **Alternativas consideradas**: (a) devolver el `Response` a la pantalla — expone el transporte, y
> `CU-14` ya dice que la pantalla no ramifica por HTTP; (b) un segundo `GET` para el testigo — dos
> viajes y una carrera; (c) meterlo en el cuerpo — es del contrato de otro y no lo decidimos acá.

---

## §2 · El camino de vuelta no existe, y es la mitad del trabajo

**La pregunta**: cómo va el testigo en la escritura.

**Lo medido**: `operation` lleva hoy tres cosas y ninguna sirve:

```ts
operation(id, service, { roles, idempotent }, run(service, input, idempotencyKey?))
```

La clave de idempotencia **viaja por un canal aparte** —tercer parámetro de `run`—, puesta por la
puerta y no por quien llama. **Es exactamente el precedente que hace falta**: un dato de protección
que la puerta administra y la pantalla no toca.

**La decisión**: el testigo viaja igual, por el mismo canal que ya existe para la clave. La puerta lo
tiene porque la pantalla se lo pasó una vez al abrir; el servicio lo pone en `If-Match`.

**Lo que esto cuesta**: `operation` gana la declaración de que la operación **exige testigo**, al
lado de `idempotent`. De esa declaración sale la garantía de §3.

---

## §3 · «No compila sin el testigo» se puede, y por dónde

**La pregunta**: la especificación promete que una escritura sobre un recurso versionado **no
compila** sin el testigo. ¿Es alcanzable o es una promesa cómoda?

**Lo medido**: `operation` declara hoy `{ roles, idempotent }`, y `defineAction` ata las operaciones
que una acción puede usar —`CU-37`— con la costura de tipos ya hecha. La declaración es del tipo, no
un valor en runtime.

**La decisión**: declarar `versioned: true` en la operación, y que el tipo de lo que la acción le pasa
**exija el testigo cuando la operación lo declara**. Es el mismo mecanismo con el que `CU-41` hizo que
una ruta con parámetros no se navegue sin ellos, y con el que `CU-37` hizo que llamar a una operación
no declarada no exista.

**Y se verifica como aquéllas**: con un `@ts-expect-error` en `packages/core/tests/types.test-d.ts`,
que **falla si el error que espera no ocurre**. Es la garantía más fuerte de las cinco.

---

## §4 · El simulado ya lee encabezados; el contrato del ejemplo no los tiene

**La pregunta**: ¿el ejemplo puede ejercitar esto de punta a punta?

**Lo medido**:

- `tests/mock.mjs` **ya lee un encabezado de pedido** —`request.headers['idempotency-key']`—, así que
  emitir un `ETag` y comparar un `If-Match` es del mismo tamaño.
- `contracts/demo.yaml` **no tiene nada** de esto. Lo gana en esta vuelta: está aclarado en la spec.
- El contrato de `las-animas` **sí lo tiene, completo** —`headers/ETag.yaml`,
  `parameters/IfMatch.yaml`, `responses/PreconditionFailed.yaml`—, así que la aplicación real va a
  ejercitarlo desde el primer día.

**La decisión**: el ejemplo lleva el mecanismo entero, con el simulado rechazando de verdad. Sin eso,
la comparación sería código que nunca corre acá.

---

## §5 · Granito no tiene con qué mostrar la comparación

**La pregunta**: qué componente dibuja «esto había cuando abriste, esto hay ahora».

**Lo medido**: de los treinta componentes que granito publica —`Alert`, `Dialog`, `Table`, `Field`,
`FormattedValue`, `FormSummary`, `StateMessage`, `Badge`…— **ninguno es una comparación**. Los dos
únicos usos de la palabra en sus 51 decisiones visuales son sobre otra cosa.

**La decisión, y es la incómoda**: para uno o dos campos —que es lo que `CU-29` dice que suele ser—
la comparación **se compone** con lo que ya hay: el `Dialog` que ya se usa para el aviso de trabajo
sin guardar, y `FormattedValue` para cada valor. **No se inventa un componente acá**: el principio IV
dice que lo visual es de granito, y componer con sus piezas no es lo mismo que dibujar uno propio.

**Lo que queda para ellos**: si al mirarlo la comparación no se entiende de un vistazo, **es una
propuesta a granito y no un parche acá**. Va anotado en el `quickstart.md` como una de las cosas que
sólo ve una persona.

> Se descartó pedirle el componente a granito **antes** de tener el caso: es la trampa del primer
> consumidor, y la propia `CU-21` la nombra. Primero se compone, después se propone con evidencia.
