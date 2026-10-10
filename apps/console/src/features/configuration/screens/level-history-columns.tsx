import type { Column } from '@granito/ui'
import type { PlatformConfigurationVersion, TreatmentDefaultsVersion } from '../data/levels'
import { configurationStrings } from '../strings'

/**
 * **Qué mediciones reinició una versión**, la columna que comparten los tres
 * historiales (feature 009, research §6). Toda lectura de una versión lo trae,
 * no sólo la respuesta de publicar (042 del backend). Una versión publicada sin
 * ese registro no trae nada, y la celda queda vacía: no se inventa.
 *
 * Es una función y no una constante porque cada historial tiene su tipo de
 * fila; lo único que la columna lee es el campo que los tres comparten.
 */
export function windowsRestartedColumn<
  T extends { readonly windowsRestarted?: readonly string[] | undefined },
>(): Column<T> {
  return {
    id: 'windowsRestarted',
    header: configurationStrings.windowsRestarted,
    width: '200px',
    cell: (row) => (row.windowsRestarted ?? []).join(', '),
  }
}

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
  windowsRestartedColumn(),
]
