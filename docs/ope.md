# Las decisiones de OPE-Web

Lo que OPE-Web decidió **por encima de lo heredado**. Cada una tiene el mismo formato que las
`CU-n` de cuarzo —título, estado, de qué depende— y una línea **Origen** que dice si enmienda una
heredada, la reemplaza, o es nueva. Las `CU-n` enmendadas conservan su identificador y ganan un
párrafo fechado en su propio documento; qué se hereda tal cual, qué se enmienda y qué se retira está
en [`origen.md`](origen.md).

**Se citan como `OW-n`**, y `ope-check decisions` falla si una cita no resuelve.

---

### OW-1 · OPE-Web nace de una copia de cuarzo, y es un monorepo

**Estado**: decidida · **Depende de**: CU-20, CU-40

**Origen**: reemplaza a `CU-20` y `CU-40` en la forma de usar cuarzo; conserva lo que dicen de qué
se copia y qué se comparte.

Cuarzo es la aplicación base de Tandilia, del mismo dueño que OPE. Se evaluaron tres formas de
usarlo: **como biblioteca con puertos** para dos backends, **como copia adaptada**, o un híbrido. Se
eligió la copia (decisión del dueño, 2026-10-07): el repositorio nace de la copia literal del
commit `9bd4009` de cuarzo, y lo que cambia se cambia **adentro**, sin puertos que sirvan a un
backend que OPE no tiene.

Y es **un monorepo**: `packages/core` y `packages/session` pasan a `@ope/core` y `@ope/session` como
workspaces locales que no se publican, y las aplicaciones viven en `apps/` —`apps/console` hoy,
`apps/portal` después—. La segunda aplicación nace copiando la primera dentro del mismo repositorio
([`segunda-aplicacion.md`](segunda-aplicacion.md)), no clonando entre repositorios.

**Lo que se gana**: un arreglo en `packages/` les llega a las dos aplicaciones en el mismo commit,
sin versión, sin changelog y sin `npm update`. **Lo que se asume**: que lo heredado de cuarzo deja de
recibir sus mejoras automáticamente; lo que convenga traer, se trae a mano y se anota en
`origen.md`.

Las comprobaciones lo saben: `package.json` declara `ope.apps`, y `boundaries`, `labels`,
`quality`, `artifact` y `errors` recorren cada aplicación declarada. Una carpeta nueva bajo `apps/`
que nadie declaró hace fallar la comprobación en vez de quedar sin revisar.

### OW-2 · La puerta no supone proveedor, y entra con una credencial

**Estado**: decidida · **Depende de**: CU-10, OW-3

**Origen**: enmienda a `CU-10`; el principio VI de la constitución cambia con ella.

`SessionConfig` queda con lo que la puerta puede honrar —`toCapabilities` y `reentryTimeout`— y
**`issuer` y `clientId` dejan de ser del piso de configuración**: son del adaptador OIDC, que hoy no
existe, y cuando exista los recibirá tipados como suyos. `SessionPort` gana dos miembros opcionales:

- **`signIn(credential?)`**, la entrada propia del adaptador. **Recibe y no devuelve**: `SignInOutcome`
  es `{ ok: true }` o `{ ok: false, reason: 'rejected' | 'unreachable' }`, sin la credencial adentro.
- **`observe(response)`**, el oído: un `401` en vuelo termina la sesión con `token-rejected`, porque
  con una credencial opaca no hay renovación y el primer `401` **es** el fin.

La máquina acepta `resolved` desde `anonymous` —es la única transición nueva—; `unauthorized` sigue
sin salida y `ended` sigue terminal.

**El adaptador de OPE es el bearer** (`@ope/session/bearer`): la credencial opaca por operador de
`ADR-031` del backend, en una variable de clausura y en ningún almacenamiento —no sobrevive a la
recarga, y ése es el costo asumido—. Quién es el operador lo pregunta la aplicación (`identify`);
hoy con una sonda a `listMerchants`, y con `getOperator` cuando la feature 040 del backend lo
publique.

`tests/gate.mjs` vigila por el texto que `signIn` tenga esa firma, que `SignInOutcome` no nombre la
credencial, y que la superficie principal no nombre un proveedor ni un mecanismo. La vista de
ingreso la trae el núcleo (`SignIn`), compuesta con granito.

### OW-3 · El núcleo habla Problem Details y cuerpos pelados

**Estado**: decidida · **Depende de**: CU-14, CU-25, CU-38, CU-49

**Origen**: enmienda a `CU-14`, `CU-25`, `CU-37` y `CU-49` en lo que nombra el sobre `{ data, meta }`,
`error.code` y `fields`.

OPE responde el recurso **pelado** y, cuando no puede, un **Problem Details** (RFC 9457). El núcleo
lo lee directo, **no con un dialecto intercambiable**: un dialecto sería el puerto para dos backends
que `OW-1` descartó.

- `unwrap<T>` devuelve `T`. `RequestFailed` lleva `status`, `type` —el slug del catálogo, sin
  `urn:ope:problem:`—, `title`, `detail`, `requestId?` y `errors[{ pointer, message }]`.
- **Se ramifica por `type`**, nunca por `detail`. Los defectos nuestros son los `403`
  (`capability-missing`, `merchant-out-of-scope`, `operator-scope-too-narrow`): dejan rastro en la
  telemetría. Un `401 operator-unknown` termina la sesión (`OW-2`). `422` y `409` son rechazos del
  negocio con el `detail` del servidor.
- **Los `errors[]` van al formulario sólo si apuntan al cuerpo**: `fieldNameOf('/body/origins/0')` es
  `origins.0`; un puntero bajo `/query` o `/headers` no es de ningún campo y va al aviso con su
  puntero. Que el cuerpo va bajo `/body` lo fija el backend (`BODY_POINTER` en su `dispatch.ts`).
- **`requestId` es opcional y nunca se inventa.** Sale del encabezado `X-Request-Id` o del miembro
  `requestId` del problema —los dos llegan con la 040—, y mientras no vengan **se dice que no vinieron**:
  `strings.noRequestId` en el aviso y `undefined` en el estado de error de la grilla, que granito
  dibuja sin el botón de copiar.

Las pruebas del núcleo corren sobre las respuestas que el contrato ejemplifica
(`packages/core/tests/fixtures/ope/`). Lo que se vio contra el backend y difiere del contrato —el
`422 origin-already-registered` llega hoy sin `errors[]`— está en el quickstart de la 005 y pedido
a la 040.

### OW-4 · El cursor viaja en la dirección, y «cargar más» se compone

**Estado**: decidida · **Depende de**: CU-14, CU-24, CU-41, CU-47

**Origen**: enmienda a `CU-14` (sin número de página ni tamaño) y a `CU-41` (el cursor en la URL);
`TablePagination`, `Page`, `Meta` e `isPaged` se retiran.

OPE pagina con un **cursor opaco y sin total** (`ADR-020` del backend). De ahí salen tres cosas:

- **`useCollection(key, fetchPage, { from, onCursor })`** acumula tramos sobre `useInfiniteQuery` y,
  al traer uno, anota **el cursor del tramo que llegó** en la dirección (`<grilla>.c`). Un enlace
  con cursor **reproduce ese tramo, no la acumulación**: es lo que el servidor puede dar. La colección
  distingue el cursor que ella anotó del que alguien puso —un enlace pegado, «reintentar», otro
  filtro—: sólo el segundo re-arranca.
- **Un cursor viejo es un error con salida.** El backend responde `400 validation-failed` con el
  puntero `/query/cursor`; la grilla lo muestra como error, y «reintentar» es `setCursor(undefined)`:
  volver al principio.
- **`LoadMoreCursor({ loaded, hasMore, loading, onLoadMore })`** se compone en `@ope/core/ui` con el
  `Button` y texto de granito, sin un estilo propio, y dice «N cargados» y «no hay más».

**Propuesta a granito**, con su evidencia: el `LoadMore` de `@granito/ui` exige `totalItems` y decide
«hay más» con `loaded < totalItems` (`GR-17`); su texto es «N de M». OPE no tiene M, y pasarle
`Infinity` dibuja «20 de ∞». Lo que se le pide a granito es **un `LoadMore` cuyo `totalItems` sea
opcional, o un `hasMore` explícito**; cuando lo tenga, `LoadMoreCursor` se borra y la grilla usa el
suyo. Se conserva de `GR-17` lo que OPE comparte: **un botón, nunca carga automática al llegar al
pie**. La propuesta la lleva el dueño desde granito (Tandilia es sólo lectura).

### OW-5 · El contrato llega como artefacto, y el módulo de capacidades lo publica el frontend

**Estado**: decidida · **Depende de**: CU-14, CU-37, TAN-7

**Origen**: enmienda a `CU-37` (capacidades del módulo en vez de roles por expresión regular) y a
`CU-38` en lo que generaba restricciones del contrato del hola mundo.

`contracts/ope/` **se versiona** y lo deja `npm run contract:sync` (`scripts/contract-sync.mjs`)
desde la carpeta hermana del backend, `OPE_BACKEND_DIR` o una carpeta de release: `openapi.yaml`,
`api.d.ts` y `problem-types.d.ts` copiados tal cual, y el **módulo de capacidades** —
`capabilities.{js,d.ts}`, `identity.json`— con la forma que el frontend publica en
`specs/005-la-base-de-ope/contracts/contract-artifact.md`. Mientras OPE-Backend no emita
`generated/contract/` (su feature 040), el sincronizador lo emite desde el bundle con `yaml`; cuando
lo emita, copia.

`@ope/core` publica `ContractModule` y `OperationRequirement`; **`operation()` exige `capabilities`**
y la aplicación cierra el vocabulario con su módulo: un `operationId` o una capacidad fuera del
contrato **no compila**. `ope-check conformity` verifica que `identity.json`, `CONTRACT.sha256` y el
bundle coincidan, que cada operación del módulo exista en `api.d.ts` y cada operación `admin` del
bundle esté en el módulo, y que `CAPABILITIES` sea la unión ordenada. Falla diciendo «corré
`npm run contract:sync`».

**Lo que se descartó**: leer el bundle del vecino al vuelo (un clon sin vecino no verifica), una
dependencia git al backend (instala el repositorio entero por cinco archivos), y generar `api.d.ts`
acá con `openapi-typescript` (un segundo generador para lo mismo).

### OW-6 · La consola habla con su propio origen, y un reenvío la lleva al backend

**Estado**: decidida · **Depende de**: CU-17, CU-22

**Origen**: nueva; enmienda a `CU-22` en la forma de la URL base de un sistema.

El backend abre CORS **por merchant registrado y sólo para el SDK**; a un panel desde el navegador
le rechazaría el preflight. En vez de pedirle un CORS de administración, **la consola habla con su
propio origen**: `config.json` dice `systems.ope: "/api"`, Vite reenvía `/api` a `localhost:3000`
quitando el prefijo, y en producción el servidor que publica hace el mismo reenvío. `baseUrl` del
esquema acepta una URL absoluta o una ruta desde `/`.

**Lo que se gana**: nada que pedirle al backend, ninguna credencial expuesta a otro origen, y el
mismo artefacto sirve en cualquier despliegue que reenvíe. **Lo que se asume**: que el despliegue
tiene un reenvío, y eso se escribe en el `README.md`.

### OW-7 · El operador se identifica por `operatorId`, y el nombre es opcional

**Estado**: decidida · **Depende de**: CU-27, OW-2

**Origen**: nueva; lo que la barra de usuario muestra cuando no hay OIDC que traiga `name`.

Los claims con los que entra el bearer son `{ sub: operatorId, operatorId, name: displayName ??
operatorId, scope }`: `name` conserva la clave que `UserBar` ya lee, y `scope` es lo que
`userCaption` traduce a «Todos los merchants» o «N merchants». **Las capacidades del operador son
todas las del consumidor `admin`**: el alcance de OPE es por merchant, no por capacidad, y el backend
lo aplica merchant por merchant (`merchant-out-of-scope`). El día que el contrato tenga capacidades
por operador, `identity.ts` deja de usar una constante.

**Hasta la 040**, `identify` es una sonda: `listMerchants` con `limit=1` dice que la credencial sirve
y no dice quién es, así que la barra dice `operator`. La 040 publica `getOperator` con `operatorId`,
`displayName` opcional y `scope`, y la sonda se reemplaza por esa llamada. `displayName` es un dato
de una persona: la constitución VII del backend se acota a las personas observadas y los operadores
quedan como excepción declarada (`ope-no-pii`), pedido en el plan de la 005.

### OW-8 · Un secreto se muestra una sola vez, y en ningún otro lado

**Estado**: decidida · **Depende de**: CU-35, CU-43, OW-3

**Origen**: nueva; la consecuencia en el frontend de `ADR-031` del backend (las credenciales viajan
una vez y nunca más). Decidida en el plan de la 006 (2026-10-08).

El backend entrega el valor de una credencial **en la respuesta que la acuña y nunca más**: al crear
un merchant y al rotar una llave. La consola lo muestra en la pantalla que lo pidió, **como segundo
paso de esa misma pantalla y sin ruta propia**, mientras el componente está montado, y lo olvida al
desmontar. **No va a ningún otro lado**: ni a la dirección (un enlace a un secreto que ya no está es
un enlace a nada), ni al almacenamiento del navegador, ni a un aviso (dura seis segundos y se lee de
reojo), ni a la telemetría (`CU-35` registra acciones y fallos, nunca cuerpos). Recargar lo pierde,
la pantalla lo advierte antes, y la salida es rotar.

**Cómo se muestra**: con `SecretOnce` de `@ope/core`, que compone un `Alert` de advertencia y, por
secreto, un `Field` con `Value` y un botón «copiar» que dice si copió o si no pudo. Es composición
con piezas de granito (principio IV), no un estilo propio. **Propuesta a granito**: un componente
para «un valor que se copia y se va» —valor, copiar, advertencia—; cuando exista, `SecretOnce` se
reemplaza y esta decisión no cambia.

**Cómo se verifica**: la prueba de cada pantalla que muestra un secreto intercepta la telemetría y
los avisos, corre la acción con un valor conocido, y afirma que nada de lo registrado lo contiene.
Cambiar la telemetría para que lleve cuerpos la rompe.
