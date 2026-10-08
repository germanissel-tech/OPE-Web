# Tareas · La base de OPE

**Carpeta**: `005-la-base-de-ope` · **Entrada**: [`plan.md`](plan.md) · [`spec.md`](spec.md) ·
[`research.md`](research.md) · [`data-model.md`](data-model.md) ·
[`contracts/`](contracts/contract-artifact.md) · [`quickstart.md`](quickstart.md)

## Formato: `[ID] [P?] [Tramo] Descripción con su archivo`

- **`[P]`** — se puede hacer en paralelo: otro archivo, sin depender de nada incompleto
- **`[En]`** — a qué tramo del plan pertenece

Se organiza por **tramos** y no por historias independientes, como `002`, `003` y `004`: el tramo 3
prueba contra los tipos que trae el 2, y el 5 entra con la sesión que arma el 4. Lo que reemplaza a
la independencia es más fuerte — **cada tramo termina con algo que se puede correr**, y es un commit.

**Las rutas de abajo son las de después del tramo 1**: `apps/console/src/…` donde cuarzo tenía
`src/…`. Hasta que el tramo 1 termine, no se toca nada de los tramos siguientes.

## Antes de empezar

- **Tandilia es sólo lectura.** `@granito/*` se instala por `file:../../../Bitbucket/Tandil Stone
  Pulse/tandilia/granito/packages/*` (la ruta real desde `ope/mvp/web`); nada de este repositorio
  escribe ahí, ni `npm install` desde esa carpeta.
- **El backend al lado**, en `../backend`, con `npm run contract:check` corrido: deja
  `contracts/dist/openapi.yaml` y `generated/` al día para `contract:sync`.
- **`npm test` en verde antes del primer commit**, sobre la copia tal cual. Si la copia no pasa en
  esta máquina (dependencias, rutas de `file:`), eso se arregla primero y se commitea solo.

---

## Fase 1 · Tramo 1 — El monorepo

**Meta**: que la aplicación viva en `apps/console`, los paquetes se llamen `@ope/*`, y `ope-check`
recorra las dos capas. **Puro movimiento y renombre**: ninguna conducta cambia, y el hola mundo
sigue siendo el de cuarzo contra su simulado.

- [x] T001 [E1] Mover `src/`, `index.html`, `vite.config.ts`, `public/` y `contracts/demo.yaml` a `apps/console/` con `git mv`, y crear `apps/console/package.json` (`name: @ope/console`, `private`, `dev`/`build` con Vite, dependencias de la aplicación) y `apps/console/tsconfig.json` que extiende el de la raíz
- [x] T002 [E1] Reescribir `package.json` de la raíz: `name: ope-web`, `workspaces: ["packages/*", "apps/*"]`, la clave `ope` (antes `cuarzo`) con `apps: ["apps/console"]` y `compositionLayer` con las rutas nuevas, y los scripts de la raíz (`dev` → `npm run dev -w apps/console`, `build`, `test`, `revisar`, `build:paquetes`); `simulado`, `tipos`, `catalogo`, `clon`, `avance`, `iconos` siguen por ahora
- [x] T003 [P] [E1] Renombrar los paquetes: `packages/core/package.json` → `@ope/core` (`private: true`, `bin: ope-check`, clave `ope.generated`), `packages/session/package.json` → `@ope/session` (`private: true`); los `peerDependencies` entre ellos y hacia granito se conservan
- [x] T004 [P] [E1] Reemplazar `@cuarzo/core` y `@cuarzo/session` por `@ope/core` y `@ope/session` en todo `import` de `packages/` y `apps/`, y `cuarzoBuild`/`__CUARZO_BUILD__` por `opeBuild`/`__OPE_BUILD__` en `packages/core/build/index.mjs`, `index.d.mts` y `apps/console/vite.config.ts`
- [x] T005 [P] [E1] Renombrar la marca de la falsa a `OPE_FAKE_SESSION_NOT_FOR_PRODUCTION` en `packages/session/src/fake.ts` y `packages/core/checks/artifact.mjs`, y el recuerdo de `dev-session.ts` a `ope.dev.papel`
- [x] T006 [E1] `packages/core/checks/context.mjs`: la clave es `ope`, `KNOWN` gana `apps`, y exporta `apps` (falla con la lista vacía o ausente: «no hay ninguna aplicación que revisar», `TAN-6` regla 4)
- [x] T007 [E1] `packages/core/checks/boundaries.mjs`: `STYLE_ROOTS` y las zonas (`app`, `features`, `components`, `lib`, `api`, `testing`) se calculan por cada entrada de `apps`, más `packages/*/src`; informa cuántas aplicaciones recorrió
- [x] T008 [P] [E1] `packages/core/checks/artifact.mjs`: mira `apps/<x>/dist` por cada aplicación, y las fuentes de `apps/*/src` y `packages/*/src` para decir si el `dist` es viejo
- [x] T009 [P] [E1] `packages/core/checks/packaging.mjs`: exige licencia, repositorio, versión y peers acotados **sólo a los paquetes que no son `private`**; con todos privados sigue verificando `exports`, `files` y `bin` y que git los siga; lo que falla con cero sujetos es «no hay ningún paquete en `packages/`»
- [x] T010 [P] [E1] `packages/core/checks/cli.mjs`: el nombre que imprime es `ope-check`; `packages/core/checks/quality.mjs`, `decisions.mjs`, `labels.mjs`, `errors.mjs`: las rutas de `src/` pasan a salir de `apps` más `packages/*/src`
- [x] T011 [E1] `biome.json`, `tsconfig.json` de la raíz y `vitest.config.ts` (nuevo, sacado de lo que `vite.config.ts` tenía de pruebas: `jsdom`, `dedupe` de React): cubren `packages/*/src`, `packages/*/tests`, `apps/*/src`, `scripts/`; excluyen `apps/*/src/api/*/types.ts`, `roles.ts`, `constraints.ts`
- [x] T012 [E1] Ajustar `tests/roles.mjs`, `tests/constraints.mjs`, `tests/mock.mjs`, `tests/catalogo.mjs`, `tests/icons.mjs` y `tests/raiz.mjs` a las rutas de `apps/console/` (se retiran en los tramos 5 y 6; hasta entonces tienen que correr)
- [x] T013 [E1] `npm install` en la raíz, `npm run build:paquetes`, `npm test`. Corregir lo que las rutas rompieron hasta que esté en verde; `npm run dev` levanta el hola mundo de cuarzo en `:5173`

**Punto de control**: `npm test` en verde con el hola mundo de cuarzo intacto; `ope-check` dice que recorrió `apps/console`, y con `apps: []` falla. Commit: `refactor(005): el monorepo — apps/console y @ope/*`.

> **Lo que el tramo trajo además, 2026-10-08.** Tres cosas que la copia tal cual no pasaba en esta
> máquina y se arreglaron antes de mover nada: el `package-lock.json` apuntaba a la ruta vieja de
> granito (se regeneró), `build:paquetes` compilaba `core` antes que `session` de la que depende
> (se invirtió el orden), y el catálogo de Tandilia fallaba porque los documentos de la 005 lo
> desactualizan. **`catalogo.mjs`, su prueba, `catalogo.json` y `clone.mjs` se retiraron acá** y no
> en el tramo 6: son de Tandilia, estaban por irse, y adaptarlos a `apps/` era trabajo sobre algo
> que se borra. T066 queda con lo que resta.

---

## Fase 2 · Tramo 2 — El contrato de OPE llega

**Meta**: que `contracts/ope/` exista, se sincronice con un comando, y que una operación con una
capacidad fuera del vocabulario **no compile**.

- [x] T014 [E2] `scripts/contract-sync.mjs`: localiza el backend (`OPE_BACKEND_DIR`, o `../backend`, o `--from <carpeta de release>`), copia `contracts/dist/openapi.yaml`, `generated/api.d.ts` y `generated/problem-types.d.ts` a `contracts/ope/`; si existe `generated/contract/` la copia entera; si no, **emite** `capabilities.js`, `capabilities.d.ts` e `identity.json` desde el bundle con `yaml` (dependencia de desarrollo), con la forma de [`contracts/contract-artifact.md`](contracts/contract-artifact.md) y la cabecera `GENERATED by scripts/contract-sync.mjs — interim until OPE-Backend 040 emits generated/contract/`; escribe `contracts/ope/README.md` con el commit del backend (`git -C <backend> rev-parse HEAD`) y la fecha
- [x] T015 [E2] `package.json`: script `contract:sync`; `.gitattributes` marca `contracts/ope/*` como `linguist-generated`; `biome.json` y `vitest.config.ts` lo excluyen
- [x] T016 [E2] Correr `npm run contract:sync` y versionar `contracts/ope/` (revisar que `OPERATIONS` tenga toda operación con tag `admin` y que `CAPABILITIES` esté ordenada)
- [x] T017 [P] [E2] `packages/core/src/data/contract.ts`: `ContractModule`, `OperationRequirement`; exportarlos en `packages/core/src/index.ts`
- [x] T018 [E2] `packages/core/src/data/action.ts`: `Operation.roles` → `capabilities`; `operation(id, service, requires, run)` con `requires: { capabilities: readonly string[]; idempotent?: boolean; versioned?: boolean }` (omisión `false` para los dos); `defineAction` une `capabilities` y sigue fallando con cero; el comentario de `idempotent` deja de decir «seis que mueven saldo» y dice que OPE repite por cuerpo
- [x] T019 [E2] `packages/core/checks/conformity.mjs` (NUEVO) y su entrada en `cli.mjs`: `sha256(contracts/ope/openapi.yaml)` contra `identity.json` y `CONTRACT.sha256`; `CONTRACT.version` contra `info.version`; cada clave de `OPERATIONS` existe en `operations` de `api.d.ts` y cada operación `admin` del bundle está en `OPERATIONS`; `CAPABILITIES` es la unión ordenada; informa cuántas revisó y falla con cero
- [x] T020 [E2] Romper `conformity` a propósito (un carácter en `identity.json`; una operación borrada de `capabilities.js`) y ver que diga qué y dónde; dejar todo como estaba
- [x] T021 [P] [E2] `packages/core/src/data/client.ts` (NUEVO): `createOpeClient<Paths>(baseUrl, session: { authorize, observe })` con `openapi-fetch`, `onRequest` → `authorize`, `onResponse` → `observe`; exporta `unwrap` para quien arme cada llamada (el `unwrap` nuevo llega en el tramo 3: acá se usa el existente)
- [x] T022 [E2] `apps/console/src/api/ope/client.ts` (NUEVO): `opeService = defineService<OpeClient>('ope')`, tipos de `../../../../contracts/ope/api.d.ts`, `createOpeClient`, y una sola operación para empezar: `listMerchants(query: { cursor?, limit? })`; `apps/console/src/api/ope/operations.ts`: `opeOperation(id, run)` sobre `OPERATIONS` del módulo, con `Id extends keyof typeof OPERATIONS`
- [x] T023 [E2] `packages/core/tests/types.test-d.ts`: `opeOperation('listMerchants', …)` compila; una operación declarada con `capabilities: ['merchants:reed']` contra el vocabulario del módulo **no compila** (`@ts-expect-error`); `action.test.ts` adaptado a `capabilities`

**Punto de control**: `npm run contract:sync` deja la carpeta y `git status` la muestra; `tsc` rechaza el typo; `ope-check conformity` pasa y falló cuando se lo rompió. Commit: `feat(005): el contrato de OPE llega como artefacto sincronizado`.

> **Hecho el 2026-10-08.** Dos desvíos respecto de lo escrito, los dos a favor de la regla que ya había:
> la prueba de tipos contra el vocabulario de OPE vive en `apps/console/src/api/ope/operations.test-d.ts`
> y no en `packages/core/tests/`, porque el núcleo no conoce el módulo del consumidor (`TAN-7`) y
> `types.test-d.ts` prueba lo mismo con un vocabulario de mentira; y `boundaries` ganó una regla en vez
> de una excepción: **sólo `api/` lee `contracts/ope/`**, que es la única salida de `src/` que se admite.
> `conformity` roto a propósito dijo qué y dónde en los dos casos (`identity.json` con un carácter cambiado;
> `listMerchants` borrada de `capabilities.js`). La ruta del contrato es `/v1/admin/merchants`.

---

## Fase 3 · Tramo 3 — Cuerpos pelados, Problem Details y cursor

**Meta**: que el núcleo hable el contrato de OPE sin que ninguna pantalla sepa de HTTP. **Todo en
`packages/core`**, con las pruebas sobre respuestas de OPE grabadas.

- [x] T024 [E3] `packages/core/tests/fixtures/ope/` (NUEVO): un `MerchantPage` con `nextCursor`, uno sin, un `422 origin-already-registered` con `errors[{ pointer: '/body/origins/0' }]`, un `400 validation-failed` con `pointer: '/query/cursor'`, un `403 merchant-out-of-scope`, un `401 operator-unknown`, un `409 merchant-deactivated`, y una respuesta `502` sin cuerpo de problema. Sacados de los ejemplos del bundle en `contracts/ope/openapi.yaml`
- [x] T025 [E3] `packages/core/src/data/envelope.ts`: `unwrap<T>` devuelve `T` (sin sobre; una respuesta `204` devuelve `undefined`); `RequestFailed { status, type, title, detail?, requestId?, errors }` con el slug sin `urn:ope:problem:`; `FieldError { pointer, message }`; `fieldNameOf(pointer)` (`/body/a/0` → `a.0`; fuera de `/body` → `undefined`); `requestId` del encabezado `X-Request-Id` o del miembro `requestId` del cuerpo, **nunca inventado**; sin cuerpo de problema: `type: 'unknown'`, `title` del estado. Se retiran `Page`, `Meta`, `PagedMeta`, `isPaged`, `versionFrom`, `withoutVersion`; `failedWith` queda igual
- [x] T026 [E3] `packages/core/tests/envelope.test.ts` y `envelope.test.tsx`: reescritas sobre las fixtures — el cuerpo pelado llega entero, cada problema ramifica por `type`, el identificador falta cuando falta, `fieldNameOf` traduce y rechaza
- [x] T027 [P] [E3] `packages/core/src/data/notice.ts`: `isBusinessRejection` = `status === 422 || status === 409`; `failureNotice` muestra `strings.noRequestId` cuando `requestId` es `undefined`; `packages/core/tests/notice.test.ts` y `rejection.test.ts` adaptadas
- [x] T028 [E3] `packages/core/src/data/use-action.ts`: `OURS` = `capability-missing`, `merchant-out-of-scope`, `operator-scope-too-narrow` (por `type`); `STALE` sin equivalente en OPE queda como constante con su comentario (`CU-29` dormida); los `errors[]` que `fieldNameOf` traduce van a `fields`, los otros al aviso; la telemetría `requestFailed` lleva `requestId?`; `packages/core/src/base/telemetry.ts` lo declara opcional; `packages/core/tests/telemetry*.test.*` adaptadas
- [x] T029 [P] [E3] `packages/core/src/ui/use-form.ts`: consume `FieldError` ya traducido (`{ field, message }` de la puerta), sin `code`; `packages/core/tests/form.test.ts` adaptada
- [x] T030 [P] [E3] `packages/core/src/data/collection.ts` (NUEVO): `Collection<T>`, `useCollection(key, fetchPage, { from })` sobre `useInfiniteQuery` (`initialPageParam: from`, `getNextPageParam: (last) => last.nextCursor`), que devuelve `items` aplanados, `hasMore`, `loadMore`, `loadingMore` y lo que `QueryLike` pide; `onCursor(next)` para que la pantalla lo escriba en la dirección; `packages/core/tests/collection.test.tsx` (NUEVO): acumula, se detiene sin `nextCursor`, no reintenta un `4xx`
- [x] T031 [E3] `packages/core/src/ui/use-table-query.ts`: `PAGE`/`p` → `CURSOR`/`c`; `cursor`, `setCursor`; `filter()` borra `c` y `row`; sin `Number(...)` de página; `packages/core/tests/table.test.tsx` adaptada (el enlace con `c` reproduce ese tramo; filtrar lo borra)
- [x] T032 [P] [E3] `packages/core/src/ui/load-more.tsx` (NUEVO): `LoadMoreCursor({ loaded, hasMore, loading, onLoadMore })` con `Button` de granito y texto de `strings.loadedCount(n)` / `strings.noMore`; sin `className`; comentario que cita `GR-17` y `OW-4` y dice que es propuesta a granito
- [x] T033 [E3] `packages/core/src/ui/result-of.ts`: `resultOf(query: QueryLike<Collection<T>> & { items }, states, strings)`; el error lleva `requestId` opcional y granito recibe `undefined`; `packages/core/tests/result.test.tsx` adaptada
- [x] T034 [E3] Retirar `packages/core/src/ui/table-pagination.tsx` y su exportación; `packages/core/src/base/strings.ts` gana `noRequestId`, `loadMore`, `loadedCount`, `noMore` (castellano) y `DEFAULT_STRINGS` las trae; `packages/core/src/index.ts` exporta `Collection`, `useCollection`, `LoadMoreCursor`, `fieldNameOf`, `createOpeClient`
- [x] T035 [E3] `apps/console/src/api/demo/client.ts` y `features/catalog/` siguen compilando contra el `unwrap` nuevo **sólo lo justo** para que `npm test` pase (se reemplazan en el tramo 5): quitar `Page<>`, `TablePagination` y `meta`; el simulado puede quedar roto en vivo, no en las pruebas

**Punto de control**: `npm test` en verde; las pruebas del núcleo corren sobre respuestas de OPE; `conflict*.test.*` siguen pasando sin que nadie ejerza el camino. Commit: `feat(005): el núcleo habla Problem Details, cuerpos pelados y cursor`.

> **Hecho el 2026-10-08.** Tres cosas que no estaban escritas: (1) `splitErrors` en `use-action.ts`
> reparte `errors[]` entre `fields` (los de `/body`, traducidos a `RejectedField { field, message }`) y el
> aviso (los de `/query` y `/headers`, que `failureNotice` dice con su puntero); el backend confirma el
> prefijo `/body` en `BODY_POINTER` de su `dispatch.ts`. (2) `resultOf` recibe `GridQuery<T>` —`QueryLike`
> más `items` aplanados— para servir igual a una colección por cursor y a una lista entera; el hola mundo
> pasa `{ ...articles, items: articles.data ?? [] }`. (3) La regla de `quality` que exigía `STALE_VERSION`
> ahora exige `const STALE = 'stale-version'`: la ruta de `CU-29` queda dormida con su constante, no
> borrada. Las fixtures viven en `packages/core/tests/fixtures/ope/responses.ts`, sin `requestId` a
> propósito: hoy OPE no lo manda.

---

## Fase 4 · Tramo 4 — La sesión agnóstica y el bearer

**Meta**: que la puerta no suponga proveedor, que se pueda entrar desde `anonymous`, y que un `401`
en vuelo termine la sesión. **Primero el paquete, después el núcleo, después la consola.**

- [x] T036 [E4] `packages/session/src/types.ts`: `SessionConfig { toCapabilities, reentryTimeout? }`; `SessionPort` gana `observe?` y `signIn?`; `SignInOutcome`; `EndReason` gana `token-rejected`. Según [`contracts/session-port.md`](contracts/session-port.md)
- [x] T037 [E4] `packages/session/src/state.ts`: `resolved` desde `['resolving', 'anonymous']`; `packages/session/tests/store.test.ts` prueba la transición nueva y que `unauthorized` sigue sin salida
- [x] T038 [E4] `packages/session/src/gate.tsx`: `configureSession` valida sólo `toCapabilities`; `AppSession` expone `observe` (no-op si el adaptador no lo trae) y `signIn` (`undefined` si no); `useSessionControl` devuelve también `signIn`
- [x] T039 [E4] `packages/session/src/bearer.ts` (NUEVO): `createBearerSession({ toCapabilities, identify, scheme = 'Bearer' })` según el modelo §4: token en la clausura, `resolve` → `no-session`, `signIn` → `identify(authorize)` y `resolved` o `{ ok: false }` borrando el token, `authorize` pone `Authorization`, `observe` con `401` → `ended`/`token-rejected`, `signOut` borra, `reenter` no hace nada
- [x] T040 [P] [E4] `packages/session/src/fake.ts`: `signIn` opcional que entra con los claims configurados (para probar la vista); `packages/session/package.json`: entrada `./bearer`; `./keycloak` **se quita de `exports`** y el archivo queda con un comentario que dice por qué
- [x] T041 [E4] `packages/session/tests/gate.mjs`: además de lo que vigila, exige que `signIn` reciba `credential?: string` y que `SignInOutcome` no tenga miembro con `token` ni `credential`; que `bearer.ts` nombre un solo mecanismo; `packages/session/tests/bearer.test.ts` (NUEVO): entrar, rechazo, inalcanzable, `401` en vuelo, cerrar sesión, y que `authorize` ponga el encabezado y la falsa no
- [x] T042 [E4] `packages/core/src/base/config.ts`: `baseSchema` pierde `issuer` y `clientId`; `packages/core/src/base/schema.ts` gana `baseUrl` (absoluta `http(s)` o ruta desde `/`) y `systems` lo usa; `packages/core/tests/schema.test.ts` adaptada
- [x] T043 [E4] `packages/core/src/app/bootstrap.tsx`: `configureSession({ toCapabilities })`; `provide` recibe `session: { authorize, observe }`; `packages/core/src/base/services.ts` si nombra `authorize`, lo mismo
- [x] T044 [E4] `packages/core/src/ui/sign-in.tsx` (NUEVO): la vista de `anonymous` cuando `signIn` existe — `Page`, `Field`, `TextInput` (tipo `password`), `Button`; llama a `signIn(value)` y muestra `signInRejected` o `serverUnreachable`; `packages/core/src/ui/session-views.tsx`: `anonymous` dibuja `SignIn` si hay `signIn` y el aviso de antes si no; `ended` con `token-rejected` dice `sessionEndedTokenRejected` y ofrece volver al ingreso (recargar); `packages/core/src/base/strings.ts` gana `signInTitle`, `signInDetail`, `credentialLabel`, `signIn`, `signInRejected`, `sessionEndedTokenRejected`
- [x] T045 [P] [E4] `packages/core/tests/sign-in.test.tsx` (NUEVO): la vista llama a `signIn` con lo tecleado, muestra el rechazo, y no se dibuja cuando el adaptador no tiene entrada
- [x] T046 [E4] `apps/console/src/app/main.tsx`: en producción `createBearerSession` con `identify` de `identity.ts`; en desarrollo `dev-session.ts` diferido como antes; `provide` registra `opeService` con `createOpeClient(config.systems.ope, session)`; `apps/console/src/app/identity.ts`: `toCapabilities` lee `claims.capabilities` (la falsa) o deriva del `scope` (el bearer: `*` → todas las de `CAPABILITIES`; una lista → las de lectura y escritura igual, el alcance lo aplica el backend), `userCaption` traduce `scope`, e `identify` con **la sonda** (`listMerchants` con `limit=1` → claims `{ sub: 'operator', operatorId: 'operator', name: 'operator', scope: '*' }`) con el comentario que dice que se reemplaza por `getOperator` en la 040
- [x] T047 [E4] `apps/console/src/app/config.ts` y `public/config.json`: `{ systems: { ope: "/api" }, waitThresholdMs: 60000 }`, sin `issuer` ni `clientId`; `apps/console/vite.config.ts`: `server.proxy['/api']` → `http://localhost:3000` con `rewrite` que quita `/api`
- [x] T048 [E4] Contra el backend real (quickstart, pasos 1, 2 y 8): entrar con un token acuñado, rechazo con uno inventado, y `401` en vuelo. Anotar lo que se vio en `quickstart.md` si difiere

**Punto de control**: `tests/gate.mjs`, `bearer.test.ts` y el núcleo en verde; con la falsa, `npm run dev` entra solo; contra el backend, la pantalla de ingreso funciona y el `401` termina la sesión diciendo por qué. Commit: `feat(005): la puerta no supone proveedor, y el bearer entra con el token del operador`.

> **Hecho el 2026-10-08.** Desvíos: (1) `identify` vive en `apps/console/src/api/ope/identity.ts` y no en
> `app/identity.ts`, porque toca `contracts/ope/` y sólo `api/` lo lee; `app/identity.ts` lo reexporta
> junto con `toCapabilities` y `userCaption`. (2) `config.json` conserva `systems.demo` hasta que el tramo 5
> retire el hola mundo. (3) `main.tsx` elige el bearer en desarrollo con `?dev.bearer=1`, para probar el
> ingreso contra el backend sin compilar; la falsa gana `?dev.entrada=1` para arrancar en `anonymous`.
> (4) `tests/gate.mjs` también exige que la superficie principal no nombre un **mecanismo** (`bearer`,
> `cookie`, `mtls`) en su código, además de ningún proveedor; roto a propósito, dijo qué y dónde.

---

## Fase 5 · Tramo 5 — El hola mundo de OPE

**Meta**: que `apps/console` muestre una colección real de OPE en sus cuatro estados con cursor, y
que lo que exige una capacidad no se dibuje sin ella. **Se retira el simulado.**

- [ ] T049 [E5] `apps/console/src/api/ope/client.ts`: `getMerchant(merchantId)`, `createMerchant(body)`, `deactivateMerchant(merchantId)`; tipos de `api.d.ts` (`Merchant`, `MerchantCreate`, `MerchantPage`)
- [ ] T050 [E5] `apps/console/src/features/merchants/` (NUEVO, copiando la forma de `catalog/`): `feature.ts` (desenlace `merchantChosen`), `strings.ts`, `data/merchants.ts` (`useMerchants` con `useCollection`, `useMerchant`, claves de caché `['ope', 'merchants', …]`), `data/create-merchant.ts` y `data/deactivate-merchant.ts` (acciones con `opeOperation`, invalidan `allMerchants`, anuncian con el `merchantId`)
- [ ] T051 [E5] `apps/console/src/features/merchants/screens/merchants-screen.tsx`: `Table` con `resultOf`, columnas `merchantId`, `status` (`Badge`), `origins`, `createdAt` (formato de fecha de granito), acciones de fila (`useActionColumn`); **sin barra de filtros**, con el comentario de que `listMerchants` no filtra y `filtered` es siempre falso; `useTableQuery('merchants')` para `c` y `row`; `LoadMoreCursor` debajo; el error con «reintentar» que hace `setCursor(undefined)`
- [ ] T052 [P] [E5] `apps/console/src/features/merchants/screens/merchant-screen.tsx` (ficha por `:merchantId`, con `Result`, muestra credenciales por clase e instante), `new-merchant-dialog.tsx` (`origins` y `signature`, `useForm`, los `errors[]` del `422` van al campo), `row-actions.tsx` y `deactivate-button.tsx` (`ActionButton` con `requires` de la acción)
- [ ] T053 [E5] `apps/console/src/app/features.ts`, `flows.ts`, `chrome.ts`, `strings.ts`, `manifest.ts`: `merchants` en lugar de `catalog`; `currentBranch` → `currentMerchant` como contexto de trabajo; el nombre de la aplicación es `OPE-Console`; `index.html` con título `OPE-Console` y `lang="es"`
- [ ] T054 [P] [E5] `apps/console/src/app/dev-session.ts`: papeles `todo`, `lectura`, `ninguno` sobre `CAPABILITIES` del módulo; claims `{ sub: 'fake-operator', operatorId: 'fake-operator', name: 'Operador de desarrollo', scope: '*', capabilities: [...] }`
- [ ] T055 [E5] Retirar `apps/console/src/features/catalog/`, `apps/console/src/api/demo/`, `apps/console/contracts/demo.yaml`, `tests/mock.mjs`, `tests/roles.mjs`, `tests/constraints.mjs`, `tests/emit.mjs`, `tests/raiz.mjs` (si nadie más lo usa), los scripts `simulado`, `simulado:contrato`, `tipos`, y `@stoplight/prism-cli`; `biome.json` deja de excluir `roles.ts` y `constraints.ts`
- [ ] T056 [E5] `apps/console/src/features/merchants/data/*.test.ts` y `screens/merchants-screen.test.tsx`: la grilla en sus cuatro estados sobre las fixtures de OPE, «cargar más» escribe `merchants.c`, el botón de alta no se dibuja sin `merchants:write`, el `409` es rechazo y el `403` deja rastro
- [ ] T057 [E5] Contra el backend real (quickstart, pasos 3 a 7): vacío, alta, con datos, cargar más, enlace con cursor, error con el backend apagado, alcance acotado, `409` y `422`. Anotar lo visto
- [ ] T058 [E5] `npm run build -w apps/console` y `ope-check artifact`: sin la marca de la falsa

**Punto de control**: escenarios 4, 5, 6 y 7 vistos contra el backend; `npm test` sin simulado. Commit: `feat(005): el hola mundo lista los merchants de OPE con cursor y sus cuatro estados`.

---

## Fase 6 · Tramo 6 — Documentos y gobierno

**Meta**: que un agente en frío sepa qué heredó, qué cambió y por qué, y que las citas nuevas
resuelvan. **Describe lo que quedó, no lo que se planeó.**

- [ ] T059 [E6] `.specify/memory/constitution.md` → **2.0.0** (fecha 2026-10-08): principio I «la spec y el plan se acuerdan con el dueño; dentro de una feature se implementa con autonomía, y lo que la spec no alcanza se pregunta con `clarify`»; principio III «`packages/` no sabe de negocio»; principio VI «se comparte la puerta, no el proveedor; cuál es el adaptador lo elige cada aplicación en su raíz»; «Tandilia» → «OPE» y «cuatro aplicaciones» → «las aplicaciones de OPE-Web» donde corresponda; se quita la convención de «cliente»
- [ ] T060 [P] [E6] `docs/ope.md` (NUEVO): `OW-1` la copia como forma de usar cuarzo, `OW-2` la puerta agnóstica con `signIn` y `observe`, `OW-3` Problem Details en el núcleo, `OW-4` el cursor en la dirección y `LoadMoreCursor` (con la propuesta a granito y la evidencia), `OW-5` el contrato como artefacto y el módulo de capacidades, `OW-6` mismo origen en vez de CORS, `OW-7` el operador por `operatorId` con nombre opcional; cada una con estado, depende de, y **Origen**
- [ ] T061 [P] [E6] `docs/arquitectura.md` y `docs/seguridad.md`: párrafo fechado «**Enmienda OPE (2026-10-08)**» en `CU-7` (granito por `file:` hasta npm), `CU-10` (sin OIDC en la configuración; `signIn`/`observe`), `CU-14` (Problem Details, cursor, sin tamaño de página), `CU-20` (la segunda aplicación copia `apps/console` dentro del monorepo), `CU-37` (capacidades del módulo), `CU-40` (workspaces, no npm), `CU-41` (sin cambio de fondo; se cita por el cursor en la URL)
- [ ] T062 [E6] `docs/decisiones.md`: la familia `OW` en el índice y en «Cómo se cita»; `packages/core/checks/decisions.mjs`: familia `OW` con `docs/ope.md` en `decisionDocs` y el índice; `package.json` raíz: `decisionDocs` con los tres documentos
- [ ] T063 [E6] Plantar `OW-99` en un comentario de `packages/core/src` y ver a `decisions` fallar; sacarlo
- [ ] T064 [P] [E6] `docs/origen.md` (NUEVO): el commit `9bd4009` de cuarzo y la fecha; tres tablas — heredado tal cual, enmendado (con `CU-n`, fecha, motivo), retirado (con qué lo reemplaza) — sacadas de `research.md` §9 y §11
- [ ] T065 [P] [E6] `docs/segunda-aplicacion.md` (NUEVO): cómo nace `apps/portal` copiando `apps/console`: qué se copia, qué se renombra, qué adaptador de sesión elige, qué entra en `ope.apps`
- [ ] T066 [E6] Retirar `PEDIDOS.md`, `packages/core/checks/requests.mjs` y su entrada en `cli.mjs`, `tests/progress.mjs` y el script `avance` (el catálogo y el ritual de clonar ya se retiraron en el tramo 1); `tests/icons.mjs` se conserva si granito sigue exigiendo el inventario de íconos, si no se retira con el script `iconos`
- [ ] T067 [E6] `packages/core/checks/quality.mjs`: quitar la regla 12 («cliente») y renumerar lo que la cite; `docs/` y la constitución dejan de nombrarla
- [ ] T068 [E6] `CLAUDE.md` reescrito para OPE-Web: qué es (consola y portal sobre `@ope/*` y granito), el mapa (constitución, `estado.md`, decisiones con las tres familias propias y las dos ajenas, `origen.md`, deuda), el ciclo de Spec Kit con autonomía por feature, el lazo de comandos (`npm test`, `revisar`, `contract:sync`, `dev`), la regla de que Tandilia es sólo lectura, y las dos muletas de la 040; `README.md`: el monorepo y cómo se levanta; `.specify/memory/estado.md`: de cero, con las muletas listadas
- [ ] T069 [P] [E6] `docs/deuda.md`: entrada «las restricciones del contrato (`CU-38`) no se emiten desde el bundle de OPE», a pagar antes del primer formulario del panel; y `packages/core/docs` sigue ignorado
- [ ] T070 [E6] `specs/005-la-base-de-ope/quickstart.md`: lo que se vio en T048 y T057, fechado; `spec.md` estado → «construida»
- [ ] T071 [E6] `npm test`, `npm run revisar`, `npm run build`, y la tabla de «romperle algo a cada comprobación» del quickstart, una por una

**Punto de control**: `ope-check` en verde con `OW`, en rojo con `OW-99`; `quality` sin regla 12; un agente que lee `CLAUDE.md`, la constitución y `origen.md` sabe qué heredó sin abrir Tandilia. Commit: `docs(005): cierre — constitución 2.0.0, origen, OW-1…7 y el mapa de OPE-Web`.

---

## Dependencias

```
E1 ──► E2 ──► E3 ──► E4 ──► E5 ──► E6
```

- **E2 necesita E1**: `contracts/ope/` y `apps/console/src/api/ope/` viven en rutas que el 1 crea.
- **E3 necesita E2**: las pruebas del núcleo corren sobre tipos y fixtures del contrato de OPE.
- **E4 necesita E3**: `observe` se cablea en `createOpeClient`, y la vista de ingreso muestra
  `serverUnreachable` con el `RequestFailed` nuevo.
- **E5 necesita E4**: el hola mundo entra con el bearer o la falsa, y mira `CAPABILITIES`.
- **E6 va último**: describe lo que quedó.

**Lo que se puede hacer en paralelo** está marcado `[P]` dentro de cada tramo: en el 1, los renombres
(T003–T005) y las comprobaciones (T008–T010); en el 3, `notice`, `use-form`, `collection` y
`load-more` (T027, T029, T030, T032) mientras `envelope` cambia; en el 6, los documentos nuevos
(T060, T064, T065, T069) mientras la constitución se enmienda.

## Lo que esta feature deja listo y lo que no

**Listo**: la base levanta, entra, lista, pagina por cursor, muestra los cuatro estados, esconde lo
que la sesión no habilita, y las comprobaciones vigilan el monorepo. `apps/portal` nace copiando.

**No**: las pantallas del panel (feature siguiente), el portal, OIDC, el testigo, granito en npm, y
las dos muletas de la 040 — que se sacan cuando la 040 llegue, y `estado.md` las nombra.
