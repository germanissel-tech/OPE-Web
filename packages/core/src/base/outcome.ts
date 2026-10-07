/**
 * **Una pantalla informa qué pasó; la aplicación decide qué sigue** (`CU-44`).
 *
 * Es lo que permite que una funcionalidad termine un flujo **sin conocer a la
 * que sigue**: `CU-15` prohíbe que una importe de otra, y sin esto un enlace
 * entre dominios —de una factura a la persona que la debe— no se podía escribir.
 *
 * La pantalla emite `articleChosen`; **a dónde lleva eso lo dice el flujo**
 * activo (`CU-47`), y el mapa entero se lee en `app/flows.ts`.
 */

/**
 * Lo que un desenlace puede llevar: **plano y de primitivos**.
 *
 * Es `CU-26` —«se guardan identificadores, no datos»— convertido en algo que el
 * compilador verifica. Una entidad entera no compila, y eso es deliberado: lo
 * que viaja tiene que poder terminar en una URL, o el flujo se rompe cuando
 * alguien recarga o pega un enlace.
 *
 * Un paquete grande —el borrador de un wizard, lo que junta una saga— **no va
 * acá**: va a su propio lugar, y lo que viaja es su identificador, que es un
 * primitivo. Esta restricción es lo que deja eso posible en vez de tapar la
 * necesidad con la opción cómoda.
 */
export type Payload = Readonly<Record<string, string | number | boolean>>

/** Lo que viaja: qué pasó, y con qué datos. */
export type OutcomeEvent = {
  readonly id: string
  readonly payload: Payload
}

/**
 * Un desenlace declarado.
 *
 * **Es invocable**, y no por gusto: es la única forma de que el tipo del dato
 * viaje sin inventar un campo que no existe al correr. Acá `P` viaja por el
 * parámetro de una función de verdad.
 */
export type Outcome<P extends Payload = Payload> = ((payload: P) => OutcomeEvent) & {
  readonly id: string
}

/**
 * El mismo, sin el tipo del dato, para poder juntarlos en una lista.
 *
 * `never` en la posición del parámetro es lo que hace que cualquier desenlace
 * entre: un parámetro más chico acepta más llamadores, no menos.
 */
export type AnyOutcome = Outcome<never>

/**
 * Declara un desenlace.
 *
 * **El nombre dice qué pasó, no a dónde ir.** `issued`, no `goToInvoice`: si se
 * nombra por el destino, esto es `goTo` con una escala en el medio y la
 * funcionalidad volvió a conocer a la que sigue.
 */
export function outcome<P extends Payload>(id: string): Outcome<P> {
  const create = (payload: P): OutcomeEvent => ({ id, payload })
  return Object.assign(create, { id })
}
