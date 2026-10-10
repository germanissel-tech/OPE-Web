import { defineAction } from '@ope/core'
import type { Merchant, MerchantProfileInput } from '../../../api/ope/client'
import { opeOperation } from '../../../api/ope/operations'
import { merchantsStrings } from '../strings'
import { merchantLog } from './merchant-log'
import { allMerchants, oneMerchant } from './merchants'

export type UpdateProfileInput = {
  readonly merchantId: string
  readonly body: MerchantProfileInput
  /** El testigo de lo que se leyó al abrir, o de la relectura tras un choque (`CU-29`). */
  readonly witness: string
}

/**
 * Reemplazar la identidad de un merchant, **entera** (`ADR-045`): lo que no va,
 * se borra. No toca orígenes, estado ni credenciales, que tienen sus acciones.
 * Un `422 invalid-merchant-profile` cae en su campo; `403` fuera del alcance.
 *
 * **El aviso dice el nombre y nunca el contacto**: el contacto es una persona
 * identificada que se muestra en la ficha, a quien la pide, y en ningún otro
 * lado (constitución VII 1.5.1 del backend).
 */
export const updateMerchantProfile = defineAction({
  id: 'merchant.updateProfile',

  operations: {
    update: opeOperation(
      'updateMerchantProfile',
      (ope, input: UpdateProfileInput): Promise<Merchant> =>
        ope.updateMerchantProfile(input.merchantId, input.body, input.witness),
    ),
  },

  run: (input: UpdateProfileInput, ops) => ops.update.run(input),

  announces: (merchant) => ({
    title: merchantsStrings.identitySaved,
    description: merchantsStrings.identitySavedDetail(merchant.displayName ?? merchant.merchantId),
  }),

  /* El nombre cambia en la grilla y en la ficha, y la edición queda en el registro. */
  invalidates: (input) => [
    allMerchants,
    oneMerchant(input.merchantId),
    merchantLog(input.merchantId),
  ],
})
