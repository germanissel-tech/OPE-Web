# Especificación · El esqueleto

**Carpeta**: `002-el-esqueleto` · **Estado**: borrador · **Fecha**: 2026-08-21

**Pedido**: la aplicación base de cuarzo, que corre y no sabe de ningún negocio, y de la que se
clona cada aplicación de frontend de Tandilia.

## Qué resuelve *(obligatoria)*

**Que cuarzo cumpla su propio criterio: que se pueda levantar** (CU-20).

Y son **dos cosas a la vez**, por CU-40: **`@cuarzo/core`**, que es la conducta que se publica y se
actualiza con `npm update`; y **la forma** —seis archivos y dos carpetas— que se copia y después es
de cada aplicación. Las dos entran en esta especificación, porque sin ninguna de las dos hay nada que
levantar.

Hoy es documentos. Cuando esté, arranca, resuelve la sesión, dibuja el marco con su navegación, y
muestra una pantalla con sus cuatro estados — **sin red interna**.

Y que empezar una aplicación sea **clonar**, no juntar treinta y cinco decisiones de cero.

## Quién la consume *(obligatoria)*

**Quien arranca una aplicación de Tandilia**, clonando. Y **el agente que la construye después**,
que hereda las reglas porque viajan con el clon.

Lo que agrega esa persona son tres cosas: **las pantallas, los servicios que hablan con su backend, y
las reglas de su negocio**. Nada más.

## Qué NO hace *(obligatoria)*

- **No trae pantallas de negocio.** Sólo **dos de ejemplo** —una grilla y un formulario— que
  existen para ejercitar el esqueleto de punta a punta **y viajan en el clon** como ejemplo.
- **No incluye el adaptador de OIDC.** Eso es `001-la-sesion`, y entra en un segundo tramo contra el
  proveedor local de `TAN-2`. Acá se usa la implementación falsa, que por CU-17 es el modo de
  desarrollo.
- **No reimplementa nada de granito.** El marco, los controles y los estados visuales son de allá
  (principio IV). Acá se decide **cuándo** se usan.
- **No trae skills.** CU-21 está abierta, y una skill escrita antes de que exista una pantalla
  replica la forma equivocada en cuatro aplicaciones.
- **No sabe de ningún negocio** (principio III), ni de ningún backend en particular.
- **No incluye `@cuarzo/session`**, que es `001`. El núcleo lo consume como cualquier aplicación.

## De qué decisiones depende *(obligatoria)*

| decisión | qué aporta |
|---|---|
| **CU-20** · **CU-40** | Qué es cuarzo, el criterio de que está listo, y qué se publica contra qué se copia |
| **CU-36** | La raíz de composición: lee, valida, construye, ensambla |
| **CU-15** · **CU-16** · **CU-17** | La estructura, las herramientas, la configuración al arrancar |
| **CU-23** | La declaración de una pantalla, y la navegación tipada |
| **CU-24** | Los cuatro estados, dibujados por el marco |
| **CU-25** · **CU-37** | La puerta de acciones, y cómo un botón la ejecuta |
| **CU-26** | Los tres contextos, y cuánto vive cada uno |
| **CU-27** | La barra de usuario |
| **CU-30** | Qué se ve cuando una pantalla revienta |
| **CU-35** | El puerto de registro |
| **CU-1** · **CU-2** · **CU-3** · **CU-4** | El marco, la pantalla que declara, los permisos, los estados |
| **CU-14** · **CU-34** · **CU-38** | Cómo se piden los datos, la clave de idempotencia, la validación |
| **001-la-sesion** | La sesión, **con la falsa** |

**Abiertas que la bloquean**: **ninguna.** Las cuatro que quedan —CU-18, CU-19, CU-21 y CU-28—
esperan a otros y ninguna es necesaria para levantar.

## Escenarios *(obligatoria)*

1. **Se levanta** → arranca, resuelve la sesión contra la falsa, y dibuja el marco: marca,
   navegación, y la barra de usuario con su nombre y su salida.
2. **La navegación sale de las pantallas declaradas** → nadie escribe un menú. Se declara una
   pantalla y aparece su entrada.
3. **Se cambian las capacidades en caliente** → el menú se recorta, y **una sección sin ninguna
   pantalla visible desaparece**.
4. **Se escribe a mano la URL de una pantalla sin la capacidad** → **no deja entrar**. Filtrar el
   menú no alcanza.
5. **La pantalla de grilla pide datos al simulado** → muestra cargando, después los datos, con su
   filtro y su paginado del servidor.
6. **No hay ningún registro** → el vacío dice «no hay nada todavía» y ofrece crear.
7. **Los filtros no dan resultados** → dice otra cosa, y ofrece **limpiar los filtros**. Son dos
   vacíos distintos.
8. **El simulado devuelve un error** → se ve el error **con el identificador del pedido**, y el
   filtro y las acciones **siguen usables** — el error tapa la región, no la pantalla.
9. **Se navega de la grilla al formulario** → con el identificador como parámetro, **tipado**: el
   parámetro equivocado no compila (CU-23).
10. **Se da de alta desde el formulario y sale bien** → aviso flotante, y **la grilla se refresca**
    porque la acción declaró qué invalida (CU-25).
11. **El simulado rechaza el alta con errores de campo** → los mensajes van **a los campos que los
    pidieron**, no a un cartel suelto.
12. **Se intenta guardar con las reglas de forma sin cumplir** → se marca **al salir del campo o al
    intentar guardar**, nunca mientras se escribe por primera vez (CU-38).
13. **Una pantalla revienta** → se reemplaza sola, **el marco sobrevive**, y hay un identificador
    para mencionar y una salida.
14. **Se recarga parado en una pantalla** → vuelve a esa pantalla, no a la de inicio.
15. **Falta un valor obligatorio de configuración** → **no arranca, y dice cuál falta**.
16. **Se clona, se borra `packages/` y `specs/`, y se arranca** → **anda, y muestra las dos pantallas
    de ejemplo funcionando**, resolviendo `@cuarzo/core` y `@cuarzo/session` desde el registro en vez
    de la carpeta de al lado.

    **Las pantallas de ejemplo no se borran al clonar.** Son el ejemplo del que se copia la primera
    pantalla propia, y borrarlas el primer día es tirar la mejor documentación justo cuando más
    sirve. Sacarlas es un paso posterior, documentado, que la aplicación hace cuando ya tiene las
    suyas.

    Es lo único que prueba de verdad la promesa de CU-20 — y con las pantallas adentro **verifica una
    aplicación, no una cáscara que levanta**.
17. **Se publica una corrección del núcleo y la aplicación hace `npm update`** → **la recibe sin
    tocar nada**. Es la otra mitad de la promesa: no sólo empezar es barato, **mantenerse al día
    también**.

## Lo que puede salir mal *(obligatoria)*

- **El archivo de configuración no llega o está mal formado.** No arranca, y lo dice — no sigue con
  valores por omisión hasta fallar en el primer pedido.
- **El simulado no está levantado.** Se ve como cualquier error de red, con su identificador. No es
  un caso especial.
- **Dos pantallas declaran la misma ruta.** Tiene que fallar al construir, no elegir una en silencio.
- **Una pantalla declarada sin componente**, o un parámetro de ruta que no coincide. **No compila**.
- **El clon arrastra lo que no debería** —`specs/`, `packages/`, el `feature.json` apuntando a otra
  cosa—. Es lo que hace que la aplicación nueva arranque con la especificación de otro.

## Cómo se verifica *(obligatoria)*

| garantía | qué comprueba |
|---|---|
| **No compila** | Que **una pantalla no pueda obtener un token** (CU-10); que una navegación con el parámetro equivocado falle (CU-23); que no haya `any` (CU-15) |
| **Lo agarra una prueba** | Que **la dirección de las dependencias se respete**: si una pantalla importa de `api/`, falla. Es lo que Biome no puede vigilar (CU-16) |
| **Lo agarra una prueba** | Que **el clon arranque y funcione**: se copia, se borra lo que hay que borrar, se instala, se levanta, y **las dos pantallas de ejemplo andan** |
| **Lo agarra una prueba** | Que la implementación falsa **no esté en el artefacto de producción** (CU-36) |
| **Se hereda** | Que el clon traiga `CLAUDE.md`, `.specify/` y la comprobación de decisiones — el estándar viaja solo |
| **Lo mira una persona** | Que el marco componga bien, y que los textos digan lo que tienen que decir |

**La tercera es la que importa.** Las demás verifican piezas; **ésa verifica la promesa** — que
empezar una aplicación sea clonar. Sin ella, el esqueleto puede estar impecable y no servir para lo
único que existe.

## Biblioteca o esqueleto

**Las dos cosas, y CU-40 dice cuál es cuál.**

**Por copia**: la forma —las carpetas, el ruteo, la raíz de composición, la configuración de
compilación—. Es un punto de partida y diverge legítimamente; una biblioteca que impusiera para
siempre los nombres de las carpetas sería una molestia, no una garantía.

**Por paquete**: la conducta, en `@cuarzo/core`. Un defecto en el componente de los cuatro estados
o en la puerta de acciones **tiene que llegarles a las cuatro aplicaciones**, y copiado se arregla
cuatro veces.

Y la sesión, en `@cuarzo/session`, que ya está resuelto en `001`.

## Supuestos

- **Que granito alcanza para el marco.** `AppShell`, `NavList`, `Page`, `Table`, `Dialog` y
  `NotificationHost` cubren lo que el esqueleto necesita, y la demo lo muestra armado. Si faltara
  algo, es una propuesta a granito y no código de acá.
- **Que la pantalla de ejemplo puede ser genérica.** Tiene que ejercitar los cuatro estados y el
  error sin saber de negocio: lo más probable es una grilla contra un catálogo del simulado.
- **Que el simulado del backend sirve para todo esto.** Prism responde del contrato, así que da
  datos, vacíos y errores.

## Lo que queda abierto

- **Cuál es la pantalla de ejemplo** exactamente, y si es una o dos. Se cierra al planificar.
- **Si el ritual de clonar se automatiza**, que es CU-21 y espera a que exista la primera aplicación
  para saber cuántos pasos tiene de verdad.
- **Qué entradas propias puede agregar una aplicación al centro de la barra**, que es CU-28 y espera
  un caso real. La declaración de pantalla deja la puerta.

## Aclaraciones

### Sesión 2026-08-21

- **P**: ¿Qué del esqueleto se publica y qué se copia?
  **R**: La **conducta** se publica y la **forma** se copia — CU-40, que precisa CU-20 pieza por
  pieza. Dos paquetes, `@cuarzo/session` y `@cuarzo/core`, y adentro del núcleo tres categorías con
  límites verificados.

  La pregunta de fondo era **cómo se usa cuarzo**: crear una aplicación tiene que ser barato **y** las
  mejoras posteriores tienen que poder llegar. Eso descarta la copia pura, porque un molde no propaga
  nada. Y como la forma es lo único que no se actualiza solo, **la forma tiene que ser delgada**.

- **P**: ¿Cuál es la pantalla de ejemplo?
  **R**: **Dos pantallas**: una grilla contra un catálogo del simulado, y un formulario de alta.
  Separadas, no una con la otra adentro.

  Una grilla sola ejercitaría **la mitad** de lo construido: los cuatro estados, el vacío partido en
  dos, el error con su identificador. **Ninguna escritura** — y del otro lado quedan la puerta de
  acciones, la invalidación, la clave de idempotencia y las tres capas de validación.

  Y separadas ejercitan además **la navegación tipada entre pantallas**, que con una sola quedaría
  sin probar. Respeta CU-1: una pantalla a la vez, sin apilar.

- **P**: ¿Qué pasa con las dos pantallas de ejemplo al clonar?
  **R**: **El clon las conserva.** Borrarlas es un paso posterior que la aplicación hace cuando ya
  tiene pantallas propias.

  Por dos razones: son **el ejemplo del que se copia la primera pantalla de verdad**, y sin ellas la
  prueba del clon —la que verifica la promesa— pasaría a comprobar que levanta con el menú vacío, que
  es mucho menos.
