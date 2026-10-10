import { Badge, Block, Button, FilterBar, Page, Region, Table } from '@granito/ui'
import {
  ActionButton,
  defineScreen,
  type GridStates,
  LoadMoreCursor,
  resultOf,
  useActionColumn,
  useFlow,
  useOutcome,
  useStrings,
  useTableQuery,
} from '@ope/core'
import { deactivateMerchant } from '../data/deactivate-merchant'
import { dayOf, displayNameOf, type Merchant, STATUS_TONE, useMerchants } from '../data/merchants'
import { merchants } from '../feature'
import { merchantsStrings } from '../strings'
import { RowActions } from './row-actions'

/**
 * **El hola mundo de OPE-Console**: la grilla de merchants, contra el backend.
 *
 * Lo que **no** hace, y es el punto: no dibuja la espera, ni el vacío, ni el
 * error. Declara qué decir en cada uno y `resultOf` pone el resto (`CU-24`).
 *
 * **Y no filtra**: `listMerchants` no tiene filtro en el contrato, así que la
 * barra de filtros **no se dibuja** y `filtered` es siempre falso. Filtrar en el
 * navegador sobre un tramo mentiría — diría «no hay» cuando lo que no hay es
 * en esas filas (`CU-14`). El día que el contrato filtre, la barra vuelve con
 * `useTableQuery.filter`, que ya está.
 *
 * **Pagina por cursor y sin total** (`ADR-020` del backend): «cargar más» es
 * un botón compuesto (`LoadMoreCursor`, `OW-4`), y el cursor del último tramo
 * viaja en la dirección para que un enlace reproduzca ese tramo (`CU-47`).
 */
function MerchantsScreen() {
  const { emit } = useOutcome()
  const flow = useFlow()
  const strings = useStrings()

  /* **El nombre es obligatorio** (`CU-14`): la dirección dice de qué grilla es
     cada cosa — `?merchants.c=…&merchants.row=mrc_7f`. */
  const table = useTableQuery('merchants')
  const collection = useMerchants({ from: table.cursor, onCursor: table.setCursor })

  /* De las acciones sale **si la columna existe**: sin ningún permiso, los
     controles escondidos dejarían un encabezado vacío (`CU-46`). */
  const actions = useActionColumn(
    [flow.toReach(merchants.outcomes.merchantChosen), deactivateMerchant],
    (merchant: Merchant) => <RowActions merchant={merchant} />,
  )

  /* «Nuevo» es un desenlace: la grilla no sabe que el alta es una pantalla ni
     cuál (`CU-47`); qué capacidad exige llegar se lo pregunta al flujo. */
  const requestMerchant = (from: string) => emit(merchants.outcomes.merchantRequested({ from }))

  /* Un solo vacío de verdad: sin filtro, «el filtro no da» no puede pasar. El
     tipo exige los dos y se declaran iguales, con `filtered: false` fijo. */
  const states: GridStates = {
    empty: {
      title: merchantsStrings.empty,
      description: merchantsStrings.emptyHelp,
      action: (
        <ActionButton
          tone="primary"
          {...flow.toReach(merchants.outcomes.merchantRequested)}
          onClick={() => requestMerchant('empty')}
        >
          {merchantsStrings.newMerchant}
        </ActionButton>
      ),
    },
    noMatches: { title: merchantsStrings.empty, description: merchantsStrings.emptyHelp },
    filtered: false,
  }

  const grid = resultOf(collection, states, strings)

  return (
    <Page title={merchantsStrings.merchants}>
      <Region>
        <Block>
          <Table
            {...grid}
            /* **Las acciones de la grilla viven en su barra** (`GR-38`), aunque
               no haya filtros: la barra es el lugar donde el operador aprende a
               buscar «nuevo». Es `ActionButton` y no `Button` porque llegar al
               alta exige `merchants:write`, y lo que un permiso no habilita
               **no se dibuja** (`CU-3`). `applyOnChange` es obligatorio en
               granito y acá no aplica a nada: no hay filtro que aplicar. */
            filters={
              <FilterBar
                applyOnChange
                actions={
                  <ActionButton
                    tone="primary"
                    {...flow.toReach(merchants.outcomes.merchantRequested)}
                    onClick={() => requestMerchant('grid')}
                  >
                    {merchantsStrings.newMerchant}
                  </ActionButton>
                }
              />
            }
            /* **Reintentar vuelve al principio**: un cursor viejo responde
               `400 validation-failed`, y pedir el mismo tramo otra vez daría lo
               mismo. `setCursor(undefined)` cambia la clave de la colección y
               arranca de cero. */
            error={{
              ...grid.error,
              action: <Button onClick={() => table.setCursor(undefined)}>{strings.retry}</Button>,
            }}
            rowId={(merchant) => merchant.merchantId}
            columns={[
              /* **El nombre reconoce al merchant** (feature 007, `ADR-045`); sin
                 nombre, el identificador en tipografía de código y nada
                 inventado. El identificador sigue en su columna: es lo que las
                 rutas, el registro y `curl` nombran. */
              {
                id: 'displayName',
                header: merchantsStrings.name,
                width: '260px',
                cell: (merchant) => displayNameOf(merchant) ?? <code>{merchant.merchantId}</code>,
              },
              {
                id: 'merchantId',
                header: merchantsStrings.merchantId,
                width: '220px',
                cell: (merchant) => merchant.merchantId,
              },
              /* Un estado **cerrado** —tres valores— va como pastilla (`GR-67`).
                 Cuál tono le toca a cada valor lo decide esta pantalla. */
              {
                id: 'status',
                header: merchantsStrings.status,
                width: '140px',
                cell: (merchant) => (
                  <Badge tone={STATUS_TONE[merchant.status]}>
                    {merchantsStrings[merchant.status]}
                  </Badge>
                ),
              },
              /* La celda devuelve el valor **crudo** y granito pone el formato
                 de fecha: definido una sola vez (`GR-32`). */
              {
                id: 'createdAt',
                header: merchantsStrings.createdAt,
                width: '160px',
                format: 'date',
                cell: (merchant) => dayOf(merchant.createdAt),
              },
              ...actions,
            ]}
            /* **Dónde está parado el operador, y vive en la dirección**
               (`CU-47`). `null` y no `undefined`: granito lee `undefined` como
               «esta grilla no tiene fila actual». */
            currentRow={table.currentRow}
            onCurrentRowChange={table.setCurrentRow}
            onRowActivate={(merchant) =>
              emit(merchants.outcomes.merchantChosen({ merchantId: merchant.merchantId }))
            }
            caption={merchantsStrings.merchantsCaption}
          />

          {/* Sólo con filas: sin ninguna, el vacío ya dice todo, y «0 cargados ·
              no hay más» debajo de «todavía no hay merchants» lo dice dos veces. */}
          {grid.rows.length > 0 ? (
            <LoadMoreCursor
              loaded={grid.rows.length}
              hasMore={collection.hasMore}
              loading={collection.loadingMore}
              onLoadMore={() => void collection.loadMore()}
            />
          ) : null}
        </Block>
      </Region>
    </Page>
  )
}

/**
 * **La declaración de una pantalla: de acá sale todo lo demás.**
 *
 * De estos campos salen la entrada del menú, la ruta, el filtrado por
 * capacidad —en el menú **y** en la ruta— y el destino tipado de `goTo`.
 */
export const merchantsScreen = defineScreen({
  id: 'merchants',
  title: merchantsStrings.merchants,
  path: '/merchants',
  /* Filtra el menú **y** la ruta, con lo mismo: es lo que evita el agujero de
     ocultar la entrada y dejar la URL abierta a quien la escriba a mano. */
  capability: 'merchants:read',
  component: MerchantsScreen,
})
