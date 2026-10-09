# Plan de implementación · La identidad en el panel

**Carpeta**: `007-la-identidad-en-el-panel` · **Rama**: `007-la-identidad-en-el-panel` · **Fecha**: 2026-10-09 ·
**Spec**: [`spec.md`](spec.md)

## Resumen

Tomar entero lo que la 040 y la 041 de OPE-Backend le dan a la consola: **sacar las tres muletas**
(la sonda de identidad pasa a `getOperator` y la barra dice el nombre; el sincronizador deja de
emitir y sólo copia), **reconocer al merchant por su nombre** en la grilla y en la ficha, **dar de
alta con identidad** y **editarla entera** desde la ficha como pantalla. Todo en
`features/merchants`, copiando la forma que la 006 dejó: una acción declara sus operaciones, una
pantalla declara qué decir en cada estado, y el flujo decide a dónde lleva cada desenlace.

**Lo que la investigación cambió**, en tres puntos ([`research.md`](research.md)): los claims del
bearer **no cambian de forma** —`OW-7` ya los tenía escritos— y la sonda se reemplaza en una función
(§1); la identidad se edita con **siete campos planos** y una regla de capa 1 que depende de los
valores («si hay contacto, nombre y email van»), sin tocar `useForm` más que para que la capa 1
entienda `format: email` (§5); y los orígenes **salen de la grilla**: con nombre, ya no reconocen a
nadie (§3).

**Y lo que depende del backend**: nada. Las dos features están unidas en su `main`.

## Contexto técnico

| | | de dónde sale |
|---|---|---|
| **Lenguaje** | TypeScript `strict`, Node 24; prosa en castellano, código en inglés | constitución, `CU-15` |
| **Dónde** | `apps/console/src/features/merchants/` (pantallas, acciones, textos); `apps/console/src/api/ope/` (`identity.ts`, `client.ts`); `packages/core/src/ui/use-form.ts` (una línea de capa 1); `scripts/contract-sync.mjs` (se achica) | principios III y V |
| **Interfaz** | `@granito/ui` por `file:`: `Form`, `Section`, `Field`, `TextInput`, `TextArea`, `Value`, `Badge`, `Table`, `Button`; un ancla HTML dentro de `Value` para la URL | principio IV |
| **Datos** | `useAction` para la edición; `useQuery` (`useMerchant`) para la precarga; la colección de la grilla no cambia | `CU-25`, `OW-4` |
| **Contrato** | `getOperator`, `updateMerchantProfile`, `createMerchant`, `getMerchant`, `listMerchants`; tipos `Operator`, `Merchant`, `MerchantContact`, `MerchantProfileInput`, `MerchantCreate`; `CONSTRAINTS` y `OPERATIONS` copiados de `generated/contract/` | `OW-5` enmendada |
| **Errores** | `422 invalid-merchant-profile` con `pointer` bajo `/body` al campo (`contact.email` por `fieldNameOf`); `403` como defecto nuestro con `requestId` en el aviso | `OW-3` |
| **Pruebas** | Vitest con Testing Library: las pantallas montadas en la aplicación real contra un `OpeClient` de mentira (como la 006); `identity` con un `fetch` de mentira; el sincronizador con una carpeta de backend de mentira; `ope-check` entero | spec «Cómo se verifica» |
| **Alcance** | Una pantalla nueva (edición), una sección nueva en la ficha, una sección nueva en el alta, una columna que cambia y una que se va, una acción, dos desenlaces, una función reemplazada, dos funciones borradas, dos enmiendas | spec «Escenarios» |

Sin `NEEDS CLARIFICATION`: los dos supuestos de la spec (reemplazo entero; las muletas se sacan acá)
se presentaron al dueño y dijo «continuá».

## Control de constitución

Contra la constitución de OPE-Web, **versión 2.0.0** (enmendada 2026-10-08). Los seis principios,
también los que no cambian nada acá:

| principio | cómo lo cumple |
|---|---|
| **I** · La spec y el plan se acuerdan; la feature se implementa con autonomía | La spec se presentó con sus dos supuestos y el dueño dijo «continuá». Los tramos se implementan y commitean sin esperar OK por archivo |
| **II** · Lo que no está decidido se pregunta | Lo que la spec dejó abierto —qué columna secundaria lleva la grilla— se decidió en la investigación (§3: ninguna; los orígenes van a la ficha) porque es composición, no decisión del dueño. Si al mirarlo no convence, se cambia en el tramo |
| **III** · `packages/` no sabe de negocio | Lo único que entra al núcleo es que la capa 1 entienda `format: email`: la forma de un dato, sin nombrar merchant ni contacto. Todo lo demás es de `apps/console` |
| **IV** · Lo visual es de granito | La ficha, la edición y el alta **componen** `Field`, `Value`, `TextInput`, `TextArea` sin `className` ni estilo. La URL es un ancla HTML dentro de `Value`: semántica, no estilo. Si al componer hace falta un «valor con secundario» o un «campo de enlace», va a `propuestas-a-granito.md` |
| **V** · Paquete o aplicación, y la prueba es una sola | ¿Si arreglo el patrón de email, tiene que llegarle al portal? Sí → `packages/core`. ¿Si arreglo el formulario de identidad? No → `apps/console`. Declarado pieza por pieza en la estructura |
| **VI** · Se comparte la puerta, no el proveedor | `identify` cambia lo que pregunta, no cómo entra: la puerta y el adaptador bearer no se tocan. Se declara para que conste que se miró |

### Qué garantía sostiene cada cosa

| | qué sostiene |
|---|---|
| **se genera** | Los tipos de `Operator`, `Merchant`, `MerchantContact`, `MerchantProfileInput`, `MerchantCreate`; `OPERATIONS.updateMerchantProfile`; `CONSTRAINTS` de los tres esquemas: copiados de `generated/contract/` |
| **no compila** | `opeOperation('updateMerchantProfil', …)`; un cuerpo de edición que no sea `MerchantProfileInput`; `identify` que no devuelva `operatorId`; un desenlace que el flujo no cablea (`verifyFlows`) |
| **se hereda** | `edit-identity-screen` es la forma de **editar un recurso existente** (precarga, reemplazo entero, vuelta a la ficha); `identity-fields` la de un grupo de campos que dos formularios comparten. La configuración versionada las copia |
| **lo agarra una prueba** | Las de la spec, una por escenario (abajo, en cada tramo); `conformity` con `contracts/ope/` copiada; la del sincronizador sin `generated/contract/`; `ope-check` entero |
| **lo mira una persona** | Contra el backend real, con el `quickstart.md`: los seis escenarios, el `403` con su identificador de pedido, y que cada pantalla componga como granito manda |

**Dos comprobaciones nuevas se rompen a propósito antes de creerles**: la del sincronizador sin
carpeta (volviendo a poner una emisión de mentira) y la de `profileBodyOf` (recortando un espacio).

## Estructura

```
ope/mvp/web/
├── scripts/contract-sync.mjs            pierde emitModule, emitConstraints y la rama interina; falla sin generated/contract/
├── scripts/contract-sync.test.mjs       NUEVO · copia desde una carpeta de mentira; falla sin la carpeta
├── contracts/ope/                       copiados por contract:sync (1.13.0); README.md reescrito
├── docs/
│   ├── ope.md                           OW-5 y OW-7: «Enmienda OPE (2026-10-09)»
│   └── propuestas-a-granito.md          sólo si el ancla en Value o el nombre con secundario no componen
├── .specify/memory/estado.md            «Las muletas de la 040» → «Lo que la 040 y la 041 trajeron»; lo que sigue
├── CLAUDE.md                            sin la sección de las muletas
├── packages/core/
│   ├── src/ui/use-form.ts               FieldConstraints.format?: 'email' → patrón mínimo en shapeErrorOf
│   └── tests/use-form.test.ts           un email sin @ es badFormat
└── apps/console/src/
    ├── api/ope/identity.ts              fetchOperator: getOperator → claims de OW-7
    ├── api/ope/identity.test.ts         NUEVO · claims con y sin displayName; 401 tira
    ├── api/ope/client.ts                updateMerchantProfile; tipos Operator, MerchantContact, MerchantProfileInput
    ├── app/identity.ts                  identify: fetchOperator
    ├── app/flows.ts                     opens(identityEditRequested → editIdentityScreen), finishes(identityClosed → merchantScreen)
    └── features/merchants/
        ├── feature.ts                   editIdentityScreen; dos desenlaces
        ├── strings.ts                   identidad, contacto, edición, «sin nombre», «se guarda entera»
        ├── data/
        │   ├── identity.ts              NUEVO · identityConstraints(values), profileBodyOf(values), identityValuesOf(merchant)
        │   ├── identity.test.ts         NUEVO · required condicional; cuerpo sin vacíos ni recortes; precarga
        │   ├── update-merchant-profile.ts   NUEVO · la acción
        │   ├── update-merchant-profile.test.ts
        │   ├── create-merchant.ts       las restricciones de identidad se suman a las de origins
        │   └── merchants.ts             exporta los tipos nuevos; displayNameOf(merchant)
        └── screens/
            ├── identity-fields.tsx      NUEVO · los siete campos, con sus errores
            ├── identity-section.tsx     NUEVO · la sección de sólo lectura de la ficha
            ├── edit-identity-screen.tsx NUEVO · /merchants/:merchantId/identity
            ├── edit-identity-screen.test.tsx
            ├── merchant-screen.tsx      título por nombre; la sección; «Editar identidad» al pie
            ├── merchant-screen.test.tsx NUEVO · con y sin identidad; sin merchants:write no hay «editar»
            ├── merchants-screen.tsx     columna de nombre primero; la de orígenes se va
            ├── merchants-screen.test.tsx   el nombre, y el identificador cuando no hay
            ├── new-merchant-screen.tsx  la sección de identidad antes de los orígenes
            └── new-merchant-screen.test.tsx   manda los cuatro campos; sin nombre no envía
```

**Decisión de estructura**: lo que nombra la identidad de un merchant vive en
`apps/console/src/features/merchants`, que es lo que la configuración versionada copia. Lo único que
va a `packages/core` pasa la prueba del principio V y no nombra dominio. `identity.ts` de `api/`
cambia de sonda a llamada en su lugar: es lo único que toca el contrato para saber quién es.

## El orden

**Cuatro tramos, y cada uno termina en algo que se puede correr.**

| | qué | punto de control |
|---|---|---|
| **1** | **Las muletas se van**: `contract:sync` sobre la 041, el sincronizador sin emisor y con su prueba, `fetchOperator` con su prueba, `client.ts` con `updateMerchantProfile` y los tipos, `OW-5` y `OW-7` enmendadas, `estado.md` y `CLAUDE.md` sin muletas | `npm test` en verde; `conformity` con `contracts/ope/` copiada; contra el backend real la barra dice «Operador de desarrollo»; el sincronizador falla sin `generated/contract/` |
| **2** | **La identidad se ve**: `displayNameOf`, la columna de nombre en la grilla (la de orígenes se va), la sección de identidad y el título por nombre en la ficha, los textos | Contra el backend: «Tienda de desarrollo» en la grilla y en la ficha con su URL como enlace; un merchant sin nombre muestra el identificador; las pruebas de grilla y ficha en verde |
| **3** | **La identidad se escribe**: `format: email` en la capa 1, `data/identity.ts`, la acción, `IdentityFields`, la pantalla de edición con su flujo y sus desenlaces, el alta con la sección | Contra el backend: alta con contacto; editar, vaciar la URL, `422` en el nombre y en la URL, contacto a medias sin ir al servidor; sin `merchants:write` no hay «editar»; la prueba de avisos y telemetría sin contacto |
| **4** | **El cierre**: `quickstart.md` con lo corrido, `estado.md` «lo que sigue», `npm test`, `npm run revisar`, `npm run build` | Los seis escenarios a mano; todo en verde |

**El 1 va primero** porque los otros compilan contra el contrato copiado y porque las muletas son lo
que `estado.md` pedía sacar primero. **El 2 antes que el 3** porque la edición precarga lo que la
ficha ya muestra, y conviene ver la lectura antes de la escritura. **El 4 va último**: los
documentos describen lo que quedó.

**Cada tramo es un commit** (o pocos), en castellano y convencional, y **ninguno se commitea con
`npm test` en rojo**.

## Complejidad y riesgos aceptados

**`required` que depende de los valores.** Es la única capa 1 condicional del panel hasta hoy. Se
resuelve pasándole a `useForm` restricciones calculadas por render; si `useForm` las captura una
sola vez, el tramo 3 lo descubre y la alternativa es validar el contacto a medias en `submit`, con
la misma marca en el campo.

**Un ancla dentro de `Value`.** Granito no tiene enlace. Si al mirarlo no compone —color, foco,
subrayado—, es una propuesta a granito con el caso, no un estilo nuestro.

**Siete campos y un `TextArea` en el alta.** El formulario crece; si al mirarlo las credenciales
quedan muy abajo, la identidad podría ir después de los orígenes. Se decide mirando, en el tramo 3.
