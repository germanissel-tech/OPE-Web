# Constitución de OPE-Web

Lo que no se negocia. **Las decisiones de arquitectura no están acá**: viven con su razón en
[`docs/arquitectura.md`](../../docs/arquitectura.md), en [`docs/seguridad.md`](../../docs/seguridad.md)
y en [`docs/ope.md`](../../docs/ope.md), y se citan por identificador —`CU-11`, `OW-4`, `GR-31`—
desde el índice [`docs/decisiones.md`](../../docs/decisiones.md). Acá están las reglas bajo las que
se toma cualquier decisión.

Cada principio va con el daño concreto que evita. **Una regla sin razón se saltea el día que
molesta.**

**De dónde viene esto.** OPE-Web nace de una copia literal de cuarzo, la aplicación base de Tandilia
(commit `9bd4009`), y hereda su constitución. Qué se conserva, qué se enmienda y qué se retira está
en [`docs/origen.md`](../../docs/origen.md); los principios que cambiaron lo dicen en su propio
texto.

## Para quién se escribe esto

**Todo en OPE lo construye, lo evoluciona y lo mantiene un agente.** No es una circunstancia del
momento: es la premisa de la que sale todo lo demás.

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

### I · La spec y el plan se acuerdan; la feature se implementa con autonomía

**Lo que se acuerda con el dueño es la especificación y el plan.** Una vez acordados, dentro de una
feature se implementa **sin esperar el OK por archivo**: el agente escribe, corre las comprobaciones,
commitea tramo por tramo y publica cuando el dueño lo pidió.

**Lo que la spec no alcanza a decir se pregunta con `clarify`**, antes de planificar. Y lo que
aparece en medio de la implementación y la spec no cubre —una decisión que cambia el alcance, una
regla del backend que contradice lo escrito— se pregunta en el momento, no se resuelve en silencio.

> **Por qué cambió.** La constitución heredada pedía proponer cada archivo en el chat y esperar el
> OK, porque en Tandilia se había producido volumen antes de tiempo. En OPE el ciclo es Spec Kit
> entero: la spec y el plan ya son la conversación, y repetirla archivo por archivo duplica el
> acuerdo sin agregar control. Lo que sí se conserva es la regla de fondo: **no producir volumen
> adelantándose al dueño** — una `spec.md` escrita entera sin pasar por el chat sigue siendo el
> mismo error, con más páginas.

### II · Lo que no está decidido se pregunta

Los documentos de decisiones tienen entradas abiertas. **Están abiertas a propósito.** Rellenarlas con
lo que a un agente le parece razonable es elegir por el dueño y presentarlo como si fuera evidente.

Lo que sí sale de acá son **las consecuencias de lo ya decidido**. Que una pantalla necesite cuatro
estados es una conclusión; cuál biblioteca los maneja, no.

### III · `packages/` no sabe de negocio

**Ningún archivo de `packages/` puede saber qué es un merchant, un experimento o un kill switch.**
Eso es de cada aplicación, en `apps/`.

Y tampoco sabe del contrato de OPE en particular: sabe **la forma** —Problem Details, un cursor
opaco, capacidades de un módulo que la aplicación cierra— y no qué operación hay detrás. Lo que se
comparte es la forma de pedir, no qué se pide.

**La regla alcanza a los comentarios.** Un comentario que explica una decisión nombrando un negocio
obliga a quien llega de la otra aplicación a aprender un dominio ajeno para entender un porqué. La
razón se cuenta sin el dominio y dice lo mismo.

### IV · Lo visual es de granito

Colores, tipografía, espaciado, componentes, cómo se ve un importe: **nada de eso se decide acá**.
Si una aplicación necesita algo visual que granito no da, se propone allá — y mientras tanto se
**compone** con sus piezas, sin un estilo propio (`OW-4` es el ejemplo).

Duplicarlo acá sería tener dos fuentes que un día se contradicen, y ganaría la más nueva sin que
nadie lo decida.

### V · Paquete o aplicación, y la prueba es una sola

**¿Si arreglo esto, tiene que llegarles a las dos aplicaciones?**

- **Sí** → `packages/`. La sesión, los permisos, el manejo de errores, la paginación.
- **No** → `apps/<x>`, que se copia de la otra y después diverge. Las carpetas, las pantallas, la
  compilación.

Poner en el paquete lo que debería copiarse convierte cada preferencia de una aplicación en una
discusión con la otra. Y en un monorepo el paquete **no se publica**: llega por workspace, en el
mismo commit.

### VI · Se comparte la puerta, no el proveedor

**La sesión es una puerta** (`CU-10`): autoriza pedidos, mira respuestas y no entrega credenciales.
**Cuál es el adaptador lo elige cada aplicación en su raíz de composición**: la consola entra con
la credencial opaca del operador; el portal elegirá el suyo. La puerta no sabe cuál tiene, y lo
verifica `packages/session/tests/gate.mjs`.

> **Por qué cambió.** La constitución heredada decía que la sesión era la única excepción al
> principio V porque había evidencia de **un mismo proveedor de identidad para todas** las
> aplicaciones de Tandilia. En OPE no lo hay: el operador entra con un token opaco por operador
> (`ADR-031` del backend) y el merchant del portal entrará de otra forma. Lo que sigue siendo
> compartido —y por eso vive en `packages/session`— es la máquina de estados, la regla de que nada
> exportado entrega una credencial, y las vistas de los siete estados.

## Cómo se hace cumplir

**Un documento no asegura nada por sí solo**, y en la familia hay evidencia: granito tiene decenas
de decisiones escritas con su razón, y aun así se publicó sin tipos, una tabla perdió sus columnas y
dos tarjetas quedaron pegadas. Las tres las agarró **una prueba que corre**, no un documento.

Las garantías, de más fuerte a más débil:

| | qué significa |
|---|---|
| **Se genera** | nadie lo escribe a mano, sale de una fuente |
| **No compila** | el tipo hace imposible lo incorrecto |
| **Se hereda** | se empieza copiando la aplicación modelo, no armando |
| **Lo agarra una prueba** | una comprobación que corre con `npm test` |
| **Lo mira una persona** | lo último, para lo que ninguna máquina ve |

**Un documento no está en la lista.** Es lo que hace posibles las cinco, y no reemplaza a ninguna.

De acá sale una obligación concreta para toda especificación: **una `spec.md` que no termine en
algo que se genere, que no compile, que se herede al copiar o que agarre una prueba, está
incompleta.** El plan tiene que decir cuál de las cinco la sostiene.

Y lo que no se puede asegurar conviene decirlo: que una pantalla componga bien, que el texto diga
lo que tiene que decir, y que un nombre sea el correcto. Eso lo mira una persona, siempre.

## Convenciones

- **El código va en inglés; el castellano es sólo para los comentarios.** Nombres de funciones, de
  tipos, de parámetros y de variables, incluidos los locales. También los nombres de archivo de
  código, y las claves de `config.json`.

- **Nada de estilos propios.** Ni `style={{...}}`, ni `className`, ni hojas de estilo: lo que se ve
  es de granito (principio IV). Si hace falta una disposición que granito no tiene, **es una
  propuesta a granito**. Lo verifica `packages/core/checks/boundaries.mjs`.

- **Y ningún elemento crudo donde granito tiene un componente.** `Page`, `Region`, `Block`, `Alert`,
  `Button`. El HTML suelto queda para lo que granito no cubre — una lista, por ejemplo.

- **Tandilia es sólo lectura.** Granito y cuarzo se leen desde sus carpetas hermanas y no se tocan:
  ni compilar, ni instalar, ni publicar, ni commitear ahí. Lo que haga falta cambiar de granito es
  una propuesta anotada en `docs/ope.md`, que el dueño lleva desde granito.

- **Un comentario explica el código que está, no el que estuvo.** Nada de «antes esto era X», «se
  borró porque», «en la primera corrida marcó». **La historia es de git.**

  > Un comentario que narra un cambio **le hace creer a quien lo lee que hay algo que buscar**, y a
  > un agente le da contexto de algo que ya no existe. Y envejece dos veces: cuando cambia el
  > código, y cuando la historia deja de importarle a alguien.
  >
  > La razón de un diseño **sí** va, dicha en presente: «se arma una vez porque un ruteador
  > reconstruido recrea el historial», no «antes se rehacía en cada dibujo». Lo verifica
  > `packages/core/checks/quality.mjs`.

- **Un comentario cita una decisión; no la repite.** Dice **qué significa acá** —«el adaptador lo
  elige la raíz, `CU-36`»— y deja la regla y su razón donde se mantienen.

  > **Una cita resuelve o no; una paráfrasis no tiene contra qué compararse.** Copiar el texto de
  > una decisión al código crea una segunda fuente que nada vigila: se corrige la decisión y el
  > comentario queda diciendo lo viejo. Lo verifica `packages/core/checks/quality.mjs`.

- **Un archivo que usa una pieza no re-argumenta por qué la pieza es así.** Eso vive en la pieza y
  en su decisión; repetirlo manda a leer otra cosa para entender la línea que se tiene delante. El
  síntoma es la densidad de citas: cinco `CU-` en cuarenta líneas es una señal, no un logro.

- **Pero `apps/console/src/features/` es código que se copia, no sólo que se lee.**

  El hola mundo y su lector —persona o agente— **va a escribir su propia versión**. Ahí un
  comentario tiene otro trabajo: **decir qué poner**, no describir lo que hay.

  | | qué explica un comentario |
  |---|---|
  | `packages/` | Cómo funciona el mecanismo, y qué decisión lo gobierna |
  | `apps/` | **Qué va en cada lugar cuando escribas el tuyo**, y qué error se evita |

- **Un componente lleva sufijo cuando su tipo tiene un papel en la arquitectura.**

  | | sufijo | |
  |---|---|---|
  | Pantalla registrada por `defineScreen` | **`…Screen`** | `WelcomeScreen`, `MerchantsScreen` |
  | Proveedor de contexto | `…Provider` | `SessionProvider`, `AuthorizationProvider` |
  | Diálogo | `…Dialog` | `ReenterDialog`, `NewMerchantDialog` |

  **Sufijo y no prefijo**: se lee en el JSX —`<MerchantsScreen />`— y ordena por dominio, que es lo
  que hace falta cuando una funcionalidad tiene seis pantallas. **Y el archivo dice lo que exporta**:
  `merchants-screen.tsx`. Lo de `…Screen` lo verifica `ope-check`.

- **Los nombres que las herramientas reconocen no se traducen.** `README.md`, `package.json`,
  `index.html`, `CHANGELOG.md`. Son **identificadores** que GitHub, npm y los editores buscan por su
  nombre exacto. **El contenido sí va en castellano.**

- **La prosa va en castellano.** Especificaciones, planes, decisiones y documentos. Los commits
  también, en formato convencional.
- **Sólo desktop**, de 1366×768 a 2560. Sin puntos de corte de móvil.
- **Un `config.json` nunca lleva una credencial.** El esquema no tiene dónde ponerla, y ésa es la
  garantía: lo que un adaptador necesita lo recibe el adaptador.

## Gobernanza

Esta constitución **está por encima de cualquier otra práctica**, incluidas las plantillas de Spec
Kit: donde una plantilla pida algo que un principio prohíbe, manda el principio y se ajusta la
plantilla.

Modificarla es una conversación, no una edición: se propone el cambio con su razón, se espera el
OK y se sube la versión.

**Version**: 2.0.0 | **Ratified**: 2026-08-20 | **Last Amended**: 2026-10-08
