# Especificación · El testigo y el conflicto

**Carpeta**: `004-el-testigo-y-el-conflicto` · **Estado**: borrador · **Fecha**: 2026-08-29

**Pedido**: la pregunta del agente de `las-animas/admin` construyendo el CRUD de empresas: *«cuando
el guardado devuelve `412` porque la empresa cambió mientras se editaba, ¿qué ve el operador
exactamente?»*

**La decisión que esto implementa es `CU-29`, que ya está tomada.** Acá no se decide qué se hace: se
construye lo que esa decisión dice, y se llena el piso que le falta.

## Qué resuelve

**Dos personas editan el mismo registro y la segunda pisa el trabajo de la primera, sin que ninguna
se entere.** No es hipotético: el legacy escribe sobre la misma base que el panel, así que el otro
editor puede no ser siquiera un operador.

Y hoy **nada lo detecta**. `CU-29` dice qué hacer cuando pasa, pero el mecanismo que lo detectaría
—el testigo que el servidor usa para rechazar un guardado sobre una versión vieja— no viaja: ni sale
del `GET`, ni vuelve en la escritura. La decisión describe una protección que no existe.

## Quién la consume

**Toda aplicación de Tandilia**, por `@cuarzo/core`, y sin poder no usarla: es la puerta de acciones,
por donde pasa toda escritura.

**`las-animas/admin` es el primer consumidor real y ya está esperando.** Preguntó porque leyó la
regla y no encontró cómo cumplirla — y estaba por construirla adentro de su formulario de empresas,
que la habría dejado reescrita en sucursales, bancos y el resto de los catálogos.

Quien clona se entera por dos lados: **la edición del catálogo del esqueleto es el ejemplo a copiar**,
y el conflicto se resuelve solo en la puerta, sin que la pantalla haga nada más que decir qué campos
tocó.

## Qué NO hace

- **No resuelve el conflicto por el operador.** No fusiona, no elige por él, no propone un valor
  «correcto». Le muestra qué cambió y decide él.
- **No bloquea.** El bloqueo pesimista —reservar el registro mientras alguien lo edita— no es esto y
  no se construye: `CU-29` eligió el testigo.
- **No sabe si dos campos están atados** por una regla de negocio. Cambiar el domicilio puede obligar
  a revisar la localidad, y eso es de la aplicación. Lo que sí hace es **darle con qué declararlo**.
- **No decide cómo se ve.** El diálogo, la comparación en pantalla y el aviso son de granito. Acá se
  dice **cuándo** aparecen y **con qué datos**.
- **No promete quién escribió.** Con el legacy en producción, un rechazo puede no venir de nadie del
  panel. El texto no puede decir «otro operador».
- **No cubre las pantallas de negocio**, que son de cada aplicación.

## De qué decisiones depende

| decisión | qué aporta |
|---|---|
| `CU-29` | **Lo que se implementa.** La regla entera: la intersección, guardar callado si no se cruza, no perder lo tecleado, y dónde vive |
| `CU-25` | La puerta de acciones, que es dónde vive. Y que **las escrituras no se reintentan**, que es lo que impide el falso arreglo |
| `CU-5` | Los tres estados de un formulario, más cargando. La edición los necesita todos |
| `CU-9` | La postura sobre perder trabajo tecleado. `CU-29` la hereda con las mismas palabras |
| `CU-34` | La clave de idempotencia atada al cuerpo del intento: un reintento tras el conflicto **es otro cuerpo** |
| `CU-38` | Los errores que vuelven a los campos. El conflicto **no** es uno de ésos, y hay que distinguirlos |
| `CU-14` | Se ramifica por el código y nunca por el mensaje. El conflicto se reconoce por su código |
| `CU-4` | El identificador del pedido, que todo error muestra |
| `CU-24` | Los cuatro estados, que la pantalla de edición también tiene |
| `GR-42` | **Un diálogo no espera un dato del servidor** — por eso la edición no puede ser un diálogo |
| `granito#PED-8` | La forma ya elegida para la edición: una región de la misma página, con la grilla a la vista |
| deuda 3 | «El alta vive en un diálogo, y la edición no va a poder». Esto la paga |

**Abiertas que la bloquean**: **ninguna.** Las cuatro decisiones abiertas de cuarzo —`CU-18`, `CU-19`,
`CU-21`, `CU-28`— no tocan la escritura ni el conflicto.

Lo que sí falta son **dos hechos, no dos decisiones**, y están en «Lo que queda abierto».

## Aclaraciones

<!-- Lo que se preguntó antes de planificar, con su respuesta. Cada una está
     además aplicada abajo, en la sección que le toca. -->

### Sesión 2026-08-29

- P: ¿El contrato de `las-animas` expone el testigo y lo exige al escribir? → R: **Sí, y completo.**
  No hizo falta preguntarlo: está en su propio contrato. `components/headers/ETag.yaml` —«el cliente
  la guarda y la reenvía en `If-Match` al modificarlo»—, `components/parameters/IfMatch.yaml` —«el
  servidor responde `412` y **la operación no se aplica**… nunca se aplica el cambio a ciegas»— y
  `components/responses/PreconditionFailed.yaml`. Y cubre el olvido: sin el encabezado responde `422`
  nombrándolo en los campos. **No hay nada que pedirle al backend.**
- P: ¿El contrato del ejemplo gana el testigo? → R: **Sí.** Es el molde que copian cuatro
  aplicaciones, y lo que no está en el ejemplo la primera aplicación lo inventa. Sin esto, la mitad
  de lo que se construye acá no se ejercita nunca en el esqueleto — que es la misma razón por la que
  el esqueleto trae dos pantallas de ejemplo y no ninguna.

## Escenarios

1. **Se abre una empresa para editar** → llega el registro **con su testigo**, y el testigo se
   conserva junto con la versión cargada. La pantalla muestra los cuatro estados: cargando, el
   registro, no existe, y error.

2. **Se guarda y nadie tocó nada** → se guarda con el testigo. El camino de siempre, sin un paso más.

3. **Se guarda, otro cambió algo, y no se cruza con lo editado** → el servidor rechaza; se relee; se
   compara; **no hay campos en común**; se guarda sobre la versión nueva y **el operador no se entera
   de nada**. Es el caso frecuente y es el que decide si esto es una protección o un estorbo.

4. **Se guarda, otro cambió algo, y sí se cruza** → se muestran **sólo los campos cruzados**, con lo
   que había al abrir y lo que hay ahora. **Lo tecleado se conserva entero.** El operador decide si
   vuelve a aplicar lo suyo o se queda con lo del otro.

5. **Se decide volver a aplicar lo propio** → se guarda con el testigo nuevo, y es un intento nuevo:
   otro cuerpo, otra clave (`CU-34`). No es un reintento.

6. **La aplicación declaró que dos campos están atados** → si uno de los dos entra en el cruce, el
   otro entra también, aunque no se haya tocado.

   > **Éste no entra en esta vuelta**, y por qué está en «Lo que queda abierto»: no hay ningún caso
   > real, y la forma de declararlo se fijaría con el primero que la use. Se escribe igual porque la
   > comparación tiene que poder recibirlo después **sin cambiar de forma** — que es distinto de
   > construirlo ahora.

## Lo que puede salir mal

- **La relectura falla.** No se puede comparar, así que no se puede decidir. Se informa el conflicto
  sin la comparación, **con el identificador del pedido**, y no se guarda. Es peor que el caso bueno
  y sigue siendo mejor que pisar.
- **La respuesta no trae testigo.** Un servidor que no lo emite deja la protección sin sujeto. Tiene
  que **fallar y decirlo**, no seguir sin protección en silencio — que es exactamente la clase de
  falla que motivó esta especificación.
- **El rechazo vuelve dos veces seguidas.** Otro está guardando mientras éste decide. No se reintenta
  solo: se vuelve a mostrar el cruce, con los datos nuevos.
- **El conflicto se confunde con un error de campos.** `CU-38` manda los de validación a los campos;
  éste no va a los campos y no puede caer en el mismo camino, o el operador ve un formulario que
  parece mal llenado.
- **Alguien lo implementa como «releer y guardar encima».** `CU-29` lo descarta explícitamente y
  advierte que **va a aparecer disfrazado de reintento**. Tiene que quedar imposible, no desaconsejado.
- **Todo error que se muestre lleva el identificador del pedido** (`CU-4`).

## Cómo se verifica

| garantía | qué sostiene |
|---|---|
| **no compila** | Una operación de escritura sobre un recurso con testigo **no compila sin él**. Es lo que impide que una pantalla nueva se olvide |
| **lo agarra una prueba** | Los seis escenarios, y sobre todo el 3: que el caso sin cruce **no moleste**. Que lo tecleado sobreviva al conflicto. Que el segundo rechazo no reintente solo |
| **se hereda** | La puerta viaja en `@cuarzo/core`: una aplicación la recibe sin copiar nada |
| **se genera** | Los tipos del contrato, de donde sale que un recurso lleva testigo |
| **lo mira una persona** | Que el texto del aviso **no prometa quién escribió**, y que la comparación se entienda de un vistazo. Sólo eso |

Y una comprobación nueva: **que la puerta trate el rechazo por conflicto**, que hoy no lo trata. Es
la garantía que faltaba y que dejó a `CU-29` declarada y vacía; sin ella, esto vuelve a pudrirse igual.

## Biblioteca o esqueleto

**Las dos, y por eso se dice cuál es cuál.**

**Biblioteca**: la puerta, la comparación, el transporte del testigo y el tipo que obliga a llevarlo.
La prueba es directa — un defecto en la comparación muestra el conflicto equivocado en las cuatro
aplicaciones.

**Esqueleto**: la pantalla de edición del catálogo. Es el ejemplo que se copia y que cada aplicación
va a divergir, y **existe para que la parte de biblioteca tenga un consumidor real**: sin ella es
código que nunca corre.

## Supuestos

- **El testigo es opaco.** Cuarzo no lo interpreta ni lo compara: lo guarda y lo devuelve.
- **Comparar es comparar valores de campo** contra la versión cargada. Alcanza para los catálogos, que
  es lo que hay. Un recurso con estructuras anidadas puede necesitar más, y todavía no existe.
- **La versión cargada ya está en memoria**: es el registro que la pantalla trajo. `CU-29` lo dice —
  «es memoria y no maquinaria».
- **Un `GET` individual devuelve el testigo.** Si un contrato de la familia no lo hace, esto no se
  puede cumplir de punta a punta ahí, y es un pedido a ese backend.

## Lo que queda abierto

- **Con qué forma una aplicación declara que dos campos están atados.** `CU-29` dice que hace falta y
  no dice cómo. No hay ningún caso real todavía —los catálogos no tienen campos atados—, así que
  inventarlo ahora es la trampa del primer consumidor.

  **Y el escenario 6 depende de esto**, así que se construye sin él: la comparación funciona campo a
  campo, y el día que aparezca un caso real se agrega la declaración encima. Lo que **no** se hace es
  dejar la puerta abierta con una forma adivinada, que es la manera de que la primera aplicación que
  la use la fije para siempre.

  Los otros dos puntos que estaban acá —el testigo en el contrato de `las-animas`, y el del ejemplo—
  quedaron resueltos en «Aclaraciones».
