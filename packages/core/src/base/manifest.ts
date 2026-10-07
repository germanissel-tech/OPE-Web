/**
 * **El manifiesto: lo único que una aplicación de Tandilia escribe** (`CU-42`).
 *
 * Vive en `src/app/manifest.ts` del lado de la aplicación, con nombre fijo, para
 * que quien clona **no tenga que buscar dónde va lo suyo**.
 *
 * Está tipado a propósito: **lo que falta no compila**, que es la garantía más
 * fuerte de las cinco aplicada a la pregunta «¿me olvidé de algo al clonar?».
 */

import type { ReactNode } from 'react'
import type { WorkContext } from './context'
import type { Flow, MenuEntry } from './flow'
import type { AnyOutcome } from './outcome'
import type { AnyPreference } from './preference'
import type { Screen } from './registry'
import type { SessionViews } from './session-views'
import type { Strings } from './strings'
import type { TelemetryEnvelope } from './telemetry'

/**
 * Una entrada propia del menú de usuario (`CU-27`).
 *
 * **Abre una pantalla, ejecuta algo, o las dos**: primero corre `onSelect`
 * —un diálogo, una acción— y después navega, si declaró pantalla.
 *
 * Con `screen` la navegación es tipada (`CU-41`): la pantalla equivocada no
 * compila, así que el enlace no se puede romper. Es la única forma que se
 * prefiere; `onSelect` no está limitado a nada.
 *
 * **Lo único que no se acepta es una entrada que no hace nada**, y por eso el
 * tipo exige al menos una de las dos: un renglón muerto en el menú es
 * indistinguible de uno que dejó de funcionar.
 */
type MenuTarget =
  | { readonly screen: Screen; readonly onSelect?: () => void }
  | { readonly screen?: undefined; readonly onSelect: () => void }

export type UserMenuEntry = {
  readonly id: string
  readonly label: string
} & MenuTarget

export type UserMenuManifest = {
  readonly entries?: readonly UserMenuEntry[]
  /**
   * **Las preferencias que esta aplicación tiene** (`CU-26`, `CU-27`).
   *
   * No son campos del manifiesto y el marco no conoce ninguna: se declaran, y
   * las que trae el marco están en `standardPreferences`. Lo que no está en
   * esta lista **no existe en esta aplicación** — ni interruptor, ni valor
   * guardado que reviva.
   *
   * Una preferencia fija se declara con `fixed`, que le saca el renglón del
   * menú **y** le pone el valor: las dos cosas juntas, que es lo que `CU-27`
   * pide y un texto no podía garantizar.
   */
  readonly preferences?: readonly AnyPreference[]
}

export type ApplicationManifest = {
  /** La marca de la barra. Sólo dice en qué aplicación estás. */
  readonly name: string
  /** Las que exporta cada funcionalidad. Una línea por funcionalidad (`CU-23`). */
  readonly screens: readonly Screen[]
  /**
   * La traducción de claims a capacidades, que **sólo la aplicación puede
   * hacer**: el marco no conoce `ctacte-panel` ni `receipts:write` (`CU-10`).
   */
  readonly toCapabilities: (claims: Readonly<Record<string, unknown>>) => ReadonlySet<string>
  /** Contra qué sistemas habla, por nombre (`CU-22`). */
  readonly systems: readonly string[]
  /**
   * **Los contextos de trabajo de esta aplicación** (`CU-26`).
   *
   * Lo que no está acá no existe: pedir uno sin declarar falla, en vez de leer
   * vacío para siempre mientras el operador elige algo que no se guarda.
   */
  readonly contexts?: readonly WorkContext[]
  /**
   * **Qué contexto propio acompaña a cada evento del registro** (`CU-35`).
   *
   * Los eventos los declara cuarzo; **el contexto que los describe, no**, y por
   * qué está en `CU-35`.
   *
   * ```ts
   * telemetry: { envelope: { branch: currentBranch } }
   * ```
   *
   * El valor es un contexto de trabajo y no un texto, y eso no es comodidad: es
   * lo que hace falta un paso deliberado para meter ahí un dato de una persona.
   */
  readonly telemetry?: { readonly envelope: TelemetryEnvelope }
  /**
   * Los desenlaces que declaran sus funcionalidades, y a dónde lleva cada uno
   * (`CU-44`). **Salen de `composeFeatures`**, no se escriben a mano.
   *
   * La aplicación **no arranca** si alguno quedó sin destino, o si hay un
   * destino para un desenlace que ya nadie declara.
   */
  readonly outcomes?: readonly AnyOutcome[]
  /**
   * **Cómo se atraviesa esta aplicación** (`CU-47`).
   *
   * Es el único mecanismo: una pantalla no nombra a otra, y a dónde lleva un
   * desenlace lo dice el paso del flujo activo.
   */
  readonly flows?: readonly Flow[]
  /** Lo que el menú lateral ofrece, en orden (`CU-48`). */
  readonly menu?: readonly MenuEntry[]
  /**
   * **De qué raíz es cada pantalla**, y es obligatorio (`CU-47`).
   *
   * Lo arma `composeFeatures`; acá sólo se cablea. **Una entrada por pantalla**,
   * no por raíz: `{ article: 'articles' }` dice que la ficha pertenece al
   * catálogo, no que sea raíz de algo.
   *
   * Es obligatorio porque sin él dos de las seis comprobaciones de arranque se
   * quedan sin sujetos y aprueban en silencio; un clon que lo omita levantaría
   * en verde y perdería el enlace pegado de todas sus pantallas. **Obligatorio
   * no compila**, que es más fuerte que fallar al arrancar.
   */
  readonly featureRootOf: Readonly<Record<string, string>>
  /**
   * **Qué desenlaces declara cada funcionalidad**, por su raíz (`CU-47`).
   *
   * Lo arma `composeFeatures`. Es lo que deja preguntarle a **cada flujo** si
   * dijo algo sobre cada desenlace de las funcionalidades que toca — con la
   * lista aplanada, alcanza con que **algún** flujo lo mapee, y el segundo
   * flujo que comparta una pantalla arranca en verde sin decir nada.
   */
  readonly outcomesOf: Readonly<Record<string, readonly string[]>>
  readonly userMenu?: UserMenuManifest
  /**
   * Los textos del marco que esta aplicación reemplaza.
   *
   * Sólo los que quiera: lo que no pase queda el del marco. **No son los de sus
   * pantallas** — ésos se escriben donde la pantalla declara su título.
   */
  readonly strings?: Partial<Strings>
  /** El rótulo de abajo en la barra de usuario — no es estándar de OIDC (`CU-27`). */
  readonly userCaption?: (claims: Readonly<Record<string, unknown>>) => string | undefined
  /** Reemplazos de las vistas por omisión. Lo que no se pase, queda el del marco. */
  readonly sessionViews?: Partial<SessionViews>
  /** Qué se ve cuando la ruta existe y la sesión no la habilita (`CU-3`). */
  readonly forbidden?: ReactNode
}

/**
 * Declara la aplicación.
 *
 * **No recibe ninguna implementación concreta**, y es a propósito: quién
 * resuelve la sesión lo elige el punto de entrada. Una bandera en un archivo
 * declarativo sería la puerta trasera de autenticación que `CU-36` rechaza.
 */
export function defineApplication(manifest: ApplicationManifest): ApplicationManifest {
  return manifest
}
