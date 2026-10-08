import { Checkbox, Dialog, Field, TextInput } from '@granito/ui'
import { useAction, useForm } from '@ope/core'
import { useState } from 'react'
import { createMerchant, merchantConstraints } from '../data/create-merchant'
import { merchantsStrings } from '../strings'

/**
 * El alta, y **el ejemplo de las tres capas de validación** (`CU-38`):
 *
 * | capa | qué mira | dónde |
 * |---|---|---|
 * | La forma | Obligatorio, largo, patrón del origen | **Acá**, con lo que el contrato declara |
 * | Invariante de schema | `invalid-origin`: la forma exacta del origen | **El servidor**, con `errors[]` al campo |
 * | Invariante de operación | `origin-already-registered`: otro merchant | **Sólo el servidor**, `422` al campo |
 *
 * Lo que **no** hace, y es el punto: no decide cuándo marcar un campo, no avisa,
 * no invalida, y no decide qué pasa con un `422`.
 *
 * **Un origen, no veinte.** El contrato admite hasta veinte; el hola mundo toma
 * uno, y por eso `errors[]` que vuelven como `origins.0` se llevan al campo
 * `origin`: el formulario sabe qué control corresponde a cada nombre, y acá el
 * primero de la lista es el único.
 */
export function NewMerchantDialog({ onClose }: { readonly onClose: () => void }) {
  /* Se cierra **sólo si salió bien**: si cerrara siempre, un rechazo dejaría al
     operador sin lo que escribió y sin el error que lo explica. */
  const action = useAction(createMerchant, { onDone: onClose })
  const [signature, setSignature] = useState(true)

  const form = useForm(
    { origin: '' },
    merchantConstraints,
    merchantsStrings.shape,
    action.fields.map((each) => ({
      ...each,
      field: /^origins(\.\d+)?$/.test(each.field) ? 'origin' : each.field,
    })),
  )

  const save = () => {
    /* Marca todo y recién ahí decide: un botón que no hace nada y no dice por
       qué es peor que uno apagado. */
    if (!form.attempt()) return

    /* **Se devuelve**: con la promesa a la vista, el confirmar queda apagado
       hasta que el servidor conteste (`GR-68`). */
    return action.run({ origins: [form.values.origin.trim()], signature })
  }

  return (
    <Dialog
      open
      title={merchantsStrings.newMerchant}
      onClose={onClose}
      /* **El diálogo pone sus botones, no la pantalla**: con `onConfirm` granito
         confirma con `Enter` y respeta el botón apagado (`GR-42`, `GR-65`). */
      confirmLabel={merchantsStrings.save}
      onConfirm={save}
      confirmDisabled={action.running}
    >
      <Field label={merchantsStrings.origin} size="fill" required error={form.errorOf('origin')}>
        {(props) => (
          <TextInput
            {...props}
            value={form.values.origin}
            onChange={(event) => form.set('origin', event.target.value)}
            onBlur={() => form.blur('origin')}
          />
        )}
      </Field>
      <Checkbox
        label={merchantsStrings.signature}
        checked={signature}
        onChange={(event) => setSignature(event.target.checked)}
      />
    </Dialog>
  )
}
