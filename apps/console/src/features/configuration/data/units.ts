import type { Presentation } from '@ope/core'
import type {
  PlatformConfigurationContent,
  TreatmentDefaultsContent,
} from '../../../api/ope/client'

/**
 * **Los caminos de las hojas de un esquema**, con puntos: `freshness.catalogMs`.
 *
 * Una lista es una hoja —sus renglones no tienen nombre propio en el
 * esquema—, y un objeto no lo es: lo son sus campos. Es lo que permite que la
 * tabla de abajo **no compile** si nombra un valor que el contrato no tiene, o
 * uno que el contrato renombró.
 */
type Leaves<T> = T extends readonly unknown[]
  ? never
  : T extends object
    ? {
        [K in keyof T & string]: NonNullable<T[K]> extends readonly unknown[]
          ? K
          : NonNullable<T[K]> extends object
            ? `${K}.${Leaves<NonNullable<T[K]>>}`
            : K
      }[keyof T & string]
    : never

export type TreatmentLeaf = Leaves<TreatmentDefaultsContent>
export type PlatformLeaf = Leaves<PlatformConfigurationContent>

/**
 * **En qué unidad se lee cada valor del tratamiento**, una vez (research §5).
 *
 * La usan la vista, la edición y el historial, del merchant y de los defaults:
 * un dato se lee siempre igual (`CU-6`). Lo que no figura se lee como viaja:
 * una cantidad, un texto, una marca. Elegir otra unidad es cambiar una línea.
 */
export const TREATMENT_PRESENTATION: Partial<Record<TreatmentLeaf, Presentation>> = {
  'freshness.catalogMs': { duration: { base: 'ms', unit: 'h' } },
  'freshness.stockAndPriceMs': { duration: { base: 'ms', unit: 'min' } },
  'syncLevel.noDataAfterMs': { duration: { base: 'ms', unit: 'h' } },
  'syncLevel.minutesLevelMaxAgeMs': { duration: { base: 'ms', unit: 'min' } },
  'syncLevel.minutesLevelMedianIntervalMs': { duration: { base: 'ms', unit: 'min' } },
  holdoutShare: { rate: true },
  'commercialPolicy.maxIncentiveShare': { rate: true },
  'commercialPolicy.incentiveLadderShare': { rate: true },
  'commercialPolicy.marginShare': { rate: true },
  'commercialPolicy.cooldownSeconds': { duration: { base: 's', unit: 's' } },
}

/** En qué unidad se lee cada valor de la plataforma. */
export const PLATFORM_PRESENTATION: Partial<Record<PlatformLeaf, Presentation>> = {
  'dedupWindow.ttlMs': { duration: { base: 'ms', unit: 'h' } },
  eventPastToleranceMs: { duration: { base: 'ms', unit: 'h' } },
  clockSkewToleranceMs: { duration: { base: 'ms', unit: 'min' } },
  sessionDurationMs: { duration: { base: 'ms', unit: 'min' } },
  visitorWindowMs: { duration: { base: 'ms', unit: 'h' } },
  signatureWindowMs: { duration: { base: 'ms', unit: 'min' } },
  rotationGraceMaxMs: { duration: { base: 'ms', unit: 'd' } },
  retryAfterSeconds: { duration: { base: 's', unit: 's' } },
}
