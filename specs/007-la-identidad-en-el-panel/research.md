# Investigación · La identidad en el panel

**Carpeta**: `007-la-identidad-en-el-panel` · **Fecha**: 2026-10-09

Lo que había que mirar antes de planificar: qué dejó el backend en `generated/contract/`, qué da el
núcleo heredado, qué da granito, y en qué no alcanza ninguno. Cada sección termina en una decisión,
con lo que se descartó.

---

## §1 · La sonda se reemplaza por una llamada, y los claims no cambian de forma

**Lo que hay.** `api/ope/identity.ts` arma un conector mínimo con `authorize` y sin `observe`, pide
`listMerchants?limit=1` y devuelve claims fijos `{ sub: 'operator', operatorId: 'operator', name:
'operator', scope: '*' }`. `OW-7` ya dice la forma final: `{ sub: operatorId, operatorId, name:
displayName ?? operatorId, scope }`. El contrato sincronizado trae `getOperator` (`GET
/v1/admin/operator`, sin capacidad, `x-identifies-principal`) con `Operator { operatorId,
displayName?, scope }`.

**Lo que se decide.** `probeOperator` pasa a `fetchOperator`: la misma firma, el mismo conector
mínimo (un `401` sigue siendo «la credencial no sirve para entrar», y no un `401` en vuelo), y
devuelve los claims de `OW-7` a partir de `Operator`. `UserBar` ya lee `name`; `userCaption` ya lee
`scope`. **Nada más cambia**: ni la puerta, ni la sesión falsa (que ya trae `name: 'Operador de
desarrollo'`), ni `toCapabilities` (las capacidades siguen siendo todas las del consumidor `admin`;
el alcance lo aplica el backend).

**Lo que se descartó.** Pedir `getOperator` por el `OpeClient` de la aplicación: ese cliente lleva
`observe`, y un `401` ahí termina una sesión que todavía no empezó; la identidad se pide antes de que
haya sesión, con el conector mínimo que ya existe.

## §2 · El sincronizador copia, y si no hay qué copiar, falla

**Lo que hay.** `scripts/contract-sync.mjs` tiene dos rutas: copiar `generated/contract/` si existe
(desde OPE-Web PR #3, antes de leer la identidad) o emitir `capabilities.*`, `identity.json` y
`constraints.*` desde el bundle con `yaml`. La segunda ruta son unas doscientas líneas con fecha de
vencimiento cumplida, y `estado.md` y `CLAUDE.md` las listan como muletas.

**Lo que se decide.** Se borran `emitModule`, `emitConstraints`, `FIELD_KEYS`, `refName`, `INTERIM`
y las variables de origen; si `generated/contract/` no existe en el backend, el sincronizador **falla**
con el comando a correr allá (`npm run contract:types`), igual que falla hoy si falta el bundle. El
README que escribe dice «copiado de `generated/contract/`» sin alternativa. La dependencia `yaml`
queda: la identidad del bundle (versión) se sigue leyendo para el README y `conformity` la usa.

**Lo que se descartó.** Dejar la emisión «por si acaso»: un emisor que nadie corre se desincroniza
sin que nadie lo note, y la constitución del backend ya dice que la forma la publica el consumidor y
la emite el backend (`ADR-044`).

## §3 · La grilla lista por nombre; el identificador no se va

**Lo que hay.** `merchants-screen.tsx` dibuja identificador, estado, orígenes y alta. `Merchant` gana
`displayName?`, `storeUrl?`, `contact?`, `notes?`; un merchant creado antes de la 041 llega sin
ellos. Granito no tiene un «valor principal con secundario»; una celda recibe un `ReactNode`.

**Lo que se decide.** La primera columna pasa a ser **el nombre**: `displayName`, o el identificador
en tipografía de código cuando no hay nombre (la celda devuelve un nodo: texto, o `<code>` con el
identificador). La columna de identificador **se queda**, segunda: es lo que las rutas, el registro y
`curl` nombran. Los orígenes **salen de la grilla** y quedan en la ficha: con nombre, ya no son lo que
reconoce a un merchant, y eran la columna más ancha. Estado y alta no cambian.

**Lo que se descartó.** Una columna de URL de la tienda: a la grilla le sobra ancho y a la ficha no;
y una columna «nombre (identificador)» en una sola celda, que mezcla dos cosas que se copian por
separado.

## §4 · La ficha encabeza por nombre y gana una sección de identidad

**Lo que hay.** `merchant-screen.tsx` es un `Form` de sólo lectura con una sección «Merchant»
(identificador, estado, orígenes, alta), las credenciales y el registro; `Page` tiene `title` y
`context`. Granito tiene `Field`, `Value`, `TextArea`; **no tiene `Link`**.

**Lo que se decide.** `Page title={displayName ?? merchantId} context={merchantId}`. Una sección
**«Identidad»** antes de «Merchant», con los campos que el merchant tiene y sólo ésos: nombre, URL de
la tienda, contacto (nombre, email, teléfono, rol: cuatro `Field`, los ausentes sin dibujar) y notas
(un `Field` de tamaño `fill` con el texto tal cual). Un merchant sin identidad no dibuja la sección y
dibuja, en su lugar, un `Field` que dice que todavía no tiene nombre, con «editar» al lado si hay
capacidad. La URL se dibuja como un ancla HTML dentro de `Value` (`target="_blank"`,
`rel="noreferrer"`): es semántica, no estilo. Al pie, «Editar identidad» (`ActionButton`, exige llegar
a la pantalla de edición) va **antes** de apagar y desactivar (`GR-27`).

**Lo que se descartó.** Mezclar la identidad en la sección «Merchant»: una es de la relación
comercial y la otra de la operación, y la spec las separa a propósito. Y una propuesta a granito por
el enlace antes de ver si un ancla dentro de `Value` compone bien: si no compone, va a
`propuestas-a-granito.md` con el caso.

## §5 · La edición es una pantalla con siete campos planos, y manda la identidad entera

**Lo que hay.** `useForm` toma valores `Record<string, string>`, `MessageConstraints` y las marcas
del servidor (`action.fields`), y valida la capa 1 campo por campo con `shapeErrorOf`; `required` es
una lista. `fieldNameOf('/body/contact/email')` da `contact.email`: los renglones de la 006
(`origins.0`) ya usan el punto. `CONSTRAINTS.MerchantProfileInput.fields.contact` es
`{ type: 'object', ref: 'MerchantContact' }` y `CONSTRAINTS.MerchantContact` tiene los cuatro campos
con `format: email` en `email`.

**Lo que se decide.** Una pantalla `/merchants/:merchantId/identity` (`editIdentityScreen`) con un
`Form` de tres secciones —nombre y URL; contacto; notas— sobre **siete campos planos**:
`displayName`, `storeUrl`, `contact.name`, `contact.email`, `contact.phone`, `contact.role`, `notes`.
Las restricciones se arman **una vez** en `data/identity.ts`: las de `MerchantProfileInput` para los
tres primeros niveles y las de `MerchantContact` con el prefijo `contact.`; `required` es
`['displayName']` más `contact.name` y `contact.email` **cuando algún campo del contacto tiene algo**
(la regla «si hay contacto, nombre y email van» del esquema, como capa 1: `useForm` recibe las
restricciones en cada render, así que `required` puede depender de los valores). El cuerpo se arma
con `profileBodyOf(values)`: un campo vacío **no se manda** (ausente es vacío, `ADR-045`); el
contacto se manda sólo si nombre o email tienen algo; **nada se recorta**: lo que el operador escribió
viaja como está, y si tiene espacios en los bordes el backend lo dice en el campo. La precarga sale
de `useMerchant(merchantId)`, y la pantalla dice en su sección que guarda la identidad entera.

`format: email` no lo valida `shapeErrorOf` (sólo `pattern`, largo y rango): se agrega a la capa 1
un patrón mínimo de email **en el núcleo** —`format: 'email'` → una expresión con `@` y un punto en
el dominio—, porque es la forma de un dato y no un negocio (principio III), y la feature siguiente
tendrá emails también.

El mismo `IdentityFields` (los siete campos con sus rótulos y errores) y las mismas restricciones
los usa **el alta**: `new-merchant-screen` gana la sección de identidad antes de los orígenes, y
`createMerchant` manda `{ origins, signature, ...profileBodyOf(values) }`.

**Lo que se descartó.** Un `PATCH` desde la consola (no existe en el contrato); un diálogo (siete
campos y un `422` que explicar: `GR-37`); campos anidados en `useForm` (cambiar el núcleo para un
caso que los nombres con punto ya resuelven); y recortar espacios antes de mandar (el backend
rechaza lo que el operador escribió, y recortarlo a escondidas es guardar otra cosa).

## §6 · La acción de edición invalida la ficha y las listas, y anuncia el nombre

**Lo que hay.** `defineAction` declara operaciones, `run`, `announces` e `invalidates`;
`setKillSwitch` invalida `allMerchants`, `oneMerchant` y el registro.

**Lo que se decide.** `merchant.updateProfile` con la operación `updateMerchantProfile` (exige
`merchants:write`, del módulo), `run` con `{ merchantId, body }`, `announces` «la identidad se
guardó» con el **nombre** del merchant en la descripción (nunca el contacto), e `invalidates`
`allMerchants`, `oneMerchant(merchantId)` y el registro del merchant (la operación está auditada).
`onDone` informa `identityClosed` y el flujo termina en la ficha.

## §7 · Lo que el núcleo ya hace, y sólo hay que mirar

**Lo que hay.** `RequestFailed.requestId` se lee del problema o del encabezado desde la 005, y los
avisos lo muestran o dicen «sin identificador». `useAction` reparte `errors[]` entre los campos por
`fieldNameOf` y manda al aviso lo que no cae en un campo (`CU-49`).

**Lo que se decide.** Nada que construir: la verificación a mano del quickstart muestra el
identificador en un `403` provocado. Una prueba de pantalla afirma que `422 invalid-merchant-profile`
con `/body/storeUrl` cae en la URL y con `/body/contact/email` en el email.

## §8 · Los documentos: dos enmiendas y dos secciones que se van

**Lo que se decide.** `OW-5` y `OW-7` ganan un bloque «**Enmienda OPE (2026-10-09)**» como los de
las `CU` enmendadas: en `OW-5`, que el backend emite `generated/contract/` y el sincronizador sólo
copia; en `OW-7`, que `identify` es `getOperator`. `docs/decisiones.md` no cambia de estado (siguen
decididas). `estado.md` reemplaza «Las muletas de la 040» por lo que la 040 y la 041 trajeron, y
`CLAUDE.md` pierde la sección de las muletas. `contracts/ope/README.md` lo reescribe el sincronizador.
