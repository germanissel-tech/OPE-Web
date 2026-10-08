import { defineAction } from '@ope/core'
import type { Merchant } from '../../../api/ope/client'
import { opeOperation } from '../../../api/ope/operations'
import { merchantsStrings } from '../strings'
import { allMerchants, oneMerchant } from './merchants'

/**
 * Desactivar un merchant para siempre — **y el ejemplo de una acción de fila**
 * (`CU-46`).
 *
 * Es terminal (`ADR-031` del backend): no hay vuelta ni borrado, y repetirla
 * no cambia nada (`200` otra vez). Un segundo intento sobre uno ya
 * desactivado responde `409 merchant-deactivated` en las operaciones que lo
 * exigen activo —no en ésta—, y ese `409` es un rechazo del negocio, no una
 * falla: la puerta lo muestra como tal (`CU-25`).
 *
 * Lo que la distingue del alta: se ejecuta **una vez por fila**, y lo que
 * invalida incluye la ficha de esa fila, que cambia de estado.
 */
export const deactivateMerchant = defineAction({
  id: 'merchant.deactivate',

  operations: {
    deactivate: opeOperation('deactivateMerchant', (ope, merchantId: string) =>
      ope.deactivateMerchant(merchantId),
    ),
  },

  /* Recibe **el merchant entero** y no su identificador: es lo que la fila
     tiene, y lo que el aviso nombra sale de lo que volvió. */
  run: (merchant: Merchant, ops) => ops.deactivate.run(merchant.merchantId),

  /* Lo que pasó lo dice **lo que volvió**, no lo que se pidió. */
  announces: (updated) => ({
    title: merchantsStrings.merchantDeactivated,
    description: merchantsStrings.merchantDeactivatedDetail(updated.merchantId),
  }),

  invalidates: (merchant) => [allMerchants, oneMerchant(merchant.merchantId)],
})
