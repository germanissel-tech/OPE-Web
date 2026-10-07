# Seguridad de una aplicación de frontend de Tandilia

La sesión, la autenticación y los permisos. Cada decisión con su razón, igual que en
[`arquitectura.md`](arquitectura.md).

**Esto es una continuación de ese documento, no otro criterio.** La numeración es una sola para los
dos: la decisión CU-11 es la 11 esté donde esté, y las decisiones se referencian de un archivo al
otro. Se separó cuando la seguridad pasó a ser **dos tercios de todo lo decidido** — no porque sea
un asunto aparte, sino porque es el más grande y el que más va a crecer.

## Con qué se apoya

Tres decisiones del otro documento sostienen a éstas y no se repiten acá:

| | |
|---|---|
| **CU-1** | Una pantalla a la vez, y sin apilar — lo que se abre encima es un **diálogo** |
| **CU-3** | Lo que un permiso no habilita, no se muestra — **CU-13** le agrega un tercer estado |
| **CU-4** | Toda pantalla que trae datos tiene cuatro estados, no uno |

---

## Lo que se decidió

### CU-8 · La sesión se renueva sola, en silencio

**Estado**: decidida · **Depende de**: CU-11

El token se renueva en segundo plano y el operador no se entera de nada. Se eligió sobre avisar y
pedir volver a entrar porque es la que mejor se comporta en el caso normal, que es casi siempre.

**Es posible gracias a la decisión CU-11.** Todas las aplicaciones y el proveedor comparten dominio
registrable, así que la cookie de sesión del proveedor **no es de tercero** y la comprobación
silenciosa contra él funciona. Si algún día el proveedor quedara en otro dominio, esta decisión se
cae — y no por una elección de frontend, sino porque el navegador bloquea esa cookie.

### CU-9 · Volver a entrar no descarga la página

**Estado**: decidida · **Depende de**: CU-1, CU-10, CU-12

Cuando la renovación silenciosa no se puede, **se avisa, y el aviso lleva un botón que abre el
reingreso en una ventana emergente.** La página no se descarga: el estado del formulario sigue en
memoria y no se pierde nada.

**No se guarda ni se restaura nada, y eso es exactamente el punto.**

La alternativa —serializar lo cargado y restituirlo después de la redirección— llega al mismo
resultado con mucha más maquinaria, repartida por todas las pantallas: granito **no maneja el
estado del formulario a propósito** (`Form` es presentacional y `TextInput` envuelve el control
nativo), así que ese estado vive en cada pantalla de cada aplicación y no hay un solo lugar del que
serializar. Sería trabajo en cada formulario que exista, para algo que se ejerce casi nunca — y lo
que se ejerce poco se rompe sin que nadie lo note.

Y trae dos trampas que hay que acertar y son fáciles de errar: **un borrador restaurado para un
usuario distinto del que lo escribió** —se vence la sesión, entra otra persona en la misma máquina—
y **un borrador restaurado sobre algo que el servidor ya guardó**, cuando la sesión se cayó con un
pedido en vuelo. Acá ninguna de las dos existe, porque no hay borrador.

**Por qué se puede.** El aviso es un clic, o sea **un gesto del operador**, que es justo lo que los
navegadores exigen para permitir una emergente. Y el proveedor está en el mismo sitio (decisión
11), así que el ida y vuelta va liso; le avisa a quien la abrió con `postMessage`, mismo origen.

**Que salga como ventana o como pestaña lo decide el navegador**, según sus opciones y la
configuración de cada usuario. Las dos dan `opener` y `postMessage`, así que el diseño no puede
depender de cuál sea.

**Mientras tanto, la pantalla espera.** Desde que se abre la ventana hasta que vuelve, la pantalla
**no se puede usar**: cualquier cosa que el operador toque va a dar `401`.

**Y eso es un diálogo, que granito ya tiene.** No hace falta nada nuevo, y no es una excepción sino
la decisión CU-1 aplicada: lo que se abre sobre lo que se está mirando es un diálogo, y un diálogo no
decide nada — pide una respuesta y la devuelve. Acá pide una sola: volver a entrar.

`Dialog` resuelve las cinco cosas que este estado necesita:

| hace falta | cómo |
|---|---|
| cubrir la pantalla | el velo, `position: fixed; inset: 0` |
| frenar el clic | el velo lo intercepta |
| sacarla del recorrido del teclado | `aria-modal` y la trampa de foco |
| que no se cierre solo | `open` es controlado, y el componente no se cierra por su cuenta |
| que un clic afuera no lo saque | `dismissOnOutsideClick` es **no** por omisión |

Y el flujo entero es **el mismo diálogo cambiando de contenido**:

| momento | cómo |
|---|---|
| **aviso** | `severity="warning"`, `confirmLabel="Volver a entrar"`, sin `cancelLabel`: un solo botón |
| **esperando** | la prop `actions` reemplaza los botones por un `Spinner` |
| **vencido el plazo** | la pantalla ya se descartó; `severity="error"` y un botón que recarga |

**`Escape` se ignora a propósito.** El diálogo lo llama igual —no tiene con qué apagarlo— y el
módulo de sesión no lo atiende: acá no hay nada que cancelar. Queda dicho para que no parezca un
olvido. Si la molestia se vuelve real cuando el módulo exista, granito tiene dónde recibir una prop
hermana de `dismissOnOutsideClick`; pedírsela hoy sería cambiar la biblioteca por un consumidor que
todavía no existe.

Ese estado tiene que resolver tres cosas, y las tres son agujeros si no se dicen:

- **Si la ventana se cierra sin entrar**, la pantalla no puede quedarse esperando para siempre.
  Vuelve el aviso con su botón y se puede reintentar. Sin esto queda muerta y sin salida.
- **Si entró otra persona, no se continúa.** La pantalla tiene lo que tecleó alguien y la sesión es
  de otro: continuar le atribuiría a uno el trabajo del otro. **Si el sujeto cambió, es una sesión
  nueva** y la pantalla se recarga.
- **El pedido que se cayó con `401`**: si sólo leía, se vuelve a pedir solo y la pantalla se rearma
  sin que el operador haga nada. **Si escribía, no** — vuelve el botón y lo aprieta él. Guardar
  algo que nadie volvió a pedir es sorprendente, y entre el `401` y el reingreso pudo pasar un
  rato. Vive en la puerta (decisión CU-10), que es la que se entera del `401`, no en la pantalla.

**La espera tiene plazo: dos minutos**, configurable por aplicación. No es sólo para no esperar
para siempre. Una pantalla congelada con los datos de un cliente, en un mostrador y sin nadie
adelante, **es una exposición**: el bloqueo impide operar, no impide leer. Y un punto de venta y un
escritorio administrativo no corren el mismo riesgo, por eso el valor se configura.

Al vencer, **en este orden**:

1. **Se descarta lo que está en pantalla, y recién después se avisa.** Al revés —el mensaje encima
   de la pantalla todavía visible— los datos siguen ahí hasta que alguien apriete algo, y
   justamente no hay nadie. Es el orden inverso al que sale natural.
2. **Se deja de escuchar a la ventana.** Un ingreso que se complete tarde no puede revivir una
   pantalla que ya se descartó.
3. **Se recarga el documento.** Navegar a la raíz dentro de la misma aplicación **no descarta
   nada**: el estado y los cierres siguen vivos, se ve limpio y no lo está. Para la aplicación esto
   se terminó y **se pierde todo el contexto en memoria**, que es el punto.

**El plazo tiene un techo que no es nuestro**: el tiempo que el proveedor le da a un ingreso en
curso. Uno más largo esperaría por algo que del otro lado ya caducó — el operador terminaría de
escribir la contraseña y recibiría un error igual. Se confirma contra la configuración del realm;
no se da por sabido.

Con varias pestañas de la misma aplicación, todas muestran el aviso y **basta con entrar en una**:
las demás lo detectan con la comprobación silenciosa de la decisión CU-8, sin abrir cada una su propia
ventana.

**Si el navegador la bloquea** —una política de empresa, una extensión— se cae a la redirección
de página completa y **se pierde lo cargado, avisando antes**. Es raro y es visible, y no justifica
construir la maquinaria de borradores para cubrirlo.

**Y una cosa hace falta igual, con emergente o sin ella**: volver a la pantalla donde estabas
después de un ingreso por redirección. El flujo devuelve al `redirect_uri` registrado, no a la URL
que estabas mirando. Se resuelve con el parámetro `state` de OIDC, que ya se usa por CSRF. No es un
costo de esta decisión — la sesión se puede vencer mirando una grilla.

**Dónde vive: en el módulo de sesión** (decisión CU-10). La espera se dibuja **por encima** de la
pantalla y no adentro, así que la promesa se mantiene: ninguna pantalla sabe que esto existe, y no
hay nada que cada formulario tenga que implementar.

### CU-10 · La autenticación entra por una puerta; hoy es Keycloak

**Estado**: decidida · **Depende de**: CU-14

**Keycloak es lo que se usa hoy, no una propiedad del diseño.** Se puede cambiar por otro
proveedor sin tocar el resto del código.

No hace falta inventar una abstracción, y conviene no hacerlo: **la puerta ya existe y es un
estándar.** El contrato del backend declara `openIdConnect` apuntando al documento de
descubrimiento —a propósito, para no replicar los endpoints y crear una segunda fuente de verdad—
y el flujo es código de autorización con **PKCE sin secreto**. Eso lo hablan Auth0, Entra, Okta,
Zitadel y Cognito igual que Keycloak. Una interfaz propia habría que diseñarla, mantenerla y
justificarla; ésta ya está escrita.

Lo que agrega cuarzo son cuatro reglas:

- **El emisor es configuración, no código.** Ya se lo trata así: el propio contrato avisa que
  `sso.datasync.local` es un nombre interno y que publicar hacia afuera cambia el hostname.
- **Nada fuera del módulo de sesión nombra al proveedor.** Ni un `import`, ni una URL, ni la forma
  de un claim, ni la palabra Keycloak en un comentario.
- **La puerta autoriza el pedido; no entrega un token.** Si entregara un token, cada lugar que lo
  pide ya estaría suponiendo que la autenticación es un *bearer* — que es una suposición sobre el
  proveedor, justo la que se quiere no tener. Un proveedor que mañana use cookie de sesión, mTLS o
  DPoP no debería mover una sola pantalla. **Qué expone exactamente depende de la decisión CU-14**, que
  está abierta.
- **La traducción de claims a capacidades la pone la aplicación.** No es generosidad: por el
  principio III cuarzo no puede conocer `ctacte-panel` ni `receipts:write`.

  **Pero son dos cosas, y conviene no pegarlas**: *extraer* los roles del token —
  `resource_access.<client>.roles`, que es forma de Keycloak porque OIDC estándar no tiene claim de
  roles— e *interpretar* qué significan acá.

  La primera es **idéntica en las cuatro aplicaciones** y vive en una entrada adaptadora,
  `@cuarzo/session/keycloak`, que se pide por su nombre igual que la falsa. La segunda es de cada
  aplicación y se compone encima.

  Pegadas, cambiar de proveedor era **editar lógica en el manifiesto de las cuatro** — y eso volvía
  incobrable la promesa de `TAN-2`. Separadas, es **cambiar un import**.

**Cómo se sostiene: dos pruebas, y hacen falta las dos.**

1. Que **la superficie principal no nombre a ningún proveedor**, y que una **entrada adaptadora
   nombre exactamente uno: el que dice su nombre de archivo**. Se mira el texto entero, comentarios
   incluidos — un comentario que lo nombra es la misma fuga con otra letra.
2. Que la sesión **corra contra una segunda implementación**.

La segunda es la que importa, y la lección es de granito: mover un valor a la configuración no
prueba nada si nadie verifica que **cambiarlo de verdad cambie la salida**. Se puede leer la
configuración una sola vez al cargar el módulo y que todo siga andando exactamente igual.

Esa segunda implementación es **la falsa que usan las pruebas**, y sale gratis porque hace falta
igual. Es lo que evita la trampa del primer consumidor sin tener que esperar a un segundo proveedor
real: con una sola implementación no se ve qué es general.

### CU-11 · Una sola autenticación, un token por aplicación

**Estado**: decidida

**Un realm compartido** —`siempre`— para todos los sistemas de la organización. Un realm es un
límite de usuarios, no de aplicaciones: separarlos daría una cuenta por sistema y ningún SSO.
Entrar una vez habilita las demás aplicaciones, **siempre que se tenga la autorización
correspondiente**.

**Un dominio, con la aplicación como prefijo**: `ctacte.siempre.com.ar`,
`fidelizacion.siempre.com.ar`, y el proveedor en el mismo sitio. De ahí salen cuatro consecuencias
que no son opcionales:

- **Mismo sitio, orígenes distintos.** Los subdominios comparten dominio registrable —lo que hace
  posible la decisión CU-8— pero son orígenes separados: no hay `localStorage` ni `sessionStorage`
  compartido. Juega a favor.
- **Los tokens no se comparten entre aplicaciones.** Cada una tiene su client, su token y sus
  roles; un token de otro sistema **no trae** la clave de ésta, y ese aislamiento sale gratis de la
  estructura del token. Un almacén de tokens compartido lo tiraría a la basura, y parecería una
  optimización.
- **Nada de la sesión se guarda en el dominio padre.** Una cookie puesta en `.siempre.com.ar` la
  ven las cuatro aplicaciones. Es la única forma de filtrar algo entre ellas con este esquema.
- **Existe el estado «entró, y no tiene acceso a esta aplicación».** El flujo OIDC termina bien y
  no hay ninguna capacidad. **No es «no estás logueado»**, y tratarlo como si lo fuera es un bucle
  infinito: al login, el login funciona, volvés sin roles, otra vez al login. Es una pantalla
  propia y **tiene prohibido redirigir al proveedor**. Con una sola aplicación este estado casi no
  existe; con varias y un realm compartido es lo normal, porque la mayoría va a tener acceso a
  algunas y no a todas.

### CU-12 · Salir de una es salir de todas

**Estado**: decidida · **Depende de**: CU-8

Cerrar sesión termina la sesión del realm, y hay que volver a entrar en la que se quiera usar.

**Las otras pestañas abiertas no se enteran en el momento**: siguen con su token de acceso hasta
que venza. Lo detecta **la misma comprobación silenciosa que renueva** — vuelve «no hay sesión» y
la aplicación se cierra sola. No hace falta ningún mecanismo aparte: sale del que ya existe por la
decisión CU-8.

Y es esto lo que hace necesaria la decisión CU-9: si salir de una aplicación tira las otras,
quedarse sin sesión con un formulario a medio cargar pasa todos los días. Demasiado seguido para
que la salida sea perder lo tecleado.

### CU-13 · Una acción puede pedir la autorización de otra persona

**Estado**: decidida · **Depende de**: CU-3, CU-18 *(abierta)*

Hay operaciones que el operador **no puede ejecutar y sí puede pedir**: llama a un supervisor, el
supervisor autoriza **esa operación**, y la pantalla sigue siendo la del operador.

Eso no cabe en la decisión CU-3, que tiene dos estados. Hacen falta tres:

| | |
|---|---|
| **no podés, nunca** | no se muestra — la decisión CU-3 queda intacta |
| **podés** | se muestra normal |
| **podés con autorización de otro** | se muestra, y **declara qué le falta** |

**El tercero no es un botón gris.** La decisión CU-3 rechaza el botón apagado porque «le hace creer
que le falta algo»; acá **sí le falta algo y tiene nombre**. Y si no se mostrara, el operador no
tendría forma de saber que existe un camino: escondiéndolo se pierde la operación entera, no un
botón.

Lo que esta decisión fija:

- **Se autoriza una operación, no una persona.** El operador no gana la capacidad: queda autorizado
  un acto sobre un registro. **Sin ventana de tiempo** — si hacen falta dos, se pide dos veces. Es
  lo único auditable, y lo único que no se puede abusar: el patrón de «el supervisor autoriza y se
  va» termina en diez anulaciones hechas a nombre del operador.
- **La sesión no cambia.** El operador sigue siendo el operador y su token sigue siendo el suyo. Lo
  que aporta el supervisor es una prueba de un solo uso, que no se guarda en ningún lado.
- **Sin respaldo del servidor, no se muestra.** Una pantalla que desbloquee el botón y mande la
  llamada con el token del operador recibe un `403`: la autorización tiene que ser **verificable
  por la API**. Mientras la API no la acepte, la acción vuelve al primer estado y no se muestra.
  **Es preferible que falte a que mienta.**

Lo que **no** fija: cómo se obtiene esa prueba y cómo viaja. Está abierto —CU-18— y depende de
una contraparte que no controlamos.

Y qué acción necesita autorización de quién es **negocio de cada aplicación** (principio III):
cuarzo sabe que el estado existe; cuáles son, no.

---

## Lo que falta decidir

### CU-18 · Cómo viaja una autorización por excepción

**Estado**: abierta · **Depende de**: CU-13

Qué prueba produce el supervisor de la decisión CU-13, cómo llega a la API y cómo la valida.

**Depende de una contraparte que no es nuestra.** El contrato de `las-animas/backend` declara
`x-required-roles` en 84 operaciones, todas verificadas contra los roles de **un** token, y no
define ningún encabezado por donde pueda viajar una segunda autorización — los únicos que declara
son `Idempotency-Key`, `If-Match` e `If-None-Match`. Sin eso del otro lado no hay nada que
construir de éste.

**Y hay una trampa anotada acá para que nadie la pise**: el supervisor **no se puede autenticar por
la puerta de la decisión CU-9**. El proveedor ya tiene la cookie de sesión del operador, así que el
flujo se completa solo y devuelve **el token del operador**, sin pedirle credenciales a nadie —
parece que funcionó, y autorizó con el permiso que justamente faltaba. Forzar credenciales con
`prompt=login` corrige eso y abre algo peor: reemplaza la sesión del navegador por la del
supervisor y, por la decisión CU-12, **cierra la sesión del operador en todas las aplicaciones**.

Sea cual sea la salida, tiene que producir una autorización **de un solo uso y sin crear sesión de
navegador**. La sesión compartida del navegador es el vehículo equivocado, y lo es por culpa de las
decisiones CU-11 y CU-12.
