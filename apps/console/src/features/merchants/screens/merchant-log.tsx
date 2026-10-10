import { Badge, Button, Section, Table } from '@granito/ui'
import { type GridStates, LoadMoreCursor, resultOf, useStrings, useTableQuery } from '@ope/core'
import { When } from '../../../components/when'
import { useMerchantLog } from '../data/merchant-log'
import type { AdminEntry } from '../data/merchants'
import { merchantsStrings } from '../strings'

/**
 * **La sección del registro en la ficha**: quién hizo qué sobre este merchant.
 *
 * Es una colección más (`CU-24`, `OW-4`): declara qué decir en cada estado y el
 * marco pone el resto; el cursor viaja en la dirección como `log.c`, al lado
 * del identificador de la ruta, para que un enlace reproduzca el tramo. Sin
 * filtros: `listMerchantAdminLog` no filtra.
 *
 * Vive con el bloque sobre el que informa (`GR-38`): no es una pantalla aparte,
 * porque se lee junto al estado del merchant.
 */
export function MerchantLog({ merchantId }: { readonly merchantId: string }) {
  const strings = useStrings()
  const table = useTableQuery('log')
  const log = useMerchantLog(merchantId, { from: table.cursor, onCursor: table.setCursor })

  const states: GridStates = {
    empty: { title: merchantsStrings.logEmpty, description: merchantsStrings.logEmptyHelp },
    noMatches: { title: merchantsStrings.logEmpty, description: merchantsStrings.logEmptyHelp },
    filtered: false,
  }
  const grid = resultOf(log, states, strings)

  return (
    <Section title={merchantsStrings.log}>
      <Table
        {...grid}
        error={{
          ...grid.error,
          action: <Button onClick={() => table.setCursor(undefined)}>{strings.retry}</Button>,
        }}
        /* El contrato no da identificador de entrada: dos acciones iguales del
           mismo operador en el mismo milisegundo serían una fila repetida, y
           se acepta — es un registro, no un ABM. */
        rowId={(entry) => `${entry.at}|${entry.operatorId}|${entry.operation}`}
        columns={[
          /* Granito formatea fechas y no instantes; se compone fecha y hora,
             y **la zona se dice** en el encabezado: convertir sin decirlo
             mentiría en una auditoría. */
          {
            id: 'at',
            header: merchantsStrings.atUtc,
            width: '170px',
            cell: (entry) => <When instant={entry.at} />,
          },
          {
            id: 'operatorId',
            header: merchantsStrings.operator,
            width: '120px',
            cell: (entry) => entry.operatorId,
          },
          {
            id: 'operation',
            header: merchantsStrings.operation,
            width: '170px',
            cell: (entry) => entry.operation,
          },
          /* Un estado **cerrado** va como pastilla (`GR-67`). */
          {
            id: 'outcome',
            header: merchantsStrings.outcome,
            width: '110px',
            cell: (entry) => (
              <Badge tone={OUTCOME_TONE[entry.outcome]}>{merchantsStrings[entry.outcome]}</Badge>
            ),
          },
          {
            id: 'code',
            header: merchantsStrings.code,
            width: '190px',
            cell: (entry) => entry.code ?? '',
          },
        ]}
        currentRow={table.currentRow}
        onCurrentRowChange={table.setCurrentRow}
        caption={merchantsStrings.logCaption}
      />
      {grid.rows.length > 0 ? (
        <LoadMoreCursor
          loaded={grid.rows.length}
          hasMore={log.hasMore}
          loading={log.loadingMore}
          onLoadMore={() => void log.loadMore()}
        />
      ) : null}
    </Section>
  )
}

/** El tono de cada resultado del contrato: aceptado va bien, rechazado avisa, denegado alarma. */
const OUTCOME_TONE = {
  accepted: 'success',
  rejected: 'warning',
  denied: 'error',
} as const satisfies Record<AdminEntry['outcome'], string>
