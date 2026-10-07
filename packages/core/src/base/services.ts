/**
 * **Los puertos que una aplicación recibe**, y ninguna implementación.
 *
 * Quién los cumple lo decide la raíz de composición, y es el único lugar que
 * nombra algo concreto (`CU-36`). Todo lo demás **recibe**: por contexto si vive
 * adentro del árbol, y como argumento si vive afuera.
 *
 * **Ningún puerto se guarda en una variable de módulo**: `CU-36` reserva eso
 * para funciones sin estado, y todo lo de acá tiene estado o ciclo de vida.
 */

import type { RouteParams, Screen } from './registry'

/**
 * Lo que una pantalla necesita saber de la sesión, **y nada más**.
 *
 * No incluye `signOut` ni `reenter`: una pantalla que sólo lee estado no tiene
 * por qué recibir lo que puede terminar la sesión. Eso vive en `SessionControl`,
 * que recibe el marco.
 */
export type SessionView = {
  readonly capabilities: ReadonlySet<string>
  readonly claims: Readonly<Record<string, unknown>> | undefined
}

/** Navegar. Lo cumple quien tenga el ruteador de verdad. */
export type NavigationPort = {
  /**
   * El parámetro equivocado no compila (`CU-23`, `CU-41`). La firma tiene dos
   * formas: sin parámetros no se pasa un segundo argumento, y con parámetros es
   * obligatorio — lo decide el tipo de la ruta, no una comprobación al correr.
   */
  readonly goTo: <Path extends `/${string}`>(
    ...args: Record<never, string> extends RouteParams<Path>
      ? [screen: Screen<Path>, params?: RouteParams<Path>]
      : [screen: Screen<Path>, params: RouteParams<Path>]
  ) => void
}

/**
 * Lo que la aplicación recibe armado.
 *
 * Crece **una línea por puerto**, y cada uno es una abstracción: acá no entra
 * `oidc-client-ts`, ni React Router, ni un servicio concreto.
 */
export type Services = {
  readonly navigation: NavigationPort
  readonly screens: readonly Screen[]
}
