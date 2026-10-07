/**
 * **El menú lateral se declara** (`CU-48`), y esto sólo lo dibuja.
 *
 * Devuelve los `NavItem` que espera `NavList` de granito, **ya filtrados**:
 * granito no absorbe la política de quién ve qué, y hace bien — el día que otra
 * aplicación use el mismo shell va a tener otra política y el mismo componente.
 *
 * **Acá no hay ninguna regla propia.** El orden es el de la lista, lo que se
 * ofrece es lo que está en ella, y qué exige cada flujo lo dice su raíz. Lo
 * único que esto decide es **qué esconder**, y eso es `CU-3`.
 *
 * **Un grupo sin ningún ítem visible desaparece.** Un grupo vacío parece un
 * error de carga, y a un operador con menos permisos le muestra la forma de lo
 * que no puede hacer.
 */

import type { NavItem } from '@granito/ui'
import { type Flow, isGroup, type MenuEntry } from '../base/flow'
import { buildUrl } from '../base/go-to'
import { isVisible } from '../base/registry'

export function buildMenu(
  menu: readonly MenuEntry[],
  capabilities: ReadonlySet<string>,
  currentPath?: string,
): NavItem[] {
  const items: NavItem[] = []

  for (const entry of menu) {
    if (!isGroup(entry)) {
      const item = toItem(entry, capabilities, currentPath)
      if (item) items.push(item)
      continue
    }

    const children = entry.items
      .map((flow) => toItem(flow, capabilities, currentPath))
      .filter((item): item is NavItem => item !== undefined)

    if (children.length === 0) continue

    items.push({
      id: `group:${entry.label}`,
      label: entry.label,
      icon: entry.icon,
      children,
      /* Un grupo se marca actual si alguno de sus hijos lo está. */
      current: children.some((child) => child.current),
    })
  }

  return items
}

/** El ítem de un flujo, o nada si esta sesión no puede entrar a su raíz. */
function toItem(
  flow: Flow,
  capabilities: ReadonlySet<string>,
  currentPath?: string,
): NavItem | undefined {
  const root = flow.root

  /* La capacidad la decide **la raíz**: si el operador no puede entrar, el flujo
     entero no se ofrece (`CU-3`). */
  if (!isVisible(root, capabilities)) return undefined

  return {
    id: flow.id,
    /* **El rótulo se deriva, y el flujo puede pisarlo** (`CU-47`): en el caso
       normal la cabecera y el menú dicen lo mismo, y escribirlo dos veces es la
       segunda fuente que un día no coincide. */
    label: flow.label ?? root.title,
    icon: flow.icon,
    href: buildUrl(root, {} as never),
    /* También cuando se está en una ruta hija: entrar a una ficha no saca al
       operador de la sección desde la que llegó. */
    current: currentPath === root.path || currentPath?.startsWith(`${root.path}/`) === true,
  }
}
