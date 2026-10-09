# Las cosas · El merchant completo

**Carpeta**: `006-el-merchant-completo` · **Fecha**: 2026-10-08

Lo que esta feature agrega o cambia de forma. Los tipos del contrato **no se escriben**: salen de
`contracts/ope/api.d.ts`; acá se nombran para decir qué se usa de cada uno.

---

## 1 · Lo que el contrato da, y qué se usa

| esquema | campos que se usan | dónde |
|---|---|---|
| `MerchantCreate` | `origins: string[]` (1–20, cada uno ≤ 255), `signature: boolean` | el formulario de alta |
| `MerchantCreated` | `merchant` (la ficha) y `credentials` (`ingestKey`, `platformKey`, `platformSecret?`) | el paso de credenciales del alta |
| `CredentialRotation` | `graceSeconds?: integer ≥ 0` (omisión `0`) | el formulario de rotación |
| `CredentialIssued` | `kind`, `value`, `issuedAt`, `previousExpiresAt?` | el paso de credenciales de la rotación |
| `CredentialKind` | `ingest · platform · signing` | la ruta de rotación y los rótulos |
| `KillSwitch` | `enabled: boolean` | el interruptor, pedido y respuesta |
| `MerchantStatus` | `active · off · deactivated` | pastillas; qué botones se dibujan |
| `AdminEntry` | `at`, `operatorId`, `operation`, `outcome`, `code?`; `merchantId`, `result`, `reason` no se muestran | el registro |
| `AdminEntryPage` | `{ items, nextCursor? }` | `useCollection` |

## 2 · Las acciones

Cada una es un `defineAction` en `data/`; lo que exige sale de `OPERATIONS` del módulo.

| acción | entrada | operaciones | exige | invalida | anuncia |
|---|---|---|---|---|---|
| `merchant.create` | `MerchantCreate` | `createMerchant` | `merchants:write` | `allMerchants` | título con `merchantId`; **nunca** una credencial |
| `merchant.rotate` | `{ merchantId, kind, graceSeconds }` | `rotateIngestKey`, `rotatePlatformKey`, `rotatePlatformSecret` — `run` elige por `kind` | `credentials:rotate` | `oneMerchant`, `merchantLog` | «se rotó la llave <clase>»; nunca el valor |
| `merchant.setKillSwitch` | `{ merchantId, enabled }` | `setKillSwitch` | `merchants:write` | `allMerchants`, `oneMerchant`, `merchantLog` | «OPE quedó apagado / encendido para <id>» |
| `merchant.deactivate` | `Merchant` | `deactivateMerchant` | `merchants:write` | `allMerchants`, `oneMerchant`, `merchantLog` | sin cambios |

`merchant.create` invalida también `merchantLog` del merchant nuevo: no hace falta (nadie tiene esa
clave cargada todavía), y no se escribe.

## 3 · Los desenlaces y el flujo

| desenlace | carga | quién lo informa | qué hace el flujo |
|---|---|---|---|
| `merchants.merchantRequested` | — | «Nuevo merchant» (barra y vacío de la grilla) | `opens(newMerchantScreen)` |
| `merchants.merchantCreated` | `{ merchantId }` | «Continuar» del paso de credenciales | `finishes(merchantScreen, { merchantId })`: el alta se termina y la ficha ocupa su lugar |
| `merchants.merchantChosen` | `{ merchantId }` | la grilla (existe) | `opens(merchantScreen)` |
| `merchants.rotationRequested` | `{ merchantId, kind }` | «Rotar» de cada credencial en la ficha | `opens(rotateScreen, { merchantId, kind })` |
| `merchants.rotationClosed` | — | «Volver» de la rotación | `closes` |
| `merchants.merchantClosed` | `{ merchantId }` | «Volver a merchants» (existe) | `closes` |

Ninguna pantalla nombra a otra: `toReach(outcome)` dice qué capacidad exige llegar, y
`verifyFlows` falla en el arranque si un desenlace no está cableado.

## 4 · Las pantallas

| pantalla | ruta | parámetros | capacidad | menú |
|---|---|---|---|---|
| `newMerchantScreen` | `/merchants/new` | — | `merchants:write` | no: se llega desde la grilla |
| `rotateScreen` | `/merchants/:merchantId/rotate/:kind` | `merchantId`, `kind` (se valida contra `CredentialKind`) | `credentials:rotate` | no |
| `merchantScreen` | `/merchants/:merchantId` | `merchantId` | `merchants:read` | no (existe) |

**Las dos nuevas tienen dos pasos**, y el segundo es estado del componente:

```
NewMerchantScreen:   step = { kind: 'form' } | { kind: 'issued', created: MerchantCreated }
RotateScreen:        step = { kind: 'form' } | { kind: 'issued', issued: CredentialIssued }
```

Nada de `issued` sale del componente: ni a la dirección, ni a `localStorage`, ni a un aviso, ni a la
telemetría (`OW-8`). Desmontar lo olvida.

## 5 · El registro como colección

```
merchantLog(merchantId) = [...oneMerchant(merchantId), 'log']
useMerchantLog(merchantId, { from, onCursor }) → CollectionQuery<AdminEntry>
useTableQuery('log')   →  ?log.c=<cursor>&log.row=<at>
```

`rowId` es `at + operatorId + operation` (el contrato no da identificador de entrada; dos acciones
en el mismo milisegundo del mismo operador y la misma operación serían una fila repetida, y se
acepta: es un registro, no un ABM).

## 6 · Las restricciones emitidas (capa 1 de `CU-38`)

```ts
// contracts/ope/constraints.d.ts — GENERATED
export type FieldConstraints = {
  readonly type?: string
  readonly minLength?: number;  readonly maxLength?: number
  readonly pattern?: string
  readonly minimum?: number;    readonly maximum?: number
  readonly minItems?: number;   readonly maxItems?: number
  readonly items?: FieldConstraints
}
export type MessageConstraints = {
  readonly required: readonly string[]
  readonly fields: Readonly<Record<string, FieldConstraints>>
}
export declare const CONSTRAINTS: {
  readonly MerchantCreate: MessageConstraints
  readonly CredentialRotation: MessageConstraints
  readonly KillSwitch: MessageConstraints
  // … todo esquema de `components.schemas` que sea `type: object` y lo use un requestBody
}
```

`FieldConstraints` del núcleo gana los tres campos de arreglo. El formulario de alta usa
`CONSTRAINTS.MerchantCreate.fields.origins.items` para cada renglón y `minItems`/`maxItems` para
cuántos renglones admite. La **capa 2** (`invalid-origin`) queda como `isOrigin()` en
`create-merchant.ts` con la cita del invariante.

## 7 · Lo que el núcleo gana

```ts
// packages/core/src/ui/confirm-dialog.tsx
type ConfirmDialogProps = {
  readonly open: boolean
  readonly title: string
  readonly consequence: ReactNode        // lo que pasa si confirma; lo escribe la aplicación
  readonly confirmLabel: string
  readonly tone?: 'primary' | 'danger'
  readonly running?: boolean             // confirmar apagado con razón (GR-65)
  readonly onConfirm: () => void | Promise<unknown>
  readonly onClose: () => void
}

// packages/core/src/ui/secret-once.tsx
type SecretOnceProps = {
  readonly warning: ReactNode            // «no vuelven a verse; una perdida se rota»
  readonly secrets: readonly { readonly label: string; readonly value: string }[]
}
// dibuja Alert(warning) + por secreto Field(label) → Value + Button copiar;
// «copiado» un instante, «no se pudo copiar» si navigator.clipboard falla o no existe

// packages/core/src/data/use-action.ts
type ActionOptions<Output> = {
  readonly onDone?: (output: Output) => void
  readonly onRejected?: (failed: RequestFailed) => void   // NUEVO: tras el aviso, con cualquier RequestFailed
  readonly concurrency?: Concurrency
}
```

Textos del marco nuevos: `copy`, `copied`, `copyFailed`, `confirm`, `cancel`.

## 8 · Los textos de la funcionalidad

Claves nuevas en `merchantsStrings`, agrupadas: alta (`newMerchantTitle`, `originsSection`,
`originRow(n)`, `addOrigin`, `removeOrigin`, `create`, `issuedTitle`, `issuedWarning`, `continue`),
credenciales (`ingestKey`, `platformKey`, `platformSecret`, `rotate`, `rotateTitle(kind)`,
`rotateConsequence(kind)`, `graceSeconds`, `graceHelp`, `rotated(kind)`, `previousExpiresAt`,
`back`), interruptor (`turnOff`, `turnOn`, `turnOffConsequence`, `turnOnConsequence`,
`switchedOff(id)`, `switchedOn(id)`), desactivación (`deactivateConsequence`), registro (`log`,
`at`, `operator`, `operation`, `outcome`, `code`, `accepted`, `rejected`, `denied`, `logEmpty`,
`logEmptyHelp`, `logCaption`). Las que son campo del contrato (`graceSeconds`, `operation`,
`outcome`, `code`) se llaman por el campo, que es lo que `labels` compara.
