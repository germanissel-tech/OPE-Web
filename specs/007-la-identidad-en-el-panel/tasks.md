# Tareas · La identidad en el panel

**Carpeta**: `007-la-identidad-en-el-panel` · **Entrada**: [`plan.md`](plan.md) · [`spec.md`](spec.md) ·
[`research.md`](research.md) · [`data-model.md`](data-model.md) · [`quickstart.md`](quickstart.md)

## Formato: `[ID] [P?] [Tramo] Descripción con su archivo`

- **`[P]`** — se puede hacer en paralelo: otro archivo, sin depender de nada incompleto
- **`[En]`** — a qué tramo del plan pertenece

Se organiza por **tramos**, como la 006: el 1 trae el contrato nuevo y saca las muletas, el 2 muestra
la identidad, el 3 la escribe con lo que el 2 ya muestra, y el 4 verifica a mano y cierra. Cada tramo
termina con algo que se puede correr, y es un commit.

## Antes de empezar

- **Tandilia es sólo lectura.** Nada escribe en granito ni en cuarzo.
- **El backend al lado**, en `../backend`, en su `main` con la 041 unida y `npm run contract:types`
  corrido (deja `generated/contract/`); `npm run dev` levantado para los pasos a mano; el operador de
  desarrollo y su token, del `README.md` del backend.
- **`npm test` en verde antes del primer commit**, sobre `main` recién fusionado.
- **Toda cita a una decisión resuelve**: `OW-5` y `OW-7` ganan su enmienda en el tramo 1; `ADR-044` y
  `ADR-045` existen en el backend.

---

## Fase 1 · Tramo 1 — Las muletas se van

**Meta**: que el contrato sincronizado sea el de la 041 copiado tal cual, que la barra diga quién es
el operador, y que no quede código con fecha de vencimiento cumplida.

- [x] T001 [E1] `npm run contract:sync` y versionar `contracts/ope/` (1.13.0): `capabilities.*`,
      `constraints.*`, `identity.json`, `openapi.yaml`, `api.d.ts`, `problem-types.d.ts`; revisar que
      `CONSTRAINTS.MerchantContact` y `MerchantProfileInput` digan lo que el bundle dice
- [x] T002 [E1] `scripts/contract-sync.mjs`: se borran `emitModule`, `emitConstraints`, `FIELD_KEYS`,
      `refName`, `INTERIM`, `origin`/`constraintsOrigin` y la rama que emite; si `generated/contract/` no
      existe o no es carpeta, `fail` con «corré `npm run contract:types` en <backend>»; el README que
      escribe dice «copiado de `generated/contract/` del backend» y pierde la fila de restricciones
      interinas; la cabecera del archivo deja de decir «interino»
- [x] T003 [E1] `tests/contract-sync.test.mjs` (NUEVO; se corre con `node --test` desde `npm test`, al
      lado de `icons.mjs`): con `--from` sobre una carpeta de mentira que tiene `contracts/dist/openapi.yaml`,
      `generated/api.d.ts`, `generated/problem-types.d.ts` y `generated/contract/` con los ocho archivos,
      copia los ocho y escribe el README; sin `generated/contract/`, sale con código distinto de cero y
      el mensaje nombra `contract:types`; **romperla a propósito** volviendo a poner una emisión de
      mentira y ver que la prueba la detecta (no quedan archivos que el backend no tenga)
- [x] T004 [E1] `apps/console/src/api/ope/client.ts`: `getOperator() → Operator` no va acá (la identidad
      usa su conector mínimo); gana `updateMerchantProfile(merchantId, body: MerchantProfileInput) →
      Merchant` y los tipos `Operator`, `MerchantContact`, `MerchantProfileInput` de `api.d.ts`
- [x] T005 [E1] `apps/console/src/api/ope/identity.ts`: `probeOperator` pasa a `fetchOperator`, misma
      firma, mismo conector mínimo; `GET /v1/admin/operator` y los claims de `OW-7`:
      `{ sub: operatorId, operatorId, name: displayName ?? operatorId, scope }`; el comentario deja de
      hablar de sonda; `apps/console/src/app/identity.ts` lo llama
- [x] T006 [E1] `apps/console/src/api/ope/identity.test.ts` (NUEVO): con un `fetch` de mentira que
      responde `Operator` con `displayName`, los claims traen `name: displayName`; sin `displayName`,
      `name: operatorId`; `scope` tal cual (`'*'` y lista); con `401` tira `RequestFailed` con
      `status: 401`; el pedido lleva lo que `authorize` puso
- [x] T007 [P] [E1] `docs/ope.md`: `OW-5` y `OW-7` ganan «**Enmienda OPE (2026-10-09).**» como las `CU`
      enmendadas: en `OW-5`, OPE-Backend emite `generated/contract/` (su 040, `ADR-044`) y
      `contract:sync` sólo copia, fallando si no la encuentra; en `OW-7`, `identify` es `getOperator` y la
      barra dice `displayName` o `operatorId`. El estado sigue «decidida»
- [x] T008 [P] [E1] `.specify/memory/estado.md`: «Las muletas de la 040» pasa a «Lo que la 040 y la
      041 trajeron» (qué se sacó y qué entró); «Qué hay hoy» nombra la 007 en curso; se saca de «roto o
      incómodo» el `422` de la gracia que iba al aviso. `CLAUDE.md`: se borra «Las tres muletas de la
      040»; la fila de `contract:sync` en «Cómo se corren las cosas» dice que copia
- [x] T009 [E1] `npm test` en verde (`conformity` con `contracts/ope/` copiada: 35 operaciones, 35
      esquemas); contra el backend real, entrar con `?dev.bearer=1` y ver «Operador de desarrollo» en la
      barra

**Punto de control**: la barra dice el nombre; `contract-sync` copia y falla sin carpeta; `npm test`.
Commit: `feat(007): la identidad es getOperator y el sincronizador sólo copia`.

> **Hecho el 2026-10-09.** Desvíos: (1) **el contrato nuevo exige `displayName` al crear**, así que
> el alta ganó en este tramo el campo del nombre —lo mínimo para compilar contra `MerchantCreate`—;
> el resto de la identidad en el alta es del tramo 3. (2) La prueba del sincronizador corre bajo
> Vitest (`tests/**/*.test.mjs` ya estaba en su `include`) y no con `node --test`: una forma menos.
> (3) El sincronizador exige los **ocho** archivos: copiar siete sería sincronizar a medias. Contra el
> backend: la barra dice «Operador de desarrollo · Todos los merchants» con una sola llamada.

---

## Fase 2 · Tramo 2 — La identidad se ve

**Meta**: que la grilla liste por nombre y que la ficha encabece por nombre y muestre la identidad,
sin que nada se escriba todavía.

- [x] T010 [E2] `apps/console/src/features/merchants/data/merchants.ts`: reexporta `MerchantContact`;
      `displayNameOf(merchant) → string | undefined`; `hasIdentity(merchant)` (alguno de los cuatro)
- [x] T011 [P] [E2] `apps/console/src/features/merchants/strings.ts`: `name`, `storeUrl`, `contact`,
      `contactName`, `contactEmail`, `contactPhone`, `contactRole`, `notes`, `identity` (la sección),
      `noName` («sin nombre»), `noIdentity` («todavía no tiene identidad»); las claves de la grilla y la
      ficha siguen siendo las del contrato donde las hay (`displayName` → `name` es el rótulo, no la clave)
- [x] T012 [E2] `apps/console/src/features/merchants/screens/merchants-screen.tsx`: primera columna
      `displayName` (rótulo `name`, `width 260px`): el nombre, o `<code>{merchantId}</code>` cuando no
      hay; la de `merchantId` queda segunda; la de `origins` **se va**; estado y alta sin cambio
- [x] T013 [E2] `apps/console/src/features/merchants/screens/identity-section.tsx` (NUEVO): `Section
title={identity} columns={2}` con los `Field` que el merchant tiene —nombre, URL (un `<a href
target="_blank" rel="noreferrer">` dentro de `Value`), contacto (cuatro campos, los ausentes sin
      dibujar), notas (`size="fill"`, texto tal cual)—; sin identidad, un solo `Field` con `noIdentity`
- [x] T014 [E2] `apps/console/src/features/merchants/screens/merchant-screen.tsx`: `Page title=
{displayNameOf(merchant) ?? merchantId} context={merchantId}` (el `Result` carga antes del título:
      mientras carga, el identificador); `IdentitySection` antes de la sección «Merchant»
- [x] T015 [E2] `apps/console/src/features/merchants/screens/merchants-screen.test.tsx`: la grilla
      muestra el nombre y, sin nombre, el identificador en `<code>`; ya no muestra orígenes;
      `apps/console/src/features/merchants/screens/merchant-screen.test.tsx` (NUEVO, montada como las
      demás): con identidad completa dibuja los siete valores y el enlace con `target="_blank"`; sin
      contacto no dibuja los campos del contacto; sin identidad dibuja `noIdentity`; el título es el
      nombre
- [x] T016 [E2] Contra el backend real (quickstart, escenario 2): «Tienda de desarrollo» en la grilla
      y en la ficha con su URL; un merchant creado con `curl` sin `displayName` no existe (el alta lo
      exige): usar uno del almacén anterior a la 041 si lo hay, o afirmar el caso sólo en la prueba.
      Anotar lo visto

**Punto de control**: escenario 2 a mano; `npm test`. Commit:
`feat(007): la grilla y la ficha reconocen al merchant por su nombre`.

> **Hecho el 2026-10-09.** Desvíos: ninguno de forma. Lo visto: (1) un merchant sin nombre ocupa con
> su identificador la columna del nombre **y** la suya, y las pruebas que lo buscaban por texto pasan
> a buscarlo «entre varios». (2) El ancla dentro de `Value` compone bien: se ve como enlace y abre en
> otra pestaña; no hace falta propuesta. (3) La sección de identidad con `columns={2}` dibuja un campo
> por renglón porque los campos son `medium`; se ve correcto y no se toca. Contra el backend: la grilla
> lista «Tienda Norte», «Tienda Norte», «Tienda Norte SA» (el almacén de desarrollo, donde
> `test:contract` y el quickstart de la 041 escribieron identidades); la ficha de `dev-merchant`
> encabeza por nombre y muestra la URL como enlace, el contacto y las notas. Recargar la ficha por URL
> pierde la sesión y muestra el `401` **con su identificador de pedido y «copiar»**: la 040 se ve.

---

## Fase 3 · Tramo 3 — La identidad se escribe

**Meta**: que el alta pida el nombre y admita el resto, y que la identidad se edite entera desde la
ficha, con el `422` en su campo.

- [ ] T017 [E3] `packages/core/src/ui/use-form.ts`: `FieldConstraints.format?: string`; `shapeErrorOf`
      trata `format: 'email'` como un patrón mínimo (`^[^\s@]+@[^\s@]+\.[^\s@]+$`) → `badFormat`;
      `packages/core/tests/use-form.test.ts`: un email sin `@` o sin punto en el dominio es `badFormat`,
      uno válido pasa; otros `format` no validan nada. El comentario no nombra negocio
- [ ] T018 [E3] `apps/console/src/features/merchants/data/identity.ts` (NUEVO): `IDENTITY_FIELDS`
      (los siete nombres), `identityConstraints(values) → MessageConstraints` (de
      `CONSTRAINTS.MerchantProfileInput` y `CONSTRAINTS.MerchantContact` con prefijo `contact.`;
      `required = ['displayName']` más `contact.name` y `contact.email` cuando algún `contact.*` tiene
      algo que no es espacio), `profileBodyOf(values) → MerchantProfileInput` (vacío no se manda;
      `contact` sólo si nombre o email tienen algo; **nada se recorta**), `identityValuesOf(merchant)`
      (la precarga; ausentes como `''`); `apps/console/src/features/merchants/data/identity.test.ts`
      (NUEVO): las tres funciones, incluido que un espacio en el borde viaja como está y que
      `required` cambia con el contacto
- [ ] T019 [E3] `apps/console/src/features/merchants/data/update-merchant-profile.ts` (NUEVO):
      `updateMerchantProfile` con `opeOperation('updateMerchantProfile', …)`, entrada `{ merchantId,
body }`, anuncia `identitySaved` con `displayName` (**nunca** el contacto), invalida `allMerchants`,
      `oneMerchant` y `merchantLog`; `update-merchant-profile.test.ts`: exige `merchants:write`,
      invalida lo que debe, el anuncio no contiene el email
- [ ] T020 [E3] `apps/console/src/features/merchants/data/create-merchant.ts`: `merchantConstraints`
      suma las de identidad (`fields` y `required` de `CONSTRAINTS.MerchantCreate` ya traen
      `displayName`; el contacto con prefijo, como en `identity.ts`: una sola función las arma);
      `create-merchant.test.ts`: `required` incluye `displayName`
- [ ] T021 [E3] `apps/console/src/features/merchants/strings.ts`: `editIdentity`, `editIdentityTitle`,
      `identityWhy` («se guarda entera: lo que se vacía se borra»), `contactWhy` («si hay contacto, nombre
      y email van»), `notesWhy`, `identitySaved`, `identitySavedDetail(name)`, `cancel` ya está
- [ ] T022 [E3] `apps/console/src/features/merchants/screens/identity-fields.tsx` (NUEVO): los siete
      campos en tres `Section` (nombre y URL · contacto · notas con `TextArea`), cada uno `Field` con su
      rótulo, `required` según `constraints.required`, `error={form.errorOf(name)}`, `TextInput` con
      `onBlur`; recibe `form` y `constraints`; lo usan el alta y la edición
- [ ] T023 [E3] `apps/console/src/features/merchants/screens/new-merchant-screen.tsx`: `IdentityFields`
      **antes** de los orígenes; los valores iniciales suman los siete campos en `''`; `submit` manda
      `{ origins, signature, ...profileBodyOf(form.values) }`; `merchantConstraints` pasa a depender de
      los valores; `new-merchant-screen.test.tsx`: sin nombre no envía; con los cuatro campos los manda;
      `422 invalid-merchant-profile` con `/body/displayName` cae en el nombre
- [ ] T024 [E3] `apps/console/src/features/merchants/feature.ts`: desenlaces `identityEditRequested({
merchantId })` e `identityClosed({ merchantId })`; `editIdentityScreen` en `screens`;
      `apps/console/src/app/flows.ts`: `opens(identityEditRequested, editIdentityScreen, …)` y
      `finishes(identityClosed, merchantScreen, …)`
- [ ] T025 [E3] `apps/console/src/features/merchants/screens/edit-identity-screen.tsx` (NUEVO):
      `defineScreen({ id: 'edit-identity', path: '/merchants/:merchantId/identity', capability:
'merchants:write' })`; `Result` sobre `useMerchant` para la precarga; `Form` con `IdentityFields`,
      `note` con `rejectedTitle` para un `422` sin campo, pie «Cancelar» (informa `identityClosed`) y
      «Guardar» (`tone="primary"`, apagado mientras corre); `useAction(updateMerchantProfile, { onDone:
→ identityClosed })`
- [ ] T026 [E3] `apps/console/src/features/merchants/screens/merchant-screen.tsx`: al pie, «Editar
      identidad» como `ActionButton` con `flow.toReach(identityEditRequested)`, **antes** de apagar y
      desactivar; también en un merchant desactivado
- [ ] T027 [E3] `apps/console/src/features/merchants/screens/edit-identity-screen.test.tsx` (NUEVO):
      precarga los siete valores; guardar manda el cuerpo sin vacíos; `422` con `/body/storeUrl` cae en
      la URL y con `/body/contact/email` en el email; sólo nombre de contacto → el email marca
      «obligatorio» y no se envía; vaciar nombre y email manda sin `contact`; «cancelar» informa
      `identityClosed`; sin `merchants:write` la ruta responde «sin permisos»; **ni la telemetría ni
      los avisos contienen el email del contacto**; `merchant-screen.test.tsx`: sin `merchants:write`
      no hay «editar»
- [ ] T028 [E3] Contra el backend real (quickstart, escenarios 3, 4 y 5): alta con contacto; editar,
      vaciar la URL, `" Tienda "`, `https://`, contacto a medias, vaciar el contacto, editar un
      desactivado; `?dev.papel=lectura`; el `403` con su identificador. Anotar lo visto

**Punto de control**: escenarios 3, 4 y 5 a mano; `npm test`. Commit:
`feat(007): el alta pide el nombre y la identidad se edita entera desde la ficha`.

---

## Fase 4 · Tramo 4 — El cierre

**Meta**: que los documentos describan lo que quedó, y que todo esté en verde.

- [ ] T029 [E4] `specs/007-la-identidad-en-el-panel/quickstart.md` con «Lo corrido» fechado, tramo
      por tramo, incluido lo que difirió; `spec.md`: **Estado**: construida
- [ ] T030 [P] [E4] `.specify/memory/estado.md`: «Qué hay hoy» dice que la 007 está construida; «Lo
      que sigue» queda en configuración versionada; `docs/propuestas-a-granito.md` sólo si el ancla en
      `Value` o el nombre con secundario no compusieron
- [ ] T031 [E4] `npm test` entero, `npm run revisar`, `npm run build`

**Punto de control**: todo en verde. Commit: `docs(007): cierre — estado y quickstart`.

---

## Dependencias

```
Tramo 1 ──► Tramo 2 ──► Tramo 3 ──► Tramo 4
```

- T001 antes de todo lo demás (los tipos y las restricciones nuevas vienen de ahí).
- T002 antes de T003; T004 antes de T005; T005 antes de T006.
- T010 y T011 antes de T012, T013 y T014; T013 antes de T014; T014 antes de T015.
- T017 y T018 antes de T022; T019 antes de T025; T021 antes de T022; T022 antes de T023 y T025;
  T024 antes de T025 y T026; T025 y T026 antes de T027.
- T029 después de T028.

**En paralelo dentro de un tramo**: T007/T008 con T002–T006; T011 con T010; T017/T018/T019/T021
entre sí.

## Lo que no se hace, y conviene recordarlo al implementar

- **No se recorta nada** antes de mandar: lo que el operador escribió viaja como está, y el backend
  lo dice en el campo.
- **No se valida `format: email` en la pantalla**: lo hace la capa 1 del núcleo, una vez.
- **No se muestra el contacto en ningún aviso** ni se registra en telemetría.
- **No se filtra por nombre.**
- **No se toca granito.** Si el ancla o el nombre con secundario no componen, es propuesta.
- **No se toca el backend.**
