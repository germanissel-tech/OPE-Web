# Investigación · El testigo en la consola

Lo que había que mirar antes de planificar: qué del camino `CU-29` ya está en el núcleo, qué le falta a la
consola para alimentarlo, y dónde la forma de los formularios de la 007 y la 008 no encaja con la comparación
de la puerta.

## §1 · La recuperación ya está; falta el testigo

**Verificado en el núcleo.** `useAction` recibe `concurrency` (`loaded`, `onScreen`, `reread`, `retryWith`); ante
un `stale-version` relee, compara con `clashBetween` y, sin cruce, reintenta **una vez** con `mergedOnto` (lo
del servidor con lo del operador encima). Con cruce llena `clash`, y `ConflictDialog` lo muestra sin decir quién
escribió. Un segundo `412` después de la fusión avisa y no guarda (`CU-25`). `stale-version` no dispara
`onRejected`, así que el modo correctivo de la 008 no se confunde con el choque.

**Lo que falta**: el testigo no sale de ninguna lectura (`unwrap` devuelve sólo el cuerpo) y no entra en ninguna
escritura. Y `OperationRequirement` del núcleo no declara `versioned`, aunque `operation()` lo acepta.

**Decisión.** El núcleo gana `unwrapWitnessed`: el cuerpo y el `ETag` de la respuesta, en una sola pieza, para
que ninguna aplicación lea encabezados a mano. `OperationRequirement` gana `versioned?: boolean`, que el módulo
de contrato del backend ya emite desde su 043.

## §2 · El testigo viaja pegado al dato, en el cliente

**Decisión.** Las cuatro lecturas que lo entregan —la configuración de un merchant, la de plataforma, los
defaults y el merchant— devuelven el dato con un campo `witness` agregado por el cliente
(`Witnessed<T> = T & { readonly witness: string }`). Las cuatro escrituras lo reciben y lo mandan en `If-Match`.

**Por qué pegado y no `{ value, witness }`**: `getMerchant` lo leen la ficha, la grilla de identidad y el título
de la configuración. Envolverlo obligaría a cambiar a todos; agregarle un campo no le cambia nada a quien no lo
usa. El nombre no choca con el contrato: ningún esquema de OPE tiene `witness`.

**Lo que no se hace**: guardar el testigo aparte de la consulta. Viene con el dato que la pantalla ya cargó, y es
el de **esa** carga, que es lo que `CU-29` pide comparar.

## §3 · La puerta compara por clave, y la configuración no tiene claves fijas

**El problema.** `clashBetween` y `mergedOnto` recorren **las claves de lo cargado**. Los formularios de la 008
tienen tres rasgos que eso no soporta:

- **Heredar es que la clave no esté.** Un valor declarado después de abrir no estaba en lo cargado: la puerta no
  lo ve como tocado y la fusión lo pierde.
- **Una lista son varias claves** (`x`, `x.0`, `x.1`): agregar un renglón es una clave nueva, otra vez invisible.
- **Un número es texto en una unidad**: el mismo valor puede leerse `36` horas o `129600000` ms, y comparar textos
  daría choques falsos.

**Decisión.** Cada pantalla le da a la puerta **una clave por hoja**, la misma en los tres lados —lo cargado, lo
que hay en pantalla y lo que trae el servidor—, con el valor del contrato serializado (`JSON`) o `undefined` si
se hereda. El conjunto de claves es fijo (las hojas operativas), así que declarar, heredar o sumar un renglón
son cambios de valor, y la comparación es en unidades del contrato. Lo arma una función de la funcionalidad
(`comparableOf`), y la vuelta al cuerpo es la que ya existe (`setAt` por hoja).

**Por qué no se cambia el núcleo**: el núcleo compara registros planos y está bien que así sea; qué es una
hoja y cómo se hereda es de OPE (principio III).

## §4 · Lo que no se edita sale de la versión nueva

**Decisión.** `reread` relee la configuración, guarda lo que rige ahora y devuelve sus hojas comparables;
`retryWith` arma el cuerpo con las hojas fusionadas **y lo no editado de esa relectura**: la política de
decisión, el riesgo de devolución, los anclajes y las etiquetas que rigen ahora, no los de al abrir. El operador
nunca los tocó, así que nunca hay cruce sobre ellos. Lo mismo para los defaults (política de decisión y riesgo
de devolución).

El modo correctivo y el motivo **no son del recurso**: no se comparan ni se fusionan, y el reintento lleva los
que el operador tiene en pantalla.

## §5 · La identidad: el testigo cambia por cosas que la pantalla no edita

**Decisión.** Las hojas comparables de la identidad son sus siete campos (nombre, URL, notas y los cuatro del
contacto). Un cambio del interruptor o una rotación mueve el testigo del merchant pero ninguna hoja: la puerta
relee, no hay cruce y guarda sola (escenario 5).

## §6 · La 042: dos lecturas que cambian de forma

**Decisión.** `useMerchantVersion` deja de recorrer páginas y pide `getMerchantConfigurationVersion`; un `404`
es «esa versión no existe». El historial del merchant gana la columna «Mediciones reiniciadas», la misma que ya
tienen los globales (`levelHistoryColumns` deja de ser sólo de los niveles), y la versión abierta del merchant la
muestra en `VersionFacts`.

## §7 · El `428` es un defecto propio

**Decisión.** La consola manda el testigo en toda escritura protegida, así que un `428 witness-required` es un
defecto de la consola, no un rechazo del negocio. Se agrega a los tipos que la puerta registra como propios
(`OURS` de `use-action.ts`), como el `403 capability-missing`, para que deje rastro. Es una línea del núcleo y no
nombra a OPE más que por un tipo del contrato: el mismo criterio que ya siguen los otros tres.
