import type { SignInOutcome } from '@ope/session'
import type { ReactNode } from 'react'
import type { Strings } from './strings'

/**
 * **El contrato de las siete vistas de sesión** (`CU-42`).
 *
 * Vive en `base` y no con las vistas porque **el manifiesto lo nombra**: una
 * aplicación declara con qué reemplaza cada estado, y eso es parte de lo que
 * declara, no de cómo se ve.
 *
 * Es la dirección que `CU-40` fija —`ui` → `data` → `base`, y nunca al revés—:
 * si el tipo viviera arriba, el manifiesto tendría que mirar hacia la interfaz
 * para saber qué le están dando.
 */

/** Los siete estados, en el orden de la máquina de `001`. */
export type SessionStatusName =
  | 'resolving'
  | 'anonymous'
  | 'active'
  | 'unauthorized'
  | 'expiring'
  | 'waiting'
  | 'ended'

export type SessionViewContext = {
  /**
   * Cuánto se espera antes de mostrar que se está resolviendo — `CU-9`.
   *
   * Por debajo no se ve nada: un indicador que aparece y desaparece en 200ms se
   * lee como un parpadeo defectuoso. Por encima **hay que mostrar algo**, o una
   * resolución que no vuelve deja la pantalla en blanco para siempre.
   */
  readonly waitThresholdMs: number
  /**
   * Cómo se llama la aplicación, para la marca del marco.
   *
   * Las vistas que no dejan ver la aplicación —ingreso, sin permisos,
   * terminada— se dibujan **adentro del shell de granito** igual que una
   * pantalla, y el shell necesita saber en qué aplicación está (`GR-12`).
   */
  readonly appName: string
  /** Por qué terminó, cuando terminó. */
  readonly endReason: string | undefined
  /** La aplicación, ya montada. Sólo la usan los estados que la dejan ver. */
  readonly application: ReactNode
  /** Volver a entrar, para el diálogo de `CU-9`. */
  readonly reenter: () => void
  /**
   * Entrar con una credencial, **cuando el adaptador tiene entrada**.
   *
   * `undefined` con uno que entra solo (redirección): la vista de `anonymous`
   * lo sabe por esto, y dibuja el aviso de «no hay sesión» en vez del ingreso.
   */
  readonly signIn: ((credential?: string) => Promise<SignInOutcome>) | undefined
  /**
   * Lo que dice el marco, ya resuelto contra lo que la aplicación reemplazó.
   *
   * **Llega por acá y no con `useStrings()`** porque estas siete no son
   * componentes: se las llama durante el dibujo de otro, y cuál se llama
   * depende del estado. Un gancho adentro cambiaría de cantidad entre dibujos.
   */
  readonly strings: Strings
}

export type SessionViews = Readonly<
  Record<SessionStatusName, (context: SessionViewContext) => ReactNode>
>
