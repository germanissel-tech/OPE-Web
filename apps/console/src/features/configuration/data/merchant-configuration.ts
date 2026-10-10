import { defineAction, useCollection, useService } from '@ope/core'
import { useQuery } from '@tanstack/react-query'
import {
  type MerchantConfiguration,
  type MerchantConfigurationDeclared,
  type MerchantConfigurationInput,
  type MerchantConfigurationVersion,
  type OpeClient,
  opeService,
} from '../../../api/ope/client'
import { opeOperation } from '../../../api/ope/operations'
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
  MerchantConfigurationInput,
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

/** Lo que la publicación necesita: a quién, qué, y qué versión regía al abrir. */
export type PublishMerchantInput = {
  readonly merchantId: string
  readonly body: MerchantConfigurationInput
  /** La versión que regía al abrir la pantalla; sin versión propia, ninguna. */
  readonly inForce: number | undefined
}

/**
 * **Publicar una versión de la configuración de un merchant** (feature 008).
 *
 * Idempotente por contrato (`CU-34`): un reintento con el mismo cuerpo no crea
 * otra. Un cuerpo igual a la versión que rige vuelve `200` con esa misma, y el
 * cliente no expone el estado HTTP: el aviso lo sabe comparando el número que
 * volvió con el que regía al abrir (research §9).
 */
export const publishMerchantConfiguration = defineAction({
  id: 'configuration.publishMerchant',

  operations: {
    publish: opeOperation(
      'publishMerchantConfiguration',
      (ope, input: PublishMerchantInput): Promise<MerchantConfigurationVersion> =>
        ope.publishMerchantConfiguration(input.merchantId, input.body),
    ),
  },

  run: (input: PublishMerchantInput, ops) => ops.publish.run(input),

  /* El número y nada más: el registro de la consola lleva acciones, no cuerpos (`CU-35`). */
  announces: (published, input) =>
    published.version === input.inForce
      ? {
          title: configurationStrings.unchanged,
          description: configurationStrings.unchangedDetail(published.version),
        }
      : {
          title: configurationStrings.published,
          description: configurationStrings.publishedDetail(published.version),
        },

  /* Lo efectivo, lo declarado y el historial del merchant cuelgan de la misma clave. */
  invalidates: (input) => [merchantConfiguration(input.merchantId)],
})
