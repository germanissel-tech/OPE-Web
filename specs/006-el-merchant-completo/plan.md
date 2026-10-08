# Plan de implementación · El merchant completo

**Carpeta**: `006-el-merchant-completo` · **Rama**: `006-el-merchant-completo` · **Fecha**: 2026-10-08 ·
**Spec**: [`spec.md`](spec.md)

## Resumen

Darle a OPE-Console el ciclo de vida completo de un merchant: **el alta como pantalla** que muestra
las credenciales una sola vez, **la rotación** de las tres llaves como pantalla con gracia,
**el interruptor** y **la desactivación** como diálogos de confirmación con la consecuencia dicha, y
**el registro de administración** del merchant en su ficha. Todo en `features/merchants`, copiando
la forma que la 005 dejó: una acción declara sus operaciones, una pantalla declara qué decir en cada
estado, y el flujo decide a dónde lleva cada desenlace.

**Lo que la investigación cambió**, en cuatro puntos ([`research.md`](research.md)): el núcleo gana
dos piezas sin negocio que el portal va a necesitar igual —`ConfirmDialog` y `SecretOnce`— y una
opción —`onRejected`— que hoy no existe y sin la cual un `409` deja la ficha mintiendo (§3, §4, §6);
**el primer formulario del panel paga la deuda de `CU-38`**: las restricciones se emiten del bundle
en vez de escribirse a mano (§5); y el instante del registro se compone con fecha y hora en UTC
porque granito no tiene formato de instante (§7).

**Y lo que depende del backend**: nada bloquea. El `422 origin-already-registered` sin `errors[]`
cae al pie del formulario hasta la 040; las restricciones emitidas acá son una muleta más con la
misma fecha de vencimiento que las otras dos.

## Contexto técnico

| | | de dónde sale |
|---|---|---|
| **Lenguaje** | TypeScript `strict`, Node 24; prosa en castellano, código en inglés | constitución, `CU-15` |
| **Dónde** | `apps/console/src/features/merchants/` (pantallas, acciones, textos); `packages/core/src/ui/` (dos piezas de composición); `packages/core/src/data/` (una opción); `scripts/contract-sync.mjs` (el emisor de restricciones) | principios III y V |
| **Interfaz** | `@granito/ui` por `file:`: `Form`, `Section`, `Field`, `TextInput`, `NumberInput`, `Checkbox`, `Dialog`, `Alert`, `Badge`, `Table`, `Value`, `Button` | principio IV |
| **Datos** | `useAction` para las cuatro acciones; `useQuery` para la ficha; `useCollection` + `useTableQuery('log')` para el registro | `CU-14`, `CU-25`, `OW-4` |
| **Contrato** | `createMerchant`, `rotateIngestKey`, `rotatePlatformKey`, `rotatePlatformSecret`, `setKillSwitch`, `deactivateMerchant`, `listMerchantAdminLog`, `getMerchant`; tipos de `contracts/ope/api.d.ts`; capacidades del módulo | `OW-5` |
| **Errores** | `422` con `pointer` al renglón del origen o al campo de gracia; `409` como rechazo con `detail` + `onRejected` refresca; `403` como defecto nuestro | `OW-3` |
| **Secretos** | En estado del componente mientras está montado; nunca en dirección, almacenamiento, aviso ni telemetría | `OW-8` (nueva) |
| **Pruebas** | Vitest con Testing Library: las pantallas montadas en la aplicación real (`createApplication` + `ApplicationView`) contra un `OpeClient` de mentira; las acciones con `renderHook`; `ope-check` con `conformity` ampliada | spec «Cómo se verifica» |
| **Alcance** | Tres pantallas nuevas (alta, rotación; el registro es una sección), dos diálogos de confirmación, cuatro acciones (una existente cambia de contenedor), una colección | spec «Escenarios» |

Sin `NEEDS CLARIFICATION`: las dos decisiones del dueño (alcance; permisos como el backend) se
tomaron antes de la spec, y las diez incógnitas técnicas se midieron en la investigación.

## Control de constitución

Contra la constitución de OPE-Web, **versión 2.0.0** (enmendada 2026-10-08). Los seis principios,
también los que no cambian nada acá:

| principio | cómo lo cumple |
|---|---|
| **I** · La spec y el plan se acuerdan; la feature se implementa con autonomía | El alcance y el modelo de permisos se decidieron en el chat antes de escribir la spec; la spec se presentó con sus supuestos y el dueño dijo «continuá». Dentro de la feature, los tramos se implementan y commitean sin esperar OK por archivo |
| **II** · Lo que no está decidido se pregunta | Las dos decisiones que no se podían tomar solas se preguntaron. Lo que sigue abierto —la presentación del secreto en granito, el registro de la plataforma— **queda abierto** en la spec |
| **III** · `packages/` no sabe de negocio | `ConfirmDialog` recibe textos y un `onConfirm`; `SecretOnce` recibe `{ label, value }[]`; `onRejected` recibe un `RequestFailed`. Ninguno nombra merchant, llave ni interruptor, ni en comentarios. El emisor de restricciones lee el bundle de OPE y por eso vive en `scripts/`, no en `packages/` |
| **IV** · Lo visual es de granito | Las dos piezas nuevas **componen** `Dialog`, `Alert`, `Field`, `Value` y `Button` sin `className` ni estilo. Lo que falta —un «valor que se copia y se va»— es propuesta a granito en `OW-8`, como `OW-4` lo fue para el paginador |
| **V** · Paquete o aplicación, y la prueba es una sola | ¿Si arreglo la confirmación, tiene que llegarle al portal? Sí → `packages/core`. ¿Si arreglo el formulario de alta? No → `apps/console`. Declarado pieza por pieza en la estructura de abajo |
| **VI** · Se comparte la puerta, no el proveedor | No aplica: la sesión no cambia. Se declara para que conste que se miró |

### Qué garantía sostiene cada cosa

| | qué sostiene |
|---|---|
| **se genera** | `constraints.{js,d.ts}` (nuevo, del bundle), los tipos de los seis esquemas, `OPERATIONS` con lo que exige cada operación |
| **no compila** | `opeOperation('rotateIngestKeys', …)` (no existe); una acción sin operaciones; `useScreenParams(rotateScreen)` sin `kind`; un desenlace que el flujo no cablea (`verifyFlows` en el arranque) |
| **se hereda** | `new-merchant-screen` es la forma de un alta; `rotate-screen` la de una operación con resultado; `kill-switch-button` la de una acción con confirmación; `merchant-log` la de una colección en una ficha. La feature de configuración las copia |
| **lo agarra una prueba** | Las de la spec, una por escenario (abajo, en cada tramo); `conformity` con `CONSTRAINTS` contra el bundle; la de telemetría sin secretos; `ope-check` entero |
| **lo mira una persona** | Contra el backend real, con el `quickstart.md`: los ocho escenarios, el `422` de gracia con `700000`, el `409` desde dos pestañas, y que cada pantalla componga como granito manda |

**Dos comprobaciones nuevas se rompen a propósito antes de creerles**: `conformity` con un
`required` tocado en `constraints.js`, y la prueba de telemetría con un `console.log(value)`
plantado en `SecretOnce`.

## Estructura

```
ope/mvp/web/
├── scripts/contract-sync.mjs        gana emitConstraints(): components.schemas → constraints.{js,d.ts}
├── contracts/ope/
│   ├── constraints.js · constraints.d.ts   NUEVO · GENERATED, interino hasta la 040
│   └── README.md                    nombra el archivo nuevo
├── docs/
│   ├── ope.md                       OW-8 · Un secreto se muestra una sola vez, y en ningún otro lado
│   ├── decisiones.md                la fila de OW-8
│   ├── arquitectura.md              CU-38 gana «Enmienda OPE»: la capa 1 se emite del bundle, la 2 queda a mano con cita
│   ├── deuda.md                     §4 pasa a «Lo que se pagó»
│   └── origen.md                    CU-38 pasa de «heredada tal cual» a «enmendada»
├── packages/core/
│   ├── checks/conformity.mjs        CONSTRAINTS: cada clave es un esquema del bundle, required coincide
│   ├── src/base/strings.ts          copy, copied, copyFailed, confirm, cancel
│   ├── src/data/use-action.ts       ActionOptions.onRejected
│   ├── src/ui/use-form.ts           FieldConstraints: minItems, maxItems, items
│   ├── src/ui/confirm-dialog.tsx    NUEVO · Dialog yes-no con consecuencia, tono y confirmar apagado mientras corre
│   ├── src/ui/secret-once.tsx       NUEVO · Alert + Field/Value + Button copiar, por secreto
│   ├── src/index.ts                 exporta las dos piezas
│   └── tests/                       confirm-dialog, secret-once (copia y falla), use-action (onRejected), use-form (items)
└── apps/console/src/
    ├── api/ope/client.ts            rotateIngestKey, rotatePlatformKey, rotatePlatformSecret, setKillSwitch, listMerchantAdminLog; tipos CredentialIssued, KillSwitch, AdminEntry, AdminEntryPage, CredentialKind
    ├── app/flows.ts                 merchantsFlow: opens(merchantRequested → newMerchantScreen), finishes(merchantCreated → merchantScreen), opens(rotationRequested → rotateScreen), closes(rotationClosed)
    └── features/merchants/
        ├── feature.ts               screens + 4 desenlaces nuevos
        ├── strings.ts               textos de alta, rotación, interruptor, registro, confirmaciones
        ├── data/
        │   ├── create-merchant.ts   constraints del módulo emitido; isOrigin() con cita a invalid-origin; invalida el registro
        │   ├── rotate-credential.ts NUEVO · una acción, tres operaciones, elige por kind
        │   ├── set-kill-switch.ts   NUEVO
        │   ├── deactivate-merchant.ts  invalida además el registro
        │   ├── merchant-log.ts      NUEVO · useMerchantLog, clave [...oneMerchant, 'log']
        │   └── *.test.ts
        └── screens/
            ├── new-merchant-screen.tsx   NUEVO · /merchants/new · dos pasos
            ├── new-merchant-dialog.tsx   SE RETIRA
            ├── rotate-screen.tsx         NUEVO · /merchants/:merchantId/rotate/:kind · dos pasos
            ├── kill-switch-button.tsx    NUEVO · ConfirmDialog
            ├── deactivate-button.tsx     gana ConfirmDialog
            ├── merchant-log.tsx          NUEVO · la sección del registro
            ├── merchant-screen.tsx       rotar por credencial, interruptor, registro
            ├── merchants-screen.tsx      «Nuevo merchant» informa merchantRequested
            └── *.test.tsx
```

**Decisión de estructura**: lo que nombra un merchant vive en `apps/console/src/features/merchants`,
que es lo que la feature de configuración copia. Las tres cosas que van a `packages/core` pasan la
prueba del principio V una por una y no nombran dominio. El emisor va a `scripts/` porque lee el
bundle de OPE y `packages/` no lo conoce.

## El orden

**Cuatro tramos, y cada uno termina en algo que se puede correr.**

| | qué | punto de control |
|---|---|---|
| **1** | **El núcleo y la deuda**: `FieldConstraints` con `items`; `emitConstraints` + `constraints.{js,d.ts}` + `conformity`; `ConfirmDialog`, `SecretOnce`, `onRejected`, textos del marco; `deuda.md` §4 pagada, `CU-38` enmendada | `npm test` en verde; `conformity` **en rojo** con un `required` tocado; la prueba de `SecretOnce` pasa con portapapeles y sin él; `create-merchant.ts` ya no tiene restricciones a mano |
| **2** | **El alta como pantalla, y desactivar con confirmación**: `newMerchantScreen`, los desenlaces `merchantRequested`/`merchantCreated`, el flujo con `finishes`, `DeactivateButton` con `ConfirmDialog`; se retira el diálogo | Contra el backend real: crear un merchant, leer y copiar sus credenciales, «continuar» cae en la ficha, volver cae en la grilla; `422 invalid-origin` en el renglón; la prueba de telemetría sin secretos en verde |
| **3** | **Rotar y apagar**: `rotateCredential`, `rotateScreen`, `setKillSwitch`, `KillSwitchButton`, `onRejected` refrescando la ficha | Contra el backend: rotar con gracia `3600` muestra el valor y `previousExpiresAt`; `700000` da `422` en el campo; apagar pide confirmación y la grilla dice «apagado»; desde otra pestaña desactivar y apagar acá da `409` y la ficha se refresca |
| **4** | **El registro y los documentos**: `useMerchantLog`, la sección en la ficha con cursor en `log.c`; las cuatro acciones invalidan el registro; `estado.md` con la tercera muleta, `README.md` de `contracts/ope/`, `quickstart.md` con sus notas fechadas (`OW-8` ya está escrita con este plan, porque el plan la cita) | El registro lista lo que se acaba de hacer en los tramos 2 y 3, pagina y reproduce un enlace con `log.c`; `npm test` entero en verde |

**El 1 va primero** porque los otros tres usan sus piezas y porque la deuda se paga antes del
formulario, no después. **El 2 antes que el 3** porque la rotación reutiliza el paso de credenciales
del alta y conviene verlo funcionar en el caso simple. **El 4 va último**: el registro sirve para
verificar los otros dos a mano, y los documentos describen lo que quedó.

**Cada tramo es un commit** (o pocos), en castellano y convencional, y **ninguno se commitea con
`npm test` en rojo**.

## Dependencia con OPE-Backend: la feature 040

A lo que la 005 pidió se suma **una** cosa: `constraints.{js,d.ts}` en `generated/contract/`, con la
forma de [`contracts/constraints-artifact.md`](contracts/constraints-artifact.md). Y una ya pedida
pasa a tener a quién le duele: `errors[]` con `pointer` en `422 origin-already-registered`.

Hasta entonces, el emisor interino vive en `scripts/contract-sync.mjs` al lado del de capacidades,
con la misma cabecera, y `estado.md` lo lista como la tercera muleta.

## Complejidad y riesgos aceptados

**Dos pasos en una pantalla, sin ruta para el segundo.** Recargar en el paso de credenciales vuelve
al formulario vacío. Es el costo de no guardar el secreto en ningún lado, asumido en la spec y
escrito en `OW-8`; la salida es rotar.

**`SecretOnce` puede no componer bien.** Un `Value` con un token de 50 caracteres y un botón al lado
puede verse apretado en una columna. Si al mirarlo no se lee, **es una propuesta a granito** con el
caso concreto, no un estilo nuestro.

**Tres muletas con la misma fecha.** La sonda, el emisor de capacidades y ahora el de restricciones
vencen con la 040. Están en `estado.md` para que nadie las olvide; si la 040 se demora, nada deja de
funcionar.

**La hora del registro en UTC.** Un operador en Argentina lee `15:00` donde su reloj dice `12:00`.
Se dice en el encabezado; convertir a la zona local sin decirlo es peor para una auditoría. Si
molesta, es una preferencia del marco (`CU-27`), no de esta pantalla.

**El `kind` en la ruta.** Un enlace a `/merchants/x/rotate/banana` dibuja «no existe». Es el mismo
trato que un merchant fuera de alcance, y evita una pantalla por clase.

## Seguimiento de complejidad

Sin violaciones a la constitución que justificar.
