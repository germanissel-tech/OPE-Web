import { Identity, Menu, type MenuOption } from '@granito/ui'
import { useSession, useSessionControl } from '@ope/session'
import { useRef, useState } from 'react'
import type { UserMenuEntry } from '../base/manifest'
import { usePreferences } from '../base/use-preferences'
import { useStrings } from '../base/use-strings'
import { useFlow } from '../data/use-flow'

/**
 * **La barra de usuario la arma el esqueleto** (`CU-27`): quién está, y qué
 * puede hacer consigo mismo. La aplicación aporta una sola cosa — el rótulo.
 *
 * De dónde sale cada parte:
 *
 * - **Nombre e iniciales**, de claims **estándar** de OIDC. El esqueleto los
 *   deriva **sin saber quién es el proveedor**, así que la aplicación no los
 *   pasa.
 * - **El rótulo de abajo** —«Administradora»— no es estándar: es la misma
 *   traducción de claims a negocio que la aplicación ya hace para las
 *   capacidades.
 * - **Cerrar sesión** es `signOut()`, que termina la sesión de **todas** las
 *   aplicaciones (`CU-12`).
 */

export type UserBarProps = {
  /** Lo que la aplicación traduce de los claims. Ver `CU-27`. */
  readonly caption?: string
  /**
   * Lo de la aplicación va **arriba del separador**. Cerrar sesión queda abajo
   * siempre, para que un operador que pasa de una aplicación a otra encuentre
   * lo mismo en el mismo lugar — que es el objetivo de `CU-20`.
   */
  readonly entries?: readonly UserMenuEntry[]
}

/** De `name` o `preferred_username`. Los dos son estándar de OIDC. */
function nameFrom(claims: Readonly<Record<string, unknown>> | undefined, noName: string): string {
  const name = claims?.name
  if (typeof name === 'string' && name.trim()) return name
  const username = claims?.preferred_username
  if (typeof username === 'string' && username.trim()) return username
  return noName
}

function initialsFrom(name: string): string {
  const words = name.split(/\s+/).filter(Boolean).slice(0, 2)
  return words.map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'
}

export function UserBar({ caption, entries = [] }: UserBarProps) {
  const session = useSession()
  const { signOut } = useSessionControl()
  const anchor = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const flow = useFlow()
  const { rows } = usePreferences()
  const strings = useStrings()

  const name = nameFrom(session.claims, strings.noName)

  /**
   * **Cerrar sesión es obligatorio, va último, y con tono de peligro.**
   *
   * No hay forma de que una aplicación lo quite: si pudiera, el operador se
   * quedaría sin salida — y eso no es una preferencia. Por eso se arma acá
   * abajo de todo en vez de recibirse.
   */
  const own: MenuOption[] = entries.map((entry) => ({
    id: entry.id,
    label: entry.label,
    onSelect: () => {
      setOpen(false)
      /* Las dos, y en este orden: abrir un diálogo o disparar una acción pasa
         antes de irse de la pantalla (`CU-27`). */
      entry.onSelect?.()
      /* **Apila sobre el flujo activo**: cerrar «Acerca de» devuelve a donde
         estabas, y no a la raíz (`CU-47`). */
      if (entry.screen) flow.visit(entry.screen)
    },
  }))

  /**
   * **Las preferencias del operador, no acciones de la aplicación** (`CU-26`).
   *
   * Llegan resueltas: qué dice cada renglón y qué hace al elegirlo lo declara
   * la propia preferencia, y las que quedaron fijas **no vienen** (`CU-27`).
   * Acá no se sabe cuáles son ni cuántas, que es lo que hace que agregar una
   * no toque este archivo.
   */
  const switches: MenuOption[] = rows.map((row) => ({
    id: row.id,
    label: row.label,
    icon: row.icon,
    onSelect: () => {
      setOpen(false)
      row.select()
    },
  }))

  const beforeSignOut = [...own, ...switches]

  const options: MenuOption[] = [
    ...beforeSignOut,
    ...(beforeSignOut.length > 0 ? [{ kind: 'separator' as const, id: 'before-sign-out' }] : []),
    {
      id: 'sign-out',
      label: strings.signOut,
      tone: 'danger',
      onSelect: () => {
        setOpen(false)
        void signOut()
      },
    },
  ]

  return (
    <>
      <Identity
        ref={anchor}
        initials={initialsFrom(name)}
        name={name}
        caption={caption}
        expanded={open}
        onClick={() => setOpen((was) => !was)}
      />
      <Menu open={open} anchor={anchor} onClose={() => setOpen(false)} options={options} />
    </>
  )
}
