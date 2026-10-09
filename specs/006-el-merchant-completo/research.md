# Investigación · El merchant completo

**Carpeta**: `006-el-merchant-completo` · **Fecha**: 2026-10-08

Lo que había que mirar antes de planificar: qué da el núcleo heredado, qué da granito, qué dice el
contrato, y en qué no alcanza ninguno de los tres. Cada sección termina en una decisión, con lo que
se descartó.

---

## §1 · El alta es una pantalla de dos pasos, y el segundo no tiene ruta

**Lo que hay.** `NewMerchantDialog` abre un `Dialog` de granito con un campo y un `Checkbox`,
llama a `createMerchant` y en `onDone` cierra: el `MerchantCreated` con las credenciales **se
descarta**. `GR-70` dice que el alta entra a una pantalla desde el botón de la grilla; `GR-42`,
que un diálogo no espera datos del servidor.

**Lo que se decide.** Una pantalla `/merchants/new` (`newMerchantScreen`, sin parámetros) con un
`Form` de granito y dos secciones: los orígenes y la firma. Al crear, **la misma pantalla cambia de
paso**: guarda el `MerchantCreated` en estado del componente y dibuja las credenciales con
`SecretOnce` (§6). «Continuar» informa `merchantCreated({ merchantId })` y el flujo lo lleva a la
ficha con `finishes(…, merchantScreen)`: el alta **se termina**, no se apila, así que volver desde
la ficha cae en la grilla y no en un formulario vacío.

**Por qué el segundo paso no es pantalla con ruta.** Una ruta se reproduce con lo que hay en la
dirección, y acá no hay nada: el secreto vive en memoria del componente y en ningún otro lado
(`OW-8`). Una ruta `/merchants/:id/credentials` dibujaría «no hay nada» en toda recarga, que es una
pantalla mintiendo.

**Lo que se descartó.** Mostrar las credenciales en un `Dialog` después del alta (un diálogo que
muestra un secreto que se va con el clic es el peor lugar para leerlo con calma); y mandarlas al
aviso de éxito (un aviso dura seis segundos, y `create-merchant.ts` ya lo rechaza por escrito).

## §2 · La rotación es pantalla, por `GR-37` y no por tamaño

**Lo que hay.** Tres operaciones gemelas (`rotateIngestKey`, `rotatePlatformKey`,
`rotatePlatformSecret`) con el mismo cuerpo opcional `{ graceSeconds }`, la misma respuesta
`CredentialIssued` y los mismos rechazos (`422 rotation-grace-too-long`, `409 merchant-deactivated`).
Todas exigen `credentials:rotate`.

**Lo que se decide.** Una pantalla `/merchants/:merchantId/rotate/:kind` con un `Form`: qué llave
es y qué deja de valer (texto por clase), y un `NumberInput` para la gracia, en segundos, cero por
omisión. Al rotar, el mismo paso de credenciales que el alta (`SecretOnce`) con el valor nuevo y
`previousExpiresAt`; «Volver» informa `rotationClosed` y el flujo cierra el escalón.

**Una sola acción, tres operaciones.** `rotateCredential` declara las tres en `operations` y `run`
elige por `kind`; `requires` es la unión —`credentials:rotate`— y el botón se dibuja o no por eso.
Tres acciones serían tres pantallas o una pantalla con tres `useAction`, y el formulario es uno.

**`kind` llega por la ruta como texto** (`useScreenParams` da `string`): se valida contra
`CredentialKind` del contrato y lo que no es una clase se trata como «no existe», igual que un
merchant fuera de alcance.

**Lo que se descartó.** Un diálogo con el campo de gracia (`GR-37`: tiene consecuencia, tiene un
`422` que explicar y devuelve algo que hay que leer; y `GR-37` prohíbe que un diálogo abra otro, que
es lo que haría al mostrar el secreto); y rotar sin pedir gracia (la omisión del contrato es cero,
que revoca en el acto: hay que poder elegir otra cosa antes de apretar).

## §3 · El interruptor y la desactivación son diálogos de confirmación, y el diálogo es del núcleo

**Lo que hay.** `setKillSwitch` es un `PUT { enabled }` idempotente por estado: apagar lo apagado
es `200`. `deactivateMerchant` es terminal. Los dos son un sí/no con consecuencia: `GR-37` los hace
diálogo, `GR-65` dice que el confirmar se puede apagar y decir por qué (mientras corre).

**Lo que se decide.** `ConfirmDialog` en `packages/core/src/ui/`: un `Dialog` de granito con
`answers: 'yes-no'`, título, **la consecuencia** como `description`, tono (`danger` para apagar y
desactivar, `primary` para encender), `confirmDisabled` mientras la acción corre y la razón. No
sabe de merchants: recibe textos y un `onConfirm`. Pasa la prueba del principio V —el portal va a
confirmar cosas con consecuencia igual— y no es visual: compone.

`KillSwitchButton` y `DeactivateButton` (que hoy dispara directo) lo usan desde
`features/merchants/screens/`.

**Lo que se descartó.** Un `confirm()` del navegador (no es de granito, no apaga el botón, no dice
la consecuencia con formato); y una pantalla para apagar (no hay error de negocio que explicar más
que el `409`, que es un aviso, y no devuelve nada que leer).

## §4 · El `409` tiene que refrescar la ficha, y el núcleo no tiene con qué

**Lo que hay.** `useAction` resuelve `run` siempre —un `RequestFailed` se traga después de
avisarlo— y sólo expone `fields`, `running` y `clash`. `onDone` corre con éxito; **no hay
`onRejected`**. Con `409 merchant-deactivated`, la ficha sigue mostrando «activo» con sus botones.

**Lo que se decide.** `ActionOptions` gana `onRejected?: (failed: RequestFailed) => void`,
simétrico de `onDone`, que corre con cualquier `RequestFailed` después del aviso. La pantalla lo usa
para invalidar `oneMerchant(id)`: la ficha se vuelve a pedir, dice «desactivado» y los botones no se
dibujan. Es del núcleo porque el portal va a tener la misma forma —una acción que el servidor rechaza
porque el estado cambió debajo—.

**Lo que se descartó.** Invalidar después de todo `run` desde la pantalla (`run` no distingue éxito
de rechazo, y refrescar tras un fallo de red pide otra vez lo que ya falló); y que `useAction`
invalide solo en todo rechazo (decidir por la pantalla qué refresca es lo que `CU-25` le reserva a la
acción).

## §5 · El primer formulario del panel paga la deuda de `CU-38`

**Lo que hay.** `deuda.md` §4: las restricciones del alta están **a mano** en
`create-merchant.ts` con la cita del contrato, y el plan de la 005 fijó que se paga «antes del
primer formulario del panel». Éste es ese formulario, y trae un segundo (`graceSeconds`, con
`minimum: 0`).

**Lo que se decide.** `contract-sync` emite `contracts/ope/constraints.{js,d.ts}` desde
`components.schemas` del bundle —la **capa 1** de `CU-38`: `required`, `type`, `minLength`,
`maxLength`, `pattern`, `minimum`, `maximum`, y para una propiedad `array` sus `minItems`,
`maxItems` e `items`— con la misma cabecera interina que el módulo de capacidades, y lo que la 040
del backend tiene que emitir gana una entrada ([`contracts/constraints-artifact.md`](contracts/constraints-artifact.md)).
`FieldConstraints` gana `minItems`, `maxItems` e `items`. `conformity` verifica que cada clave de
`CONSTRAINTS` sea un esquema del bundle y que su `required` coincida.

**La capa 2 se queda a mano, con su cita.** `invalid-origin` es un `x-invariant` del esquema cuya
regla es prosa («every origin is scheme://host[:port] without a path»); no se puede emitir como
predicado. `isOrigin()` vive en la funcionalidad y cita el invariante; el servidor sigue siendo la
autoridad y su `422` cae en el renglón.

**Lo que se descartó.** Dejarlo para la 040 (el segundo formulario a mano ya es el caso que la deuda
dijo que no se tolera); y que el emisor viva en `packages/core` (lee el bundle de OPE, que
`packages/` no conoce — principio III).

## §6 · Un secreto que se muestra una sola vez: se compone, y se propone

**Lo que hay.** Granito no tiene un componente para «un valor que se copia y se va». Tiene `Value`,
`Field`, `Alert` y `Button`. El portapapeles es conducta del navegador
(`navigator.clipboard.writeText`), no estilo, y puede faltar (contexto inseguro).

**Lo que se decide.** `SecretOnce` en `packages/core/src/ui/`: un `Alert` de advertencia con el
texto que la aplicación da, y por cada secreto un `Field` con `Value` en fuente de código y un
`Button` «copiar» que dice «copiado» un instante o «no se pudo copiar» si el portapapeles falla.
Recibe `{ label, value }[]` y textos; no sabe qué es una llave. **No guarda nada**: lo que recibe se
dibuja mientras está montado y se olvida al desmontar. Es composición con piezas de granito
(principio IV, como `LoadMoreCursor` en `OW-4`), y la propuesta a granito queda en `OW-8`.

**Lo que se descartó.** Un `TextInput readOnly` con el valor (parece editable y se lee como
formulario); y esconder el valor hasta un clic (un paso más para algo que el operador vino a leer, y
nada protege: ya está en pantalla).

## §7 · El registro del merchant es una colección más, en la ficha

**Lo que hay.** `listMerchantAdminLog` pagina por cursor con la misma forma que `listMerchants`;
`useCollection`, `useTableQuery` y `LoadMoreCursor` ya lo resuelven. `AdminEntry` trae `at`
(instante), `operatorId`, `operation`, `outcome`, y opcionales `merchantId`, `code`, `result`,
`reason`.

**Lo que se decide.** `useMerchantLog(merchantId, { from, onCursor })` en `data/merchant-log.ts`
con clave `[...oneMerchant(id), 'log']`, y una `Section` en la ficha con `Table` de cinco columnas
—instante, operador, operación, resultado como pastilla (`accepted` éxito, `rejected` aviso,
`denied` peligro), código— y `LoadMoreCursor`. El cursor va a la dirección como `log.c`
(`useTableQuery('log')`), al lado del `merchantId` de la ruta: un enlace reproduce el tramo.

**El instante se muestra con fecha y hora.** Granito formatea `date` (sólo `YYYY-MM-DD`) y no tiene
formato de instante. Se compone: `dayOf` para la fecha más la hora `HH:mm` del instante en UTC, en
una celda de texto; **la zona se dice** en el encabezado («UTC»). Es lo que el contrato da; convertir
a la zona del navegador sin decirlo es mentir en una auditoría.

**Lo que se descartó.** Una pantalla aparte para el registro (es del merchant y se lee junto a su
estado; `GR-38` lo pone con el bloque sobre el que informa); y traducir `operation` (tabla que se
desincroniza con cada operación nueva, asumido en la spec).

## §8 · Qué invalida cada acción, y el `off` que ya estaba

**Lo que hay.** `STATUS_TONE` ya tiene `off: 'warning'` y `merchantsStrings.off = 'Apagado'`: la
grilla y la pastilla de la ficha ya saben dibujarlo. `createMerchant` invalida `allMerchants`;
`deactivateMerchant`, `allMerchants` y `oneMerchant`.

**Lo que se decide.** `setKillSwitch` invalida `allMerchants` y `oneMerchant` (el estado cambia en
las dos). `rotateCredential` invalida `oneMerchant` (el `issuedAt` nuevo está en la ficha) y **no**
`allMerchants` (la grilla no muestra credenciales). Las cuatro acciones invalidan además el registro
del merchant (`[...oneMerchant(id), 'log']`): lo que se acaba de hacer tiene que aparecer en él sin
recargar.

## §9 · La telemetría no ve ningún secreto, y una prueba lo afirma

**Lo que hay.** `useAction` registra `actionRan { action, screen, durationMs, outcome }` y, con
un `403` nuestro, `requestFailed { requestId, code, screen }`. Ningún evento lleva cuerpos. El
aviso de éxito del alta lleva sólo `merchantId`.

**Lo que se decide.** La prueba de la pantalla de alta y la de rotación interceptan el puerto de
telemetría y los avisos, corren la acción con un servicio que devuelve un valor conocido, y afirman
que `JSON.stringify` de todo lo registrado **no contiene** ese valor. Es la garantía de `OW-8` en
forma ejecutable; cambiar la telemetría para que lleve cuerpos la rompe.

## §10 · Qué le pide esto a la 040 del backend, y qué no

Se suma a lo que la 005 ya pidió: **`constraints.{js,d.ts}` en `generated/contract/`** con la
forma de [`contracts/constraints-artifact.md`](contracts/constraints-artifact.md), y `errors[]` con
`pointer` en `422 origin-already-registered` (ya pedido; esta feature lo necesita para el renglón).

**No le pide** un `getMerchantKillSwitch` (el estado viene en `Merchant.status`), ni un
`revealCredential` (sería negar `ADR-031`), ni la gracia máxima en el contrato (el `422` la dice
cuando importa; publicarla sería una segunda fuente de la configuración de la plataforma).
