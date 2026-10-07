import { Busy, Button, StateMessage } from '@granito/ui'
import type { ReactNode } from 'react'
import { useStrings } from '../base/use-strings'
import { RequestFailed } from '../data/envelope'

/**
 * **Los cuatro estados los dibuja el marco, no la pantalla** (`CU-24`).
 *
 * La pantalla declara dos cosas —qué mostrar cuando hay datos, y qué decir
 * cuando no hay— y todo lo demás lo pone esto.
 *
 * Por qué lo dibuja el marco y no cada pantalla, y qué garantía se gana con
 * eso, está en `CU-24`.
 *
 * **Para una grilla no se usa esto**: una tabla dibuja sus cuatro estados sola
 * y mejor, y se le pasan con `resultOf`. Envolverla además rompería lo que
 * granito arma con la barra de filtros.
 */

/** Lo que una pantalla declara para un estado sin datos. */
export type ResultState = {
  readonly title: string
  readonly description?: ReactNode
  /** La salida. Cada estado se sale de una manera distinta, y por eso se pide. */
  readonly action?: ReactNode
}

/**
 * Lo que `Result` necesita de una consulta.
 *
 * Se declara acá en vez de importar el tipo de TanStack: es lo único que se usa,
 * y así una prueba puede pasarle un objeto de cuatro campos.
 */
export type QueryLike<T> = {
  readonly data?: T
  readonly error: unknown
  /** La primera vez, sin nada que mostrar todavía. */
  readonly isPending: boolean
  /** Cualquier ida al servidor, incluida una recarga con datos viejos en pantalla. */
  readonly isFetching: boolean
  readonly refetch: () => void
}

export type ResultProps<T> = {
  readonly query: QueryLike<T>
  /** No hay ninguno todavía. La salida es crear el primero. */
  readonly empty: ResultState
  /** Hay, pero el filtro no da. La salida es limpiar el filtro. */
  readonly noMatches: ResultState
  /**
   * Si hay un filtro puesto. **Es lo único que distingue los dos vacíos**, y lo
   * sabe la pantalla: el marco no puede deducirlo de una lista vacía.
   *
   * **Obligatorio, y por eso no tiene omisión** (`CU-24`): con una omisión, el
   * que declara los dos vacíos y olvida esto se queda sin el segundo y nada
   * falla.
   */
  readonly filtered: boolean
  /** Cuándo lo que llegó cuenta como vacío. Por omisión, una lista sin elementos. */
  readonly isEmpty?: (data: T) => boolean
  readonly children: (data: T) => ReactNode
}

export function Result<T>({
  query,
  empty,
  noMatches,
  filtered,
  isEmpty = defaultIsEmpty,
  children,
}: ResultProps<T>) {
  const strings = useStrings()

  if (query.error !== undefined && query.error !== null) {
    return <Failed error={query.error} onRetry={query.refetch} />
  }

  /**
   * **Sin datos todavía se muestra la espera; con datos viejos, se atenúan.**
   *
   * Una recarga típica es un cambio de filtro y dura menos de un segundo:
   * vaciar la pantalla en ese lapso le hace perder al operador la fila que
   * estaba leyendo. Es la misma razón que granito midió para `Busy`.
   */
  if (query.isPending || query.data === undefined) {
    return (
      <Busy busy label={strings.loading}>
        {null}
      </Busy>
    )
  }

  const data = query.data
  if (isEmpty(data)) {
    const state = filtered ? noMatches : empty
    return (
      <StateMessage
        kind={filtered ? 'no-results' : 'empty'}
        title={state.title}
        description={state.description}
        action={state.action}
      />
    )
  }

  return (
    <Busy busy={query.isFetching} label={strings.loading}>
      {children(data)}
    </Busy>
  )
}

/**
 * **El error lleva el identificador del pedido** (`CU-4`, `CU-25`).
 *
 * Es lo único que convierte «no anda» en algo diagnosticable, y el contrato ya
 * lo manda en toda respuesta: no hay que inventarlo, hay que no perderlo.
 *
 * Y **deja el filtro y las acciones usables**: se dibuja acá adentro y no
 * encima de la pantalla, porque si tapara todo le sacaría al operador justo el
 * control que necesita para corregir lo que falló (`CU-24`).
 */
function Failed({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const strings = useStrings()
  const failed = error instanceof RequestFailed ? error : undefined

  return (
    <StateMessage
      kind="error"
      title={strings.loadFailed}
      description={failed ? failed.message : String(error)}
      /* granito lo dibuja en mono y con botón de copiar: uno que hay que
         transcribir a mano de una pantalla se transcribe mal (`CU-25`). */
      requestId={failed?.requestId}
      action={<Button onClick={onRetry}>{strings.retry}</Button>}
    />
  )
}

function defaultIsEmpty(data: unknown): boolean {
  return Array.isArray(data) && data.length === 0
}
