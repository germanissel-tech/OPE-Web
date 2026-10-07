import { INITIAL_STATE, nextState, type SessionEvent } from './state'
import type { Capabilities, Claims, SessionState } from './types'

/**
 * **Dónde vive el estado de la sesión, y quién avisa que cambió.**
 *
 * Está aparte de quien lo usa porque **no depende del proveedor**: sostener el
 * estado, aplicarle un evento y avisar a los suscriptos es idéntico con una
 * sesión falsa y con una real. Lo que cambia es **qué eventos se aplican y
 * cuándo**, que es justamente lo que distingue a un adaptador de otro.
 *
 * Mezclarlo con el adaptador dejaba la misma treintena de líneas esperando ser
 * escrita de nuevo del otro lado — y dos copias de una máquina de estados
 * observable divergen en la primera corrección.
 */

export type SessionStore = {
  readonly getState: () => SessionState
  readonly subscribe: (listener: () => void) => () => void
  /**
   * Aplica un evento. **Avisa sólo si el estado cambió de verdad**: la máquina
   * ignora las transiciones que no corresponden (`state.ts`), y redibujar por
   * un evento que no hizo nada es ruido que se nota en una grilla grande.
   */
  readonly apply: (event: SessionEvent) => void
}

export function createSessionStore(toCapabilities: (claims: Claims) => Capabilities): SessionStore {
  let state: SessionState = INITIAL_STATE
  const listeners = new Set<() => void>()

  return {
    getState: () => state,

    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    apply(event) {
      const before = state
      state = nextState(state, event, toCapabilities)
      if (state === before) return
      for (const listener of listeners) listener()
    },
  }
}
