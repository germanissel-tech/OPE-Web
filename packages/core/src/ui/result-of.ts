import type { TableEmpty, TableState } from '@granito/ui'
import type { Strings } from '../base/strings'
import { RequestFailed } from '../data/envelope'
import type { QueryLike, ResultState } from './result'

/**
 * **Los cuatro estados de una grilla, resueltos como props** (`CU-24`).
 *
 * Es la otra forma de `<Result>`: aquél **envuelve** una región cualquiera;
 * éste **resuelve** las props que `Table` ya sabe dibujar.
 *
 * Para una grilla es lo que corresponde, por dos razones:
 *
 * - **granito ya dibuja los cuatro adentro de la tabla**, y mejor: esqueleto de
 *   filas al cargar, y el vacío con el identificador en mono y botón de copiar.
 *   Envolverla es redibujar lo que ya está resuelto (principio IV).
 * - **La barra de filtros y la grilla se sueldan si son hermanas.** Cualquier
 *   envoltorio rompe esa relación, y con ella el tratamiento que granito
 *   diseñó.
 *
 * La pantalla sigue sin decidir nada: declara qué dice cada vacío y esparce.
 *
 * **Y la recarga avisa sin vaciar** (`granito#PED-8`): `state='loading'` con
 * filas las atenúa y pone la pastilla; sin filas, dibuja el esqueleto. Es la
 * misma prop para las dos esperas, y lo decide el dato — no hay forma de
 * declarar «recargando» con la lista vacía, que no significa nada.
 */

export type GridStates = {
  /** No hay ninguno todavía. La salida es crear el primero. */
  readonly empty: ResultState
  /** Hay, pero el filtro no da. La salida es limpiarlo. */
  readonly noMatches: ResultState
  /**
   * Si hay un filtro puesto. Es lo único que distingue los dos vacíos.
   *
   * **Obligatorio, y por eso no tiene omisión** (`CU-24`): declarar los dos
   * vacíos y olvidar esto daba una grilla que nunca dice «el filtro no da»,
   * sin que nada fallara. Un vacío partido en dos que en la práctica es uno
   * es peor que uno solo, porque nadie lo va a revisar.
   */
  readonly filtered: boolean
}

export type GridResult<T> = {
  readonly rows: T[]
  readonly state: TableState
  readonly empty: TableEmpty
  readonly noResults: TableEmpty
  readonly error: TableEmpty
}

/**
 * Lo que una grilla necesita de su consulta: los cuatro campos de `QueryLike`
 * y **las filas ya aplanadas**. Una colección por cursor las acumula tramo a
 * tramo (`useCollection`); una lista entera las trae de una. A la grilla le da
 * igual, y por eso se pide así.
 */
export type GridQuery<T> = QueryLike<unknown> & {
  readonly items: readonly T[]
}

export function resultOf<T>(
  query: GridQuery<T>,
  states: GridStates,
  strings: Strings,
): GridResult<T> {
  const rows = [...query.items]
  const failed = query.error instanceof RequestFailed ? query.error : undefined

  return {
    rows,
    state: stateOf(query, rows.length, states.filtered),
    empty: asTableEmpty(states.empty),
    noResults: asTableEmpty(states.noMatches),
    error: {
      title: strings.loadFailed,
      description: failed ? failed.message : String(query.error ?? ''),
      /**
       * **El identificador del pedido, hasta la pantalla** (`CU-4`, `CU-25`).
       *
       * granito lo dibuja en mono y con botón de copiar, porque uno que hay que
       * transcribir a mano se transcribe mal. Y **cuando no vino, no se dibuja**:
       * granito recibe `undefined` y no muestra el botón de copiar nada. OPE lo
       * agrega en su feature 040; hasta entonces es lo que hay.
       */
      requestId: failed?.requestId,
    },
  }
}

function stateOf(query: QueryLike<unknown>, rows: number, filtered: boolean): TableState {
  if (query.error !== undefined && query.error !== null) return 'error'

  /* Una sola espera para los dos casos: sin filas es el esqueleto, con filas
     es el atenuado y la pastilla. Lo decide granito con lo que recibe. */
  if (query.isPending || query.isFetching || query.data === undefined) return 'loading'

  if (rows > 0) return 'ready'
  return filtered ? 'no-results' : 'empty'
}

function asTableEmpty(state: ResultState): TableEmpty {
  return { title: state.title, description: state.description, action: state.action }
}
