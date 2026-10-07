import {
  ActionButton,
  defineScreen,
  type GridStates,
  resultOf,
  TablePagination,
  useActionColumn,
  useFlow,
  useOutcome,
  useStrings,
  useTableQuery,
} from '@cuarzo/core'
import { Badge, Block, Button, Field, FilterBar, Page, Region, Table, TextInput } from '@granito/ui'
import { useState } from 'react'
import { type Article, articleFields, useArticles } from '../data/articles'
import { createArticle } from '../data/create-article'
import { toggleArticleActive } from '../data/toggle-active'
import { catalog } from '../feature'
import { catalogStrings } from '../strings'
import { NewArticleDialog } from './new-article-dialog'
import { RowActions } from './row-actions'

/**
 * **Es el hola mundo de cuarzo, no una funcionalidad.** Se borra cuando la
 * aplicación escribe su primera pantalla propia — ver el `README.md` de
 * `features/`.
 *
 * La grilla del catálogo, contra el simulado.
 *
 * Lo que **no** hace, y es el punto: no dibuja la espera, ni los vacíos, ni el
 * error. Declara qué decir en cada uno y `<Result>` pone el resto (`CU-24`).
 *
 * Y **no pagina ni filtra por su cuenta**: los dos van al servidor, que es lo
 * que `CU-14` fija. Filtrar en el navegador sobre una página miente — dice «no
 * hay» cuando lo que no hay es en esas veinte filas.
 */
function ArticlesScreen() {
  const { emit } = useOutcome()
  const flow = useFlow()
  const strings = useStrings()
  const [creating, setCreating] = useState(false)

  /* El estado de una grilla servida: el texto, la consulta que espera a que se
     levanten los dedos, y la página. Lo trae el marco porque es igual en todas
     (`CU-14`). */
  /* **El nombre es obligatorio** (`CU-14`): dos grillas en una pantalla con
     nombres fijos se pisarían en silencio, y la dirección dice de cuál es cada
     cosa — `?articles.q=ibu&articles.row=7`. */
  const table = useTableQuery('articles')
  /* **No se manda `size`**: cuántos por página lo decide el servidor, que lo
     declara en el contrato y lo devuelve en `meta`. Mandarlo sería una decisión
     de esta pantalla —una lista compacta— y no el valor por omisión copiado. */
  const articles = useArticles({ search: table.query || undefined, page: table.page })

  /* De las acciones sale **si la columna existe**: sin ningún permiso, los
     controles escondidos dejarían un encabezado vacío (`CU-46`). Son varias
     porque abrir la ficha y cambiar el estado pueden depender de permisos
     distintos, y adentro cada control se esconde solo. */
  const actions = useActionColumn(
    [flow.toReach(catalog.outcomes.articleChosen), toggleArticleActive],
    (article: Article) => <RowActions article={article} />,
  )

  /**
   * Qué dice cada vacío. **Son dos y dicen cosas distintas** (`CU-24`).
   *
   * Que todavía no se haya cargado nada no es lo mismo que que el filtro no
   * encuentre: el primero se resuelve creando, el segundo borrando el filtro, y
   * ofrecer lo que no corresponde manda al operador para el lado equivocado.
   */
  const emptyStates: GridStates = {
    empty: {
      title: catalogStrings.empty,
      description: catalogStrings.emptyHelp,
      action: (
        <Button tone="primary" onClick={() => setCreating(true)}>
          {catalogStrings.newArticle}
        </Button>
      ),
    },
    noMatches: {
      title: catalogStrings.noMatches,
      description: catalogStrings.noMatchesHelp,
      action: <Button onClick={() => table.filter('')}>{catalogStrings.clearFilter}</Button>,
    },
    filtered: table.filtered,
  }

  return (
    <Page title={catalogStrings.catalog}>
      <Region>
        <Block>
          <Table
            filters={
              <FilterBar
                /* Un solo filtro, y la consulta ya espera a que se levanten los
                   dedos: un botón sería un clic de más en cada búsqueda. Con un
                   segundo filtro esto pasa a ser `onApply`, y granito no deja
                   olvidarse. */
                applyOnChange
                hasFilters={table.search !== ''}
                onClear={() => table.filter('')}
                actions={
                  <ActionButton
                    tone="primary"
                    requires={createArticle.requires}
                    onClick={() => setCreating(true)}
                  >
                    {catalogStrings.newArticle}
                  </ActionButton>
                }
              >
                {/* Con `Field` y no con el control pelado: granito baja los botones
                    de la barra para alinearlos con el **control**, contando la
                    etiqueta y su canal. Sin etiqueta, el botón queda escalonado. */}
                <Field label={catalogStrings.name} size="medium">
                  {(props) => (
                    <TextInput
                      {...props}
                      value={table.search}
                      onChange={(event) => table.filter(event.target.value)}
                    />
                  )}
                </Field>
              </FilterBar>
            }
            {...resultOf(articles, emptyStates, strings)}
            rowId={(article) => String(article.id)}
            columns={[
              /* **El ancho es el reparto, no el ancho final** (`granito#PED-3`).
                 Sin declararlo las cuatro piden lo mismo, y «Estado» —una
                 palabra— se lleva tanto como «Nombre». La tabla ocupa lo que le
                 den y reparte el sobrante en proporción a lo pedido. */
              {
                id: 'name',
                header: catalogStrings.name,
                width: '320px',
                cell: (article) => article.name,
              },
              /* La celda devuelve el valor **crudo** y granito pone el texto, la
                 tipografía y la alineación. Y **qué es el dato sale del contrato**:
                 elegirlo a mano en cada grilla es cómo el mismo importe termina
                 viéndose distinto en dos pantallas (`CU-14`). */
              {
                id: 'price',
                header: catalogStrings.price,
                width: '140px',
                format: articleFields.price.displayAs,
                cell: (article) => article.price,
              },
              /* Un estado **cerrado** —dos valores— va como pastilla (`GR-67`).
                 Cuál tono le toca a cada valor lo decide esta pantalla; granito
                 recibe el tono y la palabra. No sirve para una lista que crece:
                 ahí habría que inventar un color por dato. */
              {
                id: 'active',
                header: catalogStrings.status,
                width: '130px',
                cell: (article) => (
                  <Badge tone={article.active ? 'success' : 'neutral'}>
                    {article.active ? catalogStrings.active : catalogStrings.inactive}
                  </Badge>
                ),
              },
              ...actions,
            ]}
            totalCount={articles.data?.meta.totalItems}
            /* **Dónde está parado el operador, y vive en la dirección**
               (`CU-47`, `granito#PED-12`). Con estado local se pierde al abrir
               la ficha, que es exactamente cuando hace falta.

               Estuvo desconectado hasta que granito resolvió `PED-16`: el clic
               de fila corría **después** del de la acción, así que la marca caía
               sobre la entrada nueva y le pisaba la pila. Ahora la fila escucha
               en captura, que corre antes que el manejador del botón — una
               garantía del DOM, no una lista de controles a adivinar. */
            /* **`null` y no `undefined`**, y la diferencia es toda: granito lee
               `undefined` como «esta grilla no tiene fila actual» y apaga la
               función entera. `null` es «no hay ninguna marcada todavía», que es
               lo que pasa al entrar. */
            currentRow={table.currentRow}
            onCurrentRowChange={table.setCurrentRow}
            onRowActivate={(article) =>
              emit(catalog.outcomes.articleChosen({ id: String(article.id) }))
            }
            caption={catalogStrings.articles}
          />

          <TablePagination meta={articles.data?.meta} onPageChange={table.setPage} />
        </Block>
      </Region>

      {creating ? <NewArticleDialog onClose={() => setCreating(false)} /> : null}
    </Page>
  )
}

/**
 * **La declaración de una pantalla: de acá sale todo lo demás.**
 *
 * De estos seis campos salen la entrada del menú, la ruta, el filtrado por
 * capacidad —en el menú **y** en la ruta— y el destino tipado de `goTo`. No hay
 * un segundo lugar donde registrarla: si no está acá, no existe.
 */
export const articlesScreen = defineScreen({
  /* Con qué la nombran las otras pantallas. Único en la aplicación. */
  id: 'articles',

  /* El texto del menú y del título, del catálogo de la funcionalidad. */
  title: catalogStrings.catalog,

  /* La URL. Con `:param` la vuelve tipada: ver `article-screen.tsx`. */
  path: '/catalog',

  /**
   * Qué tiene que habilitar la sesión para llegar.
   *
   * Filtra el menú **y** la ruta, con lo mismo. Es lo que evita el agujero de
   * ocultar la entrada y dejar la URL abierta a quien la escriba a mano.
   */
  capability: 'catalog:read',

  component: ArticlesScreen,
})
