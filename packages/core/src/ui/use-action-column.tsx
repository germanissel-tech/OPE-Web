import type { Column } from '@granito/ui'
import type { ReactNode } from 'react'
import { useCapabilities } from '../base/routes'
import { isEnabled } from '../data/action'

/**
 * La columna de acciones de una grilla, **o ninguna** (`CU-46`, `CU-3`).
 *
 * `ActionButton` esconde cada botón que el permiso no habilita, y con veinte
 * filas eso deja **una columna vacía con su encabezado**: ruido con otra forma.
 * La columna entera tiene que salir del mismo permiso.
 *
 * Devuelve una lista para poder desparramarla sin ternario:
 *
 * ```tsx
 * const actions = useActionColumn([toReach(fichaScreen), anular], (a) => <Acciones article={a} />)
 * <Table columns={[...columnas, ...actions]} />
 * ```
 *
 * **Y declara su ancho, que ninguna pantalla tiene por qué saber.** Sin él la
 * columna pide lo mismo que las demás y un botón de 80px se queda con un cuarto
 * de la tabla — el ancho de una grilla es el **reparto**, no el ancho final
 * (`granito#PED-3`). Acá se puede porque **esto sabe qué va adentro**: botones.
 *
 * **La celda tiene que ser un componente, no un botón suelto.** Parece lo mismo
 * y no lo es: con un `useAction` de la pantalla, `running` es de la pantalla
 * —ejecutar una fila apaga las veinte— y la clave de idempotencia recuerda un
 * solo cuerpo, así que reintentar una fila anterior sale con clave nueva y el
 * servidor la aplica dos veces (`CU-34`). Un componente por fila lo resuelve
 * por alcance, que es lo que React ya hace.
 */
/** Lo que pide una columna de botones. Es el reparto, no el ancho final. */
const ACTION_WIDTH = '124px'

export function useActionColumn<T>(
  /**
   * De acá sale el permiso. Son **las acciones que la celda dibuja**, no una:
   * la columna existe si **alguna** está habilitada, y adentro cada control se
   * esconde solo. Con una sola no alcanzaba — abrir el registro y cambiarle el
   * estado pueden depender de permisos distintos, y entonces la columna estaría
   * atada al permiso equivocado.
   *
   * Lo que navega entra con `toReach(pantalla)`, que da la misma forma.
   */
  actions: ReadonlyArray<{ readonly requires: readonly string[] }>,
  cell: (row: T) => ReactNode,
  /** Vacío por omisión: una columna de botones no necesita rótulo. */
  header: ReactNode = '',
): readonly Column<T>[] {
  const capabilities = useCapabilities()

  if (!actions.some((each) => isEnabled(each, capabilities))) return []

  return [{ id: 'actions', header, cell, width: ACTION_WIDTH }]
}
