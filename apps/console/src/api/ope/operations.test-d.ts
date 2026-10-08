/**
 * **La prueba de que `CU-37` se sostiene contra el contrato de OPE: el typo no
 * compila.**
 *
 * No necesita corredor de pruebas. La verifica `tsc`, que ya corre: cada
 * `@ts-expect-error` **falla si el error que espera no ocurre**, así que este
 * archivo pasa a rojo tanto si el tipado se afloja como si alguien lo rompe.
 *
 * Vive al lado de lo que prueba y no en `packages/`: lo que se verifica depende
 * de `contracts/ope/capabilities`, el módulo del consumidor de **esta**
 * aplicación. El núcleo no sabe qué es `merchants:read` (`TAN-7`).
 */

import type { ContractModule, OperationRequirement } from '@ope/core'
import * as admin from '../../../../../contracts/ope/capabilities'
import { opeOperation } from './operations'

/* Lo que TIENE que compilar: una operación del contrato, por su identificador. */
opeOperation('listMerchants', (ope, query: { readonly limit?: number }) => ope.listMerchants(query))

// @ts-expect-error — `listMerchant` no es una operación del contrato
opeOperation('listMerchant', async () => undefined)

/* El módulo tiene la forma que el frontend publica (`contract-artifact.md`). */
const shaped: ContractModule<typeof admin.OPERATIONS, admin.Capability> = admin
void shaped

/* Y una exigencia escrita contra el vocabulario no admite un typo. */
const fine: OperationRequirement<admin.Capability> = {
  capabilities: ['merchants:read'],
  idempotent: false,
}
void fine

const typo: OperationRequirement<admin.Capability> = {
  // @ts-expect-error — `merchants:reed` no está en el vocabulario del consumidor admin
  capabilities: ['merchants:reed'],
  idempotent: false,
}
void typo
