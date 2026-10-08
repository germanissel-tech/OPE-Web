import { defineAction } from '@ope/core'
import type { Article } from '../../../api/demo/client'
import { demoOperation } from '../../../api/demo/operations'
import { catalogStrings } from '../strings'
import { allArticles } from './articles'

/**
 * Poner un artículo dentro o fuera de circulación — **y el ejemplo de una
 * acción de fila** (`CU-46`).
 *
 * Lo que la distingue del alta: se ejecuta **una vez por fila**, y lo que hace
 * depende de la fila.
 *
 * **Es una acción con dos operaciones, no dos acciones.** Es una sola cosa que
 * el operador entiende como un interruptor, y partirla en dos obligaría a la
 * pantalla a elegir cuál usar —o sea, a saber la regla— cuando lo que sabe es
 * el dato. El permiso sale de la unión de las dos (`CU-37`), que acá da lo
 * mismo porque las dos piden `catalog:write`.
 */
export const toggleArticleActive = defineAction({
  id: 'article.toggleActive',

  /* Ninguna lleva clave de idempotencia, y lo decide el contrato: aplicarlas
     dos veces deja el mismo estado (`CU-34`). */
  operations: {
    activate: demoOperation('activateArticle', (demo, articleId: number) =>
      demo.activateArticle(articleId),
    ),
    deactivate: demoOperation('deactivateArticle', (demo, articleId: number) =>
      demo.deactivateArticle(articleId),
    ),
  },

  /* Recibe **el artículo entero** y no su identificador: de ahí sale hacia qué
     lado va el interruptor, y la pantalla no tiene que decidirlo. */
  run: (article: Article, ops) =>
    article.active ? ops.deactivate.run(article.id) : ops.activate.run(article.id),

  /* Lo que pasó lo dice **lo que volvió**, no lo que se pidió: si el servidor
     contestó otra cosa, el aviso dice la verdad y no la intención. */
  announces: (updated) => ({
    title: updated.data.active
      ? catalogStrings.articleActivated
      : catalogStrings.articleDeactivated,
    description: updated.data.name,
  }),

  invalidates: () => [allArticles],
})
