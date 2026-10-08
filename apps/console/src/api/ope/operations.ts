import { operation } from '@ope/core'
import { OPERATIONS, type OperationId } from '../../../../../contracts/ope/capabilities'
import { type OpeClient, opeService } from './client'

/**
 * Una operación de `ope`, **con lo que el contrato le exige** (`CU-37`, `TAN-7`).
 *
 * Existe para que nadie lo escriba: las capacidades y la idempotencia salen de
 * `contracts/ope/capabilities`, que el backend emite por consumidor. Y el
 * identificador está tipado contra ese módulo, así que **un typo no compila** —
 * que es la otra mitad, porque un identificador que no existe daría una lista
 * de capacidades vacía y el botón se dibujaría para cualquiera.
 *
 * Sin clave de idempotencia: OPE repite por cuerpo idéntico (`x-idempotency`),
 * así que la puerta no tiene nada que poner. El gemelo del hola mundo la
 * recibía; éste no.
 *
 * **Recibe el servicio, no lo busca.** Por eso una acción se declara en el
 * módulo como una pantalla: acá sólo se nombra contra qué habla, y quién lo
 * cumple lo resuelve la puerta al ejecutar (`CU-36`).
 */
export function opeOperation<Id extends OperationId, Input, Output>(
  id: Id,
  run: (ope: OpeClient, input: Input) => Promise<Output>,
) {
  return operation<OpeClient, Input, Output>(id, opeService, OPERATIONS[id], (ope, input) =>
    run(ope, input),
  )
}
