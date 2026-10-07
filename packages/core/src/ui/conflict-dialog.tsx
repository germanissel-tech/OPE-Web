import { Dialog, Field } from '@granito/ui'
import { useStrings } from '../base/use-strings'
import type { Clash } from '../data/conflict'

/**
 * **Qué cambió de lo que el operador tocó, mientras editaba** (`CU-29`).
 *
 * Se abre solo cuando hay algo que decidir. El caso frecuente —lo que el otro
 * cambió no se cruza con lo editado— no llega hasta acá: la puerta guarda y
 * sigue. Por eso esto suele mostrar **uno o dos campos**, y está pensado para
 * eso y no para una lista larga.
 *
 * ## Está compuesto, no dibujado
 *
 * Granito no tiene un componente de comparación —ninguno de sus treinta lo es—,
 * así que se arma con su `Dialog` y sus `Field`. **No se inventa uno acá**: el
 * principio IV dice que lo visual es de granito, y componer con sus piezas no es
 * lo mismo que dibujar uno propio.
 *
 * Si al mirarlo la comparación no se entiende de un vistazo, **es una propuesta
 * a granito y no un parche de este lado**. Está anotado en el `quickstart` como
 * una de las dos cosas que sólo ve una persona.
 *
 * ## Y no formatea, a propósito
 *
 * Los valores llegan como los tenía el registro, y **cuarzo no sabe qué
 * significan**: si son plata, una fecha o un porcentaje lo sabe la aplicación.
 * `FormattedValue` exige que se lo digan, así que formatear acá sería adivinar.
 *
 * La consecuencia está aceptada y dicha: un precio se ve `2450.00` y no
 * `$ 2.450,00`. En un diálogo que compara dos versiones del mismo campo eso se
 * lee bien —los dos se ven igual, que es lo que importa—, y el día que no
 * alcance, quien lo necesite pasa cómo se dibuja cada campo.
 *
 * **Los rótulos sí los pone la pantalla**, por la misma razón: `precio` es el
 * nombre del campo en el contrato, no cómo se llama para el operador.
 */
export type ConflictDialogProps = {
  /** Lo que la puerta calculó. Vacío no abre nada. */
  readonly clash: readonly Clash[]
  /** Descartar y seguir editando. Lo tecleado no se toca. */
  readonly onClose: () => void
  /**
   * Cómo se llama cada campo para el operador.
   *
   * Sin esto se muestra el nombre del contrato, que es mejor que nada y peor
   * que el rótulo que la pantalla ya tiene escrito en su formulario.
   */
  readonly labelOf?: (field: string) => string
}

export function ConflictDialog({ clash, onClose, labelOf }: ConflictDialogProps) {
  const strings = useStrings()

  return (
    <Dialog
      open={clash.length > 0}
      onClose={onClose}
      title={strings.conflictTitle}
      /* **No promete quién escribió** (`CU-29`). Con el legacy escribiendo sobre
         la misma base, el cambio puede no venir de nadie del panel. */
      description={strings.conflictDescription}
      confirmLabel={strings.conflictConfirm}
      onConfirm={onClose}
    >
      {clash.map((each) => (
        <Field key={each.field} label={labelOf?.(each.field) ?? each.field} size="fill">
          {() => (
            <p>
              {strings.conflictWhenOpened} {String(each.whenOpened)}
              {' · '}
              {strings.conflictNow} {String(each.now)}
            </p>
          )}
        </Field>
      ))}
    </Dialog>
  )
}
