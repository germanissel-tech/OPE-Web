# Especificación · La configuración versionada

**Carpeta**: `008-la-configuracion-versionada` · **Estado**: borrador · **Fecha**: 2026-10-09

**Pedido**: "La configuración versionada en el panel de administración. Decisión del dueño,
2026-10-09: entran los tres niveles —la configuración de cada merchant, la de plataforma y los
defaults de tratamiento—; en cada uno se ve lo que rige, de dónde sale cada valor y el historial de
versiones, y se publica una versión nueva. Se edita lo operativo: holdout, superficies, barreras,
idiomas, frescura, nivel de sincronización, estrategia por flujo, perfil de evidencia, los valores
escalares de la política comercial y todos los de plataforma. La política de decisión, la condición de
riesgo de devolución, el mapa de anclajes y las etiquetas de atributos se ven pero no se editan, y
viajan intactos en cada versión nueva."

<!--
  Las decisiones se citan por identificador: `CU-n` heredadas de cuarzo, `OW-n` de OPE-Web, `GR-n` de
  granito y `ADR-nnn` del backend de OPE.
-->

## Qué resuelve *(obligatoria)*

Lo que OPE hace con cada visitante lo deciden tres niveles de configuración (`ADR-031`): la
plataforma, los defaults de tratamiento y lo que cada merchant declara encima. Desde la feature 036 del
backend los tres se publican por API como versiones numeradas e inmutables, porque el dueño decidió que
**todo se configura desde el panel**. El panel no tiene ninguno: hoy la única forma de ver con qué se
sirve a un merchant, o de cambiarlo, es `curl` contra la API.

Y `curl` es justo donde esto sale caro. Una versión del merchant **reemplaza entero** lo que declara,
así que olvidarse el mapa de anclajes en el cuerpo lo borra sin aviso. Con un experimento activo sólo
entra una versión correctiva con su motivo, y esa versión reinicia la medición. Ninguna de las dos cosas
se ve desde la línea de comandos hasta que ya pasó.

El problema es que **la configuración que decide lo que OPE hace es invisible para el operador**, y
**cambiarla exige saber de memoria qué hay que mandar para no romper lo que no se toca**.

## Quién la consume *(obligatoria)*

- **El operador de OPE**, desde OPE-Console. Desde la ficha de un merchant ve con qué se lo sirve y
  publica su configuración. Desde el menú, si su alcance es sobre todos los merchants, ve y publica la
  configuración de plataforma y los defaults de tratamiento.
- **Las features siguientes del panel** (textos y experimentos): copian de acá la forma de un recurso
  versionado —lo que rige, el historial, publicar una versión, el congelamiento por experimento activo—,
  que ninguna pantalla de la 006 ni de la 007 tenía.
- **El portal del merchant**, más adelante: no publica configuración, pero mostrará tasas y duraciones;
  cómo se leen esas dos clases de dato queda fijado acá.

## Qué NO hace *(obligatoria)*

- **No edita la política de decisión, la condición de riesgo de devolución, el mapa de anclajes ni las
  etiquetas de atributos.** Son estructuras —reglas con condiciones, selectores por anclaje, una tabla de
  correspondencias— que piden un editor propio. Se muestran resumidas y viajan **intactas** en cada
  versión nueva: la pantalla de edición no las puede perder. Su edición es una feature posterior.
- **No publica textos ni maneja experimentos.** Los dos tienen operaciones en el contrato y son las
  features siguientes del panel. Esta muestra qué experimento alcanzó un cambio, por su identificador,
  porque el backend lo devuelve; no abre ni cierra ninguno.
- **No muestra el registro de toda la plataforma** (`listAdminLog`). El historial de cada nivel ya dice
  quién publicó qué versión, cuándo, si fue correctiva, por qué y qué mediciones reinició; el registro
  completo es una pantalla aparte con la plataforma por sujeto.
- **No vuelve a una versión anterior.** El contrato no tiene esa operación, y la consola no la finge
  publicando por su cuenta el contenido viejo. Se puede ver lo que declaró cada versión.
- **No reimplementa las invariantes del backend.** Lo que el esquema dice —rangos, largos, listas
  cerradas, cuántos elementos— es capa 1 emitida (`CU-38`). Lo que cruza campos —una escalera
  estrictamente creciente bajo su techo, el idioma de reserva entre los soportados, un idioma sin textos
  completos, una etiqueta repetida— lo dice el backend con un `422` que cae en su campo.
- **No decide si un cambio alcanza un experimento.** Lo decide el backend hoja por hoja (`ADR-031`,
  enmienda de la 036) y lo dice con `409 configuration-frozen`. La consola reacciona: ofrece la versión
  correctiva y pide el motivo.
- **No convierte los datos que viajan.** Las tasas viajan como fracciones de 1 y las duraciones en
  milisegundos, como el contrato dice (`ADR-035`). Se **muestran y se cargan** como un porcentaje y en la
  unidad que una persona lee; eso es presentación, que `ADR-035` deja expresamente al frontend.
- **No agrega capacidades.** `configuration:read` y `configuration:write` ya están en el módulo del
  contrato (`CU-37`). Publicar un nivel global exige además un operador sobre todos los merchants; eso
  sale del alcance que `getOperator` ya devuelve (`OW-7`).
- **No decide nada visual.** Un valor con su origen, una lista de marcas, un porcentaje o una duración
  son composición de granito; lo que falte es propuesta (principio IV).
- **No toca el backend.** Todo lo que usa está en el contrato sincronizado.

## De qué decisiones depende *(obligatoria)*

| decisión | qué aporta |
|---|---|
| `CU-3`, `CU-37` | Lo que un permiso no habilita no se muestra: ver exige `configuration:read`, publicar `configuration:write`; lo que exige cada operación sale del módulo del contrato |
| `OW-7` | El alcance del operador viene de `getOperator`: los niveles globales se publican sólo con alcance sobre todos los merchants, y si no, no se ofrecen |
| `CU-4`, `CU-24` | Los cuatro estados de cada vista y del historial; el vacío del historial de un merchant sin versión propia es un estado con su texto, no una lista vacía |
| `OW-4` | El historial es una colección con cursor: «cargar más», y el tramo viaja en la dirección |
| `CU-25`, `CU-37` | Publicar es una acción que declara qué invalida: la vista del nivel, su historial y, para los globales, la configuración de todo merchant que hereda |
| `CU-34` | La clave de idempotencia se ata al cuerpo: reintentar el mismo cuerpo después de un fallo no crea dos versiones, y el backend responde `200` con la que rige |
| `CU-38`, `CU-49` | Capa 1 emitida de los tres esquemas de entrada; el `422` con puntero cae en su campo, y uno cuyo campo no está en pantalla va al pie sin perderse |
| `OW-3` | Problem Details: `409 configuration-frozen`, `422` con `errors[]` y `requestId` en todo aviso |
| `CU-47`, `CU-48`, `CU-41` | La configuración del merchant es una pantalla a la que se llega desde la ficha y que vuelve a ella; plataforma y defaults son entradas del menú; los parámetros de ruta son tipados |
| `CU-6`, `GR-31` | Un formato se define una vez: una tasa y una duración se muestran igual en la vista, en la edición y en el historial |
| `CU-43`, `CU-31` | Los textos viven con la funcionalidad; los rótulos de los campos son claves del contrato |
| `GR-30`, `GR-37`, `GR-70` | La vista es un formulario de sólo lectura; publicar una versión es una pantalla, no un diálogo: muchos campos y errores que explicar en su lugar |
| `GR-24`, `GR-27`, `GR-38` | Secciones con la cabecera al costado que dice por qué existen; las acciones al pie de su bloque |
| `ADR-031` del backend, enmendada por la 036 | Los tres niveles, qué declara cada uno, la versión inmutable, el congelamiento por experimento alcanzado, la versión correctiva con motivo y la ventana de medición reiniciada |
| `ADR-035` del backend | Las tasas son fracciones de 1 en todo el contrato; cómo se muestran es del frontend |

**Abiertas que la bloquean**: ninguna. `CU-18`, `CU-19`, `CU-21` y `CU-28` siguen abiertas y no tocan
esta feature.

**Dependencias con otro repositorio**: ninguna pendiente. Las operaciones de los tres niveles están en
el contrato sincronizado desde la 007.

## Escenarios *(obligatoria)*

### La configuración de un merchant

1. **El operador abre la configuración desde la ficha** → una pantalla de sólo lectura dice con qué se
   sirve hoy al merchant. Arriba, las tres versiones que cada decisión estampa: la de plataforma
   (`platform-2`), la de defaults (`defaults-1`) y la del merchant (`versión 3`, o «sin versión propia»).
   Debajo, cada valor operativo con su valor efectivo y **de dónde sale**: declarado por el merchant, o
   heredado de los defaults. Lo que no se edita se muestra resumido: la política de decisión por su
   versión, su umbral y cuántas reglas tiene; el mapa de anclajes por los anclajes que declara; las
   etiquetas de atributos por cuántas hay. Al pie, «publicar una versión» exige `configuration:write`, y
   «volver a la ficha» es una salida más.

2. **Un merchant que nunca publicó configuración** → la vista lo dice («sin versión propia: todo se
   hereda de los defaults») y muestra lo efectivo igual, todo con origen «heredado». El historial dice
   que todavía no hay versiones, y la salida es publicar la primera.

3. **El operador publica una versión del merchant** → una pantalla precargada con lo que declara la
   versión que rige. Cada valor operativo se **hereda o se declara**: heredado, el campo muestra el valor
   que vendría de los defaults y no viaja; declarado, viaja. Volver a heredar un valor es una acción
   explícita en su campo, no vaciarlo. Guardar publica `declared` con lo operativo como quedó y **lo que
   no se edita copiado tal cual** de la versión que rige. Termina en la vista, con un aviso que dice el
   número de la versión nueva. Cancelar vuelve sin publicar.

4. **El cuerpo es igual a la versión que rige** → el backend responde `200` con esa misma versión; la
   consola avisa «no cambió nada: sigue la versión N» y no lo presenta como una publicación.

5. **Hay un experimento activo** → la primera publicación vuelve `409 configuration-frozen`. La pantalla
   no pierde lo cargado: explica que el cambio alcanza una medición en curso, que sólo entra como
   correctiva y que **reinicia su ventana de medición**, y ofrece marcarla correctiva con un motivo
   obligatorio. Correctiva sin motivo es un error de capa 1 en el motivo, sin ir al servidor. El
   operador también puede marcarla correctiva desde el principio.

6. **Un valor que el backend rechaza** → `422 invalid-configuration-value` cae en el campo que su
   puntero nombra, con el texto del servidor: una escalera que no crece, un techo por debajo de un
   escalón. `422 locale-incomplete` cae en el idioma que entra y dice qué familias de textos le faltan.
   Un `422` cuyo puntero nombra algo que la pantalla no edita —`duplicate-attribute-label`, una regla
   de la política— va al pie con el texto del servidor (`CU-49`).

7. **El historial del merchant** → las versiones de la más nueva a la más vieja: número, instante,
   operador, si fue correctiva y su motivo. De a tramos, con «cargar más». Abrir una muestra lo que esa
   versión declaró, en la misma forma de sólo lectura que la vista.

### Los niveles globales

8. **El operador abre «Plataforma» desde el menú** → la versión que rige por su nombre (`platform-2`) y
   sus valores: la ventana de deduplicación, las dos tolerancias de reloj, la duración de la sesión, la
   ventana del visitante, la de firma, la gracia máxima de rotación, cuántos diagnósticos y valores sin
   mapear se guardan, y el reintento sugerido. La sección dice en voz baja que este nivel es el mismo
   para todos los merchants y que cuatro de sus valores deciden qué se cuenta. Debajo, el historial.

9. **El operador publica una versión de plataforma** → una pantalla con todos los valores precargados
   de la que rige; se editan todos. Publicar crea la versión siguiente, cuyo nombre acuña el backend.
   Con experimentos alcanzados, `409` y el mismo camino correctivo del escenario 5. Si la versión
   reinició mediciones, el aviso y el historial dicen cuántas y cuáles, por identificador de experimento.

10. **El operador abre «Defaults de tratamiento»** → la versión que rige (`defaults-1`) y sus valores
    operativos, más el resumen de la política de decisión y de la condición de riesgo de devolución. La
    sección dice que un cambio acá alcanza a **todo merchant que no declare ese valor**. Publicar es como
    en la plataforma, con lo que no se edita copiado tal cual de la versión que rige.

11. **El historial de un nivel global** → como el del merchant, más el nombre de cada versión y las
    mediciones que reinició. Abrir una versión pide esa versión al backend por su número.

### Quién ve qué

12. **Un operador sin `configuration:write`** → ve las tres vistas y los historiales, y no ve ningún
    «publicar».

13. **Un operador sin `configuration:read`** → no ve «configuración» en la ficha ni las dos entradas del
    menú. Llegar por un enlace pegado responde «sin permisos», como cualquier pantalla.

14. **Un operador con alcance acotado a algunos merchants** → ve y publica la configuración de sus
    merchants. Ve plataforma y defaults si el backend se los sirve, y **no ve «publicar»** en ellos:
    publicar un nivel global exige alcance sobre todos los merchants.

### Cómo se leen los valores

15. **Una tasa** (`holdoutShare`, `maxIncentiveShare`, cada escalón de `incentiveLadderShare`,
    `marginShare`) → se muestra y se carga como porcentaje: `0.05` se lee «5 %» y se escribe `5`. Viaja
    como `0.05`.

16. **Una duración** (todo `…Ms`, `cooldownSeconds`) → se muestra en la unidad mayor que la representa
    exacta —`129600000` se lee «36 h», no «1,5 días»— y se carga con su unidad a la vista. Viaja en la
    unidad del contrato.

## Lo que puede salir mal *(obligatoria)*

- **La versión nueva pierde lo que no se edita.** Es la falla más cara de la feature: un merchant sin
  mapa de anclajes deja de renderizar, y nada avisa. Lo que la pantalla no edita se copia de la versión
  que rige al **armar el cuerpo**, no al dibujar; una prueba publica sin tocar nada de eso y compara el
  cuerpo enviado contra lo declarado, campo por campo.
- **Otro operador publicó entre que se abrió la pantalla y se guardó.** El contrato no tiene testigo de
  concurrencia para la configuración, así que gana el último, y **arrastra la versión vieja de lo que no
  se edita**: si el otro cambió el mapa de anclajes, guardar acá lo revierte. La consola no lo finge
  (`CU-29` no aplica sin testigo). El historial muestra las dos versiones. Queda abierto pedir el testigo
  al backend.
- **Publicar responde `500` después de escribir** (deuda D-20 del backend) → el operador reintenta con el
  mismo cuerpo, y la idempotencia por contenido devuelve `200` con la versión ya creada (`CU-34`). La
  consola no reintenta sola.
- **`409 configuration-frozen` y el operador no entiende por qué** → la pantalla lo explica con el texto
  de la funcionalidad, no con el título del problema, y dice qué implica marcarla correctiva.
- **Un `422` con puntero a algo que la pantalla no muestra** → al pie, con el texto del servidor
  (`CU-49`). Nunca se pierde ni se descarta.
- **Una conversión que redondea.** `0.07 × 100` en punto flotante es `7.000000000000001`, y una tasa que
  el reparto cuantiza tiene que ser exactamente la de su balde (`ADR-035`). Las tasas se convierten
  **corriendo la coma sobre el texto**, nunca multiplicando un número; una duración que no es exacta en la
  unidad elegida no se redondea, se muestra en una menor. Lo verifican pruebas con los casos que rompen.
- **`403` al publicar un nivel global** → no debería pasar, porque sin alcance total no se ofrece. Si
  pasa, es un defecto del panel: aviso con su identificador de pedido.
- **`503` al leer o publicar** → aviso con «reintentar»; publicar no se reintenta solo.
- **La versión pedida del historial no existe** (`404`) → el estado de error de esa vista, con su
  identificador de pedido.
- **El operador sale de la edición con cambios** → el marco ya pregunta antes de descartar trabajo sin
  guardar; esta pantalla lo usa, no lo reimplementa.

## Cómo se verifica *(obligatoria)*

| garantía | qué sostiene |
|---|---|
| **Se genera** | Los tipos de los tres niveles, sus entradas, sus versiones y sus páginas; las capacidades de las once operaciones; la capa 1 de `MerchantConfigurationDeclared`, `PlatformConfigurationContent`, `TreatmentDefaultsContent` y sus partes: todo sale del contrato sincronizado |
| **No compila** | Un cuerpo de publicación que no es el esquema de entrada de su nivel; un campo de la vista que lea una propiedad que el efectivo no tiene; un desenlace que ninguna pantalla emite; una tasa que se pase sin su conversión de presentación |
| **Se hereda** | La forma de un recurso versionado —vista, historial, publicar, congelamiento—: textos y experimentos la copian |
| **Lo agarra una prueba** | Con respuestas simuladas: la vista dice el origen de cada valor; un merchant sin versión propia lo dice; publicar sin tocar lo complejo manda el mapa de anclajes, las etiquetas y la política idénticos; volver a heredar un valor lo saca del cuerpo; el cuerpo igual avisa «no cambió»; `409` conserva lo cargado y pide motivo; correctiva sin motivo no viaja; `422` con `/body/declared/commercialPolicy/incentiveLadderShare` cae en la escalera y con `/body/declared/attributeLabels/3/label` va al pie; las conversiones de tasa y duración ida y vuelta con `0.07`, `0.1`, `0.375` y `129600000`; sin `configuration:write` no hay «publicar»; con alcance acotado no hay «publicar» en los globales; el aviso de una versión que reinició mediciones nombra los experimentos |
| **Lo mira una persona** | Contra el backend real: la configuración de «Tienda de desarrollo», publicar una versión que cambia el holdout y ver el origen pasar a «declarado»; volver a heredarlo; plataforma y defaults con sus historiales; con un experimento activo, el `409` y la versión correctiva; que la vista componga con granito y se lea |

**Cada comprobación nueva se rompe a propósito antes de creerle.**

## Biblioteca o esqueleto

La configuración del merchant vive en `apps/console/src/features/merchants`, porque es del merchant. Los
dos niveles globales son una funcionalidad nueva de la consola. Las dos cosas son negocio de OPE
(principio III).

**Se decide en el plan** si van a `packages/core` dos piezas que parecen de todos: la presentación de
una tasa como porcentaje y la de una duración en su unidad. La prueba es la de siempre: si mañana el
portal muestra un holdout o una frescura, ¿tiene que leerlos igual que la consola? Si la respuesta es
sí, es biblioteca.

## Supuestos

- **La vista es una pantalla aparte de la ficha**, alcanzada desde ella. La ficha ya tiene identidad,
  datos operativos, credenciales y registro; la configuración son diez grupos de valores.
- **«Heredar» es la ausencia del valor en `declared`**, como el contrato lo define. La pantalla lo
  muestra como un estado del campo, no como un campo vacío, porque vacío y heredado son cosas distintas
  y vacío no viaja.
- **La política comercial declarada nombra su versión** cuando declara cualquiera de sus valores, como
  exige el esquema. La pantalla la pide en ese caso, y la deja fuera si todo se hereda.
- **Lo que no se edita sale de la versión que rige al abrir la pantalla.** Sin testigo en el contrato no
  hay otra fuente.
- **Las tasas se leen como porcentaje y las duraciones en su unidad.** `ADR-035` deja eso al frontend.
- **Plataforma y defaults se ven con `configuration:read` aunque el alcance sea acotado.** Si el backend
  los niega a un operador acotado, la entrada del menú se esconde también para él; lo verifica el plan
  contra el backend.
- **El nombre de una versión global lo acuña el backend**; la consola no lo propone.

## Lo que queda abierto

- **El testigo de concurrencia de la configuración.** Sin él, publicar arrastra lo no editado de una
  versión que pudo cambiar. Es un pedido al backend, con esta feature como evidencia; no bloquea.
- **La edición de la política de decisión, de la condición de riesgo de devolución, del mapa de
  anclajes y de las etiquetas de atributos.** Feature posterior, con editores propios.
- **«Partir de una versión anterior»**: precargar la edición con lo que declaró una versión vieja, en
  vez de la que rige. Es la forma honesta de volver atrás sin una operación de rollback; se decide
  después de ver el historial en uso.
- **El registro de toda la plataforma** (`listAdminLog`), en su propia pantalla.
- **Propuestas a granito**, si al componer hace falta: un valor con su origen al lado, y un campo que
  alterna entre heredado y declarado. Se compone mientras tanto; no bloquea.
