import type { ReactNode } from 'react'
import type { AnyOutcome, Outcome, Payload } from './outcome'
import type { RouteParams, Screen } from './registry'

/**
 * **Un flujo declara un recorrido** (`CU-47`).
 *
 * Por dónde se entra —`root`— y qué pasa después de cada desenlace —`steps`—.
 * Vive en la aplicación, en `app/flows/`, y **nunca adentro de una
 * funcionalidad**: uno que cruza dos carpetas no se podría escribir en ninguna
 * (`CU-15`), y tener flujos internos allá y flujos que cruzan acá son las dos
 * formas que `CU-44` acaba de dejar de permitir.
 *
 * **No tiene lista de pantallas**, y es a propósito: un flujo es un camino, no
 * un contenedor, y **una pantalla puede estar en varios**. Qué pantallas toca se
 * lee de sus pasos.
 */

/** El destino de un paso, ya resuelto. */
export type Destination =
  | { readonly kind: 'screen'; readonly screen: Screen }
  | { readonly kind: 'flow'; readonly flow: () => Flow }

/**
 * Un paso: **un desenlace, un verbo, y a dónde**.
 *
 * El destino queda como **dato y no adentro de un handler**. Eso es lo que
 * permite preguntarle al flujo a dónde lleva un desenlace —de lo que depende el
 * filtrado por capacidad de una grilla (`CU-3`)— y verificar los destinos al
 * arrancar. Un handler se puede ejecutar; no se le puede preguntar nada.
 */
export type Step = {
  readonly outcome: string
  readonly verb: 'open' | 'finish' | 'close' | 'omit'
  readonly destination?: Destination
  readonly toParams?: (payload: Payload) => Readonly<Record<string, string>>
}

/**
 * **La raíz de un flujo no puede tener parámetros** (`CU-47`).
 *
 * No hay con qué completar su URL: `/companies/:id` como entrada de menú no
 * significa nada. La regla estaba en la pantalla —`inMenu`— y se mudó acá con
 * el menú, porque **lo que se ofrece ahora es un flujo**.
 *
 * El tipo lo exige al declararlo, en vez de que alguien lo descubra leyendo por
 * qué su flujo no aparece.
 */
type RootRule<Path extends `/${string}`> =
  Record<never, string> extends RouteParams<Path>
    ? unknown
    : { readonly root: 'La raíz de un flujo no puede tener parámetros' }

export type FlowDefinition = {
  readonly id: string
  /** Por dónde se entra. **Si el flujo va al menú, ésta es su entrada.** */
  readonly root: Screen
  /** En cualquier orden: lo que los ordena es el recorrido, no la lista. */
  readonly steps: readonly Step[]
  /** Lo que dice el menú. **Por omisión, el título de la raíz** (`CU-47`). */
  readonly label?: string
  /**
   * El del menú, y **es opcional** (`CU-48`).
   *
   * granito reserva el espacio igual, así que un menú mixto no se desalinea.
   * Forzarlo llevaría a elegir cualquiera con tal de completar, y un icono que
   * no significa nada enseña a no mirarlos.
   */
  readonly icon?: ReactNode
}

const DECLARED = Symbol('flujo declarado')

export type Flow = FlowDefinition & { readonly [DECLARED]: true }

/** Declara un flujo. Se escribe en `app/flows/<nombre>.ts`. */
export function defineFlow<const Path extends `/${string}`>(
  definition: Omit<FlowDefinition, 'root'> & { readonly root: Screen<Path> } & RootRule<Path>,
): Flow {
  return { ...definition, [DECLARED]: true }
}

/**
 * **Cómo se nombra un flujo desde otro, y por qué con una función.**
 *
 * `catalogFlow` abre `receptionFlow` y `receptionFlow` vuelve al catálogo: dos
 * módulos que se importan mutuamente. Con la constante directa, **una de las
 * dos vale `undefined`** en el momento en que se arma la otra — y eso rompe
 * lejos de la causa, con un mensaje que no la nombra.
 *
 * Es la misma trampa que la deuda de las dos formas de navegar describía entre
 * pantallas, y acá se puede evitar por construcción: **la función se
 * llama cuando hace falta, y para entonces los dos módulos ya se cargaron.**
 *
 * Un flujo que no se nombra a sí mismo puede pasarse directo; el tipo acepta
 * las dos formas y esto las normaliza.
 */
type FlowRef = Flow | (() => Flow)

const asThunk = (reference: FlowRef): (() => Flow) =>
  typeof reference === 'function' ? reference : () => reference

/**
 * Los parámetros del destino, armados desde el dato del desenlace.
 *
 * **Sin parámetros no se pasa nada; con parámetros es obligatorio** — lo decide
 * el tipo de la ruta, igual que `goTo` (`CU-41`). Un parámetro que la ruta no
 * declara no compila.
 */
type ParamsArgs<P extends Payload, Path extends `/${string}`> =
  Record<never, string> extends RouteParams<Path>
    ? [toParams?: (payload: P) => RouteParams<Path>]
    : [toParams: (payload: P) => RouteParams<Path>]

/**
 * **Abrir**: apila el destino, o desenrolla si ya está en la pila (`CU-47`).
 *
 * Nombrando un flujo en vez de una pantalla, **abandona el actual y empieza
 * aquél por su raíz** — que es el cruce de contexto del quinto caso de `GR-73`,
 * sin un concepto nuevo.
 */
export function opens<P extends Payload>(outcome: Outcome<P>, destination: FlowRef): Step
export function opens<P extends Payload, const Path extends `/${string}`>(
  outcome: Outcome<P>,
  destination: Screen<Path>,
  ...args: ParamsArgs<P, Path>
): Step
export function opens(
  outcome: AnyOutcome,
  destination: FlowRef | Screen,
  toParams?: (payload: never) => Readonly<Record<string, string>>,
): Step {
  return {
    outcome: outcome.id,
    verb: 'open',
    destination: toDestination(destination),
    toParams: toParams as Step['toParams'],
  }
}

/**
 * **Terminar**: reemplaza el escalón actual, o desenrolla si el destino ya está
 * abajo. **Sin destino, termina en la raíz del flujo.**
 *
 * La diferencia con abrir es una sola: cuando terminaste, el escalón donde
 * estabas dejó de tener sentido. Si apilara, cerrar devolvería al formulario que
 * se acaba de enviar.
 */
export function finishes<P extends Payload>(outcome: Outcome<P>): Step
export function finishes<P extends Payload, const Path extends `/${string}`>(
  outcome: Outcome<P>,
  destination: Screen<Path>,
  ...args: ParamsArgs<P, Path>
): Step
export function finishes(
  outcome: AnyOutcome,
  destination?: Screen,
  toParams?: (payload: never) => Readonly<Record<string, string>>,
): Step {
  return {
    outcome: outcome.id,
    verb: 'finish',
    destination: destination === undefined ? undefined : { kind: 'screen', screen: destination },
    toParams: toParams as Step['toParams'],
  }
}

/**
 * **Cerrar**: desapila uno. Con un solo escalón cae a la raíz de la
 * funcionalidad, que no es un caso raro — pasa con cada enlace pegado.
 */
export function closes(outcome: AnyOutcome): Step {
  return { outcome: outcome.id, verb: 'close' }
}

/**
 * **Omitir**: en este flujo esa acción no se ofrece.
 *
 * Es el cuarto verbo y el único que no navega. Por qué hace falta uno para
 * esto está en `CU-47`.
 *
 * Lo que hace, en concreto: el control **no se dibuja**, y si algo lo informa
 * igual, falla nombrando el flujo — informar algo que este flujo no ofrece es
 * un defecto, no una navegación.
 */
export function omits(outcome: AnyOutcome): Step {
  return { outcome: outcome.id, verb: 'omit' }
}

/** Una pantalla trae su marca de declarada; un flujo, la suya. */
function toDestination(destination: FlowRef | Screen): Destination {
  if (typeof destination === 'function' || DECLARED in destination) {
    return { kind: 'flow', flow: asThunk(destination as FlowRef) }
  }
  return { kind: 'screen', screen: destination }
}

/**
 * **Un grupo del menú lateral** (`CU-48`).
 *
 * Nombre, sus ítems, y opcionalmente un icono. **El grupo contiene sus flujos**,
 * y de ahí salen las tres cosas que antes quedaban implícitas: el orden es la
 * lista, el icono tiene dónde ir, y nadie nombra una cadena que pueda estar mal
 * escrita.
 *
 * **Toma flujos, no grupos.** Un segundo nivel no compila — antes de arrancar, y
 * no después. Por qué uno solo, en la decisión.
 */
export type MenuGroup = {
  readonly label: string
  readonly items: readonly Flow[]
  readonly icon?: ReactNode
}

/** Lo que el menú lateral ofrece: un flujo suelto, o un grupo. */
export type MenuEntry = Flow | MenuGroup

export function group(label: string, items: readonly Flow[], icon?: ReactNode): MenuGroup {
  return { label, items, icon }
}

/** Un grupo lleva `items`; un flujo, `root`. */
export function isGroup(entry: MenuEntry): entry is MenuGroup {
  return 'items' in entry
}
