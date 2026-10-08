# Plan de implementación · La base de OPE

**Carpeta**: `005-la-base-de-ope` · **Rama**: `005-la-base-de-ope` · **Fecha**: 2026-10-08 ·
**Spec**: [`spec.md`](spec.md)

## Resumen

Convertir la copia literal de cuarzo (`9bd4009`) en **OPE-Web**: un monorepo con `packages/` (la
conducta que las dos aplicaciones comparten) y `apps/console` (la forma de la primera), que levanta
contra el backend real de OPE con un token de operador y hereda de cuarzo la sesión, el registro de
pantallas, los flujos, las acciones, los cuatro estados y las comprobaciones — hablando Problem
Details, cursor y capacidades en vez del sobre, la página y los roles de las-animas.

**Lo que la investigación cambió**, en tres puntos ([`research.md`](research.md)): el `LoadMore` de
granito exige un total que OPE no tiene y se compone uno (§6); el backend no le habla CORS a un
panel y no hace falta que lo haga —mismo origen, con proxy— (§8); y el `401` de un token opaco no
tiene hoy quién lo escuche, así que la puerta gana `observe` (§3).

**Y lo que depende del backend**: la feature 040 de OPE-Backend. Esta base levanta sin ella con dos
muletas escritas como tales —la sonda de `listMerchants` en lugar de `getOperator`, y el módulo de
capacidades emitido acá en lugar de allá— y **no se cierra** sin ella.

## Contexto técnico

| | | de dónde sale |
|---|---|---|
| **Lenguaje** | TypeScript 7 en `strict`, sin `any`; Node 24; prosa en castellano, código en inglés | `CU-15`, `CU-16`, constitución |
| **Estructura** | Workspaces de npm: `packages/{core,session}` + `apps/console`; `apps/portal` después, copiando la primera | investigación §1 |
| **Interfaz** | React 19, `@granito/ui` y `@granito/tokens` por `file:` a la carpeta hermana de Tandilia (sólo lectura), npm cuando se publiquen | `CU-7` |
| **Datos** | TanStack Query 5 (`useQuery`, `useInfiniteQuery`), `openapi-fetch` sobre `contracts/ope/api.d.ts` | `CU-14`, investigación §5 y §7 |
| **Sesión** | Puerta agnóstica (`toCapabilities`, `signIn?`, `observe?`); adaptador bearer en memoria; la falsa para desarrollo | investigación §2 y §3 |
| **Errores** | RFC 9457: `RequestFailed { status, type, title, detail, requestId?, errors[] }`; ramificación por slug | investigación §4 |
| **Paginación** | Cursor opaco y `limit`; `Collection<T> = { items, nextCursor? }`; `c` en la dirección; `LoadMoreCursor` | `ADR-020`, investigación §6 y §7 |
| **Capacidades** | Módulo `contracts/ope/capabilities.{js,d.ts}` con la forma de `TAN-7`; `Capability` como unión | investigación §5 |
| **Contrato** | `contracts/ope/` versionado, `npm run contract:sync`, `ope-check conformity` | cerrado con el dueño 2026-10-07 |
| **Red** | Mismo origen: proxy de Vite en desarrollo, proxy inverso en producción; `systems.ope = /api` | investigación §8 |
| **Herramientas** | Biome, Vite 8, Vitest 4 con Testing Library y jsdom, `ope-check` | `CU-16` |
| **Pruebas** | Vitest sobre `packages/*/tests` y `apps/*/src/**/*.test.*`; `node tests/gate.mjs` de la sesión; `ope-check` con cada comprobación rota a propósito | spec «Cómo se verifica» |
| **Alcance** | Una aplicación, cuatro pantallas de hola mundo, cero pantallas del panel | spec «Qué NO hace» |

Sin `NEEDS CLARIFICATION`: las once incógnitas se midieron en la investigación y las tres que el
dueño tenía que decidir se cerraron el 2026-10-07 y el 2026-10-08 (spec, «Lo que se cerró con el
dueño» y «Supuestos»).

## Control de constitución

Contra la constitución heredada de cuarzo, **versión 1.0.0** (ratificada 2026-08-20), que es la que
gobierna hasta que el tramo 6 la enmiende a 2.0.0. Los seis principios, también los que esta feature
enmienda:

| principio | cómo lo cumple |
|---|---|
| **I** · Proponer antes de escribir | La spec, sus tres puntos abiertos y los nombres pasaron por el chat con el dueño antes de este plan. **Se enmienda en el tramo 6**: el ciclo de OPE acuerda la spec y el plan y después implementa con autonomía (decisión del dueño, 2026-10-07). Hasta ahí, rige tal cual |
| **II** · Lo que no está decidido se pregunta | Las tres decisiones que no se podían tomar solas se preguntaron una a una. Lo que queda abierto —el destino de la telemetría— **queda abierto**, no se rellena |
| **III** · Cuarzo no sabe de negocio | `packages/` sigue sin saber qué es un merchant: `createOpeClient`, `LoadMoreCursor` y el bearer no nombran ninguno. El hola mundo que sí lo nombra vive en `apps/console`, que es lo que se copia |
| **IV** · Lo visual es de granito | La pantalla de ingreso y `LoadMoreCursor` se componen con `Page`, `Field`, `TextInput` y `Button`; nada de `className` ni estilos. Lo que falta —un `LoadMore` sin total— es **propuesta a granito**, anotada en `OW-4` |
| **V** · Biblioteca o esqueleto | La prueba es la misma con otra forma: lo que les tiene que llegar a las dos aplicaciones va a `packages/`, lo que diverge a `apps/<x>`. Declarado en la spec y pieza por pieza en la estructura de abajo |
| **VI** · Primero las decisiones, después la primera aplicación | Las decisiones están tomadas (`CU-n` heredadas, siete `OW-n` nuevas). **Se enmienda en el tramo 6** en lo que dice de la sesión: se comparte la puerta, no el proveedor |

### Qué garantía sostiene cada cosa

| | qué sostiene |
|---|---|
| **se genera** | `contracts/ope/api.d.ts`, `problem-types.d.ts`, `capabilities.{js,d.ts}` e `identity.json`: nadie los escribe; `contract:sync` los trae o los emite |
| **no compila** | Una operación con una capacidad fuera del vocabulario del módulo; una acción sin operaciones; una navegación a una pantalla que no existe; una vista de sesión que falta |
| **se hereda** | `apps/console` es la forma: `apps/portal` nace copiándola, y `docs/segunda-aplicacion.md` dice qué se toca |
| **lo agarra una prueba** | `ope-check` (límites con `apps/`, decisiones con `OW`, artefacto por aplicación, calidad sin la regla 12, empaquetado de workspaces, **conformidad** del contrato); las pruebas del núcleo adaptadas a cuerpos pelados, Problem Details y cursor; `tests/gate.mjs` con `signIn` y `observe`; la máquina con `resolved` desde `anonymous`; el arranque contra la falsa |
| **lo mira una persona** | Que la consola levante contra el backend real, entre con un token y muestre los cuatro estados con cursor; que la pantalla de ingreso diga lo que tiene que decir; que la prosa heredada no describa las-animas donde cambió |

Y **tres comprobaciones nuevas o enmendadas se rompen a propósito antes de creerles**:
`conformity` (con una `identity.json` tocada), `decisions` (con una cita `OW-99`) y `packaging` (con
un `exports` que apunte a un archivo que no existe). Es la lección heredada que la spec repite.

## Estructura

```
ope/mvp/web/
├── package.json             workspaces: packages/*, apps/*; clave `ope`; scripts de la raíz
├── biome.json · tsconfig.json · vitest.config.ts
├── contracts/ope/           SINCRONIZADO · bundle, api.d.ts, problem-types.d.ts, capabilities.*, identity.json, README
├── scripts/
│   └── contract-sync.mjs    NUEVO · copia desde ../backend o un release; emite el módulo mientras 040 no lo emita
├── docs/
│   ├── arquitectura.md · seguridad.md   heredados; las CU-n enmendadas ganan su «Enmienda OPE»
│   ├── ope.md               NUEVO · OW-1 … OW-7, con su origen
│   ├── origen.md            NUEVO · heredado / enmendado / retirado, y el commit de cuarzo
│   ├── segunda-aplicacion.md NUEVO · cómo apps/portal copia a apps/console
│   ├── decisiones.md        el índice, con la familia OW
│   └── deuda.md             gana la deuda de las restricciones del contrato
├── packages/
│   ├── session/             @ope/session
│   │   ├── src/types.ts     SessionConfig sin issuer/clientId; SessionPort con signIn? y observe?; EndReason + token-rejected
│   │   ├── src/state.ts     resolved desde anonymous
│   │   ├── src/gate.tsx     configureSession valida sólo toCapabilities; useSessionControl expone signIn
│   │   ├── src/bearer.ts    NUEVO · createBearerSession({ toCapabilities, identify })
│   │   ├── src/fake.ts      marca OPE_FAKE_SESSION_NOT_FOR_PRODUCTION; signIn opcional para probar la vista
│   │   ├── src/keycloak.ts  se conserva sin entrada en exports
│   │   └── tests/gate.mjs   vigila además que signIn reciba y no devuelva
│   └── core/                @ope/core
│       ├── checks/          ope-check: context (clave `apps`), boundaries, artifact, packaging, quality (sin regla 12), decisions (familia OW), conformity NUEVO; requests.mjs se retira
│       ├── build/           opeBuild, __OPE_BUILD__
│       ├── src/base/config.ts      baseSchema sin issuer/clientId; `baseUrl` para systems
│       ├── src/base/strings.ts     signInTitle, signInDetail, credentialLabel, signIn, signInRejected, noRequestId, loadMore, loadedCount, noMore, sessionEndedTokenRejected
│       ├── src/base/telemetry.ts   requestFailed.requestId opcional
│       ├── src/data/envelope.ts    unwrap<T> → T; RequestFailed por Problem Details; fieldNameOf(pointer)
│       ├── src/data/collection.ts  NUEVO · Collection<T>, useCollection sobre useInfiniteQuery
│       ├── src/data/client.ts      NUEVO · createOpeClient(baseUrl, session): authorize + observe + unwrap
│       ├── src/data/contract.ts    NUEVO · ContractModule, OperationRequirement
│       ├── src/data/action.ts      requires.capabilities; versioned con omisión false
│       ├── src/data/notice.ts      isBusinessRejection = 422 | 409; OURS por slug
│       ├── src/data/use-action.ts  STALE y OURS por slug; errors[] a campos sólo bajo /body
│       ├── src/ui/sign-in.tsx      NUEVO · la vista de anonymous del bearer
│       ├── src/ui/load-more.tsx    NUEVO · LoadMoreCursor con Button de granito
│       ├── src/ui/result-of.ts     sobre Collection<T>
│       ├── src/ui/use-table-query.ts  c en vez de p; cursor/setCursor
│       ├── src/ui/session-views.tsx   ended distingue token-rejected
│       ├── src/ui/table-pagination.tsx  SE RETIRA
│       ├── src/app/bootstrap.tsx   configureSession sin issuer; provide recibe session { authorize, observe }
│       └── tests/               envelope, rejection, notice, table → cursor y Problem Details; collection NUEVO; sign-in NUEVO
└── apps/console/            OPE-Console · la forma, que apps/portal copia
    ├── package.json · vite.config.ts (proxy /api → :3000) · index.html · tsconfig.json
    ├── public/config.json   { systems: { ope: "/api" }, waitThresholdMs }
    └── src/
        ├── app/             main.tsx (bearer en producción, falsa en desarrollo), manifest, identity (identify + userCaption), config, features, flows, chrome, strings, dev-session
        ├── api/ope/         client.ts (createOpeClient + opeService), operations.ts (opeOperation), types = contracts/ope/api.d.ts
        └── features/
            ├── home/        heredado
            └── merchants/   REEMPLAZA a catalog: merchants-screen, merchant-screen, new-merchant-dialog, deactivate-merchant, data/merchants.ts
```

**Decisión de estructura**: lo que diverge entre consola y portal —manifiesto, pantallas, servicios,
compilación, configuración— vive en `apps/<x>`; lo que un arreglo tiene que llevarles a las dos
—sesión, puerta de acciones, estados, errores, paginación, comprobaciones— vive en `packages/`.
`contracts/ope/` vive en la raíz porque las dos aplicaciones hablan con el mismo backend.

## El orden

**Seis tramos, y cada uno termina en algo que se puede correr.** El punto de control de cada uno
está dicho; sin eso son casillas.

| | qué | punto de control |
|---|---|---|
| **1** | **El monorepo**: `apps/console` recibe `src/`, `index.html`, `vite.config.ts` y `public/`; los paquetes pasan a `@ope/*`; `ope-check` aprende `apps`; Biome, tsconfig y Vitest cubren las dos capas; `packaging` acepta workspaces privados | `npm test` en verde con el hola mundo **todavía de cuarzo** (el simulado sigue hasta el tramo 5). `ope-check` recorre `apps/console` y falla si la lista está vacía |
| **2** | **El contrato de OPE llega**: `contract:sync`, `contracts/ope/`, `ContractModule`, `createOpeClient`, `opeOperation`, `conformity` | `npm run contract:sync` deja la carpeta; `tsc` compila una operación con `merchants:read` y **rechaza** una con `merchants:reed`; `conformity` pasa, y falla con `identity.json` tocada |
| **3** | **Cuerpos pelados, Problem Details y cursor** en el núcleo: `envelope`, `notice`, `use-action`, `use-form`, `collection`, `use-table-query`, `result-of`, `LoadMoreCursor`; se retira `TablePagination` | Las pruebas del núcleo en verde sobre respuestas de OPE grabadas (un `MerchantPage`, un `422` con `errors[]`, un `403 merchant-out-of-scope`, un `401`). La ruta de `CU-29` sigue compilando sin que nadie la ejerza |
| **4** | **La sesión agnóstica y el bearer**: `SessionConfig`, `signIn`, `observe`, `resolved` desde `anonymous`, `createBearerSession`, la vista de ingreso, `token-rejected`, `provide` con `session` | `tests/gate.mjs` y la máquina en verde; `npm run dev` con la falsa entra solo; **contra el backend real**, pegar un token acuñado entra, uno inventado dice «rechazado», y un `401` en vuelo termina la sesión diciendo por qué |
| **5** | **El hola mundo de OPE**: `features/merchants` reemplaza a `catalog`; `identity.ts` con la sonda; `dev-session` con los papeles de `admin`; se retiran el simulado, `demo.yaml`, `roles.mjs`, `constraints.mjs`, `mock.mjs`, `prism` | Escenario 4 a mano: cargando, con datos, vacío (un backend recién levantado sin merchants) y error (backend apagado), con el cursor en la dirección y «cargar más». Escenarios 5, 6 y 7 con `?dev.papel=lectura` y contra el backend |
| **6** | **Documentos y gobierno**: constitución 2.0.0, enmiendas a `CU-7/10/14/20/37/40/41`, `docs/ope.md` (`OW-1…7`), `origen.md`, `segunda-aplicacion.md`, `CLAUDE.md`, `README.md`, `estado.md`, `deuda.md`; se retiran `PEDIDOS.md`, `requests.mjs`, `catalogo`, `clone`, la regla 12 | `ope-check decisions` en verde con la familia `OW`, y **en rojo** con una cita `OW-99` plantada; `quality` ya no falla por «cliente» |

**El 1 se hace solo y entero antes que nada**: es puro movimiento y renombre, y mezclarlo con un
cambio de conducta haría un diff que nadie puede revisar. **El 2 antes que el 3** porque el 3 prueba
contra tipos de OPE que el 2 trae. **El 4 y el 5 se podrían invertir**, y van en este orden porque
el 5 necesita entrar contra el backend para verse. **El 6 va último a propósito**: los documentos
describen lo que quedó, no lo que se planeó.

**Cada tramo es un commit** (o pocos), en castellano y convencional, y **ninguno se commitea con
`npm test` en rojo**.

## Dependencia con OPE-Backend: la feature 040

Esta base le pide al backend exactamente esto, y nada más:

1. **`X-Request-Id` en toda respuesta** y `requestId` como miembro del Problem Details (hoy
   `additionalProperties: false` lo prohíbe).
2. **`getOperator`** (`GET /v1/admin/operator`, `admin`, sin capacidad más que ser un operador):
   `{ operatorId, displayName?, scope }`.
3. **`displayName` opcional** en `OPE_ADMIN_OPERATORS`, la constitución VII acotada a las personas
   observadas, y la excepción acotada de `ope-no-pii` para el esquema del operador bajo `admin`.
4. **`generated/contract/`** emitido por `contract:types` con la forma de
   [`contracts/contract-artifact.md`](contracts/contract-artifact.md): bundle, `api.d.ts`,
   `problem-types.d.ts`, `capabilities.{js,d.ts}`, `identity.json`.

**Lo que no le pide**: CORS para `admin` (investigación §8), un endpoint de telemetría (cerrado con el
dueño), ni testigo de concurrencia (feature posterior, `TAN-10` como referencia).

Hasta que 040 esté, las dos muletas viven **con nombre y comentario** en `apps/console/src/app/
identity.ts` (la sonda) y en `scripts/contract-sync.mjs` (el emisor interino), y `estado.md` las
lista como lo que se saca cuando 040 llegue.

## Complejidad y riesgos aceptados

**El `LoadMore` propio puede no alcanzar.** Se compone con un `Button` y un texto; si al mirarlo no
se entiende cuánto hay cargado o cuándo se acabó, **es una propuesta a granito y no un componente
nuestro** (principio IV, `OW-4`). Lo que no se hace es dibujar algo propio para taparlo.

**El cursor en la dirección reproduce un tramo, no la acumulación.** Es lo que el servidor puede
dar. Un operador que cargó cinco tramos y recarga ve el quinto; se escribe en `OW-4` para que no se
tome por defecto.

**La recarga vuelve al ingreso.** Costo del bearer en memoria, asumido en la spec. Si molesta, la
salida es un adaptador con cookie de sesión del lado del backend, no guardar el token en el
navegador.

**Dos muletas que hay que sacar.** La sonda y el emisor interino son deuda **con fecha**: la de la
040. Si la 040 se demora, la consola funciona igual; lo que no puede pasar es que las muletas se
queden sin que nadie lo sepa — por eso están en `estado.md` y no sólo en un comentario.

**`keycloak.ts` queda sin ejercer.** Código vivo sin entrada es código que se pudre. Se acepta porque
borrarlo obliga a reescribirlo cuando aparezca OIDC, y porque `tests/gate.mjs` lo sigue leyendo
—nombra un proveedor en una entrada adaptadora, que es lo que la regla permite—.

**Las restricciones del contrato (`CU-38`, capa 1 y 2) no se emiten en esta feature.** El hola mundo
tiene un formulario de dos campos y validarlos a mano es la copia que `CU-14` rechaza; se acepta
**sólo por esta feature** y queda en `deuda.md` para pagar antes del primer formulario del panel.

**Biome sobre dos capas y Vitest con dos raíces** pueden necesitar ajustes de rutas que no se ven
hasta correrlos. Es el riesgo del tramo 1, y por eso el tramo 1 termina con `npm test` y no con
«se movieron los archivos».

## Seguimiento de complejidad

Sin violaciones a la constitución que justificar: las dos enmiendas (principios I y VI) son
decisiones del dueño que el tramo 6 escribe con su versión, no desvíos que este plan asume.
