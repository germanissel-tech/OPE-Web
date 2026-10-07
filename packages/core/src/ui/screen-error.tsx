import { Button, StateMessage } from '@granito/ui'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import type { Strings } from '../base/strings'
import { type TelemetryRecorder, useTelemetry } from '../base/telemetry'
import { useStrings } from '../base/use-strings'

/**
 * **Cuando una pantalla revienta, el marco sobrevive** (`CU-30`).
 *
 * Se reemplaza **la pantalla y nada más**: la navegación sigue ahí, así que el
 * operador puede irse a otro lado. Tapar todo le sacaría justo el control que
 * necesita, y sin navegación la única salida sería recargar a mano — que mucha
 * gente no va a intentar.
 *
 * **Tampoco sólo la región que falló**, aunque sería simétrico con `CU-24`. Una
 * carga que falla deja el resto sano; un error de programación deja el árbol en
 * estado desconocido, y mantener viva la mitad de al lado es apostar a que está
 * bien. Una pantalla que miente es peor que una que falta.
 *
 * **Es una clase, y la única del repositorio.** El porqué está en `CU-30`.
 */

type Failure = {
  /** El que se le muestra al operador, y el mismo que va al registro. */
  readonly id: string
  readonly error: unknown
}

type Props = {
  readonly screen: string
  readonly telemetry: TelemetryRecorder
  readonly strings: Strings
  readonly children: ReactNode
}

type State = {
  readonly failure: Failure | undefined
  /**
   * Cambia al reintentar, y con eso React **remonta la pantalla de cero**.
   *
   * No se restaura el estado que quedó roto: es justamente el que no se puede
   * dar por bueno.
   */
  readonly attempt: number
}

class ScreenErrorBoundary extends Component<Props, State> {
  override state: State = { failure: undefined, attempt: 0 }

  static getDerivedStateFromError(error: unknown): Partial<State> {
    /* No hay `requestId` porque no hubo pedido, así que se genera uno propio.
       Es lo mismo que `CU-4` resuelve con el del pedido: sin algo que
       mencionar, «no anda» no se puede encontrar después. */
    return { failure: { id: crypto.randomUUID(), error } }
  }

  override componentDidCatch(error: unknown, info: ErrorInfo) {
    const { id } = this.state.failure ?? { id: 'sin-identificador' }

    /* **Sólo la clase y el mensaje** (`CU-35`). Ni la pila con sus propiedades
       ni el estado del componente: un error de programación suele arrastrar
       adentro lo que estaba mostrando. */
    this.props.telemetry.record({
      kind: 'screenFailed',
      id,
      screen: this.props.screen,
      /* Crudo **acá sí**: lo lee quien programa, no el operador. Lo que `CU-25`
         prohíbe es mostrárselo a él. */
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    })

    /* La pila de componentes son nombres, no datos, y es lo que ubica el
       archivo. Va a la consola y **no al registro**. */
    if (import.meta.env.DEV) console.error(info.componentStack)
  }

  override render() {
    const { failure, attempt } = this.state
    const { strings, children } = this.props

    if (!failure) return <div key={attempt}>{children}</div>

    return (
      <StateMessage
        kind="error"
        title={strings.screenFailed}
        description={strings.screenFailedDetail}
        /* granito lo dibuja en mono y con botón de copiar: uno que hay que
           transcribir a mano de una pantalla se transcribe mal. */
        requestId={failure.id}
        action={
          <Button
            tone="primary"
            onClick={() => this.setState({ failure: undefined, attempt: attempt + 1 })}
          >
            {strings.retry}
          </Button>
        }
      />
    )
  }
}

/**
 * Lo que se usa. Existe porque **una clase no puede pedir nada por contexto**, y
 * los textos y el registro se reciben (`CU-36`).
 */
export function ScreenError({
  screen,
  children,
}: {
  readonly screen: string
  readonly children: ReactNode
}) {
  return (
    <ScreenErrorBoundary screen={screen} telemetry={useTelemetry()} strings={useStrings()}>
      {children}
    </ScreenErrorBoundary>
  )
}
