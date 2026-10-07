/**
 * **Navegar es una llamada tipada, no una cadena** (`CU-23`, `CU-41`).
 *
 * ```ts
 * goTo(screens.companyDetail, { id })   // ok
 * goTo(screens.companyDetail, { di })   // no compila: ése no es su parámetro
 * goTo(screens.companyDetai,  { id })   // no compila: esa pantalla no existe
 * ```
 *
 * Los tipos salen **del registro** y no de un árbol de rutas propio del
 * ruteador. Qué compra eso, y por qué se eligió así, está en `CU-23` y `CU-41`.
 *
 * **Acá no hay ninguna variable de módulo.** `buildUrl` es pura, y navegar es un
 * puerto que se **recibe** —`useNavigation()` adentro del árbol, y como
 * argumento afuera— porque el ruteador tiene ciclo de vida (`CU-36`).
 */

import { createContext, useContext } from 'react'
import { useParams } from 'react-router'
import { Failure } from './failure'
import type { RouteParams, Screen } from './registry'
import type { NavigationPort } from './services'

/**
 * Reemplaza los `:param` de la ruta por sus valores. **Pura**: no toca nada de
 * afuera, así que sí puede vivir en un módulo.
 */
export function buildUrl<Path extends `/${string}`>(
  screen: Screen<Path>,
  params: RouteParams<Path>,
): string {
  return screen.path.replace(/:([A-Za-z0-9_]+)/g, (_, name: string) => {
    const value = (params as Record<string, string>)[name]
    if (value === undefined) {
      throw new Failure(
        'navigation.missingParam',
        `Falta el parámetro "${name}" para navegar a "${screen.id}".`,
      )
    }
    return encodeURIComponent(value)
  })
}

/**
 * Los parámetros de la pantalla, **con el tipo que declaró su ruta**.
 *
 * Es la otra mitad de `CU-41`. `goTo` garantiza que quien navega pase lo
 * correcto; sin esto, quien **lee** recibe `string | undefined` y una ruta
 * renombrada le deja el valor en `undefined` **sin que nada falle**.
 *
 * Y evita que cada pantalla con parámetro tenga que importar el ruteador
 * concreto, que `CU-36` reserva para la raíz de composición.
 */
export function useScreenParams<Path extends `/${string}`>(
  screen: Screen<Path>,
): RouteParams<Path> {
  const raw = useParams()

  for (const name of screen.path.match(/:([A-Za-z0-9_]+)/g) ?? []) {
    const key = name.slice(1)
    if (raw[key] === undefined) {
      throw new Failure(
        'navigation.missingParam',

        `Falta el parámetro "${key}" en la ruta de "${screen.id}". ` +
          'Se llegó por una URL que no corresponde a su declaración.',
      )
    }
  }

  return raw as RouteParams<Path>
}

const NavigationContext = createContext<NavigationPort | null>(null)

export const NavigationProvider = NavigationContext.Provider

/**
 * Navegar, desde un componente.
 *
 * **Falla si no hay proveedor**, en vez de devolver algo que no navega: una
 * navegación que no ocurre en silencio es peor que un error al montar.
 */
export function useNavigation(): NavigationPort {
  const port = useContext(NavigationContext)
  if (!port) {
    throw new Failure(
      'wiring.outsideProvider',

      'useNavigation() fuera de NavigationProvider. La navegación la provee la raíz de composición.',
    )
  }
  return port
}
