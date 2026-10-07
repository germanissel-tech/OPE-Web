# Pedidos a cuarzo

Lo que otros repositorios de Tandilia necesitan de acá. **Se lee al empezar una sesión** — el
protocolo es `TAN-5`, en el repositorio de plataforma.

**El estado lo mueve cuarzo, no quien pide.** `abierto` → `aceptado` · `rechazado` · `hecho`. Un
`rechazado` lleva su razón y **se queda**: sin la razón escrita, lo mismo se vuelve a pedir en seis
meses.

**Se citan `PED-n` acá adentro, y `cuarzo#PED-1` desde afuera.** Nunca un número pelado.

---

## Abiertos

### PED-14 · Cuarzo no publica un catálogo de sus decisiones, pedidos, deuda, especificaciones y principios

**Estado**: **hecho** · **Pide**: plataforma · **Fecha**: 2026-08-26 · **Bloquea**: no

La auditoría de `TAN-8` encontró acá **48 decisiones `CU-n`**, **13 pedidos `PED-n`**, **4 entradas
activas de deuda**, **3 especificaciones** y **6 principios**. Las decisiones son más regulares que
en los otros repositorios —48 de 48 declaran `Estado` y 39 declaran `Depende de`—, pero esa forma
sigue siendo prosa local: plataforma tendría que aprender a leer dos documentos, el índice, las
carpetas de `specs/`, la constitución y `docs/deuda.md` para componerla.

Eso es lo que `TAN-8` prohíbe. **Quien conoce la forma de la documentación es quien emite su
catálogo**; entre repositorios no viaja el formato de los encabezados.

#### El antecedente que ya existe

`granito#PED-17` produjo un primer emisor real. Granito publica sus decisiones y pedidos desde la
prosa, conserva el identificador prefijado, usa repositorio + identificador como clave federada,
resuelve la fuente por documento + identificador **sin ancla**, y declara clase, dirección y
cobertura de cada relación. Sirve como evidencia y como contraste, **no como esquema para copiar**:
cuarzo tiene tres tipos que granito no tiene y ahí es donde se descubre si la forma generaliza.

#### Lo que pedimos

1. **Que cuarzo genere desde su propia documentación un `catalogo.json`** con las decisiones,
   pedidos, deuda activa, especificaciones y principios que hoy declara.
2. **Que el catálogo nunca sea una segunda lista manual.** Una comprobación tiene que fallar si la
   prosa y el artefacto divergen, si se repite una identidad o si una relación local no resuelve.
3. **Que `CU-n` y `PED-n` viajen completos**, nunca como número pelado. La identidad federada es
   repositorio + identificador local.
4. **Que las dependencias publicadas sean declaraciones, no menciones inferidas.** Cada clase de
   relación tiene que decir su cobertura —`completa`, `parcial` o `desconocida`— y cada relación
   emitida tiene que declarar la clase y dirección que la gobiernan.
5. **Que el estado local y su correspondencia con el eje común viajen declarados**, sin convertir
   una palabra local en estándar por proximidad.
6. **Que la fuente se resuelva por repositorio + documento + identificador semántico**, no por un
   ancla derivada del título.
7. **Que el generador y su comprobación se puedan ejecutar desde la raíz**, con un comando que la
   documentación diga y que exista ahí.

#### Las dos respuestas que necesitamos de cuarzo

**Deuda y principio no tienen identificador estable.** La deuda declara además que su número es
posicional y cambia cuando se paga una entrada. No inventen un identificador definitivo sólo para
cerrar este pedido: publiquen cómo los pueden reconocer hoy sin mentir sobre su estabilidad y
devuelvan qué necesitarían de plataforma para darles identidad federada.

**Una especificación es una carpeta, pero sus archivos no son uniformes.** Las tres tienen
`spec.md`; dos tienen `tasks.md` y una no. Digan qué consideran la entidad, cuál es su fuente y qué
pertenece a ella sin convertir cada archivo auxiliar en un tipo nuevo.

#### Qué NO estamos pidiendo

- **Que copien `catalogo.json` de granito.** La plataforma todavía no publicó el esquema ni la
  comprobación de conformidad; este segundo emisor existe para descubrir la forma común, no para
  fijarla desde un repositorio.
- **Que agreguen identificadores arbitrarios a deuda o principios.** Si la identidad actual no
  alcanza, ése es un dato que plataforma necesita recibir.
- **Que deduzcan dependencias recorriendo citas `CU-n` o `GR-n`.** Mención y dependencia no son lo
  mismo.
- **Que manden a consultar el índice federado desde `CLAUDE.md`.** El índice todavía no existe; un
  puntero anticipado fabrica el modo de falla que `TAN-8` busca eliminar.
- **Que incorporen términos.** El glosario es propiedad del backend y no se replica acá.

#### Qué hicimos mientras

La plataforma dejó los conteos y la divergencia observada en `../auditoria-fase-0-informe.md`.
Granito ya emitió el primer catálogo y dejó explícitos sus límites: dependencia todavía
`desconocida`, relaciones externas sin verificar y esquema de plataforma pendiente. Con la
respuesta de cuarzo se compararán los dos emisores antes de publicar el contrato común.

#### Respuesta de cuarzo · 2026-08-26

**Hecho.** `npm run catalogo` emite `catalogo.json` desde la prosa, y
`npm run catalogo -- --verificar` corre dentro de `npm test`.

```
75 entidades · 48 decisiones · 14 pedidos · 4 deudas · 3 especificaciones · 6 principios
```

Los conteos coinciden con los del informe de la fase 0. La única diferencia es un pedido más: éste.

#### Lo que el catálogo declara de sí mismo

La estructura sigue a la de granito —`clases_de_relacion` con su cobertura, `vocabulario_local`,
`fuente` por documento e identificador— porque comparar dos emisores es el punto. Lo que se agrega
es un bloque `identidad`, que dice **por tipo** qué forma tiene y si es estable. Va en el artefacto y
no sólo acá: **quien lo consuma no lee este pedido**.

`dependencia` sale **parcial**, y el número es 39 de 48. La ausencia de una arista no significa que
no exista.

#### Su pregunta 1 · deuda y principios

**La deuda no tiene identidad estable, y lo declara ella misma.** `docs/deuda.md` dice que sus
números son posicionales, que pagar una corre a todas las de abajo, y que **no se cita por número**.
Lo aprendió pagando una: siete lugares apuntaban a «la entrada 2» y desde ese día apuntaban a otra.

Se emite `orden` marcado como inestable y `titulo`, porque la regla que el propio documento se dio
es *«se cita por lo que dice»*. **Con una advertencia que también va en el artefacto**: reescribir un
título rompe la referencia igual, sólo que más despacio.

**Los principios sí tienen identificador en uso, y no debería.** `principio IV` aparece en cinco
archivos de código y siete veces en las decisiones. O sea que el romano **es** una cita — y corre
exactamente el mismo riesgo posicional que la deuda.

> **La diferencia no es técnica: la deuda tiene prohibido citarse por número y los principios no.**
> Las dos formas conviven en este repositorio, y nadie lo notó porque los principios nunca se
> reordenaron. Son seis desde el primer día.

Se emiten como `principio-N` con `identidad: en-uso-posicional`, que es lo que hay: mentir diciendo
`estable` haría que el índice acepte citas que un día se corren.

**Qué necesitaríamos de plataforma**: que el esquema tenga **una forma de decir «identificable pero
no citable»**, distinta de «sin identidad». Son tres casos y no dos —estable, en uso pero frágil, y
sin identidad—, y si el esquema sólo ofrece los extremos, cada repositorio va a elegir el que le
quede más cómodo. Nosotros elegiríamos mal: `principio-IV` se ve estable.

#### Su pregunta 2 · qué es una especificación

**La carpeta es la entidad, y `spec.md` es su fuente.** Ahí están `Carpeta`, `Estado`, `Fecha` y
`Pedido`, que es lo que la identifica y la relaciona.

`plan.md`, `tasks.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/` y `checklists/`
**son partes de ella, no tipos**. Se emiten en `partes` como la lista de lo que hay, y ahí se ve que
`001` no tiene `tasks.md`: **eso describe hasta dónde llegó, no otra clase de cosa**. Convertir cada
archivo auxiliar en un tipo daría siete tipos nuevos que ninguna pregunta necesita.

#### Lo que encontramos armándolo, y les toca a ustedes

**Una dependencia entre repositorios se estaba cayendo en silencio.** El primer emisor buscaba
`CU-n` en el campo `Depende de`, y `CU-19` **depende de `TAN-1`, de plataforma**. La arista
desaparecía sin que nada fallara — y es justamente la clase de arista para la que el índice federado
existe.

Ahora se emiten los tres prefijos con su repositorio. **Y sólo se exige que resuelvan las locales**:
fallar porque no podemos verificar `TAN-1` desde acá sería pedirle a este repositorio que conozca al
de al lado, que es lo contrario de federar.

**Y una colisión con algo que están escribiendo.** `tandilia/docs/pedidos.md` —hoy sin commitear—
dice que un pedido vive en `pedidos/PED-n.json` y que **`PEDIDOS.md` deja de ser fuente**. Nuestro
emisor lee `PEDIDOS.md`, que hoy es la fuente y se edita a mano.

No migramos sobre un borrador sin commitear. **Pero cuando ese protocolo cierre, este emisor cambia
de fuente**, y conviene que salga como pedido en vez de descubrirse. Mientras tanto agregamos
`necesita-informacion` al vocabulario: un estado sin traducción se emite como `desconocida` y falla,
y eso pasaría el día que alguien lo use.

#### Lo que verificamos, rompiéndolo

Cuatro mutaciones, y la última encontró un agujero nuestro:

| | |
|---|---|
| La prosa cambia y el catálogo no | **falla** |
| Una dependencia local que no existe | **falla**, nombrando cuál |
| Dos entidades con la misma identidad | **falla** |
| **Una fuente cambia de forma y rinde menos** | **pasaba en verde**, y ahora falla |

La cuarta es la que importa. Renombrar un encabezado hacía desaparecer una entidad **sin que nada
avisara**: el catálogo salía con una menos, tan verde como antes. Ahora cada fuente cuenta sus
candidatos aparte de lo que se leyó, y una diferencia falla diciendo el archivo y los dos números.

Es el mismo agujero que ya tenía nuestra lista de pedidos, encontrado de la misma manera. Vale como
advertencia para el esquema: **un emisor que no cuenta sus candidatos no puede afirmar que emitió
todo.**

#### Lo que NO hicimos, porque lo pidieron así

No copiamos el esquema de granito como contrato, no inventamos identificadores, no dedujimos
dependencias de las citas, y **`CLAUDE.md` no manda a consultar ningún índice** — todavía no existe.

---

### PED-13 · Su generador de roles no corre contra nuestro contrato, y el contrato que necesita no está publicado

**Estado**: **aceptado** · **Pide**: las-animas · **Fecha**: 2026-08-25 · **Bloquea**: no

Veníamos a proponerles derivar la capacidad de una acción desde el contrato de OpenAPI. **Ya está
decidido acá y ya está construido**: `CU-37` dice que se deriva y no se escribe a mano, y
`tests/roles.mjs` la genera en `src/api/demo/roles.ts`. Hasta el diagnóstico coincide palabra por
palabra — *«`openapi-typescript` no emite las extensiones `x-`»*. No hay nada que proponer.

Lo que sí hay: **ese generador apunta a `contracts/demo.yaml` y no funciona contra el contrato real
de cuenta corriente**. Lo corrimos. Acá está cada cosa que falla, con el comando que la reproduce.

Nuestro contrato vive en `tandilia/las-animas/backend` — desde acá, `../las-animas/backend`. Tiene
**82 operaciones y 11 capacidades**, y `npm run spec:roles` garantiza que ninguna operación queda
sin declarar la suya: si alguna lo hiciera, el verificador falla.

#### 1 · El estilo de la lista: encuentra cero

`tests/roles.mjs:36` busca la lista **en línea**:

```js
/operationId: (\w+)[\s\S]*?x-required-roles: \[([^\]]*)\]/g
```

Nosotros la escribimos **en bloque**, que es lo que emite Redocly al empaquetar y lo que leen
nuestros propios verificadores:

```yaml
operationId: listCompanies
x-required-roles:
  - companies:read
```

**82 de 82 en bloque, 0 en línea.** La expresión encuentra 0, entra en el `if (found.length === 0)`
y lanza. Eso está bien puesto —*«si el contrato cambia de forma, falla: no emite un mapa a
medias»*— y es exactamente lo que queremos que haga. Pero el resultado es que hoy no hay mapa.

```bash
cd ../las-animas/backend && npm run spec:bundle
grep -c 'x-required-roles: \[' dist/openapi.bundled.yaml   # 0   <- lo que busca roles.mjs
grep -c 'x-required-roles:$'   dist/openapi.bundled.yaml   # 82  <- lo que hay
```

#### 2 · Un archivo contra noventa

`contracts/demo.yaml` es un solo archivo. El nuestro es `openapi/openapi.yaml` más un centenar de
archivos enlazados con `$ref`: leer el archivo raíz con expresiones no ve **ninguna** operación,
porque ahí no hay ninguna.

El archivo que sí sirve es el empaquetado, `dist/openapi.bundled.yaml`, que produce
`npm run spec:bundle`. **Y `dist/` está en nuestro `.gitignore`, línea 8.** O sea que hoy no lo
pueden tomar de ningún lado: no está versionado ni publicado.

Eso es un pedido concreto y de una línea: **si el camino es que lo generen ustedes, díganlo y lo
publicamos.** Dónde publicarlo depende de cómo lo consuman, y por eso no lo decidimos solos.

#### 3 · La clave de idempotencia sí funciona

Su detección por `parameters/IdempotencyKey` **sobrevive al empaquetado**: Redocly conserva el
`$ref` apuntando a `#/components/parameters/IdempotencyKey` en vez de incrustar el parámetro. Da
las seis operaciones correctas:

`createCompanyDebitNote` · `createCompanyCreditNote` · `createCompanyReceipt` ·
`reverseAccountEntry` · `startSettlementRun` · `deleteSettlement`

**Un aviso que no es un pedido.** `yaml.split(/(?=\n\s+operationId: )/)` deja **toda la sección
`components:` dentro del último bloque**, porque después de la última operación ya no hay otro
corte. Hoy no molesta, justamente porque ustedes buscan el `$ref`. Pero si algún día buscaran
`name: Idempotency-Key` en lugar del `$ref`, la definición del parámetro cae en ese bloque y la
clave se le atribuye a la última operación del archivo. Lo comprobamos contra nuestro contrato:
sale `getCondicionIva`, que es una lectura y no pide clave ninguna. Un corte adicional en
`\ncomponents:` lo cierra.

#### Qué les llega, si esto camina

| capacidad | operaciones |
|---|---|
| `reference-data:write` | 27 |
| `reference-data:read` | 20 |
| `current-account:read` | 12 |
| `settlements:read` | 8 |
| `companies:write` | 4 |
| `current-account:write` | 3 |
| `companies:read` | 2 |
| `parameters:read` | 2 |
| `settlements:run` | 2 |
| `parameters:write` | 1 |
| `receipts:write` | 1 |

Son **capacidades, no puestos**. Quién las tiene se compone en Keycloak —realm `siempre`, roles de
client de `ctacte-panel`— y el contrato no conoce ningún puesto. Una acción que exige
`companies:write` no pregunta si el operador es gerente o ayudante, y por eso el día que se cree un
puesto nuevo no se toca ni el contrato ni la aplicación.

#### La decisión, que es de ustedes

Dos caminos. **No tenemos preferencia**; los dos nos sirven y los dos respetan `CU-37`, porque en
los dos la capacidad se deriva del contrato y nadie la escribe a mano.

| | **A · lo generan ustedes** | **B · lo emitimos nosotros** |
|---|---|---|
| en cuarzo | la expresión de `roles.mjs` acepta los dos estilos | nada: consumen un módulo ya emitido |
| acá | publicamos el empaquetado | `npm run spec:capabilities` emite el módulo, versionado al lado de `types/las-animas-api.d.ts` |
| si el contrato cambia | se enteran al regenerar | se enteran al actualizar el paquete |
| quién se rompe si cambia la forma del YAML | cuarzo, y en cada backend que sumen | nadie: la forma la conoce quien la escribe |
| cuántos backends lo reimplementan | uno por backend | ninguno |

Si eligen **B**, emitimos **exactamente la forma que ustedes ya definieron**, sin inventar una
nueva. Con datos reales quedaría así:

```ts
export const contractRequires = {
  listCompanies: { roles: ['companies:read'], idempotent: false },
  createCompanyReceipt: { roles: ['receipts:write'], idempotent: true },
  startSettlementRun: { roles: ['settlements:run'], idempotent: true },
} as const

export type OperationId = keyof typeof contractRequires
```

Encaja sin tocar nada de lo suyo: `defineAction` junta los `roles` de las operaciones que la acción
declara y sigue viendo `readonly string[]`.

#### Lo que NO les estamos pidiendo

- **No** que cambien `CU-37`. Estamos de acuerdo con él, y el que ya lo tenía escrito era cuarzo.
- **No** que el contrato cambie de estilo. El bloque es lo que emite Redocly y lo que leen nuestros
  verificadores; cambiarlo para acomodar una expresión regular sería la cola moviendo al perro.
- **No** que cuarzo conozca nuestras capacidades. Son de cuenta corriente, y fidelización va a tener
  las suyas. En el camino B el tipo `OperationId` sale de **nuestro** contrato y vive en **nuestro**
  paquete; cuarzo sigue hablando de `readonly string[]`, como hoy.
- **No** que decidan hoy si esto además resuelve la capacidad de una **pantalla**. Eso depende de la
  pila de flujo de `PED-11` y del destino que discutieron en `granito#PED-13`, y lo miramos cuando
  toque.

#### Qué hicimos mientras

**Nada, a propósito.** No escribimos el generador ni publicamos el empaquetado: la forma del módulo
depende de cuál de los dos caminos elijan, y escribirlo antes sería adivinar. Lo escribimos apenas
respondan.

#### Cómo responder

Alcanza con **A** o **B** en este mismo pedido, y mover el estado — el estado lo mueve cuarzo. Si es
**A**, no hace falta nada más de nuestro lado hasta que nos digan dónde quieren el empaquetado. Si
es **B**, lo emitimos y les avisamos por este mismo canal.

#### Una nota sobre la numeración

Al tomar el número 13 nos encontramos con que `PED-11` cita **`PED-13` pelado** —en su sección
«Por qué esto NO contradice»— para referirse al de granito. Con este pedido ese número existe
también acá, así que esa cita pasaba a apuntar al lugar equivocado, que es justo lo que `TAN-5`
advierte que pasa con los números pelados.

La dejamos como **`granito#PED-13`**. Es el único cambio que hicimos fuera de este bloque.

Hay otra igual más abajo —`PED-15`, que también es de granito— y **no la tocamos**: este pedido no
la rompe, y el archivo es de ustedes.

#### Respuesta de cuarzo · 2026-08-25

**B.** Ustedes emiten el módulo. **La forma la publicamos nosotros.**

Gracias por el reporte: cada afirmación con su comando fue lo que hizo que la discusión arrancara
donde tenía que arrancar. Verificamos las tres en el código y las tres son ciertas.

#### Por qué B, y no que ensanchemos la expresión

Porque **quien conoce la forma de un contrato es quien lo escribe**. En A, cuarzo tendría que
aprender cómo empaqueta su YAML cada backend —en línea o en bloque, qué referencias conserva
Redocly, cuáles no— y eso se paga otra vez con cada backend que se sume. Lo que reportaron **es esa
falla**, y sería la primera de una serie.

Peor: `tests/roles.mjs` **viaja al clon**. En A, cada aplicación hereda esa expresión regular y la
adapta al estilo de su backend. Una expresión copiada que hay que retocar es exactamente la clase de
cosa que se despega en silencio.

En B, cuarzo sigue hablando de `readonly string[]` y no conoce ni una capacidad de ustedes.

#### La forma la publicamos nosotros, y por qué importa

Si cada backend la copiara de este pedido, en el tercero hay tres formas parecidas y **ninguna es la
fuente**. Así que publicamos desde `@cuarzo/core`:

- **el tipo** que el módulo tiene que cumplir, y
- **una comprobación de conformidad** que pueden correr contra su empaquetado antes de publicar.

Les avisamos por este mismo canal cuando estén. Hasta entonces no hay nada que emitir: la forma
sería adivinada, que es la misma razón por la que ustedes no escribieron el generador.

#### El módulo lleva tres cosas, no una

Su propuesta trae `contractRequires`, que está bien y no le cambiamos nada. Le faltan dos:

| | para qué |
|---|---|
| `contractRequires` | Lo que ya propusieron. Sin cambios |
| **el vocabulario del sistema** | La lista de capacidades que el contrato declara. **Es lo que hace que una capacidad inventada no compile** — hoy un dedazo en el nombre esconde una pantalla del menú para siempre y en silencio |
| **la identidad del contrato** | Una versión o un hash. El frontend lleva **una foto del contrato al compilar**; sin identidad, cuando ustedes cambian qué exige una operación, la aplicación queda con lo viejo y **nada avisa** |

La identidad es la que menos parece necesaria y la que más rinde: es lo único que después permite
que el mapa se lea al arrancar en vez de compilarse, sin cambiar nada de lo que se escribió.

#### Lo que NO tienen que hacer

**No califiquen las capacidades con el nombre del sistema.** Emitan `companies:read` pelado. Cuarzo
las califica al componer, porque una aplicación puede consumir varios backends y `companies:read` de
ustedes no es el de fidelización. **Un backend no conoce su propio nombre en la plataforma**, y no
tiene por qué.

#### Dónde se publica

**Que viaje con los tipos generados**, que es la misma conversación que quedó a medias en su
`PED-6`. Van juntos o se despegan: un módulo que dice `createCompanyReceipt` y unos tipos que ya no
lo tienen es una combinación que no falla en ningún lado.

Si al retomar `PED-6` cambia el mecanismo, esto lo sigue.

#### Sobre el aviso del corte

Tienen razón, y es peor de lo que dicen. El mismo `[\s\S]*?` **cruza operaciones**: si una no
declarara roles, el emparejamiento le asigna los de la siguiente. Hoy lo tapa la comprobación de
conteo que está justo abajo, no el diseño. Lo arreglamos de este lado — el generador se queda para
nuestro contrato de ejemplo.

#### Lo que hicimos de este lado

Escribimos **`TAN-7`** en el repositorio de plataforma: cómo se declaran y se consumen las
capacidades en Tandilia. Su pedido es el que la originó, y ahí quedó escrito, entre otras cosas:

- **El vocabulario lo define el contrato**; Keycloak dice quién lo tiene.
- **Al frontend llegan capacidades, nunca puestos** — y se verifica solo, porque un puesto nunca
  está en un contrato.
- **Una pantalla declara la operación que la justifica**, no una capacidad escrita a mano.
- **El backend autoriza; el frontend orienta**, y como orienta, **ante la duda muestra**: ocultar de
  más es invisible, mostrar de más es un rechazo que alguien reporta.

Léanla: los obliga a ustedes también.

Y **arreglamos la otra cita pelada**, la de `PED-15`, que vieron y no tocaron por ser archivo
nuestro. Hicieron bien en no tocarla y bien en decirlo: así se arregló en una línea en vez de
descubrirse dentro de seis meses, apuntando a un pedido de granito que ya no es el que era.

#### Una cosa más, que va por separado

De `TAN-7` sale un pedido nuestro hacia ustedes que **no es parte de éste**: que un rechazo distinga
**«no tenés la capacidad»** de **«la tenés, pero no sobre este dato»**. Va en su archivo como
`las-animas#PED-7`, con su razón.

Adelanto por qué conviene mirarlo pronto aunque hoy no segmenten por dato: cuesta **un valor más en
un enum que ya existe**. Después de cinco backends, cuesta cinco contratos y todo lo que ramifica
sobre ellos.

---

### PED-12 · En la grilla del catálogo, el clic en una fila no hace nada

**Estado**: **hecho** · **Pide**: granito · **Fecha**: 2026-08-23 · **Bloquea**: no

En `catalog-screen.tsx` la grilla tiene `onRowActivate` —doble clic para abrir— y nada más. Hacer
**clic** en una fila no produce ningún efecto: ni la ilumina, ni la marca, ni deja rastro de dónde
está parado el operador.

No es un descuido de ustedes: **granito no lo ofrecía.** Ya lo ofrece.

#### Qué cambió acá

`Table` distingue **dos cosas que no son la misma**, y confundirlas es lo que dejó el clic muerto:

| | cuántas | quién la informa | para qué |
|---|---|---|#### Respuesta de cuarzo · 2026-08-25 · **conectado, y anda**

`PED-16` desbloqueó esto. `currentRow` y `onCurrentRowChange` están conectados en la grilla del
catálogo, y el recorrido completo funciona:

| paso | resultado |
|---|---|
| Clic en una fila | `?articles.row=2`, y la fila se marca |
| Clic en el **ojo** de la tercera | `/catalog/3`, con la pila en **dos escalones** |
| Cerrar la ficha | `/catalog?articles.row=3`, **con Paracetamol marcada** |

Salís desde una fila y volvés a ella. Es lo que este pedido buscaba.

**La captura era la salida correcta**, y celebramos que no hayan tomado ninguna de las tres que
ofrecimos. Pasarnos el evento nos habría dejado la regla a nosotros —y la habríamos escrito distinto
en cada aplicación—; la lista de controles a ignorar es una heurística que el control propio de
alguien no cumple. El orden de captura es del DOM y no hay que acordárselo.

#### Un tropiezo nuestro que quizás les sirva

Al conectarlo escribimos `currentRow={fila ?? undefined}` y **la función quedó apagada sin que nada
lo dijera**: `withCurrentRow` mira `currentRow !== undefined`, así que `undefined` significa «esta
grilla no tiene fila actual» y `null` significa «ninguna marcada todavía». La distinción es correcta
y está bien elegida; lo que nos pasó es que **aplanamos los dos**, y el síntoma fue que hacer clic en
una fila no hacía nada — sin error, sin aviso, sin nada que buscar.

No es un pedido: el tipo dice `string | null` y estaba bien. Lo contamos porque a ustedes les sirve
saber dónde tropieza un consumidor, y porque es la clase de cosa que **el tipo podría volver
imposible**: `onCurrentRowChange` sin `currentRow` no debería compilar, y hoy compila.

#### Y algo que no es de este pedido pero pasó recién

Su commit de las citas `GR-n` **nos rompió 111**. Nuestro lector esperaba el número pelado —`### 42
·`— y ustedes pasaron a escribir `### GR-42 ·`.

**No hay nada que arreglar de su lado**, y ya lo acomodamos: leemos las dos formas. Lo decimos
porque el cambio de ustedes era una mejora —empezaron a verificar sus propias citas, que es lo que
`PED-2` pedía— y aun así rompió a un consumidor en silencio. Es la misma clase de acoplamiento que
esta familia viene sacando: **leer el formato del documento de otro repositorio es depender de algo
que no controlamos.**

Cuando `PED-2` cierre del todo y publiquen sus decisiones de forma consumible, esto deja de existir.
Mientras tanto la deuda es nuestra y está anotada.

---|
| `selection` | varias | la marca | operar sobre todas |
| **`currentRow`** ← nuevo | una | el tinte y la barra | dónde estoy |

Es **opcional y controlado**, las dos props o ninguna:

```tsx
/* Vive en la PANTALLA: cuando cambia la página o se recarga el listado, quién
   sigue siendo la actual es una pregunta de acá, no de la grilla. */
const [current, setCurrent] = useState<string | null>(null)

<Table
  …
  currentRow={current}
  onCurrentRowChange={setCurrent}
  onRowActivate={(a) => goTo(articleScreen, { id: String(a.id) })}
/>
```

No chocan: el doble clic dispara el clic primero, así que se abre la fila que quedó marcada.

Y **las flechas del teclado mueven la misma fila**. Antes movían una parada interna que el mouse no
mostraba: eran dos «dónde estoy» que se contradecían apenas se mezclaban los dos.

#### Lo que NO estamos pidiendo

- **No** que la prendan si no les sirve. Una grilla que sólo se lee no tiene fila actual, y pintarle
  una es decir que ahí hay algo que hacer. Si el catálogo es de los que sí —tiene acciones por fila y
  se abre un registro—, corresponde.
- **No** que reemplacen `selection` por esto. Son dos cosas y conviven.
- **No** un cambio de estilos. El tinte, la barra y el peso los pone granito.

#### Una cosa que sí conviene mirar de su lado

Granito **apaga el gris** de las celdas de la fila actual, porque el tinte está medido contra el
texto pleno —12,87 y 7,42— y contra el tenue no llega —4,09 y 3,28—.

**Eso no alcanza si una celda se pinta su propio color adentro**: gana por especificidad y granito no
la alcanza. Si tienen clases así en columnas del catálogo, devuélvanle el color:

```css
.granito-table-row--current .mi-dato-gris { color: inherit }
```

#### Y de paso, dos defectos que ya tenían sin saberlo

Los dos son de granito y **ya están arreglados** — los mencionamos porque si alguna vez los vieron y
pensaron que era cosa suya, no lo era:

- **Pasar el mouse por una fila tildada la devolvía al tono de la cebra.** Un problema de
  especificidad, y estaba así desde que existe la selección.
- **Sobre la cebra, una columna congelada se quedaba con el tono viejo** mientras el resto de la fila
  estaba iluminada — y **se veía bien mientras uno tenía el mouse encima**, así que era casi
  imposible de agarrar revisando.

Viene en la próxima publicación de `@granito/ui`. Con el enlace `file:` ya lo tienen.

#### Y la cebra pasó a ser opcional, apagada por omisión

Mientras se arreglaba lo de arriba apareció otra: **la fila con el mouse encima era idéntica a una
fila par de la cebra**, así que no se distinguía cuál tenía el mouse. Se midió la rampa entera y no
hay un gris que a la vez se separe de la cebra y deje legible el texto tenue.

Como la cebra es **el único fondo que no dice nada de esa fila** —dice que es par—, es la que pasó a
ser opcional:

```tsx
<Table … zebra />     {/* apagada si no se pone */}
```

**Esto les cambia cómo se ve la grilla del catálogo sin que hagan nada**, y es a propósito: apagada
es el estado donde ninguna señal se repite. Si la quieren, es una prop — y con cuatro columnas
probablemente no haga falta: la cebra sirve para seguir un renglón hasta la última columna de una
grilla ancha.

#### Actualización del 2026-08-25 · ya lo pueden conectar

Su `granito#PED-16` tenía razón y **el defecto era nuestro**. La cita que nos hicieron es exacta: acá
arriba dice *«no chocan: el doble clic dispara el clic primero»*, y eso vale para el doble clic **y
al revés para un botón adentro de la fila**.

**El clic de fila pasa a `onClickCapture`**, que corre ANTES que el `onClick` del botón. La marca
queda en la entrada que se está dejando y recién después el botón navega, así que la ficha deja de
creer que es la grilla.

**Antes de conectarlo, una consecuencia**: tildar la casilla de selección **también** mueve la fila
actual. Es deliberado —quien tilda una fila está parado en ella— pero cambia lo que ven si tenían
pensado que fueran independientes.

Y **no lo mira ninguna prueba nuestra**: un `click()` sintético no reproduce las fases como un clic
real. Lo miramos a mano, y su traza es mejor evidencia que la nuestra — si les da la pila larga en la
ficha, quedó.

Decisiones: `GR-74` y `GR-75`.


#### Respuesta de cuarzo · 2026-08-24 · **a medias, y con un pedido de vuelta**

El soporte está construido y probado —`currentRow` en `useTableQuery`, viviendo en la dirección para
que sobreviva a abrir una ficha y volver, y sin pisarse entre dos grillas de una misma pantalla—.

**La grilla del catálogo no lo conecta todavía**, y no por olvido: el clic en una acción de fila
marca la fila **después** de que el flujo navegó, y esa escritura le pisa la pila a la entrada nueva.
Está medido y abierto como `granito#PED-16`, con las tres salidas que nos alcanzarían.

En el código está escrito por qué está desconectado, para que no se lea como un descuido.

> Y la parte de los estilos **no aplica acá**: la comprobación de límites prohíbe `className` propio,
> así que no tenemos —ni podemos tener— celdas que se pinten su color.
### PED-1 · El diálogo de alta perdió el `Enter`, y ya no hace falta que lo pierda

**Estado**: **hecho** · **Pide**: granito · **Fecha**: 2026-08-23 · **Bloquea**: no

> **Tomado el 2026-08-23.** Tenían razón y el defecto era nuestro: **ese diálogo se operaba con
> mouse y no con teclado**, y no lo habría encontrado nadie hasta que alguien lo intentara.
>
> `GR-65` ya estaba en el `dist` de granito —cuarzo lo consume por enlace, así que no hizo falta
> esperar la publicación—, así que el cambio entró completo: se van las `actions`, el botón de
> cancelar y el de guardar, y el diálogo pone los tres.
>
> **Y se llevó un texto puesto**: `catalogStrings.cancel` quedó muerto, porque el rótulo de cancelar
> es del diálogo y no de la pantalla. Es la misma línea que `CU-43` traza — lo que el marco dibuja
> lo escribe el marco.
>
> Lo que anotaron como «qué NO estamos pidiendo» también lo miramos: la llamada a `createArticle`
> se queda donde está.

En `src/features/catalog/screens/new-article-dialog.tsx` el diálogo arma sus `actions` a mano:

```tsx
actions={
  <>
    <Button onClick={onClose}>{catalogStrings.cancel}</Button>
    <Button tone="primary" onClick={save} disabled={…} disabledReason={invariant}>
      {catalogStrings.save}
    </Button>
  </>
}
```

**Y no era evitable: era un agujero nuestro.** El botón de confirmar de `Dialog` no aceptaba
`disabled`, así que para apagar «Guardar» con su motivo no quedaba otra que reemplazar las acciones
enteras.

El costo es concreto y no se ve hasta que alguien opera con el teclado. `Dialog` sólo confirma con
`Enter` cuando recibe `onConfirm`:

```tsx
if (e.key === 'Enter' && conEnter && confirmar && !apagado) { … }
```

Con `actions` propias no hay `onConfirm`, así que **ese diálogo se quedó sin `Enter`**. `Escape`
sigue andando. Rompe la convención de que las dos teclas signifiquen lo mismo en todos los diálogos,
que la decisión `GR-42` pone del lado del diálogo y no de la pantalla.

#### Lo que cambió de este lado

`Dialog` tiene ahora `confirmDisabled` y `confirmDisabledReason` (`GR-65`). Con eso:

```tsx
<Dialog
  open
  title={catalogStrings.newArticle}
  onClose={onClose}
  confirmLabel={catalogStrings.save}
  onConfirm={save}
  confirmDisabled={action.running}
  confirmDisabledReason={invariant}
>
```

Y se van las `actions`, el `Button` de cancelar y el de guardar — el orden de los botones, el rótulo
de cancelar y el `Enter` los pone el diálogo. **El `Enter` respeta el botón apagado**: con un motivo
puesto no confirma, para que el teclado no haga lo que el mouse tiene prohibido.

#### Qué NO estamos pidiendo

**Que el diálogo deje de llamar a `createArticle`.** Lo miramos contra `GR-42` y no la contradice:
esa decisión es sobre el componente de granito, que acá no muestra estado de operación, no muestra
el error del guardado y no cierra al fallar. Dónde vive la llamada es arquitectura de ustedes.

#### Qué hicimos mientras

Nada de su lado: el cambio es de una sola pantalla y es de ustedes. **Necesita `@granito/ui` con
`GR-65` adentro**, que todavía no está publicado.

---

### PED-2 · Dos importes que nunca van a compartir renglón, y un precio sin `MoneyInput`

**Estado**: **hecho** · **Pide**: granito · **Fecha**: 2026-08-23 · **Bloquea**: no

> **Tomado el 2026-08-23.** Las dos, y la segunda era una contradicción escrita: la columna tenía
> un comentario diciendo *«así el mismo importe se ve igual acá, en un formulario y en un reporte»*
> **arriba de un formulario que lo mostraba crudo**.
>
> `size="money"` en los dos, y `MoneyInput` en lugar de `TextInput`. El contrato no se enteró:
> entrega la misma cadena que ya viajaba.

Dos cosas del mismo diálogo, las dos de medida.

#### Los dos precios se apilan, y no es lo que parece pedido

`price` y `discountedPrice` van con `size="medium"`. El cuerpo de un diálogo tiene **seis tramos**, y
con `columns` en 1 el tope es seis; `medium` pide **cinco**. Dos de cinco son diez: cada uno se lleva
su propio renglón y deja un tramo vacío.

Para un importe el tamaño es `money`, que son **tres**. Dos de tres entran justos en un renglón — es
lo que hace el espécimen 27 en «Fecha e importe».

#### Y el precio se teclea en un `TextInput`

En la misma funcionalidad, la columna de la grilla usa `format: 'money'`, con un comentario que
explica por qué: *«así el mismo importe se ve igual acá, en un formulario y en un reporte»*.

El diálogo que lo carga usa `TextInput`, así que **el mismo dato se ve formateado en la tabla y crudo
en el campo**. `MoneyInput` existe para eso: alinea a la derecha, usa las cifras tabulares y entrega
el valor canónico. Es `GR-32` — un formato se define una sola vez.

#### Qué NO estamos pidiendo

**Que cambien el contrato.** `MoneyInput` entrega y recibe la misma cadena que ya mandan.

#### Qué hicimos mientras

Nada: es de su pantalla. Los dos cambios andan con lo que ya está publicado.

### PED-3 · La grilla del catálogo reparte sus cuatro columnas en partes iguales

**Estado**: **hecho** · **Pide**: granito · **Fecha**: 2026-08-23 · **Bloquea**: no

> **Tomado el 2026-08-23**, con los anchos que midieron: `320 / 140 / 120`.
>
> **Y el de la columna de acciones lo pone `useActionColumn`**, que es donde ustedes sugirieron
> mirarlo. La razón es la que dieron: esa función **sabe qué va adentro** —botones— así que
> ninguna pantalla tiene por qué acordarse. Una que necesite otro ancho tiene el problema al
> revés, y ése sí es suyo.

Medido en `/catalog` con la ventana en 1.920:

```
NOMBRE 412px │ PRECIO 412px │ ESTADO 412px │ (acciones) 412px
```

«Estado» —una palabra— se lleva lo mismo que «Nombre», y el botón *Desactivar*, que ocupa 80px,
tiene una columna de 412.

#### Por qué

`Table` usa `table-layout: fixed`, y **ninguna columna declara `width`**. Una columna sin ancho
recibe un cupo por omisión de 120, así que cuatro sin declarar dan un reparto **1:1:1:1**.

El ancho no es el ancho final: es **el reparto y el piso**. La tabla ocupa lo que le den y el
sobrante se distribuye en proporción a lo que cada una pidió.

Lo probamos sobre su pantalla: con `320 / 140 / 120 / 124` la grilla se acomoda sola —Nombre absorbe
el sobrante, Precio pegado a la derecha, el botón ajustado— sin tocar nada más.

#### Y la columna de acciones la arma el marco

`useActionColumn` construye esa columna y tampoco le pone ancho. Como **sabe** que adentro van
botones, puede declararlo una vez y resolverlo para todas las pantallas, en vez de que cada una se
acuerde. Es de ustedes decidir si va ahí o en cada pantalla.

#### Qué hicimos de este lado

**La culpa del silencio es nuestra**: la regla estaba en un comentario del código y en el demo, y el
README **no tenía un solo ejemplo de `Table` con columnas**. Ahora sí, con el `width` y el porqué —
sección «Las columnas de una grilla».

---

### PED-4 · Las filas con botón miden 47px, y ahora pueden medir 41

**Estado**: **hecho** · **Pide**: granito · **Fecha**: 2026-08-23 · **Bloquea**: no

> **Tomado el 2026-08-23.** `size="compact"` en el botón de la fila.
>
> Lo que se anotó en el código no es el número sino la regla: **en una fila, el alto del control
> es el alto de la fila**. El «12 donde entran 14» envejece con los tokens; la regla no.

Medido en las dos grillas, con los mismos tokens:

| qué hay en la fila | alto | filas visibles en 768 |
|---|---|---|
| sólo texto | 33px | ~17 |
| `IconButton` compacto | 41px | ~14 |
| `Button` — el catálogo hoy | **47px** | ~12 |

El relleno de la celda es 6+6 en las dos, así que **el alto de la fila es el alto del control**.

#### Lo que cambió de este lado

`Button` recibe ahora `size`, el mismo eje que ya tenía `IconButton` (`GR-66`):

```tsx
<Button size="compact" onClick={desactivar}>Desactivar</Button>
```

Mide 28 y deja la fila en 41 — lo verificamos **sobre su pantalla**, aplicándolo a los botones del
catálogo. Es el mismo alto que un `IconButton` compacto y sale del mismo token, así que una columna
que mezcle los dos queda pareja.

**No es un nivel de densidad.** Sigue habiendo uno solo: es que un control toma el alto de aquello
con lo que está en fila.

#### Por qué un botón y no un icono

Los dos dan 41: **no compiten en alto**. Se eligió conservar la palabra porque «desactivar» no tiene
dibujo convencional, y porque el globo que lo explicaría se apaga con la preferencia del operador.

Cuando la acción **sí** tenga dibujo propio —ver, imprimir, anular— y se repita en todas las filas,
un `IconButton` dice lo mismo sin repetir el verbo veinte veces. Está escrito en el README.

#### Qué NO estamos pidiendo

**Que cambien el relleno de las celdas.** No es de ahí: es del control.

#### Qué hicimos mientras

Nada de su lado. **Necesita `@granito/ui` con `GR-66` adentro**, que todavía no está publicado.

### PED-5 · La columna «Estado» puede ser una pastilla, y un importe negativo se colorea solo

**Estado**: **hecho** · **Pide**: granito · **Fecha**: 2026-08-23 · **Bloquea**: no

> **Tomado el 2026-08-23.** `Badge` en la columna de estado, con `success` y `neutral`. `GR-67` ya
> estaba en el `dist`, así que no hizo falta esperar la publicación.
>
> Lo del importe negativo queda anotado y **no hay nada que hacer**: la celda ya devuelve el valor
> crudo con `format`, así que el día que aparezca una nota de crédito se colorea sola.
>
> Y lo que marcaron como abierto de su lado —pintar la fila entera— no lo necesitamos hoy. Si
> aparece un caso, se lo mandamos con el caso.

Salió de una pregunta suya: en el demo de granito algunas columnas tienen color y en el catálogo no.
**La respuesta era que eso no era granito** — el demo lo pintaba con dos clases propias, escritas en
su `index.html`. Ahora sí lo es, y son dos cosas.

#### Un estado cerrado va como pastilla

`Badge` (`GR-67`), para los dos a cinco valores de una columna de estado:

```tsx
{
  id: 'active',
  header: catalogStrings.status,
  width: '130px',
  cell: (article) => (
    <Badge tone={article.active ? 'success' : 'neutral'}>
      {article.active ? catalogStrings.active : catalogStrings.inactive}
    </Badge>
  ),
}
```

Los tonos son los de `Severity` —`info`, `success`, `warning`, `error`— más `neutral`. **Cuál le toca
a cada valor lo deciden ustedes**: granito recibe el tono y la palabra.

**No es para una lista que crece.** Categorías o etiquetas no entran: habría que inventar un color
por dato.

#### Un importe negativo ya no necesita que nadie lo pinte

Con `format: 'money'`, un valor negativo lleva el color de lo que resta. Sale del signo, que ya está
en el dato, así que **no hay nada que declarar** — y el color no informa solo, porque el menos está
escrito.

Hoy el catálogo no tiene importes negativos, pero lo van a tener en cuanto aparezca una nota de
crédito. La regla es: **la celda devuelve el valor crudo con su signo**, sin formatear y sin pintar.

#### Qué NO estamos pidiendo

**Que pinten la fila entera según una condición.** Nos lo preguntaron y **quedó abierto de nuestro
lado**: granito midió que `accent-wash` y `surface-sunken` tienen la misma luminosidad —1,010 y
1,000—, así que un tinte de fila no se distingue de la cebra. Es por lo que la fila seleccionada la
informa su casilla y no el color. Si tienen casos concretos, mándenlos y lo decidimos con ellos.

#### Qué hicimos mientras

Nada de su lado. **Necesita `@granito/ui` con `GR-67` adentro**, que todavía no está publicado.

### PED-6 · El doble clic ya no es problema suyo, y la clave sigue siéndolo

**Estado**: **hecho** · **Pide**: granito · **Fecha**: 2026-08-23 · **Bloquea**: no

> **Tomado el 2026-08-23**, la parte que era nuestra: `run` devuelve una promesa y los dos
> lugares que lo llaman la devuelven. Con eso el botón queda apagado hasta que el servidor
> conteste y no sólo la ventana del gesto.
>
> **Nunca rechaza**, y es deliberado: el error ya lo trató la puerta —el aviso, los campos, el
> rastro— y propagarlo dejaría un rechazo sin atrapar en cada `onClick`.
>
> **Sobre lo segundo que señalaron, no nos aplica**: `idempotent` no se declara, **se deriva del
> contrato**. Es obligatorio en `Operation` y sale de `roles.ts`, que se genera. No hay dónde
> olvidarlo, que era exactamente el riesgo que marcaban.
>
> Lo primero —que `run` no tenga guarda de reentrada— queda anotado. Con lo suyo puesto no
> muerde, y una acción disparada desde otro lado sigue sin freno.

Salió de una consulta sobre cómo evitar las acciones dobles. La primera respuesta que dimos fue
repartirla —granito frena la tecla, ustedes ponen una guarda en `useAction`— y **estaba mal**: es
justo lo que este repositorio viene corrigiendo hace siete pedidos, una regla que vive afuera del
componente y que cualquiera puede olvidar.

Así que lo puso granito (`GR-68`), y **no hay que hacer nada de su lado para tenerlo**.

#### Lo que el control ya garantiza

| | |
|---|---|
| tecla repetida | un `Enter` sostenido no activa: ni un botón, ni el confirmar de un diálogo, ni una fila, ni una opción de un combo |
| ventana del gesto | dos activaciones más cerca que el umbral del doble clic del sistema operativo son una sola |
| promesa | si el `onClick` **devuelve** una promesa, el botón queda apagado hasta que resuelva |

Medido: no repetible, tres clics a 0/150/300ms → **una** acción. Ocho `Enter` repetidos con el dato
válido en un diálogo abierto → **cero** confirmaciones; antes eran ocho.

#### Lo único que les conviene cambiar

**Devolver la promesa** donde hoy no se devuelve. Con eso el botón queda apagado toda la operación y
no sólo medio segundo:

```tsx
// hoy
<Button onClick={save}>…</Button>          // save() llama a action.run y devuelve void

// así el botón se apaga hasta que el servidor conteste
<Button onClick={() => runAndWait()}>…</Button>
```

Hoy `useAction` devuelve `run: (input) => mutation.mutate(input)`, que no devuelve nada. Si expusiera
también la forma que espera —`mutateAsync`— las pantallas podrían devolverla. **Es de ustedes decidir
si vale**; sin eso quedan protegidos igual por la ventana del gesto.

#### Lo que sigue siendo suyo, y no puede no serlo

**La clave de idempotencia.** Ningún control puede ver una respuesta que se perdió y se reintenta,
dos pestañas abiertas, ni un proxy que reintenta solo. Ustedes ya la tienen —`attemptKey`, `CU-34`—
y ahora es exactamente la capa que corresponde.

Dos cosas que miramos de paso y **no** estamos pidiendo, sólo señalando:

- **`useAction.run` no tiene guarda de reentrada.** Con lo de granito puesto ya casi no importa, pero
  una acción disparada desde otro lado que no sea un botón sigue sin freno.
- **Si una acción se declara sin `idempotent`**, `keyFor` devuelve `undefined` y esa capa desaparece
  sin avisar. Vale mirar cómo están declaradas.

#### Qué hicimos mientras

Nada de su lado. **Necesita `@granito/ui` con `GR-68` adentro**, que todavía no está publicado.

### PED-7 · Sobre los tres campos del alta: no están incumpliendo, y acá está el criterio

**Estado**: **hecho** · **Pide**: granito · **Fecha**: 2026-08-23 · **Bloquea**: no

> **Leído y anotado el 2026-08-23.** No había nada que hacer de este lado, y el criterio escrito
> vale más que el veredicto: **no cuenta campos**, y el contraejemplo de un solo campo que igual
> es pantalla es el que liquida la duda antes de que vuelva.
>
> El veredicto lo da `PED-8`, así que se contesta allá.

Nos preguntaron si `new-article-dialog.tsx`, con tres campos, se está saliendo del lineamiento.
**No.** Y conviene que quede escrito de este lado, porque la duda va a volver.

#### El criterio no cuenta campos

La decisión `GR-37`:

> «Si es una operación con consecuencias propias, que puede fallar con un error de negocio que hay
> que explicar y con el que el operador tiene que decidir, es una pantalla. Si sólo pide un sí/no o
> un dato para completar lo que ya estabas haciendo, es un diálogo.»

Y trae el contraejemplo que liquida el conteo: **un solo campo, y aun así es pantalla** —cambiar
modalidad, porque toca saldos—.

Lo de «dos campos chicos en un diálogo» es `GR-44`, y es **aritmética de ancho**: en seis tramos
conviven dos campos de tres tramos. No es un tope de cantidad.

**El veredicto es de ustedes.** `GR-37` lo dice con todas las letras: granito da el criterio y no el
veredicto, porque si dar de alta un artículo tiene consecuencias propias lo sabe su dominio. Su `409`
por nombre repetido se corrige cambiando el nombre — es un error de campo, no una decisión.

#### Lo que sí cambió de nuestro lado

Había dos reglas escritas que **no verificaba nada**, y una ya no se puede incumplir:

**Un diálogo que abre otro diálogo lanza** (`GR-69`). Está decidido desde `GR-37` —«si un diálogo
necesita otro, era una pantalla»— y ahora el componente lo hace cumplir. Es el primer `throw` del
paquete, y la línea es: granito no lanza por un dato, lanza por una composición que no puede existir.

**Lo que no alcanza**: mira el árbol de React. Un diálogo cuyo disparador vive adentro de otro pero
que se dibuja al nivel de la pantalla no lo detecta — y ésa es una forma legítima de resolverlo.

**La otra sigue sin red**: `GR-42` dice que un diálogo no guarda —no tiene estado de operación, no
muestra el error del guardado—. Eso no se puede verificar desde el componente. Su `NewArticleDialog`
la cumple hoy: no dice «Guardando…», no muestra el error de la operación, y no cierra al fallar.

#### Lo que les sugeriríamos mirar, sin pedirlo

Si el alta crece —más campos, un paso previo, una confirmación adentro—, el síntoma a vigilar no es
el número: es **si el diálogo empieza a necesitar explicar algo que el operador tiene que decidir**.
Ahí ya era una pantalla, y las dos salidas están construidas de nuestro lado desde el principio.

#### Qué hicimos mientras

Nada de su lado. El `throw` necesita `@granito/ui` con `GR-69` adentro, que todavía no está
publicado — pero **hoy no lo estarían tocando**, porque no anidan diálogos.

### PED-8 · El alta del catálogo va donde va la edición, y ese lugar no es un diálogo

**Estado**: **aceptado** · **Pide**: granito · **Fecha**: 2026-08-23 · **Bloquea**: no

> **Aceptado el 2026-08-23, y agendado — no hecho.**
>
> **El argumento no se puede desarmar**: editar exige cargar el registro antes de mostrar el
> formulario, y un diálogo no espera un dato del servidor. Si el alta es un diálogo y la edición no
> puede serlo, quedan **dos maquetas para el mismo formulario** — los mismos campos, las mismas
> validaciones, dos layouts que se desincronizan en la primera corrección.
>
> Y pesa más de lo normal porque **`src/` es el molde de cuatro aplicaciones**: el contenedor que
> muestre el esqueleto es el que van a copiar.
>
> **Por qué no ahora.** Quedan el tramo 7 —la prueba del clon, que es lo único que prueba la
> promesa de `CU-20`— y una deuda que ese tramo va a pisar. Ustedes mismos dicen que no hay apuro
> y que el diálogo no está roto, así que se hace con tiempo y no entre dos cosas.
>
> **La forma elegida, para que no quede abierta**: una **región de la misma página**, como
> sugirieron. La grilla se queda a la vista, que para cuatro campos es mejor que perderla.
>
> Queda en `docs/deuda.md` con lo que se revierte de `PED-1` y lo que sobrevive, que ustedes ya
> dejaron listado — se copió tal cual para no volver a derivarlo.
>
> Y sobre el orden: **no hace falta que se disculpen**. `PED-1` y `PED-2` arreglaron defectos
> reales —el `Enter` perdido y el importe crudo— y de `PED-2` no se revierte nada. Lo que se
> revierte de `PED-1` es la mitad, y esa mitad enseñó dónde estaba el límite.

**Empezamos reconociendo algo.** `PED-1` y `PED-2` los mandamos sin haber hecho antes la pregunta de
forma, ustedes los resolvieron el mismo día, y ahora venimos a decir que el contenedor podría estar
mal. **El trabajo no se pierde** —abajo está qué sobrevive— pero el orden fue nuestro error.

Y hay un dato que conviene mirar sin reproche: el diálogo tenía tres campos cuando empezamos esta
conversación y **hoy tiene cuatro**. No es un incumplimiento —`GR-37` no cuenta campos— pero es la
señal que dispara la pregunta.

#### Lo que decide no es el tamaño, es el `ETag`

`30-catalogos-abm`, regla 2 — y vale igual para artículos:

> «Editar y borrar exigen `If-Match`. Y el `ETag` sale del `GET` **individual**, no del listado.
> Igual que en la ficha de empresa: **nada de edición en línea en la grilla. Se abre el registro, se
> lee su versión, se guarda.**»

Editar **exige cargar el registro antes de mostrar el formulario**. Y `GR-42` dice, con `Dialog`
hardcodeándolo en su contexto:

> «Un diálogo no espera un dato del servidor para armarse: lo que pide se teclea.»

**Editar no puede ser un diálogo.** Y si el alta lo es y la edición no puede serlo, quedan **dos
maquetas para el mismo formulario**: los mismos campos, las mismas validaciones, dos layouts que se
desincronizan.

#### Lo que pedimos

Que **el alta y la edición compartan lugar y componente**, y que ese lugar sea una pantalla o una
región de la misma página. Es lo que hace el panel: `11-empresas-ficha` dice *«entra desde la grilla,
**o desde el botón de nueva empresa**»*.

Con eso además **aparece el formato de formulario**: doce tramos en vez de seis, `Section` con su
cabecera al costado, el pie con las acciones. Los cuatro campos entran en dos renglones en lugar de
cuatro.

**Cuál de las dos formas es de ustedes.** `GR-37` no cambió: granito da el criterio y no el veredicto.
Para cuatro campos sugeriríamos una **región de la misma página** —la grilla se queda a la vista—.

#### Qué sobrevive de lo que ya hicieron, y qué no

| | |
|---|---|
| `MoneyInput` y los tamaños semánticos (`PED-2`) | **sobreviven tal cual** — y quedan mejor: en doce tramos los dos importes comparten renglón sin apretarse |
| las tres capas de validación, `useForm`, `useAction` | **sobreviven tal cual** |
| `catalogStrings.cancel` que quedó muerto (`PED-1`) | **vuelve a hacer falta**: el pie de un `Form` lo escribe la pantalla |
| `onConfirm` / `confirmDisabled` (`PED-1`) | **se van**: son del diálogo. El `Enter` lo da el `submit` del `Form`, y el motivo va en `disabledReason` del botón de guardar |

O sea: de `PED-1` se revierte la mitad, y de `PED-2` no se revierte nada.

#### Lo que NO estamos pidiendo

**Que dejen de usar diálogos.** Siguen siendo lo correcto para la **baja con confirmación** —que es
lo que `30-catalogos-abm` prescribe— y para un alta abierta **desde adentro de otro formulario**,
donde sí es «un dato para completar lo que ya estabas haciendo» y devuelve el valor al formulario de
atrás.

**Y no hay apuro.** El diálogo hoy funciona bien y no está roto. Esto es una decisión de forma, no un
defecto.

#### Qué hicimos mientras

Lo que era la causa de fondo, y es nuestro: **el README no tenía un solo ejemplo de `Page` + `Form` +
`Section`**, así que la única forma documentada de un alta era el diálogo. Peor: su archivo cita
nuestra resolución de `granito#PED-10` —«los campos van sueltos, sin `Form` ni `Section`»— para
justificar quedarse ahí. **Esa frase era correcta y estaba incompleta.**

Ahora el README tiene la sección «La pantalla de un registro», con el alta y la edición como el mismo
componente, y **la sección del diálogo empieza mandando a leerla** si lo que se está por escribir es
el formulario de un registro. `GR-70`.

### PED-9 · En el catálogo, abrir un artículo es sólo un doble clic

**Estado**: **hecho** · **Pide**: granito · **Fecha**: 2026-08-23 · **Bloquea**: no

> **Tomado el 2026-08-23.** El argumento que convence no es el que esperábamos: **una acción visible
> se puede ocultar por capacidad y un gesto no.** La descubribilidad sola se podía discutir; eso no.
>
> Va un `IconButton` con `CHEVRON_RIGHT` —no hay icono de «ver», y el chevron es el convencional
> para ir al detalle— y **el `onRowActivate` se queda**, como pidieron.
>
> **Lo que exige sale de la pantalla a la que lleva**, no se escribe en la fila: `toReach(pantalla)`
> devuelve la misma forma que una acción, así que un control que **navega** se filtra con lo mismo
> que uno que **ejecuta**. Sin eso, cada pantalla escribiría el ternario a mano y se copiaría mal.
>
> **Y destapó un defecto de `useActionColumn`**: tomaba **una** acción, así que con dos controles la
> columna quedaba atada al permiso equivocado — quien pudiera abrir la ficha y no cambiar el estado
> se quedaba sin las dos. Ahora recibe varias y existe si **alguna** está habilitada; adentro cada
> control se esconde solo.
>
> Lo sostiene `packages/core/tests/reach.test.tsx`, y se prueba ahí porque **no se ve con permisos
> completos**, que es como se mira una pantalla mientras se la escribe.

En `catalog-screen.tsx`:

```tsx
onRowActivate={(article) => goTo(articleScreen, { id: String(article.id) })}
```

Y la única columna de acciones lleva el botón de activar/desactivar. **No hay ninguna forma visible
de abrir el artículo**: si el operador no prueba el doble clic, no llega nunca.

#### La razón no es la descubribilidad

Esa sería suficiente, pero hay una mejor y sale del panel. `10-empresas-grilla` lista **«Ver la ficha»
como una acción de la grilla**, con su operación y su capacidad, junto a «Registrar cobro» y «Estado
de cuenta». Y la regla que sigue:

> «**Lo que la capacidad no habilita no se muestra**, no se muestra deshabilitado.»

**Una acción visible se puede ocultar por capacidad; un gesto no.** Hoy el doble clic navega igual
para cualquiera. El día que abrir un artículo dependa de una capacidad, el gesto va a llevar a un
callejón sin cartel — mientras que un botón, sencillamente, no se dibuja.

Es además lo que su propio `useActionColumn` ya resuelve bien para desactivar: *«de la acción sale si
la columna existe»* (`CU-46`). Abrir el registro merece el mismo trato.

#### Lo que pedimos

Un control visible en la fila para abrir el artículo —un `IconButton` con su `label`, o un enlace en
la columna del nombre—, sujeto a la capacidad que corresponda. **El `onRowActivate` se queda**: es un
atajo legítimo para quien usa la grilla todo el día.

#### Lo que cambió de nuestro lado

`onRowActivate` era **el único prop de `Table` sin docblock**, y el que más lo necesitaba. Ahora lo
tiene, y la fila con `onRowActivate` toma `cursor: pointer` y se anuncia con `aria-keyshortcuts`.

**Eso es una pista, no la acción**, y granito no va a poner el botón: reponerlo sería devolver un
acceso que un permiso negó, y quién tiene el permiso lo sabe su pantalla. Está escrito así en
`GR-71` y en el README, sección «Las columnas de una grilla».

#### Qué NO estamos pidiendo

**Que saquen el doble clic.** Se evaluó y se descartó: es un atajo real para quien opera la grilla
ocho horas por día.

#### Qué hicimos mientras

Nada de su lado. La pista necesita `@granito/ui` con `GR-71`; el botón no necesita nada nuestro.

### PED-10 · Los iconos son tres capas, y la del medio es suya

**Estado**: **hecho** · **Pide**: granito · **Fecha**: 2026-08-23 · **Bloquea**: no

> **Tomado el 2026-08-23, los dos puntos — y encontramos dos defectos en el verificador.**
>
> `EYE` en lugar de `CHEVRON_RIGHT`: tenían razón, la flecha la elegimos porque era lo único que
> había. Y el verificador entró a `npm test` **apuntando también a `packages/core/src`**, que es
> donde va a vivir la capa del medio — la de ustedes decía sólo `src/`, que es la capa de la
> aplicación.
>
> **1 · La invocación que documentan no funciona.** `granito-iconos "src/**/*.tsx"` intenta abrir
> eso como un archivo y revienta: **el verificador recibe archivos, no patrones**. Sin comillas
> depende de que lo expanda el shell, y en Windows los scripts de npm corren en uno que no lo hace.
>
> **2 · Y con el paquete enlazado no hace nada, en silencio.** Éste es el peor de los dos. Su
> guarda es:
>
> ```js
> if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
> ```
>
> **Node resuelve los enlaces simbólicos al cargar un módulo**, así que `import.meta.url` apunta al
> archivo real y `argv[1]` a la ruta por la que se lo llamó. Con `@granito/ui` instalado por
> `file:` —que es como lo consumimos, y como lo va a consumir cualquiera en desarrollo— **no
> coinciden: el programa termina con éxito y sin imprimir nada**.
>
> Nos pasó exactamente eso: lo agregamos, dio verde, y el verde era que no había corrido. Lo
> descubrimos porque probamos a romperlo a propósito.
>
> **Los dos van aparte como `granito#PED-14`**, no como comentario de éste: un verificador que
> aprueba sin correr es el peor modo de falla que puede tener una comprobación, y merece su propio
> renglón en la lista que ustedes leen.
>
> **La salida sería comparar rutas reales de los dos lados** —`realpathSync` sobre `argv[1]`—, o no
> tener guarda y separar el programa del módulo en dos archivos.
>
> Mientras tanto lo llamamos por su ruta real desde `tests/icons.mjs`, que además resuelve los
> archivos. **Corre su programa, no uno parecido** — eso lo respetamos. El día que los dos defectos
> estén cerrados, ese archivo se borra y queda una línea.
>
> Lo probamos rompiéndolo: un `path` de 41,6 de lado mayor da «UN ICONO SUELTO NO SE PARECE A LOS
> DEMÁS». Ahora sí sabemos que corre.

Al resolver `PED-9` usaron **`CHEVRON_RIGHT`** para «ver el detalle». Es la flecha de un paginado, y
la eligieron porque era lo único publicado que se aproximaba. Eso era un hueco nuestro.

#### Lo que cambió de nuestro lado

**Granito publica ahora los iconos fundamentales** (`GR-72`): `EYE`, `UNDO`, `DOCUMENT`, `LIST`,
`CLOCK`, `CHART`, `TAG`, `SETTINGS`, `BUILDING`, además de los que ya estaban. Para abrir un registro,
`EYE`.

La línea de qué publicamos: **el icono de una ACCIÓN o de un ESTADO que cualquier aplicación tiene.
No lo que sólo existe adentro de un negocio** — eso lo dibuja quien lo conoce.

#### Y acá viene la parte que es de ustedes

El modelo es de tres capas: granito los fundamentales, **cuarzo los que comparten sus aplicaciones**,
y cada aplicación los suyos. Eso sólo funciona si los tres respetan la misma familia, así que
**publicamos el verificador**:

```bash
npx granito-iconos "src/**/*.tsx"
```

Exige que se dibujen con `icon()` —el mismo que usamos nosotros, exportado—, que nada se salga del
lienzo con al menos 1 de margen, y que el lado mayor caiga entre 9,5 y 18. **Falla ante un comando de
`path` que no sabe medir**, en vez de aprobar un dibujo que no entendió.

**Es el mismo programa que corre la prueba de granito.** Si corriéramos otro, estaríamos exigiendo
una cosa y verificando otra.

#### Lo que pedimos

1. **Cambiar `CHEVRON_RIGHT` por `EYE`** en `row-actions.tsx`, si les parece que dice mejor «ver el
   detalle». Si prefieren la flecha por otra razón, también sirve saberlo.
2. **Agregar `granito-iconos` a su `npm test`**, apuntando a sus fuentes. Hoy no dibujan ninguno
   propio, así que pasa en verde — y ése es el momento de ponerlo, no cuando ya haya cinco.

#### Lo que NO estamos pidiendo

**Que dibujen los suyos con nuestro permiso.** La capa del medio es de ustedes: si dos aplicaciones
comparten un icono, va en cuarzo y no acá.

#### Un aviso honesto sobre el límite

El verificador **no mira si el dibujo es bueno**. Que el trazo esté resuelto, que la metáfora se
entienda, que dos iconos no se confundan entre sí — eso lo ve una persona. Es la misma limitación que
`GR-61` dejó anotada y que no se puede cerrar con una prueba.

#### Qué hicimos mientras

De nuestro lado, lo que era la causa: **el demo de granito dibujaba nueve iconos a mano**, con dos
ayudantes propios de trazo 1,3 y 1,4 sobre un lienzo de 16 contra el 1,6 y 20 de la familia. O sea
que incumplíamos nuestra propia decisión en el archivo donde la escribimos. Ya no.

### PED-11 · La pila de flujo, y cómo se declara un flujo sin acoplar pantallas

**Estado**: hecho · **Pide**: granito · **Fecha**: 2026-08-23 · **Bloquea**: no

`GR-73` **reemplaza a `GR-36`**: hay pila de flujo. Su argumento contra la pila era contra el «atrás»
automático **al terminar**, y se estaba aplicando también **al cerrar**, que es otra cosa.

Las dos reglas, y una tercera que ya tienen construida:

> **Cerrar desapila.** Salir sin terminar devuelve el escalón anterior, tal cual estaba.
>
> **Terminar reemplaza.** Va al destino que el flujo nombra, con su payload. Si ese destino ya está
> en la pila, se desenrolla hasta él; si no, reemplaza el escalón actual.
>
> **Qué contenido se ve al llegar lo decide la invalidación** — eso ya lo hace `useAction`.

Se probó contra seis casos del panel; están en `GR-73` con su evidencia.

#### Por qué esto NO contradice `granito#PED-13`

Sigue valiendo que **una pantalla no nombra a otra**. Que `15-movimiento` «vuelva al estado de
cuenta» es un hecho **del flujo**, no de la pantalla: ella anuncia que cerró o que terminó, con su
payload, y el flujo lo mapea. Si la pantalla lo importara, dejaría de servir en otro flujo — que es
justo lo que veníamos protegiendo.

#### Una estrategia de implementación, como insumo y no como pedido

**El lugar es la URL, y la pila es la historia del navegador.**

| | |
|---|---|
| abrir | `pushState` |
| terminar | `replaceState` — el escalón actual desaparece, que es exactamente «terminar reemplaza» |
| cerrar | `history.back()` |
| desenrollar hasta un destino que ya está abajo | `go(-n)` |
| el menú aborta | navegación nueva, marcando raíz de flujo en `history.state` |

Lo que se gana, y no es poco:

- **El botón «atrás» del navegador pasa a ser «cerrar»**, que es lo correcto — hoy es una bomba.
- **Los enlaces profundos funcionan** y son compartibles.
- **El scroll lo restaura el navegador solo**, que es para lo que existe `scrollRestoration`.
- **Sobrevive al F5** — mejor de lo que `GR-73` exige, que sólo pide que la pila vacía caiga a un
  regreso nombrado.
- Y el lugar —filtro y página— viaja en la URL, así que **`useTableQuery` tendría que pasar de
  `useState` a parámetros de consulta**. Hoy son `useState` y por eso se pierden.

**Dos casos que la decisión exige y que conviene no descubrir tarde:**

- **Cerrar con la pila vacía** cae al regreso nombrado de la pantalla, y si no lo tiene, a la raíz de
  su contexto. Pasa cada vez que alguien llega por un enlace pegado o recarga.
- **Salir del flujo con trabajo sin guardar avisa antes de descartarlo.** Abortar está bien; abortar
  en silencio, no. Es el mismo principio por el que en granito un clic afuera no cierra un diálogo
  por omisión.

Lo que no cubre: la **fila parada** (`GR-47`). Eso no está en la URL y hoy es estado de `Table`. Lo
miramos de nuestro lado si les hace falta.

#### Y lo que nos parece que más importa: cómo se declara un flujo

Nuestra lectura es que **no debería haber un grafo que escribir**. La pantalla emite resultados; el
flujo los mapea. Algo con esta forma —no es una propuesta de API, es la forma que la decisión pide—:

```
flujo(raíz: catalogGrid)
  catalogGrid   · «eligió una fila»  → abre(articleScreen, {id})
  articleScreen · «canceló»          → cierra
  articleScreen · «guardó»           → termina en catalogGrid
  catalogGrid   · «quiere crear»     → abre(articleScreen, {nuevo})
```

Tres propiedades que nos parecen las que hacen o rompen la ergonomía:

1. **Que se lea el flujo entero en un lugar.** Hoy hay que abrir tres pantallas para saber a dónde va
   cada una. Un flujo en un archivo es la diferencia entre poder revisarlo y no.
2. **Que las pantallas no aparezcan importándose entre sí.** Sólo el flujo conoce a las dos puntas.
3. **Que no haya que declarar la pila.** Apilar, reemplazar y desenrollar salen de las dos reglas: si
   el desarrollador tiene que pensar en la pila, la abstracción no sirve.

Y una que es de ustedes decidir: **si un resultado sin mapear es un error de compilación.** Nos
parece que sí —es el mismo criterio de `ApplyMode` en granito, donde no elegir no compila— pero el
costo lo pagan ustedes.

#### Lo que NO estamos pidiendo

**Que `toReach` se tire.** Derivar la capacidad del destino es un acierto; ahora el que conoce el
destino es el flujo, así que la derivación se muda ahí.

**Que resuelvan el scroll y la fila parada en esta vuelta.** El lugar mínimo es el filtro y la
página, que es lo que hoy se pierde y lo que más cuesta rehacer.

#### Un aviso honesto

`GR-73` se trazó **en papel**. Los seis casos salen del panel y las dos reglas cierran, pero el
primer flujo real va a encontrar algo que en la traza se ve limpio. Si aparece, es un pedido de
vuelta para acá y no un parche de allá.

## Cerrados

**No se borran.** Un `hecho` dice qué cambió y por qué, y un `rechazado` dice por qué no — sin eso,
lo mismo se vuelve a pedir en seis meses.


#### Respuesta de cuarzo · 2026-08-24 · **construido**

Está implementado y andando: `CU-47`, y el catálogo del esqueleto es el primer flujo real. Nos
pidieron que les contáramos qué encontró, así que va eso y no un resumen.

**Las dos reglas se sostuvieron.** Ninguno de los seis casos de `GR-73` necesitó una excepción.

**Y hay una tercera regla que no estaba escrita y hace falta**: *si el destino ya está en la pila,
se desenrolla hasta él* aplica **también al abrir**, no sólo al terminar. Con eso, la recursión deja
de ser un caso especial: un ciclo `A → B → A` no crece, se desenrolla solo. `GR-73` la resolvía por
otro lado —«`15` nombra su regreso»— y esto la cubre sin que la pantalla nombre nada.

**Con una precisión que decide si funciona**: la identidad de un escalón es **pantalla más
parámetros**. Con la pantalla sola, `movimiento#7 → movimiento vinculado#9` desenrolla al `#7` y el
`#9` no se ve nunca. Así, la pila crece **lo que el operador caminó**.

#### Lo que confirmamos de su estrategia

La historia del navegador funcionó, con una diferencia: **lo nuestro va en el `state` del ruteador,
no en `history.state` crudo** — React Router ya es dueño de ese objeto. La propiedad que importa se
mantiene igual: el flujo y la pila son **estado de cada entrada**, así que el botón «atrás» funciona
sin código nuestro y el F5 no pierde nada.

Y sí: `useTableQuery` pasó a parámetros de consulta. **Reemplazando la entrada, no apilándola** —
filtrar y paginar no son escalones, o salir de una grilla después de mirar cinco páginas serían
cinco apretadas.

#### Dos cosas que su traza en papel no podía ver

**Desenrollar deja el botón «adelante» encendido**, sin que nadie haya ido atrás, y lleva a una
pantalla que el flujo dio por terminada. La ventana dura hasta la próxima acción del flujo, porque
apilar trunca lo de adelante. Lo aceptamos con una prueba que lo fija.

**Después de terminar, un «atrás» no se ve**: reemplazar deja dos entradas parecidas seguidas.

Las dos están escritas en `CU-47` como costos elegidos. Si en uso alguna molesta, vuelve para acá.

#### Las tres respuestas a lo que preguntaron

**«¿Un resultado sin mapear es un error de compilación?»** No: **falla al arrancar**. Estaba decidido
en `CU-44` con su razón —compilarlo exigía duplicar la inferencia de tipos que `CU-41` ya paga— y a
cambio la falla es determinística y no llega a producción. Son seis comprobaciones, y una de ellas
es la que ustedes describen.

**«Que se lea el flujo entero en un lugar.»** Sí: `src/app/flows.ts`, un archivo.

**«Que las pantallas no aparezcan importándose entre sí.»** Sí, y **mecanizado**: sólo el archivo de
la funcionalidad y el mapa de flujos pueden nombrar una pantalla. Lo verifica una comprobación, no
una regla escrita.

**«Que no haya que declarar la pila.»** Nadie la declara: se escriben tres verbos.

#### Y `toReach` no se tiró, se mudó

Como dijeron. Ahora la grilla le pregunta **al flujo** qué capacidad exige llegar a donde un
desenlace lleva. Eso trajo algo que no estaba en el pedido y resultó ser el argumento más fuerte:
**la misma grilla puede exigir capacidades distintas en flujos distintos**. Con el destino escrito
adentro de la pantalla, la capacidad sería una sola.

#### Lo que queda de ustedes

`granito#PED-15`, que abrimos aparte: el aviso de trabajo sin guardar no se puede dar igual en los cinco
caminos, y `GR-73` lo promete uniformemente.
