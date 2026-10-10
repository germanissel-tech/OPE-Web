# Modelo de datos · El testigo en la consola

## 1 · Lo que cambia del contrato (`1.15.0`)

| operación | qué cambia |
|---|---|
| `getMerchantConfiguration`, `getPlatformConfiguration`, `getTreatmentDefaults`, `getMerchant` | entregan el testigo en `ETag` |
| `publishMerchantConfiguration`, `publishPlatformConfiguration`, `publishTreatmentDefaults`, `updateMerchantProfile` | exigen `If-Match`; `412 stale-version`, `428 witness-required`; `versioned: true` |
| `getMerchantConfigurationVersion` (042) | nueva: una versión del merchant por número |
| `MerchantConfigurationVersion`, `…Version` de los niveles (042) | `windowsRestarted` en toda lectura |

## 2 · El testigo en el cliente

`Witnessed<T> = T & { readonly witness: string }`: las cuatro lecturas devuelven el dato con el testigo de esa
respuesta. Las cuatro escrituras reciben `witness` y lo mandan como `If-Match`.

## 3 · Las hojas comparables

Lo que cada pantalla le da a la puerta (`Concurrency` de `CU-29`):

| pantalla | claves | valor |
|---|---|---|
| configuración de un merchant | las hojas operativas (`OPERATIVE_LEAVES`) | el valor del contrato en `JSON`, o `undefined` si se hereda |
| plataforma | las hojas de `PLATFORM_GROUPS` | el valor del contrato en `JSON` |
| defaults | las hojas de `TREATMENT_GROUPS` | ídem |
| identidad | `displayName`, `storeUrl`, `notes`, `contact.name`, `contact.email`, `contact.phone`, `contact.role` | el texto, o `undefined` si falta |

| pieza de `Concurrency` | qué da |
|---|---|
| `loaded` | las hojas de lo que se cargó al abrir |
| `onScreen()` | las hojas de lo que hay en el formulario ahora |
| `reread()` | relee el recurso, recuerda lo que rige ahora, y devuelve sus hojas y su testigo |
| `retryWith(fusion, testigo)` | el pedido: las hojas fusionadas, lo no editado de la relectura, la correctiva y el motivo de la pantalla, y el testigo nuevo |

## 4 · Lo que viaja intacto, ahora de la relectura

| nivel | qué | de dónde, al reintentar |
|---|---|---|
| merchant | `decisionPolicy`, `commercialPolicy.returnRisk`, `anchors`, `attributeLabels` | lo declarado en la versión que rige al releer |
| defaults | `decisionPolicy`, `commercialPolicy.returnRisk` | el contenido que rige al releer |
