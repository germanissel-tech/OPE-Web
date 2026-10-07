# Especificación · La pila de flujo

**Carpeta**: `003-la-pila-de-flujo` · **Estado**: borrador · **Fecha**: 2026-08-23

**Pedido**: `granito#PED-11`, sobre `GR-73` — que reemplaza a `GR-36`.

**La decisión que sale de acá es `CU-47`**, escrita el 2026-08-24 antes de tocar código
(principio VI). Enmienda `CU-44` y, en un punto, `CU-23`.

## Qué resuelve

**Volver de una pantalla pierde dónde estabas.** El operador filtra una grilla, va a la página
cuatro, abre un detalle, y al volver está en la página uno sin filtro: tiene que rehacer el camino.
Y no hay forma de que una pantalla sirva en dos recorridos distintos, porque la que abre nombra a la
que sigue.

`GR-73` lo dice en una línea: *«esperar la carga es molesto; perder dónde estabas te obliga a
rehacer el camino»*.

## Quién la consume

**Toda aplicación de Tandilia**, y sin poder no usarla: es la única forma de navegar entre
pantallas que va a quedar. Llega por `@cuarzo/core`, así que un defecto acá se arregla una vez.

Quien clona se entera por dos lados: **el esqueleto trae el flujo del catálogo ya escrito** —es el
único ejemplo, y es el que hay que copiar—, y **la aplicación no arranca** si el flujo está
incompleto, con el mensaje diciendo qué falta.

## Qué NO hace

- **No decide cómo se ve nada.** El botón de cerrar, el diálogo que avisa antes de descartar, el
  aspecto del menú: todo eso es de granito, y esto sólo dice cuándo aparecen.
- **No sabe qué pantallas tiene una aplicación.** El flujo del catálogo del esqueleto es un
  ejemplo, no un flujo de Tandilia. Los flujos reales los declara cada aplicación.
- **No restaura el scroll ni la fila parada** (`GR-47`). Granito no lo pide en esta vuelta, y son
  estado de un componente y no del recorrido.
- **No guarda borradores.** Lo que sobrevive es *dónde estabas*, no *qué habías escrito*. Un
  formulario a medio llenar que se abandona se pierde — lo que esto agrega es que **se avise antes**.
- **No cubre cerrar la pestaña ni recargar.** Ahí el navegador muestra su propio diálogo, sin
  nuestro texto. El botón «atrás» sí se cubre — ver «Lo que puede salir mal».

## De qué decisiones depende

| decisión | qué aporta |
|---|---|
| `GR-73` | Las dos reglas —cerrar desapila, terminar reemplaza— y los seis casos con los que se probó |
| `CU-44` | El desenlace: una pantalla informa qué pasó y no a dónde ir. **Se enmienda**: ver abajo |
| `CU-23` | El registro: de la declaración de una pantalla salen ruta, menú y filtrado por capacidad |
| `CU-41` | La navegación tipada, y que los parámetros de una ruta salgan de su texto |
| `CU-15` | Una funcionalidad no importa de otra — la razón por la que el flujo vive en la aplicación |
| `CU-3` | La capacidad decide de los dos lados, así que el destino de un paso también se filtra |
| `CU-26` | Se guardan identificadores, no datos: lo que viaja en un escalón tiene que caber en una URL |
| `CU-25`, `CU-37` | La invalidación, que es la tercera regla de `GR-73`: **qué contenido se ve al llegar ya está resuelto** |
| `CU-14` | El estado de una grilla servida, que es lo que pasa a vivir en la URL |
| `CU-36` | La raíz de composición, único lugar que conoce implementaciones concretas |
| `CU-42` | El manifiesto: por dónde se empieza a leer una aplicación |

**La enmienda de `CU-44`.** Hoy dice *«salir de tu funcionalidad es un desenlace; moverte adentro es
`goTo`»*. Pasa a decir que **también moverse adentro es un desenlace**, porque una pantalla que
nombra a otra deja de servir en otro flujo. La enmienda **está aprobada** y se escribe con esta
especificación; su argumento original —*«quien nunca elige no se equivoca»*— es el que la sostiene:
la regla vieja dejaba dos formas, y ésta deja una.

**Abiertas que la bloquean**: ninguna. Las cuatro decisiones abiertas de cuarzo —`CU-18`, `CU-19`,
`CU-21`, `CU-28`— no tocan la navegación.

## Aclaraciones

<!-- Lo que se preguntó antes de planificar, con su respuesta. Cada una está
     además aplicada abajo, en la sección que le toca. -->

### Sesión 2026-08-23

- P: ¿El destino de un paso puede ser otro flujo, además de una pantalla? → R: **Sí.** Nombrar una
  pantalla apila adentro del flujo; nombrar un flujo lo empieza por su raíz y **abandona el actual**.
- P: ¿Cómo declara una pantalla que tiene trabajo sin guardar? → R: **Un gancho que recibe un
  booleano.** La pantalla dice sólo si tiene algo escrito; qué es abandonar y quién pregunta es del
  marco.
- P: ¿El rótulo y la sección del menú son del flujo o de su raíz? → R: **Se derivan de la raíz, y
  el flujo puede pisarlos.** `section` sí se muda al flujo, porque agrupa flujos y no pantallas.
- P: ¿El aviso de trabajo sin guardar aparece sólo al abandonar? → R: **Al abandonar y al cerrar.**
  Al terminar no: acaba de guardar, y avisar de algo que no va a pasar entrena a ignorar el aviso.
- P: ¿Qué se hace con las entradas que el desenrollado deja vivas hacia adelante? → R: **Se
  aceptan, con una prueba que fija el comportamiento.** La ventana dura hasta la próxima acción del
  flujo, y `atrás` queda exacto siempre, que es el gesto común.
- P: ¿El menú de usuario abandona el flujo, como el lateral? → R: **No: apila sobre el activo, y
  cerrar vuelve.** El lateral lleva a **otro trabajo** y el de usuario a **algo tuyo** (`CU-27`).
  No hace falta ningún concepto nuevo: el marco ya está afuera de la regla de los desenlaces, y una
  pantalla ya puede estar en varios flujos.

## Escenarios

1. **El operador filtra el catálogo, va a la página cuatro y abre un artículo** → el artículo se
   apila. Al cerrar vuelve a la grilla **con su filtro y su página**, y con el contenido al día.

2. **Guarda el artículo** → termina. El escalón del artículo desaparece y queda la grilla: cerrar
   otra vez no puede devolverlo a un formulario ya enviado.

3. **Desde un movimiento abre un movimiento vinculado, y desde ése el primero** → el segundo se
   apila porque es otro dato; volver al primero **desenrolla** en vez de apilar, así que el ciclo no
   crece. La identidad de un escalón es la pantalla **más sus parámetros**.

4. **Termina algo cuyo destino ya está más abajo en la pila** —correr, seguir, liquidar— → se
   desenrolla hasta él. La secuencia no deja escalones muertos atrás.

5. **Termina algo cuyo destino no es el maestro** —cobrar desde la ficha y ver el comprobante
   emitido— → el comprobante **reemplaza** a la ficha. El paso lo nombra; sin nombrarlo, terminar
   vuelve a la raíz del flujo.

6. **Aprieta «atrás» en el navegador** → se comporta como cerrar, porque el flujo y la pila son
   estado de cada entrada del historial y no una variable aparte. Si hay trabajo sin guardar,
   pregunta antes, igual que cerrar.

7. **Recarga con F5** → mismo flujo, misma pila, mismo lugar. Nada se pierde.

8. **Abre un enlace pegado a una pantalla interna, en una pestaña nueva** → entra al flujo que
   arranca en la raíz de su funcionalidad, con la pila vacía. Cerrar cae a esa raíz.

9. **Hace clic en un ítem del menú** → el flujo actual se abandona y empieza el nuevo por su raíz.
   Si había trabajo sin guardar, **se avisa antes de descartarlo**.

10. **Abre «Acerca de» desde el menú de usuario, estando adentro del catálogo** → se apila sobre el
    flujo activo, y cerrar devuelve a donde estaba. **No abandona.** Sigue declarada en el flujo de
    sistema, que es lo que la hace alcanzable y le da a dónde cerrar cuando se llega por un enlace
    pegado.

11. **Una pantalla que este operador no puede ver es el destino de un paso** → la acción que lo
    emite no se dibuja. Es `CU-3` de los dos lados, ahora derivado del flujo y no de la pantalla.

12. **Un paso lleva a otro flujo** —del detalle de una liquidación al estado de cuenta— → el flujo
    actual se abandona y empieza el nombrado, por su raíz. Es el mismo abandono que el menú, así
    que avisa igual si hay trabajo sin guardar.

13. **Una pantalla con un formulario a medio llenar declara que tiene trabajo sin guardar** → se
    pregunta antes de descartarlo, y se puede cancelar: **al cerrar**, y al abandonar el flujo por
    los dos caminos —el menú lateral, y un paso que lleva a otro flujo—. **Al terminar
    no**, porque acaba de guardar. Una pantalla que no lo declara sale sin preguntar.

14. **Un flujo necesita decir en el menú algo distinto de lo que dice su raíz en la cabecera** → lo
    declara, y pisa lo derivado. Si no lo declara, el menú dice lo que dice la raíz.

## Lo que puede salir mal

**Al arrancar la aplicación**, con el mensaje diciendo qué falta y dónde:

- Una pantalla registrada que no está en **ningún** flujo.
- Un desenlace declarado por una funcionalidad que **ningún paso mapea**.
- Un paso que apunta a un desenlace **que ya nadie declara** — el que se pudre en silencio, porque
  queda vivo después de borrar lo que lo usaba.
- Un paso que nombra **un flujo que no existe**.
- Una funcionalidad con pantallas que **no declara su raíz**.
- Una raíz de funcionalidad que **no es la raíz de exactamente un flujo**, que es lo que hace
  determinístico el caso del enlace pegado.

**Mientras el operador trabaja**:

- **Cerrar con la pila vacía** —enlace pegado, pestaña nueva— cae a la raíz de la funcionalidad. No
  es un caso raro y no puede quedar sin hacer nada.
- **Trabajo sin guardar al abandonar el flujo**: se avisa y se puede cancelar. Abortar está bien;
  abortar en silencio, no.
- **Un paso apunta a una pantalla que ya no existe**: no llega a producción, porque el arranque
  falla antes.

**Dos consecuencias del navegador, que van escritas y no descubiertas**:

- **Desenrollar deja entradas vivas hacia adelante.** El botón «adelante» queda encendido sin que
  nadie haya ido atrás, y devolvería a una pantalla que el flujo dio por terminada. La ventana dura
  **hasta la próxima acción del flujo**, porque apilar trunca lo que hay adelante. **Se acepta**, y una prueba lo
  fija: si un día molesta, la salida conocida —desenrollar y después apilar— se cambia sabiendo qué
  se cambia.
- **Después de terminar, un «atrás» no se ve.** Terminar reemplaza la entrada actual, así que quedan
  dos parecidas seguidas.

**Y el «atrás» sí se puede interceptar, contra lo que esta especificación decía.** El ruteador lo
ofrece —`useBlocker`—, y se verificó con una sonda antes de planificar: después de retroceder con
trabajo sin guardar, la pantalla **no se mueve** y el bloqueo se observa. La corrección está en
[`research.md`](research.md) con su medición.

**Cómo lo hace importa, porque no es prevenir sino rebotar**: el navegador ya se movió, y el
ruteador lo devuelve. Es visible si se mira de cerca, y es el único mecanismo que hay.

Así que el aviso **cubre los cuatro caminos** —cerrar, los dos abandonos, y «atrás»—. Lo que sigue
sin cubrirse es **cerrar la pestaña o recargar**, que es del navegador y no del ruteador: ahí sólo
hay el diálogo genérico que el navegador escribe, sin nuestro texto.

Todo error que se le muestre a alguien lleva el identificador del pedido cuando hubo uno.

## Cómo se verifica

| garantía | qué sostiene |
|---|---|
| **no compila** | El destino de un paso es una pantalla del registro, con **sus** parámetros: `opens(x, articleScreen, …)` con el parámetro equivocado no compila, que es lo que `CU-41` ya compró |
| **no compila** | Un paso mapea un desenlace declarado; uno inventado no tipa |
| **no arranca** | Los cinco casos de arriba. Es un escalón menos que «no compila» y la elección está heredada de `CU-44`: la alternativa duplicaba la inferencia de tipos |
| **lo agarra una prueba** | Los once escenarios, y **los siete casos del botón «atrás»** — incluidas las dos arrugas, que se prueban para que queden fijadas y no se arreglen sin querer |
| **lo agarra una prueba** | Que el aviso aparezca al cerrar y en los dos caminos de abandono, que **no** aparezca al terminar, y que cancelar deje la pila y el flujo como estaban |
| **lo agarra una prueba** | La comprobación de límites falla si **una pantalla importa a otra pantalla**. Es la mitad de la deuda 2 que quedó sin mecanizar, y habría agarrado el `goTo(articleScreen)` el día que se escribió |
| **se hereda** | El flujo del catálogo viaja en el esqueleto, así que quien clona tiene el ejemplo y no la página en blanco |
| **lo mira una persona** | Que el catálogo se sienta bien al usarlo. Granito avisó que `GR-73` **se trazó en papel**, y el primer flujo real es éste |

## Biblioteca o esqueleto

**Las dos, y la línea es nítida.**

**Biblioteca** —`@cuarzo/core`—: los tres verbos, la pila, el contexto, el desenrollado, el filtrado
por capacidad derivado del flujo, y las cinco comprobaciones de arranque. Un defecto en cualquiera
de ellos muestra el escalón equivocado en las cuatro aplicaciones.

**Esqueleto**: `src/app/flows/`, con el flujo del catálogo adentro. Es lo que cada aplicación
reescribe entero, y por eso se copia y diverge.

## Supuestos

- **Que el historial del navegador es el lugar correcto para la pila.** Lo propuso granito y lo
  compartimos: da enlaces profundos, «atrás» coherente y supervivencia al F5 sin maquinaria propia.
  Si apareciera un caso que no entra, es un cambio grande.
- **Que `history.state` sobrevive lo suficiente.** Es por entrada y por pestaña, y persiste al
  recargar. No sobrevive a cerrar la pestaña, y está bien: ahí no hay recorrido que preservar.
- **Que el clic en el ítem del flujo en el que ya estás también reinicia** —o sea, se lleva el filtro
  y la página—. «Catálogo» en el menú se lee como «llevame al catálogo, limpio».
- **Que una pila de tres o cuatro escalones es lo normal.** `GR-73` lo argumenta desde las veinte
  notas del panel. No hay límite duro, y si hiciera falta uno sería una señal de que un flujo está
  mal partido.

## Lo que queda abierto

**Nada.** Las seis preguntas se cerraron en la sesión de aclaración del 2026-08-23 y están arriba,
en «Aclaraciones».

La sección se deja escrita en vez de borrarse: **«no queda nada abierto» es una afirmación**, y una
sección ausente se lee igual que una olvidada.
