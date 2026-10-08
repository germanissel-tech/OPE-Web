# Investigación · La base de OPE

**Carpeta**: `005-la-base-de-ope` · **Fecha**: 2026-10-08

Once incógnitas, medidas sobre la copia de cuarzo y sobre el backend de OPE **antes** de escribir el
plan. Tres cambiaron lo que iba a proponer: el `LoadMore` de granito no sirve tal cual, el backend
no habla CORS con un panel, y el `401` no tiene hoy quién lo escuche.

---

## §1 · El monorepo: `apps/` al lado de `packages/`, y las comprobaciones lo tienen que saber

**La pregunta**: cómo entra `apps/console` sin romper lo que `cuarzo-check` ya verifica.

**Lo medido**: toda comprobación parte de `process.cwd()` (`checks/context.mjs`) y tiene la aplicación
**cableada en `src/`**: `boundaries.mjs` mira `STYLE_ROOTS = ['src', 'packages/core/src',
'packages/session/src']` y las zonas `src/{app,features,components,lib,api,testing}`;
`artifact.mjs` mira `dist/` de la raíz; `compositionLayer` lista `src/app/main.tsx`. Las claves
configurables son seis y **cualquier otra falla** (`KNOWN`).

**La decisión**: el monorepo es `packages/*` + `apps/*`, los dos como workspaces de npm, y las
comprobaciones **aprenden `apps`** como séptima clave: `"ope": { "apps": ["apps/console"] }`. De ahí
salen las raíces de estilo (`apps/<x>/src`), las zonas (`apps/<x>/src/{app,features,…}`), el `dist/`
que mira `artifact.mjs` (`apps/<x>/dist`), y la capa de composición (`apps/console/src/app/main.tsx`
sigue cumpliendo `(^|/)app/`). `ope-check` corre **una vez desde la raíz** y recorre todas las
aplicaciones; un repositorio sin `apps` falla en vez de aprobar sin sujetos (`TAN-6`, regla 4).

**Lo que cambia de nombre, y es sólo nombre**: `@cuarzo/core` → `@ope/core`, `@cuarzo/session` →
`@ope/session`, `cuarzo-check` → `ope-check`, la clave `cuarzo` del `package.json` → `ope`, el
complemento `cuarzoBuild` → `opeBuild`, la marca de la falsa `CUARZO_FAKE_SESSION_NOT_FOR_PRODUCTION`
→ `OPE_FAKE_SESSION_NOT_FOR_PRODUCTION`, y `__CUARZO_BUILD__` → `__OPE_BUILD__`. Los nombres de la
API (`defineScreen`, `useAction`, `RequestFailed`) **no cambian**: no son de Tandilia.

**Lo que `packaging.mjs` deja de poder exigir**: hoy falla si no hay ningún paquete publicable, y
los dos pasan a `private: true`. Se enmienda al revés: **con workspaces, `exports` y `files` se
siguen verificando** —el consumidor resuelve por `exports` igual que desde npm— y la identidad para
publicar (licencia, repositorio, versión, peers acotados) se exige **sólo a los que no son
privados**. Lo que falla con cero sujetos pasa a ser «no hay ningún paquete», no «ninguno es
publicable».

> **Alternativas consideradas**: (a) dejar la aplicación en `src/` y poner el portal en `apps/portal`
> — dos formas para lo mismo, y la segunda aplicación no podría copiar a la primera por su ruta;
> (b) una comprobación por aplicación corrida desde cada `apps/<x>` — repite la del paquete en
> cada una y pierde la visión de conjunto que `packaging.mjs` necesita.

---

## §2 · La puerta deja de suponer OIDC, y el `anonymous` gana una entrada

**La pregunta**: qué tiene que cambiar en `@cuarzo/session` para que un adaptador bearer y uno OIDC
entren por la misma puerta sin que la puerta sepa cuál es.

**Lo medido**: `SessionConfig` exige `issuer` y `clientId` y `configureSession` **falla sin ellos**;
`baseSchema` los exige en `config.json`; `bootstrap.tsx` los lee de ahí y los pasa. La máquina
(`state.ts`) acepta `resolved` sólo desde `resolving`, así que **desde `anonymous` no hay forma de
entrar**: el estado existe para mostrar «no hay sesión», y la única salida es que el proveedor
redirija. Y `SessionPort` tiene `authorize`, `signOut`, `reenter`, `resolve`, `getState`,
`subscribe` — nada que reciba una credencial.

**La decisión**, en cuatro partes:

1. **`SessionConfig` queda con lo que la puerta puede honrar**: `toCapabilities` y `reentryTimeout?`.
   `issuer` y `clientId` **se van a la configuración del adaptador OIDC**, que es quien los lee; hoy
   no hay adaptador OIDC, así que hoy no existen en ningún lado. `baseSchema` los pierde.
2. **`SessionPort` gana `signIn?`**: `(credential?: string) => Promise<SignInOutcome>`, con
   `SignInOutcome = { ok: true } | { ok: false; reason: 'rejected' | 'unreachable' }`. Es
   **opcional** porque un adaptador que entra por redirección no lo necesita. **Recibe** una
   credencial y no devuelve ninguna: la regla de `CU-10` —nada de lo exportado entrega un token— se
   mantiene, y `tests/gate.mjs` la sigue vigilando por el texto.
3. **La máquina acepta `resolved` desde `anonymous`**. Es la única transición nueva; `unauthorized`
   sigue sin salida y `ended` sigue terminal.
4. **La vista de `anonymous` la pone la aplicación** como ya podía (`manifest.sessionViews`), y el
   núcleo trae una por omisión para el bearer: **la pantalla de ingreso**, compuesta con `Page`,
   `Field`, `TextInput` y `Button` de granito, que llama a `signIn(credential)` y muestra
   `strings.signInRejected` o `strings.serverUnreachable` según el desenlace.

**El adaptador bearer** (`@ope/session/bearer`): `createBearerSession({ toCapabilities, identify })`.
`resolve()` aplica `no-session` (el token no sobrevive a una recarga: vive en una variable de la
clausura y en ningún almacenamiento). `signIn(token)` guarda el token, llama a
`identify(authorize)` —que el adaptador no escribe: se la da la aplicación, y en OPE es
`getOperator` de la feature 040— y con la respuesta aplica `resolved` con claims
`{ sub: operatorId, operatorId, name: displayName ?? operatorId, scope }`; con `401` responde
`{ ok: false, reason: 'rejected' }` y **borra el token**. `authorize` pone
`Authorization: Bearer <token>`. `signOut` aplica `ended`/`signed-out` y borra el token. `reenter`
no hace nada: este adaptador nunca emite `renewal-failed`, así que `expiring` y `waiting` son
inalcanzables con él.

**Mientras `getOperator` no exista** (040 sin desplegar), `identify` de la consola usa
`listMerchants` con `limit=1` como sonda: un `200` dice que el token sirve y no dice quién es; los
claims quedan `{ sub: 'operator', operatorId: 'operator' }` y la barra dice eso. Se escribe así en
`identity.ts` de la consola con su comentario, y se reemplaza cuando 040 llegue.

> **Alternativas consideradas**: (a) un `SessionPort` por mecanismo (`BearerPort`, `OidcPort`) —
> dos puertas es lo que `CU-10` existe para no tener; (b) poner `signIn` en la configuración y no en
> el puerto — la vista de ingreso necesita llamarlo desde el árbol, y lo que el árbol puede pedir
> es `useSessionControl`; (c) guardar el token en `sessionStorage` para sobrevivir a la recarga —
> la spec lo descarta a propósito: el costo de la recarga se asume y se escribe.

---

## §3 · El `401` no tiene hoy quién lo escuche

**La pregunta**: cómo termina la sesión cuando el backend responde `401 operator-unknown` a una
operación cualquiera, si la puerta sólo ve pedidos.

**Lo medido**: `authorize(request)` recibe y devuelve un `Request`; **ninguna pieza del núcleo mira
el estado `401`** (`grep 401 packages/core/src` no encuentra nada que no sea un comentario). En
cuarzo lo resolvía el proveedor OIDC por su cuenta —renueva o falla y emite `renewal-failed`—, y
con un token opaco no hay renovación: el primer `401` **es** el fin.

**La decisión**: `SessionPort` gana `observe?: (response: Response) => void`, opcional como `signIn`,
y `AppSession` lo reexpone junto a `authorize`. El cliente de OPE (`createOpeClient`, §5) lo cablea
en el `onResponse` de `openapi-fetch`, al lado del `onRequest` que ya cablea `authorize`. El bearer lo
implementa: con `401` aplica `ended` con razón `token-rejected` (razón nueva de `EndReason`), y la
vista de `ended` dice por qué y ofrece volver al ingreso. `bootstrap.provide` deja de recibir
`authorize` suelta y recibe `session: { authorize, observe }`, para que un servicio no pueda cablear
una sin la otra.

> **Alternativas consideradas**: (a) que `unwrap` termine la sesión — `data` mirando hacia la sesión,
> y `unwrap` no la tiene; (b) que cada pantalla trate el `401` — es el caso que `CU-25` centraliza
> para que nadie se olvide.

---

## §4 · Problem Details reemplaza al sobre, en los dos caminos

**La pregunta**: qué cambia en `envelope.ts`, `notice.ts`, `use-action.ts`, `result-of.ts` y
`use-form.ts` para hablar RFC 9457 y cuerpos pelados.

**Lo medido**: `unwrap` abre `{ data, meta }`, falla con `ENVELOPE_MISSING` si no hay `data`, y saca
`requestId` de `meta` o del encabezado; `RequestFailed` tiene `status`, `code`, `requestId`,
`message`, `fields[{ field, code, message }]`; `OURS` ramifica por `code` (`FORBIDDEN`,
`IDEMPOTENCY_KEY_REUSE`, `PRECONDITION_REQUIRED`); `isBusinessRejection` es `409` menos
`IDEMPOTENCY_KEY_REUSE`; `useForm` consume `FieldError.field`. El contrato de OPE responde el
recurso pelado (`MerchantPage = { items, nextCursor? }`), y en error `application/problem+json` con
`{ type: 'urn:ope:problem:<slug>', title, status, detail?, instance?, errors?[{ pointer, message }] }`
y `additionalProperties: false` —o sea que **`requestId` en el cuerpo no existe hasta la 040**—.
Hoy ninguna respuesta lleva `X-Request-Id`.

**La decisión**:

- `unwrap<T>(result)` devuelve **`T`** y ya no `Page<T>`; `Page`, `Meta`, `PagedMeta` e `isPaged` se
  retiran. El testigo (`version`) deja de leerse del `ETag` —OPE no lo emite— y la ruta de `CU-29`
  queda dormida: `conflict.ts`, `ConflictDialog`, `versioned` y `retryWith` se conservan sin que
  nadie los ejerza, con su comentario diciendo por qué.
- `RequestFailed` pasa a `{ status, type: ProblemSlug, title, detail, requestId?: string, errors:
  readonly FieldError[] }`, con `FieldError = { pointer, message }`. **Se ramifica por `type`**, que es
  el slug sin el espacio de nombres (`urn:ope:problem:` se recorta en `unwrap`); `failedWith(error,
  slug)` sigue igual de forma. `message` del `Error` es `detail ?? title`.
- `requestId` es **opcional**, y la ausencia se muestra: `strings.noRequestId` («sin identificador»)
  en el aviso y en el estado de error de la grilla; granito recibe `requestId={undefined}` y no dibuja
  el botón de copiar. Se lee del encabezado `X-Request-Id` y, cuando 040 lo agregue, del miembro
  `requestId` del cuerpo; **nunca se inventa**.
- `OURS` pasa a `{ 'capability-missing', 'merchant-out-of-scope', 'operator-scope-too-narrow' }`.
  `isBusinessRejection` pasa a **`status === 422 || status === 409`**: el `409` de OPE es siempre una
  invariante (`merchant-deactivated`, `configuration-frozen`, `idempotency-conflict` —que en OPE es
  «mismo cuerpo, otro contenido», un rechazo y no un defecto nuestro—).
- **Los `errors[]` van a los campos sólo si apuntan al cuerpo**: `pointer` `/body/origins/0` → campo
  `origins.0`; un `pointer` bajo `/query` o `/headers` **no es del formulario** y se trata como aviso.
  `useForm` consume `pointer` ya traducido a nombre de campo por `fieldNameOf(pointer)` en
  `envelope.ts`, que es lo único que sabe la forma del puntero.
- `unwrap` sin cuerpo de problema (un intermediario que cortó antes) arma `RequestFailed` con `type:
  'unknown'`, `title` del estado HTTP, y el identificador del encabezado si vino.

> **Alternativas consideradas**: un «dialecto» intercambiable (sobre de las-animas o Problem
> Details, elegido por configuración) — es el puerto para dos backends que el dueño descartó al
> elegir la copia.

---

## §5 · El contrato llega como artefacto, y el módulo de capacidades lo publica el frontend

**La pregunta**: qué hay en `contracts/ope/`, de dónde sale, y qué hace `ope-check` con eso.

**Lo medido**: el backend emite con `npm run contract:types` `generated/api.d.ts` (openapi-typescript
sobre `contracts/dist/openapi.yaml`), `generated/problem-types.{js,d.ts}` (`PROBLEM_TYPES` con
estado y título por slug, `ProblemSlug`) y `generated/audited-operations.{js,d.ts}`. **No emite
todavía** el módulo de capacidades ni una carpeta para consumidores; eso es de la 040. El bundle
lleva `x-required-capabilities` como lista YAML por operación, `x-idempotency` en las que repiten, y
`info.version` (`1.11.0` hoy). En cuarzo, `tests/roles.mjs` generaba `roles.ts` con expresiones
regulares sobre `contracts/demo.yaml`, y `openapi-typescript` corría con `npx -y` porque instalado
rompía con TypeScript 7 (`CU-38`).

**La decisión**:

- `contracts/ope/` **se versiona** y contiene: `openapi.yaml` (el bundle), `api.d.ts` (copiado del
  backend, no regenerado acá: el backend ya lo produce determinísticamente y así no hace falta
  `openapi-typescript` en este repositorio), `problem-types.d.ts`, `capabilities.js` +
  `capabilities.d.ts` (el módulo de `TAN-7`), `identity.json` (`{ version, sha256 }` del bundle) y
  un `README.md` que dice de qué commit del backend salió cada sincronización.
- `npm run contract:sync` (`scripts/contract-sync.mjs`) copia desde la ruta hermana
  (`../backend`, o `OPE_BACKEND_DIR`) o desde una carpeta descomprimida de un release; **mientras el
  backend no emita el módulo, lo emite el script** desde el bundle con el paquete `yaml` (una
  dependencia de desarrollo; las expresiones regulares de `roles.mjs` no alcanzan para un bundle
  de cuarenta operaciones con listas multilínea), con la cabecera `GENERATED by
  scripts/contract-sync.mjs — interim until OPE-Backend 040 emits generated/contract/`. **La forma
  del módulo es la que el frontend publica** (`contracts/contract-artifact.md`), y es lo que la 040
  tiene que producir: cuando lo produzca, el script copia en vez de emitir.
- `@ope/core` publica el tipo `ContractModule` y **`operation()` exige capacidades del vocabulario**:
  `requires.capabilities: readonly Capability[]`, con `Capability` la unión del módulo. Un `typo` no
  compila. `Operation.roles` pasa a `capabilities`; `versioned` queda con omisión `false`.
- `ope-check` gana la comprobación **`conformity`**: la `identity.json` coincide con el `sha256` del
  bundle, el módulo cita la misma versión, y cada `operationId` del módulo existe en `api.d.ts`.
  Falla diciendo «corré `npm run contract:sync`».
- El servicio `ope` se declara una vez en `apps/console/src/api/ope/client.ts` con `createOpeClient`
  de `@ope/core` (`openapi-fetch` + `authorize` en `onRequest` + `observe` en `onResponse` + `unwrap`),
  y las operaciones con `opeOperation(id, run)`, el gemelo de `demoOperation` sin clave de
  idempotencia.

> **Alternativas consideradas**: (a) leer el bundle del vecino al vuelo — un clon sin vecino no
> verifica (cerrado con el dueño el 2026-10-07); (b) dependencia git al backend — instala el
> repositorio entero por cinco archivos; (c) generar `api.d.ts` acá con `openapi-typescript` — vuelve a
> traer el problema de `CU-38` y produce un segundo generador para lo mismo.

---

## §6 · El `LoadMore` de granito no sirve tal cual, y se compone

**La pregunta**: con qué se dibuja «cargar más» si el contrato no da total.

**Lo medido**: `LoadMore` de `@granito/ui` exige `totalItems: number` y decide «hay más» con
`loaded < totalItems`; su texto es «N de M». `GR-17` lo justifica con el recuento: «conserva el
recuento, que es lo otro que se perdía». OPE pagina con `nextCursor` y **sin total** (`ADR-020`).
Pasarle un total inventado mentiría; pasarle `Infinity` dibuja «20 de ∞».

**La decisión**: igual que la 004 con el diálogo de conflicto: **se compone en `@ope/core/ui`** con
piezas de granito —`Button` y texto— un `LoadMoreCursor({ loaded, hasMore, loading, onLoadMore })`
que dice «N cargados» y «no hay más», sin `className` ni estilos propios (lo verifica
`boundaries.mjs`), y **queda anotado como propuesta a granito**: un `LoadMore` cuyo `totalItems` sea
opcional, o un `hasMore` explícito. La propuesta se escribe en `docs/ope.md` con la evidencia; se
lleva a granito desde granito, no desde acá.

> **Alternativas consideradas**: (a) `Pagination` numérica con totales inventados — miente; (b)
> carga automática al llegar al pie — `GR-17` la rechaza, y con razón que OPE comparte: un límite de
> página invisible no se puede notar.

---

## §7 · El cursor en la URL, y qué reproduce un enlace

**La pregunta**: qué lleva `useTableQuery` cuando ya no hay número de página.

**Lo medido**: `useTableQuery(grid)` escribe `<grid>.q`, `<grid>.p` y `<grid>.row` en la dirección,
reemplazando la entrada y conservando el `state` de la pila (`CU-47`); `filter()` borra `p` y `row`.
TanStack tiene `useInfiniteQuery` con `initialPageParam` y `getNextPageParam`, que es exactamente
«arrancar en un cursor y encadenar por `nextCursor`».

**La decisión**: `p` se retira y entra **`c`**: el cursor **del último tramo cargado**. `useTableQuery`
expone `cursor: string | undefined` y `setCursor(next)`; `filter()` lo borra. La grilla usa
`useCollection(key, fetchPage, { from: table.cursor })` de `@ope/core/data` —sobre `useInfiniteQuery`—
que acumula los tramos y, al traer uno nuevo, escribe su cursor en la dirección. **Un enlace con
cursor reproduce ese tramo**, no la acumulación: es lo que el servidor puede dar, y es lo que el
escenario 4 pide. `resultOf` recibe `QueryLike<Collection<T>>` con los `items` ya aplanados y decide
los cuatro estados igual que hoy.

Un cursor viejo: el backend responde `400 validation-failed` con `pointer: /query/cursor`; es un
error de grilla —no de formulario— y se muestra con el botón «reintentar», que lo que hace es
`setCursor(undefined)` y volver al principio. No queda una grilla vacía sin salida.

---

## §8 · CORS: el backend no le habla a un panel, y no hace falta que lo haga

**La pregunta**: si `apps/console` en `localhost:5173` puede llamar al backend en `localhost:3000`.

**Lo medido**: `src/infrastructure/http/cors.ts` del backend registra CORS **por origen de merchant**
(`isRegisteredOrigin`), sólo `methods: ["POST"]`, y los encabezados permitidos son los de las
credenciales del SDK. Un `GET` con `Authorization` desde un origen que no es de ningún merchant
**falla en el preflight**. No hay `OPE_ADMIN_ORIGINS` ni nada parecido.

**La decisión**: **mismo origen, siempre.** En desarrollo, el `server.proxy` de Vite reenvía `/api` a
`http://localhost:3000` y la consola habla con `/api/v1/...`; en producción, la consola se sirve
detrás del mismo proxy inverso que el backend (se documenta en el quickstart; no se construye acá).
`systems.ope` en `config.json` pasa a aceptar **una URL absoluta o una ruta desde la raíz** (`/api`):
el campo `url` del esquema gana un hermano `baseUrl`, que es lo que `systems` usa. **No se le pide
CORS de administración a la 040**: un panel que opera la plataforma no tiene por qué vivir en otro
origen, y abrir el backend a un origen más es superficie que hoy nadie necesita.

> **Alternativas consideradas**: CORS para `admin` con orígenes configurados — se anota en el plan
> como lo que haría falta **si** alguna vez la consola se sirve desde otro origen, y nada más.

---

## §9 · Lo que se retira, y qué lo reemplaza

| se retira | por qué | qué lo reemplaza |
|---|---|---|
| `checks/requests.mjs`, `PEDIDOS.md`, `../pedidos/` | El protocolo de pedidos entre repositorios es de Tandilia (`TAN-5`) | Las propuestas a granito se anotan en `docs/ope.md` y las lleva el dueño |
| `tests/catalogo.mjs`, `catalogo.test.mjs`, `catalogo.json` | Emite el catálogo que Tandilia consume | Nada: OPE no tiene quién lo lea |
| `tests/clone.mjs`, `npm run clon`, `nueva-aplicacion` | Clonar **entre** repositorios; acá la segunda aplicación copia `apps/console` adentro del mismo | `docs/segunda-aplicacion.md` dice cómo se copia `apps/console` a `apps/portal` y qué se toca |
| `tests/roles.mjs`, `tests/emit.mjs`, `src/api/demo/roles.ts` | Generaba roles por expresión regular desde `demo.yaml` | El módulo de capacidades de `contracts/ope/` (§5) |
| `tests/constraints.mjs`, `src/api/demo/constraints.ts` | Leía `demo.yaml` por líneas; el bundle de OPE no tiene esa forma | **Deuda declarada**: cuando el panel tenga su primer formulario, el emisor se reescribe sobre el bundle con `yaml`. Los tipos `FieldConstraints` y `useForm` del núcleo se conservan |
| `tests/mock.mjs`, `simulado`, `simulado:contrato`, `@stoplight/prism-cli`, `contracts/demo.yaml`, `src/api/demo/` | El hola mundo contra un simulado | El hola mundo contra el backend real (§10) y la sesión falsa para el marco |
| `tests/progress.mjs` (`avance`), `tests/icons.mjs` | Herramientas del ciclo de cuarzo | `npm test` las absorbe o no hacen falta: `icons` se revisa si granito lo sigue exigiendo |
| Regla 12 de `quality.mjs` (la palabra «cliente») | Convención de cuenta corriente de Tandilia | Se quita; en OPE «cliente» no está ocupada |
| `TablePagination`, `isPaged`, `Page`, `Meta`, `PagedMeta` | Paginación por número | `LoadMoreCursor`, `Collection<T>`, `useCollection` (§6, §7) |
| `@cuarzo/session/keycloak` | Forma de un proveedor que OPE no usa | Se conserva **sin exportar** de `package.json` hasta que haya adaptador OIDC: es código que la segunda aplicación va a necesitar, y borrarlo lo haría reescribir |
| `CLAUDE.md`, `README.md`, `estado.md` de cuarzo | Hablan de Tandilia | Se reescriben para OPE-Web (§11) |

Lo que el hola mundo hereda y se **conserva**: `features/home` (bienvenida y «acerca de»), los
flujos, el menú, las preferencias, el contexto de trabajo (`currentBranch` pasa a `currentMerchant`,
que es lo que un operador de OPE tiene en la cabeza), y la telemetría de consola.

---

## §10 · El hola mundo de OPE: merchants, con sus cuatro estados y una acción que exige

**La pregunta**: qué colección real ejerce lo que `catalog` ejercía.

**Lo medido**: `listMerchants` (`merchants:read`, cursor y `limit`, `MerchantPage`), `getMerchant`
(`merchants:read`), `deactivateMerchant` (`merchants:write`, `409 merchant-deactivated`),
`createMerchant` (`merchants:write`, `422 origin-already-registered` con `errors[]`). Es la misma
forma que el catálogo: lista, ficha, un cambio de estado y un alta con diálogo. La edición con
testigo no tiene equivalente —OPE no lo tiene— y se retira con `CU-29` dormida.

**La decisión**: `features/merchants` reemplaza a `features/catalog` pieza por pieza:
`merchants-screen.tsx` (grilla con `LoadMoreCursor`, filtro por identificador del lado del navegador
**no**: `listMerchants` no filtra, así que la barra de filtros **no se dibuja** y `filtered` es
siempre falso —se escribe el comentario de por qué—), `merchant-screen.tsx` (ficha por
`merchantChosen`), `deactivate-merchant.ts` (acción con `merchants:write`, escenario 5 y 7) y
`new-merchant-dialog.tsx` (alta con `origins` y `signature`, escenario 7 con `errors[]`). Lo que
los datos de un merchant **muestran**: identificador, estado, orígenes, fecha de alta y las
credenciales por clase e instante —nunca un valor—, que es lo que el contrato devuelve.

Los papeles de la sesión falsa pasan a `todo: ['merchants:read', 'merchants:write']`, `lectura:
['merchants:read']`, `ninguno: []`, y los claims a `{ sub: 'fake-operator', operatorId:
'fake-operator', name: 'Operador de desarrollo', scope: '*' }`.

---

## §11 · Qué dice el documento de origen, y dónde viven las decisiones nuevas

**La pregunta**: cómo un agente en frío sabe qué heredó, y contra qué resuelve una cita nueva.

**Lo medido**: `decisions.mjs` reconoce tres familias con su documento —`CU` en
`docs/{arquitectura,seguridad}.md`, `GR` en granito, `TAN` en la plataforma— y **el prefijo está
cableado** por familia; la constitución heredada (1.0.0) tiene seis principios y la gobernanza dice
que modificarla es una conversación con versión.

**La decisión**:

- **`docs/origen.md`**: tres tablas —lo heredado tal cual, lo enmendado (con fecha y motivo), lo
  retirado (con qué lo reemplaza)— y el commit de cuarzo del que nace la copia (`9bd4009`).
- **Las decisiones nuevas son `OW-n`** («OPE-Web») en **`docs/ope.md`**, con el mismo formato de
  ficha que las `CU-n` (`### OW-n · título`, estado, depende de) y una línea **Origen** que dice si
  enmienda, reemplaza o es nueva. `decisions.mjs` gana la familia `OW` con ese documento, y el índice
  `docs/decisiones.md` las lista. Las `CU-n` enmendadas conservan su identificador y ganan un párrafo
  fechado **«Enmienda OPE»** que dice qué cambió, como ya hacen las enmiendas de cuarzo.
- **La constitución sube a 2.0.0** y cambia en dos lugares: el principio I pasa de «proponer antes
  de escribir y esperar el OK por archivo» a **«la spec y el plan se acuerdan con el dueño; dentro
  de una feature se implementa con autonomía, y lo que la spec no alcanza a decir se pregunta con
  `clarify`»**; el principio VI deja de decir que la sesión comparte proveedor y pasa a decir que
  **comparte la puerta**, y que cuál es el adaptador lo elige cada aplicación en su raíz. «Cuarzo
  no sabe de negocio» pasa a «`packages/` no sabe de negocio»; «Tandilia» pasa a «OPE».
- `CLAUDE.md` se reescribe con el mapa de OPE-Web (dónde está cada cosa, el ciclo de Spec Kit con
  autonomía por feature, el lazo de comandos, y la regla de que Tandilia es sólo lectura); `README.md`
  describe el monorepo; `estado.md` arranca de cero.

Lo que `OW-1` a `OW-n` registran en esta feature: la copia como forma de usar cuarzo (`OW-1`), la
puerta agnóstica con `signIn` y `observe` (`OW-2`), Problem Details en el núcleo (`OW-3`), el cursor
en la dirección y `LoadMoreCursor` (`OW-4`), el contrato como artefacto sincronizado y el módulo de
capacidades (`OW-5`), el mismo origen en vez de CORS (`OW-6`), y el operador identificado por
`operatorId` con nombre opcional (`OW-7`).
