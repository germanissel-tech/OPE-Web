import { defineAction } from '@ope/core'
import type { KillSwitch } from '../../../api/ope/client'
import { opeOperation } from '../../../api/ope/operations'
import { merchantsStrings } from '../strings'
import { merchantLog } from './merchant-log'
import { allMerchants, oneMerchant } from './merchants'

export type KillSwitchInput = {
  readonly merchantId: string
  readonly enabled: boolean
}

/**
 * Apagar o encender OPE para un merchant (01 §14.2).
 *
 * Sin despliegue y efectivo en el pedido siguiente: apagado, toda decisión del
 * merchant es `NO_OP`, el SDK sigue recibiendo respuestas válidas y la medición
 * no se corta. Idempotente por estado (pedir el que ya tiene es `200`); sobre
 * un desactivado no hay interruptor (`409 merchant-deactivated`), y ese `409`
 * es un rechazo del negocio, no una falla (`CU-25`).
 *
 * **Lo que pasó lo dice lo que volvió**: el estado del interruptor como quedó.
 */
export const setKillSwitch = defineAction({
  id: 'merchant.setKillSwitch',

  operations: {
    set: opeOperation(
      'setKillSwitch',
      (ope, input: KillSwitchInput): Promise<KillSwitch> =>
        ope.setKillSwitch(input.merchantId, { enabled: input.enabled }),
    ),
  },

  run: (input: KillSwitchInput, ops) => ops.set.run(input),

  announces: (state, input) => ({
    title: state.enabled
      ? merchantsStrings.switchedOn(input.merchantId)
      : merchantsStrings.switchedOff(input.merchantId),
  }),

  /* El estado cambia en la ficha y en la grilla, y queda en el registro. */
  invalidates: (input) => [
    allMerchants,
    oneMerchant(input.merchantId),
    merchantLog(input.merchantId),
  ],
})
