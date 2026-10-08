# Arquitectura de una aplicación de frontend de Tandilia

Cada decisión con su razón. **El valor sin la razón se cambia por capricho seis meses después**, y
ésa es la mitad que importa.

Lo que está **abierto** figura como abierto. No se rellena con lo que a alguien le parece: se
decide y se anota, igual que la identidad visual en granito.

---

## Lo que ya está decidido

Estas no son nuevas: salen de decisiones que ya se tomaron en granito y valen para toda aplicación
que lo consuma. Se listan acá porque **una decisión que hay que ir a buscar a otro repo no se
cumple**.

### CU-1 · Una pantalla a la vez, y sin apilar

**Estado**: decidida

Se abre una pantalla y reemplaza a la anterior. **No hay pila de pantallas**, ni pantallas
flotando sobre pantallas.

La razón: una pila obliga a decidir cuántos niveles se permiten, qué pasa con el botón de atrás del
navegador en el nivel tres, y qué se recarga cuando se cierra el de arriba. Ninguna de las tres
tiene una respuesta buena, y las tres aparecen el día que hay tres niveles abiertos.

Si algo necesita abrirse *sobre* lo que se está mirando, es un **diálogo**, y un diálogo no decide
nada: pide una respuesta y la devuelve.

> Granito, GR-36 y GR-42.

### CU-2 · La pantalla declara; el shell coloca

**Estado**: decidida

Una pantalla dice **cuál es su título y sobre qué está parada**. No dibuja la barra de arriba, no
sabe dónde está el nombre del usuario, y no conoce la navegación.

La razón: si cada pantalla pintara su encabezado, cada una tendría que saber cómo está armado el
marco, y cambiar el marco sería tocar todas las pantallas.

> Granito, GR-35.

### CU-3 · Lo que un permiso no habilita, no se muestra

**Estado**: decidida

No se muestra deshabilitado: **no se muestra**. Un botón gris que el usuario no va a poder usar
nunca es ruido permanente, y encima le hace creer que le falta algo.

Deshabilitar es para lo transitorio —mientras se guarda, mientras falta un dato—, no para lo que
depende de quién sos.

> **Tiene un tercer estado**, que no viene de granito: una acción que el operador no puede ejecutar
> pero **sí puede pedir**. Ver la decisión CU-13, en [`seguridad.md`](seguridad.md).

### CU-4 · Toda pantalla que trae datos tiene cuatro estados, no uno

**Estado**: decidida

**Cargando · con datos · vacío · error.** Y el vacío se parte en dos cuando corresponde: *no hay
nada todavía* no es lo mismo que *los filtros no dan resultados*, porque la salida de uno es crear
y la del otro es limpiar los filtros.

El error **muestra el identificador del pedido**. Es lo único que convierte «no anda» en algo
diagnosticable.

> Granito, GR-16 a GR-20.

### CU-5 · Un formulario tiene tres estados

**Estado**: decidida

**Edición · sólo lectura · guardando**, más **cargando** mientras el dato no llegó. Y sólo lectura
no es un formulario deshabilitado: el control no existe, se muestra el valor.

> Granito, GR-30 y GR-48.

### CU-6 · El formato de un dato se define una sola vez

**Estado**: decidida

Un importe se ve igual en un formulario, en una grilla y en un reporte porque los tres pasan por la
misma función. Ninguna pantalla formatea a mano.

> Granito, GR-31.

---

## Lo que se decidió acá

Estas no se heredan de granito: se decidieron para las aplicaciones. Van con su razón por lo mismo
que las otras — el valor sin la razón se cambia por capricho seis meses después.

### CU-7 · De dónde sale granito

**Estado**: decidida

> **Enmienda OPE (2026-10-08).** granito llega por `file:` a la carpeta hermana de Tandilia (`../../../../Bitbucket/Tandil Stone Pulse/tandilia/granito/packages/*`) hasta que esté publicado en npm; esa carpeta es **sólo lectura** desde OPE. Lo demás de esta decisión no cambia. Ver `docs/origen.md`.

De **npm público**: `@granito/tokens` y `@granito/ui`, bajo la organización `granito`. No es
software libre —la licencia es propietaria—; el registro público es el estante, no una cesión de
derechos.

Se descartó el registro de paquetes de Bitbucket, que existe y funcionaría: pide un plan pago
mensual y **todavía no tiene versiones inmutables**. npm no deja pisar una versión publicada, que
es exactamente lo que se estaba buscando al versionar.

**La consecuencia para una aplicación** es lo que escribe en su `package.json`:

```json
"@granito/tokens": "^0.1.0",
"@granito/ui": "^0.1.0"
```

**Los dos, siempre.** `ui` no empaqueta los tokens adentro: las variables CSS y los números salen
de la copia que instala la aplicación, y así son la misma. Y hacen falta los dos `import` de CSS
—primero el de tokens, que define las variables; después el de ui, que las usa—. Si falta el
primero no hay error: hay una pantalla con los colores del navegador.

**Mientras granito sea `0.x`, `^0.1.0` no trae `0.2.0`.** Eso no es un descuido de npm, y conviene
aprovecharlo: en `0.x` cualquier versión menor puede romper, y para un sistema de diseño **un
cambio visible es un cambio que rompe** aunque compile. Un espaciado corregido mueve todas las
pantallas sin que nadie las toque. Una aplicación sube de versión a propósito y mirando, nunca por
arrastre de un `npm install`.

> Cómo se versiona y se publica está en `granito/docs/publicacion.md`.

### CU-8 a CU-13 · Seguridad: la sesión, la autenticación y los permisos

Estas seis viven en **[`seguridad.md`](seguridad.md)**, su propio documento. Se separaron cuando
pasaron a ser dos tercios de todo lo decidido, y van a seguir creciendo.

**La numeración es una sola para los dos archivos**: la decisión CU-11 es la 11 esté donde esté.

| | |
|---|---|
| **CU-8** | La sesión se renueva sola, en silencio |
| **CU-9** | Volver a entrar no descarga la página |
| **CU-10** | La autenticación entra por una puerta; hoy es Keycloak |
| **CU-11** | Una sola autenticación, un token por aplicación |
| **CU-12** | Salir de una es salir de todas |
| **CU-13** | Una acción puede pedir la autorización de otra persona |

La entrada abierta **CU-18 · Cómo viaja una autorización por excepción** también está allá, junto a las
decisiones de las que depende.

### CU-14 · Cómo se piden los datos

**Estado**: decidida · **Depende de**: CU-9, CU-10

> **Enmienda OPE (2026-10-08).** OPE responde el recurso **pelado** y errores **Problem Details** (RFC 9457): el sobre `{ data, meta }`, `error.code` y `fields` de las-animas se reemplazan en el núcleo por `type`, `detail` y `errors[{ pointer, message }]` (`OW-3`). Pagina por **cursor opaco y sin total** (`ADR-020` del backend): no hay número de página ni tamaño que el servidor devuelva, y «cargar más» acumula tramos (`OW-4`). Lo que no cambia: quién cachea, qué se cancela, y que filtrar y paginar es del servidor.

Buena parte de esto **no se elige: se hereda del contrato**. Se anota igual, porque una decisión
que hay que ir a buscar a otro repositorio no se cumple.

### Lo que el contrato dice, no se copia — y ya pasó tres veces

**Agregado el 2026-08-23**, después de la tercera.

| lo que se sabía en el contrato | cómo se copiaba | cómo quedó |
|---|---|---|
| Qué rol exige cada operación | Escrito a mano en el frontend | Se genera (`CU-37`) |
| Cuáles exigen clave de idempotencia | Una casilla que nadie ponía | Se genera (`CU-34`) |
| **Cuántos por página** | `const PAGE_SIZE = 20`, **y un `?? 20` aparte** | No se escribe |

**Y se revisó el backend entero buscando el resto**, en vez de esperar al quinto. Lo que declara:

| lo que el contrato sabe | cuántos | qué pasa si se copia |
|---|---|---|
| **Qué es un campo** — `Amount`, `Percentage`, `format: date`, enteros | **233** | El mismo importe se ve distinto en dos pantallas |
| **Rangos** — `minimum`, `maximum` | 56 | Un formulario valida la forma y deja pasar el rango |
| Valores de un enum de dominio | 10 enums | Un valor nuevo del backend no aparece en el desplegable |
| Códigos de error | 25 | Una rama que nadie escribió |

Los dos primeros **se derivan**: `tests/constraints.mjs` emite el rango y el `displayAs` en el
vocabulario de granito, así que una columna escribe `format: articleFields.price.displayAs` y no
elige. La frase que lo justifica es de granito, sobre su propio `Column.format`:

> «Sin esto, cada grilla se reescribe el formateo en su `cell`, **y así es como el mismo importe
> termina viéndose distinto en dos pantallas**.»

> Y no era hipotético: **el hola mundo ya tenía un `format: 'money'` escrito a mano**, puesto ese
> mismo día.

Los dos últimos **no necesitan maquinaria, sino una forma de escribirlos**: `openapi-typescript` ya
emite el tipo unión, así que un `Record<AccountEntryType, string>` **no compila si falta un valor**,
y la lista para un desplegable sale de sus claves. Escribir el arreglo a mano es lo que hace que un
valor nuevo del backend simplemente no aparezca.

El tercero lo señaló granito, desde afuera y antes de que doliera:

> «`pageSize` es el tipo de valor que termina escrito en cinco pantallas. Si el backend de un
> sistema pagina de a 20, ese 20 no es de granito ni de cada pantalla. **Lo que se sabe en un lugar
> y no se publica, se copia.**»

Tenía razón, y de más: el 20 **ya estaba escrito dos veces** cuando lo dijo, con una sola grilla en
todo el repositorio.

**El tamaño de página es del servidor.** Lo declara en el contrato —`default: 20`— y **dice cuál
usó** en cada respuesta, porque su `PageMeta` declara `size` requerido. Así que no se manda y no se
supone: mandarlo es una decisión explícita de esa pantalla —una lista compacta de 50—, no el valor
por omisión copiado.

**Y los cuatro campos de paginación se preguntan juntos.** El contrato los da todos o ninguno;
tratarlos de a uno obliga a inventar un valor por omisión para cada uno, **y ahí es exactamente
donde se copió el 20**. Lo verifica `packages/core/tests/table.test.tsx`, con un sobre a medias que
no se dibuja en vez de completarse solo.

### Los tipos se generan, no se escriben

Cada backend emite los tipos del frontend con `openapi-typescript` desde **su** contrato, y una
aplicación puede consumir varios (CU-22). **Ninguna aplicación escribe a mano el tipo de una
respuesta.** Es la garantía más fuerte de las cinco: se
genera.

### Se pide con `openapi-fetch`

El runtime hermano de `openapi-typescript`: consume los mismos tipos generados, no emite código de
servicio, y pesa unos pocos kB.

Lo que importa no es el tamaño: **un endpoint que cambia en el contrato deja de compilar.** Eso
mueve la ruta, el cuerpo y la respuesta a la segunda garantía —no compila— en vez de dejarlas
libradas a que alguien lea el changelog del backend.

### Guarda TanStack Query

Porque resuelve de fábrica las cuatro que ya sabíamos que hacían falta: **cancelar** cuando el
operador se va de la pantalla antes de que llegue, **cachear los catálogos**, **reintentar
lecturas y no escrituras** (CU-9), y sostener los cuatro estados de CU-4.

Los catálogos son el caso concreto de caché, y el contrato lo hace evidente: hay un recurso de
primer nivel por catálogo —`/branches`, `/banks`, `/localities`, `/currencies`, `/payment-plans`—
y **un formulario de alta abre necesitando varios a la vez**. Guardarlos es la diferencia entre
abrir con una llamada o con cinco.

### Lo que la capa hace siempre, y sale del contrato

- **Desenvuelve `{ data, meta }`**, incluso para un recurso solo.
- **Lleva `meta.requestId` hasta el error que se muestra.** CU-4 lo exige y el contrato ya lo
  manda en toda respuesta: no hay que inventarlo, hay que no perderlo por el camino.
- **Ramifica por `error.code`**, que es un enum cerrado, **nunca por `message`**, que es castellano
  para una persona y puede cambiar sin aviso.
- **Mapea `error.fields`** a los campos del formulario que lo pidió.
- **Pagina con `?page=&size=`** contra el servidor, con `totalItems` y `totalPages`. La grilla no
  pagina ni ordena por su cuenta.

### No hay suscripciones

El contrato **no tiene push**: ni websockets, ni eventos servidos, ni nada que empuje. Un proceso
largo se modela como *corrida* —ADR-010 del backend—: responde `202` con el identificador, y el
panel **consulta el estado hasta `COMPLETED` o `FAILED`**.

Así que no hay suscripciones que administrar: **hay consultas que se repiten mientras haga falta**, y
eso TanStack Query lo enciende y lo apaga solo con el ciclo de vida del componente. Se «suscribe» al
montar, se «desuscribe» al desmontar, y deja de repetir cuando la corrida termina.

Una categoría entera de maquinaria que no hace falta escribir.

**Esto es sobre el transporte, no sobre el producto.** Que no haya push no significa que no haga
falta avisarle nada al operador: las notificaciones que sobreviven y se acumulan son CU-39, y
también se resuelven consultando — porque ninguno de sus casos es urgente al segundo.

### Los dos ganchos de la sesión

**El autorizador.** La capa no sabe qué es un token: recibe de la puerta (CU-10) algo que autoriza
el pedido y lo aplica. Si mañana el proveedor deja de usar un *bearer*, esto no se entera.

**El reintento.** Después de reingresar, **las lecturas se vuelven a pedir solas y las escrituras
no** (CU-9). TanStack Query ya no reintenta mutaciones por omisión, y **eso no se cambia**: quien
lo active estaría reejecutando una operación que nadie volvió a pedir.

Y si alguna vez una escritura sí se reintenta, **tiene que llevar `Idempotency-Key`**, que el
contrato ya define. Sin eso, un reintento es una operación duplicada.

### Una cosa que hay que aceptar, no arreglar

La paginación es por página y no por cursor, y el backend lo eligió sabiendo el costo: **con el
legacy escribiendo sobre la misma base, una fila puede repetirse o saltearse al cambiar de
página.** Está asumido del otro lado.

Acá el efecto se amplifica, porque una página cacheada puede mostrar algo que ya no es cierto.
**No es un defecto de esta capa y no se arregla desde acá.** Conviene que esté escrito para que
nadie lo persiga: si molesta, se discute el cursor con el backend.

### Lo que no se decide acá

**Dónde viven estos archivos** — eso es CU-15. Y el servidor simulado de Prism en `:4010` permite
probar toda esta capa sin backend, que es lo que la hace verificable antes de que exista una
pantalla.

### CU-20 · Cuarzo es la aplicación base, y se clona

**Estado**: decidida · **Depende de**: CU-7

> **Enmienda OPE (2026-10-08).** OPE-Web nace de la copia literal de cuarzo (`9bd4009`) y es un monorepo: la aplicación base es `apps/console`, y la segunda aplicación **la copia adentro del mismo repositorio** según `docs/segunda-aplicacion.md` en vez de clonar entre repositorios (`OW-1`). El ritual de clonar (`tests/clone.mjs`) se retiró.

**Cuarzo es una aplicación que corre y no sabe de ningún negocio.** Autentica, navega, muestra los
cuatro estados, trata errores, exporta archivos y sigue procesos largos.

No es un repositorio de documentos con un esqueleto adentro. **El criterio de que está listo es que
se pueda levantar**: arranca, manda a autenticar, vuelve, dibuja el marco con su navegación, y una
pantalla de ejemplo con sus cuatro estados y su error.

**Empezar una aplicación es partir de cuarzo** y agregar tres cosas: las pantallas, los servicios
que hablan con su backend, y las reglas de su negocio. Nada más.

#### Por qué

Para que las aplicaciones de Tandilia salgan **iguales en todo lo que no es su negocio**. No
parecidas: iguales. Un operador que pasa del panel al punto de venta encuentra la misma navegación,
los mismos estados y los mismos errores, y quien construye la segunda no vuelve a decidir nada de
eso.

#### Qué viaja por copia y qué por paquete

Cuarzo es **las dos cosas a la vez**, y el reparto se decide pieza por pieza con la prueba del
principio V: *si arreglo esto, ¿tiene que llegarles a todas?*

| | por qué |
|---|---|
| **Por copia** — la estructura de carpetas, el ruteo, la navegación, la configuración de compilación | Son **la forma de la aplicación** y divergen legítimamente. Una biblioteca que impone los nombres de las carpetas es una molestia, no una garantía |
| **Por paquete** — la sesión, y lo que se pruebe transversal | Un defecto ahí tiene que llegarles a todas. Copiado, se arregla cuatro veces — o tres, y la cuarta se olvida |

El paquete **se publica desde cuarzo**, y el esqueleto ya lo trae en su `package.json`: clonar,
renombrar, `npm install`, y la sesión anda sin escribir una línea.

#### Lo que lleva, y de dónde sale la evidencia

Ninguna de estas es una suposición. Es lo que permite construirlas **antes** de tener una
aplicación, sin caer en la trampa del primer consumidor:

| pieza | evidencia |
|---|---|
| La sesión | El mismo proveedor de identidad para todas — CU-8 a CU-12 |
| El marco y la navegación | CU-1 y CU-2; granito ya tiene `AppShell` y `NavList` |
| Los cuatro estados | CU-4, y granito los implementa |
| La forma de pedir | CU-14, más el envelope y la paginación del contrato |
| El tratamiento de errores | El contrato fija la forma: `code` de enum cerrado, `fields`, y `requestId` en toda respuesta |
| La exportación de archivos | **ADR-008** del backend la define como convención transversal: `GET …/export/{format}` en pdf, csv y xlsx |
| Los procesos largos | **ADR-010**: se modelan como *corrida*. Una liquidación tarda minutos y la pantalla tiene que seguirla |

#### Lo que NO lleva todavía

- **La estrategia de logging.** No hay dónde mandar un log de frontend ni quién lo mire. Sin destino
  es invención pura, y entra recién cuando exista uno.
- **Una pantalla de ingreso propia.** Con OIDC la muestra el proveedor: cuarzo redirige y recibe. Lo
  que sí es nuestro está en `specs/001-la-sesion`.

#### Y lleva sus propias instrucciones

El clon incluye `CLAUDE.md`, `.specify/` con la constitución, y la prueba de decisiones.

No es prolijidad: **todo en Tandilia lo construye, lo evoluciona y lo mantiene un agente**, y un
agente arranca cada sesión en frío. Si las reglas no viajan con el esqueleto, la aplicación nueva
las tiene que recibir de alguien que se acuerde. Con esto, **el estándar se hereda** — que es la
tercera garantía de la lista, y la única que no depende de que nadie se acuerde de nada.

**Y llega listo para trabajar con SDD.** El clon trae Spec Kit andando —sus skills, sus plantillas
y las nuestras—, así que la aplicación nueva especifica antes de construir desde el primer día, sin
que nadie instale ni configure nada.

Con dos detalles que el ritual de clonar tiene que resolver, porque son de los que se olvidan:

- **`specs/` llega vacío**, y `.specify/feature.json` sin apuntar a nada. Si vinieran con las
  especificaciones de cuarzo, la aplicación nueva arrancaría con la spec de otro.
- **Las skills propias entran al barrido de la prueba.** Hoy `.claude/` está salteado a propósito
  —las de Spec Kit vienen en inglés y con su propia numeración—, pero una skill nuestra que cite
  `CU-3` el día que esa decisión cambie es exactamente el defecto que la prueba existe para agarrar.

**Qué skills lleva es `CU-21`**, y está abierta.

### CU-15 · La estructura y la configuración de un proyecto

**Estado**: decidida · **Depende de**: CU-14, CU-20, CU-22

Cómo están organizadas las carpetas de una aplicación de Tandilia, y con qué está configurada. Se
decide una vez y **se hereda al clonar**, así que un error acá se paga en las cuatro.

#### Por funcionalidad, con los nombres de la aplicación

```
src/
├── app/                  rutas, proveedores, el shell armado
├── features/             por lo que hace LA APLICACIÓN
│   └── <funcionalidad>/
│       ├── pantallas
│       ├── componentes
│       └── data/        ← compone y adapta lo que viene de las APIs
├── api/                  una carpeta por SISTEMA
│   ├── las-animas/       tipos generados, servicio, emisor
│   └── centinela/
├── components/           lo compartido de esta aplicación
├── lib/                  la sesión, el formateo, lo transversal
└── testing/              utilidades y dobles
```

**Por funcionalidad y no por tipo**, porque con veinte pantallas —las que ya tiene especificado el
panel— agrupar por tipo deja cada funcionalidad desparramada en cuatro carpetas de veinte archivos.
Y porque la agrupación por funcionalidad **ya existe** en tres documentos que no se pusieron de
acuerdo entre sí: las notas del panel están numeradas por grupo, la navegación sigue esos grupos, y
el backend se organiza por contexto acotado.

**Los nombres son los de la aplicación, no los del contrato.** `companies` y `settlements` son el
vocabulario del transporte de **un** sistema; una funcionalidad puede componer dos.

#### Cómo se nombra · **agregado el 2026-08-24**

Tres reglas, y la tercera se comprueba.

**1 · Una funcionalidad es una capacidad, no una entidad ni un lugar.** Lo que la aplicación *hace*
para el operador. `catalog`, `receiving`, `dispensing` — no `articleManager` ni `home`.

Nombrar por entidad produce lo que la bibliografía llama *entity-driven*: cada pantalla termina
tocando la «entidad dios» y el sistema se acopla. Nombrar por lugar —`home`, `dashboard`— no dice
nada de lo que hace.

> **Cuáles son las de Tandilia no las decide cuarzo.** Las veinte notas del panel ya están
> agrupadas, y esta decisión dice arriba que esa agrupación existe en tres documentos. Acá se fija
> **la forma**: inglés, kebab-case en la carpeta, y sin sufijo —`catalog`, no `catalogFeature` ni
> `catalog-module`—.

**2 · Una pantalla se nombra por lo que muestra, nunca por su forma.** `articles` y `article`, no
`catalogGrid` ni `catalogForm`. El plural es la lista, el singular es uno.

La forma cambia y el dominio no: el día que esa grilla pase a ser tarjetas, un nombre con `Grid`
obliga a renombrar o a mentir. Es la regla que más consenso tiene afuera, y la que este repositorio
estaba incumpliendo.

**El título es otra cosa.** «Catálogo» es la palabra del operador y va donde se ve; el nombre es
código y va en inglés (constitución). Que no coincidan no es un problema — que el código nombre la
forma, sí.

**3 · Los tres nombres de una pantalla coinciden.**

```
id: 'article'   ·   articleScreen   ·   article-screen.tsx   ·   ArticleScreen
```

Sin esto, buscar por el nombre que uno recuerda no encuentra el archivo. Pasó: `id: 'catalogForm'`
vivía adentro de `article-screen.tsx`, con el componente `ArticleScreen` y el título «Ficha del
artículo» — **tres nombres para una pantalla y uno distinto de los otros dos**.

Lo verifica `cuarzo-check`, y es lo único de las tres que una máquina puede ver: las otras dos son
criterio, y quedan escritas para que se discutan en la revisión.

#### Dónde vive una prueba · **agregado el 2026-08-24**

**En `src/`, al lado de lo que prueba**: `articles.ts` y `articles.test.ts` en la misma carpeta.

Es la misma razón por la que la estructura es por funcionalidad y no por tipo: **una funcionalidad
tiene que poder borrarse entera**, y con las pruebas en otro lado se borra la mitad. Además, lo que
se mueve junto se mueve junto — renombrar una carpeta no deja una prueba apuntando a un vecino que
ya no está.

Y `testing/` sigue siendo lo que dice el árbol —utilidades y dobles—, no un depósito de pruebas.

**Los paquetes hacen lo contrario, y por una razón que la aplicación no tiene**: en
`packages/<x>/tests/`, separado, porque **lo que está en `src/` se publica**. Una prueba al lado
viajaría adentro del paquete y engordaría lo que cada aplicación instala. Que sean dos convenciones
distintas es incómodo, y la alternativa —una sola— o mete pruebas en lo publicado o parte la
funcionalidad en dos carpetas.

**Lo sostiene una comprobación**: en `src/`, un `X.test.ts` sin un `X.ts` al lado falla. Agarra las
dos formas de romperlo —juntarlas en una carpeta aparte, y dejar una prueba huérfana cuando lo que
probaba se borró—.

#### La regla que lo sostiene

Las dependencias van en **una sola dirección**: `lib` y `components` → `features` → `app`.

Y una más, que es la que importa acá: **sólo `features/<x>/data/` importa de `api/`.**

Una pantalla nunca ve un tipo generado ni sabe de qué sistema vino el dato. Si mañana un endpoint
se parte en dos, o una funcionalidad pasa a componer dos backends, **se toca una carpeta**. Es la
capa anticorrupción del frontend, y nos toca a nosotros: el backend tiene la suya contra el legacy
(ADR-001) y **ninguna contra nosotros, a propósito**.

**Nada de importar entre funcionalidades**: se componen en `app`. Y **nada de archivos barril**,
que rompen el sacudido de árbol.

#### Por qué no Clean Architecture completa

Se evaluó, y la conclusión es que **se toma el principio y no la ceremonia**.

Lo que se toma: la **dirección de dependencias** —que es literalmente la regla de dependencia— y
que **un componente no hable HTTP directamente**.

Lo que no: entidades, casos de uso y repositorios que espejen el dominio de un backend. Ese dominio
**no es nuestro**: el contrato es la fuente de verdad (ADR-007), las invariantes se declaran ahí
(ADR-009) y los tipos se generan (CU-14). Modelarlo de este lado sería una segunda fuente de verdad
para lo mismo.

Lo que sí es nuestro es **la composición**, y por eso tiene carpeta propia en vez de estar diluida.

#### La configuración

| | |
|---|---|
| **TypeScript** | Lo de granito —`strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, destino `ES2022`— **más prohibir `any` explícito**. Con los tipos del contrato generados, un `any` casi siempre significa que alguien se salteó el contrato |
| **Pruebas** | **Vitest con Testing Library.** Vitest comparte la configuración de Vite, así que no hay una segunda cadena de compilación. Y Testing Library obliga a probar lo que el operador ve y hace, en vez del estado interno — que es lo que hace que una prueba sobreviva a un refactor |
| **Linter y formateador** | Biome. Ver CU-16 |

#### Cómo se hace cumplir

La regla unidireccional **no la puede verificar Biome**: su `noRestrictedImports` no acepta patrones
y `noPrivateImports` trabaja con etiquetas de visibilidad, no con zonas de rutas (CU-16).

Así que la sostiene **una comprobación propia**, que recorre los `import` y verifica la dirección.
Son unas decenas de líneas, hay precedente en este mismo repositorio, y sale más precisa que un
complemento genérico porque codifica **nuestras** capas y no unas cualquiera.

Sin ella, la regla vuelve a «lo mira una persona», que es lo último de la lista — y una regla de
capas que nadie verifica dura hasta el primer apuro.

### CU-16 · El linter y el formateador

**Estado**: decidida · **Depende de**: CU-15

**Biome**: un solo binario que hace las dos cosas, con una sola configuración y mucho más rápido en
cada guardado. Trae reglas de React y de accesibilidad incorporadas.

Se eligió sobre ESLint más Prettier —que es lo estándar y tiene complemento para todo— porque dos
herramientas son dos configuraciones que hay que mantener sin que se pisen, y porque la velocidad
importa cuando quien edita es un agente que guarda muchas veces.

**Y granito no tiene ninguno de los dos.** Que la aplicación sea más cuidada que la biblioteca que
consume es la rareza que la versión anterior de esta decisión pedía justificar o evitar. Se acepta
por ahora: granito compila con el mismo `strict` y sus cuatro pruebas cubren lo suyo. Si molesta,
se le propone Biome también — es una decisión de aquel repositorio, no de éste.

#### El hueco, declarado

**Biome no puede verificar límites entre carpetas.** `noRestrictedImports` no acepta patrones, y
`noPrivateImports` trabaja con etiquetas de visibilidad en JSDoc y no con zonas de rutas. Hay una
discusión abierta pidiendo exactamente esto.

O sea que la regla unidireccional de CU-15 **no la cubre el linter**, y la sostiene una comprobación
propia. Queda dicho acá para que nadie suponga que el linter la está mirando.

### CU-22 · Un token por sistema, y el frontend compone

**Estado**: decidida · **Depende de**: CU-10, CU-11

Una aplicación de Tandilia puede consumir **varios backends** —`las-animas`, `centinela`, `tigre`
son sistemas separados— y **el frontend es quien los junta**.

Es consecuencia de que el backend se construya **API first**: se diseña para el recurso y no para la
pantalla, así que una pantalla casi nunca es un endpoint. Y ningún backend sabe de los otros, así
que el único lugar donde cosas de distintos sistemas se encuentran es de este lado.

Se descartó que el backend propio expusiera lo que la pantalla necesita: sería hacerlo crecer con un
endpoint **que existe porque una pantalla lo pide**, que es justo lo que API first evita.

#### Un token por sistema, nunca uno con todo

Cada llamada lleva **el token de su destino**, con las capacidades de ese sistema y nada más.

Un token que cargue las capacidades de fidelización dentro de la aplicación de cuenta corriente es
**superficie que nunca se ejerce**, y rompe el aislamiento que el backend eligió a propósito: sus
roles son de client, y ADR-006 lo celebra con estas palabras — «un token de telemetría no trae esa
clave».

#### No hace falta maquinaria nueva

CU-10 ya dice que **la puerta autoriza el pedido y nunca entrega un token**. Alcanza con que la
puerta sepa **a qué sistema va** el pedido y aplique el que corresponde. Es el mismo mecanismo, por
destino en vez de por aplicación, y quien llama sigue sin ver nada.

En la estructura, cada sistema tiene su carpeta bajo `api/` con su servicio y su emisor (CU-15).

#### Lo que hay que confirmar

**Que el proveedor pueda emitir un token por sistema desde la misma sesión.** Es configuración del
realm y no la decidimos nosotros. Si resultara que no se puede, esta decisión se cae y hay que
volver a las otras dos salidas — que el backend componga, o que sean aplicaciones distintas.

Mientras tanto, `specs/001-la-sesion` está escrita para **un solo sistema**, y así queda dicho ahí.

### CU-17 · Compilación y despliegue

**Estado**: decidida · **Depende de**: CU-10, CU-11, CU-15

#### La configuración se resuelve al arrancar, no al compilar

La aplicación **lee un archivo de configuración al iniciar**, antes de dibujar nada. De ahí salen el
emisor, las URLs de cada sistema, y los valores que CU-9 y CU-15 dejaron configurables.

**Una sola compilación se promueve de pruebas a producción sin recompilar.** Es lo único que
garantiza que lo que se despliega es exactamente lo que se probó.

Con Vite, `import.meta.env` se resuelve al compilar, así que hornear el emisor obligaría a una
compilación por entorno. Eso choca con dos cosas ya escritas: **CU-10 dice que el emisor es
configuración y no código**, y el contrato del backend avisa que el hostname cambia si el panel se
publica fuera de la red interna.

**Si la configuración no llega, la aplicación no arranca, y lo dice.** No sigue con valores por
omisión: un emisor mal configurado tiene que fallar al arrancar y diciéndolo, no en el primer pedido
con un `401` que manda a buscar el problema donde no está.

#### Se levanta sin red interna

Con el servidor simulado que el backend ya publica —Prism en `:4010`— y **la implementación falsa de
la sesión** que CU-10 exige para las pruebas.

Eso tiene una consecuencia que vale más de lo que parece: **la falsa deja de ser un artefacto de
prueba y pasa a ser el modo de desarrollo**. Se ejerce todos los días en vez de casi nunca — que era
justo la debilidad que CU-10 le señalaba.

Y significa que **el criterio de CU-20 —que cuarzo se pueda levantar— no depende de ninguna de las
preguntas que esperan a la VPN.**

**Y para ejercitar el protocolo de verdad**, el proveedor de identidad local. **No es de cuarzo**:
es de la plataforma (`TAN-2`), porque el mismo realm lo tienen que usar los backends para validar.

#### Lo que el servidor tiene que hacer

**Devolver `index.html` para toda ruta que no sea un archivo.** Es una sola aplicación con ruteo del
lado del navegador: sin eso, recargar parado en una pantalla da `404` — y recargar es lo que más pasa,
porque el token vive en memoria (CU-9).

Y el `redirect_uri` que se registre en el proveedor tiene que ser **una ruta real** de esa
aplicación.

> **Y una URL que ninguna pantalla declara cae adentro del marco — agregado el 2026-08-23.** El
> servidor devolviendo `index.html` resuelve que la aplicación arranque; **lo que se ve después es
> otra cosa**, y hasta hoy era el error de React Router: en inglés, para un desarrollador, y **sin
> navegación**. Lo mismo que `CU-30` rechaza para una pantalla que revienta.
>
> **No redirige a inicio**, aunque sea lo que sale primero: llevarlo a otro lado sin decir nada deja
> al operador creyendo que el enlace anduvo y que la aplicación no tiene lo que buscaba.
>
> Lo verifica `packages/core/tests/unknown-route.test.tsx`, y **prueba la estructura y no lo
> dibujado**: lo que se rompe es dónde cuelga la ruta. Hermana de la del marco deja la pantalla en
> blanco; hija, el menú sigue ahí. Las dos «andan» y sólo una deja salir.

#### Sin integración continua todavía

`npm test` local alcanza mientras cuarzo sea documentos y una comprobación. Se agrega cuando haya
código que compilar.

**Se acepta sabiendo que es la debilidad conocida de esta decisión**: con todo construido por
agentes que arrancan en frío cada sesión, una comprobación que sólo corre cuando alguien se acuerda
es la más débil de la lista de garantías. Los dos datos que van a decidir cuándo cambia: el plan
Free de Bitbucket trae **50 minutos de compilación por mes**, y hoy **no hay integración continua en
ningún repositorio de la familia**.

#### Lo que no se decide acá

**Sobre qué se sirve y quién despliega.** Es infraestructura y no la sabemos todavía: queda anotado
junto a las demás preguntas que esperan respuesta de afuera.

### CU-23 · Una pantalla se declara una vez, y navegar es tipado

**Estado**: decidida · **Depende de**: CU-1, CU-3, CU-15

Una pantalla se declara **en un solo lugar** —identificador, título, ruta con sus parámetros,
capacidad requerida y componente— y de ahí el marco deriva **el menú, las rutas y el filtrado**.

Agregar una pantalla es tocar un lugar. Y **CU-3 queda cumplida en los dos lados**: la entrada no
aparece en el menú, y la ruta tampoco deja entrar.

Ese segundo lado no es un detalle. Filtrar sólo el menú deja un agujero conocido: **quien escriba la
URL entra igual**. En una demo no importa; en una aplicación con capacidades de verdad, sí.

> **Enmendada el 2026-08-24 por `CU-47`, en un punto: el menú lateral.** Al menú entra **un flujo**
> y no una pantalla, así que `inMenu` se fue de esta declaración y `section` se mudó al flujo
> —agrupa navegación, y lo que se navega ahora son flujos—. El rótulo del menú se deriva de la raíz
> del flujo, y el flujo puede pisarlo.
>
> **Todo lo demás sigue igual**, incluido lo que importa: la pantalla se declara en un solo lugar, y
> las rutas y el filtrado por capacidad de los dos lados salen de ahí.

#### Navegar es una llamada tipada, no una cadena

```ts
goTo(screens.companyDetail, { id })     // el parámetro equivocado NO COMPILA
```

**Una pantalla se invoca desde el menú o desde otra pantalla, y las dos usan lo mismo.** El menú no
es un mecanismo aparte: es otro llamador.

Lo que compra: un enlace roto **deja de ser posible**, renombrar una ruta es un cambio que el
compilador propaga solo, y quién lleva a quién se encuentra buscando referencias.

> **Se descartó declarar «de dónde se llega a esta pantalla».** La idea era que una comprobación
> avisara de pantallas huérfanas — pero eso es un parche que informa, mientras que la navegación
> tipada **hace imposible el error**. Sube dos escalones en la jerarquía de garantías, de «lo agarra
> una prueba» a «no compila». Y un campo que hay que mantener a mano es un campo que se desactualiza.

#### La puerta del centro de la barra

La declaración **deja lugar para que una pantalla publique algo en el centro de la barra**. Qué puede
publicar es CU-28, y está abierta — pero la puerta se deja ahora, porque abrirla después significa
cambiar la declaración de todas.

#### Al menú lateral entra un flujo, no una pantalla · **enmendado por `CU-47`**

> **Decía**: que cada pantalla declarara `inMenu`, obligatorio y en falso si su ruta tenía
> parámetros —«`/companies/:id` en el menú no significa nada»—.

**Lo que se ofrece es por dónde se entra, y eso es la raíz de un flujo.** Una pantalla interna no
tiene entrada propia porque no se entra por ella: se llega caminando el recorrido. Así que `inMenu`
y `section` se fueron de acá, y el rótulo del menú **se deriva de la raíz**, con el flujo pudiendo
pisarlo.

**La regla que sostenía a `inMenu` se mudó con él**: una raíz de flujo con parámetros no compila, por
la misma razón de siempre —no hay con qué armar su URL—. Es el mismo criterio que `CU-27` fija para
el menú de usuario: **lo que se quita se declara, no se omite**.

Lo que **no** cambió, y es lo que importa acá: la pantalla se sigue declarando en un solo lugar, y de
ahí salen su ruta y el filtrado por capacidad de los dos lados.

> **Y antes de `CU-47` lo decidía `buildMenu` sin decirlo**: descartaba las rutas con parámetros en
> una línea, así que una pantalla quedaba declarada, no aparecía, y para entender por qué había que
> leer el código del marco. Quien arma el menú sigue sin tener ninguna regla propia.

> **Enlazar a una pantalla de otra funcionalidad ya está resuelto**, y por partida doble: `CU-44`
> puso el desenlace —la pantalla informa qué pasó y no a dónde ir— y `CU-47` lo hizo el único
> mecanismo. Ninguna pantalla nombra a otra, ni de su funcionalidad ni de otra.

#### Lo que la declaración NO decide

**Dónde va la entrada en el menú** puede diferir de la carpeta donde vive la pantalla: el menú
agrupa como se navega y las carpetas agrupan como se construye, y no siempre coinciden. Está
aceptado a propósito (CU-15).

### CU-24 · El marco dibuja los cuatro estados, no la pantalla

**Estado**: decidida · **Depende de**: CU-4, CU-14

La pantalla le entrega al marco **el resultado de la consulta** y declara dos cosas: qué mostrar
cuando hay datos, y qué decir cuando no hay. Todo lo demás lo pone el marco.

```tsx
<Result
  query={companies}
  empty={{ titulo: 'Todavía no hay empresas', accion: <Button>Nueva</Button> }}
  noMatches={{ titulo: 'Ningún filtro coincide', accion: limpiarFiltros }}
>
  {(datos) => <Tabla columnas={…} filas={datos} />}
</Result>
```

#### Por qué no lo dibuja cada pantalla

Porque CU-4 pide dos cosas que **se olvidan**: que el error muestre el identificador del pedido —lo
único que convierte «no anda» en algo diagnosticable— y que **el vacío esté partido en dos**, porque
la salida de «no hay nada todavía» es crear y la de «los filtros no dan» es limpiar los filtros.

Si cada pantalla lo arma, olvidarse no falla: **se ve distinto**, que es peor, porque nadie lo nota.
Con esto, CU-4 pasa de «lo mira una persona» a **«se hereda»**.

#### Envuelve la región del resultado, no la pantalla

Sale de una razón que granito ya midió para `Busy`: **tapar la tarjeta entera deja cero controles
usables**, porque adentro viven también el filtro y las acciones. Si un error tapara la pantalla, le
sacaría al operador justo el control que necesita para corregir lo que falló.

#### Lo que sigue siendo de la pantalla

**Los textos de los dos vacíos**, porque son contenido y el contenido es de la pantalla. Es la misma
regla por la que granito exige `confirmLabel` y no pone «Confirmar» por omisión: un rótulo genérico
obliga a releer el título para entender qué está por pasar.

#### La puerta de escape

Una pantalla con una forma rara puede no usarlo y componer las piezas sueltas. Pero **al no usarlo
se nota**, que es distinto de que nunca se haya sabido que existía.

### CU-25 · Una acción declara qué invalida, y no maneja su propio error

**Estado**: decidida · **Depende de**: CU-4, CU-5, CU-14

Una acción —guardar, anular, correr— declara **qué consultas quedan viejas cuando sale bien**, y el
marco las invalida. Lo demás también lo pone el marco:

| | |
|---|---|
| **Sale bien** | Un aviso flotante, y se invalida lo que la acción declaró |
| **Vuelve `error.fields`** | Los mensajes van **a los campos del formulario** que los pidió (CU-5) |
| **Cualquier otro error** | Un aviso con el **identificador del pedido** |
| **Siempre** | **No se reintenta.** Reejecutar una operación que nadie volvió a pedir es peor que fallar |

#### Por qué la invalidación se declara y no se deriva

Se evaluó derivarla —«una escritura invalida todas las consultas de su funcionalidad»— y se
descartó: **invalida de más**. Registrar un cobro tiraría también el caché de los catálogos, que son
los pedidos más repetidos y los que menos cambian, y eso son llamadas de más en cada acción.

Declararla obliga a pensarlo, que es el punto. El riesgo asumido es declarar de menos, y el síntoma
es sutil: **una pantalla que muestra lo de antes, a veces** — cuando el caché todavía no venció. Por
eso se declara al lado de la acción y no en otro archivo: para que se lea junto.

#### Quién escribe cada texto

**El del éxito lo declara la acción**, porque nadie más sabe qué pasó. Un «Listo» genérico no dice
qué terminó, y con dos acciones seguidas los dos avisos dicen lo mismo. Es la misma razón por la que
una pantalla declara qué dicen sus dos vacíos (CU-24).

**Y tiene dos partes, porque un aviso de granito tiene dos.** El título es **qué pasó**; la
descripción llena el cuerpo, que es donde va **con qué referirse a eso después** — un número de
recibo, un código de artículo. Es lo mismo que hace el aviso de error con el `requestId`, y por la
misma razón: el operador necesita poder anotarlo.

> **Enmendado el 2026-08-23**, porque `announces` devolvía sólo un texto y eso tenía una
> consecuencia visible que no habíamos previsto: sin descripción, granito dibuja **sólo la franja
> del tono**. El aviso de un alta se veía como un rectángulo verde con una línea adentro, en vez del
> aviso de dos partes que su demo muestra. **La mitad del formato faltaba, y era nuestra** — se
> había reportado como un problema de color de granito (`PED-11`), que arregló lo suyo.
>
> Un texto pelado sigue valiendo y es el título. Lo verifica `packages/core/tests/notice.test.ts`,
> que también fija que **con descripción el aviso dura más**: hay más para leer.

**El del error NO se declara, y no es un olvido.** Lo escribe el servidor: el contrato dice de
`message` que es *«explicación legible del error, en castellano, apta para mostrar al usuario»*. Un
texto nuestro sería una segunda fuente compitiendo con él, y el día que el backend mejore un mensaje
la pantalla seguiría diciendo lo viejo.

**Y un rechazo de negocio no es una falla — enmendado el 2026-08-23.** «Sólo se anulan los
comprobantes que carga el operador» es una **respuesta**: el sistema funcionó y contestó que no.
Mostrarlo con el tono de error y un identificador de pedido al lado le dice al operador que hay algo
que reportar cuando lo único que hay es una regla, y le enseña que el sistema se cae seguido.

Va con **otro tono, sin identificador, y se va sola**. El texto sigue siendo el del servidor.

**El `409` es el que el contrato usa para sus invariantes**, y de ahí sale la distinción — con la
excepción que ya estaba decidida: reusar una clave de idempotencia también vuelve `409` y **sí es
defecto nuestro** (CU-34). Lo verifica `packages/core/tests/rejection.test.ts`, que existe porque
esto es de lo que se lee perfectamente bien estando mal.

Cuándo se anticipa un rechazo deshabilitando el botón, y cuándo no, es CU-46.

**Con una excepción, que es cuando no hubo servidor.** Red cortada o backend caído: no hay `message`
porque no llegó a haber pedido, y tampoco identificador. Ahí el texto lo pone el marco, del catálogo
de CU-43.

Lo que **no** se muestra nunca es el error crudo. `TypeError: Failed to fetch` en la pantalla de un
mostrador no le dice nada a nadie y encima está en inglés.

#### El `403` es un caso aparte, y es un defecto nuestro

Por CU-3, **lo que un permiso no habilita no se muestra**. Entonces un `403` significa que la
interfaz ofreció algo que no correspondía: **no es un error del operador, es un síntoma de que la
pantalla está mal**.

Se le muestra un aviso honesto —no puede quedarse sin saber qué pasó— y **se deja rastro de que
ocurrió**, porque es lo que permite encontrar la pantalla que lo produjo.

Tratarlo igual que un fallo de red **esconde un defecto nuestro atrás de un cartel amable**, y nadie
se entera nunca.

> Dónde queda ese rastro depende de la estrategia de registro, que **no está decidida** — no hay
> destino ni quién lo mire. Mientras tanto, como mínimo, la consola.

Y vale para consultas también: una pantalla alcanzada por URL sin la capacidad correspondiente da
`403`, y eso es exactamente el agujero que CU-23 cierra protegiendo también la ruta.

### CU-26 · Los tres contextos, y cuánto vive cada uno

**Estado**: decidida · **Depende de**: CU-9, CU-11

Hay tres cosas que se llaman «contexto» y **tienen vidas distintas**. Meterlas en un solo lugar es
lo que las rompe.

| | qué es | dónde vive |
|---|---|---|
| **De la pantalla** | Qué registro se está viendo | **En la URL** — `/empresas/1234/estado-de-cuenta`. Es lo que hace que recargar y compartir un enlace funcionen |
| **De trabajo, estable** | La sucursal con la que se opera | Persiste en la máquina. Aguanta apagar el navegador: casi nunca cambia y volver a elegirla cada vez es fricción diaria |
| **De trabajo, efímero** | El cliente actual | **Por pestaña.** Dos pestañas pueden trabajar sobre dos clientes distintos sin pisarse, y no se vuelve mañana «parado» sobre alguien de ayer |
| **Del operador** | Tema, globos de ayuda | Persiste en la máquina. Es de la persona, no del trabajo |

**La URL sola no alcanza**, y conviene decirlo porque es la respuesta que sale primero: la sucursal
y el cliente actual **no son de ninguna pantalla** — cruzan todas—, y el tema tampoco.

#### Dos reglas que valen para todo lo que se guarde

**Se estampa con el sujeto, y se descarta si no coincide.** Si una persona marca un cliente como
actual, se va, y entra otra en la misma máquina, **la segunda no puede heredar el cliente de la
primera**. Es el mismo problema que ya resolvimos para los borradores de formulario, y la misma
solución.

**Se guardan identificadores, no datos.** El nombre, el saldo y la condición de un cliente escritos
en el disco de una máquina de mostrador es **la misma exposición** que ya rechazamos con el token y
con la pantalla congelada. Con el identificador alcanza: lo demás se vuelve a pedir, y por CU-14 ya
está cacheado.

Eso además hace el contexto chico y barato de restaurar al recargar — que con el token en memoria
pasa todo el tiempo.

#### Cómo quedó

**Implementado el 2026-08-23.** Dos de las cuatro vidas ya tenían dueño —la de pantalla es el
ruteador, la del operador son las preferencias—, así que `base/context.ts` es para las dos de
trabajo. **Un solo mecanismo con dos duraciones**, porque la diferencia entre ellas es de vida y no
de forma: dos mecanismos parecidos se copian mutuamente y divergen en la primera corrección.

La vida sale de la plataforma y no de un vencimiento nuestro: `sessionStorage` **es** por pestaña y
`localStorage` **es** por máquina. No hay nada que acordarse de limpiar.

**El estampado es parte de la clave, no un campo adentro del valor.** Otro sujeto lee otro lugar, así
que no hay comparación que alguien pueda olvidarse de hacer. Es lo mismo que ya hacían las
preferencias.

**Y «identificadores, no datos» no es una regla que alguien recuerde: el valor es un `string`.** El
nombre, el saldo y la condición no tienen dónde entrar.

Lo sostiene `packages/core/tests/context.test.tsx`, y se prueba acá porque **falla en silencio y
tarde**: que un contexto se herede entre dos operadores necesita dos personas y una misma máquina, y
nadie ensaya eso. El día que pasa, el síntoma es que alguien operó sobre quien no era.

> **Un contexto sin declarar falla al usarse.** Leería vacío para siempre y nadie se enteraría: el
> operador elegiría una sucursal que no se guarda en ningún lado.

#### Lo que no viaja

Las preferencias son **de la persona en esa máquina**: la misma persona en otra arranca con los
valores por omisión. Se aceptó porque guardarlas del lado del servidor exigiría un endpoint que hoy
no existe en ningún contrato, y pedirlo sería hacer crecer una API porque una pantalla lo necesita.

### CU-35 · El registro es un puerto, y hay algo que nunca sale

**Estado**: decidida · **Depende de**: CU-10, CU-25, CU-36

El registro entra por un puerto, **igual que la autenticación**: el esqueleto define la interfaz y
la aplicación enchufa una implementación en la raíz de composición. Hoy Grafana; mañana otra cosa, y
nada del resto del código se entera.

Que el patrón de CU-10 aparezca por segunda vez sin que lo forzáramos es buena señal de que era
general.

#### Qué pasa por ahí

**Errores y eventos.** Los errores que ya tienen dueño —el `403` de CU-25, una pantalla que revienta
(CU-30)— y los eventos de uso que un tablero sabe aprovechar: qué pantalla se abrió, cuánto tardó un
pedido, si un error es frecuente o único.

#### Y hay algo que nunca sale

**Ningún dato de un cliente.** Ni el nombre, ni el saldo, ni nada que permita reconstruirlo. Un
registro de frontend con eso adentro es **la misma exposición** que ya rechazamos con el token y con
la pantalla congelada — sólo que peor, porque queda en un servidor que nadie mira con ese criterio.

Lo que sí sale: **el identificador del pedido, el código del error, qué pantalla, y cuánto tardó.**

> **Y la forma de garantizarlo no es una regla que alguien recuerde: es que no haya dónde ponerlo.**
> Cada evento del puerto declara sus campos y **ninguno acepta un objeto libre** — no hay `payload`,
> ni `Record<string, unknown>`, ni `extra`. Meter el estado de un componente ahí no está prohibido:
> **no compila.**
>
> Queda un borde, y conviene decirlo: **un mensaje que nosotros mismos escribamos interpolando un
> dato lo traería igual.** Por eso los mensajes de `Failure` nombran qué falló, no con qué valores.

Y hay una razón para que alcance con eso: **el `requestId` ya sirve para correlacionar del lado del
servidor**, donde el dato sí está y sí corresponde que esté. El frontend registra el puntero; el
backend tiene el contenido. Es exactamente para lo que el contrato manda `meta.requestId` en toda
respuesta.

#### Cómo quedó, y quién emite cada cosa

**Implementado el 2026-08-23.** Cuatro eventos, y **cada uno tiene un emisor real** — ninguno se
declaró por si acaso:

| | quién lo emite | por qué existe |
|---|---|---|
| `screenFailed` | El límite de error (`CU-30`) | El identificador que se le mostró al operador es el que llega acá |
| `requestFailed` | La puerta de acciones | Los dos códigos que son **defecto nuestro**: el `403` de CU-25 y el reuso de clave de CU-34 |
| `screenOpened` | La ruta, **en un efecto** | Una pantalla se dibuja muchas veces sin que nadie la haya abierto de nuevo |
| `actionRan` | La puerta, que ya mide | Cuánto tardó, y **cómo terminó** |

> **El rastro del `403` era una garantía declarada que no existía.** CU-25 dice que «se deja rastro
> de que ocurrió, porque es lo que permite encontrar la pantalla que lo produjo», y hasta hoy no se
> dejaba ninguno: el operador veía su aviso y el defecto se perdía. Lo verifica
> `packages/core/tests/telemetry.test.tsx`, quitándolo y viéndolo fallar.

> **Una apertura se anota una vez, y eso costó dos vueltas.** Salía duplicada, y la primera
> explicación —`StrictMode` ejecuta los efectos dos veces en desarrollo— era cierta y **no
> alcanzaba**: lo que StrictMode estaba mostrando es que anotar la apertura **no era idempotente**, y
> eso no es de desarrollo. Un remontaje real —el reintento de CU-30, o algo de más arriba que se
> rehace— produce el mismo duplicado en producción.
>
> Ahora la marca vive en la instancia: navegar a otra pantalla la anota de nuevo, y volver a montar
> la misma no. Lo verifica `packages/core/tests/screen-opened.test.tsx`, **corriendo en
> `StrictMode`**, que es donde el síntoma aparece solo.

**Y un rechazo de negocio se cuenta aparte de una falla.** Sin separarlos, un tablero cuenta reglas
de negocio como errores del sistema y el número deja de decir nada.

**De dónde sale «qué pantalla».** La puerta de acciones no puede saberlo por su cuenta, así que la
ruta la publica. Sin proveedor devuelve algo legible en vez de reventar: **el registro de un error no
puede tapar al error**.

#### Qué compra la unión cerrada, y qué cuesta

**Agregado el 2026-08-23**, porque el canje estaba hecho y no escrito.

**Compra** que no haya dónde poner un dato de una persona. **Cuesta** que una necesidad nueva de
telemetría —una métrica, una traza, un atributo— **sea un cambio en cuarzo**, no algo que una
aplicación resuelva sola. No hay un `payload` para escaparse, y ésa es exactamente la idea.

Se acepta porque son cuatro aplicaciones de una plataforma, no un paquete público. Si algún día
fueran veinte de dueños distintos, el canje se revisa: la salida sería un evento genérico con un
esquema declarado y validado, que es más maquinaria de la que hoy se justifica.

**Y agregar un evento no es gratis, a propósito.** Una guarda de exhaustividad hace que un evento
nuevo **no compile** hasta que todas las implementaciones lo manejen. Sin ella, cada una se quedaba
atrás por su cuenta y en silencio.

> **Eso último era un defecto, y lo encontró una pregunta y no una prueba.** El `switch` del
> registro de desarrollo llevaba escrito que «obliga a que un evento nuevo se piense acá», **y no
> obligaba**: compilaba y se descartaba sin decir nada. Era una garantía declarada que no existe.

#### El sobre, y la garantía que bajó de nivel

**Enmendado el 2026-08-23.** Un evento dice *qué pasó*; sin **cuándo, dónde y en qué contexto** el
registro no se puede consultar. Todo evento va adentro de un sobre que **llena el marco en un solo
lugar** —no cada llamador, que se olvidaría, ni cada implementación, que estamparía distinto.

| | por qué |
|---|---|
| `at` | Sin esto no hay cómo ordenar ni ventanear |
| `app`, `version` | Cuatro aplicaciones reportan al mismo lugar, y «¿esto es nuevo?» no se contesta sin la compilación |
| `session` | **Es lo que hacía falta para cumplir lo que esta decisión ya prometía**: sin algo que agrupe, «si un error es frecuente o único» no se puede contestar |
| `screen` | En **todos**, para que una consulta por pantalla sea una sola |
| `context` | Lo que la aplicación agrega |

**Es uniforme y no por tipo de evento**, a propósito: campos distintos según el tipo obligan a saber
de antemano en cuáles existe cada uno, que es lo contrario de consultable.

**Dos cosas que hay que decir:**

**El reloj es del navegador.** Una máquina de mostrador con la hora mal produce eventos fuera de
orden, y no se arregla desde acá. Para lo que se correlaciona con el servidor está el `requestId`.

**El identificador de sesión es opaco y jamás el `sub`.** Con el sujeto adentro, el tablero pasaría a
tener el historial de navegación de una persona identificada — exactamente lo que esta decisión
rechaza. Por eso tampoco se estampa con nadie, a diferencia de todo lo de CU-26: **no pertenece a
nadie**.

##### Y la aplicación puede extender el contexto — lo que eso cuesta

Los **eventos** los declara cuarzo: qué clase de cosas pasan es lo mismo en las cuatro aplicaciones.
El **contexto que las describe, no**: una terminal de mostrador y un panel de administración no se
describen igual.

```ts
telemetry: { envelope: { branch: currentBranch } }
```

> **Esto debilita la garantía, y conviene decirlo derecho.** Antes era *no hay dónde poner un dato de
> una persona*. Ahora es **hay un solo lugar, declarado y vigilado**. La razón de fondo es que
> **ningún sistema de tipos distingue un identificador de un nombre**: los dos son un `string`.

Lo que la sostiene, en orden de fuerza:

1. **La fuente es un contexto de trabajo, no un texto.** `CU-26` ya garantiza que ahí van
   identificadores, así que meter un dato necesita **un paso deliberado** —declarar un contexto y
   guardar mal— en vez de escribirlo en el manifiesto.
2. **Una sola declaración**, que se revisa en un lugar y no en veinte llamadas. Y declarar un campo
   sin decir de dónde sale **no compila**: por eso quien lo escribe no puede olvidarse, no hay nada
   que completar después.
3. **La regla 13 de `quality.mjs`**, que falla si un campo se llama `nombre`, `saldo`, `email`. Es
   heurística y **agarra el descuido, no a quien quiera esconderlo** — sirve porque el descuido es el
   caso común.

#### Qué compilación es ésta, y por qué cuarzo lo provee

**Agregado el 2026-08-23.** El sobre lleva `version`, y la primera implementación fue un `define` en
el `vite.config.ts` del esqueleto. **Eso no es un mecanismo, es un truco que se copia**: una
aplicación clonada que lo borre se queda sin versión, y el tablero deja de poder decir de qué build
vino cada cosa **sin que nada falle**.

Ahora lo provee cuarzo, en `@cuarzo/core/build`:

```ts
export default defineConfig({ plugins: [react(), cuarzoBuild()] })
```

**Y lo que identifica una compilación no es la versión sola.** Nadie sube el número de una aplicación
privada, así que cuatro despliegues seguidos dirían `0.0.0`. Lo que contesta «¿esto empezó con el
último despliegue?» **es el commit**:

| | qué sale |
|---|---|
| Al compilar | `0.0.0+b72a05a` |
| En desarrollo | `0.0.0+dev` — el commit cambia a cada rato y recompilar por eso sería ruido |
| Sin repositorio | `0.0.0+sin-commit` — **lo dice, no miente**: una versión que parece precisa manda a buscar un commit que no existe |

**Y `version` pasó a ser obligatoria en `bootstrapApplication`.** Siendo opcional se degradaba a un
texto cualquiera, que es la forma que tiene este defecto de no notarse. Ahora una aplicación sin
versión **no compila**.

> **No se lee de `config.json`**, y es la excepción a que todo lo demás sí. La configuración es del
> **despliegue**; esto es del **artefacto**. El mismo build promovido de pruebas a producción es la
> misma compilación — y ésa es exactamente la pregunta que la versión existe para contestar.

#### El tipo dice la forma; el contrato dice la conducta

`TelemetryPort` garantiza que hay un `record` y qué recibe. **No garantiza cómo se comporta**, y ahí
es donde se rompe un adaptador nuevo: uno que hable con un tablero por red compila perfecto y puede
tirar, bloquear, o tragarse todo.

Por eso cuarzo **publica la prueba que toda implementación tiene que pasar**:

```ts
it('cumple el contrato del registro', () => telemetryContract(grafanaTelemetry))
```

| verifica | qué rompe si no se cumple |
|---|---|
| **Nunca tira** | Quien lo llamó estaba tratando un error, y **el original se pierde atrás de éste** |
| **No devuelve una promesa** | El tipo dice `void` y una función `async` es asignable a `void`: el compilador **no** lo agarra |
| **No modifica el evento** | Quien lo mandó puede seguir usándolo, y lo agregado viaja con él |

**Lo que no puede verificar**: que efectivamente registre. Una implementación que trague todo en
silencio pasa — desde afuera no hay forma de observar el efecto de un puerto sin conocer su destino.
Lo que sí está cubierto es que no se olvide un tipo de evento, y eso lo hace el compilador.

Y la suite tiene su propia prueba, que le pasa las tres formas de romperla: **una suite que no agarra
nada es peor que ninguna**, porque da la garantía sin darla.

#### En desarrollo

El registro es de las piezas que **no se apuntan por URL**, así que se elige por implementación en
la raíz (CU-36). En desarrollo no se le manda nada a un tablero de producción.

### CU-36 · La raíz de composición

**Estado**: decidida · **Depende de**: CU-10, CU-14, CU-17, CU-23, CU-35

**Un único lugar, lo más cerca posible del punto de entrada, donde se arma el grafo de objetos.**
Todo lo demás **recibe** lo que necesita y no construye nada.

Hace cuatro cosas, en orden:

1. **Lee y valida la configuración.** Si falta un valor obligatorio, **no arranca y dice cuál**
   (CU-17). No sigue con valores por omisión hasta fallar en el primer pedido.
2. **Construye las piezas**: el registro, un servicio por sistema, la sesión.
3. **Resuelve la sesión antes de dibujar** — y por debajo del umbral no se ve nada (CU-9).
4. **Ensambla las pantallas y arranca.**

#### Tres reglas que la mantienen escalable

**Compone, no implementa.** Es cableado sin lógica. Un `if` de negocio ahí adentro está mal.

**Colecciona, no contiene.** La lista de pantallas no vive en la raíz: cada funcionalidad exporta
las suyas y la raíz las junta. Crece **una línea por funcionalidad, no una por pantalla** — que es
lo que evita que se vuelva un depósito.

**Es el único lugar que conoce implementaciones concretas.** Todo lo demás depende de puertos. Y eso
**no es una convención: lo verifica la misma comprobación de límites de importación que CU-15 ya
necesita.** Un `import` de una implementación concreta fuera de la raíz falla.

Esa última es la que la vuelve robusta. Un patrón que depende de que todos lo respeten dura hasta el
primer apuro; uno que falla, no.

#### Cómo se entrega cada pieza

**Lo que se usa adentro del árbol** —la sesión, las capacidades— por contexto de React: se reemplaza
envolviendo con otro proveedor, que es lo que hace triviales las pruebas.

**Lo que se llama desde cualquier lado** —el registro, el formateo, los servicios— por módulo
configurado una vez. La razón la dejó escrita granito: *una pantalla llama a `format.money(...)`
fuera de un componente —para calcular el total de un documento— y con contexto eso no compila*.

#### El límite del módulo configurado una vez

**Faltaba, y su ausencia autorizó lo que no debía.** El párrafo de arriba se leyó como «lo que se
llama desde fuera de un componente va en un módulo», y de ahí salieron dos variables mutables de
módulo para la navegación y la sesión — un Service Locator, no inyección.

**El módulo configurado una vez es para funciones sin estado**: `format.money`, `buildUrl`. Lo que
tiene **estado y ciclo de vida** —la sesión, el ruteador, un servicio con caché— **lo construye la
raíz y se recibe**, aunque se use fuera de un componente.

**La diferencia no es dónde se llama: es qué se guarda.** Una función pura en un módulo no impide
dos instancias, no hay que limpiarla entre pruebas y no tiene orden de arranque. Un objeto con
estado tiene los tres problemas, y el tercero ya mordió: fijar el navegador desde un efecto dejaba
una ventana donde navegar reventaba.

**Y lo que vive fuera del árbol recibe los servicios, no los toma.** Una acción es una fábrica que
los recibe. Ése es el caso que la razón de granito parecía cubrir y no cubre.

Se descartó un contenedor con decoradores y metadatos en tiempo de ejecución: pelea con el sacudido
de árbol, y es maquinaria para media docena de piezas inyectables, no cincuenta.

#### Simulado o real: dos casos, dos respuestas

**Si el simulado habla el mismo protocolo, es configuración.** Prism sirve **el contrato de verdad**,
así que apuntar una API al simulado es cambiar el URL base en `config.json`: el servicio generado es
idéntico y no se toca una línea. Escribir un servicio simulado a mano duplicaría lo que el contrato
ya da, y se desincronizaría en cuanto el contrato cambie.

**Si es otra pieza, es implementación.** La sesión falsa no es un servidor OIDC y el registro de
desarrollo no es Grafana. Esos los elige la raíz, y **el código que los usa nunca se entera de cuál
le tocó**.

#### La falsa no existe en producción

Si la sesión falsa se pudiera encender desde `config.json`, **el archivo de configuración sería una
puerta trasera de autenticación**: quien pueda editarlo entra sin credenciales.

Así que **no entra en el artefacto de producción**. No hay bandera que la encienda porque no hay qué
encender. Y **una comprobación revisa el artefacto y falla si aparece** — la misma disciplina con la
que granito verifica que su paquete cumple lo que promete.

Se descartó agregarle además una defensa propia a la falsa: código que en teoría nunca se ejecuta es
código del que tampoco se sabe si funciona.

#### Y la configuración no se cachea

`config.json` se sirve **sin caché**. Si el navegador lo guarda, promover el mismo artefacto de
pruebas a producción **no cambia nada**, y el síntoma es que la aplicación apunta al emisor
equivocado sin que falle nada — justo lo contrario de lo que CU-17 buscaba.

### CU-31 · Los textos van con la pantalla; el vocabulario del negocio, aparte

**Estado**: decidida

**Las frases viven donde se leen.** En castellano, escritas en la pantalla, sin claves y sin
mecanismo de traducción.

**Pero los términos del negocio salen de un solo lugar por aplicación**, alineado con el glosario
del sistema que corresponda.

#### Por qué no un mecanismo de traducción

Nadie pidió un segundo idioma. Ponerle una clave a cada texto **para un idioma que no existe** es
construir para un consumidor que no existe, y el peaje se paga en cada pantalla y en cada revisión:
una frase detrás de una clave se lee peor y se corrige peor.

**Y la lección de granito no transfiere.** Granito tenía que ser **agnóstico** —su problema era
tener el idioma de su primer consumidor adentro— y una aplicación de Tandilia no lo es: es de una
farmacia de Tandil, en castellano, y va a seguir siéndolo. Confundir las dos cosas llevaría a pagar
el costo de granito sin tener su problema.

#### Por qué el vocabulario sí va aparte

**Porque ya existe, versionado y verificado, del otro lado.** El backend tiene `docs/dominio/` con
un par `es`/`en` por término, y `npm run spec:language` comprueba que todo sustantivo del contrato
resuelva a uno, y que **todo término tenga una cita del usuario como fuente** — sin cita no entra,
para que sea estructuralmente imposible fabricar vocabulario.

Si una pantalla escribe «cliente» donde el glosario dice «empresa», **no es un problema de estilo:
dice otra cosa**. Y no es hipotético — el propio repositorio lo advierte:

> Ojo con los falsos amigos: **empresa significa grupo de clientes**, no razón social.

Con veinte pantallas escritas por agentes distintos, el término tiene que salir de un lugar o va a
salir de veinte.

#### Lo que queda anotado, y se puede mejorar sin romper nada

**Generar el vocabulario del glosario en vez de tipearlo** es una garantía más fuerte: un término
que cambie de este lado dejaría de compilar, igual que pasa con los tipos del contrato.

Se descartó por ahora porque agrega un paso de generación y depende de la forma de un archivo de
otro repositorio. **Pero la forma elegida es un subconjunto de ésa** —un solo lugar por
aplicación—, así que el día que se quiera, se cambia de dónde salen los términos y **ninguna pantalla
se entera**.

### CU-29 · Cuando otro editó lo mismo, se dice qué cambió

**Estado**: decidida · **Depende de**: CU-5, CU-25

**Detectar el conflicto ya está resuelto por el contrato**: los recursos llevan testigo y el
servidor rechaza un guardado sobre una versión vieja. Lo que se decide acá es sólo qué pasa después.

Y no es hipotético: **el legacy escribe sobre la misma base**, y el backend ya lo asumió una vez al
elegir paginación por página sabiendo que una fila puede repetirse.

#### Qué se hace

Se vuelve a pedir el registro y se le dice al operador **qué campos cambiaron mientras editaba**.

No es un comparador general: es la intersección entre **lo que él tocó** y **lo que cambió en el
servidor**, comparado contra la versión que cargó. Suele ser una lista de uno o dos campos, y es
calculable sin nada especial.

**No pierde lo tecleado.** Es la misma postura que CU-9 tomó para la sesión, y por la misma razón:
perder trabajo cargado a mano en el momento exacto en que la persona creyó que había terminado es la
peor experiencia posible.

**Y si lo que cambió no se cruza con lo que se editó, no hay conflicto real**: se guarda sobre la
versión nueva sin molestar a nadie. Eso es lo que evita que la protección se vuelva un estorbo
diario.

> Con una salvedad que cuarzo no puede resolver: **no sabe si dos campos están atados** entre sí por
> una regla de negocio. Si una aplicación tiene ese caso, lo declara.

#### Lo que queda descartado explícitamente

**Volver a pedir el registro y guardar encima.** Es sobrescribir el trabajo del otro con un paso más,
y deja el testigo sin ninguna función.

Se anota porque **va a aparecer disfrazado de «reintento»** — y CU-25 ya dice que las escrituras no
se reintentan. Esto es la misma regla vista desde otro lado.

#### Dónde vive

En la puerta de las acciones (CU-25), no en cada formulario. Lo que cada formulario aporta es qué
campos tocó el operador, que ya lo sabe.

El costo aceptado: **hay que conservar la versión que se cargó** para poder comparar. Es el registro
que ya se trajo, así que es memoria y no maquinaria.

### CU-30 · Cuando una pantalla revienta, el marco sobrevive

**Estado**: decidida · **Depende de**: CU-4, CU-24, CU-35

Un error de programación —no del servidor— reemplaza **la pantalla**, y nada más. La navegación
sigue ahí y el operador puede irse a otro lado.

#### Por qué no la aplicación entera

Es la razón que granito ya midió y que CU-24 usa un escalón más abajo: **tapar todo le saca al
operador justo el control que necesita**. Sin navegación, la única salida es recargar a mano, y
mucha gente no lo va a intentar.

#### Por qué no sólo la región que falló

Sería simétrico con CU-24, pero **no es el mismo caso**. Una carga que falla deja el resto sano; un
error de programación deja el árbol **en estado desconocido**. Mantener viva la mitad de al lado es
apostar a que está bien, y esa mitad puede estar mostrando datos de antes sin que nada lo diga.

Una pantalla que miente es peor que una pantalla que falta.

#### Qué ve el operador

Que algo falló, **algo para mencionar**, y **una salida** — volver a la pantalla anterior o
reintentar. Nunca queda sin nada que apretar.

Lo de «algo para mencionar» no es cortesía: es lo mismo que CU-4 resolvió con el identificador del
pedido. Acá **no hay `requestId` porque no hubo pedido**, así que se genera uno propio, se le muestra
al operador, y **es el mismo que va al registro** — que es lo que después permite encontrarlo.

Y reintentar **remonta la pantalla de cero**. No se restaura el estado que quedó roto.

#### Cómo quedó

**Implementado el 2026-08-23**, en `packages/core/src/ui/screen-error.tsx`.

**Es una clase, y es la única del repositorio**: React no expone los límites de error a un hook. Va
**adentro del marco**, envolviendo lo que dibuja una ruta, que es lo que hace que la navegación
sobreviva — ponerlo un nivel más afuera daría una aplicación en blanco, que es justo lo que esta
decisión rechaza.

Reintentar **cambia una clave**, y con eso React remonta la pantalla de cero. No hay restauración de
estado: el que sobrevivió a un error de programación es justamente el que no se puede dar por bueno.

Lo sostiene `packages/core/tests/screen-error.test.tsx`, y **se prueba acá porque provocarlo a mano
es difícil de repetir**: hay que romper una pantalla a propósito, y una vez arreglada nadie vuelve a
ensayarlo.

#### Qué se registra, y qué no

Por CU-35: el identificador, qué pantalla, y el error.

**Nunca el contenido**, y acá la regla muerde más que en otros lados: un error de programación suele
arrastrar el estado del componente adentro, y ese estado **puede tener datos de un cliente**. Mandar
un volcado entero a un tablero es exactamente la exposición que CU-35 prohíbe, disfrazada de
diagnóstico.

### CU-32 · Cómo se exporta un archivo

**Estado**: decidida · **Depende de**: CU-10, CU-24, CU-25

ADR-008 del backend ya define el contrato y lo declara **convención transversal**: junto a cada
endpoint de datos hay uno de exportación, y vale igual para las ocho.

#### Se pide con autorización, no con un enlace

Lo natural sería un `<a href>` al archivo. **No sirve**: una descarga por enlace no lleva un
*bearer*, manda cookies — y por CU-10 no hay token suelto para pegar en un URL.

> El contrato **asume que sí funciona**. `ExportFormat.yaml` explica que el formato va en la ruta
> «para que el panel pueda apuntar un `href` directo al PDF, sin JavaScript de por medio», pero toda
> operación exige token y nada dice cómo se autentica ese enlace. **Queda como pregunta al backend.**
> Si hay respuesta, se gana la descarga nativa del navegador —con su progreso y sin pasar el archivo
> por memoria— y esto es una optimización, no un rediseño.

#### El formato se elige, y las opciones salen del contrato

Un botón **«Exportar ▾»** con las que ese endpoint acepta. Granito ya tiene el componente y el
patrón: es el mismo del menú de usuario.

**Las opciones no se declaran**: el formato es un enum del contrato —`pdf`, `csv`, `xlsx`— así que
vienen en los tipos generados. Ofrecer uno que el endpoint no acepta **no compila**, y si mañana
aparece otro, llega solo.

#### Tres reglas que el contrato ya fijó y que se equivocan solas

**Se reenvían los filtros, NO la paginación.** El contrato responde `422` a `page` y `size`, y dice
por qué: «en lugar de ignorarlos y entregar un archivo incompleto sin que nadie lo note». Se
equivoca solo porque lo natural es reenviar el objeto de consulta entero, que es el que trae la
paginación.

**Si falla, responde JSON y no un archivo roto.** Quien recibe mira el tipo de contenido antes de
tratarlo como archivo; si es JSON, es un error y va por el camino de CU-25.

**El nombre del archivo lo dice el servidor.** Que lo invente la pantalla es garantía de que dos
reportes terminen llamándose igual.

#### Rápidas y lentas, y quien llama no necesita saber cuál es cuál

**La mayoría se resuelve en el acto.** El operador mira un listado, pide el mismo dato en archivo, y
el backend rehace la consulta y lo genera. Sincrónico está bien.

**Algunos reportes son lentos, y ésos son corridas** (ADR-010): `202`, identificador, y se sigue
hasta que termina.

**Lo importante: quien llama no elige entre las dos formas — lo dice la respuesta.** Misma llamada,
mismo botón, mismo aviso; si vuelve un archivo, baja; si vuelve `202` con una corrida, se sigue como
tal y al terminar baja.

Eso importa por una razón concreta: **un reporte se vuelve lento con el tiempo** —más clientes, más
movimientos, más años de historia—. Con esta forma, el día que uno cruce la línea **no hay que tocar
el frontend**. Con cualquier otra —una lista de reportes lentos, un plazo que dispara— sí, y hay que
acordarse.

Y una exportación lenta no es un mecanismo aparte: es **una corrida que termina en un archivo**, o
sea un consumidor de CU-33.

> **El contrato hoy no lo permite.** La respuesta de exportación define únicamente el archivo, sin
> `202`. La pregunta al backend es chica y precisa: *dejar que un `/export/{format}` responda `202`
> con una corrida cuando no puede resolverse en el acto*. Mientras no exista, todo es sincrónico.

#### La exportación no vive en la pantalla que la pidió

**Es la excepción declarada a CU-14**, que cancela lo que está en vuelo cuando el operador se va.

Sin esta excepción, apretar exportar e irse **cancela la generación sin decir nada**: el operador
vuelve, no hay archivo, y nada explica por qué. Y se va a ir, porque el archivo **no existe hasta que
alguien lo pide** — el backend lo genera al vuelo.

Así que la exportación vive por encima de la pantalla, y el aviso flotante deja de ser un detalle:
**es dónde vive**, como un gestor de descargas que sobrevive al cambio de pantalla.

De ahí caen dos cosas: **se pueden pedir varias**, cada una con su aviso; y **si se cierra la
aplicación, se pierde**, porque el pedido es sincrónico y no hay nada que retomar.

#### Mientras tanto, la pantalla sigue viva

El botón muestra que está trabajando; **el resto de la pantalla no se bloquea**. Al terminar, un
aviso flotante y el archivo baja.

Sale de la razón que granito ya midió para `Busy`: bloquear lo que no hace falta le saca al operador
controles que sí necesita. Un reporte que tarda medio minuto no es motivo para congelar una pantalla
que funciona.

**Y no se puede exportar mientras el resultado se está recargando** — eso ya lo resolvió granito con
`DependsOnBusy`, y con su razón: *exportar mientras el resultado está en vuelo daría un archivo de
algo que ya no está en pantalla*.

#### Lo que se acepta

**El archivo pasa entero por memoria.** Para los reportes de una farmacia es tolerable. Si algún día
no lo fuera, la salida es una URL firmada de vida corta — y eso es contrato, no nuestro.

### CU-33 · Cómo se sigue una corrida

**Estado**: decidida · **Depende de**: CU-14, CU-26, CU-32

ADR-010 del backend modela los procesos largos como **corrida**: `202` con el identificador, y se
consulta hasta `COMPLETED` o `FAILED`. CU-14 ya decidió que eso son **consultas que se repiten, no
suscripciones**.

Tiene dos consumidores: la liquidación —y su eliminación, que también es larga— y **las
exportaciones que no se resuelven en el acto** (CU-32).

#### Lo que ya decidió el backend y se adopta tal cual

**Tres estados y ninguna barra de progreso.** No hay porcentaje, ni etapa, ni conteo, y por lo tanto
no hay con qué llenar una barra. La razón está escrita del otro lado y vale repetirla:

> una barra inventada que avanza sola es peor que nada — un proceso de cinco minutos con una barra
> falsa hace que el operador crea que se colgó.

Lo que sí corresponde: **un indicador de actividad, el tiempo transcurrido, y decir qué está pasando
en palabras.**

**No se puede cancelar.** No hay operación. Una corrida disparada por error sólo se puede dejar
terminar y después deshacer — que suele ser otra corrida.

**Y el `202` es una promesa.** La validación es sincrónica, así que un `202` significa que ya pasó
todo lo que se podía detectar antes de empezar. Eso permite decirle al operador **«está corriendo»
sin matices**, en vez de un «se envió, veremos».

#### Dónde vive

**Un aviso flotante que acompaña al operador aunque cambie de pantalla**, más la pantalla dedicada
para el detalle — el mensaje de una falla, el tiempo, sobre qué se está corriendo.

Es la misma forma que CU-32: lo que tarda minutos no puede vivir en la pantalla que lo lanzó, porque
**el operador se va a ir**. Y son minutos de pantalla muda si se lo obliga a esperar ahí.

#### Se recuerda el identificador, y eso cierra un cabo suelto ajeno

La nota del panel del backend lo marca como problema conocido:

> Si el operador pierde ese identificador —cierra la pestaña antes de anotarlo, o se le va la
> sesión— **no hay forma de volver a la corrida**.

**Eso se cierra desde acá, sin pedirle nada al contrato**: se recuerda el identificador hasta que la
corrida termina, y al volver se le pregunta al servidor cómo salió.

Usa el mecanismo que CU-26 ya definió —**identificadores, no datos**, estampado con el sujeto— y va
en el contexto **persistente**, no en el de pestaña: una corrida **sigue existiendo aunque el
operador se vaya**, que es justo lo que la distingue del cliente actual.

Se olvida al terminar.

#### Lo que pone la aplicación

**A dónde se va cuando termina bien.** Cuarzo no sabe qué es una liquidación ni qué mirar después.

Y hay un detalle que obliga a esperar: **el identificador del resultado sólo existe al final**. La
pantalla no puede ofrecer el enlace antes de tiempo, por más que quiera.

**Si falla**: el mensaje que vino, y la opción de reintentar.

### CU-34 · La clave de idempotencia se ata al cuerpo del intento

**Estado**: decidida · **Depende de**: CU-25, CU-29

El contrato ya decide casi todo, y con más precisión de la que hacía falta inventar.

**No es «toda escritura»**: es obligatoria en las seis operaciones **que mueven saldo**, y ahí está
declarada como requerida. La pantalla no elige — **no mandarla no compila**.

Y fija las reglas: quien llama genera una clave nueva **por cada intento lógico distinto**;
reintentar la misma operación **reusa la misma clave**, porque generar una nueva al reintentar
*anula toda la protección*; y si la misma clave llega con un cuerpo distinto, el servidor responde
`409` con `IDEMPOTENCY_KEY_REUSE`.

#### Cuándo se genera

**La clave se ata al cuerpo del intento.** Mismo cuerpo, misma clave — es un reintento. Cuerpo
distinto, clave nueva — es otro intento.

Eso descarta las dos formas que salen primero:

**Al abrir el formulario, no.** Si el operador guarda, sale bien, edita y vuelve a guardar en el
mismo formulario, eso es **otro intento con la misma clave**: el servidor le devolvería el resultado
del primero sin aplicar nada, y el segundo cambio se pierde sin que nadie se entere.

**Al apretar el botón, tampoco.** Dos clics rápidos generarían dos claves, y la protección no
serviría para nada — que es exactamente el caso para el que existe.

Y resuelve solo el que se lleva gente puesta: **falla, el operador corrige un campo y vuelve a
apretar.** Con la clave retenida sería `409` por cuerpo distinto; con esta regla sale clave nueva
sola, porque el cuerpo cambió.

Encaja además con CU-29: cuando un conflicto se resuelve, el cuerpo cambia, así que el intento
siguiente es otro intento. No hay nada especial que recordar.

#### Una elegancia que es un defecto

Se podría **derivar la clave del cuerpo** —un resumen del contenido— y así mismo cuerpo daría misma
clave sin guardar nada.

**Está mal.** Dos cobros idénticos legítimos el mismo día darían la misma clave, y el servidor
devolvería el resultado del primero: **se perdería un cobro en silencio**, que es precisamente el
descuadre que la clave existe para evitar.

La clave se genera y se retiene mientras el cuerpo no cambie. No se deriva.

#### Un `409 IDEMPOTENCY_KEY_REUSE` es un defecto nuestro

Igual que un `403` (CU-25): significa que reusamos una clave con otro cuerpo. **No es un error del
operador y no se le muestra como tal** — se registra, porque es síntoma de que la puerta de acciones
está mal.

#### Una acción es una declaración, y se declara en el módulo

**Enmendado el 2026-08-23.** `defineAction` era el único `define*` que vivía adentro de un hook, y
la razón era incidental: necesitaba el servicio, que sólo existe después de la sesión.

```ts
export const demoService   = defineService<DemoClient>('demo')   // módulo
export const articlesScreen = defineScreen({ ... })               // módulo
export const catalog       = defineFeature({ ... })              // módulo
export const createArticle = defineAction({ ... })               // módulo, ahora
```

**La consecuencia se vio en una grilla.** La pantalla llamaba al hook **sólo para leer `requires`**
—un valor que sale del contrato y no cambia nunca— y el botón de cada fila lo volvía a llamar para
ejecutarla: un concepto declarado en dos lugares, y veintiún objetos para una acción.

> **No fue por rendimiento, y conviene decirlo porque fue lo primero que se sospechó.** Se midió:
> veinte filas cuestan 17,6 µs por render y cien cuestan 63. React dibujando esas filas cuesta
> órdenes de magnitud más. Lo que sí importa es que **cuando un miembro de una familia se comporta
> distinto sin una razón que se lea, el que sigue copia el patrón equivocado** — que es exactamente
> lo que había pasado.

**La operación nombra su servicio; la puerta lo resuelve.** Es lo mismo que ya hacía con la clave de
idempotencia, y por lo mismo: lo único que necesita el servicio es el cuerpo de la llamada. El `id`,
los roles, `requires`, `idempotent`, `invalidates` y `announces` son estáticos.

```ts
create: demoOperation('createArticle', (demo, body: ArticleCreate, key) =>
  demo.createArticle(body, key),
)
```

La puerta lee el registro **una sola vez** por contexto y liga las operaciones antes de `run` — no
una lectura por operación, que además no se podría: la cantidad la decide cada acción, y los hooks
no se llaman en un bucle.

**Y si nadie registró el servicio que una operación nombra, falla al ejecutar, con su nombre.** Sin
eso la llamada saldría contra `undefined` y reventaría adentro del adaptador, lejos de la causa. Lo
verifica `packages/core/tests/idempotency.test.ts`.

#### Dónde vive

En la puerta de acciones de CU-25, **no en cada formulario**. Lo único que el formulario aporta es
el cuerpo, que ya tiene.

### CU-27 · La barra de usuario la arma el esqueleto

**Estado**: decidida · **Depende de**: CU-12, CU-26, CU-36

La sección derecha de la barra —quién está, y qué puede hacer consigo mismo— la arma el marco. La
aplicación aporta **una sola cosa**.

#### De dónde sale cada parte

| | |
|---|---|
| **Nombre e iniciales** | De claims **estándar** de OIDC. El esqueleto los deriva **sin saber quién es el proveedor**, así que la aplicación no los pasa |
| **El rótulo de abajo** —«Administradora»— | **No es estándar.** Es la misma traducción de claims a negocio que la aplicación ya pone para las capacidades |
| **Cerrar sesión** | `signOut()` de CU-12: termina la sesión de **todas** las aplicaciones |
| **Tema y globos de ayuda** | Preferencias de CU-26 |

#### Qué lleva el menú

**Obligatorio y no se puede quitar: cerrar sesión**, siempre último y con tono de peligro. Si una
aplicación pudiera quitarlo, **el operador se quedaría sin salida** — y eso no es una preferencia.

**Lo demás son preferencias, y la aplicación declara cuáles tiene.** El marco trae el tema y los
globos de ayuda armados, y no conoce ninguna otra: una aplicación puede agregar la suya —densidad,
idioma— sin que el marco cambie.

**Lo de la aplicación va arriba del separador.** Cerrar sesión queda abajo, siempre, para que un
operador que pasa de una aplicación a otra encuentre lo mismo en el mismo lugar — que es el objetivo
de CU-20.

#### Una entrada abre una pantalla, ejecuta algo, o las dos

```ts
{ id: 'about', label: 'Acerca', screen: aboutScreen }        // navega, tipado
{ id: 'help',  label: 'Ayuda',  onSelect: abrirDialogo }     // un diálogo, una acción
{ id: 'exit',  label: 'Salir',  screen: home, onSelect: avisar }   // primero avisa, después va
```

**No hay límite sobre qué puede hacer.** Una entrada del menú de usuario es un llamador como
cualquier otro (CU-23), así que abre una pantalla, abre un diálogo, dispara una acción, o combina.
Cuando declara las dos corre primero `onSelect` y después navega: lo que tenga que pasar antes de
irse de la pantalla, pasa antes.

**Con `screen` la navegación es tipada** (CU-41), y ésa es la forma que se prefiere: la pantalla
equivocada no compila, así que el enlace del menú **no se puede romper**. Una entrada que arma la
URL a mano sí.

**Lo único que no se acepta es la entrada que no hace nada**, y lo impide el tipo: un renglón muerto
en el menú es indistinguible de uno que dejó de funcionar, y el operador no tiene forma de saber
cuál de los dos está mirando.

#### Una preferencia se declara, y el marco no conoce ninguna

```ts
userMenu: {
  preferences: [...standardPreferences],          // las dos del marco, cambiables
  preferences: [fixed(theme, 'dark'), tooltips],  // el tema fijo en oscuro
  preferences: [theme],                           // sin globos: no existen acá
}
```

**Lo que no está en la lista no existe en esta aplicación**: ni interruptor, ni valor guardado que
reviva. Y **tener también se declara**, no sólo quitar: un menú que quedó corto porque alguien se
olvidó es indistinguible de uno que quedó corto a propósito, y un interruptor que nadie decidió
poner es el mismo problema con el signo cambiado.

**Quitar el interruptor no alcanza: hay que fijar el valor.** Si sólo se esconde, la preferencia que
el operador tenga guardada sigue aplicándose y el tema queda donde él lo dejó, sin forma de
cambiarlo. Por eso fijar es `fixed(theme, 'dark')` y no un campo aparte: **le saca el renglón del
menú y le pone el valor en la misma llamada**, y las dos mitades no se pueden separar.

**Y «cambiable» no es un valor.** Ser cambiable es que la preferencia declare su `choice` —qué dice
su renglón y qué valor deja al elegirlo, los dos juntos para que no puedan mentirse—; estar fija es
haber pasado por `fixed`. Ponerlo como una opción más al lado de `'light'` y `'dark'` mezcla quién
elige con qué se eligió, y admite combinaciones que no significan nada.

#### Qué compra esto, en concreto

**Una preferencia nueva es un archivo y un renglón.** El proveedor, la barra de usuario y la raíz de
composición trabajan contra el tipo `Preference` y **no nombran ninguna**: lo verifica la regla 9 de
`quality.mjs`, que falla si alguna se importa por nombre fuera de su archivo.

La única excepción tiene nombre y razón: **el marco lee los globos de ayuda**, porque no se aplican
al documento como el tema sino que son una prop del `AppShell`. Es una prop, no una decisión.

#### Los globos de ayuda: el mecanismo es de granito, la preferencia es nuestra

granito ya lo resuelve entero: `Tooltip` lee el estado del shell, y los marcados `essential` **no
se apagan nunca** —el globo de un botón deshabilitado es lo que dice por qué no se puede confirmar,
y apagarlo deja al operador sin salida—.

Lo que pone el marco es **una sola línea**: el valor efectivo va al `AppShell`, que lo reparte por
contexto. Pasarlo control por control sería la segunda fuente que un día no coincide.

Y dónde se guarda la preferencia es de la aplicación, que acá es CU-26: **en la máquina, estampada
con el sujeto**.

#### Lo que NO lleva, por ahora

**«Mis preferencias»** y **«Ayuda»**, que la demo de granito muestra. Las preferencias que existen
—tema y globos— ya están en el menú, así que esa entrada llevaría a una pantalla vacía. Y no hay
sistema de ayuda.

Vale la razón que granito ya escribió para el menú de navegación: *una entrada que lleva a una
pantalla vacía miente más que una que no lleva a ningún lado.*

### CU-37 · Una acción declara sus operaciones, y escribe en un solo lugar

**Estado**: decidida · **Depende de**: CU-3, CU-15, CU-25, CU-34

> **Enmienda OPE (2026-10-08).** `Operation.roles` pasa a **`capabilities`**, y salen del módulo del contrato que el backend emite por consumidor (`contracts/ope/capabilities`, `OW-5`) y no de un generador por expresión regular sobre `x-required-roles`. `idempotent` y `versioned` se omiten cuando el contrato no los declara: OPE repite por cuerpo idéntico y no tiene testigo. Lo demás —la unión de capacidades, escribir en un solo lugar, la invalidación declarada— no cambia.

Una **acción** es lo que ejecuta un botón: el caso de uso. Vive en `features/<x>/data/`, que por
CU-15 es lo único que puede importar de `api/`.

#### El botón no sabe a qué servicio llama

```
botón → acción → useMutation → una o más operaciones → la puerta autoriza
                     ↓
            éxito: aviso + invalidar
            error: fields al formulario, o aviso con requestId
```

**El botón sabe qué acción ejecuta, y nada más.** Por eso se puede derivar: si la acción no está
habilitada, **el botón no se dibuja** — y CU-3 deja de depender de que alguien se acuerde.

#### La acción declara sus operaciones, no sus permisos

La acción dice **qué operaciones del contrato invoca**, y el marco le pasa **únicamente ésas**.

De ahí sale la capacidad exigida: **la unión de los `x-required-roles` de esas operaciones**,
derivada del contrato. No se escribe a mano.

Eso importa por algo que el propio contrato dice temer:

> El panel decide **qué muestra** y esta API decide **qué permite**, con la misma información. […] el
> día que se desincronizan, **el panel ofrece un botón que la API rechaza**.

Resolvieron la mitad —el mismo vocabulario de los dos lados— y ésta es la otra mitad: que *esta*
acción exija *esta* capacidad, sin copia que se desincronice.

**Y la unión, no la principal.** Una acción que empieza y no puede terminar deja el sistema a
medias, que es justo lo que CU-34 existe para evitar.

**Llamar a una operación no declarada es imposible**, porque no la tiene a mano. No hace falta una
comprobación que lo vigile.

#### Por rol no se muestra; por estado se deshabilita

Se confunden siempre, y CU-3 ya las separó: *deshabilitar es para lo transitorio —mientras se
guarda, mientras falta un dato—, no para lo que depende de quién sos.*

La demo de granito las tiene juntas: «Registrar cobro» deshabilitado **con un globo que dice por
qué** —las formas de pago no cubren el total— al lado de acciones que sencillamente no están cuando
el rol no las habilita.

Confundirlas produce los dos defectos clásicos: un botón gris permanente que no se va a poder usar
nunca, o una acción que desaparece y deja al operador sin saber qué le falta.

#### Y una acción escribe en un solo lugar

**Compone lecturas de donde haga falta. Escribe en uno solo.**

Porque **no hay transacción que abarque dos backends**, y con CU-22 —varios sistemas— eso deja de ser
hipotético. Si la segunda escritura falla, la primera ya ocurrió, y **una pantalla no puede hacerse
cargo de la mitad que quedó hecha**.

Si una operación de negocio necesita tocar dos lados, **es del backend** — que tiene transacciones y
nosotros no. Cómo se coordina eso es `TAN-3`, en la plataforma, y está abierta.

### CU-38 · La validación de un formulario tiene tres capas

**Estado**: decidida · **Depende de**: CU-5, CU-25, CU-37

> **Enmienda OPE (2026-10-08).** La **capa 1** ya no se escribe a mano: `npm run contract:sync` la emite del bundle de OPE en `contracts/ope/constraints.{js,d.ts}` —`required`, tipos, largos, patrones, rangos y, para una lista, cuántos renglones y qué exige cada uno— con la forma de `specs/006-el-merchant-completo/contracts/constraints-artifact.md`, interina hasta que OPE-Backend 040 la emita en `generated/contract/`; `ope-check conformity` falla si lo emitido y el bundle se despegan. La **capa 2** queda a mano con la cita del `x-invariant` (`invalid-origin`), porque la regla del contrato es prosa; el enum de códigos de las-animas que esta decisión nombra es, en OPE, el catálogo de tipos de problema. La capa 3 no cambia. Ver `docs/origen.md`.

**La distinción no la inventamos acá.** ADR-009 del backend ya declara cada invariante en un lado o
en el otro: *sobre el schema si involucra campos del propio mensaje, o sobre la operación si depende
de otro recurso.* De ahí salen las tres capas.

| capa | de dónde sale | dónde se valida |
|---|---|---|
| **La forma** — obligatorios, tipos, largos, patrones | JSON Schema → tipos generados | **Local**, y viene gratis |
| **Invariantes de schema** — que las formas de pago sumen el total | `x-invariants` sobre el schema | **Local, y puede bloquear** — con condiciones |
| **Invariantes de operación** — que el límite de crédito alcance | `x-invariants` sobre la operación | **Sólo el servidor** |

#### Las de operación nunca se evalúan acá

No es que sea caro: **es que no se puede**. Dependen de otro recurso, y aunque se pidiera el dato,
entre que se pregunta y se guarda **puede cambiar**. Una respuesta local sería una promesa que nadie
puede sostener, y el operador la creería.

#### Las de schema pueden bloquear, con dos condiciones

La pantalla implementa la regla y **deshabilita la acción con su explicación** — como ya hace la demo
de granito con «Las formas de pago no cubren el total: faltan $15.712,25».

Y para que esa copia no se pudra:

1. **Cita el código de la invariante** —`PAYMENT_METHODS_SUM_MISMATCH`— del enum de errores.
2. **Una comprobación falla** si ese código no existe, **o si la regla declarada cambió** desde que
   se copió.

No garantiza que la lógica coincida; **ninguna comprobación puede hacer eso**. Garantiza dos cosas
que alcanzan: que nadie implemente una regla sin mirar la declarada, y que **un cambio del otro lado
marque la copia como vieja** en vez de dejarla bloqueando con el criterio de antes.

Es el mismo mecanismo que usamos para las citas de decisiones, aplicado a las reglas de negocio.

#### Por qué hace falta esa vigilancia, y no al revés

Los dos errores no son simétricos.

**Una copia más laxa se descubre sola**: el servidor rechaza y el operador se entera.

**Una copia más estricta no se descubre nunca.** Bloquea al operador por algo que la API habría
aceptado, y no hay forma de que nadie se entere de que eso está pasando. Ése es el que la
comprobación cubre.

#### Cuándo se marca un campo

**Nunca mientras se escribe por primera vez.** Marcar un campo en rojo al segundo carácter es
hostigar a alguien que todavía está escribiendo lo correcto.

Se marca **al salir del campo**, o **al intentar guardar** — lo que pase primero. Y una vez marcado,
**se corrige en vivo**: ahí sí, cada tecla actualiza, porque el operador ya sabe qué está mal y está
buscando arreglarlo.

#### Cómo quedó la vigilancia, y qué la sostiene

**Implementado el 2026-08-23.** La comprobación que esta decisión pedía **no es una comprobación:
es el compilador**, que es más fuerte.

Las restricciones se generan del contrato —`tests/constraints.mjs`, junto a los roles y la clave de
idempotencia— y la regla se emite **como texto literal**. Entonces una copia local se escribe así:

```ts
demoInvariant('ArticleCreate', 'DISCOUNT_ABOVE_PRICE', 'discountedPrice <= price', …)
```

y el tipo del tercer argumento **es** lo que el contrato dice hoy. Se probó cambiando la regla en el
contrato:

```
error TS2345: Argument of type '"discountedPrice <= price"'
              is not assignable to parameter of type '"discountedPrice < price"'.
```

El código también está tipado contra los que ese mensaje declara, así que uno inventado tampoco
compila. **Y el argumento no se usa al correr**: existe sólo para que el compilador lo compare, y
eso está escrito al lado para que nadie lo saque por parecer muerto.

#### Y lo que faltaba: que el compilador llegue a verlo

El compilador compara contra **lo generado**, no contra el contrato. Así que la garantía valía
recién **después de regenerar** — y regenerar vivía sólo en `npm run tipos`, que no corre ni en
`npm test` ni en `npm run build`. Cambiar una regla del contrato **no rompía nada**: la pantalla
seguía bloqueando con el criterio de antes, y nadie se enteraba. Es la mitad que esta decisión dice
cubrir, y la que no se descubre nunca.

**Ahora el ciclo verifica que lo generado esté al día.** `npm test` corre los dos generadores con
`--verificar`: no escriben, comparan contra el contrato, y si difieren **fallan diciendo qué
correr**. Emitir en vez de fallar sería una comprobación que arregla lo que encuentra, y ésas dejan
de encontrar.

**Lo que sigue sin cerrarse, y se dice**: `openapi-typescript` —que emite los tipos, no las
restricciones— **necesita red**, y se invoca con `npx` porque exige `typescript@^5.x` y acá hay 7.
Se probó declararlo como dependencia con el `typescript` del proyecto: instala, y revienta al correr
con `ts.factory` indefinido. Bajar TypeScript por una herramienta no está sobre la mesa, así que
**regenerar necesita red**. Lo que **no** necesita red es enterarse de que hay que regenerar, que es
la parte que sostiene la garantía.

#### La política de marcado vive en el marco, no en cada formulario

`useForm` la implementa una vez, y `packages/core/tests/form.test.ts` la sostiene. **Es de lo que no
se ve mirando la pantalla**: con los datos correctos —que es como se la mira— las tres reglas dan el
mismo resultado, y lo que cambia es la experiencia de quien se equivoca.

Se probaron las dos formas de romperla: marcar siempre, y no marcar al intentar guardar.

#### Y el servidor sigue siendo el que decide

La validación local **no reemplaza** a `error.fields`: lo adelanta. Cuando el servidor rechaza igual,
los mensajes van a los campos que los pidieron (CU-25).

> **Lo que haría innecesaria la copia entera**: que el `rule` de `x-invariants` fuera una expresión
> **ejecutable** y no pseudocódigo para leer. Ahí el frontend la evaluaría desde el contrato, con
> feedback inmediato y una sola fuente. Es un pedido al backend, con costo para ellos, y **sólo hace
> falta para las de schema**.

### CU-39 · Las notificaciones son de cada aplicación, y se consultan

**Estado**: decidida · **Depende de**: CU-14, CU-23, CU-27, CU-33

Avisos que **sobreviven, se acumulan y tienen estado de leído**. Son otra cosa que los avisos
flotantes de CU-25, que son efímeros y hablan de lo que el operador acaba de hacer.

**Dos orígenes**, y ninguno es una persona escribiéndole a otra:

- algo que el operador **inició y termina después** — una liquidación, una exportación lenta;
- una **condición del negocio o un proceso programado** — cheques por vencer, la corrida mensual.

#### De cada aplicación, no de Tandilia

El operador ve las del sistema en el que está. **Se acepta el costo**: algo de fidelización no le
llega mientras trabaja en cuenta corriente.

A cambio, cada backend expone lo suyo y **no hace falta nadie que las junte** — que es lo que habría
convertido esto en una decisión de plataforma con un coordinador atrás.

#### No hacen falta suscripciones

**Ninguno de los dos orígenes es urgente al segundo.** Un cheque por vencer importa hoy, no en este
minuto; una corrida que ya terminó puede esperar un rato a que alguien la mire.

Así que se consultan cada tanto, con el mismo mecanismo de CU-14. Esa decisión **sigue valiendo** —
lo que cambia es que ahora dice de qué hablaba: **del transporte**, no de si el producto necesita
notificaciones.

> Aquella frase se pasó de largo. Decía «no hay suscripciones» apoyada en que el contrato no tiene
> push, que es evidencia sobre **cómo llega un evento**, y quedó escrita como si cerrara también
> **qué necesita el operador**. Son dos preguntas distintas.

#### El estado de leído es del servidor

Si fuera local, **la misma persona en otra máquina las vería todas sin leer otra vez**. Y una
notificación que reaparece leída es peor que ninguna: enseña a ignorarlas.

Es parte del pedido al backend, no algo que se resuelva de este lado.

#### La campana se declara

Una aplicación que no tiene notificaciones **no muestra una campana vacía**. Misma regla que CU-27:
lo que no hay, no se dibuja.

#### Dos bordes que se equivocan solos

**Una notificación puede apuntar a algo que el operador ya no puede ver.** Le cambiaron el rol entre
que se generó y que la mira. Por CU-23 la ruta lo rechaza igual, así que lo correcto es que **el
servidor no mande notificaciones sobre lo que el destinatario no puede ver** — y si igual llega, acá
**no se ofrece un enlace muerto**.

**No se avisa dos veces.** Si CU-33 ya está siguiendo una corrida con su aviso flotante, la
notificación es **el registro persistente**, no un segundo cartel en el mismo momento. El operador
tiene que poder encontrarla después, no enterarse dos veces ahora.

#### Lo que hay que pedirle al backend

El recurso de notificaciones, **el estado de leído**, y **el filtrado por capacidad**. Nada de eso
existe hoy en ningún contrato.

### CU-40 · Qué publica cuarzo, qué se copia, y cómo se actualiza

**Estado**: decidida · **Depende de**: CU-7, CU-15, CU-20

> **Enmienda OPE (2026-10-08).** `@ope/core` y `@ope/session` son **workspaces privados** del monorepo y no se publican: llegan a las aplicaciones por `npm workspaces`, en el mismo commit (`OW-1`). Lo que esta decisión dice de qué se comparte y qué se copia sigue valiendo; `npm update` deja de ser el mecanismo, y la comprobación de empaquetado exime de identidad publicable a los paquetes privados.

CU-20 partió cuarzo en «lo que se copia» y «lo que se publica». Esto lo precisa pieza por pieza,
porque al especificar el esqueleto apareció que **adentro hay dos cosas de naturaleza distinta**.

#### La forma se copia; la conducta se publica

**La forma** —la estructura de carpetas, el ruteo, la raíz de composición, la configuración de
compilación— es de cada aplicación y **diverge legítimamente**. Son unos seis archivos y dos
carpetas.

**La conducta** —los cuatro estados, la puerta de acciones, la barra de usuario, los contextos, el
manejo de errores, la sesión— **se publica**. La prueba del principio V da «sí» para todas: un
defecto en el componente de los cuatro estados muestra el vacío equivocado en las cuatro
aplicaciones.

Y de ahí sale por qué importa que la forma sea delgada: **es la única parte que no se actualiza
sola.** Si son seis archivos, no propagarla casi no duele.

#### Dos paquetes, cuatro categorías

| paquete | categorías |
|---|---|
| **`@cuarzo/session`** | La puerta, la máquina de estados, la implementación falsa |
| **`@cuarzo/core`** | **base** —contextos, registro, tipos— · **datos** —acciones, invalidación, idempotencia, el `401` y el `403`— · **interfaz** —cuatro estados, barra de usuario, error de pantalla— |

**Y desde `CU-42`, también la raíz de composición y las vistas de los siete estados de sesión.**
Con el manifiesto, el cableado dejó de conocer a ninguna funcionalidad, así que pudo mudarse del
lado que se publica. La forma copiada queda en la configuración de compilación, `index.html`, un
`main.tsx` corto y `manifest.ts` — que es lo que esta decisión pedía cuando dijo que **la forma
tiene que ser delgada**.

#### Por qué el ámbito va en castellano y los paquetes en inglés

**`@cuarzo` es un nombre propio** —una piedra de Tandil, como granito y como el resto de la
familia— y los nombres propios no se traducen. **`session` y `core` no lo son**: describen qué
hay adentro, o sea que son código, y la constitución pide el código en inglés.

Lo mismo vale para las subrutas. La entrada por la que sale la implementación falsa es
**`@cuarzo/session/fake`**, y no `/mock`: en la taxonomía de dobles de prueba **un mock verifica
interacciones** y éste no verifica nada — es una **implementación que funciona**, simplificada, que
es exactamente la definición de *fake*. Llamarlo mock diría algo que no es.

Las categorías **existen como módulos con la dirección de dependencias verificada**: `ui → data →
base`, y nunca al revés. Lo comprueba `packages/core/checks/boundaries.mjs`, la misma que ya
verificaba `src/`. **No hace falta partir en paquetes para tener fronteras** — hace falta que algo
falle cuando se cruzan.

> La frase de arriba estuvo escrita antes de ser cierta: la comprobación miraba sólo `src/`, y del
> lado del paquete no verificaba nada. Se descubrió al ordenar las tres categorías, con **tres
> importaciones hacia arriba ya adentro** —`base` pidiéndole a `ui` el error de pantalla y las
> vistas de sesión, `data` pidiéndole el aviso—, ninguna de las cuales rompía nada. Las tres se
> invirtieron pasando lo que hacía falta desde la raíz, y recién entonces la frase se pudo escribir
> como garantía.

#### Se publica compilado, y la fuente viaja al lado

**`exports` apunta a `dist/`, con sus `types`.** Adentro del repositorio se publicaba TypeScript
crudo, que anda mientras el único consumidor es este esqueleto — pero hace que **quien instala
compile nuestra fuente con su `tsconfig`**. El día que una aplicación toca un flag, el código de
cuarzo deja de compilar allá, con el error en su pantalla y la causa acá. Y la promesa de esta
decisión es al revés: la conducta se publica **ya resuelta**, y lo que diverge es la forma.

`src/` viaja igual, como en granito: los comentarios en castellano son la guía, y `tsc` sólo
conserva los `/** */` en el `.d.ts`.

> **Compilar el paquete solo es lo que revela si es autónomo**, y la primera vez falló:
> `bootstrap.tsx` importa `@granito/ui/css`, y la declaración que lo hacía compilar vivía en
> `src/modules.d.ts`, **del lado copiado**. O sea que el paquete lo sostenía su consumidor. No se
> veía porque nunca se lo había compilado aparte.

#### Las decisiones viajan adentro del paquete

`@cuarzo/core` publica `docs/arquitectura.md` y `docs/seguridad.md`. Sin eso, una aplicación
clonada hereda comentarios que citan `CU-n` y **no tiene contra qué compararlos**.

**Se copian al empaquetar; la fuente sigue en `docs/`**, que es donde `CLAUDE.md` manda a todos.
Mudarlas adentro del paquete dejaría el mapa del repositorio mintiendo, y además las decisiones no
son de `core`: `CU-11` es de sesión, y en el mismo texto conviven `GR-n` y `TAN-n`.

**El índice no viaja, y es a propósito.** `decisiones.md` es una tabla, y quien lo lee busca
encabezados `### CU-n ·`: daría cero identificadores, y cero no es «no encontré» sino «ninguna
existe» — o sea que fallarían **todas** las citas del clon. Publicar de más habría sido peor que no
publicar.

Y algo que se gana además de pagar: **el documento que viaja es el de la versión instalada**. Una
aplicación clavada en cuarzo 1.2 verifica contra las decisiones de 1.2, no contra las de hoy.

#### Lo que se promete publicar, se comprueba

`packaging.mjs` verifica que toda ruta nombrada en `exports`, `files` y `bin` **exista**, y que la
siga git salvo lo que el paquete declare generado en `cuarzo.generated`.

**Existir se le exige también a lo generado**, y ahí está la mitad que importa: todo el `exports` de
los dos paquetes apunta a `dist/`, así que una exención por ser generado lo dejaría entero sin
verificar — y una entrada que nombra un archivo que el compilador no emite se descubre recién en la
copia de otro. La única exención es **«esa salida todavía no se construyó»**, y dura lo que dura no
haber compilado: `npm test` construye los paquetes antes, así que ahí se verifica. Lo que quede sin
mirar **se informa con su número**.

Existe porque `.gitignore` tenía una línea `build/` —puesta para salida de compilación— y se comió
`packages/core/build/` entero, que es fuente: el mecanismo de versión de `CU-35`. **Acá andaba
todo**, porque los archivos estaban en el disco de quien los escribió; se rompía en la copia de
otro, que es lejos de la causa y en la máquina equivocada.

#### Cuándo una categoría se gana su propio paquete

- Tiene **un consumidor distinto** — alguien que la quiera sin el resto.
- Tiene **un ritmo distinto** — cambia mucho más seguido, o mucho menos.
- Arrastra **una dependencia pesada** que no todos quieren pagar.

**La sesión ya cumple dos**: tiene especificación y ritmo propios, y arrastra `oidc-client-ts` con
toda la incertidumbre del proveedor. Por eso está aparte desde el principio y las otras tres no.

#### Por qué se empieza con pocos

**Partir después es barato** si los límites ya están puestos: es mover archivos y publicar.
**Juntar después rompe a todos**: fusionar dos paquetes publicados es un cambio mayor para cada
consumidor.

Y cuatro paquetes desde el principio traen el problema que de verdad los vuelve ingobernables:
**tres dependerían de sesión**, así que una aplicación puede terminar con dos versiones conviviendo
— y ese defecto se diagnostica mal y tarde.

#### Cómo se actualiza una aplicación

| pasa esto en cuarzo | cómo llega |
|---|---|
| Un defecto en cualquier conducta | `npm update` — **llega a las cuatro** |
| Una funcionalidad transversal nueva | `npm update`, y cada aplicación la usa cuando quiera |
| Un cambio en la forma | **No llega solo.** Se anuncia, y cada aplicación decide |

Esa última fila es **el único costo real**, y está acotado a seis archivos.

> Nada impide dejar cuarzo como remoto `upstream` y traer un cambio de forma con un merge. Sirve
> mejor al principio que a los dos años: en cuanto la aplicación toca los mismos archivos, cada
> merge es un conflicto. **Es una comodidad, no el mecanismo.**

---

### CU-41 · El ruteador, y de dónde salen los tipos

**Estado**: decidida · **Depende de**: CU-15, CU-23

> **Enmienda OPE (2026-10-08).** Sin cambio de fondo. Se cita porque el estado de una grilla en la dirección lleva **el cursor del último tramo cargado** (`<grilla>.c`) en vez de un número de página (`.p`), y un enlace con cursor reproduce ese tramo (`OW-4`).

**React Router como transporte, y los tipos salen del registro de CU-23.**

#### Por qué el registro y no el ruteador

`CU-23` ya hizo de la declaración de pantalla **la única fuente**: de ahí salen el menú, las rutas y
el filtrado por capacidad de los dos lados. Un ruteador moderno **también quiere ser el lugar donde
se declaran las rutas**, y ahí aparece el problema que esta familia ya rechazó varias veces: dos
fuentes que un día no coinciden.

React Router lo permite evitar porque sus rutas son **objetos comunes**: el arreglo de rutas se
**arma a partir del registro**, no se escribe. El registro sigue siendo la fuente.

#### Cómo se tipa la navegación

Una capa propia deriva los tipos de parámetro **de las rutas declaradas**, con tipos de plantilla
literal. Se navega con la forma que ya fijó `CU-23` — la pantalla del registro y sus parámetros:

```ts
goTo(screens.companyDetail, { id })   // ok
goTo(screens.companyDetail, { di })   // no compila: ése no es su parámetro
goTo(screens.companyDetai,  { id })   // no compila: esa pantalla no existe
```

Los dos errores los agarra el compilador, que es lo que `CU-23` pedía.

#### Qué forma puede tener una ruta

**Dos, y nada más**: segmentos estáticos, y `:parametro` que ocupa el **segmento entero**.

| | |
|---|---|
| `/catalog` · `/companies/:id` · `/companies/:id/lines/:lineId` | **Sí** |
| `/reports/:year?` | **No.** Un opcional se lee como `string | undefined`, que es el agujero que esta decisión cierra |
| `/files/*` | **No.** Un comodín no tiene nombre, así que no hay qué tipar |
| `/files/:name.:ext` | **No.** Dos parámetros en un segmento producen una clave inventada |

**Lo que no se soporta no compila al declarar la pantalla**, no al navegar. El arreglo está en la
declaración, así que el error tiene que estar ahí.

Es lo que hace que la lista corta sea sostenible: agregar una forma es una decisión, no algo que
alguien descubre que no anda. Si mañana una aplicación necesita un comodín —una pantalla de «no
encontrado», por ejemplo—, se decide acá y se amplía; **lo que no puede pasar es que se declare y
falle en producción**.

> **De dónde salió esta lista.** El tipo tenía un solo caso de salida —`Record<never, string>`— que
> significaba a la vez «esta ruta no tiene parámetros» y «no entendí esta ruta». Con las dos cosas
> iguales, `goTo` dejaba navegar sin pasar nada: un `/files/*` viajaba **literal** en la URL, sin
> fallar en ningún lado. Separar los dos significados es casi todo el arreglo.

#### Qué se descartó

**TanStack Router.** Trae la navegación tipada resuelta y muy bien, sin escribir nada propio, y es
de la misma familia que TanStack Query, que ya está decidida (`CU-14`).

Se descartó porque **sus tipos salen de su propio árbol de rutas**. Mantener una sola fuente
obligaría a generar ese árbol desde el registro, peleando con sus convenciones — y lo que se ahorra
en código propio se paga en acoplamiento a una herramienta que quiere declarar lo mismo que nosotros.

#### El costo, declarado

**Mantenemos unas cuarenta líneas de inferencia de tipos**, que es código que hay que entender
cuando falle. Es poco, pero no es nada.

Si algún día molesta, la salida no es cambiar de fuente: es **generar el árbol del ruteador desde el
registro**. El registro sigue mandando en las dos ramas, y esa propiedad es la que se está
protegiendo acá.

### CU-42 · El manifiesto: dónde declara una aplicación lo suyo

**Estado**: decidida · **Depende de**: CU-20, CU-23, CU-36, CU-40

**Un nombre fijo por donde se empieza**: `src/app/manifest.ts`. Todo lo demás de `src/app/` que no
esté nombrado abajo es del marco y llega por paquete.

#### El problema que resuelve

**Hoy no hay respuesta a «dónde registro mis pantallas».** La raíz de composición mezcla el cableado
del marco con lo que declara la aplicación, así que quien clona tiene que **leer 218 líneas para
encontrar la que le toca editar**. Eso es exactamente lo que `CU-20` promete evitar: empezar una
aplicación tiene que ser clonar, no estudiar.

Y hay un costo peor que la molestia: mientras el cableado esté del lado copiado, **envejece en las
cuatro aplicaciones a la vez** y se arregla cuatro veces.

#### Qué declara

```ts
export const manifest = defineApplication({
  name,            // la marca de la barra
  screens,         // las que exporta cada funcionalidad — CU-23
  toCapabilities,  // la traducción de claims que sólo la aplicación puede hacer — CU-10
  userMenu,        // qué entradas propias, y qué se quita — CU-27
  systems,         // contra qué backends habla — CU-22
  sessionViews,    // opcional: reemplazos de las vistas por omisión
})
```

**Está tipado, así que lo que falta no compila.** Es la garantía más fuerte de las cinco aplicada a
la pregunta «¿me olvidé de algo al clonar?».

**Y lo que se quita se declara, no se omite** (`CU-27`): un menú corto porque alguien se olvidó es
indistinguible de uno corto a propósito.

#### El manifiesto junta; cada parte vive donde cambia

**No es un archivo, es una puerta.** `manifest.ts` sigue siendo por dónde se empieza a leer una
aplicación —eso es lo que `CU-20` compra—, pero **no acumula**: junta tres partes que cambian por
razones distintas y en momentos distintos.

**El criterio es uno: una razón de cambio por archivo.** Lo que se toca al agregar una
funcionalidad no vive con lo que se toca al cambiar los roles, ni con lo que casi nunca se mueve.

> **Cuáles son hoy no se escribe acá**, sino en el `README.md` de `src/app/`. Un inventario en una
> decisión envejece —la decisión no se toca cuando se agrega un archivo—, y éste envejeció: llegó a
> listar tres archivos cuando había nueve, y otro listaba uno borrado meses antes.

Un solo archivo con todas adentro **se edita todas las semanas por una de ellas**, y esconde las
otras dos, que casi nunca deberían moverse. Y crece con el sistema: veinte funcionalidades son
veinte importaciones y veinte renglones en el medio de la traducción de capacidades.

**Y una funcionalidad declara todo lo que aporta**, no sólo sus pantallas:

```ts
export const home = defineFeature({
  screens: [welcomeScreen, aboutScreen],
  userMenuEntries: [{ id: 'about', label: aboutScreen.title, screen: aboutScreen }],
})
```

La entrada del menú vive **con la pantalla que abre**. Separarlas es cómo una queda sin la otra: la
pantalla existe y nadie llega, o la entrada apunta a una ruta que se borró.

Con esto **agregar una funcionalidad es un renglón de `features.ts`**, y nada del manifiesto crece.

**Se descartó descubrirlas solas.** Un `import.meta.glob` ahorra ese renglón y a cambio nadie puede
leer qué entra en el artefacto: lo que no se nombra no se puede sacar, y una funcionalidad a medio
terminar se publicaría sola.

#### Qué NO declara

**Nada que el marco pueda derivar.** El menú sale del registro (`CU-23`), las rutas también
(`CU-41`), y la capacidad de una acción sale del contrato (`CU-37`). Si algo se puede derivar y
además se declara, hay dos fuentes.

**Ni una sola implementación concreta.** Quién resuelve la sesión lo sigue eligiendo el punto de
entrada, porque una bandera en un archivo declarativo sería la puerta trasera que `CU-36` rechaza.

#### Las vistas de sesión: un mapa, no un `switch`

Los siete estados de `001` se dibujan con una **estrategia por estado**:

```ts
type SessionViews = Readonly<Record<SessionStatus, () => ReactNode>>
```

**`Record<SessionStatus, …>` obliga a que estén los siete.** Agregar un estado a la unión **no
compila** hasta que alguien decida qué se ve.

Se descartó el `switch`, y no por gusto: el que había **fallaba abierto**. Tenía un `default` para
`active`, `expiring` y `waiting`, y se le agregó un estado de prueba a la unión — **cero errores de
compilación, y la aplicación se dibujaba entera**. Un estado nuevo pensado para bloquear algo
terminaba mostrando todo.

El núcleo trae las siete por omisión y la aplicación reemplaza las que quiera **sin tocar el
núcleo**: abierto a extender, cerrado a modificar.

#### Lo que esto mueve de lado

Con el manifiesto, la raíz de composición **ya no conoce a ninguna funcionalidad**: recibe el
manifiesto. Y entonces puede publicarse.

`CU-40` pedía que **la forma fuera delgada**, porque es lo único que no se actualiza solo. Esto es
lo que quedó de cada lado, y **la cuenta es completa**: decir «tres archivos» escondía la demo y las
comprobaciones, que son la mayor parte.

| se publica | |
|---|---|
| El arranque, la raíz de composición y el shell | `bootstrapApplication`, `Frame`, la barra de usuario |
| Las siete vistas de sesión, el diálogo de reingreso y el «sin permisos» | idénticas en las cuatro |
| La lectura y validación de la configuración | `BaseConfig` y `readConfig` |
| **Las comprobaciones**, como `cuarzo-check` | ~1000 líneas |

| se copia | cuánto |
|---|---|
| `manifest.ts` · `main.tsx` · `dev-session.ts` | lo que la aplicación declara y contra qué autentica |
| **Las dos pantallas de ejemplo** | el *hola mundo*: se borran cuando hay pantallas propias |
| La configuración de compilación e `index.html` | lo de siempre |

**Las comprobaciones se publican por la misma razón que el cableado.** Copiadas, una aplicación se
queda con las reglas del día que clonó — y sería la peor de las ironías: **lo que existe para que
las garantías no se pudran, pudriéndose.**

Con una excepción: **cada repositorio verifica sus propias decisiones**, así que dónde viven se
declara en su `package.json` y no se supone.

**La consecuencia que importa**: arreglar el camino de falla de la sesión ahora **les llega a las
cuatro aplicaciones con `npm update`**, en vez de arreglarse cuatro veces.

### CU-43 · Lo que el marco dice, en un catálogo

**Estado**: decidida · **Depende de**: CU-9, CU-27, CU-42

Los textos de las piezas que publica cuarzo —los siete estados de sesión, el arranque, la barra de
usuario— viven en **un catálogo tipado**, y una aplicación reemplaza los que quiera desde su
manifiesto.

```ts
// el manifiesto de la aplicación
strings: { reenterTitle: 'La sesión venció' }
```

#### Qué resuelve, y ninguna es el idioma

| | |
|---|---|
| **Se pueden reemplazar** | Lo que publica cuarzo se dibuja en las cuatro aplicaciones. Un mostrador no dice lo mismo que un panel de administración, y cambiar una frase obligaba a **reemplazar la vista entera** |
| **Se pueden leer juntos** | Todo lo que la aplicación le dice al operador en un archivo, en vez de repartido en seis |
| **Dejan de separarse solos** | Convivían «Volver a entrar» y «Hay que volver a entrar» para el mismo concepto, y nada lo notaba |

#### Por qué no `i18n`

**No hay segundo idioma en ninguna aplicación de Tandilia, ni pedido.** Diseñar para uno hipotético
es lo que este repositorio rechaza en todo lo demás.

Y no es gratis: una biblioteca de internacionalización trae un formato de mensajes, una extracción,
y **catálogos que se cargan por red**. Eso último mete un estado «cargando textos» en el arranque,
que es exactamente donde CU-9 pide que no haya destellos.

**Si algún día hay un segundo idioma**, el catálogo tipado es de dónde se parte: las claves ya
están, y lo que cambia es de dónde salen los valores.

#### Qué NO entra

**~~Los textos de las pantallas.~~** **Enmendado el 2026-08-23**: también van a un catálogo, pero
**uno por funcionalidad**, en `features/<x>/strings.ts`.

Lo que la enmienda corrige es el alcance, no el criterio. La decisión aplicó a cuarzo dos razones
—«se leen juntos» y «dejan de separarse solos»— y **se las negó a la aplicación**, que es donde hay
cuarenta pantallas en vez de siete piezas. En el esqueleto, con diecinueve textos, «Nuevo artículo»
ya estaba escrito **tres veces en dos archivos**: el botón de la barra, el del vacío, y el título
del diálogo.

**Por funcionalidad y no uno por aplicación, y la primera razón es que no se puede**: CU-15 fija
`lib` → `features` → `app` y nunca al revés, así que una funcionalidad no puede importar un
catálogo de `app/`. Ponerlo en `lib/` sería peor: los textos **sobrevivirían a la funcionalidad que
los usa**, y quedarían claves que nadie sabe si todavía sirven.

Por funcionalidad, en cambio, se leen juntos en el alcance donde se revisa la redacción —un
dominio—, **viajan con lo suyo** al copiarse o borrarse, y no cruzan ningún límite.

**La regla es una sola, sin zona gris: todo lo que el operador lee sale del catálogo de su
funcionalidad**, incluido el `title` de `defineScreen` que alimenta el menú, el encabezado de la
página y la entrada del menú de usuario. Dejar los títulos afuera «porque son declaración» devuelve
la mitad de los textos a cada lado, que es el estado del que se salió.

La aplicación tiene el suyo en `app/strings.ts` para lo que ella aporta al marco.

**Los mensajes de `throw`.** Los lee un desarrollador, no un operador. Meterlos al catálogo los
haría competir por redacción con lo que sí es interfaz, y le daría a una aplicación una palanca para
cambiar un mensaje de diagnóstico.

#### Lo que lo sostiene

**Un tipo**, así que a una clave que falta no se le puede olvidar el valor por omisión: no compila.

**Y la regla 10 de `quality.mjs`**: una frase suelta falla, en `ui/` y `app/` del paquete y en
`features/` y `app/` de la aplicación. Sin eso, la próxima frase se escribe donde se dibuja —que es
lo cómodo— y el catálogo queda a medias sin que nada avise.

**Mira también las plantillas**, entre interpolación e interpolación: mover un texto al catálogo y
dejar el resto adentro de una plantilla lo deja igual de suelto, y es la puerta de atrás más fácil
de usar sin darse cuenta.

**Y el texto entre etiquetas**, no sólo lo entrecomillado: las tres copias de «Nuevo
artículo» eran hijas de un `<Button>`, así que una regla que sólo mirara cadenas **no habría agarrado
el caso que la motivó**. Su límite está escrito al lado: descarta lo que trae `(`, `)`, `=` o `:`
para no confundir un genérico de TypeScript con un rótulo, y con eso un rótulo con dos puntos
adentro se le escapa.

Quedan afuera los **diagnósticos** —un `new Failure(...)`, la razón de un campo de configuración— y
los **claims de mentira** de `dev-session.ts`, que son datos y no redacción.

#### Fuera del proveedor no falla, y es a propósito

A diferencia de las preferencias, `useStrings()` devuelve los de por omisión si no hay proveedor.
Hay un caso legítimo y es el peor de todos: cuando no se pudo leer la configuración, la pantalla de
arranque se dibuja **antes** de que exista un manifiesto del cual sacar textos. Una aplicación que
no arranca tiene que poder decir por qué.


### CU-44 · Una pantalla informa qué pasó; la aplicación decide qué sigue

**Estado**: decidida · **Depende de**: CU-15, CU-23, CU-26, CU-41, CU-44

Una funcionalidad que termina un flujo **no conoce a la que sigue**. Informa un **desenlace**, y a
dónde lleva eso vive en un solo archivo de la aplicación.

```ts
// features/invoicing/feature.ts — qué le puede pasar
outcomes: { issued: outcome<{ id: string }>('invoicing.issued') }

// la pantalla — informa, y no sabe a dónde va
<Button onClick={() => emit(invoicing.outcomes.issued({ id }))}>Finalizar</Button>

// app/flows.ts — el mapa de cómo se atraviesa (`CU-47`)
finishes(invoicing.outcomes.issued, invoiceScreen, ({ id }) => ({ id }))
```

#### El problema que resuelve

`CU-15` prohíbe que una funcionalidad importe de otra, y con razón. Pero `goTo` navega con el objeto
de la pantalla, así que **un enlace entre dominios no se podía escribir**: de una factura al cliente
que la debe son dos carpetas distintas, y el operador espera un enlace directo.

Se descartaron tres salidas antes de ésta: abrir el barril de la otra funcionalidad —riesgo de ciclo
de módulos, y el acoplamiento vuelve—, un mapa de destinos por texto —se pierde el tipado que
`CU-41` compró— y no enlazar nunca —obliga a agrupar grueso, y hay enlaces legítimos entre dominios
distintos—.

#### El nombre dice qué pasó, no a dónde ir

`issued`, no `goToInvoice`. Si se nombra por el destino, esto es `goTo` con una escala en el medio
y la funcionalidad volvió a conocer a la que sigue. **Es la única disciplina que el mecanismo no
puede verificar solo**, y de la que depende que sirva.

#### Moverse adentro también es un desenlace · **enmendado el 2026-08-23**

> **Decía**: *«Salir de tu funcionalidad es un desenlace; moverte adentro es `goTo`. Una sola regla,
> sin excepciones, y ya está mecanizada: la comprobación de límites prohíbe el import, así que no
> hay forma de escribir la otra.»*

**Ahora toda navegación entre pantallas es un desenlace, incluida la que no sale de la
funcionalidad.** Una pantalla no nombra a otra, nunca.

La regla vieja tenía un argumento bueno, y es el mismo que la tumba:

> *«Cuesta un renglón más por enlace. Se paga porque el renglón de más es **sistemático** y la
> alternativa —dos mecanismos, y elegir cuál cada vez— es **criterio**: quien nunca elige no se
> equivoca.»*

Al permitir `goTo` adentro y desenlace afuera, **esta decisión creó exactamente las dos formas que
quería evitar**. Y no quedó en teoría: en la misma funcionalidad, la grilla del catálogo llamaba a
`goTo(articleScreen)` y la ficha informaba un desenlace — dos respuestas distintas a la misma
pregunta, en el mismo par de archivos, elegidas por proximidad. Estuvo anotado en
[`deuda.md`](deuda.md), con su asimetría sin explicar.

**Y hay una razón que la regla vieja no podía ver**, porque llegó de afuera. `granito#PED-11`:

> *«Si la pantalla lo importara, dejaría de servir en otro flujo — que es justo lo que veníamos
> protegiendo.»*

Una pantalla que nombra su destino **sirve en un solo recorrido**. La ficha de artículo alcanzada
desde el catálogo y alcanzada desde una recepción de mercadería terminan en lugares distintos, y con
el destino adentro de la pantalla eso no se puede escribir.

#### Lo que la enmienda conserva

**Todo lo demás de esta decisión sigue en pie**, y es la mayor parte:

- **El nombre dice qué pasó, no a dónde ir.** `issued`, no `goToInvoice`. Sigue siendo la única
  disciplina que el mecanismo no puede verificar solo, y ahora aplica a más lugares.
- **Qué puede llevar un desenlace**: plano y de primitivos, porque tiene que poder terminar en una
  URL. Con la pila eso deja de ser prudencia y pasa a ser necesidad: **un escalón se guarda y se
  restaura al recargar**.
- **La política recibe, no busca.**
- **No arranca si la política quedó incompleta**, en los dos sentidos. Y la respuesta a la pregunta
  de granito —*«¿un resultado sin mapear es un error de compilación?»*— sigue siendo la de acá:
  **no, falla al arrancar**, porque compilarlo exigía duplicar la inferencia de tipos que `CU-41` ya
  anota como costo. A cambio la falla es determinística y no llega a producción.

#### Lo que cambia, en concreto

| | antes | ahora |
|---|---|---|
| moverse adentro de una funcionalidad | `goTo(otraPantalla)` | un desenlace |
| a dónde lleva un desenlace | una arista suelta en `app/routing.ts` | un paso de un flujo declarado |
| quién conoce el destino | la pantalla, si era adentro | **siempre el flujo** |
| qué lo impide | nada, adentro de una funcionalidad | la comprobación de límites: **una pantalla no importa a otra pantalla** |

> **Cumplida.** La implementó `specs/003-la-pila-de-flujo`, que es de donde salió la enmienda — no
> se enmendó primero y se vio después qué hacer. Ninguna pantalla llama a `goTo`, y **la comprobación
> de límites falla si alguna lo intenta**: sólo `feature.ts` y `app/flows.ts` pueden nombrar una
> pantalla.

**El menú lateral sigue afuera**, y por la razón que ya estaba escrita: no es una funcionalidad, es
el marco, y sus entradas llevan un `href` de verdad.

**Cómo se atraviesa una aplicación —la pila, los cuatro verbos, el flujo actual— es una decisión
aparte**, y se especifica en [`specs/003-la-pila-de-flujo/`](../specs/003-la-pila-de-flujo/spec.md).
Acá queda sólo lo que esta decisión decía y pasó a decir.

#### Qué puede llevar un desenlace

```ts
type Payload = Readonly<Record<string, string | number | boolean>>
```

**Plano y de primitivos**, que es `CU-26` —«se guardan identificadores, no datos»— convertido en algo
que el compilador verifica.

No es una limitación por prudencia: lo que viaja tiene que **poder terminar en una URL**, o el flujo
se rompe cuando alguien recarga o pega un enlace — y ése es el defecto que sólo aparece en
producción.

Un paquete grande —el borrador de un wizard de seis pasos, lo que junta una saga contra varios
sistemas— **no va acá**. Va a su propio lugar, y lo que viaja es su identificador, que es un
primitivo. **La restricción es lo que deja eso posible**: si el desenlace cargara objetos, el
mecanismo bueno nunca se construiría porque siempre habría algo más cómodo a mano.

> **Ese lugar todavía no existe, y es a propósito.** `CU-11` descartó la maquinaria de borradores
> escribiendo sus dos trampas: uno restaurado para un usuario distinto del que lo escribió, y uno
> restaurado sobre algo que el servidor ya guardó. La primera ya tiene respuesta en `CU-26`; la
> segunda la tendría en `CU-34`. Cuando aparezca el primer flujo que lo necesite, se decide con eso
> a la vista.

#### La política recibe, no busca

El destino recibe **puertos** —hoy `goTo`— en vez de importarlos. Cuando exista el de avisos de
`CU-25`, entra ahí y una política pasa a poder decidir *navegar y además avisar* sin tocar ninguna
pantalla.

#### Lo que lo sostiene: no arranca

**La aplicación no arranca** si un desenlace declarado quedó sin destino, o si hay un destino para
un desenlace que ya nadie declara. El segundo es el que importa: es la regla que queda viva después
de borrar la funcionalidad que la usaba, y ésa se pudre en silencio.

Es un escalón menos que «no compila», y la elección está declarada: la alternativa era duplicar la
inferencia de tipos que `CU-41` ya anota como costo. A cambio la falla es determinística, pasa en el
primer arranque de cualquiera, y **no puede llegar a producción**.

**Y dos desenlaces con el mismo identificador fallan al componer**, por la misma razón que dos
pantallas con la misma ruta: el ganador dependería del orden en que se juntaron las funcionalidades.


### CU-45 · Una falla del marco dice qué clase de falla es

**Estado**: decidida · **Depende de**: CU-17, CU-25

Lo que el núcleo tira es una `Failure` con un **código**, no un `Error` con un texto.

```ts
throw new Failure('navigation.missingParam', `Falta el parámetro "${name}" para navegar a "${screen.id}".`)
```

#### Por qué

Con `throw new Error(texto)`, distinguir «falta un parámetro» de «se usó un puerto fuera de su
proveedor» obliga a **leer el mensaje**. Y un mensaje está escrito para una persona: se reescribe
cuando queda poco claro — y ahí se rompe en silencio todo lo que dependía de su texto.

**Las primeras en depender del texto fueron nuestras propias pruebas**, que afirmaban contra
expresiones regulares sobre el mensaje. Mejorar una redacción rompía una prueba que no tenía nada
que ver, lo que enseña exactamente lo contrario de lo que queremos: a no mejorarla.

**El código es lo estable; el mensaje, lo legible.**

#### Cuatro clases, no un catálogo

| | cuándo | ejemplo |
|---|---|---|
| `declaration.*` | al componer, antes de dibujar nada | dos pantallas con la misma ruta, un desenlace sin destino |
| `startup.*` | al arrancar | falta el contenedor en `index.html`, falta configuración |
| `wiring.*` | al usar un puerto fuera de quien lo provee | `usePreferences()` sin su proveedor |
| `navigation.*` | la URL no corresponde a lo declarado | falta un parámetro de la ruta |

La lista es **corta a propósito**: son las clases de falla que el marco puede producir, no un
identificador por mensaje. Si hace falta una nueva se agrega a la unión, y todo lo que las trate
exhaustivamente deja de compilar hasta contemplarla.

#### Qué NO cambia

**Sigue siendo un `Error`.** La pila, un `console.error` y un límite de error de React lo tratan
igual. Lo que se agrega es algo estable con qué distinguirlo.

**`IncompleteConfig` conserva su `missing`.** El código dice qué clase de falla es; la lista dice
qué hay que escribir en `/config.json` (CU-17).

#### Qué queda afuera, y se dice

**Los de la aplicación.** Una aplicación tira lo suyo como quiera: sus fallas no las trata nadie más.

**Los de `@cuarzo/session`.** El núcleo depende de ese paquete, así que no puede al revés sin un
ciclo. Son dos, los dos de cableado, y quedan como `Error`. Si algún día hay que distinguirlos, la
salida es mover `Failure` al paquete de abajo — no duplicar el tipo.

#### Lo que lo sostiene

**La regla 11 de `quality.mjs`**: un `throw new Error(` en `packages/core/src/` falla. Sin eso, el
próximo se escribe como siempre —que es lo cómodo— y el tipo queda a medias sin que nada avise.


## Lo que falta decidir

Cuatro, y acá están tres: la **CU-18** —cómo viaja una autorización por excepción— vive en
[`seguridad.md`](seguridad.md), junto a las decisiones de las que depende. La sesión se cerró
entera, cómo se piden los datos también, y de las herramientas queda sólo el linter. Ninguna se
contesta sola. Están en orden de **cuánto duele decidirlas tarde**.

### CU-19 · Cómo consume una aplicación un feature flag

**Estado**: abierta · **Depende de**: TAN-1 *(plataforma)*

**La decisión de fondo no es de acá.** Si Tandilia usa feature flags es `TAN-1`, en el repositorio
de la plataforma, porque un flag que habilita una funcionalidad obliga al backend y al frontend a
la vez: decidirlo desde este lado dejaría al backend afuera de su propia decisión.

Lo que sí es de cuarzo es **cómo lo consume una aplicación de frontend**, el día que exista: de
dónde se lee, qué pasa mientras no llegó, y si una pantalla puede depender de uno.

Lo que ya se sabe y acota la decisión:

- **Un flag que decide qué se muestra cae en el terreno de CU-3**, que ya tiene tres estados —no
  podés nunca, podés, podés con autorización de otro—. Un flag no puede agregar un cuarto por la
  ventana.
- **Un flag que llega tarde es un estado de carga más** en cada pantalla que dependa de él, y eso
  choca de frente con CU-4. Si el valor no está al arrancar, la pantalla tiene que saber qué hacer.
- **Los puntos de configuración que ya existen no son flags** —dónde vive el token, el plazo de la
  espera, el cierre por inactividad— y no se convierten en flags por esta decisión. Se fijan al
  arrancar y no necesitan servicio ninguno.

**No se planifica antes que `TAN-1`.**

### CU-21 · Qué skills lleva el esqueleto

**Estado**: abierta · **Depende de**: CU-20

Qué skills propias viajan en el clon, para que un agente implemente una funcionalidad nueva sin
tener que releer todas las decisiones y acordarse de las cinco que no están en el código.

#### Por qué una skill vale más que un archivo de ejemplo

Un ejemplo se copia y se adapta, y un agente lo hace bien. Lo que **no puede inferir** del ejemplo
es lo que no está escrito ahí:

- que si el permiso no habilita la acción, **el botón no se muestra** — ni gris, ni nada (CU-3);
- que el error tiene que llevar el identificador del pedido, y que sale de `meta` (CU-4);
- que se ramifica por `error.code` y **nunca** por `message`, que es castellano para una persona y
  puede cambiar sin aviso (CU-14);
- que la grilla **no ordena ni pagina sola**: le pide al servidor;
- que el vacío se parte en dos cuando corresponde, porque la salida de «no hay nada todavía» es
  crear y la de «los filtros no dan resultados» es limpiar los filtros (CU-4).

Ninguna de esas cinco está en el archivo que se copia, y las cinco se olvidan.

**Una skill lleva las razones y las prohibiciones al momento exacto en que se construye.** Eso sube
el estándar de garantía: deja de ser «lo mira una persona en la revisión» y pasa a ser «se hereda».

#### Las candidatas, y en qué se apoya cada una

Ninguna es una idea suelta: las cinco salen de algo ya decidido.

| skill | de dónde sale |
|---|---|
| **Un listado con filtros** | La `Table` de granito, la paginación del contrato, los cuatro estados y el vacío partido en dos |
| **Una pantalla de formulario** | CU-5 y sus tres estados, `error.fields` mapeando a los campos, y el guardado que no acepta doble clic |
| **Conectar un servicio del contrato** | CU-14: generar los tipos, el servicio tipado, y la consulta con su clave de caché |
| **Un reporte con exportación** | ADR-008 del backend, que ya fija `…/export/{format}` en pdf, csv y xlsx |
| **Un proceso largo** | ADR-010, que los modela como *corrida*: hay que seguirla, no esperarla |

#### Cuándo se cierra, y por qué no ahora

**Una skill escrita antes de que exista una sola pantalla es la trampa del primer consumidor, con
multiplicador.** Un documento equivocado desinforma a quien lo lee; una skill equivocada **replica
la forma equivocada en cuatro aplicaciones, rápido y sin fricción**.

Se cierra **cuando la primera aplicación tenga tres o cuatro pantallas del mismo tipo** y se vea qué
se repitió de verdad. Antes de eso no hay evidencia: hay preferencia.

### CU-28 · Qué puede publicar una pantalla en el centro de la barra

**Estado**: abierta · **Depende de**: CU-23, CU-26

**No hay caso concreto todavía**, y se anota igual para que la declaración de una pantalla (CU-23)
deje la puerta en vez de tener que abrirla después.

**El mecanismo ya existe y está probado**: `PageChromeContext` de granito — una pantalla publica
hacia arriba y se limpia al desmontarse, con su razón escrita (si la pantalla se lo pasara al `Page`
**y** al `AppShell`, habría dos fuentes y un día no coinciden).

**Y granito ya puso el límite**, GR-38: en el centro **no van las acciones de una pantalla**,
que viven con su bloque. El candidato natural es contexto global de la sesión — que es exactamente
la sucursal y el cliente actual de CU-26.

**Lo que falta**: un caso real. Si aparece uno que no sea ni el contexto de la pantalla —que ya
tiene lugar en `Page`— ni sus acciones, hay que ver si entra o si es una propuesta a granito
(principio IV).

---

## Cómo se hace cumplir

Un documento no asegura nada por sí solo. La prueba es este mismo repositorio hermano: granito
tiene 51 decisiones escritas con su razón, y aun así el paquete se publicó sin tipos, una tabla
perdió sus columnas y la biblioteca decía ser agnóstica sin serlo. **Las cuatro las agarró una
prueba, no un documento.**

Las garantías, de más fuerte a más débil:

| | qué significa |
|---|---|
| **Se genera** | nadie lo escribe a mano, sale de una fuente |
| **No compila** | el tipo hace imposible lo incorrecto |
| **Se hereda** | se empieza clonando el esqueleto, no armando |
| **Lo agarra una prueba** | una comprobación que corre en cada repo |
| **Lo mira una persona** | lo último, para lo que ninguna máquina ve |

**Un documento no está en la lista.** Es lo que hace posibles las cinco, y no reemplaza a ninguna.

Y lo que no se puede asegurar conviene decirlo: que una pantalla componga bien, que el texto diga
lo que tiene que decir, y que un nombre sea el correcto. Eso lo mira una persona, siempre.

### CU-46 · Cuándo un botón se deshabilita, y quién sabe la regla

**Estado**: decidida · **Depende de**: CU-3, CU-25, CU-34, CU-37

Un botón puede no estar disponible por tres razones distintas, y **se confunden siempre porque las
tres terminan en un botón que no se puede apretar**.

| | quién la sabe | qué hace el botón |
|---|---|---|
| **El permiso** | El contrato, y de ahí se deriva (CU-37) | **No se dibuja** (CU-3) |
| **El estado de la pantalla** | La pantalla | `disabled` mientras guarda, mientras falta seleccionar |
| **Una regla de negocio** | **El backend** | Ver abajo: casi siempre, nada |

Las dos primeras ya estaban decididas. Esta decisión es sobre la tercera.

#### La regla de negocio no vive acá, y no es una preferencia

`las-animas/backend` declara sus reglas en el contrato, con la misma forma que `x-required-roles`:

```yaml
x-invariants:
  - code: ENTRY_NOT_REVERSIBLE
    status: 409
    rule: entry(:entryId).type in ('DEBIT_NOTE', 'CREDIT_NOTE', 'RECEIPT')
```

Son **45 reglas en 24 operaciones**, y la medición es la que decide:

| | |
|---|---|
| Necesitan estado del servidor — `count(...)`, `balanceOf(...)`, `lastSettlement(...)` | **29** |
| Hablan del dato que la pantalla ya tiene | 16 |

**Las dos terceras partes no las puede contestar un navegador.** Escribir predicados acá cubriría
16 de 45 y fallaría en silencio en las otras 29: el botón diría que sí y el servidor que no. Eso es
**peor que no anticipar nada**, porque le enseña al operador que el botón miente — y una vez que lo
aprendió, tampoco cree a los que sí están bien.

#### Entonces: casi siempre no se anticipa

**El servidor contesta, y la puerta de acciones ya lo muestra** (CU-25). El `409` vuelve con su
código y con un `message` que el contrato define como *«castellano porque lo lee una persona en el
panel»*. No hay nada que construir.

El costo es un clic desperdiciado. Lo que se compra es que **no exista una segunda fuente de la
regla**, que es lo mismo que CU-37 compró para los permisos.

#### La excepción, con su límite escrito

Se deshabilita **sólo cuando la respuesta se lee del dato que la pantalla ya trajo**: una fila que
muestra `reversed: true` y ofrece «anular» es una contradicción en la misma línea de la grilla.

> **El predicado sólo puede mirar campos de la entidad que la pantalla ya tiene.** Si necesita un
> `count`, un saldo, o traer otra entidad, **no es de cuarzo**.

Sin ese límite el predicado crece hasta ser una reimplementación parcial del backend, y la parte que
le falta es invisible. Con el límite, lo que queda es tan chico que no se puede desincronizar mucho:
si el campo desaparece del contrato, no compila.

Vive **al lado de la acción**, en `features/<x>/data/`, y **devuelve el motivo, no un booleano**:

```ts
export function whyNotReverse(entry: AccountEntry): string | undefined {
  return entry.reversed ? movementStrings.alreadyReversed : undefined
}
```

El motivo porque granito lo pide: *«por qué este movimiento no se puede anular depende del estado y
cambia — se deshabilita con `aria-disabled` para que el operador pueda llegar y enterarse, y el globo
es con lo que se entera»*. Un booleano deja el globo vacío, y entonces cada pantalla inventa su
texto. Se lo pedimos —`granito#PED-12`— y lo resolvieron el mismo día con `disabledReason`, que
`ActionButton` recibe sin traducir nada. La tabla de las tres clases quedó también del lado de ellos,
en `GR-64`.

> Y encontraron algo que confirma el pedido: **su propio demo hacía el rodeo**, envolviendo el botón
> en un globo por fuera. Si el repositorio que define la regla la resuelve así, ningún consumidor la
> va a resolver de otra forma — y cada uno con su redacción.

> **El esqueleto ya no tiene un ejemplo de esto — anotado el 2026-08-23**, y conviene saberlo antes
> de buscarlo. El que había era `whyNotDeactivate`, y **era una tautología**: «no se puede desactivar
> lo que ya está desactivado». Se leía como una regla de negocio y era **la operación inversa que
> faltaba**, disfrazada de botón apagado. Al agregar «Activar» desapareció sola, que es la señal de
> que nunca fue una regla.
>
> Queda en `docs/deuda.md`. Lo que restringe: quien escriba el primer predicado de verdad no tiene
> de dónde copiar, y el riesgo concreto es que repita la tautología creyendo que aplica esta
> decisión.

#### En una grilla, el botón de la fila es un componente

Una declaración de acción, N botones. **Cada botón es su propio componente**, y no un `useAction` de
la pantalla llamado con la fila:

```tsx
{ id: 'actions', header: '', cell: (entry) => <ReverseButton entry={entry} /> }
```

Dos cosas dependen de eso, y las dos se rompen en silencio si se hace al revés:

**`running` es del hook.** Con uno solo para la grilla, ejecutar una fila deshabilita las veinte.

**La clave de idempotencia se recuerda por cuerpo.** Anular A, que falle, anular B, y reintentar A:
con memoria de una sola ranura, A salía con **clave nueva** y el servidor lo aplicaba dos veces —
justo lo que CU-34 existe para evitar, y sin nada visible en pantalla. Se corrigió a un mapa por
cuerpo que se limpia al salir bien; lo verifica `packages/core/tests/idempotency.test.ts`.

**Y la columna entera sale de `requires`.** Si el permiso no habilita, esconder los veinte botones
deja una columna vacía con encabezado, que es ruido con otra forma.

#### Qué NO decide esta decisión

**Que el backend publique qué se puede hacer con cada entidad.** Sería una sola fuente para las 45,
pero evaluar agregados por fila es un `N+1` en cada grilla. Si alguna vez entra, entra por una
pantalla de una sola entidad y con su medición; no se supone acá.

---

### CU-47 · Cómo se atraviesa una aplicación: el flujo, la pila y los cuatro verbos

**Estado**: decidida · **Depende de**: CU-3, CU-14, CU-15, CU-23, CU-26, CU-41, CU-42, CU-44

Un **flujo** declara un recorrido: por dónde se entra y qué pasa después de cada desenlace. La
aplicación mantiene una **pila** de escalones, y `CU-44` —recién enmendada— hace que toda navegación
entre pantallas pase por acá.

Se especifica en [`specs/003-la-pila-de-flujo/`](../specs/003-la-pila-de-flujo/spec.md).

#### El problema que resuelve

**Volver de una pantalla pierde dónde estabas.** El operador filtra una grilla, va a la página
cuatro, abre un detalle, y al volver está en la página uno sin filtro. `GR-73` lo mide bien:
*«esperar la carga es molesto; perder dónde estabas te obliga a rehacer el camino»*.

Y hay un segundo problema que no se veía desde acá, y que llegó con `granito#PED-11`: **una pantalla
que nombra su destino sirve en un solo recorrido**. La ficha de artículo alcanzada desde el catálogo
y alcanzada desde una recepción de mercadería terminan en lugares distintos, y con el destino
adentro de la pantalla eso **no se puede escribir**.

#### Qué es un flujo, y dónde vive

`root` y `steps`, y nada más. **En la aplicación** —`src/app/flows/`, un archivo por flujo— y
**nunca adentro de una funcionalidad**: un flujo que cruza dos carpetas no se podría escribir en
ninguna (`CU-15`), y tener flujos internos allá y flujos que cruzan acá son exactamente las dos
formas que `CU-44` acaba de dejar de permitir.

El manifiesto gana `flows` y pierde `routing`. Sigue sin crecer con el sistema: es un renglón, y
`app/flows/` es una carpeta.

#### Los cuatro verbos, y la celda que los separa

| | está en la pila | no está |
|---|---|---|
| **abrir** | desenrolla hasta ella | **apila** |
| **terminar** | desenrolla hasta ella | **reemplaza** el escalón actual · sin destino, la raíz |
| **cerrar** | — | desapila uno |
| **omitir** | — | **no navega: acá esa acción no se ofrece** |

*«Si está en la pila, desenrollá»* lo comparten los dos primeros, y de ahí sale que **la recursión no
sea un caso especial**: un ciclo `A → B → A` no crece, se desenrolla.

Lo único que diferencia abrir de terminar es **si el escalón donde estabas sigue teniendo sentido**.
Cuando terminaste, no — y por eso se reemplaza. Si apilara, cerrar desde el comprobante devolvería
**al formulario de cobro que se acaba de enviar**, que es el caso con el que `GR-36` argumentó contra
la pila entera.

#### La identidad de un escalón es pantalla **más parámetros**

Con la pantalla sola, `movimiento#7 → movimiento vinculado#9` desenrollaría al `#7` y **nunca
mostraría el `#9`**. Comparando con los parámetros, la pila crece **lo que el operador caminó** y
cerrar deshace ese camino paso a paso.

Un escalón lleva sólo primitivos, porque **se serializa y se restaura al recargar**. Es `CU-26`
—identificadores, no datos— dejando de ser prudencia y pasando a ser necesidad.

#### Una pantalla puede estar en varios flujos, y es el objetivo

Un flujo **no posee pantallas**: es un camino, no un contenedor. Lo que trae de cola es lo que hoy no
se puede escribir: **el mismo desenlace con destinos distintos según el flujo**.

Y el destino de un paso puede ser **una pantalla o un flujo**. Nombrar un flujo lo empieza por su
raíz y abandona el actual — que es como se resuelve el cruce de contexto sin un concepto nuevo, y lo
que vuelve computable «estoy saliendo del flujo».

#### Un flujo tiene que decir algo sobre cada desenlace, y omitir es decir algo

Preguntar *«¿este desenlace tiene un paso?»* **en general** aprueba justo el caso que esta decisión
existe para permitir: la misma pantalla en dos flujos, con el segundo sin declarar nada. Arranca en
verde y revienta al hacer clic.

Así que se pregunta **por flujo**. Y ahí aparece que hay **dos cosas distintas** que un flujo puede
querer decir sobre un desenlace, y sin un cuarto verbo **se escriben igual: no escribiendo nada**.

| | |
|---|---|
| un paso | acá esto lleva a tal lado |
| `omits` | acá esto no se ofrece |

Con las dos colapsadas en el silencio, **un olvido y una decisión son indistinguibles**: quien lee el
flujo no sabe cuál fue, y quien lo escribe no se entera de que se olvidó. Es el argumento de `CU-44`
— dos formas son criterio, y quien nunca elige no se equivoca.

**La granularidad es la funcionalidad, no la pantalla**, y no por gusto: un desenlace se informa
también desde piezas que no son pantallas —una fila, un diálogo—, y a qué pantalla pertenecen **no se
deduce**. Atarlo a la pantalla exigiría una declaración cuyo olvido sería silencioso, que es lo que
esto vino a eliminar. Cuesta algún `omits` de más; el que sobra se lee, el que falta no.

**Y `offered: false` no es `requires`.** Lo segundo dice «esta sesión no»; lo primero, «acá no». Con
todas las capacidades del mundo, lo que el flujo omite sigue sin dibujarse.

#### El flujo actual y la pila viven en el contexto, no en la URL

En el `state` del ruteador, que es **estado de cada entrada del historial**. De ahí sale la propiedad
de la que depende todo lo demás: **el botón «atrás» funciona sin código**, porque retroceder trae el
estado de la entrada anterior.

Cualquier copia en un `useState` **se desincroniza con «atrás»**, y ese defecto no aparece hasta que
alguien usa el navegador como navegador.

| | qué dice | dónde |
|---|---|---|
| **la URL** | **dónde estás** — pantalla, parámetros, filtro y página | visible, compartible |
| **el contexto** | **cómo llegaste** — qué flujo, qué escalones | invisible, por pestaña, sobrevive al F5 |

Por eso el estado de una grilla servida (`CU-14`) pasa a parámetros de consulta y el flujo no:
**compartir un enlace con el filtro puesto es correcto; compartir el camino de otro, no**. Y ahí
*«cerrar devuelve el escalón anterior tal cual estaba»* sale gratis: ese escalón es una URL que ya
tenía su filtro.

#### Cuando no hay flujo: la raíz de la funcionalidad

Un enlace pegado o una pestaña nueva llegan sin estado. Entonces **el flujo activo es el que arranca
en la raíz de la funcionalidad de esa pantalla**, y **la pila arranca con la pantalla actual como su
único escalón**.

> **Uno, y no cero.** Con la pila en cero, abrir algo desde ahí y cerrarlo **no devolvería a la
> pantalla del enlace**: se perdería. Con uno, cerrar desde ella cae a la raíz —que es lo que se
> quiere— y cerrar desde lo que abrió vuelve a ella. Está escrito porque «pila vacía» se puede leer
> de las dos formas, y una de las dos pierde el escalón.

`Feature` gana `root` para eso, y de paso paga la deuda de las dos formas de navegar —*una
funcionalidad tiene una pantalla raíz*—, declarada en vez de acertada. **No ata la pantalla a un
flujo**: la funcionalidad ya la posee de verdad, por la carpeta donde vive, y eso lo verifica
`CU-15`.

#### Los dos menús no hacen lo mismo, y no es criterio de nadie

| | qué hace | por qué |
|---|---|---|
| **el lateral** | **abandona** el flujo y empieza el nuevo por su raíz | lleva a **otro trabajo** |
| **el de usuario** | **apila** sobre el flujo activo; cerrar vuelve | lleva a **algo tuyo** (`CU-27`) |

Perder el lugar para ir a otro módulo es el punto; perderlo para mirar una preferencia es puro
costo. **El programador no elige entre las dos**: lo decide cuál de los dos menús es.

Y esto **enmienda `CU-23` en un punto**: al menú lateral entra un flujo y no una pantalla, así que
`inMenu` se va de la declaración de pantalla y `section` se muda al flujo —agrupa navegación, y lo
que se navega ahora son flujos—. El rótulo se deriva de la raíz, y el flujo puede pisarlo.

#### El aviso de trabajo sin guardar, y qué cubre

Una pantalla declara con un booleano que tiene algo escrito. **No sabe qué es abandonar, ni quién
pregunta, ni con qué diálogo** — olvidarse es una línea que falta, no una lógica mal hecha.

**Aparece al cerrar y en los dos abandonos, y también en el botón «atrás».** No aparece al terminar:
acaba de guardar, y avisar de algo que no va a pasar entrena a ignorar el aviso.

> **El «atrás» se intercepta rebotando, no cancelando**: el navegador se mueve y el ruteador lo
> devuelve. Se midió antes de decidirlo — la especificación declaraba que era imposible, y **era un
> límite declarado que no existía**, que engaña igual que una garantía declarada que no existe.

**Lo que no se cubre**: cerrar la pestaña y recargar. Ahí el navegador pone su propio diálogo, sin
nuestro texto. Es de la plataforma, y está pedido a granito porque `GR-73` lo escribió sin ese
matiz.

#### Lo que lo sostiene: no arranca

Seis, y ninguna necesita que una pantalla pertenezca a un solo flujo:

1. Toda pantalla registrada es **alcanzable**: raíz de un flujo, o destino de algún paso.
2. **Cada flujo dice qué hace con cada desenlace de las funcionalidades que toca**: un paso, o
   `omits`.
3. Ningún paso apunta a un desenlace **que ya nadie declara** — el que se pudre en silencio.
4. Ningún paso nombra **un flujo que no existe**.
5. Toda funcionalidad con pantallas **declara su raíz**.
6. La raíz de una funcionalidad es la raíz de **exactamente un flujo**, que es lo que hace
   determinístico el caso del enlace pegado.

Es un escalón menos que «no compila», y la elección se hereda de `CU-44` con su razón: compilarlo
exigía duplicar la inferencia de tipos que `CU-41` ya anota como costo.

**El mensaje ofrece las dos salidas**, y eso es parte de la decisión y no del código: quien lo lee
—muchas veces un agente— tiene que poder actuar sin inventar. Un mensaje que sólo dice «falta algo»
se completa con lo que parezca razonable, y ahí es donde nace una cita inventada.

**Y la comprobación que faltaba**: sólo `feature.ts` y `app/flows.ts` pueden nombrar una pantalla.

#### Dos arrugas del navegador, aceptadas y escritas

**Desenrollar deja entradas vivas hacia adelante.** El botón «adelante» queda encendido sin que nadie
haya ido atrás. La ventana dura **hasta la próxima acción del flujo**, porque apilar trunca lo que
hay adelante. Se acepta con una prueba que lo fija; la alternativa conocida —desenrollar y después
apilar— la mata a cambio de que un «atrás» no se vea.

**Después de terminar, un «atrás» no se ve.** Es la consecuencia normal de reemplazar.

Van escritas y no descubiertas: la diferencia entre un costo elegido y un defecto.

#### De dónde salió

De afuera. `granito#PED-11` trajo `GR-73` —que reemplaza a `GR-36`— y con él el argumento que desde
acá no se veía. Esa deuda llevaba abierta desde que se escribió el catálogo,
esperando exactamente eso.

> **`GR-73` se trazó en papel**, y granito lo dijo. El catálogo del esqueleto es el primer flujo
> real: lo que aparezca es un pedido de vuelta para ellos, no un parche de este lado.

---

### CU-48 · El menú lateral se declara, y es un nivel

**Estado**: decidida · **Depende de**: CU-3, CU-23, CU-27, CU-43, CU-47

**Una lista de grupos y flujos sueltos, en orden, en un solo lugar.** Un grupo tiene nombre, sus
ítems, y opcionalmente un icono. **No anida.**

```ts
export const menu = [
  homeFlow,
  group(strings.masters, [catalogFlow, suppliersFlow], BOX),
  group(strings.ops, [invoicingFlow]),
]
```

#### Qué cambia de `CU-47`, y por qué

`CU-47` dejó el agrupado en un campo del flujo —`section: 'Maestros'`—. Funciona con un grupo y se
rompe con cinco, por tres cosas que quedaban **implícitas**:

- **El orden salía del orden de los flujos.** Mover uno en el arreglo reordenaba el menú, en
  silencio, y nada lo decía.
- **Un grupo no podía tener icono**: una cadena no tiene dónde llevarlo.
- **La cadena podía no existir.** `section: 'Maestrros'` creaba un grupo nuevo de un ítem, y el
  operador veía dos grupos parecidos sin que nada fallara.

**El grupo contiene sus ítems**, y con eso las tres desaparecen por construcción: el orden es la
lista, el grupo es un objeto que lleva su icono, y nadie nombra una cadena que pueda estar mal
escrita.

#### Y se lleva puesto `inMenu`

**Está en el menú el que está en la lista.** El flujo de sistema —`about` y las pantallas del
marco— simplemente no está, y no hace falta que declare que no quiere estar.

Es lo contrario de lo que `CU-23` fijaba para las pantallas —*lo que se quita se declara, no se
omite*—, y el cambio de forma es lo que lo justifica: **ahí la ausencia era invisible** —una pantalla
declarada que no aparecía, y había que buscar por qué—; acá **la presencia es la declaración**, y
mirar la lista contesta la pregunta.

#### Un nivel, y no compila el segundo

granito no pone límite: sus grupos anidan libremente. Cuarzo se queda en uno.

**No es una limitación técnica, es la que se puede sostener.** Un menú lateral de tres niveles
esconde lo de abajo detrás de dos gestos, y en una farmacia lo que se usa todo el día tiene que
estar a uno. El día que una aplicación demuestre que lo necesita, se abre con su caso.

`group()` toma flujos, así que un grupo adentro de otro **no compila** — antes de arrancar, y no
después.

#### Los iconos son opcionales, en los dos

Ni el grupo ni el flujo lo necesitan. **granito reserva el espacio igual**, así que un menú mixto no
se desalinea — que es la razón por la que en otros lados sería obligatorio.

Forzarlo llevaría a elegir cualquiera con tal de completar, y un icono que no significa nada es peor
que ninguno: el operador aprende a no mirarlos.

**Los iconos salen de granito, siempre.** Cuarzo no dibuja ninguno: hoy son **cero en 29 archivos**,
y lo verifica el verificador de ellos en cada `npm test`.

#### Lo que lo sostiene: no arranca

- **Un flujo listado dos veces.** Cuál gana dependería del orden, y ése es el defecto que aparece
  meses después y en una sola máquina.
- **Un grupo sin ítems** — declarado y vacío, que es una declaración muerta.

Y una que no falla porque no puede pasar: **el rótulo de un grupo es texto de interfaz**, así que
sale del catálogo y lo verifica `CU-43`.

#### Lo que se conserva

**Un grupo sin ningún ítem visible no se dibuja.** Si el operador no tiene la capacidad de ninguno
de sus flujos, el encabezado desaparece: un grupo vacío parece un error de carga, y a quien tiene
menos permisos le muestra la forma de lo que no puede hacer (`CU-3`).

**El rótulo de un flujo se sigue derivando de la raíz**, con el flujo pudiendo pisarlo (`CU-47`).

### CU-49 · Un rechazo que la pantalla no puede mostrar no se pierde

**Estado**: decidida · **Depende de**: CU-5, CU-14, CU-25, CU-29, CU-38, TAN-9 *(plataforma)*,
TAN-10 *(plataforma)*

**La regla de qué puede viajar en `fields` es `TAN-9`, y no se repite acá**: obliga a quien emite
los errores tanto como a quien los muestra, y cuarzo no gobierna a los backends. Lo del testigo —el
`ETag`, el `If-Match` y el transporte— es `TAN-10`.

Esta decisión es **la otra mitad**: qué hace cuarzo cuando el rechazo llega igual sin poder
mostrarse.

#### Que la regla se cumpla no se puede suponer

Cuarzo no verifica el contrato de nadie. Un backend que incumpla `TAN-9` no produce una pantalla
peor: **produce silencio** — ni aviso, ni campo marcado, el botón se vuelve a encender y el operador
se va convencido de que guardó.

Así que la protección **no puede depender de que el otro lado cumpla**. Se decide acá, en cuarzo, y
funciona contra cualquier servidor.

#### Dónde vive, y por qué no en la puerta

En `useForm`, y es una cuestión de información: **la puerta sabe qué rechazó el servidor, y sólo el
formulario sabe qué controles dibuja.** Hacen falta las dos para notar que sobra uno, y la puerta
tiene una sola.

**Dos formas de no poder mostrarse, y las dos terminan igual**: que no haya control con ese nombre,
y que la entrada no traiga texto. La segunda es la más frecuente y la más difícil de ver — un
servidor que llame `detail` a lo que el sobre llama `message` marca el campo **con nada adentro**,
que se ve idéntico a que no hubiera pasado nada.

En cualquiera de los dos casos **se avisa**, con el identificador del pedido y sin pedirle nada al
operador: no hay nada que pueda hacer.

#### Lo demás que cuarzo fija de su lado

| | |
|---|---|
| `PRECONDITION_REQUIRED` entra en los códigos que **dejan rastro** | son los defectos de la pantalla, no del operador: se registran donde los ve quien puede arreglarlos (`CU-25`, `CU-34`) |
| El contrato del ejemplo responde `428` al testigo faltante | es el molde que copian cuatro aplicaciones, y `TAN-9` propone ese código sin imponerlo |
| Una comprobación sobre el simulado | todo `field:` que emite tiene que ser una propiedad declarada en el contrato |

#### Lo que queda afuera

**Qué puede ir en `fields`** — es `TAN-9`. **Qué exige el testigo** — es `TAN-10`. **Qué código HTTP
usa cada backend** — es del contrato de cada sistema.
