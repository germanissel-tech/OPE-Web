# Investigación · La configuración versionada

**Carpeta**: `008-la-configuracion-versionada` · **Fecha**: 2026-10-09

Lo que hubo que mirar en el código —del núcleo, de la consola y del backend— para que el plan no
suponga. Cada sección es una decisión: qué se eligió, por qué, y qué se descartó.

---

## §1 · El nombre de un campo es el camino de su valor en el cuerpo

**Decisión.** Cada campo de los formularios de publicación se llama como el camino de su valor en el
cuerpo que viaja, con puntos: `declared.freshness.stockAndPriceMs`, `declared.locales.supported.1`,
`content.dedupWindow.ttlMs`, `reason`. Un renglón de una lista lleva su índice como último segmento,
como ya hacen los orígenes del alta (`origins.0`).

**Por qué.** `fieldNameOf` del núcleo traduce el puntero de un `422` a un nombre partiendo
`/body/...` en segmentos unidos por punto. Con los campos nombrados así, el `422` cae en su campo sin
una tabla de correspondencias: `/body/declared/locales/supported/1` es `declared.locales.supported.1`.
La 007 necesitó una sola correspondencia —el contacto— y la resolvió igual.

**Descartado.** Nombres cortos (`holdout`, `ladder`) con una tabla puntero → campo. Es una tabla que
envejece en silencio: un campo renombrado deja de recibir su error y el `422` termina al pie.

---

## §2 · Una lista puede recibir su error aunque no sea un campo

**Decisión.** El núcleo acepta como destino de un error del servidor **el nombre de una lista que
tiene renglones**: `declared.commercialPolicy.incentiveLadderShare` es destino válido si existe
`declared.commercialPolicy.incentiveLadderShare.0`. Hoy `useForm` lo trata como suelto y lo manda al
pie, porque sólo reconoce nombres que están en los valores.

**Por qué.** `invalid-configuration-value` sobre la escalera nombra la lista entera —«no crece
estrictamente»—, no un escalón. Es un error de la lista, y su lugar es la sección de la lista. La
regla es de forma, no de negocio: «un nombre es destino si tiene valor, o si es la lista de algún
renglón». Le sirve al portal igual que a la consola (principio V).

**Descartado.** Un campo oculto con el nombre de la lista. Es un valor que no viaja y que alguien va a
mandar por error.

---

## §3 · Las restricciones se aplanan siguiendo `ref`, y en la unidad que se muestra

**Decisión.** Una función del núcleo arma las restricciones de un formulario anidado a partir de las
emitidas: recorre los `ref` de `CONSTRAINTS` desde un esquema raíz y devuelve `fields` y `required`
con nombres de camino (`declared.freshness.stockAndPriceMs`). Y cada campo que se presenta en otra
unidad lleva sus restricciones **convertidas a esa unidad**: el `maximum: 1` de una tasa se vuelve
`100` cuando el campo se carga en porcentaje.

**Por qué.** Las restricciones se emiten por esquema, planas, con `{ type: 'object', ref }` para lo
anidado (`MerchantConfigurationDeclared.fields.freshness` es `{ ref: 'FreshnessDeclared' }`). La 007
compuso a mano un nivel (`withIdentity`); acá hay cuatro niveles y tres raíces. Y la capa 1 juzga el
texto que el operador ve: si el campo dice `5` y la restricción dice `máximo 1`, el error es falso.

**Descartado.** Validar después de convertir al formato que viaja. El mensaje diría «máximo 1» sobre
un campo que dice `%`, que es exactamente la confusión que la presentación quiere evitar.

---

## §4 · Una tasa se lee en porcentaje, y se convierte corriendo la coma

**Decisión.** Toda tasa del contrato (`…Share`) se muestra con `%` y se carga en porcentaje. La
conversión mueve la coma dos lugares **sobre el texto decimal**: `"0.07"` ↔ `"7"`, `"0.375"` ↔
`"37.5"`. Nunca pasa por una multiplicación de punto flotante.

**Por qué.** `ADR-035` deja la presentación al frontend («cómo se muestre un 5 % en un frontend no es
problema del backend») y exige que una tasa que algo cuantiza sea exactamente la de su balde.
`0.07 * 100` es `7.000000000000001` en punto flotante; correr la coma sobre el texto es exacto por
construcción. Granito ya viaja los números como texto (`NumberInput.value` es `"12.50"`), así que no
hay conversión a `number` en el camino.

**Dónde vive.** En `packages/core`: el portal va a mostrar tasas, y tiene que leerlas igual.

---

## §5 · Una duración tiene una unidad declarada por valor, y la usan la vista y la edición

**Decisión.** Cada duración del contrato (los `…Ms` y `cooldownSeconds`) tiene **una unidad propia
declarada una vez** en la funcionalidad: la frescura de stock en minutos, la del catálogo en horas,
las tolerancias de reloj en minutos, la gracia de rotación en días. La vista y la edición la usan las
dos. Se aceptan decimales mientras el resultado sea un número entero de la unidad del contrato.

**Por qué, y en qué difiere de la spec.** La spec decía «la unidad mayor que la representa exacta».
Mirándolo con un valor real no sirve: `129600000` se leería «36 h» en la vista y, si el operador lo
cambia a `1.5 d`, la vista siguiente diría «1,5 d» o «36 h» según cómo caiga. Un valor que cambia de
unidad entre la vista y la edición contradice `CU-6` («el formato de un dato se define una sola vez»).
Con la unidad por valor, el mismo dato se lee siempre igual. **El escenario 16 de la spec se ajusta.**

**La regla de exactitud.** `1.5` horas son `5400000` ms: entra. `0.0001` segundos no son un número
entero de milisegundos: error de capa 1 en el campo, sin redondear.

**Dónde vive.** La conversión en `packages/core`, junto a la de tasas; qué unidad tiene cada valor,
en la funcionalidad, porque es negocio.

---

## §6 · Heredar es que el campo no esté en los valores

**Decisión.** En la publicación del merchant, un valor **declarado** está en los valores del
formulario y viaja; uno **heredado** no está, y no viaja. Pasar de uno a otro es una acción explícita
del campo: «declarar» lo agrega precargado con el valor efectivo; «heredar» lo saca con `unset`, que
`useForm` ya tiene para los renglones.

**Por qué.** Es lo que el contrato dice: `declared` es lo que el merchant sobreescribe, y la ausencia
es heredar. Vacío no es heredar —un campo vacío es un error de forma o un valor que no viaja—, y
confundirlos es la forma de borrar un valor sin querer. Con la presencia en los valores, la capa 1
juzga sólo lo declarado y el cuerpo se arma recorriendo los valores.

**Lo que se ve.** Un campo heredado muestra el valor que viene de los defaults, de sólo lectura, con
su origen y «declarar». Uno declarado es el control, con «heredar».

---

## §7 · Lo que no se edita se copia al armar el cuerpo, de la versión que rige

**Decisión.** La función que arma el cuerpo de publicación recibe dos cosas: los valores del
formulario y lo declarado en la versión que rige. Toma de la segunda, tal cual, lo que la pantalla no
edita —`decisionPolicy`, `anchors`, `attributeLabels` y `commercialPolicy.returnRisk`— y le suma lo
operativo de los valores. En los defaults lo mismo, con `decisionPolicy` y `commercialPolicy.returnRisk`.

**Por qué.** Es la falla más cara de la feature, y en un solo lugar se prueba: una prueba arma el
cuerpo sin tocar nada y lo compara contra lo declarado. Si lo complejo viajara por el formulario como
valores ocultos, cualquier cambio de la pantalla lo podría perder.

**El caso borde de la política comercial.** `commercialPolicy` declarada exige su `version`. Viaja si
se declara algún valor operativo suyo **o** si la versión que rige declaraba `returnRisk`; en los dos
casos lleva `version`. Si todo se hereda y no había `returnRisk`, no viaja.

---

## §8 · Plataforma y defaults se leen con cualquier alcance, y se publican sólo con alcance total

**Verificado en el backend.** `list-level-versions.use-case.ts` lo dice: *«It does not take an
operator's scope, and that is not an oversight»* — leer un nivel global exige sólo
`configuration:read`. `publish-level.use-case.ts`: publicar *«takes an operator over every merchant»*.

**Decisión.** Las dos entradas del menú exigen `configuration:read`. «Publicar» en un nivel global
exige `configuration:write` **y** alcance `*`, que la consola lee de los claims de `getOperator`
(`OW-7`). El supuesto de la spec queda confirmado.

---

## §9 · La idempotencia ya está: el núcleo ata la clave al cuerpo

**Verificado.** Las tres publicaciones están marcadas `idempotent: true` en `contracts/ope/capabilities.js`,
y `attemptKey` de `use-action.ts` manda una clave atada a `JSON.stringify` del cuerpo (`CU-34`). Un
reintento del mismo cuerpo después de un `500` no crea otra versión.

**Cómo se distingue «no cambió nada».** El backend responde `200` con la versión que rige en vez de
`201`. El cliente devuelve el cuerpo sin el estado, así que la acción compara el número de la versión
devuelta con el de la que regía al abrir: si es el mismo, el aviso dice «no cambió nada». No hace
falta exponer el estado HTTP.

---

## §10 · El congelamiento es un desenlace de la acción, y la pantalla cambia de modo

**Decisión.** `409 configuration-frozen` no es un error que se muestra y se olvida: la pantalla lo
recibe por `onRejected` (lo trajo la 006 al núcleo) y pasa a **modo correctivo**. Marca «correctiva»,
muestra el motivo como obligatorio, explica que reinicia la medición, y conserva todo lo cargado.
Correctiva sin motivo es capa 1 condicional, con restricciones en función de los valores, como el
contacto de la 007.

**Por qué no un diálogo.** El motivo es un campo del mismo cuerpo, y un `422` sobre él
(`configuration-reason-required`) tiene que caer en él. `GR-69` impide abrir un diálogo desde otro, y
`GR-37` pone los errores que explicar en una pantalla.

---

## §11 · El historial es una colección como el registro del merchant

**Decisión.** Cada historial es una tabla con cursor y «cargar más», compuesta como `MerchantLog`
(`OW-4`): versión, instante, operador, correctiva con su motivo, y en los globales el nombre y las
mediciones que reinició. Abrir una versión del merchant muestra lo que declaró, que ya viene en la
página; abrir una global pide `get…Version` por su número.

**Dónde vive lo compartido.** La tabla del historial y la sección correctiva las usan las dos
funcionalidades: van a `apps/console/src/components/`, que `boundaries` deja importar desde
`features`. Lo que toca el contrato queda en el `data/` de cada una.

---

## §12 · Dos funcionalidades, no una

**Decisión.** La configuración del merchant vive en `features/merchants` —se llega desde la ficha y
termina en ella—. Plataforma y defaults son una funcionalidad nueva, `features/configuration`, con su
flujo y su grupo de menú.

**Por qué.** El flujo de merchants ya tiene su raíz en la grilla; los niveles globales no tienen
merchant, y meterlos ahí obligaría a pasar por la grilla para llegar a la plataforma. El menú
(`CU-48`) agrupa por funcionalidad, y «Configuración» es un grupo con dos entradas.

---

## §13 · Lo que el núcleo ya hace, y sólo hay que usar

- **Salir con cambios avisa**: `useUnsavedWork(dirty)` con el bloqueo del ruteador (`GR-73`).
- **Los cuatro estados de una vista**: `Result` (`CU-24`).
- **Un `422` sin campo no se pierde**: `useForm` avisa con `rejectedOffForm` (`CU-49`).
- **Un `403` que la pantalla no debió ofrecer** deja rastro y avisa con su identificador de pedido
  (`OW-3`).
- **Renglones en un formulario**: nombres con índice y `unset` (la 006).
