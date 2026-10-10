import { useCollection, useService } from '@ope/core'
import { useQuery } from '@tanstack/react-query'
import {
  type MerchantConfiguration,
  type MerchantConfigurationDeclared,
  type MerchantConfigurationVersion,
  type OpeClient,
  opeService,
} from '../../../api/ope/client'
import { configurationStrings } from '../strings'
import { merchantConfiguration, merchantConfigurationVersions } from './keys'
import { valueAt } from './present'

/**
 * **La configuración de un merchant** (feature 008): con qué se lo sirve, lo
 * que declara y su historial. Las claves y la presentación son de la
 * configuración; esto es lo que el merchant agrega encima.
 */

export type {
  MerchantConfiguration,
  MerchantConfigurationDeclared,
  MerchantConfigurationVersion,
  OpeClient,
}
/* El servicio, para que las pruebas monten un doble sin tocar `api/` (`CU-15`). */
export { opeService }

export function useMerchantConfiguration(merchantId: string) {
  const ope = useService(opeService)
  return useQuery({
    queryKey: merchantConfiguration(merchantId),
    queryFn: () => ope.getMerchantConfiguration(merchantId),
  })
}

/** El nombre del merchant, para el título: la ficha es de otra funcionalidad y no se importa. */
export function useMerchantName(merchantId: string) {
  const ope = useService(opeService)
  return useQuery({
    queryKey: [...merchantConfiguration(merchantId), 'name'],
    queryFn: async () => {
      const merchant = await ope.getMerchant(merchantId)
      return merchant.displayName ?? merchant.merchantId
    },
  })
}

export function useConfigurationVersions(
  merchantId: string,
  options: {
    readonly from: string | undefined
    readonly onCursor: (cursor: string | undefined) => void
  },
) {
  const ope = useService(opeService)
  return useCollection(
    merchantConfigurationVersions(merchantId),
    (cursor) => ope.listConfigurationVersions(merchantId, cursor === undefined ? {} : { cursor }),
    options,
  )
}

/**
 * **De dónde sale cada valor**: declarado por el merchant o heredado de los
 * defaults que rigen.
 *
 * Heredar es **la ausencia en `declared`** —eso dice el contrato—, así que la
 * pregunta es si el camino está ahí. Una política declarada con sólo algunos
 * campos hereda el resto hoja por hoja, y por eso se pregunta por la hoja y no
 * por la política entera.
 */
export function originOf(
  declared: MerchantConfigurationDeclared,
  defaultsVersion: string,
): (path: string) => string {
  return (path) =>
    valueAt(declared, path) === undefined
      ? configurationStrings.inherited(defaultsVersion)
      : configurationStrings.declared
}
