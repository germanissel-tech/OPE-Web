import type { FlowState, StackEntry } from './flow-state'
import type { Screen } from './registry'

/**
 * **Dónde estás, leído de la URL** (`CU-47`).
 *
 * Es el reverso de `buildUrl`: de `/catalog/7` y `'/catalog/:id'` salen la
 * pantalla y `{ id: '7' }`.
 *
 * Vive acá y no en la raíz de composición porque **lo necesitan los dos lados**
 * —el gancho que una pantalla usa y el despacho de desenlaces, que corre fuera
 * de React—, y dos copias de esto se despegan en el primer parámetro raro.
 */

/** La clave bajo la que viaja lo nuestro en el estado de la entrada. */
export const FLOW_KEY = 'cuarzoFlow'

/** Si esa ruta declarada describe esa URL. Los `:parametro` calzan con lo que sea. */
export function matchesPath(declared: string, actual: string): boolean {
  const a = declared.split('/')
  const b = actual.split('/')
  if (a.length !== b.length) return false
  return a.every((part, index) => part.startsWith(':') || part === b[index])
}

/**
 * Los parámetros que esa URL le da a esa ruta.
 *
 * **Se decodifican, porque `buildUrl` codifica.** Sin eso los dos lados dejan de
 * hablar el mismo idioma, y como la identidad de un escalón es pantalla **más
 * parámetros** (`CU-47`), un identificador con un espacio deja de compararse
 * consigo mismo: abrir el mismo artículo apila un duplicado —`AB%2012` contra
 * `AB 12`—, la URL no cambia, no se ve nada, y hay que cerrar dos veces.
 *
 * Un valor mal codificado —un `%` suelto, que un operador puede pegar— hace
 * reventar a `decodeURIComponent`. Se devuelve crudo: la pantalla va a decir que
 * no encontró el recurso, que es lo cierto, en vez de tumbar la aplicación.
 */
const decoded = (value: string): string => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function paramsFrom(declared: string, actual: string): Readonly<Record<string, string>> {
  const a = declared.split('/')
  const b = actual.split('/')
  const params: Record<string, string> = {}

  a.forEach((part, index) => {
    if (!part.startsWith(':')) return
    const value = b[index]
    if (value !== undefined) params[part.slice(1)] = decoded(value)
  })

  return params
}

/**
 * **La pantalla que la URL describe, y con dos que calcen gana la más
 * concreta.** `/merchants/new` calza con `/merchants/new` y con
 * `/merchants/:merchantId`; la segunda diría que se está en una ficha con
 * identificador `new`, que es una pantalla mintiendo. Menos parámetros es más
 * concreta; en empate, la que se declaró primero.
 *
 * Es lo mismo que el ruteador hace al elegir qué dibujar, y por eso tiene que
 * estar acá también: la pila y el título de la pestaña se leen de esto, no del
 * ruteador.
 */
export function screenAt(screens: readonly Screen[], pathname: string): Screen | undefined {
  const parameters = (path: string) => path.split('/').filter((part) => part.startsWith(':')).length
  let best: Screen | undefined
  let fewest = Number.POSITIVE_INFINITY
  for (const each of screens) {
    if (!matchesPath(each.path, pathname)) continue
    const count = parameters(each.path)
    if (count < fewest) {
      best = each
      fewest = count
    }
  }
  return best
}

/** El escalón que la URL describe, o nada si ninguna pantalla la declara. */
export function hereFrom(
  screens: readonly Screen[],
  pathname: string,
): { readonly entry: StackEntry; readonly screen: Screen } | undefined {
  const screen = screenAt(screens, pathname)
  if (!screen) return undefined

  return { entry: { screen: screen.id, params: paramsFrom(screen.path, pathname) }, screen }
}

/** Lo nuestro que trae la entrada del historial, si trae algo. */
export function flowStateIn(state: unknown): FlowState | undefined {
  if (typeof state !== 'object' || state === null) return undefined
  const stored = (state as Record<string, unknown>)[FLOW_KEY]
  if (typeof stored !== 'object' || stored === null) return undefined
  return stored as FlowState
}
