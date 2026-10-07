import { defineAction } from '@cuarzo/core'
import type { ArticleCreate } from '../../../api/demo/client'
import { demoOperation } from '../../../api/demo/operations'
import { catalogStrings } from '../strings'
import { allArticles } from './articles'

/** Lo que hace falta para editar: cuál, con qué, y sobre qué versión. */
type UpdateInput = {
  readonly articleId: number
  readonly body: ArticleCreate
  readonly version: string
}

/**
 * **Editar un artículo, con el testigo de la versión que se leyó** (`CU-29`).
 *
 * Es la primera escritura del esqueleto que lo exige, y por eso existe: sin una
 * edición de verdad, todo lo que el marco hace con el conflicto sería código que
 * nunca corre.
 *
 * **El testigo no lo pone la puerta**, al revés que la clave de idempotencia: lo
 * trae la pantalla, porque es quien leyó el registro y quien lo tiene en
 * `meta.version`. Por eso viaja en la entrada — y por eso **esto no compila si
 * quien la invoca no lo pasa**, que es la mitad de la protección.
 *
 * No declara clave de idempotencia, y el contrato tampoco: guardar dos veces el
 * mismo cuerpo sobre la misma versión deja el mismo estado, y la segunda vez el
 * testigo ya no coincide. La clave se reserva para lo que aplicado dos veces
 * cuenta dos veces (`CU-34`).
 */
export const updateArticle = defineAction({
  id: 'article.update',

  operations: {
    update: demoOperation('updateArticle', (demo, input: UpdateInput) =>
      demo.updateArticle(input.articleId, input.body, input.version),
    ),
  },

  run: (input: UpdateInput, ops) => ops.update.run(input),

  announces: (article) => ({
    title: catalogStrings.articleUpdated,
    description: catalogStrings.articleUpdatedDetail(String(article.data.id), article.data.name),
  }),

  /* Sólo la lista por ahora. **La ficha individual todavía no es una consulta**:
     llega con la pantalla de edición, y ahí esto gana su clave — porque lo que
     cambia con una edición no es sólo la grilla, es el registro y su testigo. */
  invalidates: () => [allArticles],
})
