import { defineAction } from '@cuarzo/core'
import type { ArticleCreate } from '../../../api/demo/client'
import { constraints } from '../../../api/demo/constraints'
import { demoInvariant } from '../../../api/demo/invariants'
import { demoOperation } from '../../../api/demo/operations'
import { catalogStrings } from '../strings'
import { allArticles } from './articles'

/**
 * Lo que el contrato le exige al alta (`CU-38`, capa 1).
 *
 * Se reexporta desde acá y no se importa de `api/` en la pantalla: `CU-15` deja
 * que sólo la capa de datos toque `api/`, igual que con el tipo del artículo.
 */
export const articleConstraints = constraints.ArticleCreate

/**
 * El alta de un artículo — **y el ejemplo de cómo se escribe una acción.**
 *
 * Una acción es lo que ejecuta un botón: declara qué hace y qué queda viejo
 * después. El aviso, la invalidación, los mensajes que vuelven a los campos y
 * el no reintentar **los pone el marco** (`CU-25`).
 *
 * **Se declara en el módulo**, como una pantalla o una funcionalidad: es una
 * declaración y no tiene estado. El servicio contra el que habla se **nombra**;
 * quién lo cumple lo resuelve la puerta al ejecutar (`CU-36`).
 */
export const createArticle = defineAction({
  /* Con qué se la nombra. Conviene `<recurso>.<verbo>`. */
  id: 'article.create',

  /* Las que va a invocar. **El nombre es el del contrato**, y de acá salen
     el permiso que exige y su clave de idempotencia — por eso no se escriben
     en ningún otro lado.

     La clave llega porque el contrato la pide; **la genera la puerta**, no
     esta acción. Si el contrato no la pidiera, acá no habría tercer
     parámetro. **El servicio también lo pone la puerta**: acá se recibe. */
  operations: {
    create: demoOperation('createArticle', (demo, body: ArticleCreate, key) =>
      demo.createArticle(body, key),
    ),
  },

  /* Qué hace. Podés leer de varios sistemas; **escribí en uno solo**. */
  run: (input: ArticleCreate, ops) => ops.create.run(input),

  /* Qué dice el aviso al salir bien. El título es **qué pasó**; la
     descripción, **con qué referirse a eso** — acá el código y el nombre.
     Un texto pelado también vale, y es sólo el título. */
  announces: (article) => ({
    title: catalogStrings.articleCreated,
    description: catalogStrings.articleCreatedDetail(String(article.data.id), article.data.name),
  }),

  /* Qué consultas quedan viejas. Acá sólo las listas: un alta no cambia los
     catálogos que la pantalla ya tiene cargados. */
  invalidates: () => [allArticles],
})

/**
 * **La invariante de schema del alta** (`CU-38`, capa 2).
 *
 * Mira dos campos del mismo mensaje, así que se contesta sin consultar nada — y
 * por eso el formulario puede apagar el botón antes de mandar, en vez de dejar
 * que el operador escriba todo y se entere al guardar.
 *
 * **La regla va copiada del contrato y el compilador la vigila**: si el backend
 * la cambia, esto deja de compilar en vez de seguir bloqueando con el criterio
 * de antes.
 *
 * Los precios se comparan como números y viajan como texto: un flotante pierde
 * centavos, y la comparación de cadenas diría que «9.00» es mayor que «10.00».
 */
export const discountFitsInPrice = demoInvariant(
  'ArticleCreate',
  'DISCOUNT_ABOVE_PRICE',
  'discountedPrice <= price',
  (values: { readonly price: string; readonly discountedPrice: string }) => {
    /* Sin descuento no hay nada que comparar, y con un precio a medio escribir
       tampoco: de eso se encarga la capa 1, y adelantarse marcaría en rojo a
       quien todavía está tecleando. */
    if (values.discountedPrice.trim() === '' || values.price.trim() === '') return true

    const price = Number(values.price)
    const discounted = Number(values.discountedPrice)
    if (Number.isNaN(price) || Number.isNaN(discounted)) return true

    return discounted <= price
  },
  catalogStrings.discountAbovePrice,
)
