# Modelo de datos · La configuración versionada

**Carpeta**: `008-la-configuracion-versionada` · **Fecha**: 2026-10-09

Qué del contrato se usa, cómo se presenta cada valor y qué viaja intacto. Los tipos salen de
`contracts/ope/api.d.ts`; acá no se redefinen, se dice qué se hace con ellos.

## 1 · Las once operaciones

| nivel | leer | historial | una versión | publicar | capacidad para publicar |
|---|---|---|---|---|---|
| merchant | `getMerchantConfiguration` | `listConfigurationVersions` | — (viene en la página) | `publishMerchantConfiguration` | `configuration:write` |
| plataforma | `getPlatformConfiguration` | `listPlatformConfigurationVersions` | `getPlatformConfigurationVersion` | `publishPlatformConfiguration` | `configuration:write` y alcance `*` |
| defaults | `getTreatmentDefaults` | `listTreatmentDefaultsVersions` | `getTreatmentDefaultsVersion` | `publishTreatmentDefaults` | `configuration:write` y alcance `*` |

Leer exige `configuration:read` en los tres, con cualquier alcance (research §8).

## 2 · Lo que se edita, y en qué unidad se lee

La unidad es **del valor**, declarada una vez en la funcionalidad, y la usan la vista, la edición y el
historial (research §5). Las tasas se leen en porcentaje (research §4).

### Plataforma (`content`), todo editable

| campo | se lee en |
|---|---|
| `dedupWindow.ttlMs` | horas |
| `dedupWindow.maxIds` | cantidad |
| `eventPastToleranceMs` | horas |
| `clockSkewToleranceMs` | minutos |
| `sessionDurationMs` | minutos |
| `visitorWindowMs` | horas |
| `signatureWindowMs` | minutos |
| `rotationGraceMaxMs` | días |
| `anchorDiagnosticsKept` | cantidad |
| `unmappedValuesKept` | cantidad |
| `retryAfterSeconds` | segundos |

### Tratamiento: defaults (`content`) y merchant (`declared`)

Los mismos valores en los dos. En los defaults están todos; en el merchant cada uno se hereda o se
declara (research §6).

| grupo | campo | se lee en | control |
|---|---|---|---|
| frescura | `freshness.catalogMs` | horas | número |
| | `freshness.stockAndPriceMs` | minutos | número |
| nivel de sincronización | `syncLevel.receiptsKept` | cantidad | número |
| | `syncLevel.noDataAfterMs` | horas | número |
| | `syncLevel.minutesLevelMaxAgeMs` | minutos | número |
| | `syncLevel.minutesLevelMedianIntervalMs` | minutos | número |
| | `syncLevel.minutesLevelMinReceipts` | cantidad | número |
| reparto | `holdoutShare` | % | número |
| dónde y qué | `surfaces` | — | marcas de una lista cerrada (`product`, `cart`) |
| | `barriers` | — | marcas de una lista cerrada (`fit`, `price`, `returns`) |
| sincronización por flujo | `syncStrategy.catalog`, `.stockAndPrice`, `.orders`, `.returns` | — | lista de tres (`push`, `pull`, `subscribe`) |
| idiomas | `locales.supported` | etiqueta BCP 47 | renglones |
| | `locales.fallback` | etiqueta BCP 47 | uno de los soportados |
| evidencia | `evidenceProfile.returnsPolicy`, `.fitData` | — | marca |
| | `evidenceProfile.authorizedAttributes` | texto | renglones |
| política comercial | `commercialPolicy.version` | texto | obligatorio si la política viaja (research §7) |
| | `commercialPolicy.maxIncentiveShare`, `.marginShare` | % | número |
| | `commercialPolicy.incentiveLadderShare` | % por escalón | renglones |
| | `commercialPolicy.directIncentiveOnPrice` | — | marca |
| | `commercialPolicy.highIntent` | — | lista (`from-cart`, `from-checkout`, `never`) |
| | `commercialPolicy.abandonment` | — | lista (`nothing`, `reassure-returns`) |
| | `commercialPolicy.interventionsPerSession`, `.interventionsPerVisitorPerDay` | cantidad | número |
| | `commercialPolicy.cooldownSeconds` | segundos | número |

## 3 · Lo que viaja intacto

| nivel | qué | de dónde sale | cómo se ve |
|---|---|---|---|
| merchant | `decisionPolicy` | lo declarado en la versión que rige | su versión, su umbral, cuántas reglas; o «heredada» |
| merchant | `commercialPolicy.returnRisk` | ídem | «declarada» o «heredada» |
| merchant | `anchors` | ídem | los anclajes que declara, por nombre |
| merchant | `attributeLabels` | ídem | cuántas etiquetas |
| defaults | `decisionPolicy` | el contenido de la versión que rige | su versión, su umbral, cuántas reglas |
| defaults | `commercialPolicy.returnRisk` | ídem | «definida» |

Se toman al **armar el cuerpo**, no al dibujar (research §7).

## 4 · Los nombres de los campos

El camino del valor en el cuerpo, con puntos (research §1):

```
reason · corrective
declared.holdoutShare · declared.freshness.stockAndPriceMs · declared.locales.supported.0
content.dedupWindow.ttlMs · content.commercialPolicy.incentiveLadderShare.2
```

Una marca se guarda como `'true'` o `'false'`; un conjunto cerrado, como un renglón por elemento
elegido (`declared.surfaces.0 = 'product'`).

## 5 · Las acciones

| acción | operación | invalida | anuncia |
|---|---|---|---|
| `configuration.publishMerchant` | `publishMerchantConfiguration` | la configuración y el historial del merchant | «se publicó la versión N», o «no cambió nada: sigue la versión N» |
| `configuration.publishPlatform` | `publishPlatformConfiguration` | plataforma, su historial y toda configuración de merchant | ídem, más las mediciones reiniciadas por identificador |
| `configuration.publishDefaults` | `publishTreatmentDefaults` | defaults, su historial y toda configuración de merchant | ídem |

Ninguna anuncia un valor: el registro de la consola lleva acciones y fallos, no cuerpos (`CU-35`).

## 6 · Los desenlaces y el flujo

| funcionalidad | desenlace | lleva a |
|---|---|---|
| merchants | `configurationRequested({ merchantId })` | abre la vista de configuración del merchant |
| merchants | `configurationClosed({ merchantId })` | vuelve a la ficha |
| merchants | `configurationPublishRequested({ merchantId })` | abre la publicación |
| merchants | `configurationPublished({ merchantId })` | termina en la vista |
| configuration | `platformPublishRequested` / `platformPublished` | abre / termina en la vista de plataforma |
| configuration | `defaultsPublishRequested` / `defaultsPublished` | abre / termina en la vista de defaults |
| configuration | `levelVersionChosen({ level, version })` | abre una versión del historial |

Cancelar una publicación es `closes`: desapila sin publicar.
