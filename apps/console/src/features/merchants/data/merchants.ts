import { useCollection, useService } from '@ope/core'
import { useQuery } from '@tanstack/react-query'
import {
  type AdminEntry,
  type CredentialIssued,
  type CredentialKind,
  type KillSwitch,
  type Merchant,
  type MerchantCredentials,
  type OpeClient,
  opeService,
} from '../../../api/ope/client'

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
  MerchantCredentials,
  OpeClient,
}

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
 * **El día de un instante**, para dibujarlo con el formato de fecha de granito.
 *
 * El contrato devuelve instantes ISO (`2026-10-06T21:00:27.783Z`) y granito
 * formatea fechas (`YYYY-MM-DD`): un formato se define una sola vez (`GR-31`),
 * y lo que la pantalla muestra es una fecha, no un instante. La hora se
 * descarta a propósito: un alta se lee por su día.
 */
export const dayOf = (instant: string) => instant.slice(0, 10)

/**
 * La hora de un instante del contrato, **en UTC y dicho así donde se muestra**:
 * granito formatea fechas y no instantes, y convertir a la zona del navegador
 * sin decirlo es mentir en un registro.
 */
export const timeOf = (instant: string) => instant.slice(11, 16)
export const whenOf = (instant: string) => `${dayOf(instant)} ${timeOf(instant)} UTC`

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
