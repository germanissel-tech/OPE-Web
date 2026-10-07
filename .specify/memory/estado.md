# Estado, y de dónde viene

Lo que una sesión nueva necesita saber y **no puede deducir del código**, porque todavía casi no
hay código.

Esto cambia; la [constitución](constitution.md) no. Si algo de acá contradice al repositorio,
manda el repositorio.

*Última revisión: 2026-08-20.*

## Dónde está cada cosa

Todo cuelga de `tandilia/`, un nivel arriba de este repo:

| ruta | qué es | se puede tocar |
|---|---|---|
| `../granito` | El sistema de diseño. Publica `@granito/tokens` y `@granito/ui` | sí, es nuestro |
| `../las-animas/backend` | La API de cuenta corriente. Contrato OpenAPI primero | **no** — es de otro sistema |
| `../las-animas/backend/docs/panel/` | Veinte notas que especifican las pantallas del panel | **se leen, no se escriben** |
| `../las-animas/admin` · `../las-animas/pos` | **Vacías.** Serán las primeras aplicaciones | todavía nada |
| `../` | **La plataforma**: `00-proyectos.md` con el mapa de nombres, y `docs/decisiones.md` con lo que cruza sistemas | sí |

**Empezar por `../granito/CLAUDE.md`**: ahí está qué componentes existen y cómo se trabaja. Y
`../granito/docs/identidad-visual.md` tiene 51 decisiones con su razón — **no se re-decide nada de
lo que está ahí**, se consulta.

## Qué hay en cuarzo hoy

**Las decisiones, el andamiaje de SDD, y tres especificaciones.** El esqueleto **levanta y se
clona**, y `003` —la pila de flujo— está implementada.

**Cuarzo es una aplicación que corre**, no un repositorio de documentos — ver `CU-20`. Se clona para
empezar cada aplicación de Tandilia, y lo que tiene que quedar sincronizado se publica como paquete
desde acá (`CU-40`).

**Los números no se escriben acá.** Se desactualizan en una sesión y nadie los corrige, que es la
regla de `TAN-4`. Dos comandos los informan:

```bash
npm test      # cuántas decisiones hay, cuántas abiertas, y que toda cita resuelva
npm run avance   # en qué tramo está la implementación, y qué sigue
```

Las decisiones viven en `docs/arquitectura.md` y `docs/seguridad.md`, con `docs/decisiones.md` como
índice. Se partieron en dos cuando la seguridad pasó a ser dos tercios del total; **la numeración es
una sola para ambos** y toda cita lleva prefijo: `CU-n` de cuarzo, `GR-n` de granito, `TAN-n` de la
plataforma.

`npm test` verifica que el índice coincida con los documentos y que **toda cita resuelva**, incluidas
las de granito y las de plataforma contra sus propios repositorios. Se le inyectaron los cinco
errores que dice cubrir y los agarró a los cinco.

**Ninguna de las decisiones abiertas depende sólo de nosotros**, y ninguna bloquea al esqueleto.

## El esqueleto se levanta, y el clon también

**2026-08-23.** `002` llegó a su criterio: `npm run clon` hace el ritual entero —empaqueta con
`npm pack`, instala desde los `.tgz`, y compila— y termina en **EL CLON ARRANCA**. Es lo único que
prueba de verdad la promesa de `CU-20`, y hasta ese día no lo verificaba nada.

Se empaqueta y no se enlaza a propósito: **enlazados desde la carpeta de al lado, `files` y
`exports` no se ejercitan**, que es justo donde estaban los errores.

**Los dos paquetes se publican compilados** —`dist` con sus tipos, y `src` al lado como en granito—,
y **las decisiones viajan adentro de `@cuarzo/core`**. Eso último cerró la mitad de cuarzo de la
deuda 1: una aplicación clonada ya verifica las citas a `CU-n` que hereda en su código. La mitad de
granito sigue abierta.

**Y `003` está especificada, aclarada y planificada**: la pila de flujo, que responde a
`granito#PED-11` y enmienda `CU-44`. No está implementada — `npm run avance` dice dónde va.

### Cuatro cosas que estaban rotas y no se veían

Las cuatro son de la misma familia, y por eso van juntas: **algo declarado que no existía**.

| | |
|---|---|
| `.gitignore` tenía `build/` y **se comió el mecanismo de versión entero** | Acá andaba todo; una copia recién clonada no levantaba |
| La comprobación de citas **miraba sólo markdown** | 452 citas en comentarios de código sin verificar, mientras `CLAUDE.md` prometía lo contrario |
| `npm run avance` buscaba `Punto de checkpoint` y el archivo dice `Punto de control` | Cero coincidencias, ninguna queja, todo `002` |
| El clon heredaba `.specify/feature.json` apuntando a una spec de cuarzo | `CU-20` lo prohíbe por escrito desde el principio |

**Las cuatro se descubrieron rompiendo algo a propósito, no leyendo.** Y las cuatro se pagaron con
la comprobación que faltaba, no sólo con el arreglo — sin eso vuelven en el próximo apuro, que es
exactamente cómo llegaron.

## La pila de flujo, y el catálogo como primer flujo real

**2026-08-24.** `003` está implementada. Una pantalla ya no nombra a otra: informa un desenlace, y a
dónde lleva eso lo dice el paso del flujo activo. `routing.ts`, `route()` y `composeRouting` se
borraron.

Lo que un operador nota: **filtrar, abrir una ficha, cerrar, y estar donde estaba** — que es el
problema con el que arrancó todo. El lugar vive en la URL y el recorrido en el estado de la entrada
del historial, así que el botón «atrás» funciona sin código propio y el F5 no pierde nada.

**Vino de afuera.** `granito#PED-11` trajo `GR-73`, y con él el argumento que desde acá no se veía:
una pantalla que nombra su destino sirve en un solo recorrido.

### Lo que se decidió mirando, y no leyendo

Tres cosas se midieron antes de escribirlas, y una corrigió la especificación:

- **El botón «atrás» sí se puede interceptar.** Estaba declarado como imposible. El ruteador no
  cancela: **rebota**. Un límite declarado que no existe engaña igual que una garantía declarada que
  no existe.
- **La pila va en el estado del ruteador**, no en la History API: React Router ya es dueño de
  `history.state`.
- **No hay «flujo actual» en ningún lado.** Se lee de la entrada; cualquier copia se desincroniza
  con el botón «atrás».

### Y una lección sobre las comprobaciones, que ya van tres

La regla que faltaba desde la deuda de las dos formas de navegar **costó tres intentos, y los tres
dieron verde con la importación puesta a propósito**: un backslash colapsado, una ubicación debajo
de donde se evalúan las fallas, y una definición tan ancha que marcaba lo que no era.

Junto con el verificador de iconos de granito y la comprobación de límites del paquete, ya son
varias: **a una comprobación nueva se le rompe algo antes de creerle**, y lo que cuenta no es que
pase sino que falle cuando tiene que fallar.

## Lo que sigue, en orden

> **`004` está cerrado, revisión incluida.** `CU-29` dejó de estar declarada y vacía: el testigo
> viaja, la puerta relee y compara, y el catálogo tiene una edición de verdad que lo ejercita.
>
> **La revisión de `TAN-6` devolvió quince hallazgos**, y el más caro es el que ninguna prueba podía
> ver: la referencia con que se compara y el testigo con que se escribe salían de la consulta viva,
> que se mueve sola. Con ellos corridos, después del diálogo de conflicto «seguir editando» y guardar
> **le borra el cambio al otro con un testigo válido, sin rechazo y sin diálogo** — la protección
> entera, salteada por el único camino que no pasa por ella. Se paga con `useLoadedOnce`, su prueba,
> y una comprobación que mira que la variable de `loaded:` salga de ahí.
>
> **Tres cosas se decidieron más allá de lo que `CU-29` dice**, y enmendar no lo decide un agente:
> que coincidir no cuente como chocar, la fusión al reintentar, y la restricción de tipo en lugar de
> la intersección que proponía el plan.


**1 · Los siete tramos del esqueleto.** Cada uno termina con la aplicación arrancando, así que nunca
hay más de un tramo sin verificar. **Una casilla no cierra un tramo: lo cierra su punto de control.**

`npm run avance` dice dónde quedó, cuál es la siguiente tarea y qué punto de control falta. **No hace
falta buscarlo en la conversación anterior**, que es de lo que se trata.

**2 · El adaptador de OIDC**, que es el segundo tramo de `001`, contra el proveedor local de `TAN-2`.
El primero —con la implementación falsa— entra en el tramo 2 del esqueleto, porque el esqueleto la
necesita para levantar.

**3 · Construir `../las-animas/admin`**, la primera aplicación. Las pantallas salen de las notas del
panel, que ya dicen qué muestra cada una y qué no puede hacer. **Es también la primera prueba real de
que clonar sirve**, y lo que va a decir cuántos pasos tiene de verdad el ritual — que es `CU-21`.

**4 · La deuda con el método**, en `../docs/deuda.md`. De cuarzo son tres entradas: procedencia en
las decisiones, que lo bloqueante se liste solo, y las convenciones de bóveda. Ninguna bloquea al
esqueleto.

## Granito quedó listo para publicar, menos la credencial

El 2026-08-20 se lo preparó como paquete versionado en **npm público**, licencia propietaria:

- raíz con *workspaces*, para que `ui` vea la carpeta de tokens en desarrollo y la versión
  publicada cuando lo instala una aplicación;
- `@granito/tokens` salió de adentro del bundle de `ui` — antes los números quedaban congelados en
  el build y las variables CSS se resolvían al instalar, o sea dos versiones conviviendo;
- `publishConfig.access: "public"` en los dos, sin lo cual npm los publicaría privados;
- una prueba nueva en tokens: verifica que los 135 tokens entreguen `var(--…)` y no un valor;
- `docs/publicacion.md` con la política de versiones.

**Los dos `npm publish --dry-run` pasan.** Falta `npm login` y crear la organización `granito`.

**Los cambios de granito están sin commitear.**

## El traspaso que les dejamos a los vecinos

El 2026-08-20 se les dejó anotado, **en su propio `CLAUDE.md`**, que sus citas a decisiones no las
verifica nadie. **No se tocó nada más en esos repos**: la deuda queda de ellos, con el dato medido
y sin la solución impuesta.

**Granito** es el caso real: 124 citas vivas y **65 en comentarios de código**, que es donde se
pudren en silencio. Además tiene dos numeraciones que se pisan —«decisión» y «regla»— y la
escritura ya inconsistente. Antes de tocar nada tiene que decidir si renumera o sólo prefija, y eso
no lo decide un agente.

**Las-animas** casi no tiene el problema, y conviene no confundirlo: su número vive en el nombre
del archivo, cita con prefijo `ADR-`, y el estado de un abierto es la carpeta. Le falta sólo la
comprobación, y una fragilidad propia — el contrato cita rutas de archivo que un `git mv` rompe sin
aviso. Se le dejó una nota corta, no un traspaso.

**Y hay un límite que cruzamos a propósito**: este documento marca ese repositorio como ajeno, y su
`CLAUDE.md` tiene una regla de no usar los repos vecinos como fuente. Se escribió igual, por pedido
explícito, y la nota lo dice en su primer renglón para que quien la lea sepa qué es.

**Lo que NO se hizo, y es deliberado**: extraer un verificador compartido. Cuarzo tiene una sola
implementación, y con una sola no se ve qué es general — es el principio VI. Granito escribe la
suya, y de comparar las dos sale qué se puede compartir.

## Siete preguntas que esperan a la VPN

El realm y la API viven en la red interna —`sso.datasync.local`, `api.ctacte.local`— y desde afuera
**no resuelven**. El propio contrato lo avisa. Se probó el 2026-08-20: el documento de
descubrimiento y la API dan `HTTP 000`.

> Ojo con el nombre: `nslookup sso.datasync.local` desde afuera **sí devuelve una IP**, porque el
> sufijo de búsqueda le agrega `.com.ar` y cae en una dirección de estacionamiento. El nombre no
> resuelve, pero una resolución ingenua obtiene respuesta y le habla a un desconocido.

**Ninguna de las siete pide cambiar nada**: todas se contestan mirando. Están en orden de cuánto
duele que la respuesta sea la que no esperamos.

1. **¿En qué dominio va a vivir el proveedor en producción?** CU-8 depende de que comparta dominio
   registrable con las aplicaciones —CU-11 decidió `*.siempre.com.ar`— y hoy el contrato declara
   `sso.datasync.local`, que es **otro sitio**. Si el proveedor no se muda, **CU-8 se cae** y con
   ella buena parte de `specs/001-la-sesion`. Es la más consecuente de las siete.
2. **¿Cuánto tiempo le da el realm a un ingreso en curso?** Los dos minutos de la espera de CU-9
   tienen que quedar por debajo. Está sin marcar en la lista de control de la especificación.
3. **¿Cuáles son los tiempos de sesión del realm**, inactividad y máximo? Se cruzan con el cierre
   por inactividad que decidió la especificación.
4. **¿Qué clients existen, y cuál corresponde a cada sistema?** Hoy sólo conocemos `ctacte-panel`.
5. **Cuando la API de un sistema valida un token, ¿contra qué claim mira?** El contrato de cuenta
   corriente mira `resource_access.ctacte-panel.roles`, o sea los roles del client del frontend.
6. **Con la sesión del realm viva, ¿se puede obtener un segundo token para otro client sin pedir
   credenciales?** **Ésta decide CU-22.** Si da que sí, funciona con el mecanismo que ya existe: el
   flujo silencioso de CU-11, una vez por client. Si da que no, CU-22 se cae.
7. **¿Está habilitado el intercambio de tokens?** El camino alternativo si la 6 da que no. En
   Keycloak suele venir apagado.

**Lo que necesitamos de `las-animas/backend` viaja como pedido**, y desde la enmienda de `TAN-5`
el sobre vive en `tandilia/pedidos/las-animas/backend/PED-n.json`. **La carpeta es el receptor
federado entero**, así que un backend lleva sus dos tramos: `las-animas/backend` y no `las-animas`.

Allá y no acá, y tampoco en el repositorio de ellos: escribirlo adentro del que lo recibe obliga a
quien pide a entrar a un repositorio que no gobierna.

Adentro va lo que dependemos de ellos, las preguntas que se contestan mirando, y **lo que NO
pedimos**, para que se vea la línea.

Lo que sigue son las que esperan a la VPN, que son de configuración del realm y no del contrato.

Y una **para el backend**, que salió al decidir CU-32: **¿cómo se autentica una descarga por
enlace directo?** El contrato explica que el formato va en la ruta «para que el panel pueda apuntar
un `href` directo al PDF, sin JavaScript de por medio», pero toda operación exige token y un enlace
del navegador no manda un *bearer*. Si hay respuesta, se gana la descarga nativa; si no, la
exportación la maneja la aplicación, que es como quedó diseñada.

Y una segunda, de la misma decisión: **¿puede un `/export/{format}` responder `202` con una corrida
cuando el reporte no se resuelve en el acto?** Hoy la respuesta sólo define el archivo. Las dos
decisiones del backend apuntan distinto —ADR-008 hace la exportación sincrónica, ADR-010 dice que un
proceso largo es una corrida— y una exportación que tarda minutos es un proceso largo.

Y una de infraestructura: **sobre qué se sirve una aplicación y
quién la despliega.** CU-17 la dejó explícitamente afuera.

**Las cuatro últimas son de CU-22, que está decidida apoyándose en que la 6 dé que sí.** Está dicho
adentro de la decisión, no es una sorpresa escondida.

**Lo que un agente no puede hacer**: el documento de descubrimiento es público y se puede leer, pero
la lista de clients y las políticas de sesión están en la consola de administración, que pide
entrar. Un agente no ingresa credenciales — sirve si la sesión ya está abierta y sólo hay que leer.

## Dos credenciales vencidas, y ninguna tiene dueño

**La API de Bitbucket da `401`.** `BITBUCKET_USERNAME` y `BITBUCKET_TOKEN` fallan en todas las
formas probadas: el *app password* está vencido o revocado. Lo que haga falta en Bitbucket **se
hace por el navegador**, donde la sesión sí está abierta. No perder tiempo con la API.

**El token de npm también da `401`.** Está en `~/.npmrc`, es de junio de 2025. Publicar necesita
`npm login` primero.

Ninguna de las dos se puede renovar desde acá: piden ingresar credenciales.

## Otras dos cosas del entorno

**El repositorio existe**: `bitbucket.org/grupo-siempre/cuarzo`, proyecto **Tandilia**, privado,
rama `main`. Empujar funciona — git usa las credenciales del gestor de Windows.

**El workspace `grupo-siempre` está en el plan Free.** Por eso se descartó el registro de paquetes
de Bitbucket, que además todavía no tiene versiones inmutables.

**`tandilia/` ya es un repositorio**, desde el 2026-08-20. Tiene los documentos de la plataforma
—`00-proyectos.md`, que dejó de estar sin versionar, y `docs/decisiones.md` con las decisiones que
cruzan más de un sistema— y las seis carpetas de proyectos ignoradas. **Todavía no tiene remoto en
Bitbucket**: crearlo pide el navegador.

Ahí vive `TAN-1 · Si usamos feature flags`, de la que depende `CU-19`.

## Tres cosas que ya nos costaron caro

**La trampa del primer consumidor.** Granito se construyó para el panel de cuenta corriente y quedó
con el símbolo del peso adentro, los nombres de un contrato ajeno y 42 rótulos en castellano
cableados. Separarlo llevó una jornada entera. **Con un solo consumidor no se ve qué es general.**

**Un documento no asegura nada.** Granito tiene 51 decisiones escritas con su razón, y aun así el
paquete se publicó sin tipos, una tabla perdió sus columnas y dos tarjetas quedaron pegadas. Las
agarró una prueba, no un documento.
**Y un verde puede querer decir que no miró.** Dos veces en la misma semana: el verificador de
iconos de granito terminaba con éxito sin haber corrido —`PED-14`—, y la comprobación de límites
aprobaba `packages/` sin mirarlo, mientras `CU-40` afirmaba por escrito que esa dirección estaba
verificada. Las dos se descubrieron **rompiendo algo a propósito para ver el mensaje de falla**, no
leyendo el código.

Es peor que no tener la comprobación: quien la agrega deja de buscar. **A una comprobación nueva se
le rompe algo antes de creerle**, y lo que cuenta no es que pase, sino que falle cuando tiene que
fallar.
