import type { Column } from '@granito/ui'
import type { PlatformConfigurationVersion, TreatmentDefaultsVersion } from '../data/levels'
import { configurationStrings } from '../strings'

/**
 * **Lo que el historial de un nivel global suma a las columnas comunes**: el
 * nombre que estampan las decisiones, y qué mediciones reinició la versión.
 */
export const levelHistoryColumns: readonly Column<
  PlatformConfigurationVersion | TreatmentDefaultsVersion
>[] = [
  {
    id: 'stampedAs',
    header: configurationStrings.versionName,
    width: '130px',
    cell: (row) => row.stampedAs,
  },
  {
    id: 'windowsRestarted',
    header: configurationStrings.windowsRestarted,
    width: '200px',
    cell: (row) => (row.windowsRestarted ?? []).join(', '),
  },
]
