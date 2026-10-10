# Las cosas · La identidad en el panel

**Carpeta**: `007-la-identidad-en-el-panel` · **Fecha**: 2026-10-09

Lo que esta feature agrega o cambia de forma. Los tipos del contrato **no se escriben**: salen de
`contracts/ope/api.d.ts`; acá se nombran para decir qué se usa de cada uno.

---

## 1 · Lo que el contrato da, y qué se usa

| esquema | campos que se usan | dónde |
|---|---|---|
| `Operator` | `operatorId`, `displayName?`, `scope` | `identify` → claims de la sesión |
| `Merchant` | gana `displayName?`, `storeUrl?`, `contact?`, `notes?`; lo demás como en la 006 | la grilla (nombre), la ficha (la sección de identidad), la precarga de la edición |
| `MerchantContact` | `name`, `email` (obligatorios), `phone?`, `role?` | la ficha y los cuatro campos planos |
| `MerchantCreate` | gana `displayName` (obligatorio), `storeUrl?`, `contact?`, `notes?` | el alta |
| `MerchantProfileInput` | `displayName` (obligatorio), `storeUrl?`, `contact?`, `notes?` | la edición |
| `CONSTRAINTS.MerchantProfileInput`, `CONSTRAINTS.MerchantContact`, `CONSTRAINTS.MerchantCreate` | largos, `pattern` de `storeUrl`, `format: email` | la capa 1 de los dos formularios |
| `OPERATIONS.getOperator`, `OPERATIONS.updateMerchantProfile` | `[]` y `['merchants:write']` | qué exige cada cosa |

## 2 · Los claims del bearer (`OW-7`, enmendada)

```
{ sub: operatorId, operatorId, name: displayName ?? operatorId, scope: '*' | string[] }
```

`UserBar` lee `name`; `userCaption` lee `scope`; `toCapabilities` sigue devolviendo todas las del
consumidor `admin` cuando hay `scope`.

## 3 · Los siete campos de la identidad, y cómo viajan

| campo del formulario | del contrato | restricción (capa 1) | obligatorio |
|---|---|---|---|
| `displayName` | `MerchantProfileInput.displayName` | 1..120 | sí |
| `storeUrl` | `MerchantProfileInput.storeUrl` | 1..255, `^https?://` | no |
| `contact.name` | `MerchantContact.name` | 1..120 | si algún campo del contacto tiene algo |
| `contact.email` | `MerchantContact.email` | 3..254, `format: email` | si algún campo del contacto tiene algo |
| `contact.phone` | `MerchantContact.phone` | 1..32 | no |
| `contact.role` | `MerchantContact.role` | 1..80 | no |
| `notes` | `MerchantProfileInput.notes` | 1..2000 | no |

`profileBodyOf(values)` → `MerchantProfileInput`: un campo vacío **no se manda**; `contact` se manda
sólo si `contact.name` o `contact.email` tienen algo, con los cuatro campos que tengan algo; **nada
se recorta**. El alta manda `{ origins, signature, ...profileBodyOf(values) }`.

La correspondencia puntero → campo es la de `fieldNameOf`: `/body/contact/email` → `contact.email`.

## 4 · La acción

| acción | entrada | operación | exige | invalida | anuncia |
|---|---|---|---|---|---|
| `merchant.updateProfile` | `{ merchantId, body: MerchantProfileInput }` | `updateMerchantProfile` | `merchants:write` | `allMerchants`, `oneMerchant`, `merchantLog` | «la identidad se guardó» · el `displayName`; **nunca** el contacto |

## 5 · Los desenlaces y el flujo

| desenlace | carga | quién lo informa | qué hace el flujo |
|---|---|---|---|
| `identityEditRequested` | `{ merchantId }` | la ficha | `opens(editIdentityScreen)` |
| `identityClosed` | `{ merchantId }` | la pantalla de edición (guardó o canceló) | `finishes(merchantScreen)` |

## 6 · Lo que se va

| qué | dónde | por qué |
|---|---|---|
| `probeOperator` | `api/ope/identity.ts` | la sonda se reemplaza por `fetchOperator` |
| `emitModule`, `emitConstraints`, `FIELD_KEYS`, `refName`, `INTERIM` | `scripts/contract-sync.mjs` | el backend emite; el sincronizador copia o falla |
| la columna de orígenes | `merchants-screen.tsx` | el nombre reconoce; los orígenes quedan en la ficha |
| «Las tres muletas de la 040» | `CLAUDE.md`, `.specify/memory/estado.md` | llegaron |
