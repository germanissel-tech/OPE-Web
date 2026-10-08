import { Failure, operation } from '@ope/core'
import { type DemoClient, demoService } from './client'
import { contractRequires, type OperationId } from './roles'

/**
 * La clave que recibe el que hace la llamada.
 *
 * **`string` si el contrato la exige, `undefined` si no.** Sale de lo generado,
 * así que una operación que la pide no se puede escribir ignorándola: no
 * compila. Es lo que `CU-34` pide — la pantalla no elige.
 */
type KeyOf<Id extends OperationId> = (typeof contractRequires)[Id]['idempotent'] extends true
  ? string
  : undefined

/**
 * La entrada que recibe el que hace la llamada, **con el testigo si el contrato
 * lo exige** (`CU-29`).
 *
 * Es la misma costura que `KeyOf`, del otro lado: ahí la clave la pone la
 * puerta, y acá el testigo lo trae la pantalla — es quien leyó el registro y
 * quien lo tiene en `meta.version`.
 *
 * Por eso viaja en la entrada: **una escritura sobre un recurso versionado sin
 * el testigo no compila**, y el que la escribe se entera acá y no cuando el
 * servidor la rechace con `412`.
 */
type NeedsVersion<Id extends OperationId> = (typeof contractRequires)[Id]['versioned'] extends true
  ? { readonly version: string }
  : unknown

/**
 * Una operación de `demo`, **con lo que el contrato le exige** (`CU-37`, `CU-34`).
 *
 * Existe para que nadie lo escriba: los roles y la clave salen de `roles.ts`,
 * que se genera del contrato. Y el identificador está tipado contra lo que el
 * contrato declara, así que **un typo no compila** — que es la otra mitad,
 * porque un identificador que no existe daría una lista de roles vacía y el
 * botón se dibujaría para cualquiera.
 *
 * **Recibe el servicio, no lo busca.** Por eso una acción se declara en el
 * módulo como una pantalla: acá sólo se nombra contra qué habla, y quién lo
 * cumple lo resuelve la puerta al ejecutar (`CU-36`).
 */
export function demoOperation<Id extends OperationId, Input extends NeedsVersion<Id>, Output>(
  id: Id,
  run: (demo: DemoClient, input: Input, idempotencyKey: KeyOf<Id>) => Promise<Output>,
) {
  const requires = contractRequires[id]

  return operation<DemoClient, Input, Output>(id, demoService, requires, (demo, input, key) => {
    /* La clave la pone la puerta. Si el contrato la exige y no llegó, es un
       defecto nuestro y **se ve acá**: mandar la llamada sin ella la haría
       fallar en el servidor, lejos de la causa. */
    if (requires.idempotent && key === undefined) {
      throw new Failure(
        'wiring.missingIdempotencyKey',
        `La operación "${id}" exige clave de idempotencia y no llegó ninguna.`,
      )
    }

    return run(demo, input, key as KeyOf<Id>)
  })
}
