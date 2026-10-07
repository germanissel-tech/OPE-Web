import { createContext, type ReactNode, useContext } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Failure } from '../base/failure'
import type { FlowState } from '../base/flow-state'
import { toClose, toOpen } from '../base/flow-state'
import type { Screen } from '../base/registry'
import {
  applyMove,
  enterAt,
  type FlowContextData,
  type FlowNavigator,
  requiredFor,
  stateAt,
} from './dispatch-flow'

/**
 * **En qué flujo estás y qué escalones tenés abajo** (`CU-47`).
 *
 * **No guarda nada.** Lee el estado de la entrada del historial donde estamos y
 * envuelve `navigate`. Cualquier copia en un `useState` o en un contexto propio
 * **se desincroniza con el botón «atrás»** —el navegador retrocede y la copia
 * sigue creyendo lo anterior—, y ese defecto no aparece hasta que alguien usa
 * el navegador como navegador.
 *
 * Por eso esto es una lectura, no un almacén.
 */

export type FlowWiring = FlowContextData

const FlowContext = createContext<FlowWiring | null>(null)

export function FlowProvider({
  value,
  children,
}: {
  readonly value: FlowWiring
  readonly children: ReactNode
}) {
  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>
}

/** Lo que una pantalla puede hacer con su flujo. */
export type FlowPort = {
  /** Desapila uno. Con un solo escalón, cae a la raíz de la funcionalidad. */
  readonly close: () => void
  /**
   * **Lo que usa el marco para llevar a una pantalla, apilándola** (`CU-47`).
   *
   * El menú de usuario lleva a **algo tuyo** —las preferencias, «Acerca de»—,
   * no a otro trabajo: apila sobre el flujo activo, y cerrar devuelve a donde
   * estabas. El menú lateral hace lo otro, y ésa es la única diferencia.
   *
   * **No es para una pantalla.** El marco conoce el registro entero (`CU-23`) y
   * está afuera de la regla; una pantalla informa un desenlace.
   */
  readonly visit: (screen: Screen) => void
  /**
   * **Abandona el flujo actual y empieza aquél por su raíz** (`CU-47`).
   *
   * Es lo que hace el menú lateral, y el único punto —con un paso que nombra
   * otro flujo— donde se sale de uno sin cerrarlo ni terminarlo. Por eso es
   * también donde el aviso de trabajo sin guardar tiene que aparecer.
   *
   * **No es para una pantalla**, por lo mismo que `visit`.
   */
  readonly enter: (flow: string) => void
  /**
   * En qué flujo estamos y con qué pila. Se lee; no se escribe.
   *
   * **Puede no haber**: el marco también se dibuja sobre una URL que ninguna
   * pantalla declara, y ahí no hay dónde estar. Una pantalla nunca ve eso —si
   * se está dibujando, su ruta coincidió—, pero el marco sí.
   */
  readonly state: FlowState | undefined
  /**
   * Qué capacidad exige llegar a donde ese desenlace lleva (`CU-3`).
   *
   * Se le pregunta al flujo porque la pantalla ya no nombra el destino — y eso
   * es lo que deja que la misma grilla exija cosas distintas en flujos
   * distintos.
   */
  readonly toReach: (outcome: { readonly id: string }) => { readonly requires: readonly string[] }
}

export function useFlow(): FlowPort {
  const wiring = useContext(FlowContext)
  if (!wiring) {
    throw new Failure(
      'wiring.outsideProvider',
      'useFlow() fuera de FlowProvider. Los flujos los provee la raíz de composición.',
    )
  }

  const location = useLocation()
  const navigate = useNavigate()

  const state = stateAt(location.pathname, location.state, wiring)

  /**
   * Lo que sólo tiene sentido parado en una pantalla.
   *
   * Falla en vez de inventar una pila vacía: con una, `close` cae a la raíz de
   * un flujo que no existe y `toReach` contesta «no exige nada», que dibuja un
   * control que lleva a ningún lado.
   */
  const standing = (): FlowState => {
    if (state) return state
    throw new Failure(
      'navigation.unknownFlow',
      `No hay flujo en "${location.pathname}": ninguna pantalla declara esa ruta.`,
    )
  }

  const navigator: FlowNavigator = {
    back: (steps) => {
      void navigate(-steps)
    },
    visit: (url, next, replace) => {
      void navigate(url, { state: next, replace })
    },
  }

  return {
    state,
    toReach: (outcome) => requiredFor(outcome.id, standing(), wiring),
    visit: (screen) => {
      /* Sin flujo activo se **entra** al de la pantalla destino: apilar sobre
         uno que no existe es lo que escribía un flujo vacío en el historial. */
      if (!state) {
        enterAt(screen, wiring, navigator)
        return
      }
      applyMove(toOpen(state, { screen: screen.id, params: {} }), wiring, navigator)
    },
    /* El mismo movimiento que produce un paso que nombra otro flujo, y por eso
       no hay regla nueva acá: `applyMove` ya sabe entrar por la raíz con la
       pila de uno. Dos formas de entrar a un flujo se despegarían. */
    enter: (flow) => {
      applyMove({ kind: 'root', flow }, wiring, navigator)
    },
    close: () => {
      const here = standing()
      const flow = wiring.flows.find((each) => each.id === here.flow)

      if (!flow) {
        throw new Failure(
          'navigation.unknownFlow',
          `No existe el flujo "${here.flow}", así que no hay raíz a la que cerrar.`,
        )
      }

      applyMove(toClose(here, flow.root.id), wiring, navigator)
    },
  }
}
