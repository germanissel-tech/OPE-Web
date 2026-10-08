import { Alert, type NavItem } from '@granito/ui'
import { createContext, type MouseEvent, type ReactNode, useContext, useEffect } from 'react'
import { createBrowserRouter, Outlet, RouterProvider, useLocation } from 'react-router'
import { Failure } from '../base/failure'
import { buildUrl, NavigationProvider } from '../base/go-to'
import type { ApplicationManifest, UserMenuEntry } from '../base/manifest'
import { createRegistry } from '../base/registry'
import { AuthorizationProvider, buildRoutes, useCapabilities } from '../base/routes'
import type { NavigationPort } from '../base/services'
import type { SessionStatusName, SessionViewContext, SessionViews } from '../base/session-views'
import { type OutcomePort, OutcomeProvider } from '../base/use-outcome'
import { useStrings } from '../base/use-strings'
import { verifyFlows } from '../base/verify-flows'
import {
  applyMove,
  type FlowContextData,
  type FlowNavigator,
  moveFor,
  stateAt,
} from '../data/dispatch-flow'
import { FlowProvider, useFlow } from '../data/use-flow'
import { buildMenu } from '../ui/menu'
import { ScreenError } from '../ui/screen-error'
import { defaultSessionViews, Forbidden } from '../ui/session-views'
import { UnsavedWorkProvider } from '../ui/unsaved-work'

/**
 * **El cableado del marco**, publicado y no copiado (`CU-42`).
 *
 * Puede vivir acá porque **no conoce ninguna funcionalidad**: recibe lo que el
 * manifiesto declara. Y por eso un arreglo del camino de falla de la sesión les
 * llega a las cuatro aplicaciones con `npm update`.
 */

/** Lo que el marco necesita del anfitrión para dibujar el shell. */
export type Chrome = (props: {
  readonly appName: string
  readonly navigation: ReturnType<typeof buildMenu>
  /**
   * **Se pasa al `NavList`, y no es decorativo** (`CU-47`).
   *
   * Los ítems del menú son enlaces de verdad, así que sin esto el navegador
   * recarga la aplicación entera y el aviso de trabajo sin guardar no llega a
   * dispararse. Un chrome propio que lo ignore reintroduce ese defecto.
   */
  readonly onNavigate: (item: NavItem, event: MouseEvent) => void
  readonly userCaption: string | undefined
  /** Lo que la aplicación agrega al menú de usuario, arriba del separador (`CU-27`). */
  readonly menuEntries: readonly UserMenuEntry[]
  readonly children: ReactNode
}) => ReactNode

/**
 * El rótulo de la barra llega **por contexto y no por prop de ruta**: el
 * ruteador se arma una vez, y el rótulo cambia con la sesión (`CU-27`).
 */
const UserCaptionContext = createContext<string | undefined>(undefined)

/**
 * Arma lo que tiene **ciclo de vida**. Se llama **una sola vez**, desde el punto
 * de entrada — nunca desde un render (`CU-36`).
 */
export function createApplication(manifest: ApplicationManifest, chrome: Chrome) {
  const screens = createRegistry([...manifest.screens])
  const forbidden = manifest.forbidden ?? <Forbidden />

  function Shell() {
    const capabilities = useCapabilities()
    const location = useLocation()
    const userCaption = useContext(UserCaptionContext)
    const flow = useFlow()

    /**
     * **La pestaña dice lo mismo que la barra**, y sale del mismo lugar: el
     * nombre del manifiesto y el título que la pantalla ya declara (`CU-2`,
     * `CU-23`). El `title` de `index.html` es sólo lo que se ve antes de que
     * corra esto.
     */
    useEffect(() => {
      const current = screens.find(({ path }) => matchesPath(path, location.pathname))
      document.title = current ? `${current.title} · ${manifest.name}` : manifest.name
    }, [location.pathname])
    return chrome({
      appName: manifest.name,
      navigation: buildMenu(manifest.menu ?? [], capabilities, location.pathname),
      /**
       * **El menú lateral abandona el flujo y empieza el nuevo** (`CU-47`), que
       * es la otra mitad de lo que el menú de usuario hace apilando.
       *
       * El `preventDefault` es lo que lo vuelve una navegación del ruteador: sin
       * él el navegador se lleva la página entera, y con ella el bloqueo que
       * sostiene el aviso de trabajo sin guardar.
       *
       * **El id del ítem es el del flujo** —lo pone `buildMenu`—, y si no
       * resuelve, `applyMove` falla nombrándolo. Los grupos no llegan acá: su
       * cabecera despliega, no navega.
       */
      onNavigate: (item, event) => {
        event.preventDefault()
        flow.enter(item.id)
      },
      userCaption,
      menuEntries: manifest.userMenu?.entries ?? [],
      /* **Adentro del ruteador**: el bloqueo que sostiene el aviso de trabajo
         sin guardar lo ofrece el ruteador de datos, y afuera revienta al
         montar (`CU-47`). */
      children: (
        <UnsavedWorkProvider>
          <Outlet />
        </UnsavedWorkProvider>
      ),
    })
  }

  /**
   * **Una pantalla que declara `/` es la de inicio**, y reemplaza a la que trae
   * el marco.
   *
   * Se separa porque como hija su ruta quedaría vacía, y el índice por omisión
   * se la come sin que nada avise: la pantalla queda declarada y no se ve.
   */
  /* **Acá se juntan las dos capas**: el ruteador es `base` y el límite de error
     es `ui`, y componerlos es lo que hace la raíz (`CU-36`, `CU-40`). */
  const routes = buildRoutes(screens, (screen, content) => (
    <ScreenError screen={screen}>{content}</ScreenError>
  ))
  const home = routes.find(({ path }) => path === '/')
  const rest = routes.filter(({ path }) => path !== '/')

  const router = createBrowserRouter([
    {
      path: '/',
      element: <Shell />,
      children: [
        ...rest.map(({ path, element }) => ({ path: path.slice(1), element })),
        { index: true, element: home?.element ?? <NoHomeDeclared /> },
        /* **Una URL que no existe es hija del marco, no una pantalla en blanco.**
           Sin esto se ve el error del ruteador —en inglés, y sin navegación—, que
           es lo mismo que `CU-30` rechaza para una pantalla que revienta, y por
           la razón que ahí está escrita.

           Y pasa más de lo que parece: un enlace viejo, un favorito de una ruta
           que se renombró, un dedazo en la barra. */
        { path: '*', element: <UnknownRoute /> },
      ],
    },
  ])

  /* El puerto se arma del ruteador de verdad y sin pasar por un efecto: fijarlo
     desde un efecto deja una ventana donde navegar todavía no funciona. */
  const navigation: NavigationPort = {
    goTo: (...args) => {
      const [screen, params] = args
      void router.navigate(buildUrl(screen, params ?? ({} as never)))
    },
  }

  /**
   * **Los flujos se revisan antes de dibujar nada** (`CU-47`).
   *
   * Seis, y se listan **todas**: quien arregla una quiere saber si quedan otras
   * antes de volver a levantar.
   *
   */
  const flowProblems = verifyFlows({
    flows: manifest.flows ?? [],
    screens: manifest.screens,
    featureRootOf: manifest.featureRootOf,
    outcomes: manifest.outcomes ?? [],
    outcomesOf: manifest.outcomesOf,
    menu: manifest.menu ?? [],
  })

  if (flowProblems.length > 0) {
    const listed = flowProblems.map((each) => `  · ${each}`).join('\n')
    throw new Failure('declaration.brokenFlows', `Los flujos no cierran:\n\n${listed}`)
  }

  const wiring: FlowContextData = {
    flows: manifest.flows ?? [],
    featureRootOf: manifest.featureRootOf,
    screens: manifest.screens,
  }

  /**
   * El ruteador de verdad, detrás de un puerto de dos métodos.
   *
   * Que el despacho no lo nombre es lo que permite probarlo con uno de mentira,
   * y lo que deja las transiciones en `base` sin saber que existe React.
   */
  const navigator: FlowNavigator = {
    back: (steps) => {
      void router.navigate(-steps)
    },
    visit: (url, state, replace) => {
      void router.navigate(url, { state, replace })
    },
  }

  const outcome: OutcomePort = {
    emit: (event) => {
      /* **Dónde estamos se pregunta al ruteador, no se recuerda.** Guardarlo
         acá sería la copia que el botón «atrás» desincroniza. */
      const at = router.state.location
      const state = stateAt(at.pathname, at.state, wiring)
      if (!state) {
        throw new Failure(
          'navigation.unknownOutcome',
          `Se informó "${event.id}" desde "${at.pathname}", que ninguna pantalla declara.`,
        )
      }

      applyMove(moveFor(event, state, wiring), wiring, navigator)
    },
  }

  const views: SessionViews = { ...defaultSessionViews, ...manifest.sessionViews }

  return { screens, router, navigation, outcome, views, forbidden, wiring }
}

export type Application = ReturnType<typeof createApplication>

/**
 * Dibuja **el estado de sesión que corresponda**, buscando su vista en el mapa.
 *
 * No hay `switch`: el mapa está tipado sobre los siete estados, así que agregar
 * uno **no compila** hasta que tenga vista (`CU-42`).
 */
export function ApplicationView({
  application,
  status,
  capabilities,
  endReason,
  reenter,
  signIn,
  userCaption,
  waitThresholdMs,
}: {
  readonly application: Application
  readonly status: SessionStatusName
  readonly capabilities: ReadonlySet<string>
  readonly endReason: string | undefined
  readonly reenter: () => void
  readonly signIn: SessionViewContext['signIn']
  readonly userCaption: string | undefined
  readonly waitThresholdMs: number
}) {
  const view = application.views[status]
  const strings = useStrings()

  return (
    <UserCaptionContext.Provider value={userCaption}>
      <NavigationProvider value={application.navigation}>
        <FlowProvider value={application.wiring}>
          <OutcomeProvider value={application.outcome}>
            <AuthorizationProvider capabilities={capabilities} forbidden={application.forbidden}>
              {view({
                endReason,
                reenter,
                signIn,
                waitThresholdMs,
                strings,
                application: <RouterProvider router={application.router} />,
              })}
            </AuthorizationProvider>
          </OutcomeProvider>
        </FlowProvider>
      </NavigationProvider>
    </UserCaptionContext.Provider>
  )
}

/** Si la ruta declarada coincide con la URL, contando los parámetros. */
function matchesPath(declared: string, actual: string): boolean {
  const a = declared.split('/')
  const b = actual.split('/')
  if (a.length !== b.length) return false
  return a.every((part, i) => part.startsWith(':') || part === b[i])
}

/**
 * Lo que se ve en una URL que ninguna pantalla declara.
 *
 * **No redirige a inicio**, y `CU-17` dice por qué. Se dice qué pasó, y la
 * navegación está ahí para irse.
 */
function UnknownRoute() {
  const strings = useStrings()

  return (
    <Alert severity="warning" title={strings.unknownRoute}>
      {strings.unknownRouteDetail}
    </Alert>
  )
}

/** Lo que se ve en `/` mientras la aplicación no declare una pantalla de inicio. */
function NoHomeDeclared() {
  const strings = useStrings()

  return (
    <Alert severity="info" title={strings.noHomeDeclared}>
      {strings.noHomeDeclaredDetail}
    </Alert>
  )
}
