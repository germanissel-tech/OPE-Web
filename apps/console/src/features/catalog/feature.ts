import { defineFeature, outcome } from '@ope/core'
import { articleScreen } from './screens/article-screen'
import { articlesScreen } from './screens/articles-screen'
import { editArticleScreen } from './screens/edit-article-screen'

/**
 * Lo que esta funcionalidad aporta.
 *
 * Es lo que hace que la raíz de composición crezca **una línea por
 * funcionalidad y no una por pantalla** (`CU-36`): cada funcionalidad junta lo
 * suyo, y la raíz junta las funcionalidades.
 */
export const catalog = defineFeature({
  screens: [articlesScreen, articleScreen, editArticleScreen],

  /* A dónde cae un cerrar sin pila, para las dos (`CU-47`). Una ficha abierta
     por un enlace pegado no tiene escalón abajo, y cerrarla tiene que hacer
     algo. */
  root: articlesScreen,

  /**
   * **Volver es un destino nombrado, no un paso atrás** (`CU-44`).
   *
   * granito no da `onBack` a propósito, y la razón es la de `CU-3`: **una pila
   * de historia no sabe de permisos** y devuelve a una pantalla que hoy el rol
   * puede no dejar ver.
   *
   * Y acá hay además una razón estructural: la grilla ya importa la ficha para
   * llevar a ella, así que si la ficha importara la grilla para volver **sería
   * un ciclo**. El desenlace lo corta — la ficha dice qué pasó, y a dónde lleva
   * lo dice el paso del flujo activo, en `app/flows.ts` (`CU-47`).
   */
  outcomes: {
    articleClosed: outcome<{ id: string }>('catalog.articleClosed'),

    /* **Lo emite la grilla**, y el flujo dice a dónde lleva. Una pantalla no
       nombra a otra: es lo único que hace que la misma grilla sirva en dos
       recorridos distintos (`CU-47`). */
    articleChosen: outcome<{ id: string }>('catalog.articleChosen'),

    /* **Lo emite la ficha**, y el flujo dice a dónde lleva. Editar es un paso
       más del mismo recorrido, no otra pantalla que la ficha nombre. */
    articleEditRequested: outcome<{ id: string }>('catalog.articleEditRequested'),
  },
})
