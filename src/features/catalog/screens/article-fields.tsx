import type { Form } from '@cuarzo/core'
import { Field, MoneyInput, TextInput } from '@granito/ui'
import { catalogStrings } from '../strings'

/** Lo que el formulario de un artículo tiene, en los dos lados. */
export type ArticleValues = {
  readonly name: string
  readonly price: string
  readonly discountedPrice: string
  readonly stock: string
}

/**
 * **Los campos de un artículo, una sola vez** (deuda 3).
 *
 * El alta vive en un diálogo y la edición no puede —`GR-42` fija que un diálogo
 * no espera un dato del servidor, y editar exige haber leído el registro para
 * tener su testigo—. Con dos maquetas serían los mismos campos, las mismas
 * validaciones y **dos layouts que se desincronizan en la primera corrección**:
 * alguien agrega un campo de un lado y el otro se entera cuando un operador
 * pregunta por qué no está.
 *
 * Que sean contenedores distintos no obliga a que sean campos distintos.
 *
 * **Los tamaños de granito son semánticos**: `money` y `short` no son anchos,
 * son qué entra. Y `MoneyInput` en vez de `TextInput` porque un formato se
 * define una sola vez (`GR-32`) — con un campo de texto el mismo dato se vería
 * formateado en la grilla y crudo acá.
 */
export function ArticleFields({ form }: { readonly form: Form<ArticleValues> }) {
  return (
    <>
      <Field label={catalogStrings.name} size="fill" required error={form.errorOf('name')}>
        {(props) => (
          <TextInput
            {...props}
            value={form.values.name}
            onChange={(event) => form.set('name', event.target.value)}
            onBlur={() => form.blur('name')}
          />
        )}
      </Field>

      <Field label={catalogStrings.price} size="money" required error={form.errorOf('price')}>
        {(props) => (
          <MoneyInput
            {...props}
            value={form.values.price}
            onChange={(value) => form.set('price', value)}
            onBlur={() => form.blur('price')}
          />
        )}
      </Field>

      <Field label={catalogStrings.stock} size="short" error={form.errorOf('stock')}>
        {(props) => (
          <TextInput
            {...props}
            value={form.values.stock}
            onChange={(event) => form.set('stock', event.target.value)}
            onBlur={() => form.blur('stock')}
          />
        )}
      </Field>

      <Field
        label={catalogStrings.discountedPrice}
        size="money"
        error={form.errorOf('discountedPrice')}
      >
        {(props) => (
          <MoneyInput
            {...props}
            value={form.values.discountedPrice}
            onChange={(value) => form.set('discountedPrice', value)}
            onBlur={() => form.blur('discountedPrice')}
          />
        )}
      </Field>
    </>
  )
}
