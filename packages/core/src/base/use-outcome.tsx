import { createContext, type ReactNode, useContext } from 'react'
import { Failure } from './failure'
import type { OutcomeEvent } from './outcome'

/**
 * Cómo una pantalla informa qué pasó (`CU-44`).
 *
 * Es un puerto que se **recibe**, igual que la navegación: quien lo cumple es
 * la raíz de composición, que es la única que conoce la política. Una pantalla
 * llama `emit` y **no sabe que existe el ruteo**.
 */
export type OutcomePort = {
  readonly emit: (event: OutcomeEvent) => void
}

const OutcomeContext = createContext<OutcomePort | null>(null)

export function OutcomeProvider({
  value,
  children,
}: {
  readonly value: OutcomePort
  readonly children: ReactNode
}) {
  return <OutcomeContext.Provider value={value}>{children}</OutcomeContext.Provider>
}

export function useOutcome(): OutcomePort {
  const port = useContext(OutcomeContext)
  if (!port) {
    throw new Failure(
      'wiring.outsideProvider',
      'useOutcome() fuera de OutcomeProvider. La política la provee la raíz.',
    )
  }
  return port
}
