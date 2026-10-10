# Especificación · El testigo en la consola

**Carpeta**: `009-el-testigo-en-la-consola` · **Estado**: construida · **Fecha**: 2026-10-10

**Pedido**: consumir las features 042 y 043 de OPE-Backend. La 043 hace **obligatorio** el testigo en las
cuatro escrituras que reemplazan lo que leyeron —las tres publicaciones de configuración y la edición de la
identidad del merchant—, y la consola todavía no lo manda: desde que esa feature entra, esas cuatro pantallas
reciben `428` y no pueden guardar. La 042 completa el historial de configuración y textos con las mediciones
que reinició cada versión, y lee una versión del merchant por su número.

## Qué resuelve *(obligatoria)*

**Hoy la consola no puede publicar configuración ni editar la identidad de un merchant**: el backend exige el
testigo de lo que la pantalla leyó, y la pantalla no lo guarda ni lo devuelve. Antes de la 043 podía, pero
reemplazaba a ciegas: si otro operador había escrito en el medio, lo pisaba sin que ninguno se enterara.

Y dos huecos chicos de la 008, que el backend ya llenó: la columna «Mediciones reiniciadas» del historial
queda vacía, y abrir una versión vieja del merchant recorre todo el historial página por página.

## Quién la consume *(obligatoria)*

**Los operadores de la consola**, en cuatro pantallas que ya existen: publicar la configuración de un merchant,
de la plataforma y de los defaults de tratamiento (feature 008), y editar la identidad del merchant (feature
007). Y en los tres historiales de configuración, y la versión del merchant por número (feature 008).

**Es la primera vez que la recuperación `CU-29` corre en OPE.** El núcleo la tiene construida desde la 004 y
dormida desde la 005, porque OPE no tenía testigo. Esta feature es la que la despierta, y es la evidencia de
que el camino entero —leer el testigo, mandarlo, releer, comparar, reintentar o mostrar el choque— funciona
contra un backend real.

## Qué NO hace *(obligatoria)*

- **No resuelve el choque por el operador.** Cuando lo que él tocó cambió también en el servidor, se le muestra
  qué cambió y decide él (`CU-29`). No fusiona campo con campo, no elige un valor «correcto».
- **No promete quién escribió.** El texto no dice «otro operador»: puede ser cualquier escritura del merchant,
  también un cambio del interruptor o una rotación.
- **No protege otras escrituras.** Las demás del panel (experimentos, textos, credenciales, interruptor) no
  exigen testigo en el contrato y quedan como están.
- **No cambia la forma de la recuperación.** El diálogo del choque y el aviso son los del núcleo y de granito;
  acá se dice qué le da cada pantalla a la puerta para que pueda decidir.
- **No edita lo que la 008 dejó afuera** (política de decisión, anclajes, etiquetas). Lo que no se edita sigue
  viajando intacto, ahora tomado de la versión que rige **al reintentar**, no de la que rigió al abrir.

## De qué decisiones depende *(obligatoria)*

| decisión | qué aporta |
|---|---|
| `CU-29` | **Lo que se despierta.** La intersección entre lo que el operador tocó y lo que cambió; guardar sin molestar si no se cruzan; no perder lo tecleado; la recuperación vive en la puerta de acciones |
| `CU-25` | Las escrituras no se reintentan solas: el reintento de `CU-29` es otra escritura, con otro testigo y otro cuerpo |
| `CU-34` | La clave del intento atada al cuerpo: el reintento fusionado es otro cuerpo, y lleva otra |
| `CU-14` | El choque se reconoce por su tipo (`stale-version`), nunca por el mensaje |
| `CU-9` | Lo tecleado no se pierde, tampoco cuando el servidor rechaza |
| `CU-38` | Los errores que vuelven a los campos; el choque **no** es uno de ellos |
| `OW-5` | El contrato llega como artefacto con `contract:sync`; el módulo de contrato dice qué operaciones exigen testigo (`versioned`) |
| ADR-046 del backend | El testigo: `ETag` al leer, `If-Match` al escribir, `412` y `428`, un cuerpo idéntico se acepta con cualquier testigo |

**Abiertas que la bloquean**: ninguna. Depende de que la 043 del backend (PR #52) esté en `main` para
sincronizar el contrato `1.15.0`; la spec y el plan no lo necesitan, la implementación sí.

## Escenarios *(obligatoria)*

1. **Publicar sin nadie en el medio** → la pantalla manda el testigo de lo que leyó, el backend acepta y el
   aviso dice la versión, como hoy. El operador no ve nada nuevo.
2. **Alguien publicó en el medio, sobre otros valores** → el backend responde `412`; la puerta relee, ve que
   lo que cambió no se cruza con lo que el operador tocó, y vuelve a publicar sobre la versión nueva con sus
   cambios encima. El operador ve el aviso de publicado y nada más.
3. **Alguien publicó en el medio, sobre el mismo valor** → la puerta relee, ve el cruce y muestra el choque: qué
   valor tenía al abrir, qué tiene ahora el servidor y qué cargó él. Lo tecleado sigue en el formulario. Puede
   cerrar el aviso y seguir editando, o volver a guardar sabiendo qué pisa.
4. **La configuración de un merchant con lo que no se edita** → si en el medio cambió la política de decisión o
   un anclaje, el reintento lleva **los de la versión nueva**, no los que rigieron al abrir: lo no editado nunca
   lo tocó el operador, así que no hay cruce y no se pisa.
5. **Editar la identidad después de un cambio del interruptor o de una rotación** → el testigo del merchant
   cambió pero ningún campo de la identidad: se guarda sin molestar.
6. **Editar la identidad cuando otro la editó** → si se cruzan campos (el nombre, la URL, el contacto, las
   notas), se muestra el choque como en el escenario 3.
7. **El reintento de algo que ya entró** → la red cortó la respuesta y la puerta repite el mismo cuerpo con el
   mismo testigo: el backend responde que no cambió nada, y el aviso lo dice.
8. **El historial de un nivel o de un merchant** → la columna «Mediciones reiniciadas» trae los experimentos
   que cada versión correctiva reinició; en el merchant es una columna nueva. Una versión que no reinició
   nada la deja vacía.
9. **Abrir una versión vieja del merchant** → una sola petición por su número; si no existe, «esa versión no
   existe», como en los niveles globales.
10. **Con sólo lectura** → no cambia nada: las pantallas que publican no se ofrecen (`CU-3`), y las lecturas
    traen el testigo igual.

## Lo que puede salir mal *(obligatoria)*

- **La relectura falla** (red, `5xx`) → el aviso de error de siempre, con su identificador de pedido; lo
  tecleado sigue y el operador puede reintentar a mano.
- **Alguien escribe otra vez mientras la puerta reintenta** → un segundo `412`; la puerta vuelve a releer y
  comparar. No hay un bucle: si el cruce aparece, se muestra el choque y se detiene.
- **El backend responde `428`** → no debería pasar nunca, porque toda escritura protegida lleva el testigo. Si
  pasa, es un defecto de la consola: el aviso lleva el identificador de pedido y el registro de la consola lo
  anota como error propio, no como rechazo del negocio.
- **Un `412` en una pantalla que no le dio a la puerta lo que necesita** → el aviso genérico de versión vieja.
  Esta feature hace que no quede ninguna de las cuatro en ese caso, y una prueba lo afirma.
- **El congelamiento (`409`) y el choque juntos** → el backend juzga el testigo primero, así que el operador ve
  el choque; resuelto, puede encontrarse con el congelamiento, que sigue funcionando como en la 008.

## Cómo se verifica *(obligatoria)*

- **Las cuatro pantallas, montadas contra un servicio de mentira** que responde `412` la primera vez: sin
  cruce, la pantalla guarda sola en el segundo intento con el testigo nuevo; con cruce, se ve el choque y lo
  tecleado sigue; la configuración del merchant reintenta con lo no editado de la versión nueva.
- **El testigo viaja**: la prueba del cliente afirma que la lectura devuelve el testigo y que la escritura
  manda `If-Match`.
- **`contract:sync` a `1.15.0`** sin tocar la comprobación de conformidad; `npm test`, `npm run revisar`,
  `npm run build`.
- **Contra el backend real**, con dos pestañas sobre el mismo recurso: los escenarios 2, 3 y 5 a mano.

## Biblioteca o esqueleto

Las dos partes, separadas:

- **El núcleo** gana sólo lo que le falte para leer el testigo de una respuesta y llevarlo a la escritura, si
  algo le falta; la recuperación ya está.
- **La consola** pone el testigo en el cliente de OPE, se lo da a cada pantalla, y cada pantalla le da a la
  puerta lo que `CU-29` pide: lo que cargó, lo que tiene en pantalla, cómo releer y cómo rearmar el pedido.

## Supuestos

- El contrato `1.15.0` llega con `versioned: true` en las cuatro operaciones; es lo que la puerta lee.
- Lo que el operador «tocó» se compara con los mismos nombres de campo que ya usan los formularios (la 008
  nombra cada valor por su camino en el cuerpo), así que la intersección es campo por campo.
- Un valor heredado que el operador declaró (o al revés) cuenta como tocado.

## Lo que queda abierto

- **Mostrar quién escribió en el medio**: el contrato no lo dice en el rechazo; se puede leer del historial o
  del registro de administración. No se hace acá.
