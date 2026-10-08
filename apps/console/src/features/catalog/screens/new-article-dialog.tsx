import { Dialog } from '@granito/ui'
import { useAction, useForm } from '@ope/core'
import { articleConstraints, createArticle, discountFitsInPrice } from '../data/create-article'
import { catalogStrings } from '../strings'
import { ArticleFields } from './article-fields'

/**
 * **Es parte del hola mundo de cuarzo.** Se borra al clonar.
 *
 * El alta, y **el ejemplo de las tres capas de validación** (`CU-38`):
 *
 * | capa | qué mira | dónde |
 * |---|---|---|
 * | La forma | Obligatorios, largos, patrones | **Acá**, con lo que el contrato declara |
 * | Invariante de schema | Dos campos del mismo mensaje | **Acá**, y apaga el botón con su motivo |
 * | Invariante de operación | Otro recurso — que el nombre no se repita | **Sólo el servidor** |
 *
 * Lo que **no** hace, y es el punto: no decide cuándo marcar un campo, no avisa,
 * no invalida, y no decide qué pasa con un `409`.
 */
export function NewArticleDialog({ onClose }: { readonly onClose: () => void }) {
  /* Se cierra **sólo si salió bien**: si cerrara siempre, un rechazo dejaría al
     operador sin lo que escribió y sin el error que lo explica. */
  const action = useAction(createArticle, { onDone: onClose })

  /* Las restricciones salen del contrato; los textos, del catálogo de esta
     funcionalidad — el marco no sabe cómo se llama un campo (`CU-43`). */
  const form = useForm(
    { name: '', price: '', discountedPrice: '', stock: '' },
    articleConstraints,
    catalogStrings.shape,
    action.fields,
  )

  /* La capa 2: se evalúa acá porque mira dos campos del mismo mensaje. Apaga el
     botón **con su explicación**, que es lo que `CU-38` pide. */
  const invariant = discountFitsInPrice.holds(form.values)
    ? undefined
    : discountFitsInPrice.explains

  const save = () => {
    /* Marca todo y recién ahí decide: un botón que no hace nada y no dice por
       qué es peor que uno apagado. */
    if (!form.attempt()) return

    /* **Se devuelve**: con la promesa a la vista, el confirmar queda apagado
       hasta que el servidor conteste (`GR-68`). */
    return action.run({
      name: form.values.name.trim(),
      price: form.values.price.trim(),
      /* Vacío es «no hay», no una cadena vacía: el contrato lo declara opcional. */
      discountedPrice: form.values.discountedPrice.trim() || undefined,
      /* Igual que el descuento: vacío es «no hay». Y va como número porque el
         contrato lo declara entero — el importe va como texto y éste no. */
      stock: form.values.stock.trim() === '' ? undefined : Number(form.values.stock),
      /* `active` va explícito aunque el contrato lo tenga por omisión: el
         generador marca obligatorio todo lo que el contrato declara. */
      active: true,
    })
  }

  return (
    <Dialog
      open
      title={catalogStrings.newArticle}
      onClose={onClose}
      /* **El diálogo pone sus botones, no la pantalla.** Con `actions` propias
         se pierde el `Enter`: granito sólo confirma con esa tecla cuando recibe
         `onConfirm`, y quedaba un diálogo que se cierra con `Escape` y no se
         confirma con `Enter` (`granito#PED-1`, `GR-42`, `GR-65`).

         Y el `Enter` **respeta el botón apagado**, para que el teclado no haga
         lo que el mouse tiene prohibido. */
      confirmLabel={catalogStrings.save}
      onConfirm={save}
      confirmDisabled={action.running || invariant !== undefined}
      confirmDisabledReason={invariant}
    >
      {/* **Los campos salen de un solo lado** (deuda 3): los mismos que usa la
          edición, para que no se desincronicen en la primera corrección. Van
          directo adentro del diálogo, sin `Form` ni `Section`: ésos arman la
          grilla de un formulario de página entera y en el ancho de un diálogo no
          entran. */}
      <ArticleFields form={form} />
    </Dialog>
  )
}
