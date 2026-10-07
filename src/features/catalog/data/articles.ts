import { useService } from '@cuarzo/core'
import { useQuery } from '@tanstack/react-query'
import { type Article, type ArticleQuery, demoService } from '../../../api/demo/client'
import { constraints } from '../../../api/demo/constraints'

/**
 * Los datos del catálogo.
 *
 * **Es lo único de esta funcionalidad que toca `api/`**: una pantalla pide acá
 * y no sabe de qué sistema vino lo que recibe.
 */

export type { Article }

/**
 * **Qué es cada campo de un artículo**, según el contrato (`CU-14`).
 *
 * De acá sale con qué formato lo dibuja granito. Pasa por la capa de datos y no
 * se importa de `api/` en la pantalla: `CU-15` deja que sólo `data/` lo toque.
 */
export const articleFields = constraints.Article.fields

/**
 * **Todas las listas de artículos**, sea cual sea el filtro.
 *
 * La clave de caché va de lo general a lo particular —sistema, recurso,
 * filtro—, así que nombrar las dos primeras alcanza a todas. Es lo que un alta
 * invalida.
 */
export const allArticles = [demoService.id, 'articles'] as const

/**
 * La clave de una consulta: el prefijo más el filtro.
 *
 * **Sale del prefijo y no de dos textos aparte**, para que no puedan quedar
 * distintos — si quedaran, la invalidación no coincidiría con nada y la grilla
 * mostraría lo viejo sin que falle nada.
 */
export const articlesKey = (query: ArticleQuery) => [...allArticles, query] as const

export function useArticles(query: ArticleQuery) {
  const demo = useService(demoService)

  return useQuery({
    queryKey: articlesKey(query),
    queryFn: () => demo.listArticles(query),
    /* Lo anterior se queda mientras llega lo nuevo: sin esto, cambiar de filtro
       deja la grilla en blanco por medio segundo. */
    placeholderData: (previous) => previous,
  })
}

/**
 * La clave de **un** artículo.
 *
 * Cuelga del mismo prefijo que la lista, así que lo que invalida a todos lo
 * invalida también: una edición cambia la grilla y el registro, y **el testigo
 * junto con él**.
 */
export const oneArticle = (articleId: number) => [...allArticles, 'one', articleId] as const

/**
 * Un artículo, **con su testigo** (`CU-29`).
 *
 * El sobre entero y no sólo los datos: `meta.version` es lo que hace falta para
 * poder editarlo, y perderlo acá dejaría a la pantalla sin con qué guardar.
 *
 * Por eso editar exige haber leído — y por eso la edición no puede ser un
 * diálogo, que según `GR-42` no espera un dato del servidor.
 */
export function useArticle(articleId: number) {
  const demo = useService(demoService)

  return useQuery({
    queryKey: oneArticle(articleId),
    queryFn: () => demo.getArticle(articleId),
  })
}

/**
 * **Volver a pedirlo, sin tocar lo que la pantalla está mostrando** (`CU-29`).
 *
 * Es una lectura suelta y no un `refetch()` de la consulta. Las dos razones
 * aparecieron juntas, y las dos son graves:
 *
 * - **Un `refetch()` no rechaza nunca.** Devuelve un resultado con el error
 *   adentro y deja los datos viejos en su lugar. La puerta creía haber releído,
 *   comparaba el registro contra sí mismo, no encontraba cruce, y reintentaba
 *   **con el mismo testigo que el servidor acababa de rechazar**. Un bucle de
 *   escrituras, y la rama de «no se puede comparar» inalcanzable.
 * - **Y ensucia la consulta de la pantalla.** `Result` muestra el error apenas
 *   la consulta lo tiene, así que un corte de red durante la resolución
 *   **desmontaba el formulario con lo tecleado adentro**: justo lo que `CU-9`
 *   pone primero.
 *
 * Acá el error se propaga —que es lo que la puerta espera— y de esta lectura no
 * se entera nadie más.
 */
export function useRereadArticle() {
  const demo = useService(demoService)

  return (articleId: number) => demo.getArticle(articleId)
}
