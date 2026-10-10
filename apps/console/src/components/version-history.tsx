import { Badge, Button, type Column, Section, Table } from '@granito/ui'
import {
  type CollectionQuery,
  type GridStates,
  LoadMoreCursor,
  resultOf,
  type TableQuery,
  useStrings,
} from '@ope/core'
import { sharedStrings } from './strings'
import { When } from './when'

/** Lo que tiene toda versión publicada, en los tres niveles (feature 008). */
export type VersionRow = {
  readonly version: number
  readonly publishedAt: string
  readonly operatorId: string
  readonly corrective: boolean
  readonly reason?: string
}

/**
 * **El historial de versiones de un nivel de configuración** (research §11).
 *
 * Una colección como el registro del merchant (`OW-4`): de a tramos, con
 * «cargar más» y el cursor en la dirección. Lo usan la configuración del
 * merchant, la plataforma y los defaults, y cada una puede sumar columnas —el
 * nombre de una versión global, las mediciones que reinició— sin que esto sepa
 * qué nivel es.
 *
 * Correctiva va como pastilla (`GR-67`): es un estado cerrado, y es lo que hay
 * que ver de un vistazo en un historial.
 */
export function VersionHistory<T extends VersionRow>({
  versions,
  table,
  extra = [],
  onOpen,
}: {
  readonly versions: CollectionQuery<T>
  readonly table: TableQuery
  /** Columnas propias del nivel, después de la versión. */
  readonly extra?: readonly Column<T>[]
  /** Si una versión se puede abrir: la columna de la derecha la ofrece. */
  readonly onOpen?: (row: T) => void
}) {
  const strings = useStrings()
  const states: GridStates = {
    empty: { title: sharedStrings.noVersions, description: sharedStrings.noVersionsHelp },
    noMatches: { title: sharedStrings.noVersions, description: sharedStrings.noVersionsHelp },
    filtered: false,
  }
  const grid = resultOf(versions, states, strings)

  const columns: Column<T>[] = [
    {
      id: 'version',
      header: sharedStrings.version,
      width: '90px',
      cell: (row) => String(row.version),
    },
    ...extra,
    {
      id: 'publishedAt',
      header: sharedStrings.publishedAtUtc,
      width: '170px',
      cell: (row) => <When instant={row.publishedAt} />,
    },
    {
      id: 'operatorId',
      header: sharedStrings.operator,
      width: '130px',
      cell: (row) => row.operatorId,
    },
    {
      id: 'corrective',
      header: sharedStrings.kind,
      width: '120px',
      cell: (row) =>
        row.corrective ? (
          <Badge tone="warning">{sharedStrings.corrective}</Badge>
        ) : (
          <Badge tone="neutral">{sharedStrings.regular}</Badge>
        ),
    },
    {
      id: 'reason',
      header: sharedStrings.reason,
      cell: (row) => row.reason ?? '',
    },
    ...(onOpen
      ? [
          {
            id: 'open',
            header: '',
            width: '130px',
            cell: (row: T) => (
              <Button type="button" size="compact" onClick={() => onOpen(row)}>
                {sharedStrings.openVersion}
              </Button>
            ),
          },
        ]
      : []),
  ]

  return (
    <Section title={sharedStrings.versions}>
      <Table
        {...grid}
        error={{
          ...grid.error,
          action: <Button onClick={() => table.setCursor(undefined)}>{strings.retry}</Button>,
        }}
        rowId={(row) => String(row.version)}
        columns={columns}
        currentRow={table.currentRow}
        onCurrentRowChange={table.setCurrentRow}
        caption={sharedStrings.versionsCaption}
      />
      {grid.rows.length > 0 ? (
        <LoadMoreCursor
          loaded={grid.rows.length}
          hasMore={versions.hasMore}
          loading={versions.loadingMore}
          onLoadMore={() => void versions.loadMore()}
        />
      ) : null}
    </Section>
  )
}
