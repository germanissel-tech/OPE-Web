import { configurationStrings } from '../strings'
import type { TreatmentLeaf } from './units'

/** Una hoja del tratamiento que la pantalla muestra y edita, y que el catálogo rotula. */
export type OperativeLeaf = TreatmentLeaf & keyof typeof configurationStrings

/** Un grupo de valores: su sección, por qué existe y qué hojas lleva. */
export type TreatmentGroup = {
  readonly title: string
  readonly why: string
  readonly leaves: readonly OperativeLeaf[]
}

/**
 * **Los valores operativos del tratamiento, en sus grupos** (data-model §2).
 *
 * Es lo que se ve y se edita, en la configuración del merchant y en los
 * defaults, en este orden. Lo que no está acá —la política de decisión, la
 * condición de riesgo de devolución— se ve resumido y viaja intacto.
 *
 * Que cada hoja exista en el contrato y tenga rótulo lo verifica el compilador:
 * `OperativeLeaf` es la intersección de las dos cosas.
 */
export const TREATMENT_GROUPS: readonly TreatmentGroup[] = [
  {
    title: configurationStrings.freshnessSection,
    why: configurationStrings.freshnessWhy,
    leaves: ['freshness.catalogMs', 'freshness.stockAndPriceMs'],
  },
  {
    title: configurationStrings.syncLevelSection,
    why: configurationStrings.syncLevelWhy,
    leaves: [
      'syncLevel.receiptsKept',
      'syncLevel.noDataAfterMs',
      'syncLevel.minutesLevelMaxAgeMs',
      'syncLevel.minutesLevelMedianIntervalMs',
      'syncLevel.minutesLevelMinReceipts',
    ],
  },
  {
    title: configurationStrings.holdoutSection,
    why: configurationStrings.holdoutWhy,
    leaves: ['holdoutShare'],
  },
  {
    title: configurationStrings.scopeSection,
    why: configurationStrings.scopeWhy,
    leaves: ['surfaces', 'barriers'],
  },
  {
    title: configurationStrings.syncStrategySection,
    why: configurationStrings.syncStrategyWhy,
    leaves: [
      'syncStrategy.catalog',
      'syncStrategy.stockAndPrice',
      'syncStrategy.orders',
      'syncStrategy.returns',
    ],
  },
  {
    title: configurationStrings.localesSection,
    why: configurationStrings.localesWhy,
    leaves: ['locales.supported', 'locales.fallback'],
  },
  {
    title: configurationStrings.evidenceSection,
    why: configurationStrings.evidenceWhy,
    leaves: [
      'evidenceProfile.returnsPolicy',
      'evidenceProfile.fitData',
      'evidenceProfile.authorizedAttributes',
    ],
  },
  {
    title: configurationStrings.commercialSection,
    why: configurationStrings.commercialWhy,
    leaves: [
      'commercialPolicy.version',
      'commercialPolicy.maxIncentiveShare',
      'commercialPolicy.incentiveLadderShare',
      'commercialPolicy.marginShare',
      'commercialPolicy.directIncentiveOnPrice',
      'commercialPolicy.highIntent',
      'commercialPolicy.abandonment',
      'commercialPolicy.interventionsPerSession',
      'commercialPolicy.cooldownSeconds',
      'commercialPolicy.interventionsPerVisitorPerDay',
    ],
  },
]
