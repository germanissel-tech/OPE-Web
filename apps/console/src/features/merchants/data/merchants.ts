import { useCollection, useService } from '@ope/core'
import { useQuery } from '@tanstack/react-query'
import {
  type AdminEntry,
  type CredentialIssued,
  type CredentialKind,
  type KillSwitch,
  type Merchant,
  type MerchantContact,
  type MerchantCredentials,
  type MerchantProfileInput,
  type OpeClient,
  opeService,
} from '../../../api/ope/client'
import { dayOf, timeOf } from '../../../lib/instants'

/**
 * Los datos de los merchants.
 *
 * **Es lo único de esta funcionalidad que toca `api/`**: una pantalla pide acá
 * y no sabe de qué sistema vino lo que recibe.
 */

export type {
  AdminEntry,
  CredentialIssued,
  CredentialKind,
  KillSwitch,
  Merchant,
  MerchantContact,
  MerchantCredentials,
  MerchantProfileInput,
  OpeClient,
}

/**
 * **El nombre con el que se reconoce a un merchant** (feature 007, `ADR-045`):
 * su `displayName`, o nada. Un merchant creado antes de la 041 y nunca editado
 * no tiene nombre, y la pantalla muestra el identificador en su lugar — **nunca
 * un nombre inventado**.
 */
export const displayNameOf = (merchant: Merchant): string | undefined => merchant.displayName

/** Si el merchant tiene algo de identidad para mostrar (`ADR-045`). */
export const hasIdentity = (merchant: Merchant): boolean =>
  merchant.displayName !== undefined ||
  merchant.storeUrl !== undefined ||
  merchant.contact !== undefined ||
  merchant.notes !== undefined

/** Las tres clases del contrato, para validar lo que llega por una ruta. */
export const CREDENTIAL_KINDS: readonly CredentialKind[] = ['ingest', 'platform', 'signing']
export const isCredentialKind = (value: string): value is CredentialKind =>
  (CREDENTIAL_KINDS as readonly string[]).includes(value)
export { opeService }

/**
 * El tono de cada estado del contrato, **el mismo en la grilla y en la ficha**
 * (`GR-67`). `off` es el interruptor de apagado: avisa, no alarma.
 */
export const STATUS_TONE = {
  active: 'success',
  off: 'warning',
  deactivated: 'neutral',
} as const satisfies Record<Merchant['status'], string>

/**
 * **Todas las listas de merchants**, sea cual sea el tramo.
 *
 * La clave de caché va de lo general a lo particular —sistema, recurso,
 * arranque—, así que nombrar las dos primeras alcanza a todas. Es lo que un
 * alta o una desactivación invalidan.
 */
export const allMerchants = [opeService.id, 'merchants'] as const

/**
 * La colección, por cursor (`ADR-020` del backend).
 *
 * `from` es el cursor que la dirección trae: un enlace con cursor reproduce
 * ese tramo. `onCursor` es dónde la pantalla anota el del tramo que llegó.
 * **No se manda `limit`**: cuántos por tramo lo decide el servidor, que lo
 * declara en el contrato.
 */
export function useMerchants(options: {
  readonly from: string | undefined
  readonly onCursor: (cursor: string | undefined) => void
}) {
  const ope = useService(opeService)

  return useCollection(
    allMerchants,
    (cursor) => ope.listMerchants(cursor === undefined ? {} : { cursor }),
    options,
  )
}

/** La clave de **un** merchant. Cuelga del mismo prefijo que la lista. */
export const oneMerchant = (merchantId: string) => [...allMerchants, 'one', merchantId] as const

export function useMerchant(merchantId: string) {
  const ope = useService(opeService)

  return useQuery({
    queryKey: oneMerchant(merchantId),
    queryFn: () => ope.getMerchant(merchantId),
  })
}

/* El día y la hora de un instante viven en `lib/`: los usa también la configuración. */
export { dayOf, timeOf }
