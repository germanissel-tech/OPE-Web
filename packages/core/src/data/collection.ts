import { useInfiniteQuery } from '@tanstack/react-query'

/**
 * **Una colección paginada por cursor, sin total** (`ADR-020` del backend).
 *
 * Es la forma de todo `<X>Page` del contrato de OPE: los elementos de este tramo
 * y, si hay otro, el cursor opaco con el que pedirlo. **No hay recuento**, y
 * eso no es un olvido del contrato: un total exige contar, y contar es lo que
 * una paginación por cursor existe para no hacer.
 */
export type Collection<T> = {
  readonly items: readonly T[]
  /** Ausente en el último tramo. */
  readonly nextCursor?: string
}

/**
 * Lo que una grilla recibe de una colección: los tramos **acumulados y
 * aplanados**, y con qué pedir el siguiente.
 *
 * Lleva además los cuatro campos que `resultOf` ya lee —`data`, `error`,
 * `isPending`, `isFetching`, `refetch`—, así que la grilla no sabe si lo que
 * dibuja llegó de una vez o de a tramos.
 */
export type CollectionQuery<T> = {
  readonly items: readonly T[]
  /** Si el último tramo trajo cursor. Es lo que decide si «cargar más» se ofrece. */
  readonly hasMore: boolean
  /** Pide el tramo siguiente y, cuando llega, anota su cursor en la dirección. */
  readonly loadMore: () => Promise<void>
  /** Mientras llega el tramo siguiente. Lo demás se queda en pantalla. */
  readonly loadingMore: boolean
  readonly data: Collection<T> | undefined
  readonly error: unknown
  readonly isPending: boolean
  /** Una ida al servidor por el **primer** tramo o por una recarga; cargar más no cuenta. */
  readonly isFetching: boolean
  readonly refetch: () => void
}

export type CollectionOptions = {
  /**
   * El cursor desde el que arranca (`CU-47`): el que la dirección trae.
   *
   * **Un enlace con cursor reproduce ese tramo, no la acumulación**: es lo que
   * el servidor puede dar. Sin cursor arranca del principio.
   */
  readonly from?: string | undefined
  /**
   * Dónde anotar el cursor del tramo que acaba de llegar.
   *
   * Lo escribe la pantalla en la dirección (`useTableQuery.setCursor`), para que
   * volver de una ficha encuentre el mismo tramo. Se recibe y no se adivina: la
   * colección no sabe de rutas.
   */
  readonly onCursor?: (cursor: string | undefined) => void
}

/**
 * **Acumula tramos por cursor** sobre `useInfiniteQuery`.
 *
 * `fetchPage` recibe el cursor del tramo a pedir —`undefined` para el primero—
 * y devuelve la colección tal como el contrato la responde. Lo demás lo pone
 * esto: el encadenado por `nextCursor`, el aplanado, y qué cursor va a la
 * dirección.
 *
 * **Un `4xx` no se reintenta**: lo decide la caché de la raíz (`createQueryClient`),
 * y vale igual acá — un cursor viejo responde `400 validation-failed`, y
 * insistir sólo demora el error que el operador necesita ver. La salida es
 * `setCursor(undefined)`: volver al principio.
 */
export function useCollection<T>(
  key: readonly unknown[],
  fetchPage: (cursor: string | undefined) => Promise<Collection<T>>,
  options: CollectionOptions = {},
): CollectionQuery<T> {
  const { from, onCursor } = options

  const query = useInfiniteQuery({
    /* El cursor de arranque es parte de la clave: dos arranques distintos son
       dos acumulaciones distintas, y mezclarlas repetiría filas. */
    queryKey: [...key, { from: from ?? null }],
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: from,
    getNextPageParam: (last) => last.nextCursor,
    /* Lo anterior se queda mientras llega lo nuevo: sin esto, cambiar de filtro
       deja la grilla en blanco por medio segundo. */
    placeholderData: (previous) => previous,
  })

  const pages = query.data?.pages ?? []
  const items = pages.flatMap((page) => page.items)
  const last = pages.at(-1)

  return {
    items,
    hasMore: last?.nextCursor !== undefined,
    loadingMore: query.isFetchingNextPage,
    loadMore: async () => {
      if (!query.hasNextPage || query.isFetchingNextPage) return
      const result = await query.fetchNextPage()
      /* **El cursor del tramo que llegó, no el del siguiente**: es el que
         reproduce lo que el operador está viendo (`CU-47`). */
      const params = result.data?.pageParams ?? []
      const arrived = params.at(-1)
      if (typeof arrived === 'string') onCursor?.(arrived)
    },
    data: last === undefined ? undefined : { items, nextCursor: last.nextCursor },
    error: query.error ?? undefined,
    isPending: query.isPending,
    isFetching: query.isFetching && !query.isFetchingNextPage,
    refetch: () => {
      void query.refetch()
    },
  }
}
