import { FormattedValue } from '@granito/ui'
import { dayOf, timeOf } from '../data/merchants'
import { merchantsStrings } from '../strings'

/**
 * **Un instante del contrato, como lo lee una persona** (`GR-30`): la fecha
 * con el formato de granito —el mismo de toda fecha de la consola (`GR-31`)—
 * y la hora en UTC, dicha. Granito formatea fechas y no instantes, y convertir
 * a la zona del navegador sin decirlo mentiría en un registro; así que se
 * compone acá, una sola vez, para la ficha de una rotación y para el registro:
 * `2026-10-08` es lo que viaja, y `GR-30` dice que se muestra lo que una persona
 * lee.
 */
export function When({ instant }: { readonly instant: string }) {
  return (
    <>
      <FormattedValue format="date" value={dayOf(instant)} />
      {merchantsStrings.timeUtc(timeOf(instant))}
    </>
  )
}
