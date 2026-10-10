import { FormattedValue } from '@granito/ui'
import { dayOf, timeOf } from '../lib/instants'
import { sharedStrings } from './strings'

/**
 * **Un instante del contrato, como lo lee una persona** (`GR-30`): la fecha
 * con el formato de granito —el mismo de toda fecha de la consola (`GR-31`)—
 * y la hora en UTC, dicha. Lo usan la rotación, el registro del merchant y el
 * historial de cada nivel de configuración: `2026-10-08` es lo que viaja, y
 * `GR-30` dice que se muestra lo que una persona lee.
 */
export function When({ instant }: { readonly instant: string }) {
  return (
    <>
      <FormattedValue format="date" value={dayOf(instant)} />
      {sharedStrings.timeUtc(timeOf(instant))}
    </>
  )
}
