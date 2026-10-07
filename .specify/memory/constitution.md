# Constitución de Cuarzo

Lo que no se negocia. **Las decisiones de arquitectura no están acá**: viven con su razón en
[`docs/arquitectura.md`](../../docs/arquitectura.md) y en
[`docs/seguridad.md`](../../docs/seguridad.md), y se citan por identificador —`CU-11`, `GR-31`—
desde el índice [`docs/decisiones.md`](../../docs/decisiones.md). Acá están las reglas bajo las que
se toma cualquier decisión.

Cada principio va con el daño concreto que evita. **Una regla sin razón se saltea el día que
molesta.**

## Para quién se escribe esto

**Todo en Tandilia lo construye, lo evoluciona y lo mantiene un agente.** No es una circunstancia
del momento: es la premisa de la que sale todo lo demás.

**Un agente arranca cada sesión en frío.** No acumula el conocimiento tácito que acumula un equipo
de personas, así que **lo que no está escrito no existe**. Una decisión sin su razón no se
re-discute «seis meses después»: se re-discute la próxima sesión, y con lo que al agente de turno
le parezca razonable.

**Y falla distinto que una persona.** Alguien que lee una referencia que no resuelve, pregunta. Un
agente **completa lo que cree que decía**. Por eso cada decisión lleva identificador, hay un índice,
y una prueba que corre y falla si una cita no resuelve — un documento prolijo no alcanza, tiene que
ser verificable.

De ahí sale el ciclo entero: se especifica antes de construir, se pregunta lo ambiguo con
herramienta, y **lo que no se puede verificar se dice que no se puede**.

## Principios

### I · Proponer antes de escribir

**Antes de crear o modificar cualquier archivo, describir en el chat qué se va a escribir y esperar
el OK.**

No es una formalidad. En `las-animas/backend` hubo que borrar tres veces trabajo completo por
producirlo antes de tiempo. El patrón a evitar es **producir volumen adelantándose al usuario**:
ante la duda, escuchar y preguntar.

Alcanza a las especificaciones: una `spec.md` escrita entera sin pasar por el chat es exactamente
el mismo error, con más páginas.

### II · Lo que no está decidido se pregunta

Los documentos de decisiones tienen entradas abiertas. **Están abiertas a propósito.** Rellenarlas con
lo que a un agente le parece razonable es elegir por el usuario y presentarlo como si fuera
evidente.

Lo que sí sale de acá son **las consecuencias de lo ya decidido**. Que una pantalla necesite cuatro
estados es una conclusión; cuál biblioteca los maneja, no.

### III · Cuarzo no sabe de negocio

**Ningún archivo puede saber qué es una liquidación, una receta o un punto de fidelización.** Eso
es de cada aplicación.

Y tampoco sabe de un backend en particular: los contratos son distintos. Lo que se comparte es la
forma de pedir, no qué se pide.

**La regla alcanza a los comentarios.** Un comentario que explica una decisión nombrando un negocio
obliga a quien llega de otro sistema a aprender un dominio ajeno para entender un porqué. La razón
se cuenta sin el dominio y dice lo mismo.

### IV · Lo visual es de granito

Colores, tipografía, espaciado, componentes, cómo se ve un importe: **nada de eso se decide acá**.
Si una aplicación necesita algo visual que granito no da, se propone allá.

Duplicarlo acá sería tener dos fuentes que un día se contradicen, y ganaría la más nueva sin que
nadie lo decida.

### V · Biblioteca o esqueleto, y la prueba es una sola

**¿Si arreglo esto, tiene que llegarles a todas las aplicaciones?**

- **Sí** → biblioteca. La sesión, los permisos, el manejo de errores.
- **No** → esqueleto, que se copia y después diverge. Las carpetas, las pantallas, la compilación.

Poner en la biblioteca lo que debería copiarse convierte cada preferencia de una aplicación en una
discusión con las otras tres.

### VI · Primero las decisiones, después la primera aplicación

**Y recién al final extraer a una biblioteca lo que la segunda pruebe que es común.**

**La primera aplicación se construye partiendo de cuarzo**, no al lado: cuarzo es la aplicación base
que ya corre (CU-20). Lo que la primera pruebe que es general se queda; lo que resulte ser de su
negocio, se saca.

La razón está a la vista en el repo hermano: granito se construyó con un solo consumidor y quedó
hablando el idioma de ése —el símbolo del peso adentro, los nombres de un contrato ajeno, los
rótulos cableados—. Separarlo costó una jornada. **Con un solo consumidor no se ve qué es general y
qué es de ése.**

La única excepción es **la sesión**, y no por comodidad: de eso ya hay evidencia y no una
suposición — es el mismo proveedor de identidad para todas. **Cuál sea es configuración**
(CU-10); que sea compartido es el hecho.

## Cómo se hace cumplir

**Un documento no asegura nada por sí solo**, y en la familia hay evidencia: granito tiene 51
decisiones escritas con su razón, y aun así se publicó sin tipos, una tabla perdió sus columnas y
dos tarjetas quedaron pegadas. Las tres las agarró **una prueba que corre**, no un documento.

Las garantías, de más fuerte a más débil:

| | qué significa |
|---|---|
| **Se genera** | nadie lo escribe a mano, sale de una fuente |
| **No compila** | el tipo hace imposible lo incorrecto |
| **Se hereda** | se empieza clonando el esqueleto, no armando |
| **Lo agarra una prueba** | una comprobación que corre en cada repo |
| **Lo mira una persona** | lo último, para lo que ninguna máquina ve |

**Un documento no está en la lista.** Es lo que hace posibles las cinco, y no reemplaza a ninguna.

De acá sale una obligación concreta para toda especificación: **una `spec.md` que no termine en
algo que se genere, que no compile, que se herede al clonar o que agarre una prueba, está
incompleta.** El plan tiene que decir cuál de las cinco la sostiene.

Y lo que no se puede asegurar conviene decirlo: que una pantalla componga bien, que el texto diga
lo que tiene que decir, y que un nombre sea el correcto. Eso lo mira una persona, siempre.

## Convenciones

- **El código va en inglés; el castellano es sólo para los comentarios.** Nombres de funciones, de
  tipos, de parámetros y de variables, incluidos los locales. También los nombres de archivo de
  código, y las claves de `config.json`.

  > **Sin mecanismo, y ya se rompió una vez** con esta regla escrita: el tramo 1 y el tramo 2 se
  > escribieron enteros en castellano y hubo que rehacerlos. Es la misma clase de deuda que la
  > entrada 1 de `../docs/deuda.md` — una exigencia que depende de que alguien se acuerde.

- **En castellano, «cliente» es una persona.** Tandilia tiene cuenta corriente: el contexto de
  trabajo de `CU-26` es **el cliente actual**, y `CU-9` habla de sus datos en una pantalla
  congelada. Lo que habla con un backend se dice **el servicio**, que además es como se llama en el
  código —`defineService`, `useService`—, así que la prosa queda pegada al identificador.

  El código no cambia: `DemoClient` está en inglés y no choca con nada. **El choque es sólo en
  castellano**, que es donde la palabra ya está ocupada.

  > **Y la regla es exacta**, que es lo que permite mecanizarla: por el principio III cuarzo no sabe
  > de negocio, así que **no tiene clientes de los otros** — cualquier mención suya en un comentario
  > es la acepción de red. La regla 12 de `packages/core/checks/quality.mjs` falla si aparece. En
  > `docs/` no se mira: ahí las decisiones sí hablan de personas.

- **Nada de estilos propios.** Ni `style={{...}}`, ni `className`, ni hojas de estilo: lo que se ve
  es de granito (principio IV). Si hace falta una disposición que granito no tiene, **es una
  propuesta a granito**. Lo verifica `packages/core/checks/boundaries.mjs`.

- **Y ningún elemento crudo donde granito tiene un componente.** `Page`, `Region`, `Block`, `Alert`,
  `Button`. El HTML suelto queda para lo que granito no cubre — una lista, por ejemplo.

- **Un comentario explica el código que está, no el que estuvo.** Nada de «antes esto era X», «se
  borró porque», «en la primera corrida marcó». **La historia es de git.**

  > Un comentario que narra un cambio **le hace creer a quien lo lee que hay algo que buscar**, y a
  > un agente le da contexto de algo que ya no existe. Y envejece dos veces: cuando cambia el
  > código, y cuando la historia deja de importarle a alguien.
  >
  > La razón de un diseño **sí** va, dicha en presente: «se arma una vez porque un ruteador
  > reconstruido recrea el historial», no «antes se rehacía en cada dibujo». Lo verifica
  > `packages/core/checks/quality.mjs`.

- **Un comentario cita una decisión; no la repite.** Dice **qué significa acá** —«el proveedor lo
  elige la raíz, `CU-36`»— y deja la regla y su razón donde se mantienen.

  > **Una cita resuelve o no; una paráfrasis no tiene contra qué compararse.** Copiar el texto de
  > una decisión al código crea una segunda fuente que nada vigila: se corrige la decisión y el
  > comentario queda diciendo lo viejo. Ya pasó — el comentario de `src/app/composition.tsx` copió
  > tres reglas de `CU-36` y **dos eran falsas contra el código que tenía debajo**.
  >
  > Lo verifica `packages/core/checks/quality.mjs`.

- **Un archivo que usa una pieza no re-argumenta por qué la pieza es así.** Eso vive en la pieza y
  en su decisión; repetirlo manda a leer otra cosa para entender la línea que se tiene delante. El
  síntoma es la densidad de citas: cinco `CU-` en cuarenta líneas es una señal, no un logro.

- **Pero `src/` no es código que se lee: es código que se copia.**

  Es el hola mundo, y su lector —persona o agente— **va a escribir su propia versión**. Ahí un
  comentario tiene otro trabajo: **decir qué poner**, no describir lo que hay.

  | | qué explica un comentario |
  |---|---|
  | `packages/` | Cómo funciona el mecanismo, y qué decisión lo gobierna |
  | `src/` | **Qué va en cada lugar cuando escribas el tuyo**, y qué error se evita |

  > La diferencia entre útil y confuso no es la cantidad: es de qué habla. «El identificador es el
  > del contrato, y de ahí sale el rol que decide si el botón se dibuja» le sirve a quien escribe su
  > acción. «…sería la desincronización que `CU-37` existe para cerrar» le sirve a quien discute el
  > diseño del marco, que no es quien está leyendo esto.
  >
  > **Nada de esto lo verifica una comprobación.** La que hay agarra la copia literal de una
  > decisión, no la explicación de más ni la que falta.

- **Un componente lleva sufijo cuando su tipo tiene un papel en la arquitectura.**

  | | sufijo | |
  |---|---|---|
  | Pantalla registrada por `defineScreen` | **`…Screen`** | `WelcomeScreen`, `CatalogScreen` |
  | Proveedor de contexto | `…Provider` | `SessionProvider`, `AuthorizationProvider` |
  | Diálogo | `…Dialog` | `ReenterDialog` |

  **Sufijo y no prefijo**: se lee en el JSX —`<CatalogScreen />`— y ordena por dominio, que es lo
  que hace falta cuando una funcionalidad tiene seis pantallas.

  **Lo demás no lleva sufijo.** `Frame`, `UserBar` y `Forbidden` ya dicen qué son, y
  `BotónComponent` es ruido. La regla existe para los tipos que **cambian cómo se usa la cosa**, no
  para etiquetar todo.

  **Y el archivo dice lo que exporta**: `welcome-screen.tsx`. Redundante con la carpeta, sí — pero
  con veinte pestañas abiertas la carpeta no se ve, que es el mismo argumento por el que existe el
  sufijo. La declaración comparte el nombre del componente y sólo cambia la caja:
  `welcomeScreen` / `WelcomeScreen`.

  > Lo de `…Screen` lo verifica `cuarzo-check`. Los otros dos no se mecanizan sin falsos positivos,
  > y quedan para la revisión de `TAN-6`.

- **Los nombres que las herramientas reconocen no se traducen.** `README.md`,
  `package.json`, `index.html`, `CHANGELOG.md`. No son palabras en inglés que haya que pasar al
  castellano: son **identificadores** que GitHub, npm y los editores buscan por su nombre exacto.
  **El contenido sí va en castellano.**

- **La prosa va en castellano.** Especificaciones, planes, decisiones y documentos.
- **Sólo desktop**, de 1366×768 a 2560. Sin puntos de corte de móvil.
- **El nombre en clave es del repositorio.** Un paquete lleva el nombre de quien lo publica, no el
  de quien lo usa.

## Gobernanza

Esta constitución **está por encima de cualquier otra práctica**, incluidas las plantillas de Spec
Kit: donde una plantilla pida algo que un principio prohíbe, manda el principio y se ajusta la
plantilla.

Modificarla es una conversación, no una edición: se propone el cambio con su razón, se espera el
OK y se sube la versión.

**Version**: 1.0.0 | **Ratified**: 2026-08-20 | **Last Amended**: 2026-08-20
