# La deuda de código

Lo que funciona y **restringe**. Ordenada por lo que rinde sobre lo que cuesta.

Se lee junto a [`../docs/deuda.md`](../../docs/deuda.md), que es la deuda con el **método**. Ésta es
la del **código**.

## Antes de agregar algo acá: el triaje

**Tres cosas se confunden con deuda, y ninguna lo es.** Meter un defecto en esta lista es cómo un
defecto no se arregla nunca.

| | qué es | dónde va |
|---|---|---|
| **Un defecto** | La aplicación se comporta mal | **Tarea del tramo en curso**, con la comprobación que lo habría agarrado |
| **Un incumplimiento** | El código contradice una decisión **ya tomada** | **Se resuelve, no se agenda**: o se arregla el código, o se enmienda la decisión |
| **Una garantía declarada que no existe** | Una decisión dice «lo verifica X» y X no lo verifica | **Es lo más urgente de todo.** La decisión miente, y quien la lee construye creyendo que está protegido |
| **Deuda** | Funciona, y restringe lo que viene | **Acá** |

## Cuándo se paga

**La deuda que el próximo tramo va a pisar se paga antes del tramo.** No por prolijidad: construir
encima la multiplica, y el síntoma aparece lejos de la causa.

**Y se paga agregando la garantía que faltaba**, no sólo reescribiendo el código. Si se arregla sin
que algo falle la próxima vez, **vuelve en el próximo apuro** — que es exactamente cómo llegó.

---

## La deuda, en orden
> **Una entrada de acá no se cita por su número.** Están numeradas por orden de
> conveniencia, y **pagar una corre a todas las de abajo** — es el mismo defecto que
> `CLAUDE.md` persigue en las decisiones: un número que se mueve deja mintiendo a
> todo lo que lo nombraba.
>
> Se descubrió al pagar la de las dos formas de navegar: siete lugares apuntaban a
> «la entrada 2», y desde ese día apuntaban a otra. Se cita **por lo que dice**.


### 1 · Una aplicación clonada no puede verificar las citas a granito

**Qué es.** Las de cuarzo ya se verifican —se pagó el 2026-08-23, ver abajo—, pero desde una
aplicación las `GR-n` siguen sin tener contra qué compararse:

```
ok     las de cuarzo, contra sus 46 decisiones
--     no encontré las de granito: sus citas no se verificaron
```

**Por qué falta esta mitad.** `docs/identidad-visual.md` vive en `granito/docs/`, fuera de
`packages/ui/`, así que npm no lo incluye — el mismo problema estructural que cuarzo acaba de
resolver de su lado. Buscarlo por ruta hermana es justamente lo que se sacó, porque supone un
vecindario.

**Qué produce.** No falla y **lo dice**. Lo que restringe es que una aplicación puede citar una
decisión visual inexistente y nadie se entera — y `granito` tiene 73 decisiones y una numeración que
se pisa con la nuestra, que es de donde salen las citas inventadas.

**Qué costaría.** Un renglón en el `files` de `@granito/ui`, más el paso de copia, porque su
documento también está arriba de `packages/`. **Es un pedido**, no trabajo nuestro: va como
`granito#PED-15`, y se manda **después** de haberlo hecho acá, que es lo que lo vuelve un pedido
concreto y no una idea.

**Con qué se paga.** Con la prueba del clon de `T049` corriendo `cuarzo-check` y **no viendo ningún
`--`** en la salida de decisiones.

### 2 · La capa 2 de `CU-46` no tiene ejemplo en el esqueleto

**Qué es.** `CU-46` describe un predicado que apaga un botón **con su motivo** cuando una regla del
dato no lo permite, y `granito#PED-12` existió para que ese motivo se pudiera mostrar. En `src/` no
queda ninguno.

**Cómo pasó, que es lo interesante.** Había uno —`whyNotDeactivate`— y **era una tautología**: «no se
puede desactivar lo que ya está desactivado». No era una regla de negocio: era **la operación inversa
que faltaba**, disfrazada de botón apagado. El día que se agregó «Activar», el predicado desapareció
solo — que es exactamente la prueba de que nunca fue lo que decía ser.

**Qué produce.** Nada hoy. Lo que restringe es que **quien escriba el primer predicado de verdad no
tiene de dónde copiar**, y el riesgo concreto es que repita la tautología creyendo que está aplicando
la decisión. Es el mismo argumento con el que se agregó el ejemplo de la acción de fila.

**Qué costaría.** Una regla real en el catálogo del ejemplo. La candidata evidente es «no se puede
desactivar un artículo con stock»: mira `stock`, un campo que la fila ya trae, así que **cae adentro
del límite que `CU-46` fija** — el predicado sólo puede mirar lo que la pantalla ya tiene.

**Con qué se paga.** Con el predicado ejercitado en la pantalla, y una prueba de que el botón queda
apagado **con su motivo** y no apagado a secas — que es la mitad que se olvida.

---

### 3 · Nadie verifica que la respuesta cumpla el contrato

**Qué es.** Los tipos salen del contrato (`CU-14`), así que el compilador sabe que `Article.price`
es obligatorio. **Al correr no lo verifica nadie**: `unwrap` abre el sobre y devuelve lo que vino.

**Qué produce.** Un campo que el servidor deja de mandar **no falla**: se dibuja vacío. El formateo
de granito es defensivo —`money(undefined)` devuelve cadena vacía— así que ni siquiera revienta. No
avisa, no queda registro, y alguien lo tiene que notar mirando la pantalla.

> **Apareció el 2026-08-23, y de la forma más benigna posible**: la columna de precio salió en
> blanco porque el simulado que estaba corriendo era anterior al contrato con precios. Se resolvió
> reiniciándolo. **Con el backend real sería una versión desplegada que dejó de mandar un campo**, y
> el síntoma sería exactamente el mismo.

**Por qué es deuda y no un defecto.** Funciona: lo que está mal es de quien responde, no de acá. Lo
que restringe es que **cada pantalla nueva hereda el mismo punto ciego**, y cuantas más haya, más
lugares donde un campo faltante se ve como un dato vacío legítimo.

**Qué costaría.** Verificar al menos los requeridos al abrir el sobre. Las restricciones **ya están
generadas** —`src/api/demo/constraints.ts`, con `required` por mensaje— así que no hay que producir
nada nuevo: falta decidir qué hacer cuando no cumple. Un error de pantalla es honesto y ruidoso; un
registro y seguir es silencioso y deja al operador con datos a medias. **Esa decisión es la parte
cara**, no el código.

**Con qué se paga.** Con una prueba que le dé al sobre una respuesta a la que le falta un requerido
y verifique que **no pasa como buena** — hoy pasa.

---

## Lo que NO es deuda, y por qué se anota igual

Para que nadie lo mueva a la lista de arriba pensando que se olvidó.

**Ahora mismo no hay nada acá.** Los tres que hubo —un ruteador que se recreaba en cada dibujo, dos
variables mutables de módulo, y una garantía que `CU-36` declaraba sin tener— se cerraron con sus
comprobaciones, que es lo que evita que vuelvan.

## Lo que se pagó

**El alta vivía en un diálogo y la edición no podía.** Editar exige cargar el registro antes de
mostrar el formulario —el testigo sale de esa lectura— y `GR-42` fija que un diálogo no espera un
dato del servidor. Con dos contenedores distintos iban a quedar **dos maquetas para el mismo
formulario**, y se desincronizan en la primera corrección.

Se pagó con la edición del catálogo, en la forma que `granito#PED-8` ya había elegido —una región de
la misma página— y sacando los campos a un solo lugar: el alta pasó de 136 renglones a 88, y ninguno
de los dos puede agregar un campo sin que el otro lo tenga.

**Las restricciones del contrato (`CU-38`) estaban escritas a mano** (deuda 4, anotada en la 005): el
generador de cuarzo leía `demo.yaml` por líneas y se retiró con el simulado, y el alta de merchant
validaba con una copia que el backend podía dejar vieja sin que nadie se enterara. Se fijó pagarla
antes del primer formulario del panel, y se pagó con él (feature 006, 2026-10-08): `contract-sync`
emite `contracts/ope/constraints.{js,d.ts}` desde `components.schemas` del bundle con la forma de
`specs/006-el-merchant-completo/contracts/constraints-artifact.md`, `conformity` falla si lo emitido
y el bundle se despegan, y es la tercera muleta con la fecha de la 040. La capa 2 (`invalid-origin`)
queda a mano con su cita, porque una regla en prosa no se emite como predicado.

**Y lo caro no fue eso.** El punto de control encontró cuatro defectos que ninguna prueba había
visto: el formulario cargaba vacío porque tomaba sus valores iniciales antes de que llegara el
registro; el `PUT` no salía nunca porque el simulado no declaraba los métodos permitidos y `curl` no
hace preflight; el reintento sin choque **pisaba el cambio del otro en silencio**, que es justo lo
que el mecanismo existe para evitar; y la comparación miraba dos de los cuatro campos que el
formulario edita, así que un cambio ajeno en los otros dos era invisible.

Los cuatro salieron mirando la aplicación andar, con dos pestañas. Ninguno se veía en verde.

**El catálogo navegaba contra la decisión que lo rige, y nada lo impedía.** La grilla llamaba a
`goTo(articleScreen)` y la ficha informaba un desenlace: dos respuestas distintas a la misma
pregunta, en el mismo par de archivos, elegidas por proximidad.

Se pagó con `CU-47` —el flujo declarado, y `goTo` fuera de las pantallas— y con la comprobación que
faltaba: **sólo `feature.ts` y `app/flows.ts` pueden nombrar una pantalla**.

La comprobación costó tres intentos, y **los tres dieron verde con la importación puesta a
propósito**: un backslash colapsado que la dejó mirando sólo rutas de Unix, una ubicación debajo de
donde se evalúan las fallas, y una definición tan ancha que marcaba el diálogo de alta. Si no se le
hubiera roto algo cada vez, hoy estaría en verde sin verificar nada.

**Los documentos de decisiones no viajaban con el paquete.** Una aplicación clonada heredaba
comentarios que citaban `CU-n` y no tenía contra qué compararlos: los documentos viven arriba de
`packages/`, y npm no empaqueta hacia arriba.

Se pagó copiándolos al empaquetar —`arquitectura.md` y `seguridad.md`, no el índice— y está probado
de punta a punta: una aplicación vacía, con sólo el paquete instalado desde su `.tgz`, acepta las
citas reales y **agarra una cita inventada en su propio código**.

**Y apareció que la comprobación miraba sólo markdown.** Las 452 citas en comentarios de código
—contra 794 en documentos— no las verificaba nada, mientras `CLAUDE.md` prometía que `npm test`
falla si alguna no resuelve. Es textualmente lo que este repositorio le reprochó a granito en
`granito#PED-2`, teniéndolo adentro. Hoy lee también el código: **1667 citas, y las 1667 resuelven**.


**La validación de configuración escrita a mano.** El tipo obligaba a producir un valor pero no a
validarlo, así que un campo nuevo se podía declarar obligatorio y satisfacer con `String(algo)` —que
da `'undefined'`, un texto válido— y la aplicación arrancaba apuntando a un servidor inexistente.

Se pagó con un esquema de combinadores propios: **el tipo sale del esquema**, así que no hay dónde
declarar un dato sin validarlo. Y con las pruebas que lo sostienen, incluida la del campo agregado.

**`RouteParams` caía en silencio a «sin parámetros».** Un solo caso de salida significaba a la vez
«esta ruta no tiene parámetros» y «no entendí esta ruta», así que un `/files/*` compilaba, `goTo` no
pedía nada, y el comodín viajaba literal en la URL.

Se pagó separando los dos significados y leyendo la ruta **segmento por segmento**. Qué formas se
soportan está en `CU-41`, y lo que no se soporta **no compila al declarar la pantalla**. Cuatro
pruebas de tipo lo sostienen, y fallan solas si el tipado se afloja.

**`defineScreen` afirmaba un campo que no existía.** `__params` estaba en el tipo y no al correr, así
que quien lo leyera compilaba y recibía `undefined` — y encima **no marcaba nada**: el tipo era
escribible a mano, así que un objeto literal salteaba la comprobación de la forma de la ruta.

Se pagó con una marca **que existe de verdad**, un símbolo que no se exporta. Ahora `defineScreen` no
tiene ninguna conversión, y armar un `Screen` a mano no compila.

**`createFakeSession` mezclaba el almacén con el proveedor.** Sostener el estado, aplicarle un
evento y avisar a los suscriptos estaba adentro de la falsa.

**La entrada decía que «su forma no la hereda nadie», y estaba equivocada**: el adaptador real de
`001` necesita exactamente ese almacén. Dejarlo ahí era la misma treintena de líneas esperando ser
escrita de nuevo del otro lado, y dos copias de una máquina de estados observable divergen en la
primera corrección.

Se pagó con `createSessionStore`, que no sabe de proveedores: lo que cambia entre uno y otro es
**qué eventos se aplican y cuándo**. Tres pruebas lo sostienen, incluida la que verifica que **no
avise** cuando el evento no correspondía.

**Los errores no tenían tipo.** `throw new Error(texto)` en todo el núcleo: distinguir una falla de
otra obligaba a leer el mensaje, y las primeras en depender del texto fueron **nuestras propias
pruebas** — mejorar una redacción rompía una prueba que no tenía nada que ver.

Se pagó con `CU-45`: una `Failure` con código, cuatro clases y no un catálogo. La sostiene la regla
11, que rechaza un `throw new Error(` en el núcleo.

**`buildMenu` descartaba las rutas con parámetros en silencio.** No estaba en el tipo, no fallaba, y
no aparecía en ningún lado: una pantalla quedaba declarada, no salía en el menú, y para entender por
qué había que leer una línea del marco.

Se pagó moviendo la regla al tipo: con parámetros, `inMenu` es **obligatorio y en falso**, así que la
declaración lo dice y **quien arma el menú no tiene ninguna regla propia**. Tres pruebas de tipo lo
sostienen.

**Una pantalla no podía enlazar a otra funcionalidad.** `goTo` navega con el objeto de la pantalla y
`CU-15` prohíbe el import, así que un enlace entre dominios —de una factura al cliente que la debe—
no se podía escribir, y el operador tenía que volver al menú lateral.

Se pagó con `CU-44`: la pantalla informa **qué pasó** y la aplicación decide **qué sigue**, en un
solo archivo. La aplicación no arranca si un desenlace quedó sin destino ni si un destino quedó
huérfano, y siete pruebas lo sostienen.

**Y la regla 3 no lo agarraba**, que era lo peor: su detector de intersecciones saltaba los genéricos
con `<[^=]*>`, y `Screen` tiene un valor por omisión en su parámetro, así que el `=` rompía la
coincidencia. La regla decía cubrir el campo fantasma y **no cubría el único que había**. Ahora mira
el cuerpo entero de la declaración.

Cuando aparezca uno nuevo va acá, con su categoría y el motivo de por qué **no** está en la lista de
deuda.
