import { useCollection, useService } from '@ope/core'
import { useQuery } from '@tanstack/react-query'
import {
  opeService,
  type PlatformConfiguration,
  type PlatformConfigurationVersion,
} from '../../../api/ope/client'
import { platformConfiguration } from './keys'

/**
 * **Los niveles globales** (feature 008): la plataforma y los defaults de
 * tratamiento, iguales para todos los merchants. Leerlos no mira el alcance del
 * operador; publicarlos exige alcance total (research §8).
 */

export type { PlatformConfiguration, PlatformConfigurationVersion }

export function usePlatformConfiguration() {
  const ope = useService(opeService)
  return useQuery({
    queryKey: platformConfiguration,
    queryFn: () => ope.getPlatformConfiguration(),
  })
}

export function usePlatformVersions(options: {
  readonly from: string | undefined
  readonly onCursor: (cursor: string | undefined) => void
}) {
  const ope = useService(opeService)
  return useCollection(
    [...platformConfiguration, 'versions'],
    (cursor) => ope.listPlatformConfigurationVersions(cursor === undefined ? {} : { cursor }),
    options,
  )
}
