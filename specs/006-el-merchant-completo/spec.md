# Especificación · El merchant completo

**Carpeta**: `006-el-merchant-completo` · **Estado**: construida · **Fecha**: 2026-10-08

**Pedido**: "La primera feature del panel de OPE-Console: el ciclo de vida completo de un merchant.
El alta pasa de diálogo a pantalla y muestra las credenciales que el backend devuelve una sola vez;
se rotan las tres llaves; el interruptor de apagado se prende y se apaga; y se ve el registro de
administración del merchant. Decisión del dueño, 2026-10-08: se eligió este alcance sobre «sólo cerrar
merchants», «merchant más configuración» y «todo el panel». Y la consola **sigue al backend** en lo que
un operador puede: no inventa permisos que el backend no verifica."

<!--
  Las decisiones se citan por identificador: `CU-n` heredadas de cuarzo, `OW-n` de OPE-Web, `GR-n` de
  granito y `ADR-nnn` del backend de OPE.
-->

## Qué resuelve *(obligatoria)*

Hoy la consola lista merchants y los da de alta, y nada más. Y el alta está mal: es un diálogo que
**descarta las credenciales que el backend entrega una sola vez** —la llave del tag, la de la
plataforma y el secreto de firma—, así que un merchant recién creado no puede conectarse hasta que un
operador rote lo que nunca vio. Tampoco se puede rotar una llave perdida, ni apagar OPE para un merchant
sin un despliegue, ni saber quién hizo qué sobre él.

El problema es que **un operador no puede completar el ciclo de vida de un merchant desde la consola**:
crearlo y entregarle sus credenciales, reemplazarlas cuando se filtran, apagarlo cuando algo sale mal y
auditar lo que pasó.

## Quién la consume *(obligatoria)*

- **El operador de OPE**, desde OPE-Console: es la primera vez que la consola le sirve para algo que
  hoy hace con `curl` y el token de desarrollo.
- **El merchant, indirectamente**: recibe sus credenciales de un operador que las leyó en una pantalla
  hecha para eso, y no de un operador que las copió de la respuesta cruda del backend.
- **La feature siguiente del panel** (configuración versionada), que copia de acá la forma de una
  pantalla de alta, de una acción con confirmación y de una grilla de registro.
- **El portal del merchant** (`apps/portal`), más adelante: la pantalla que muestra un secreto una sola
  vez es la misma que el portal necesitará cuando el merchant rote su propia llave.
- **El backend de OPE**, indirectamente: su feature 040 trae lo que esta pantalla pide y hoy no llega
  (`errors[]` en `422 origin-already-registered`, identificador de pedido).

## Qué NO hace *(obligatoria)*

- **No construye configuración, experimentos, textos ni diagnósticos.** Son las features siguientes
  del panel, cada una con su spec.
- **No construye el registro de toda la plataforma** (`listAdminLog`). Es la misma grilla sin
  merchant; entra con la pantalla que tenga por sujeto a la plataforma y no a un merchant.
- **No inventa permisos.** El backend no tiene capacidades por operador: cualquier credencial válida
  puede todo sobre los merchants de su alcance (`ADR-031`, `OW-7`). La consola esconde lo que el módulo
  del contrato dice que una capacidad exige (`CU-3`), y las capacidades del operador son todas. Un
  conmutador de desarrollo que simula menos sirve para probar `CU-3`, no es un permiso.
- **No guarda ninguna credencial.** Lo que el backend devuelve una sola vez se muestra una sola vez: no
  va a la dirección, ni al almacenamiento del navegador, ni a la telemetría, ni a un registro. Recargar
  la pantalla lo pierde, y la pantalla lo dice antes.
- **No calcula la gracia máxima de una rotación.** La define la configuración de la plataforma del
  backend y la consola no la conoce; un `422 rotation-grace-too-long` lo dice en el campo.
- **No decide nada visual.** Cómo se muestra un secreto que no vuelve es una pregunta para granito
  (`GR-37` da el criterio de pantalla; no hay componente de «valor que se copia y se va»); mientras
  tanto se compone con `Value` y un botón, sin estilo propio (principio IV).
- **No toca el backend.** Lo que le falta al contrato para que esto quede completo se pide en la 040
  y se anota en `estado.md`.

## De qué decisiones depende *(obligatoria)*

| decisión | qué aporta |
|---|---|
| `GR-37`, `GR-70` | Qué es pantalla y qué es diálogo: una operación con consecuencias propias y con un error de negocio que explicar es pantalla; un sí/no es diálogo. El alta es pantalla y entra desde el botón de la grilla; la rotación también (tiene gracia, puede fallar por ella y devuelve un valor que hay que leer); el interruptor y la desactivación son diálogos de confirmación |
| `GR-65` | El confirmar de un diálogo se puede apagar y decir por qué: la confirmación del interruptor y de la desactivación |
| `GR-38`, `GR-27`, `GR-43` | Las acciones viven con el bloque sobre el que actúan; el pie del formulario; el aviso en línea para un rechazo |
| `GR-67`, `GR-68` | Un estado cerrado va como pastilla (`off` se suma a `active` y `deactivated`); un control no se dispara dos veces |
| `GR-17`, `OW-4` | La grilla del registro recorre por cursor con «cargar más» compuesto |
| `CU-3`, `CU-37`, `CU-46` | Lo que un permiso no habilita no se muestra; una acción declara sus operaciones y de ahí sale lo que exige; cuándo un botón se deshabilita y quién sabe la regla |
| `CU-24`, `CU-25`, `CU-49` | Los cuatro estados los dibuja el marco; una acción declara qué invalida; un rechazo que la pantalla no puede mostrar no se pierde |
| `CU-47`, `CU-41` | El flujo y la pila: el alta desemboca en la ficha, la rotación vuelve a ella, y la pantalla de credenciales es un desenlace y no un destino que se enlaza |
| `OW-3` | Problem Details: `422` con `errors[].pointer` a los campos, `409` como rechazo con el `detail` del servidor, `403` como defecto nuestro |
| `OW-7` | Las capacidades del operador son todas las del consumidor `admin`; el alcance es por merchant |
| `ADR-031` del backend | Las credenciales viajan una vez y nunca más; la desactivación es terminal; el registro de administración nombra operador, operación, merchant y resultado |
| `ADR-014`, `ADR-029` del backend | Qué protege cada llave (tag, plataforma, firma) y la gracia de una rotación: dos válidas a la vez, como máximo |
| `01 §14.2` | El interruptor de apagado: sin despliegue, efectivo en el pedido siguiente, el merchant sigue midiendo |

**Abiertas que la bloquean**: ninguna. `CU-18`, `CU-19`, `CU-21` y `CU-28` siguen abiertas y no tocan
esta feature. La presentación de un secreto de una sola vez es una propuesta a granito que **no bloquea**:
se compone mientras tanto.

**Dependencias con otro repositorio**: la feature 040 del backend. Hoy el `422 origin-already-registered`
llega sin `errors[]` (el aviso va en línea sin campo) y ninguna respuesta trae identificador de pedido.
Esta feature se construye sin la 040 y se cierra con lo que haya; lo que la 040 arregle, se ve solo.

## Escenarios *(obligatoria)*

1. **El operador da de alta un merchant** → desde «Nuevo merchant» en la grilla entra a una pantalla
   con el formulario de alta (`GR-70`): los orígenes, uno por renglón, y si la plataforma firma. Al
   guardar, el backend lo crea y **la misma pantalla pasa a mostrar las tres credenciales** (dos si no
   firma), cada una con su clase, su valor y «copiar», con un aviso que dice que **no vuelven a verse** y
   que una perdida se rota. «Continuar» lleva a la ficha del merchant nuevo. Un origen mal formado
   (`422 invalid-origin`) va al renglón que lo pidió; un origen ya registrado
   (`422 origin-already-registered`) va al renglón cuando el backend dice cuál, y al pie del formulario
   mientras no lo diga.

2. **El operador rota una llave** → desde la ficha, cada credencial tiene «rotar». Entra a una pantalla
   (`GR-37`: tiene consecuencia, tiene error de negocio, y devuelve algo que hay que leer) que dice qué
   llave es, qué deja de valer, y pide la gracia en segundos —cero por omisión, que revoca la anterior
   en el acto—. Al confirmar, la misma pantalla muestra **el valor nuevo una sola vez** y hasta cuándo
   vale el anterior, con «copiar» y el mismo aviso del alta. «Volver» lleva a la ficha, que ya muestra el
   nuevo `issuedAt`. Una gracia por encima del máximo de la plataforma (`422 rotation-grace-too-long`)
   va al campo. El secreto de firma se puede rotar aunque el merchant se haya creado sin firma: desde
   ese instante firma.

3. **El operador apaga OPE para un merchant** → desde la ficha, «apagar» abre un diálogo de
   confirmación (`GR-37`, `GR-65`) que dice la consecuencia: desde el pedido siguiente ninguna decisión
   se toma, el SDK sigue recibiendo respuestas válidas y la medición no se corta. Al confirmar, la ficha
   y la grilla muestran `off` como pastilla y el mismo lugar ofrece «encender». Encender confirma igual.

4. **El operador desactiva un merchant** → lo que hoy es un botón directo pasa a pedir confirmación
   con la consecuencia dicha: **no se puede volver atrás**, ninguna credencial resuelve, y los registros
   quedan. Después de confirmar, la ficha no ofrece rotar ni apagar: no hay nada que hacerle a un
   desactivado, y un botón que sólo puede responder `409` no se dibuja.

5. **El operador lee el registro del merchant** → en la ficha, una sección con la grilla del registro de
   administración (`listMerchantAdminLog`): instante, operador, operación, resultado y, si fue rechazada
   o denegada, el código del problema. Lo más nuevo primero, por cursor, con «cargar más». Con los
   cuatro estados; el vacío dice «todavía nadie hizo nada sobre este merchant».

6. **Un operador sin una capacidad** (sesión falsa con menos, o un módulo del contrato que exija otra
   cosa) → no ve «rotar» sin `credentials:rotate`, no ve el registro sin `log:read`, y no ve alta,
   interruptor ni desactivar sin `merchants:write`. Lo que exige cada botón sale del módulo del contrato,
   no de la pantalla.

7. **Dos operadores sobre el mismo merchant** → uno lo desactiva mientras el otro tiene la ficha
   abierta; el segundo apaga, y el backend responde `409 merchant-deactivated`. El aviso lleva el
   `detail` del servidor con tono de rechazo, y la ficha se vuelve a pedir: ahora dice «desactivado» y no
   ofrece nada.

8. **El flujo** (`CU-47`) → el alta y la rotación son pantallas que desembocan en la ficha; la pantalla
   de credenciales no tiene ruta propia que se pueda compartir, porque un enlace a un secreto que ya no
   está es un enlace a nada. Volver con el navegador desde las credenciales no las vuelve a pedir.

## Lo que puede salir mal *(obligatoria)*

- **El operador cierra la pestaña, recarga o navega con las credenciales a la vista** → se pierden, y
  es correcto: la pantalla lo advierte antes, y la salida es rotar. La consola no las guarda en ningún
  lado para «recuperarlas».
- **El backend crea el merchant y la respuesta no llega** (red, `503` después de escribir) → el merchant
  existe y sus credenciales no se vieron. El aviso de error lo dice y la grilla, al volver, lo lista; la
  salida es rotar. No se reintenta el alta: repetirla daría `422 origin-already-registered`.
- **`422 origin-already-registered` sin `errors[]`** (antes de la 040) → el rechazo va al pie del
  formulario con el `detail` del servidor y sin campo señalado; el operador tiene que encontrar cuál. Se
  anota en `estado.md` hasta que la 040 lo traiga.
- **Sin identificador de pedido** (antes de la 040) → todo aviso de error lo dice como ausente, nunca
  inventado.
- **La gracia máxima no se conoce** → la consola no la pone como tope del campo; el `422` la dice y va
  al campo. Un valor inventado en la consola se desincronizaría con la plataforma.
- **Copiar falla** (contexto sin portapapeles) → el valor sigue visible y seleccionable; el botón avisa
  que no copió, no finge que sí.
- **El secreto termina en algún registro** → la telemetría del frontend (`CU-35`) no recibe cuerpos de
  respuesta, y la pantalla de credenciales no emite nada con el valor. Lo verifica una prueba que
  intercepta la telemetría durante el alta y la rotación.
- **`403` a algo que la pantalla ofreció** → defecto del panel, aviso honesto, rastro en el registro
  (`OW-3`). Con `merchant-out-of-scope` se dice que el merchant no está en su alcance.
- **El operador apaga sin querer** → la confirmación existe para eso; y encender es un clic más, no una
  rotación.

## Cómo se verifica *(obligatoria)*

| garantía | qué sostiene |
|---|---|
| **Se genera** | Los tipos de `MerchantCreate`, `MerchantCreated`, `CredentialRotation`, `CredentialIssued`, `KillSwitch` y `AdminEntry`, y qué capacidad exige cada operación: salen del artefacto del contrato |
| **No compila** | Una acción que nombre una operación que no existe, una capacidad fuera del vocabulario del módulo, una pantalla con parámetro sin tipo, un desenlace que ninguna pantalla emite |
| **Se hereda** | La forma de pantalla de alta, acción con confirmación y grilla de registro: la feature siguiente las copia |
| **Lo agarra una prueba** | Con la sesión falsa y respuestas simuladas: el alta muestra las credenciales y las descarta al salir; `422` con `pointer` cae en el renglón; la rotación muestra el valor una vez; el interruptor pide confirmación y refleja `off`; el `409` se muestra con el `detail` y refresca la ficha; el registro dibuja los cuatro estados y pagina por cursor; cada botón desaparece sin su capacidad; la telemetría no ve ningún valor de credencial; `ope-check` sigue en verde (límites, decisiones, calidad) |
| **Lo mira una persona** | Contra el backend real: alta, rotación con gracia, apagar y encender, desactivar, y el registro listando lo que se acaba de hacer; que los textos digan la consecuencia de cada acción; que las pantallas compongan como granito manda |

**Cada comprobación nueva se rompe a propósito antes de creerle.**

## Biblioteca o esqueleto

Todo vive en `apps/console/src/features/merchants`: qué es un merchant, una llave o un interruptor es
negocio (principio III). Si al construir aparece algo que las dos aplicaciones necesitan igual —una
confirmación con consecuencia, un valor que se muestra una vez— **se decide en el plan** si va a
`packages/core`, con la prueba de siempre: ¿si lo arreglo, tiene que llegarle al portal?

## Supuestos

- **La rotación es pantalla y no diálogo.** Por `GR-37`: tiene gracia que elegir, un `422` que explicar
  y un valor que leer y copiar. Un diálogo que termina mostrando un secreto es un diálogo que necesitaba
  ser pantalla.
- **Las credenciales se muestran en la misma pantalla del alta**, como segundo paso, y no en una
  pantalla con ruta: no hay nada con qué volver a armarla.
- **Los orígenes se cargan uno por renglón**, hasta veinte (`maxItems` del contrato), y `signature`
  arranca en «no firma»: firmar exige que la plataforma sepa verificar, y eso no se supone.
- **La gracia se pide en segundos**, como en el contrato, y arranca en cero.
- **El registro muestra `operation` tal cual** (`setKillSwitch`, `importMerchants`): es el identificador
  del contrato o el nombre de una acción del sistema, y traducirlo pondría una tabla que se desincroniza
  con cada operación nueva.
- **El estado `off` se dice «apagado»** en la grilla y en la ficha, con tono de aviso; «desactivado»
  queda neutro.
- **La desactivación gana confirmación** aunque la 005 la dejó directa: es terminal, y una acción
  terminal sin confirmación fue una omisión del hola mundo, no una decisión.

## Lo que queda abierto

- **Una propuesta a granito**: la presentación de un valor que se muestra una sola vez (valor, copiar,
  advertencia). Se compone acá hasta que exista; no bloquea.
- **Si el registro de toda la plataforma** (`listAdminLog`) entra en la feature siguiente o en una propia:
  lo decide el dueño cuando se especifique la pantalla de la plataforma.
