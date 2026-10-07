# Especificación · La base de OPE

**Carpeta**: `005-la-base-de-ope` · **Estado**: borrador · **Fecha**: 2026-10-07

**Pedido**: "Cuarzo adaptado al backend de OPE, en un monorepo con dos aplicaciones. Decisión del dueño,
2026-10-07, tras evaluar tres formas de usar cuarzo: como biblioteca con puertos para dos backends, como
copia adaptada, o un híbrido. Se eligió la copia: este repositorio nace de cuarzo en su commit `9bd4009`
(2026-08-31) y granito sigue siendo biblioteca compartida. Cuarzo y granito son del mismo dueño que OPE."

<!--
  Esta especificación sigue la plantilla heredada de cuarzo, que es la que gobierna este repositorio
  hasta que la feature la enmiende. Las decisiones se citan por identificador: `CU-n` son las heredadas de
  cuarzo, `GR-n` las de granito, `ADR-nnn` las del backend de OPE y `TAN-n` las de la plataforma Tandilia,
  que acá valen sólo como referencia de origen.
-->

## Qué resuelve *(obligatoria)*

OPE necesita un panel de administración y, después, un portal del merchant, y no tiene ninguna base de
frontend: ni la forma de una aplicación, ni la sesión, ni los cuatro estados, ni las comprobaciones que
impiden que cada pantalla se escriba distinto. Cuarzo tiene todo eso construido y verificado, pero habla
el contrato de otro backend —sobre `{ data, meta }`, errores con `code` y `fields`, paginación por número,
roles de un proveedor de identidad— y está atado a las convenciones de una plataforma ajena.

El problema es doble: **heredar la conducta de cuarzo sin heredar el contrato de las-animas**, y hacerlo
sin obligar a Tandilia a generalizar cuarzo para un segundo backend que no es suyo.

## Quién la consume *(obligatoria)*

- **El panel de administración de OPE** (`apps/admin`), que es la primera aplicación y la feature que
  sigue a ésta. Recibe una base que ya levanta contra el backend real de OPE y le agrega pantallas.
- **El portal del merchant**, más adelante, como segunda aplicación del mismo monorepo (`apps/portal`).
  Recibe lo mismo y ejerce la segunda implementación de la sesión.
- **Un agente que arranca en frío** en este repositorio, que se entera de qué heredó, qué cambió y por
  qué, por el `CLAUDE.md`, la constitución enmendada y el documento de origen; y que verifica sus citas a
  decisiones con la comprobación que viaja en los paquetes.
- **El backend de OPE**, indirectamente: su feature 040 —identificador de pedido, `getOperator` y el
  módulo de capacidades— existe porque esta base la consume.

## Qué NO hace *(obligatoria)*

- **No construye pantallas del panel.** El alcance del panel lo decide el dueño en la feature siguiente;
  acá queda el hola mundo adaptado a una colección real de OPE, que se borra cuando existan pantallas
  propias.
- **No construye el portal del merchant** ni decide su sesión (`portalSession` sigue `PROPUESTO` en el
  backend, ADR-020).
- **No incorpora OIDC.** La puerta queda lista para recibirlo; el adaptador real no se escribe hasta que
  haya una segunda aplicación o se necesite SSO.
- **No agrega testigo de concurrencia ni clave de idempotencia.** OPE no los tiene; las rutas de cuarzo
  que los sirven quedan dormidas, no se borran, y el testigo se evalúa como feature del backend.
- **No decide nada visual.** Colores, tipografía, componentes y cómo se ve un dato son de granito
  (principio IV heredado); lo que falte es una propuesta a granito.
- **No modifica cuarzo ni granito en Tandilia.** Lo que cambia, cambia acá; cuarzo queda como origen al
  que se le pueden traer arreglos a mano.
- **No publica paquetes en npm.** `@ope/core` y `@ope/session` son workspaces del monorepo. Publicar
  granito se prepara aparte.
- **No sabe de negocio.** Qué es un merchant, un experimento o un texto base es de cada aplicación; la
  base sabe de sesión, pantallas, flujos, acciones, estados y errores.

## De qué decisiones depende *(obligatoria)*

| decisión | qué aporta |
|---|---|
| `CU-20`, `CU-40`, `CU-42` | Cuarzo es la aplicación base que se copia; la forma se copia y la conducta se publica; el manifiesto es por donde una aplicación empieza. Acá «publicar» pasa a ser «compartir por workspace» |
| `CU-10` | La autenticación entra por una puerta que no entrega tokens. Se enmienda: la puerta deja de suponer OIDC en su configuración |
| `CU-14`, `CU-24`, `CU-25` | Cómo se piden los datos, los cuatro estados y las acciones. Se enmiendan en lo que nombra el sobre, `error.code` y `fields` |
| `CU-37`, `CU-34` | Una acción declara sus operaciones y de ahí sale lo que exige. Se enmienda: capacidades en vez de roles, y la clave de idempotencia no aplica a OPE |
| `CU-41`, `CU-47` | El ruteador, la navegación tipada y la pila de flujo. Se conservan; la paginación en la URL cambia de página a cursor |
| `CU-15`, `CU-16`, `CU-36` | Estructura por funcionalidad, Biome, y la raíz de composición. Se conservan; la estructura gana `apps/` |
| `CU-7` | Granito desde npm. Se conserva, con `file:` mientras no esté publicado |
| `ADR-020` del backend | Consumidor `admin`, `adminToken` bearer, `merchantId` sólo en ruta bajo `admin`, cursor y `limit`, Problem Details |
| `ADR-031` del backend | Operadores con alcance, tokens por operador emitidos fuera de banda, auditoría |
| `GR-17` | Dos maneras de recorrer una grilla; la continua lleva botón (`LoadMore`) |
| `TAN-7` | Cómo se declaran y consumen las capacidades: el backend emite el módulo, el frontend publica su forma. Vale como referencia de origen |

**Abiertas que la bloquean**: ninguna. `CU-18`, `CU-19`, `CU-21` y `CU-28` siguen abiertas y no tocan
esta feature.

**Dependencias con otro repositorio**: la feature 040 del backend de OPE —`X-Request-Id` en toda
respuesta y `requestId` en Problem Details, `getOperator`, y el módulo de capacidades emitido por
`contract:types`—. Esta base puede levantar sin ella (el identificador queda ausente y se dice, y el alcance
no se esconde), pero no se cierra sin ella.

## Escenarios *(obligatoria)*

1. **Un agente clona el monorepo y arranca en frío** → lee `CLAUDE.md`, la constitución y el documento
   de origen, y sabe qué heredó de cuarzo tal cual, qué se enmendó y qué se retiró, sin abrir el
   repositorio de Tandilia. Las citas `CU-n` de su código resuelven contra las decisiones que viajan en
   `@ope/core`.

2. **Se levanta `apps/admin` contra el backend real de OPE** (`npm run dev` del backend, con el operador
   de desarrollo) → la aplicación arranca, pide el token en su pantalla de ingreso, y con un token válido
   dibuja el marco con el operador identificado por su `operatorId` en la barra de usuario; con un token
   que el backend no reconoce (`401 operator-unknown`) vuelve al ingreso diciendo por qué.

3. **Se levanta `apps/admin` sin backend** → la sesión falsa entra con las capacidades del consumidor
   `admin` y la aplicación se dibuja entera; la falsa no está en el artefacto de producción.

4. **El hola mundo lista una colección real de OPE** (`listMerchants`) → cargando, con datos, vacío y
   error, con el cursor en la URL: «cargar más» trae la página siguiente, un enlace con cursor se comparte
   y reproduce la misma página, y el error muestra el identificador de pedido cuando el backend lo manda.

5. **Una acción invoca una operación que exige una capacidad que la sesión no trae** → el botón no se
   dibuja; lo que exige sale del módulo que emite el backend y no de nada escrito a mano en el frontend.

6. **El backend responde `403` a algo que la pantalla ofreció** → el operador ve un aviso honesto y queda
   rastro en el registro: es un defecto del panel, no del operador. Con `merchant-out-of-scope` se dice
   que el merchant no está en su alcance.

7. **El backend rechaza una publicación con `422` o `409`** → el aviso lleva el `detail` del servidor,
   con tono de rechazo y sin identificador de pedido; si vienen `errors[]`, cada `pointer` va al campo
   del formulario que lo pidió.

8. **Se agrega la segunda aplicación** (`apps/portal`) → copia la aplicación modelo dentro del monorepo,
   declara su manifiesto y elige su adaptador de sesión; el núcleo no cambia.

9. **Se le rompe algo a propósito a cada comprobación heredada** → límites de importación, decisiones,
   artefacto y calidad fallan y dicen qué; ninguna aprueba en silencio porque no encontró qué mirar.

## Lo que puede salir mal *(obligatoria)*

- **El backend no manda identificador de pedido** (feature 040 sin desplegar) → el error se muestra
  igual, con «sin identificador» visible, nunca inventado.
- **El token vence o se rota del lado del backend** → el primer `401` termina la sesión y vuelve al
  ingreso; lo tecleado en un formulario se pierde y se avisa antes, porque no hay reingreso silencioso
  con un token opaco.
- **El módulo de capacidades y el contrato se despegan** (el backend publicó un contrato nuevo y el panel
  usa un módulo viejo) → la comprobación de conformidad falla por la identidad del contrato; en producción,
  ante la duda, se muestra (`TAN-7`: ocultar de más es el error silencioso).
- **Granito no está al lado** (`file:` sin la carpeta hermana) → la instalación falla diciendo cuál falta;
  no se finge que pasó.
- **Una URL con un cursor viejo** → el backend responde la primera página o un `400` según el caso; la
  grilla no se queda vacía sin salida.
- **El operador recarga** → el token vivía en memoria, así que vuelve al ingreso. Es el costo del
  adaptador bearer y se escribe para que no se tome por defecto.
- **La copia hereda prosa que habla de `las-animas`** → el documento de origen y las enmiendas nombran
  cada decisión que cambió; una comprobación falla si una cita `CU-n` no resuelve, pero **no** si la prosa
  describe otro backend: eso lo mira una persona.

## Cómo se verifica *(obligatoria)*

| garantía | qué sostiene |
|---|---|
| **Se genera** | Los tipos del contrato de OPE y el módulo de capacidades: nadie los escribe; salen del bundle del backend |
| **No compila** | El manifiesto tipado, la navegación tipada, una operación con capacidad fuera del vocabulario del módulo, una acción sin operaciones |
| **Se hereda** | La forma de una aplicación: `apps/admin` es el modelo que copia `apps/portal` |
| **Lo agarra una prueba** | `ope-check` renombrado sobre el monorepo (límites, decisiones, artefacto, calidad, empaquetado de workspaces); las pruebas del núcleo adaptadas al sobre pelado, a Problem Details y al cursor; el arranque contra la sesión falsa; que la constitución y las decisiones que viajan sean las enmendadas |
| **Lo mira una persona** | Que la aplicación levante contra el backend real y muestre los cuatro estados con cursor; que la prosa heredada ya no describa `las-animas` donde cambió; que la pantalla de ingreso diga lo que tiene que decir |

**Cada comprobación nueva o adaptada se rompe a propósito antes de creerle** (lección heredada: tres
comprobaciones de cuarzo aprobaron en verde sin mirar).

## Biblioteca o esqueleto

Dentro del monorepo la prueba cambia de forma pero no de fondo: **¿si arreglo esto, tiene que llegarles a
las dos aplicaciones?** Sí → `packages/` (sesión, núcleo, comprobaciones). No → `apps/<x>` (manifiesto,
pantallas, configuración de compilación). Lo que cuarzo publicaba a npm acá se comparte por workspace, y
un arreglo del núcleo les llega a las dos en el mismo commit.

## Supuestos

- El panel y el portal se escriben en castellano para el operador, como cuarzo; el código en inglés.
- El operador no tiene nombre ni iniciales en OPE (el token es opaco y el operador se identifica por
  `operatorId`); la barra de usuario muestra el identificador hasta que exista algo mejor.
- El token de desarrollo lo acuña `scripts/mint-admin-token.mjs` del backend y el operador lo pega; la
  configuración de la aplicación (`config.json`) **nunca** lleva un token (sería la puerta trasera que
  `CU-36` rechaza).
- Las cuatro especificaciones heredadas de cuarzo (`001` a `004`) se conservan como historia de la base y
  no se re-ejecutan.
- Los nombres de las dos aplicaciones son `admin` y `portal`, el vocabulario cerrado de piezas de
  Tandilia que OPE adopta para sus carpetas.

## Lo que se cerró con el dueño (2026-10-07)

Tres puntos quedaron abiertos al escribir la spec y se decidieron antes del plan:

- **Cómo llega el contrato de OPE al frontend: como artefacto generado y sincronizado.** El backend emite
  una carpeta `generated/contract/` para consumidores (bundle, tipos, módulo de capacidades, catálogo de
  problemas, identidad del contrato) y el frontend la copia a `contracts/ope/` con `npm run contract:sync`,
  desde la ruta hermana cuando está o desde un release del backend cuando no. La copia se versiona: CI y un
  clon arrancan sin el vecino, y `ope-check` compara la identidad del módulo con la del contrato para
  decir cuándo hay que sincronizar. Se descartaron la ruta hermana al vuelo (un clon sin vecino no
  verifica) y la dependencia git al backend (instala el repositorio entero por tres archivos).
- **El operador tiene nombre, y la constitución VII del backend se acota a las personas observadas.**
  «OPE observa comportamiento, no personas» protege al visitante y al comprador, que son totalmente
  anónimos; los operadores de OPE —y mañana la gente del merchant en el portal— son quienes operan,
  están identificados y auditados. El lint `ope-no-pii` sigue prohibiendo todo en los consumidores
  `public`, `sdk`, `platform` y `portal` y gana una excepción acotada, con nombre y razón, para el esquema
  del operador bajo `admin`. `OPE_ADMIN_OPERATORS` gana `displayName` opcional, `getOperator` lo devuelve
  con `operatorId` y `scope`, y la barra de usuario lo muestra; el registro de administración sigue
  indexado por `operatorId`. Todo entra en la feature 040 del backend. (El supuesto de arriba sobre la
  barra con `operatorId` queda como respaldo para un operador sin nombre.)
- **La telemetría del frontend no tiene destino todavía, y se dice.** El puerto heredado (`CU-35`) se
  conserva con la implementación de consola; el destino se decide cuando OPE elija su pila de
  observabilidad, backend incluido (`01 §11` define qué se observa, no con qué). Se descartó un endpoint
  en el backend para un dato que hoy nadie lee.

## Lo que queda abierto

- **El destino de la telemetría**, en los términos de arriba: abierto hasta que exista la pila de
  observabilidad de OPE.
