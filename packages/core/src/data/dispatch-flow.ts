import { Failure } from '../base/failure'
import type { Flow, Step } from '../base/flow'
import {
  type FlowState,
  type Move,
  type StackEntry,
  toClose,
  toEnter,
  toFinish,
  toOpen,
} from '../base/flow-state'
import { buildUrl } from '../base/go-to'
import { FLOW_KEY, flowStateIn, hereFrom } from '../base/here'
import type { OutcomeEvent, Payload } from '../base/outcome'
import type { Reachable, Screen } from '../base/registry'

/**
 * **Qué pasa cuando una pantalla informa un desenlace** (`CU-47`).
 *
 * Reemplaza a `composeRouting`: en vez de una arista suelta por desenlace, se
 * busca **el paso del flujo activo**. Ahí está lo que `CU-44` no podía escribir
 * — el mismo desenlace terminando en lugares distintos según el flujo.
 *
 * Corre fuera de React, con el ruteador de verdad: por eso recibe un navegador
 * en vez de usar `useNavigate`.
 */

/** Lo mínimo que hace falta para moverse, sin nombrar al ruteador. */
export type FlowNavigator = {
  /** Retroceder `steps` entradas del historial, de una sola vez. */
  readonly back: (steps: number) => void
  /** Ir a una URL, apilando o reemplazando la entrada actual. */
  readonly visit: (url: string, state: unknown, replace: boolean) => void
}

export type FlowContextData = {
  readonly flows: readonly Flow[]
  readonly featureRootOf: Readonly<Record<string, string>>
  readonly screens: readonly Screen[]
}

/** El flujo activo: el que dice el estado, o el de la raíz de esta pantalla. */
export function activeFlow(state: FlowState, data: FlowContextData): Flow | undefined {
  return data.flows.find((each) => each.id === state.flow)
}

/**
 * **Ejecuta el movimiento que `base` calculó.**
 *
 * Es la única parte que sabe navegar, y por eso las tres transiciones se
 * pudieron probar sin dibujar nada.
 */
export function applyMove(move: Move, data: FlowContextData, navigator: FlowNavigator): void {
  if (move.kind === 'stay') return

  if (move.kind === 'unwind') {
    /* **De una sola vez**: de a uno, el operador vería pasar las pantallas
       intermedias. El estado de la entrada a la que se llega ya es el correcto,
       así que no hay nada que escribir. */
    navigator.back(move.steps)
    return
  }

  if (move.kind === 'root') {
    const root = data.flows.find((each) => each.id === move.flow)?.root
    /* **Nada de retornos silenciosos acá.** Un despachador que no falla y no
       hace nada es indistinguible de un botón roto, y el arranque ya verificó
       que estos tres casos no puedan pasar: si pasan, es un defecto del marco. */
    if (!root) {
      throw new Failure('navigation.unknownOutcome', `No existe el flujo "${move.flow}".`)
    }
    const entry: StackEntry = { screen: root.id, params: {} }
    navigator.visit(root.path, { [FLOW_KEY]: toEnter(move.flow, entry) }, false)
    return
  }

  const top = move.state.stack.at(-1)
  const screen = top && data.screens.find((each) => each.id === top.screen)
  if (!top || !screen) {
    throw new Failure(
      'navigation.unknownOutcome',
      `El movimiento lleva a "${top?.screen ?? 'ninguna pantalla'}", que no está registrada.`,
    )
  }

  navigator.visit(
    buildUrl(screen, top.params as never),
    { [FLOW_KEY]: move.state },
    move.kind === 'replace',
  )
}

/** El paso que ese flujo declara para ese desenlace. */
export function stepFor(flow: Flow, outcome: string): Step | undefined {
  return flow.steps.find((each) => each.outcome === outcome)
}

/**
 * De un desenlace al movimiento, según el paso que el flujo activo declare.
 *
 * **Un desenlace sin paso no navega en silencio**: falla nombrando el flujo y
 * el desenlace, que es lo que hace falta para arreglarlo.
 */
export function moveFor(event: OutcomeEvent, state: FlowState, data: FlowContextData): Move {
  const flow = activeFlow(state, data)
  if (!flow) {
    throw new Failure(
      'navigation.unknownOutcome',
      `No hay flujo activo para "${event.id}": el estado dice "${state.flow}".`,
    )
  }

  const step = stepFor(flow, event.id)
  if (!step) {
    throw new Failure(
      'navigation.unknownOutcome',
      `El flujo "${flow.id}" no dice qué sigue después de "${event.id}".`,
    )
  }

  /* **Informar algo que este flujo omite es un defecto, no una navegación.**
     El control no debería haberse dibujado; que llegue acá significa que alguien
     lo dibujó por su cuenta. */
  if (step.verb === 'omit') {
    throw new Failure(
      'navigation.unknownOutcome',
      `El flujo "${flow.id}" omite "${event.id}": esa acción no se ofrece acá, y algo la informó igual.`,
    )
  }

  if (step.verb === 'close') return toClose(state, flow.root.id)

  /* **Nombrar un flujo abandona el actual y empieza aquél por su raíz.** Es el
     cruce de contexto, y el único punto —con el menú— donde se sale de un flujo
     sin cerrarlo ni terminarlo. */
  if (step.destination?.kind === 'flow') {
    const target = step.destination.flow()
    return { kind: 'root', flow: target.id }
  }

  const destination = step.destination?.screen ?? flow.root
  const params = step.toParams ? step.toParams(event.payload as Payload) : {}

  const entry: StackEntry = { screen: destination.id, params }
  return step.verb === 'open' ? toOpen(state, entry) : toFinish(state, entry)
}

/**
 * **El estado del flujo en esa URL**, venga del historial o no (`CU-47`).
 *
 * Lo llaman los dos lados —el gancho de una pantalla y el despacho, que corre
 * fuera de React— y por eso vive acá: dos versiones de esto se despegan en el
 * primer caso raro, y el caso raro es el que más pasa, que es el enlace pegado.
 */
export function stateAt(
  pathname: string,
  stored: unknown,
  data: FlowContextData,
): FlowState | undefined {
  const fromHistory = flowStateIn(stored)
  if (fromHistory) return fromHistory

  const here = hereFrom(data.screens, pathname)
  if (!here) return undefined

  /* Sin estado: el flujo es el que arranca en la raíz de la funcionalidad de
     esta pantalla, y la pila arranca con ella. */
  return toEnter(flowFor(here.entry.screen, data).id, here.entry)
}

/**
 * **En qué flujo empieza el recorrido de esa pantalla** (`CU-47`).
 *
 * Es lo que contesta el enlace pegado: se llega sin estado, y hace falta saber
 * dónde arranca lo que esa pantalla integra.
 *
 * **Falla en vez de devolver un flujo vacío.** Un identificador que no nombra a
 * ninguno se escribe en la entrada del historial y sobrevive al F5: a partir de
 * ahí cada desenlace revienta lejos de acá, y el mensaje no alcanza a decir por
 * qué. Las comprobaciones 5 y 6 del arranque hacen esto imposible; el guardia
 * está para que, si igual pasa, nombre la causa.
 */
function flowFor(screen: string, data: FlowContextData): Flow {
  const root = data.featureRootOf[screen]
  const flow = data.flows.find((each) => each.root.id === root)

  if (!flow) {
    throw new Failure(
      'navigation.unknownFlow',
      `No hay flujo para "${screen}": su funcionalidad arranca en "${root}", y ningún flujo lo hace.`,
    )
  }

  return flow
}

/**
 * **Llevar a una pantalla sin flujo activo**, que pasa en un solo lugar: el
 * marco lleva a algo suyo —«Acerca de», las preferencias— desde una URL que
 * ninguna pantalla declara.
 *
 * Se **entra** al flujo de esa pantalla en vez de apilar sobre el actual,
 * porque no hay actual sobre el cual apilar.
 */
export function enterAt(screen: Screen, data: FlowContextData, navigator: FlowNavigator): void {
  const entry: StackEntry = { screen: screen.id, params: {} }

  navigator.visit(
    buildUrl(screen, {} as never),
    { [FLOW_KEY]: toEnter(flowFor(screen.id, data).id, entry) },
    false,
  )
}

/**
 * **Qué capacidad hace falta para llegar a donde ese desenlace lleva** (`CU-3`).
 *
 * Una pantalla no nombra su destino, así que **se lo pregunta al flujo**. Eso
 * es lo que permite que la misma grilla exija capacidades distintas en flujos
 * distintos: con el destino escrito adentro de la pantalla, la capacidad sería
 * una sola.
 *
 * Un desenlace sin paso, o que cierra, no exige nada: no hay destino.
 */
export function requiredFor(outcome: string, state: FlowState, data: FlowContextData): Reachable {
  const flow = activeFlow(state, data)

  /* Los tres casos van por separado a propósito. Juntos en un `return
     { requires: [] }` decían todos «no exige nada», que **dibuja el control** —
     así que un flujo sin declarar y un cierre legítimo se veían igual, y el
     defecto aparecía recién al hacer clic. */
  if (!flow) {
    throw new Failure(
      'navigation.unknownOutcome',
      `No hay flujo activo para preguntar por "${outcome}": el estado dice "${state.flow}".`,
    )
  }

  const step = stepFor(flow, outcome)
  if (!step) {
    throw new Failure(
      'navigation.unknownOutcome',
      `El flujo "${flow.id}" no dice qué hace con "${outcome}". Poné un paso, u \`omits\` si acá esa acción no se ofrece.`,
    )
  }

  /* Omitido: no se ofrece. El control no se dibuja, y no es una cuestión de
     permisos — con todas las capacidades del mundo sigue sin estar. */
  if (step.verb === 'omit') return { requires: [], offered: false }

  /* Sin destino —cerrar— no hay a dónde llegar, así que no exige nada. */
  if (!step.destination) return { requires: [] }

  const screen =
    step.destination.kind === 'screen' ? step.destination.screen : step.destination.flow().root

  return { requires: screen.capability === undefined ? [] : [screen.capability] }
}
