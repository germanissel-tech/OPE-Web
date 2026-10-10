import { defineAction, useCollection, useService } from '@ope/core'
import { useQuery } from '@tanstack/react-query'
import {
  opeService,
  type PlatformConfiguration,
  type PlatformConfigurationContent,
  type PlatformConfigurationInput,
  type PlatformConfigurationVersion,
  type TreatmentDefaults,
  type TreatmentDefaultsContent,
  type TreatmentDefaultsInput,
  type TreatmentDefaultsVersion,
} from '../../../api/ope/client'
import { ALL_MERCHANTS } from '../../../api/ope/identity'
import { opeOperation } from '../../../api/ope/operations'
import { configurationStrings } from '../strings'
import { allConfiguration, platformConfiguration, treatmentDefaults } from './keys'

/**
 * **Los niveles globales** (feature 008): la plataforma y los defaults de
 * tratamiento, iguales para todos los merchants. Leerlos no mira el alcance del
 * operador; publicarlos exige alcance total (research §8), que llega como la
 * capacidad `ALL_MERCHANTS`.
 */

export type {
  PlatformConfiguration,
  PlatformConfigurationContent,
  PlatformConfigurationInput,
  PlatformConfigurationVersion,
  TreatmentDefaults,
  TreatmentDefaultsContent,
  TreatmentDefaultsInput,
  TreatmentDefaultsVersion,
}
export { ALL_MERCHANTS }

/** Los dos niveles globales, por el nombre que llevan en la dirección. */
export type Level = 'platform' | 'defaults'

export const isLevel = (value: string): value is Level =>
  value === 'platform' || value === 'defaults'

type Cursor = {
  readonly from: string | undefined
  readonly onCursor: (cursor: string | undefined) => void
}

const pageQuery = (cursor: string | undefined) => (cursor === undefined ? {} : { cursor })

export function usePlatformConfiguration() {
  const ope = useService(opeService)
  return useQuery({
    queryKey: platformConfiguration,
    queryFn: () => ope.getPlatformConfiguration(),
  })
}

export function usePlatformVersions(options: Cursor) {
  const ope = useService(opeService)
  return useCollection(
    [...platformConfiguration, 'versions'],
    (cursor) => ope.listPlatformConfigurationVersions(pageQuery(cursor)),
    options,
  )
}

export function useTreatmentDefaults() {
  const ope = useService(opeService)
  return useQuery({
    queryKey: treatmentDefaults,
    queryFn: () => ope.getTreatmentDefaults(),
  })
}

export function useDefaultsVersions(options: Cursor) {
  const ope = useService(opeService)
  return useCollection(
    [...treatmentDefaults, 'versions'],
    (cursor) => ope.listTreatmentDefaultsVersions(pageQuery(cursor)),
    options,
  )
}

/**
 * **Volver a pedir lo que rige en un nivel, sin tocar la consulta** (feature
 * 009, `CU-29`): lo que la puerta relee ante un `412`. Por fuera de la caché,
 * como la del merchant: la pantalla sigue con lo que cargó.
 */
export function usePlatformReader() {
  const ope = useService(opeService)
  return () => ope.getPlatformConfiguration()
}

export function useDefaultsReader() {
  const ope = useService(opeService)
  return () => ope.getTreatmentDefaults()
}

/** Una versión de un nivel global, por su número: lo que contenía, de sólo lectura. */
export function useLevelVersion(level: Level, version: number) {
  const ope = useService(opeService)
  return useQuery<PlatformConfigurationVersion | TreatmentDefaultsVersion>({
    queryKey: [...(level === 'platform' ? platformConfiguration : treatmentDefaults), version],
    queryFn: () =>
      level === 'platform'
        ? ope.getPlatformConfigurationVersion(version)
        : ope.getTreatmentDefaultsVersion(version),
  })
}

/** Lo que una publicación global necesita: qué, y el nombre de la versión que regía al abrir. */
export type PublishLevelInput<Body> = {
  readonly body: Body
  readonly inForce: string
  /** El testigo de lo que se leyó al abrir, o de la relectura tras un choque (`CU-29`). */
  readonly witness: string
}

/**
 * **Lo que se avisa al publicar un nivel global** (data-model §5): el número,
 * si no cambió nada, y qué mediciones reinició, por su identificador. Nunca un
 * valor: el registro lleva acciones, no cuerpos (`CU-35`).
 *
 * «No cambió nada» se sabe por el nombre: un cuerpo igual al que rige vuelve
 * `200` con esa misma versión, y su nombre estampado es el que regía al abrir
 * (research §9).
 */
function announced(
  published: PlatformConfigurationVersion | TreatmentDefaultsVersion,
  inForce: string,
) {
  if (published.stampedAs === inForce) {
    return {
      title: configurationStrings.unchanged,
      description: configurationStrings.unchangedDetail(published.version),
    }
  }
  const restarted = published.windowsRestarted ?? []
  return {
    title: configurationStrings.published,
    description:
      restarted.length === 0
        ? configurationStrings.publishedDetail(published.version)
        : configurationStrings.publishedRestarting(published.version, restarted),
  }
}

/**
 * **Publicar una versión de la plataforma** (feature 008, escenario 4).
 *
 * Invalida **toda** la configuración y no sólo la plataforma: lo efectivo de
 * cada merchant cuelga de ella, y una vista abierta de cualquier merchant
 * quedaría mostrando valores que ya no rigen.
 */
export const publishPlatformConfiguration = defineAction({
  id: 'configuration.publishPlatform',

  operations: {
    publish: opeOperation(
      'publishPlatformConfiguration',
      (
        ope,
        input: PublishLevelInput<PlatformConfigurationInput>,
      ): Promise<PlatformConfigurationVersion> =>
        ope.publishPlatformConfiguration(input.body, input.witness),
    ),
  },

  run: (input: PublishLevelInput<PlatformConfigurationInput>, ops) => ops.publish.run(input),

  announces: (published, input) => announced(published, input.inForce),

  invalidates: () => [allConfiguration],
})

/**
 * **Publicar una versión de los defaults de tratamiento** (feature 008,
 * escenario 4). Lo mismo que la plataforma: unos defaults nuevos cambian lo
 * efectivo de todo merchant que no declare ese valor.
 */
export const publishTreatmentDefaults = defineAction({
  id: 'configuration.publishDefaults',

  operations: {
    publish: opeOperation(
      'publishTreatmentDefaults',
      (ope, input: PublishLevelInput<TreatmentDefaultsInput>): Promise<TreatmentDefaultsVersion> =>
        ope.publishTreatmentDefaults(input.body, input.witness),
    ),
  },

  run: (input: PublishLevelInput<TreatmentDefaultsInput>, ops) => ops.publish.run(input),

  announces: (published, input) => announced(published, input.inForce),

  invalidates: () => [allConfiguration],
})
