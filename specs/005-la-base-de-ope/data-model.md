# Las cosas · La base de OPE

**Carpeta**: `005-la-base-de-ope` · **Fecha**: 2026-10-08

Diez cosas. **Seis son campos que cambian en algo que ya existe**, dos son tipos nuevos que
reemplazan a uno viejo, y dos son nuevas de verdad: el módulo del contrato y el estado del bearer.
Que sean pocas es la señal de que la copia aguanta: cuarzo ya tenía la forma, y lo que cambia es
qué viaja adentro.

---

## 1 · La configuración de la sesión, sin proveedor

```
SessionConfig
├── toCapabilities      (claims) => ReadonlySet<string>   obligatoria, la pone la aplicación
└── reentryTimeout?     ms                                 la honra el adaptador que tenga reingreso
```

**Se van `issuer` y `clientId`.** No eran de la puerta: eran del único adaptador que existía. Cuando
exista OIDC, los recibe su `createOidcSession({ issuer, clientId, … })`, tipados y suyos.

`configureSession` falla si `toCapabilities` no es una función, y por nada más.

## 2 · El puerto de sesión, con entrada y oído

```
SessionPort
├── resolve()            una vez, antes de dibujar
├── authorize(request)   el pedido, autorizado — lo único que toca el token
├── observe?(response)   NUEVO · la respuesta, mirada — un 401 termina la sesión
├── signIn?(credential?) NUEVO · la entrada del adaptador — recibe, no devuelve
├── signOut()
├── reenter()
├── getState()
└── subscribe(listener)
```

**`signIn` y `observe` son opcionales** porque un adaptador por redirección no los necesita: entra
solo y renueva solo. La falsa implementa `signIn` para poder probar la vista de ingreso; el bearer
implementa los dos.

```
SignInOutcome = { ok: true } | { ok: false; reason: 'rejected' | 'unreachable' }
```

**No hay `SignInOutcome` con el token adentro**, y `tests/gate.mjs` lo vigila: ningún nombre
exportado contiene `token`, y `signIn` es `(credential?: string) => Promise<SignInOutcome>`.

`EndReason` gana **`token-rejected`**: el backend dejó de reconocer el token en vuelo.

## 3 · La máquina, con una transición más

```
resolved:  ['resolving', 'anonymous']     antes sólo 'resolving'
```

Todo lo demás igual: `unauthorized` sin salida al proveedor, `ended` terminal. **Desde `anonymous`
se entra**, que es lo que el ingreso con credencial necesita y lo que la redirección nunca necesitó.

## 4 · El estado del bearer

Lo que `createBearerSession` guarda en su clausura y en ningún otro lado:

```
token:     string | undefined     en memoria; undefined en anonymous y ended
identify:  (authorize) => Promise<Claims>    la da la aplicación; en OPE, getOperator (040) o la sonda
```

| evento | de dónde | qué hace |
|---|---|---|
| `resolve()` | arranque | `no-session` → `anonymous`. Nunca hay sesión previa: el token no sobrevive |
| `signIn(token)` | la vista de ingreso | guarda, `identify(authorize)`; con claims → `resolved`; con `401` → borra y `{ ok: false, reason: 'rejected' }`; sin servidor → borra y `'unreachable'` |
| `observe(401)` | cualquier pedido | borra y `ended` con `token-rejected` |
| `signOut()` | la barra | borra y `ended` con `signed-out` |
| `reenter()` | nunca | no hace nada: no emite `renewal-failed`, así que `expiring` y `waiting` no se alcanzan |

Los claims con los que entra: `{ sub: operatorId, operatorId, name: displayName ?? operatorId,
scope: '*' | string[] }`. `name` conserva la clave que `UserBar` ya lee; `scope` es lo que
`userCaption` traduce a «Todos los merchants» o «N merchants».

## 5 · Lo que respondió el servidor cuando no pudo

```
RequestFailed extends Error
├── status      number
├── type        string          el slug: 'merchant-out-of-scope', sin 'urn:ope:problem:'
├── title       string          fija por tipo
├── detail?     string          de esta ocurrencia; message = detail ?? title
├── requestId?  string          NUEVO opcional · X-Request-Id, o requestId del cuerpo (040); nunca inventado
└── errors      FieldError[]    sólo en 400 y 422

FieldError
├── pointer     string          JSON Pointer relativo al pedido: /body/origins/0
└── message     string
```

**Se ramifica por `type`**, nunca por `detail`. `fieldNameOf(pointer)` devuelve `origins.0` para
`/body/origins/0` y **`undefined`** para `/query/cursor` o `/headers/x`: un puntero que no es del
cuerpo no es de ningún campo, y va al aviso.

Lo que reemplaza: `code` → `type`, `fields[{field, code, message}]` → `errors[{pointer, message}]`,
`requestId: string` → `requestId?: string`. `failedWith(error, slug)` conserva su forma.

## 6 · La colección, en vez del sobre paginado

```
Collection<T>
├── items        readonly T[]
└── nextCursor?  string          ausente en la última página
```

Es la forma de todo `<X>Page` del contrato (`ADR-020`), y **no lleva total**. Reemplaza a `Page<T>`,
`Meta`, `PagedMeta` e `isPaged`. Una respuesta no paginada es `T` pelado: `unwrap<T>` devuelve `T`.

`useCollection(key, fetchPage, { from })` acumula tramos con `useInfiniteQuery`:

```
CollectionQuery<T>
├── items        T[]            aplanados, en orden de llegada
├── hasMore      boolean        = último nextCursor !== undefined
├── loadMore()                  pide el siguiente y escribe su cursor en la dirección
├── loadingMore  boolean
└── …QueryLike                  error, isPending, isFetching, refetch — lo que resultOf ya lee
```

## 7 · El estado de la grilla en la dirección

```
TableQuery
├── search · query · filtered · filter(value)     igual
├── currentRow · setCurrentRow(id)                igual
├── cursor       string | undefined               NUEVO · <grid>.c — el del último tramo cargado
└── setCursor(next)                               NUEVO · reemplaza la entrada, conserva el state
```

**`page` y `setPage` se van.** `filter()` borra `c` y `row`, como antes borraba `p` y `row`.

## 8 · La operación, con capacidades del vocabulario

```
Operation<Input, Output>
├── id            OperationId          del módulo; un typo no compila
├── capabilities  readonly Capability[]   antes roles: readonly string[]
├── idempotent    boolean              omisión false — OPE repite por cuerpo, no por clave
├── versioned     boolean              omisión false — dormido con CU-29
├── serviceId
└── run(service, input, idempotencyKey?)
```

`Action.requires` pasa a ser la unión de `capabilities`. `defineAction` sigue fallando con cero
operaciones y con cero capacidades.

## 9 · El módulo del contrato

Lo que `contracts/ope/capabilities.d.ts` declara y `@ope/core` tipa como `ContractModule`:

```
CONTRACT
├── version      string      info.version del bundle
└── sha256       string      del bundle, igual que identity.json

CAPABILITIES     readonly Capability[]        el vocabulario del consumidor admin
OPERATIONS       Record<OperationId, { capabilities, idempotent, consumer }>
```

**Detalle en [`contracts/contract-artifact.md`](contracts/contract-artifact.md).** Lo que
`conformity` compara: `CONTRACT.sha256 === identity.sha256 === sha256(openapi.yaml)`, y cada
`OperationId` existe como `operations[...]` en `api.d.ts`.

## 10 · La configuración de la aplicación

```
baseSchema
├── systems          Record<string, baseUrl>     'http(s)://…' o '/ruta'   — antes url
└── waitThresholdMs  ms
```

**Se van `issuer` y `clientId`** (cosa 1). `baseUrl` acepta una ruta desde la raíz porque la consola
habla con el mismo origen (`/api`); `url` sigue existiendo para quien necesite una absoluta. Un
`config.json` **nunca lleva un token**: el esquema no tiene dónde ponerlo, y ésa es la garantía.
