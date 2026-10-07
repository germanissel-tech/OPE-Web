/**
 * **Una pantalla se declara en un solo lugar** (`CU-23`), y de esa declaración
 * el marco deriva **el menú, las rutas y el filtrado por capacidad**.
 *
 * Agregar una pantalla es tocar un lugar. Cualquier código que además escriba
 * una entrada de menú o una ruta a mano contradice esta decisión, y crea la
 * segunda fuente que un día no coincide.
 *
 * **`CU-3` queda cumplida de los dos lados**, y por eso `capability` la leen
 * tanto el menú como el ruteador. La razón del segundo lado está en `CU-23`.
 */

import type { ComponentType } from 'react'
import { Failure } from './failure'

/**
 * **Lo que una ruta puede declarar** (`CU-41`).
 *
 * Dos formas, y nada más: **segmentos estáticos** y `:parametro` que ocupa el
 * segmento entero. Lo demás no compila **al declarar la pantalla**, que es donde
 * está el arreglo.
 *
 * Que la lista sea corta es la decisión. Un parámetro opcional se leería como
 * `string | undefined`, que es exactamente el agujero que `CU-41` cerró; y un
 * comodín no tiene nombre, así que no hay qué tipar.
 */
export type UnsupportedRoute = {
  readonly unsupportedRoutePattern: 'Sólo se soportan segmentos estáticos y :parametro completos'
}

/** Lo que no puede aparecer adentro de un segmento. */
type Forbidden = ':' | '*' | '?' | '.'

/** Qué aporta un segmento: nada, un parámetro, o que la ruta no se pueda tipar. */
type SegmentParams<Segment extends string> = Segment extends `:${infer Name}`
  ? Name extends `${string}${Forbidden}${string}`
    ? UnsupportedRoute
    : Name extends ''
      ? UnsupportedRoute
      : { [K in Name]: string }
  : Segment extends `${string}${':' | '*'}${string}`
    ? UnsupportedRoute
    : Record<never, string>

/**
 * Los parámetros que declara una ruta, deducidos de su propio texto.
 *
 * `'/companies/:id/statement'` produce `{ id: string }`. De acá salen los tipos
 * de `goTo`, así que **el registro es la fuente de los tipos** y no hay un
 * segundo lugar donde declararlos (`CU-41`).
 *
 * Se lee **segmento por segmento**, y **un segmento que no se entiende hunde la
 * ruta entera**. Sin esa distinción, «no tiene parámetros» y «no entendí esto»
 * eran el mismo tipo, así que `goTo` dejaba navegar sin pasar nada y el
 * comodín viajaba literal en la URL.
 */
export type RouteParams<Path extends string> = Path extends `${infer Head}/${infer Tail}`
  ? SegmentParams<Head> extends UnsupportedRoute
    ? UnsupportedRoute
    : RouteParams<Tail> extends UnsupportedRoute
      ? UnsupportedRoute
      : SegmentParams<Head> & RouteParams<Tail>
  : SegmentParams<Path>

export type ScreenDefinition<Path extends `/${string}` = `/${string}`> = {
  /** Con qué se la nombra al navegar. */
  readonly id: string
  /** Lo que se ve en el menú y en la cabecera. */
  readonly title: string
  /**
   * La ruta, con sus parámetros. **De acá se derivan los tipos.**
   *
   * Tiene que empezar con barra, y **el tipo lo exige**: sin eso, `'catalog'`
   * produce una ruta hija `atalog` mientras el menú arma el enlace `catalog`, y
   * el enlace lleva a una ruta que no existe sin fallar en ningún lado.
   */
  readonly path: Path
  /**
   * Sin ella la pantalla **no aparece en el menú ni deja entrar por URL**.
   * Sin capacidad declarada, la pantalla es visible para cualquier sesión.
   */
  readonly capability?: string
  readonly component: ComponentType
}

/**
 * La marca de que una pantalla pasó por `defineScreen`.
 *
 * **Existe al correr**, y el símbolo **no se exporta**: nadie de afuera puede
 * escribirla, así que no hay forma de armar un `Screen` a mano y saltearse la
 * comprobación de la forma de la ruta.
 */
const DECLARED: unique symbol = Symbol('cuarzo.screen')

/** Lo que `defineScreen` devuelve: la declaración, marcada. */
export type Screen<Path extends `/${string}` = `/${string}`> = ScreenDefinition<Path> & {
  readonly [DECLARED]: true
}

/**
 * Declara una pantalla. Se usa en el módulo de una funcionalidad, y la raíz de
 * composición junta las que exporta cada una (`CU-36`).
 */
export function defineScreen<const Path extends `/${string}`>(
  /* Una forma que el marco no sabe tipar suma a la declaración una propiedad que
     nadie puede escribir, así que **falla acá y no al navegar** — con el nombre
     de la propiedad diciendo qué pasó. */
  definition: ScreenDefinition<Path> &
    (RouteParams<Path> extends UnsupportedRoute ? UnsupportedRoute : unknown),
): Screen<Path> {
  const declared: ScreenDefinition<Path> = definition
  return { ...declared, [DECLARED]: true }
}

/**
 * El registro que arma la raíz de composición.
 *
 * **Dos pantallas con la misma ruta fallan al construir**, no eligen una en
 * silencio: el ganador dependería del orden en que se juntaron las
 * funcionalidades, que es exactamente la clase de defecto que aparece meses
 * después y en una sola máquina.
 */
export function createRegistry<const S extends readonly Screen[]>(screens: S): S {
  const seen = new Map<string, string>()
  for (const screen of screens) {
    const previous = seen.get(screen.path)
    if (previous) {
      throw new Failure(
        'declaration.duplicateScreenPath',

        `Dos pantallas declaran la misma ruta "${screen.path}": ${previous} y ${screen.id}.`,
      )
    }
    seen.set(screen.path, screen.id)
  }
  return screens
}

/** Las capacidades que hoy tiene la sesión deciden qué se ve y a qué se entra. */
export function isVisible(screen: Screen, capabilities: ReadonlySet<string>): boolean {
  return screen.capability === undefined || capabilities.has(screen.capability)
}

/**
 * **Lo que la sesión tiene que habilitar para llegar a una pantalla** (`CU-23`).
 *
 * Sale con la misma forma que una acción —`{ requires }`— para que un control
 * que **navega** se filtre con lo mismo que uno que **ejecuta**. Sin esto, cada
 * pantalla escribiría `screen.capability ? [screen.capability] : []`, que es
 * ruido y se copia mal.
 *
 * La razón de fondo es de `CU-3`: **una acción visible se puede ocultar por
 * capacidad; un gesto no.** Un doble clic navega igual para cualquiera, así que
 * el día que llegar dependa de un permiso, el gesto lleva a un callejón sin
 * cartel y un botón sencillamente no se dibuja.
 */
/**
 * **Si un control se ofrece, y qué exige** — la forma que se le da a un control.
 *
 * Se esparce sobre él —`{...toReach(x)}`—, así que las dos preguntas viajan
 * juntas y ninguna se puede olvidar por separado.
 *
 * `offered: false` es distinto de `requires: ['algo']`: lo segundo dice **esta
 * sesión no**, lo primero dice **acá no**. Con todas las capacidades del mundo,
 * lo que el flujo omite sigue sin dibujarse (`CU-47`).
 */
export type Reachable = {
  readonly requires: readonly string[]
  /** Cuando falta, se ofrece. Lo normal es que se ofrezca. */
  readonly offered?: boolean
}

export function toReach(screen: Screen): Reachable {
  return { requires: screen.capability === undefined ? [] : [screen.capability] }
}
