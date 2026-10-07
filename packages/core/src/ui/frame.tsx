import { AppShell, Brand, type NavItem, NavList, NotificationHost } from '@granito/ui'
import { type MouseEvent, type ReactNode, useState } from 'react'
import type { UserMenuEntry } from '../base/manifest'
import { tooltips as tooltipsPreference } from '../base/preferences/tooltips'
import { usePreferences } from '../base/use-preferences'
import { useStrings } from '../base/use-strings'
import { useNoticeHost } from './use-notices'
import { UserBar } from './user-bar'

/**
 * El marco de la aplicación: `AppShell` de granito, armado.
 *
 * **Nada se redibuja acá** (principio IV). Lo que se ve es de granito; lo que
 * se decide acá es **cuándo** se usa cada cosa y **de dónde salen los datos**.
 *
 * Los cuatro lugares del shell, y quién los llena:
 *
 * | | |
 * |---|---|
 * | `brand` | La marca. Sólo dice en qué aplicación estás |
 * | `nav` | **Los flujos que el menú declara** (`CU-48`), ya filtrados por capacidad |
 * | `center` | Existe y va vacío. Qué puede ir es `CU-28`, **y está abierta** |
 * | `globalActions` | La barra de usuario (`CU-27`) |
 *
 * **`tooltips` se pone acá y en ningún otro lado.** granito lo reparte por el
 * contexto del shell, y cada `Tooltip` lo lee: pasarlo campo por campo sería
 * la segunda fuente que un día no coincide.
 *
 * `NotificationHost` va acá y no en cada pantalla: los avisos de `CU-25` no
 * pertenecen a ninguna.
 */

export type FrameProps = {
  readonly appName: string
  /** Ya filtrados por capacidad. granito no absorbe esa política, y hace bien. */
  readonly navigation?: NavItem[]
  /**
   * **Qué hacer al activar un ítem del menú lateral**, y no es opcional de
   * hecho aunque el tipo lo permita.
   *
   * El `Leaf` de granito es un `<a href>` de verdad: sin un manejador que haga
   * `preventDefault`, el navegador **recarga la aplicación entera**. Se pierde
   * lo escrito sin preguntar —el ruteador nunca se entera, así que el aviso de
   * `CU-47` no llega a dispararse—, se tira la caché y se rehace el arranque de
   * sesión.
   *
   * **Y se ve bien**: una recarga se parece bastante a una navegación que
   * funciona, así que el defecto no aparece mirando la pantalla.
   */
  readonly onNavigate?: (item: NavItem, event: MouseEvent) => void
  readonly userCaption: string | undefined
  readonly menuEntries?: readonly UserMenuEntry[]
  readonly children?: ReactNode
}

export function Frame({
  appName,
  navigation = [],
  onNavigate,
  userCaption,
  menuEntries,
  children,
}: FrameProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { read } = usePreferences()
  const strings = useStrings()
  const notices = useNoticeHost()

  /**
   * **La única preferencia que el marco lee por nombre**, y por una razón
   * concreta: no se aplica al documento como el tema, sino que es una prop del
   * `AppShell`, que la reparte por contexto a cada `Tooltip`. Alguien tiene
   * que ponerla, y es acá — una sola vez, no control por control.
   *
   * Si la aplicación no la declaró, no existe: `parse` devuelve el inicial.
   */
  const tooltips = read(tooltipsPreference)

  /**
   * **El grupo donde está parado el operador se abre solo** (`CU-48`).
   *
   * `buildMenu` marca cuál grupo es el actual, y sin esto ese dato **se
   * calculaba y se tiraba**: `NavList` decide qué está desplegado con
   * `openGroups`, no con `current`. El resultado era que al recargar sobre una
   * pantalla de una sección, su grupo aparecía **cerrado** — el ítem donde estás
   * no se ve, y nada dice en qué sección estás. Hacía falta un clic para
   * encontrarse.
   *
   * Se ajusta **durante el dibujo** y no con un efecto, así que el menú nunca se
   * pinta cerrado para abrirse después. Y se agrega en vez de reemplazar: lo que
   * el operador abrió a mano sigue abierto, y puede cerrar el actual si quiere.
   */
  const current = navigation.find((item) => item.children && item.current)?.id

  const [open, setOpen] = useState<{ ids: string[]; from: string | undefined }>({
    ids: current ? [current] : [],
    from: current,
  })

  if (open.from !== current) {
    setOpen({
      ids: current && !open.ids.includes(current) ? [...open.ids, current] : open.ids,
      from: current,
    })
  }

  return (
    <>
      <AppShell
        brand={<Brand label={appName} />}
        nav={
          navigation.length > 0 ? (
            <NavList
              items={navigation}
              onNavigate={onNavigate}
              openGroups={open.ids}
              onOpenGroupsChange={(ids) => setOpen({ ids, from: current })}
            />
          ) : undefined
        }
        globalActions={<UserBar caption={userCaption} entries={menuEntries} />}
        tooltips={tooltips}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((was) => !was)}
      >
        {children}
      </AppShell>

      {/* Los avisos aterrizan por encima de todo, incluido el velo de un
          diálogo. Vive acá porque no pertenece a ninguna pantalla (`CU-25`). */}
      <NotificationHost
        notifications={notices.notifications}
        onDismiss={notices.dismiss}
        aria-label={strings.notices}
      />
    </>
  )
}
