import type { Notification } from '@granito/ui'
import { createContext, type ReactNode, useContext, useMemo, useState } from 'react'
import { Failure } from '../base/failure'
import { type Notice, NoticesContext, type NoticesPort } from '../base/notices'

/**
 * **Dónde aterrizan los avisos** (`CU-25`).
 *
 * El puerto vive en `base` y lo que dice cada uno en la puerta de acciones; acá
 * está sólo **quién los sostiene y quién los dibuja**, que es lo único de los
 * tres que es interfaz.
 *
 * La lista vive en la aplicación y no adentro de granito: su paquete publica el
 * anfitrión y el tipo, y **quién los junta es de este lado**.
 */

/** Lo que el marco necesita para dibujarlos. Sólo lo usa `Frame`. */
type Host = {
  readonly notifications: Notification[]
  readonly dismiss: (id: string) => void
}

const HostContext = createContext<Host | null>(null)

export function NoticesProvider({ children }: { readonly children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const port = useMemo<NoticesPort>(
    () => ({
      notify: (notice: Notice) => {
        /* Un identificador que no se repite. Con la hora, dos avisos del mismo
           milisegundo compartirían clave y React redibujaría uno solo. */
        setNotifications((current) => [...current, { ...notice, id: crypto.randomUUID() }])
      },
    }),
    [],
  )

  const host = useMemo<Host>(
    () => ({
      notifications,
      dismiss: (id) => setNotifications((current) => current.filter((each) => each.id !== id)),
    }),
    [notifications],
  )

  return (
    <NoticesContext.Provider value={port}>
      <HostContext.Provider value={host}>{children}</HostContext.Provider>
    </NoticesContext.Provider>
  )
}

export function useNoticeHost(): Host {
  const host = useContext(HostContext)
  if (!host) {
    throw new Failure(
      'wiring.outsideProvider',
      'useNoticeHost() fuera de NoticesProvider. Los avisos los provee la raíz de composición.',
    )
  }
  return host
}
