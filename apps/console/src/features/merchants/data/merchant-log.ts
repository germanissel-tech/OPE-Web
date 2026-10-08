import { useCollection, useService } from '@ope/core'
import { oneMerchant, opeService } from './merchants'

/**
 * **El registro de administración de un merchant** (`ADR-031` del backend):
 * quién hizo qué sobre él, con qué resultado, lo más nuevo primero. Pagina por
 * cursor como toda colección de OPE (`OW-4`).
 *
 * La clave cuelga de la ficha: lo que cambia al merchant cambia su registro, y
 * las acciones que lo tocan invalidan esto junto con la ficha.
 */
export const merchantLog = (merchantId: string) => [...oneMerchant(merchantId), 'log'] as const

export function useMerchantLog(
  merchantId: string,
  options: {
    readonly from: string | undefined
    readonly onCursor: (cursor: string | undefined) => void
  },
) {
  const ope = useService(opeService)
  return useCollection(
    merchantLog(merchantId),
    (cursor) => ope.listMerchantAdminLog(merchantId, cursor === undefined ? {} : { cursor }),
    options,
  )
}
