/**
 * La puerta: **todo lo que `@ope/session` expone**.
 *
 * La regla que gobierna el contrato: **nada de lo que se exporta permite
 * obtener un token** (`CU-10`).
 *
 * **Acá no hay ninguna variable de módulo.** `configureSession` **devuelve** la
 * puerta en vez de guardarla, y quien la necesita la recibe: por contexto
 * adentro del árbol, y como argumento afuera —el servicio de la API se construye
 * con `authorize`, no va a buscarla—. Es la precisión que `CU-36` incorporó: el
 * módulo configurado una vez es para funciones sin estado, y una sesión tiene
 * estado y ciclo de vida.
 */

import { createContext, type ReactNode, useContext, useSyncExternalStore } from 'react'
import { INITIAL_STATE } from './state'
import type { Capabilities, SessionConfig, SessionPortFactory, SessionState } from './types'

/**
 * Lo que la aplicación recibe: la puerta ya armada.
 *
 * `authorize` está acá y no en un módulo porque **es lo que el servicio de la
 * API recibe al construirse**. Quien la llama no sabe si adentro hay un bearer,
 * una cookie o mTLS; si mañana el proveedor cambia de mecanismo, no se mueve una
 * sola pantalla.
 *
 * > **No existe una función que devuelva el token, y es a propósito.** Si
 * > existiera, cada lugar que la llamara estaría suponiendo que la
 * > autenticación es un bearer.
 */
export type AppSession = {
  readonly authorize: (request: Request) => Promise<Request>
  readonly signOut: () => Promise<void>
  readonly reenter: () => Promise<void>
  readonly resolve: () => Promise<void>
  readonly subscribe: (listener: () => void) => () => void
  readonly getState: () => SessionState
}

/**
 * Se llama **una vez, antes de dibujar nada**, y **devuelve** la puerta. Si
 * falta un valor obligatorio, tira: la aplicación no arranca y dice por qué
 * (`CU-17`).
 *
 * Recibe el proveedor ya construido porque **quién es el proveedor lo elige la
 * raíz de composición** (`CU-36`), y este módulo no puede saberlo sin volver a
 * atarse a uno.
 */
export async function configureSession(
  config: SessionConfig,
  build: SessionPortFactory,
): Promise<AppSession> {
  const missing: string[] = []
  if (!config.issuer?.trim()) missing.push('issuer')
  if (!config.clientId?.trim()) missing.push('clientId')
  if (typeof config.toCapabilities !== 'function') missing.push('toCapabilities')

  if (missing.length > 0) {
    throw new Error(
      `La sesión no se puede configurar. Falta: ${missing.join(', ')}. ` +
        'No se arranca con valores por omisión: un emisor mal configurado tiene que fallar acá.',
    )
  }

  /* La configuración se le entrega a quien puede honrarla. La puerta la valida
     y no se queda con nada: no tiene cómo aplicar un plazo ni traducir claims. */
  const chosen = await build(config)

  return {
    authorize: (request) => chosen.authorize(request),
    signOut: () => chosen.signOut(),
    reenter: () => chosen.reenter(),
    resolve: () => chosen.resolve(),
    subscribe: (listener) => chosen.subscribe(listener),
    getState: () => chosen.getState(),
  }
}

const SessionContext = createContext<AppSession | null>(null)

export function SessionProvider({ gate, children }: { gate: AppSession; children: ReactNode }) {
  return <SessionContext.Provider value={gate}>{children}</SessionContext.Provider>
}

function useGate(): AppSession {
  const gate = useContext(SessionContext)
  if (!gate) {
    throw new Error('Se usó la sesión fuera de SessionProvider. La provee la raíz de composición.')
  }
  return gate
}

/** El estado y sus datos, **sin el token** — porque no hay token que dar. */
export function useSession(): SessionState {
  const gate = useGate()
  return useSyncExternalStore(gate.subscribe, gate.getState, () => INITIAL_STATE)
}

/** Lo que devolvió la traducción de la aplicación. El módulo no las lee. */
export function useCapabilities(): Capabilities {
  return useSession().capabilities
}

/**
 * Lo que **opera** sobre la sesión, separado de lo que la lee.
 *
 * Una pantalla que sólo muestra datos usa `useSession()` y no recibe nada que
 * pueda terminar la sesión; la barra de usuario, que sí tiene que poder
 * cerrarla, usa esto.
 */
export function useSessionControl(): Pick<AppSession, 'signOut' | 'reenter'> {
  const gate = useGate()
  return { signOut: gate.signOut, reenter: gate.reenter }
}

/**
 * **La falsa NO sale por acá.** El contrato de `001` la lista como superficie
 * pública y `CU-36` exige que no esté en el artefacto de producción; las dos
 * cosas se cumplen poniéndola en otra entrada: `@ope/session/fake`.
 *
 * Así el código que importa `@ope/session` no la arrastra nunca, y no
 * depende de que el sacudido de árbol la saque — que es una propiedad de la
 * configuración del empaquetador y cambia sin que nadie lo note.
 */
export type {
  Capabilities,
  Claims,
  EndReason,
  SessionConfig,
  SessionPort,
  SessionPortFactory,
  SessionState,
  SessionStatus,
} from './types'
