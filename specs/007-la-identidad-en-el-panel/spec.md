# Especificación · La identidad en el panel

**Carpeta**: `007-la-identidad-en-el-panel` · **Estado**: construida · **Fecha**: 2026-10-09

**Pedido**: "Lo que las features 040 y 041 de OPE-Backend le dan al panel, tomado entero. Decisión
del dueño, 2026-10-09, después de unir las dos: (1) se sacan las tres muletas de la 040 —la sonda de
identidad pasa a `getOperator` y la barra dice el nombre del operador; el sincronizador deja de emitir
y sólo copia `generated/contract/`—; (2) el merchant se reconoce por su nombre: la grilla lo lista y
la ficha lo encabeza por `displayName`, muestra la URL de la tienda, la persona de contacto y las
notas, el alta pide el nombre y admite el resto, y la identidad se edita entera desde la ficha con
`updateMerchantProfile`; (3) lo que la 040 arregló se ve: todo aviso de error cita su identificador
de pedido y los `422` de invariante caen en su campo. Los idiomas siguen en la configuración."

<!--
  Las decisiones se citan por identificador: `CU-n` heredadas de cuarzo, `OW-n` de OPE-Web, `GR-n` de
  granito y `ADR-nnn` del backend de OPE.
-->

## Qué resuelve *(obligatoria)*

La consola distingue un merchant de otro por su identificador acuñado y por su primer origen, que es
técnico, puede ser uno de veinte y puede ser `localhost`; con tres merchants se los recuerda, con diez
no. Y no tiene dónde mostrar nada de la relación comercial —con quién se habla, en qué etapa está—,
que el backend ya guarda desde la 041.

Además, la consola sigue viviendo con tres muletas que se escribieron para sacar cuando el backend
publicara la 040, y la 040 está publicada: la barra dice `operator` para todo el mundo porque la
identidad es una sonda, y el sincronizador emite por su cuenta lo que el backend ya emite.

El problema es que **un operador no reconoce a quién está operando** —ni al merchant en la grilla ni
a sí mismo en la barra—, y que **el panel carga código con fecha de vencimiento cumplida**.

## Quién la consume *(obligatoria)*

- **El operador de OPE**, desde OPE-Console: lista merchants por nombre, abre la ficha completa, da de
  alta con nombre y edita la identidad; y ve su propio nombre en la barra.
- **La feature siguiente del panel** (configuración versionada): copia de acá la forma de una pantalla
  de edición de un recurso existente, que la 006 no tenía (sus pantallas eran de alta y de acción).
- **El sincronizador y quien lo corre**: `contract:sync` queda en lo que su nombre dice —copiar— y
  deja de ser un emisor interino con dos rutas.
- **El portal del merchant** (`apps/portal`), más adelante: el contacto y la URL de la tienda son lo
  que el merchant verá de sí mismo; la ficha de la consola fija la forma.

## Qué NO hace *(obligatoria)*

- **No busca ni filtra por nombre.** `listMerchants` no filtra en el contrato; la grilla sigue sin
  barra de filtros (`CU-14`), y el nombre es una columna más. Un filtro en el navegador sobre un tramo
  mentiría, como ya se decidió para los orígenes.
- **No decide qué es un dato personal.** Lo decidió el backend (constitución VII 1.5.1, `ADR-045`): la
  persona de contacto es una persona identificada de la relación comercial. La consola la muestra a
  quien el backend se la sirve —el consumidor `admin`— y no la manda a ningún otro lado: ni a la
  telemetría, ni a un aviso, ni a la dirección.
- **No valida más que lo que el contrato dice.** Largos, `required`, el formato del email y el prefijo
  de la URL salen de las restricciones emitidas (`CU-38`, capa 1); lo que el esquema no dice —espacios
  en los bordes, una URL que sólo parece una— lo dice el backend con `422 invalid-merchant-profile`
  y cae en el campo. La consola no recorta ni normaliza nada.
- **No edita orígenes, estado ni credenciales desde la identidad.** La operación del backend reemplaza
  los cuatro campos y nada más; cada otra cosa tiene su pantalla o su diálogo de la 006.
- **No toca los idiomas.** Viven en la configuración del merchant, que es la feature siguiente.
- **No agrega capacidades.** Editar la identidad exige `merchants:write`, la misma del alta; el
  módulo del contrato lo dice y la consola lo lee (`CU-3`).
- **No decide nada visual.** Cómo se muestra una URL que se abre, un contacto con cuatro datos o un
  nombre junto a un identificador es composición de `Field`, `Value` y `Link` de granito; lo que falte
  es propuesta (principio IV).
- **No toca el backend.** Lo que esta feature necesita ya está en `generated/contract/` del commit
  que `contracts/ope/README.md` nombre después de sincronizar.

## De qué decisiones depende *(obligatoria)*

| decisión | qué aporta |
|---|---|
| `OW-5` | El contrato llega como artefacto. **Se enmienda**: el módulo de capacidades y las restricciones los publica el backend en `generated/contract/`; el sincronizador copia, y el emisor interino se retira |
| `OW-7` | El operador se identifica por `operatorId` y el nombre es opcional. **Se enmienda**: la sonda se reemplaza por `getOperator`; los claims traen `name: displayName ?? operatorId` y `scope` de verdad |
| `OW-3` | Problem Details: `422` con `errors[].pointer` al campo; `requestId` en el aviso, que el núcleo ya lee y hoy muestra como ausente |
| `CU-3`, `CU-37` | Lo que un permiso no habilita no se muestra: «editar» y «nuevo» exigen `merchants:write`; lo que exige cada operación sale del módulo del contrato |
| `CU-38` | Las tres capas de validación: la capa 1 de `MerchantCreate`, `MerchantProfileInput` y `MerchantContact` sale emitida; la capa 3 es el `422` del backend en su campo |
| `CU-24`, `CU-25`, `CU-49` | Los cuatro estados de la ficha; una acción declara qué invalida (la edición invalida la ficha y las listas); un rechazo que la pantalla no puede mostrar no se pierde |
| `CU-47`, `CU-41` | El flujo: la edición es una pantalla a la que se llega desde la ficha y que vuelve a ella; el parámetro de la ruta es tipado |
| `CU-43` | Los textos viven con la funcionalidad; los rótulos son las claves del contrato |
| `GR-30`, `GR-37`, `GR-70` | La ficha es un formulario de sólo lectura; una operación con campos y un error de negocio que explicar es pantalla, no diálogo: la edición de la identidad es pantalla |
| `GR-38`, `GR-27` | Las acciones al pie del formulario; la más grave última: «editar identidad» va antes de apagar y desactivar |
| `GR-31`, `GR-32` | Un formato se define una vez: la URL se muestra como enlace con el mismo componente en grilla y ficha |
| `ADR-044` del backend | `getOperator` (`operatorId`, `displayName?`, `scope`), `X-Request-Id` y `requestId`, `errors[]` bajo `/body`, `generated/contract/` |
| `ADR-045` del backend | Los cuatro campos de la identidad, `updateMerchantProfile` como reemplazo entero, `invalid-merchant-profile`, el contacto como persona identificada servida sólo a `admin` |

**Abiertas que la bloquean**: ninguna. `CU-18`, `CU-19`, `CU-21` y `CU-28` siguen abiertas y no tocan
esta feature.

**Dependencias con otro repositorio**: ninguna pendiente. Las features 040 (`5d9fadf`) y 041 de
OPE-Backend están unidas en su `main`; `npm run contract:sync` las trae.

## Escenarios *(obligatoria)*

1. **El operador entra** → la barra dice su nombre (`displayName`) o, si no tiene, su identificador, y
   cuántos merchants alcanza («Todos los merchants» o «N merchants»), con una sola llamada a
   `getOperator`. Una credencial desconocida sigue siendo un rechazo al entrar, igual que hoy.

2. **El operador mira la grilla** → la primera columna es el nombre del merchant; el identificador va
   debajo o al lado, en tipografía de código, porque sigue siendo lo que las rutas y el registro usan.
   Un merchant sin nombre (creado antes de la 041 y nunca editado) muestra su identificador en el lugar
   del nombre, sin inventar nada. Los orígenes dejan de ser lo que identifica y pasan a una columna
   secundaria o a la ficha.

3. **El operador abre la ficha** → el encabezado dice el nombre; la primera sección muestra la
   identidad: nombre, URL de la tienda como enlace que abre en otra pestaña, contacto (nombre, email,
   teléfono, rol: cada uno en su campo, los ausentes sin dibujar) y notas. Lo operativo —identificador,
   estado, orígenes, alta, credenciales, registro— sigue como en la 006, debajo. Al pie, «editar
   identidad» exige `merchants:write` y es una salida más (`CU-47`), antes de apagar y desactivar.

4. **El operador da de alta un merchant** → el formulario de la 006 gana una sección de identidad
   antes de los orígenes: nombre (obligatorio), URL de la tienda, contacto (nombre y email obligatorios
   si se carga alguno; teléfono y rol opcionales) y notas. Lo demás no cambia: las credenciales se
   muestran una vez y «continuar» lleva a la ficha, que ya muestra el nombre.

5. **El operador edita la identidad** → desde la ficha entra a una pantalla (`GR-37`) con los cuatro
   campos precargados con lo que hay; guardar manda la identidad entera (lo que se vacía se borra, y la
   pantalla lo dice) y vuelve a la ficha, que ya muestra lo nuevo; cancelar vuelve sin cambiar nada.
   Un nombre con espacios en los bordes o una URL que sólo parece una (`422 invalid-merchant-profile`)
   cae en su campo con el texto del servidor. Un merchant desactivado también se edita: la relación
   comercial no depende del estado.

6. **El operador vacía el contacto** → en la edición, dejar en blanco nombre y email del contacto lo
   quita; dejar uno solo es un error de capa 1 en el otro («si hay contacto, nombre y email van»), no
   un viaje al servidor.

7. **Un operador sin `merchants:write`** (sesión falsa con menos) → ve la identidad en la ficha y no ve
   «editar identidad» ni «nuevo»; lo que exige cada botón sale del módulo del contrato.

8. **Un operador fuera del alcance** → `403 merchant-out-of-scope` al editar un merchant que no es
   suyo: la ficha ya no se le mostró (`403` en la lectura), así que sólo pasa con un enlace pegado; el
   aviso lo dice como ya lo hace la 006.

9. **Todo aviso de error** → cita el identificador de pedido que el backend manda en `requestId`; «sin
   identificador» sólo aparece si el backend no lo mandó, y desde la 040 no pasa.

10. **El sincronizador** → `npm run contract:sync` copia `generated/contract/` del backend y escribe su
    README; si el backend no la tiene (un clon viejo, una carpeta de release sin ella), falla diciendo
    que hay que correr `npm run contract:types` allá. Ya no emite nada.

## Lo que puede salir mal *(obligatoria)*

- **El backend responde `getOperator` y la consola esperaba la sonda** → no puede pasar: la sonda se
  retira y `identify` es la llamada. Un `401` sigue siendo «la credencial no sirve para entrar».
- **Un merchant sin nombre en la grilla** → se muestra por su identificador, en el lugar del nombre y
  con la misma tipografía de código; no se muestra vacío ni con un texto inventado. Es el estado de
  todo merchant creado antes de la 041 hasta que alguien lo edite.
- **La URL de la tienda no abre** (el merchant la escribió mal y el backend la aceptó porque parsea)
  → es un enlace como cualquiera; la consola no la verifica ni la corrige. Si se quiere arreglar, se
  edita.
- **El operador guarda la edición con un campo vacío creyendo que lo deja igual** → la pantalla dice
  que guarda la identidad entera y que lo vacío se borra; la precarga muestra lo que hay para que
  nada se borre sin verse.
- **`422 invalid-merchant-profile` con un puntero que la pantalla no mapea a un campo**
  (`/body/contact/email` cuando el campo se llama `contact.email`) → la correspondencia entre puntero
  y campo es de la pantalla, declarada en un solo lugar; un puntero sin campo cae al pie del formulario
  con el texto del servidor (`CU-49`), nunca se pierde.
- **Dos operadores editan la identidad a la vez** → gana el último; no hay testigo de concurrencia
  (`TAN-10` como referencia, feature posterior) y la consola no lo finge.
- **El contacto termina en la telemetría o en un aviso** → la telemetría (`CU-35`) registra acciones y
  fallos, nunca cuerpos; el aviso de la edición dice «la identidad se guardó» y el nombre del merchant,
  no el contacto. Lo verifica una prueba.
- **El sincronizador corre contra un backend sin `generated/contract/`** → falla con el comando que hay
  que correr allá; no vuelve a emitir por su cuenta.
- **`403` a algo que la pantalla ofreció** → defecto del panel, aviso honesto, rastro en el registro
  (`OW-3`).

## Cómo se verifica *(obligatoria)*

| garantía | qué sostiene |
|---|---|
| **Se genera** | Los tipos de `Merchant`, `MerchantCreate`, `MerchantProfileInput`, `MerchantContact` y `Operator`, la capacidad de `updateMerchantProfile` y las restricciones de los tres esquemas de cuerpo: todo sale de `generated/contract/` copiada tal cual |
| **No compila** | Una acción que nombre `updateMerchantProfile` con un cuerpo que no es `MerchantProfileInput`; un campo de la ficha que lea una propiedad que `Merchant` no tiene; un desenlace que ninguna pantalla emite; `identify` que devuelva claims sin `operatorId` |
| **Se hereda** | La forma de una pantalla de edición de un recurso existente (precarga, reemplazo entero, vuelta a la ficha): la configuración versionada la copia |
| **Lo agarra una prueba** | Con la sesión falsa y respuestas simuladas: la barra muestra `displayName` y, sin él, `operatorId`; la grilla muestra el nombre y el identificador cuando no hay nombre; la ficha dibuja la identidad y no dibuja los campos ausentes; el alta manda los cuatro campos; la edición precarga, reemplaza y vuelve; `422 invalid-merchant-profile` con `/body/storeUrl` cae en el campo de la URL y con `/body/contact/email` en el del email; vaciar el contacto lo quita; un contacto a medias es error de capa 1; «editar» desaparece sin `merchants:write`; la telemetría no ve el contacto; `ope-check conformity` pasa con `contracts/ope/` copiada y el sincronizador sin emisor; `contract-sync` sin `generated/contract/` falla con el mensaje |
| **Lo mira una persona** | Contra el backend real (`npm run dev` en los dos): entrar y ver el nombre del operador de desarrollo; la grilla con «Tienda de desarrollo»; un alta con contacto; editar y ver la ficha; vaciar la URL y verla desaparecer; que el aviso de un `403` cite su identificador de pedido |

**Cada comprobación nueva se rompe a propósito antes de creerle.**

## Biblioteca o esqueleto

Todo lo de merchants vive en `apps/console/src/features/merchants`: qué es la identidad de un merchant
es negocio (principio III). `identify` ya vive en `api/ope/identity.ts` y cambia de sonda a llamada
ahí. `scripts/contract-sync.mjs` pierde dos funciones y gana una falla. Si al construir aparece algo
que las dos aplicaciones necesitan igual —un campo de enlace que abre en otra pestaña, un formulario
de edición con precarga— **se decide en el plan** si va a `packages/core`, con la prueba de siempre:
¿si lo arreglo, tiene que llegarle al portal?

## Supuestos

- **La edición es pantalla y no diálogo** (`GR-37`): cuatro campos, uno de ellos un objeto, y un
  `422` que explicar en su campo.
- **La edición manda la identidad entera**, como el backend la define (`ADR-045`): un campo vacío se
  borra. La pantalla lo dice en su sección y precarga todo para que se vea.
- **El contacto se carga en cuatro campos planos** (`contact.name`, `contact.email`,
  `contact.phone`, `contact.role`) y se arma como objeto al enviar; las restricciones de
  `MerchantContact` se leen de la capa 1 emitida por su nombre (`CONSTRAINTS.MerchantContact`), no
  de `fields.contact`, que sólo dice `{ type: 'object', ref }`.
- **El nombre encabeza la ficha y la grilla; el identificador no desaparece**: es lo que el registro,
  las rutas y `curl` nombran, y un operador lo necesita a la vista.
- **La URL se muestra como enlace que abre en otra pestaña**, sin verificar que responda.
- **Las notas se muestran como texto plano** en un campo de varios renglones; no son Markdown.
- **Las tres muletas se sacan en esta feature y no en una aparte**: son tres sustituciones de una
  llamada cada una, y dejarlas sería cargar código con fecha vencida (`estado.md` lo pedía así).
- **`OW-5` y `OW-7` se enmiendan con fecha**, no se reescriben: la decisión original sigue siendo
  verdad y sólo cambia quién emite y de dónde salen los claims.

## Lo que queda abierto

- **Si la grilla muestra orígenes o URL de la tienda** como columna secundaria: lo decide el plan
  mirando el ancho; la ficha muestra las dos.
- **Una propuesta a granito**, si al componer la ficha hace falta: un campo «nombre + identificador»
  (valor principal con uno secundario en tipografía de código). Se compone mientras tanto; no bloquea.
