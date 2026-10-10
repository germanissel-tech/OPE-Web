/**
 * **Una falla del marco dice qué clase de falla es** (`CU-45`).
 *
 * Se distingue por el **código**, no por el texto. Por qué —y qué se rompió
 * cuando dependía del texto— está en `CU-45`.
 */

/**
 * Qué salió mal, y **cuándo**.
 *
 * La lista es corta a propósito: son las clases de falla que el marco puede
 * producir, no un catálogo de mensajes. Si hace falta una nueva, se agrega acá
 * y **todo lo que la trate exhaustivamente deja de compilar** hasta contemplarla.
 */
export type FailureCode =
  /* Al declarar — lo agarra el arranque, antes de dibujar nada */
  | 'declaration.duplicateScreenPath'
  | 'declaration.duplicateMenuEntry'
  | 'declaration.duplicateOutcome'
  /** Los flujos no cierran: alguna de las seis de `CU-47`. */
  | 'declaration.brokenFlows'
  | 'declaration.actionWithoutOperations'
  | 'declaration.duplicateOperation'
  | 'declaration.unknownContext'
  | 'declaration.unhandledEvent'
  | 'declaration.brokenTelemetry'
  /** Una duración declarada en una unidad menor que la del contrato. */
  | 'declaration.badUnit'
  /** Una restricción emitida nombra un esquema que no está entre las emitidas. */
  | 'declaration.unknownConstraint'
  /* Al leer — la respuesta no trae lo que el contrato dice que trae */
  /** Una lectura que el contrato declara con testigo llegó sin `ETag` (`CU-29`). */
  | 'response.missingWitness'
  /* Al arrancar */
  | 'startup.missingContainer'
  | 'startup.incompleteConfig'
  /* Al cablear — un puerto usado fuera de quien lo provee */
  | 'wiring.outsideProvider'
  | 'wiring.missingIdempotencyKey'
  /* Al navegar — la URL no corresponde a lo que la pantalla declaró */
  | 'navigation.missingParam'
  | 'navigation.unknownOutcome'
  /**
   * **No se puede decir en qué flujo está una pantalla** (`CU-47`).
   *
   * Las comprobaciones 5 y 6 del arranque lo vuelven imposible, así que esto no
   * debería verse nunca. Existe para que, si se ve, diga la causa en vez de
   * inventar un flujo que no existe — que es lo que hacía, y quedaba escrito en
   * el historial hasta la próxima recarga.
   */
  | 'navigation.unknownFlow'

/**
 * Lo que el marco tira.
 *
 * Sigue siendo un `Error`, así que una pila, un `console.error` y un límite de
 * error de React lo tratan como siempre. Lo que agrega es **algo estable con
 * qué distinguirlo** sin mirar el texto.
 */
export class Failure extends Error {
  constructor(
    readonly code: FailureCode,
    message: string,
  ) {
    super(message)
    this.name = 'Failure'
  }
}

/** Si una falla es del marco, y de qué clase. Para quien quiera tratarla. */
export function isFailure(error: unknown, code?: FailureCode): error is Failure {
  return error instanceof Failure && (code === undefined || error.code === code)
}
