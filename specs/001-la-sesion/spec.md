# Especificación · La sesión

**Carpeta**: `001-la-sesion` · **Estado**: borrador · **Fecha**: 2026-08-20

**Pedido**: el módulo que resuelve autenticación y sesión para toda aplicación de frontend de
Tandilia.

## Qué resuelve *(obligatoria)*

**Que ninguna aplicación de Tandilia implemente su propia sesión.**

Toda aplicación necesita entrar, mantenerse adentro y salir. Si eso se resuelve en cada una hay
cuatro implementaciones de lo mismo, y un defecto se arregla cuatro veces — o tres, y la cuarta se
olvida.

Es **la única pieza que va a la biblioteca antes de tener dos consumidores**, y no por comodidad:
todas las aplicaciones autentican contra el mismo proveedor de identidad, y eso es evidencia y no
suposición. Ver el principio VI.

## Quién la consume *(obligatoria)*

**Las aplicaciones, por biblioteca.** Quien arranca una aplicación la instala, la configura **una
vez al arrancar** —el emisor, el cliente, el plazo de espera, **dónde vive el token** y **el cierre por
inactividad**— y no la
vuelve a tocar.

**Ninguna pantalla la importa.** Una pantalla no sabe que existe: pide datos y andan, o no andan y
alguien ya se ocupó.

## Qué NO hace *(obligatoria)*

- **No sabe qué permite hacer un rol.** Entrega lo que el token trae; traducir eso a capacidades es
  de cada aplicación (principio III). No conoce el vocabulario de ningún negocio.
- **No sabe de ningún backend.** No conoce endpoints, ni contratos, ni qué es una liquidación.
- **No dibuja nada propio.** El diálogo del aviso y el bloqueo de la espera son componentes de
  granito (principio IV). Acá se decide **cuándo** se muestran, no cómo se ven.
- **No incluye la autorización por excepción del supervisor.** CU-13 está decidida, pero depende de
  CU-18, que está abierta. Va en su propia especificación, y por eso ésta no la vuelve a mencionar.
- **No ofrece `localStorage` para el token.** El conjunto de estrategias es cerrado —memoria y
  `sessionStorage`— porque `localStorage` sobrevive a cerrar el navegador, en una máquina que puede
  ser compartida, y nada de lo visto lo justifica.
- **No guarda borradores de formularios.** CU-9 lo resuelve **no descargando la página**, que es
  justamente para no tener que guardarlos.

## De qué decisiones depende *(obligatoria)*

| decisión | qué aporta |
|---|---|
| **CU-8** | El token se renueva solo y en silencio |
| **CU-9** | Si no se puede, se avisa y el reingreso pasa en una ventana aparte; la pantalla espera, con plazo |
| **CU-10** | La puerta: OIDC con PKCE, emisor configurable, autoriza el pedido y nunca entrega un token |
| **CU-11** | Un token por aplicación, nada en el dominio padre, y el estado «entró sin acceso a ésta» |
| **CU-12** | Salir de una es salir de todas |
| **CU-14** | Con qué se piden los datos, y dónde enganchan el autorizador y el reintento |
| **CU-1** | Lo que se abre sobre una pantalla es un diálogo |
| **CU-4** | Los cuatro estados, y que el error muestre el identificador del pedido |

**Abiertas que la bloquean**: **ninguna.** CU-18 está abierta y toca a CU-13, que quedó fuera de
alcance a propósito.

## Escenarios *(obligatoria)*

1. **No hay sesión y se abre la aplicación** → se va al proveedor, se vuelve, y se aterriza **en la
   pantalla que se pedía**, no en la de inicio.

   Mientras se resuelve **no se dibuja nada**, y sólo si tarda más que el umbral aparece un
   indicador. Por debajo del umbral el operador no ve nada raro; mostrarle algo sería el flash gris
   que granito ya descartó. **El marco no se pinta antes de resolver**: la barra lleva el nombre del
   usuario y la navegación depende de sus permisos, así que pintarla vacía sería mostrar un hueco y
   rellenarlo delante de los ojos.
2. **Hay sesión del proveedor porque se entró en otra aplicación** → el flujo termina sin pedir
   credenciales. Eso es el SSO, y **no lo hace este módulo**: lo hace el realm compartido.
3. **Se recarga la página** → por omisión el token vive **sólo en memoria**, así que se rehace la
   comprobación silenciosa: termina sola, sin credenciales y —por debajo del umbral— sin que se vea. Una aplicación puede
   configurar `sessionStorage` y saltearse ese viaje, a cambio de que el token quede al alcance de
   la propia página.
4. **La sesión está por vencer** → se renueva en segundo plano. El operador no se entera, y ningún
   pedido en curso falla.
5. **La renovación no se puede** → se avisa con un diálogo cuyo botón abre el reingreso en una
   ventana aparte. La pantalla queda **bloqueada y visible**, y lo cargado sigue en memoria.
6. **Vuelve bien, y es la misma persona** → se cierra el bloqueo y se sigue operando donde se
   estaba.
7. **Vuelve bien, y es otra persona** → no se sigue: es una sesión nueva y la pantalla se recarga.
8. **Pasan dos minutos sin que vuelva** → se descarta lo que está en pantalla, se deja de escuchar a
   la ventana, y se recarga el documento. Para la aplicación esto terminó.
9. **La ventana se cierra sin entrar** → vuelve el aviso con su botón. No se queda esperando.
10. **Entró y no tiene ninguna capacidad en esta aplicación** → pantalla propia que lo dice. **No
   redirige al proveedor**: hacerlo es un bucle infinito.
11. **Se cierra sesión** → termina la sesión del realm, y hay que volver a entrar en la que se
    quiera usar.
12. **Nadie toca la aplicación durante el tiempo configurado** → se cierra sola. **Apagado por
    omisión**: un escritorio administrativo no lo necesita y un mostrador compartido sí. Al vencer
    se descarta lo que está en pantalla **antes** de avisar, igual que con el plazo de la espera y
    por la misma razón: el aviso no puede quedar encima de datos que nadie está mirando.
13. **Otra aplicación cerró sesión** → **no se consulta al proveedor sólo para enterarse**. Lo
    descubre el próximo pedido, con un `401`, o la próxima renovación, que ya corre igual. La
    ventana es la vida del token, y quien está mirando una pantalla sin pedir nada se entera apenas
    intente algo. Se entra por el mismo camino que «la renovación no se puede».

    Las aplicaciones **no pueden avisarse entre ellas**: están en subdominios distintos, o sea
    orígenes distintos, y ni un canal entre pestañas ni los eventos de almacenamiento lo cruzan.
14. **Un pedido vuelve con `401`** → se intenta renovar. Si sale, **la lectura se repite sola** y la
    pantalla se rearma; **la escritura no**, y vuelve el botón para que lo apriete el operador.

## Lo que puede salir mal *(obligatoria)*

- **El navegador bloquea la ventana** —política de empresa, una extensión—: se cae a redirección de
  página completa y **se pierde lo cargado, avisando antes**.
- **El proveedor no responde.** Desde acá es indistinguible de «la sesión se venció», y se trata
  igual, y por el mismo camino que «la renovación no se puede».
- **El emisor está mal configurado.** Tiene que fallar **al arrancar y diciéndolo**, no en el primer
  pedido y con un `401` que manda a buscar el problema donde no está.
- **Un reingreso llega tarde**, después del plazo: no revive nada, porque ya no se lo escucha.
- **Varias pestañas** pierden la sesión a la vez. Basta con entrar en una; las demás lo detectan
  solas y no abren cada una su ventana.
- **El reloj del cliente está desfasado.** La vigencia se decide con lo que dice el proveedor y no
  con la hora local: una máquina atrasada renovaría tarde, y una adelantada, todo el tiempo.

## Cómo se verifica *(obligatoria)*

| garantía | qué comprueba |
|---|---|
| **Lo agarra una prueba** | Que **nada fuera del módulo nombre al proveedor**: ni un `import`, ni una URL, ni la forma de un claim, ni la palabra en un comentario |
| **Lo agarra una prueba** | Que la sesión **corra contra una segunda implementación**, la falsa de las pruebas |
| **Lo agarra una prueba** | Que **el camino de falla se ejerza**: renovación imposible, ventana bloqueada, ventana cerrada, plazo vencido y persona distinta |
| **Lo agarra una prueba** | Que los valores por omisión sean los que se dicen —**token en memoria, cierre por inactividad apagado**— y que **cambiarlos de verdad cambie la conducta** |
| **No compila** | Que **una pantalla no pueda obtener un token**, porque la puerta no expone ninguno |
| **Se hereda** | Que la configuración al arrancar venga puesta en el esqueleto, y no haya que acordarse |
| **Lo mira una persona** | Que por debajo del umbral no aparezca ningún indicador: es lo que ninguna prueba automática juzga bien. Y los textos del diálogo y de la pantalla de «no tenés acceso» |

La segunda es la que importa y la que más se saltea. La lección es de granito: **mover un valor a
la configuración no prueba nada si nadie verifica que cambiarlo cambie la salida.**

Y la tercera existe porque ese camino **casi nunca se ejerce solo**, y lo que se ejerce poco se
rompe sin que nadie lo note.

## Biblioteca o esqueleto

**Biblioteca**, y se publica **desde cuarzo** (CU-20). La prueba del principio V da «sí» sin
discusión: si se arregla un defecto de sesión, tiene que llegarles a todas, y copiada se arreglaría
cuatro veces.

Lo que sí va **por esqueleto** es la llamada de configuración al arrancar, que es un punto de
partida y diverge legítimamente — cada aplicación tiene su cliente y puede tener su plazo.

## Supuestos

- **Que el proveedor se comporta bien dentro de una ventana emergente.** Con OIDC estándar y el
  mismo sitio es rutina, pero es una afirmación y no un hecho verificado: le corresponde una prueba
  antes de construir sobre ella.
- **Que el emisor y las aplicaciones comparten dominio registrable** (CU-11). Sin eso CU-8 se cae, y
  esta especificación cambia de raíz.
- **Que la aplicación consume un solo backend.** CU-22 decide que puede consumir varios y que cada
  llamada lleva el token de su destino; **esta especificación está escrita para uno**. Extenderla es
  hacer que la puerta sepa a qué sistema va el pedido — no cambia nada de lo demás, pero hoy no
  está especificado.
- **Que el realm es uno solo para todos los sistemas**, que es lo que hace que entrar en una
  aplicación habilite las demás sin que este módulo haga nada.

## Lo que queda abierto

- **Qué expone exactamente el autorizador.** Depende de la forma final de la capa de CU-14, y se
  cierra al planificar.
- **El plazo por omisión son dos minutos, pero el techo no es nuestro**: tiene que quedar por debajo
  del que el proveedor le da a un ingreso en curso. Se confirma contra la configuración del realm.
- **Qué cuenta como actividad** para el cierre por inactividad: el teclado y el ratón del operador
  seguro; si un pedido en vuelo o una descarga larga cuentan, no está decidido.
- **Cómo se engancha la renovación**: por temporizador propio o por un evento del proveedor. No
  cambia cada cuánto corre —eso lo fija la vida del token— ni lo que el operador ve.

## Aclaraciones

### Sesión 2026-08-20

- **P**: Al recargar la página, ¿de dónde sale la sesión?
  **R**: Es configurable por aplicación, con **memoria por omisión**. La única alternativa ofrecida
  es `sessionStorage`; `localStorage` queda afuera a propósito.

  Se ofrecen dos y no una porque **con una sola el punto de configuración no se ejerce nunca**, y no
  habría cómo verificar que la costura es real — que es lo que este repositorio ya aprendió con la
  configuración de granito.

  **No es un feature flag**: es un valor que la aplicación fija al arrancar. Cambiar dónde vive un
  token en caliente no significa nada.

- **P**: ¿La aplicación se cierra sola por inactividad, además de lo que haga el proveedor?
  **R**: Sí, **configurable por aplicación y apagado por omisión**.

  No alcanza con apoyarse en el proveedor: la sesión del realm se mantiene viva con la actividad de
  **cualquier** aplicación, así que alguien trabajando en el panel mantiene abierto el punto de
  venta del mostrador indefinidamente.

- **P**: Mientras la sesión se resuelve al abrir o recargar, ¿qué se muestra?
  **R**: **Nada**, y sólo pasado el umbral un indicador. Se usa `useDelayedFlag` de granito, que ya
  existe con esa razón escrita.

  El marco no se pinta antes de resolver, porque lleva el nombre del usuario y una navegación que
  depende de sus permisos.

- **P**: ¿Hace falta consultar al proveedor más seguido de lo que la renovación ya exige, sólo para
  detectar una salida ajena?
  **R**: **No.** Un `401` lo descubre en el acto y la renovación lo descubre igual; una consulta
  periódica extra sería tráfico constante por cada pestaña de cada aplicación para un caso que casi
  nunca ocurre.
