import { Button } from '@granito/ui'
import { useStrings } from '../base/use-strings'

/**
 * **«Cargar más» para una colección por cursor, sin total** (`GR-17`, `OW-4`).
 *
 * El `LoadMore` de granito exige `totalItems` y decide «hay más» con
 * `loaded < totalItems`; su texto es «N de M». OPE pagina con `nextCursor` y
 * **sin recuento** (`ADR-020` del backend): pasarle un total inventado mentiría,
 * y pasarle `Infinity` dibuja «20 de ∞».
 *
 * Así que se compone acá con las piezas de granito —`Button` y texto—, sin una
 * clase ni un estilo propio (lo verifica `boundaries`). Dice «N cargados» y, al
 * final, «no hay más».
 *
 * **Es una propuesta a granito, no un reemplazo**: un `LoadMore` cuyo
 * `totalItems` sea opcional, o un `hasMore` explícito. Está escrita en
 * `docs/ope.md` (`OW-4`) con esta evidencia, y se lleva a granito desde granito.
 * Cuando granito la tenga, esto se borra y la grilla usa la suya.
 *
 * Lo que se conserva de `GR-17`: **un botón, nunca carga automática al llegar al
 * pie** — un límite de página invisible no se puede notar.
 */
export type LoadMoreCursorProps = {
  /** Cuántos hay en pantalla. */
  readonly loaded: number
  /** Si el último tramo trajo cursor. */
  readonly hasMore: boolean
  /** Mientras llega el tramo siguiente. */
  readonly loading?: boolean
  readonly onLoadMore: () => void
}

export function LoadMoreCursor({
  loaded,
  hasMore,
  loading = false,
  onLoadMore,
}: LoadMoreCursorProps) {
  const strings = useStrings()

  return (
    <nav aria-label={strings.loadMore}>
      <p>{strings.loadedCount(loaded)}</p>
      {hasMore ? (
        <Button onClick={onLoadMore} disabled={loading}>
          {loading ? strings.loading : strings.loadMore}
        </Button>
      ) : (
        <p>{strings.noMore}</p>
      )}
    </nav>
  )
}
