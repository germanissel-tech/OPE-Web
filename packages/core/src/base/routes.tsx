/**
 * **Las rutas se arman del registro, no se escriben** (`CU-41`).
 *
 * Y se arman **una sola vez**, porque son estructura y no dependen de la sesión.
 * Un ruteador reconstruido en cada dibujo recrea el historial y remonta el
 * árbol: es un recurso con ciclo de vida adentro de un render (`CU-36`).
 *
 * | | | |
 * |---|---|---|
 * | **Las rutas** | Estructurales. Salen del registro | se arman una vez |
 * | **La autorización** | Cambia con la sesión | la lee el guardia en cada dibujo |
 */

import {
  createContext,
  createElement,
  type ReactElement,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
} from 'react'
import { Failure } from './failure'
import { isVisible, type Screen } from './registry'
import { useTelemetry } from './telemetry'

export type RouteObject = {
  readonly path: string
  readonly element: ReactElement
}

type Authorization = {
  readonly capabilities: ReadonlySet<string>
  /**
   * Qué se ve cuando la ruta existe y la sesión no la habilita.
   *
   * Lo pone la aplicación: el núcleo no sabe qué decirle a un operador de un
   * negocio que no conoce (principio III).
   */
  readonly forbidden: ReactNode
}

const AuthorizationContext = createContext<Authorization | null>(null)

export function AuthorizationProvider({
  capabilities,
  forbidden,
  children,
}: Authorization & { children: ReactNode }) {
  return createElement(
    AuthorizationContext.Provider,
    { value: { capabilities, forbidden } },
    children,
  )
}

export function useCapabilities(): ReadonlySet<string> {
  const authorization = useContext(AuthorizationContext)
  if (!authorization) {
    throw new Failure('wiring.outsideProvider', 'useCapabilities() fuera de AuthorizationProvider.')
  }
  return authorization.capabilities
}

/**
 * En qué pantalla se está.
 *
 * Lo necesita quien registra algo y **no puede saberlo por su cuenta**: la
 * puerta de acciones vive fuera del árbol de una pantalla en particular, y
 * `CU-25` pide que del `403` quede rastro de **cuál lo produjo** — sin eso, el
 * registro dice que algo estuvo mal y no dónde.
 */
const CurrentScreen = createContext<string | undefined>(undefined)

/**
 * Deja decir cuál es la pantalla actual sin pasar por el ruteador.
 *
 * Lo usa el propio ruteo, y lo necesita quien pruebe algo que dependa de en qué
 * pantalla está — que sin esto tendría que levantar el marco entero.
 */
export function CurrentScreenProvider({
  screen,
  children,
}: {
  readonly screen: string
  readonly children: ReactNode
}) {
  return <CurrentScreen.Provider value={screen}>{children}</CurrentScreen.Provider>
}

export function useCurrentScreen(): string {
  /* Sin proveedor devuelve algo legible en vez de reventar, y `CU-35` dice por
     qué. Es la misma excepción que hace `useTelemetry`. */
  return useContext(CurrentScreen) ?? 'sin-pantalla'
}

/**
 * **El segundo lado de `CU-3`**, y no es un detalle: filtrar sólo el menú deja
 * el agujero de que quien escriba la URL entra igual.
 *
 * La pantalla **ni se monta** si no está habilitada. No alcanza con esconderla
 * después de que pidió sus datos.
 */
function ScreenGate({ screen, wrap }: { screen: Screen; wrap: ScreenWrapper }) {
  const authorization = useContext(AuthorizationContext)
  if (!authorization) {
    throw new Failure(
      'wiring.outsideProvider',
      'Una ruta se dibujó fuera de AuthorizationProvider.',
    )
  }
  if (!isVisible(screen, authorization.capabilities)) return authorization.forbidden

  /* El envoltorio va **acá adentro y no alrededor del marco**: lo que se
     reemplaza al reventar es la pantalla, y la navegación tiene que sobrevivir
     (`CU-30`). Qué envuelve lo decide quien compone, no esto. */
  return (
    <CurrentScreenProvider screen={screen.id}>
      <Opened screen={screen.id} />
      {wrap(screen.id, <screen.component />)}
    </CurrentScreenProvider>
  )
}

/**
 * Anota que se abrió, y no dibuja nada.
 *
 * **Una vez por apertura, no por montaje**, y no es lo mismo. Una pantalla se
 * monta de nuevo sin que el operador la haya abierto de nuevo: al reintentar
 * después de un error (`CU-30`), o cuando algo de más arriba se rehace. Contar
 * eso le miente al tablero sobre qué se usa.
 *
 * La marca vive en un `ref` **de esta instancia**: al navegar a otra pantalla
 * hay una instancia nueva y se vuelve a anotar, que es lo correcto. Lo que no
 * vuelve a anotar es el mismo montaje ejecutando el efecto dos veces —que es lo
 * que hace `StrictMode` en desarrollo, y lo que haría un remontaje real.
 */
function Opened({ screen }: { screen: string }) {
  const telemetry = useTelemetry()
  const announced = useRef(false)

  useEffect(() => {
    if (announced.current) return
    announced.current = true
    telemetry.record({ kind: 'screenOpened', screen })
  }, [telemetry, screen])

  return null
}

/** Estructura pura: no mira capacidades, así que su resultado no envejece. */
/**
 * **Con qué se envuelve lo que dibuja una ruta.**
 *
 * Se recibe y no se importa: el límite de error es interfaz, y `base` no mira
 * hacia arriba (`CU-40`). Quien compone conoce las dos capas y las junta — que
 * es exactamente para lo que existe la raíz.
 *
 * Por omisión, la pantalla desnuda: **una prueba que arma rutas no necesita
 * arrastrar el límite de error para verificar un guardia de capacidad.**
 */
export type ScreenWrapper = (screen: string, content: ReactNode) => ReactNode

const bare: ScreenWrapper = (_screen, content) => content

export function buildRoutes(screens: readonly Screen[], wrap: ScreenWrapper = bare): RouteObject[] {
  return screens.map((screen) => ({
    path: screen.path,
    element: createElement(ScreenGate, { screen, wrap, key: screen.id }),
  }))
}
