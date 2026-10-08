# Tareas · El merchant completo

**Carpeta**: `006-el-merchant-completo` · **Entrada**: [`plan.md`](plan.md) · [`spec.md`](spec.md) ·
[`research.md`](research.md) · [`data-model.md`](data-model.md) ·
[`contracts/`](contracts/constraints-artifact.md) · [`quickstart.md`](quickstart.md)

## Formato: `[ID] [P?] [Tramo] Descripción con su archivo`

- **`[P]`** — se puede hacer en paralelo: otro archivo, sin depender de nada incompleto
- **`[En]`** — a qué tramo del plan pertenece

Se organiza por **tramos**, como la 005: el 2 usa las piezas del 1, el 3 reutiliza el paso de
credenciales del 2, y el 4 verifica a mano con el registro lo que los otros hicieron. Cada tramo
termina con algo que se puede correr, y es un commit.

## Antes de empezar

- **Tandilia es sólo lectura.** Nada escribe en granito ni en cuarzo.
- **El backend al lado**, en `../backend`, con `npm run contract:check` corrido y `npm run dev`
  levantado para los pasos a mano; el operador de desarrollo y su token, del `README.md` del backend.
- **`npm test` en verde antes del primer commit**, sobre `main` recién fusionado.
- **Toda cita a una decisión resuelve**: `OW-8` ya está en `docs/ope.md`; `CU-38` gana su enmienda en
  el tramo 1.

---

## Fase 1 · Tramo 1 — El núcleo y la deuda

**Meta**: que `packages/core` tenga las tres piezas que las pantallas usan, y que las restricciones
del contrato **se emitan** en vez de escribirse a mano. **Nada de esto nombra un merchant.**

- [x] T001 [E1] `packages/core/src/ui/use-form.ts`: `FieldConstraints` gana `minItems?`, `maxItems?` e `items?: FieldConstraints`; `shapeErrorOf` no cambia (un renglón se valida con `items`); `packages/core/tests/use-form.test.ts` prueba que un valor contra `items` da el mismo error que contra el campo
- [x] T002 [E1] `scripts/contract-sync.mjs`: `emitConstraints()` recorre `components.schemas`, toma los `type: object` que algún `requestBody` referencia directa o transitivamente, y escribe `contracts/ope/constraints.js` y `constraints.d.ts` con la forma de [`contracts/constraints-artifact.md`](contracts/constraints-artifact.md) (`CONTRACT` con la misma identidad; `CONSTRAINTS` con una clave por esquema; `required`, `type`, `minLength`, `maxLength`, `pattern`, `minimum`, `maximum`, `minItems`, `maxItems`, `items` recursivo, `enum`, `format`, `$ref` → `{ type: 'object', ref }`); misma cabecera interina; si `generated/contract/constraints.js` existe en el backend, se copia en vez de emitir; el `README.md` que escribe nombra el archivo nuevo
- [x] T003 [E1] Correr `npm run contract:sync` y versionar `contracts/ope/constraints.{js,d.ts}`; revisar a mano que `MerchantCreate`, `CredentialRotation` y `KillSwitch` digan lo que el bundle dice
- [x] T004 [E1] `packages/core/checks/conformity.mjs`: carga `constraints.js`; `CONTRACT` igual a `identity.json`; cada clave de `CONSTRAINTS` existe en `components.schemas` y es objeto; `required` coincide; cada objeto referenciado por un `requestBody` está en `CONSTRAINTS`; informa cuántos revisó y falla con cero
- [x] T005 [E1] Romper `conformity` a propósito (sacar `'signature'` de `required` de `MerchantCreate` en `constraints.js`) y ver que diga qué y dónde; dejar todo como estaba
- [x] T006 [P] [E1] `packages/core/src/base/strings.ts`: `copy`, `copied`, `copyFailed`, `confirm`, `cancel`; `DEFAULT_STRINGS` en castellano
- [x] T007 [P] [E1] `packages/core/src/ui/confirm-dialog.tsx` (NUEVO): `ConfirmDialog({ open, title, consequence, confirmLabel, tone = 'primary', running = false, onConfirm, onClose })` sobre `Dialog` de granito con `answers: 'yes-no'`, `description = consequence`, `confirmDisabled = running` con `confirmDisabledReason` (`GR-65`), `cancelLabel = strings.cancel`; el comentario explica sin dominio por qué la consecuencia es obligatoria; exportado en `packages/core/src/index.ts`
- [x] T008 [P] [E1] `packages/core/src/ui/secret-once.tsx` (NUEVO): `SecretOnce({ warning, secrets })` compone `Alert severity="warning"` con `warning` y, por secreto, `Field label size="fill"` → `Value` con el valor y `Button` «copiar» (`navigator.clipboard.writeText`; `copied` un instante o `copyFailed` si falla o no existe); **no guarda, no registra, no emite** nada con el valor, y el comentario cita `OW-8`; exportado en `index.ts`
- [x] T009 [E1] `packages/core/src/data/use-action.ts`: `ActionOptions` gana `onRejected?: (failed: RequestFailed) => void`, que `onError` llama después del aviso con cualquier `RequestFailed` (no con un fallo de red: eso no es un rechazo); el comentario dice para qué sirve sin nombrar negocio
- [x] T010 [E1] `packages/core/tests/confirm-dialog.test.tsx`, `secret-once.test.tsx` (copia con portapapeles, dice que no pudo sin él, y lo que dibuja no se guarda en ningún lado al desmontar) y `use-action.test.ts` (`onRejected` corre con `422`/`409`, no con un `Error` de red, y después del aviso)
- [x] T011 [E1] `docs/arquitectura.md`: `CU-38` gana «Enmienda OPE (2026-10-08)»: la capa 1 se emite del bundle con `contract-sync` (interino hasta la 040), la capa 2 queda a mano con la cita del invariante; `docs/origen.md`: `CU-38` pasa a enmendada; `docs/deuda.md`: §4 pasa a «Lo que se pagó» con cómo
- [x] T012 [E1] `npm test` en verde; `npm run build:paquetes`

**Punto de control**: `conformity` pasa y falló cuando se la rompió; las tres piezas con sus pruebas; `create-merchant.ts` **todavía** tiene las restricciones a mano (se cambian en el tramo 2 con el formulario). Commit: `feat(006): el núcleo confirma, muestra un secreto una vez, y las restricciones se emiten del contrato`.

---

## Fase 2 · Tramo 2 — El alta como pantalla, y desactivar con confirmación

**Meta**: que crear un merchant muestre sus credenciales una sola vez, en una pantalla, y que
desactivar pida confirmación con la consecuencia dicha.

- [ ] T013 [E2] `apps/console/src/features/merchants/feature.ts`: desenlaces `merchantRequested` (sin carga), `newMerchantCancelled` (sin carga) y `merchantCreated({ merchantId })`; `newMerchantScreen` en `screens`
- [ ] T014 [E2] `apps/console/src/features/merchants/strings.ts`: textos de alta (`newMerchantTitle`, `originsSection`, `originsWhy`, `originRow(n)`, `addOrigin`, `removeOrigin`, `signatureSection`, `create`, `issuedTitle`, `issuedWarning`, `continue`), credenciales (`ingestKey`, `platformKey`, `platformSecret`) y desactivación (`deactivateConsequence`, `confirmDeactivate`); `merchantCreatedDetail` deja de prometer «se muestran una sola vez» en el aviso: lo dice la pantalla
- [ ] T015 [E2] `apps/console/src/features/merchants/data/create-merchant.ts`: `merchantConstraints` sale de `CONSTRAINTS.MerchantCreate` de `contracts/ope/constraints` (importado desde `api/ope/client.ts`, que es quien puede tocar `contracts/ope/`, y reexportado); `isOrigin(value)` con la cita a `invalid-origin` como capa 2; `shape.badFormat` sigue; invalida `allMerchants`
- [ ] T016 [E2] `apps/console/src/features/merchants/screens/new-merchant-screen.tsx` (NUEVO): `defineScreen({ id: 'new-merchant', path: '/merchants/new', capability: 'merchants:write' })`; paso `form`: `Page` → `Form` con `Section` de orígenes (renglones `TextInput` con `useForm` por renglón, «agregar» hasta `maxItems`, «quitar» desde `minItems`; los `fields` de `422` con `origins.N` caen en el renglón `N`, los sin índice al pie) y `Section` de firma (`Checkbox`, omisión **sin firma**); pie con «Cancelar» (informa `newMerchantCancelled`; ver la nota del tramo) y «Crear» (`tone="primary"`, apagado mientras corre); paso `issued`: `SecretOnce` con los dos o tres valores y «Continuar» que informa `merchantCreated({ merchantId })`
- [ ] T017 [E2] `apps/console/src/app/flows.ts`: `merchantsFlow` gana `opens(merchants.outcomes.merchantRequested, newMerchantScreen)` y `finishes(merchants.outcomes.merchantCreated, merchantScreen, ({ merchantId }) => ({ merchantId }))`; `closes(merchants.outcomes.newMerchantCancelled)` para «cancelar»
- [ ] T018 [E2] `apps/console/src/features/merchants/screens/merchants-screen.tsx`: «Nuevo merchant» (barra y vacío) informa `merchantRequested` con `flow.toReach(…)` y deja de abrir el diálogo; se retira `new-merchant-dialog.tsx` y el estado `creating`
- [ ] T019 [E2] `apps/console/src/features/merchants/screens/deactivate-button.tsx`: al apretar abre `ConfirmDialog` (`tone="danger"`, `consequence = deactivateConsequence`, `running = action.running`), y la acción corre al confirmar
- [ ] T020 [E2] `apps/console/src/features/merchants/screens/new-merchant-screen.test.tsx` (NUEVO): montada en la aplicación real; un origen sin esquema no se envía; con `422 invalid-origin` y `pointer /body/origins/1` el error cae en el segundo renglón; con `422` sin `errors[]` cae al pie; al crear se ven los valores y «copiar»; **nada de lo registrado en telemetría ni en avisos contiene un valor** (`OW-8`); «continuar» informa `merchantCreated`; sin `merchants:write` la ruta responde «sin permisos»; `deactivate-button.test.tsx` (o en `merchants-screen.test.tsx`): desactivar pide confirmación y no corre sin ella
- [ ] T021 [E2] `apps/console/src/features/merchants/data/create-merchant.test.ts`: las restricciones vienen del módulo (`required` incluye `origins` y `signature`; `origins.items.maxLength === 255`)
- [ ] T022 [E2] Contra el backend real (quickstart, escenario 1 y 4): crear con y sin firma, copiar, continuar, atrás, origen repetido; desactivar con confirmación. Anotar lo visto en `quickstart.md`

**Punto de control**: escenario 1 entero a mano; la prueba de telemetría en verde y **en rojo** con un `console.log(value)` plantado en `SecretOnce`; `npm test`. Commit: `feat(006): el alta es una pantalla que muestra las credenciales una sola vez`.

> **Nota sobre «cancelar» en el alta.** Un formulario de alta que no se envía tiene que poder salir. Es un
> desenlace propio (`newMerchantCancelled`, sin carga) que el flujo **cierra**, igual que `merchantClosed`
> en la ficha: la pantalla no sabe a dónde vuelve. T016 y T017 lo incluyen; el `feature.ts` de T013 lo
> declara.

---

## Fase 3 · Tramo 3 — Rotar y apagar

**Meta**: que una llave perdida se reemplace desde la consola, y que OPE se apague y se encienda
para un merchant con confirmación. **Un `409` refresca la ficha.**

- [ ] T023 [E3] `apps/console/src/api/ope/client.ts`: `rotateIngestKey`, `rotatePlatformKey`, `rotatePlatformSecret` (`(merchantId, body?: CredentialRotation) → CredentialIssued`), `setKillSwitch(merchantId, body: KillSwitch) → KillSwitch`; tipos `CredentialRotation`, `CredentialIssued`, `CredentialKind`, `KillSwitch` de `api.d.ts`
- [ ] T024 [E3] `apps/console/src/features/merchants/data/rotate-credential.ts` (NUEVO): `rotateCredential` con `operations: { ingest, platform, signing }` (las tres `opeOperation`), `run` elige por `kind`, entrada `{ merchantId, kind, graceSeconds }`, invalida `oneMerchant` y `merchantLog`, anuncia `rotated(kind)` **sin el valor**; `rotationConstraints` de `CONSTRAINTS.CredentialRotation`
- [ ] T025 [P] [E3] `apps/console/src/features/merchants/data/set-kill-switch.ts` (NUEVO): `setKillSwitch` con entrada `{ merchantId, enabled }`, invalida `allMerchants`, `oneMerchant`, `merchantLog`, anuncia `switchedOff(id)`/`switchedOn(id)` según lo que volvió
- [ ] T026 [E3] `apps/console/src/features/merchants/feature.ts`: desenlaces `rotationRequested({ merchantId, kind })` y `rotationClosed`; `rotateScreen` en `screens`; `apps/console/src/app/flows.ts`: `opens(rotationRequested, rotateScreen, ({ merchantId, kind }) => ({ merchantId, kind }))` y `closes(rotationClosed)`
- [ ] T027 [E3] `apps/console/src/features/merchants/strings.ts`: `rotate`, `rotateTitle(kind)`, `rotateConsequence(kind)` (qué deja de valer, por clase), `graceSeconds`, `graceHelp`, `rotated(kind)`, `previousExpiresAt`, `noPrevious`, `back`, `turnOff`, `turnOn`, `turnOffConsequence`, `turnOnConsequence`, `switchedOff(id)`, `switchedOn(id)`, `rotateNotFound`
- [ ] T028 [E3] `apps/console/src/features/merchants/screens/rotate-screen.tsx` (NUEVO): `defineScreen({ id: 'rotate', path: '/merchants/:merchantId/rotate/:kind', capability: 'credentials:rotate' })`; `kind` se valida contra `CredentialKind` y lo que no es una clase dibuja `rotateNotFound` como el vacío de la ficha; paso `form`: `Form` con `Section` (título y consecuencia por clase) y `Field graceSeconds size="short"` con `NumberInput` (`decimals: 0`, `suffix: 's'`, omisión `0`) validado con `useForm` y `rotationConstraints`; los `fields` del `422` caen en el campo; pie «Volver» (informa `rotationClosed`) y «Rotar» (`tone="primary"`); paso `issued`: `SecretOnce` con el valor, `previousExpiresAt` como `FormattedValue` (o `noPrevious`), y «Volver»
- [ ] T029 [E3] `apps/console/src/features/merchants/screens/kill-switch-button.tsx` (NUEVO): `ActionButton` con `requires` de `setKillSwitch`; «Apagar OPE» (`tone="danger"`) si `status === 'active'`, «Encender» si `off`, nada si `deactivated`; abre `ConfirmDialog` con la consecuencia; `useAction(setKillSwitch, { onRejected: () => invalidar oneMerchant(id) })`
- [ ] T030 [E3] `apps/console/src/features/merchants/screens/merchant-screen.tsx`: la sección de credenciales gana por fila «Rotar» (`ActionButton compact`, informa `rotationRequested` con `flow.toReach(…)`, sólo si el merchant no está desactivado) y, para un merchant sin `signing`, una fila «sin secreto de firma» con «Crear» que rota `signing`; el pie gana `KillSwitchButton`; `DeactivateButton` recibe `onRejected` igual que el interruptor
- [ ] T031 [E3] `apps/console/src/features/merchants/screens/rotate-screen.test.tsx` (NUEVO): gracia `-1` no se envía; `422 rotation-grace-too-long` con `pointer /body/graceSeconds` cae en el campo; al rotar se ve el valor y `previousExpiresAt`; **la telemetría y los avisos no contienen el valor**; `kind` inválido dibuja «no existe»; sin `credentials:rotate` la ruta responde «sin permisos»; `kill-switch-button.test.tsx` (NUEVO): pide confirmación, con `off` ofrece encender, con `deactivated` no se dibuja, y con `409` la ficha se vuelve a pedir
- [ ] T032 [E3] `apps/console/src/features/merchants/data/rotate-credential.test.ts` y `set-kill-switch.test.ts`: cada acción exige lo que `OPERATIONS` dice, elige la operación por `kind`, invalida lo que debe y **no anuncia el valor**
- [ ] T033 [E3] Contra el backend real (quickstart, escenarios 2, 3 y 7): rotar con `3600` y con `700000`, crear el secreto de firma de un merchant sin firma, apagar y encender, el `409` desde dos pestañas. Anotar lo visto

**Punto de control**: escenarios 2, 3 y 7 a mano; `npm test`. Commit: `feat(006): rotar una llave y apagar OPE para un merchant, con confirmación y el 409 a la vista`.

---

## Fase 4 · Tramo 4 — El registro y los documentos

**Meta**: que la ficha diga quién hizo qué sobre el merchant, y que los documentos describan lo que
quedó.

- [ ] T034 [E4] `apps/console/src/api/ope/client.ts`: `listMerchantAdminLog(merchantId, query) → AdminEntryPage`; tipos `AdminEntry`, `AdminEntryPage`, `AdminOutcome`
- [ ] T035 [E4] `apps/console/src/features/merchants/data/merchant-log.ts` (NUEVO): `merchantLog(merchantId) = [...oneMerchant(merchantId), 'log']`, `useMerchantLog(merchantId, { from, onCursor })` con `useCollection`; `create-merchant.ts`, `deactivate-merchant.ts`, `rotate-credential.ts` y `set-kill-switch.ts` invalidan `merchantLog` del merchant (el alta no: nadie lo tiene cargado)
- [ ] T036 [E4] `apps/console/src/features/merchants/strings.ts`: `log`, `logCaption`, `at`, `atUtc`, `operator`, `operation`, `outcome`, `code`, `accepted`, `rejected`, `denied`, `logEmpty`, `logEmptyHelp`; `timeOf(instant)` junto a `dayOf` en `data/merchants.ts` (`HH:mm` UTC)
- [ ] T037 [E4] `apps/console/src/features/merchants/screens/merchant-log.tsx` (NUEVO): `Section` con `Table` de `resultOf(useMerchantLog(…), states, strings)`: columnas `at` (fecha y hora UTC, encabezado `atUtc`), `operatorId`, `operation`, `outcome` como `Badge` (`accepted` éxito, `rejected` aviso, `denied` peligro), `code`; `useTableQuery('log')`; `rowId = at + operatorId + operation`; `LoadMoreCursor` debajo con filas; el error con «reintentar» que hace `setCursor(undefined)`; sin filtros (el contrato no filtra); la ficha la monta debajo de las credenciales
- [ ] T038 [E4] `apps/console/src/features/merchants/screens/merchant-log.test.tsx` (NUEVO): los cuatro estados; «cargar más» escribe `log.c`; el vacío dice «todavía nadie»; sin `log:read` la sección no se dibuja y la ficha sí
- [ ] T039 [E4] Contra el backend real (quickstart, escenario 5 y 6): el registro lista lo hecho en los tramos 2 y 3, pagina, y un enlace con `log.c` reproduce el tramo; con `?dev.papel=lectura` sólo se ve lo de lectura. Anotar lo visto
- [ ] T040 [P] [E4] `.specify/memory/estado.md`: la tercera muleta (`emitConstraints`) en la tabla de la 040; «Qué hay hoy» dice que la 006 está construida; «Lo que sigue» pasa a configuración versionada; se saca de «roto o incómodo» el alta como diálogo y el `409` que no se veía
- [ ] T041 [P] [E4] `contracts/ope/README.md` (lo escribe `contract-sync`; verificar que nombre `constraints.*`), `README.md` de la raíz y `CLAUDE.md` si nombran qué pantallas hay o qué muletas quedan
- [ ] T042 [E4] `specs/006-el-merchant-completo/quickstart.md` con las notas fechadas de lo que difirió; `spec.md`: **Estado**: construida; `npm test` entero, `npm run build -w apps/console` y `ope-check artifact` sin la marca de la falsa

**Punto de control**: escenario 5 a mano; `npm test`; commit: `feat(006): la ficha muestra el registro de administración del merchant`, y después `docs(006): cierre — estado, muletas y quickstart`.

---

## Dependencias

```
Tramo 1 (núcleo, restricciones) ──► Tramo 2 (alta, desactivar) ──► Tramo 3 (rotar, apagar) ──► Tramo 4 (registro, docs)
```

- T001 antes de T015 y T028 (`items` en `FieldConstraints`); T002–T004 antes de T015 (`CONSTRAINTS`).
- T007 antes de T019 y T029; T008 antes de T016 y T028; T009 antes de T029 y T030.
- T013–T015 antes de T016; T016 antes de T017 y T018.
- T023–T027 antes de T028–T030; T028 reutiliza la forma de T016.
- T034–T036 antes de T037.

**En paralelo dentro de un tramo**: T006/T007/T008 (archivos distintos del núcleo); T024/T025 (dos
acciones); T040/T041 (documentos).

## Lo que no se hace, y conviene recordarlo al implementar

- **No se agrega una pantalla del registro de la plataforma** (`listAdminLog`): es de otra feature.
- **No se guarda ningún secreto** fuera del estado del componente: ni `localStorage`, ni la dirección,
  ni un `ref` que sobreviva al desmontar.
- **No se inventa la gracia máxima**: el `422` la dice.
- **No se traduce `operation`** del registro.
- **No se cambia granito**: lo que no compone bien es una propuesta, anotada en `OW-8`.
