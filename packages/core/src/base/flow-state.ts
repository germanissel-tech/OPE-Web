/**
 * **La pila de un flujo, y las tres transiciones** (`CU-47`).
 *
 * Acá no hay React ni ruteador: es **aritmética sobre una lista**, y por eso
 * está en `base`. Probarla no necesita dibujar nada, que es lo que permite
 * cubrir los casos raros —los ciclos, el escalón repetido, la pila de uno—
 * antes de que exista una pantalla que los sufra.
 *
 * ## Devuelven un movimiento, no un estado
 *
 * Ninguna de las tres navega ni sabe cómo se navega. Dicen **qué hay que
 * hacer**, y quien tiene el ruteador lo hace. Si devolvieran el estado nuevo,
 * la capa de arriba tendría que deducir si eso fue apilar o retroceder —y
 * deducirlo mal es exactamente cómo el botón «atrás» se desincroniza.
 */

/**
 * Un escalón: **una pantalla con sus parámetros**.
 *
 * Los parámetros son parte de la identidad y no un adorno. Con la pantalla
 * sola, ir de un movimiento a otro movimiento desenrollaría al primero y el
 * segundo **no se vería nunca** — son la misma pantalla.
 *
 * Sólo texto, porque **el escalón se serializa y se restaura al recargar**. Es
 * `CU-26` —identificadores, no datos— dejando de ser prudencia.
 */
export type StackEntry = {
  readonly screen: string
  readonly params: Readonly<Record<string, string>>
}

/**
 * Lo que viaja en cada entrada del historial (`CU-47`).
 *
 * **El último escalón es dónde estás.** Que la pantalla actual esté adentro de
 * la pila y no al lado es lo que hace que las tres transiciones sean cuentas
 * sobre un solo arreglo.
 */
export type FlowState = {
  readonly flow: string
  readonly stack: readonly StackEntry[]
}

/**
 * Qué hacer, para quien tenga el ruteador.
 *
 * `root` nombra el flujo, no la pantalla: **cuál es su raíz lo sabe quien
 * llama**. Que esto no la conozca es a propósito — si la conociera, `base`
 * tendría que saber qué flujos hay declarados.
 */
export type Move =
  | { readonly kind: 'push'; readonly state: FlowState }
  | { readonly kind: 'replace'; readonly state: FlowState }
  | { readonly kind: 'unwind'; readonly steps: number; readonly state: FlowState }
  /**
   * Ir a la raíz de un flujo. Lo usan dos casos: **cerrar sin escalón abajo**,
   * que cae a la del flujo actual, y **un paso que nombra otro flujo**, que
   * empieza aquél por la suya.
   */
  | { readonly kind: 'root'; readonly flow: string }
  | { readonly kind: 'stay' }

/** Dos escalones son el mismo si coinciden pantalla **y** parámetros. */
function isSame(one: StackEntry, other: StackEntry): boolean {
  if (one.screen !== other.screen) return false

  const keys = Object.keys(one.params)
  if (keys.length !== Object.keys(other.params).length) return false

  return keys.every((key) => one.params[key] === other.params[key])
}

/** Dónde está ese escalón en la pila, o `-1`. */
function positionOf(stack: readonly StackEntry[], entry: StackEntry): number {
  return stack.findIndex((each) => isSame(each, entry))
}

/**
 * **Abrir**: si el destino ya está en la pila, desenrolla hasta él; si no,
 * apila.
 *
 * El primer caso es lo que hace que **la recursión no sea un caso especial**:
 * un ciclo `A → B → A` no crece, se desenrolla. Y como la identidad lleva los
 * parámetros, una cadena de datos distintos **sí** crece — que es lo correcto:
 * la pila termina siendo el camino que el operador caminó.
 */
export function toOpen(state: FlowState, entry: StackEntry): Move {
  const at = positionOf(state.stack, entry)

  if (at === -1) {
    return { kind: 'push', state: { ...state, stack: [...state.stack, entry] } }
  }

  const steps = state.stack.length - 1 - at
  if (steps === 0) return { kind: 'stay' }

  return { kind: 'unwind', steps, state: { ...state, stack: state.stack.slice(0, at + 1) } }
}

/**
 * **Terminar**: si el destino ya está en la pila, desenrolla hasta él; si no,
 * **reemplaza** el escalón actual.
 *
 * La diferencia con abrir es una sola celda, y es la que importa: cuando
 * terminaste, **el escalón donde estabas dejó de tener sentido**. Si apilara,
 * cerrar desde el comprobante devolvería al formulario de cobro que se acaba de
 * enviar — que es el caso con el que `GR-36` argumentó contra la pila entera.
 */
export function toFinish(state: FlowState, entry: StackEntry): Move {
  const at = positionOf(state.stack, entry)

  if (at === -1) {
    return {
      kind: 'replace',
      state: { ...state, stack: [...state.stack.slice(0, -1), entry] },
    }
  }

  const steps = state.stack.length - 1 - at
  if (steps === 0) return { kind: 'stay' }

  return { kind: 'unwind', steps, state: { ...state, stack: state.stack.slice(0, at + 1) } }
}

/**
 * **Con qué pila se entra cuando el historial no trae ninguna** (`CU-47`).
 *
 * Pasa con un enlace pegado y con una pestaña nueva. **La pantalla actual es el
 * primer escalón, y no cero**: con cero, abrir algo desde ahí y cerrarlo no
 * devolvería a la pantalla del enlace — se perdería. Con uno, cerrar desde ella
 * cae a la raíz, y cerrar desde lo que abrió vuelve a ella.
 *
 * **Cuál es el flujo no se decide acá**: sale de la raíz de la funcionalidad de
 * esa pantalla, y eso lo sabe el registro. Esto sólo arma la pila.
 */
export function toEnter(flow: string, entry: StackEntry): FlowState {
  return { flow, stack: [entry] }
}

/**
 * **Cerrar**: desapila uno.
 *
 * Con un solo escalón no hay a dónde volver, y eso **no es un caso raro**: pasa
 * cada vez que alguien llega por un enlace pegado o abre una pestaña nueva.
 * Ahí cae a la raíz, que la resuelve quien llama.
 *
 * **Salvo que ese único escalón ya sea la raíz**, y entonces no se hace nada:
 * caer a donde ya se está apila una entrada idéntica. No se ve —la dirección no
 * cambia— pero el «atrás» siguiente tampoco hace nada visible, así que el
 * operador aprieta dos veces para salir de una pantalla. Por eso hace falta el
 * identificador de la raíz: distinguirlo de la ficha alcanzada por un enlace
 * pegado, donde cerrar **sí** tiene que llevar a algún lado.
 */
export function toClose(state: FlowState, root: string): Move {
  if (state.stack.length === 1 && state.stack[0]?.screen === root) return { kind: 'stay' }

  if (state.stack.length <= 1) return { kind: 'root', flow: state.flow }

  return {
    kind: 'unwind',
    steps: 1,
    state: { ...state, stack: state.stack.slice(0, -1) },
  }
}
