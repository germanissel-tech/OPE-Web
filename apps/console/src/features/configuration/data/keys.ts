import { opeService } from '../../../api/ope/client'

/**
 * **Las claves de caché de la configuración**, de lo general a lo particular.
 *
 * Están juntas porque una publicación global invalida más que su nivel: unos
 * defaults nuevos cambian lo efectivo de **todo merchant que no declare ese
 * valor**, así que se invalida `allConfiguration` entera. La configuración de un
 * merchant cuelga de acá y no de los merchants por esa razón: lo que la cambia
 * no es sólo el merchant.
 */
export const allConfiguration = [opeService.id, 'configuration'] as const

export const merchantConfiguration = (merchantId: string) =>
  [...allConfiguration, 'merchant', merchantId] as const

export const merchantConfigurationVersions = (merchantId: string) =>
  [...merchantConfiguration(merchantId), 'versions'] as const

export const platformConfiguration = [...allConfiguration, 'platform'] as const

export const treatmentDefaults = [...allConfiguration, 'defaults'] as const
