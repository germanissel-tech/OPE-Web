import { Pagination } from '@granito/ui'
import { isPaged, type Meta } from '../data/envelope'

/**
 * La paginación de una grilla, **derivada del sobre**.
 *
 * `meta` viene con forma fija por contrato, así que qué pasarle a la
 * `Pagination` de granito no es una decisión de ninguna pantalla: es una
 * traducción, y una traducción repetida en veinte pantallas es veinte
 * oportunidades de escribir un valor por omisión distinto.
 *
 * **Con una sola página no se dibuja.** Una paginación que dice «1 de 1» ocupa
 * lugar para no informar nada.
 *
 * **Y no hay ningún número escrito acá, empezando por el tamaño de página.** El
 * servidor declara el suyo en el contrato y **dice cuál usó** en cada respuesta
 * (`CU-14`). Un valor por omisión de este lado sería una segunda fuente que
 * nadie compara, y aparecería igual de plausible el día que el servidor cambie
 * el suyo.
 */
export function TablePagination({
  meta,
  onPageChange,
}: {
  /** El del sobre. Sin él —la consulta todavía no volvió— no hay nada que dibujar. */
  readonly meta: Meta | undefined
  readonly onPageChange: (page: number) => void
}) {
  if (!isPaged(meta) || meta.totalPages <= 1) return null

  return (
    <Pagination
      page={meta.page}
      totalPages={meta.totalPages}
      totalItems={meta.totalItems}
      pageSize={meta.size}
      onPageChange={onPageChange}
    />
  )
}
