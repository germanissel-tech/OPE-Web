/**
 * La puerta: **todo lo que `@ope/session` expone**.
 *
 * La regla que gobierna el contrato: **nada de lo que se exporta permite
 * obtener una credencial** (`CU-10`).
 *
 * **Acá no hay ninguna variable de módulo.** `configureSession` **devuelve** la
 * puerta en vez de guardarla, y quien la necesita la recibe: por contexto
 * adentro del árbol, y como argumento afuera —el servicio de la API se construye
 * con `authorize` y `observe`, no va a buscarlas—. Es la precisión que `CU-36`
 * incorporó: el módulo configurado una vez es para funciones sin estado, y una
 * sesión tiene estado y ciclo de vida.
 */

import { createContext, type ReactNode, useContext, useSyncExternalStore } from 'react'
import { INITIAL_STATE } from './state'
import type { Capabilities, SessionConfig, SessionPortFactory, SessionState } from './types'

/**
 * Lo que la aplicación recibe: la puerta ya armada.
 *
 * `authorize` y `observe` están acá y no en un módulo porque **son lo que el
 * servicio de la API recibe al construirse**. Quien las llama no sabe si
 * adentro hay un encabezado, una cookie o mTLS; si mañana el adaptador cambia
 * de mecanismo, no se mueve una sola pantalla.
 *
 * > **No existe una función que devuelva la credencial, y es a propósito.** Si
 * > existiera, cada lugar que la llamara estaría suponiendo cómo se autentica.
 */
export type AppSession = {
  readonly authorize: (request: Request) => Promise<Request>
  /** Siempre existe: si el adaptador no mira respuestas, esto no hace nada. */
  readonly observe: (response: Response) => void
  /** `undefined` cuando el adaptador entra solo: la vista de `anonymous` lo sabe por esto. */
  readonly signIn: ((credential?: string) => Promise<import('./types').SignInOutcome>) | undefined
  readonly signOut: () => Promise<void>
  readonly reenter: () => Promise<void>
  readonly resolve: () => Promise<void>
  readonly subscribe: (listener: () => void) => () => void
  readonly getState: () => SessionState
}

/**
 * Se llama **una vez, antes de dibujar nada**, y **devuelve** la puerta. Si
 * falta la traducción de capacidades, tira: la aplicación no arranca y dice
 * por qué (`CU-17`). **No valida nada más**: lo que un adaptador necesita lo
 * valida el adaptador al construirse, con su configuración tipada.
 *
 * Recibe el adaptador ya construido porque **cuál es lo elige la raíz de
 * composición** (`CU-36`), y este módulo no puede saberlo sin volver a atarse
 * a uno.
 */
export async function configureSession(
  config: SessionConfig,
  build: SessionPortFactory,
): Promise<AppSession> {
  if (typeof config.toCapabilities !== 'function') {
    throw new Error(
      'La sesión no se puede configurar. Falta: toCapabilities. ' +
        'No se arranca con valores por omisión: una sesión sin traducción de capacidades no habilita nada.',
    )
  }

  /* La configuración se le entrega a quien puede honrarla. La puerta la valida
     y no se queda con nada: no tiene cómo aplicar un plazo ni traducir claims. */
  const chosen = await build(config)

  return {
    authorize: (request) => chosen.authorize(request),
    /* **Se decide una vez, acá**, y no en cada llamada: así un servicio cablea
       `observe` sin preguntarse si el adaptador la trae. */
    observe: chosen.observe ? (response) => chosen.observe?.(response) : () => {},
    signIn: chosen.signIn ? (credential) => chosen.signIn?.(credential) ?? NEVER : undefined,
    signOut: () => chosen.signOut(),
    reenter: () => chosen.reenter(),
    resolve: () => chosen.resolve(),
    subscribe: (listener) => chosen.subscribe(listener),
    getState: () => chosen.getState(),
  }
}

/* `chosen.signIn` se comprobó arriba; esto sólo cierra el tipo del `?.`. */
const NEVER: Promise<import('./types').SignInOutcome> = Promise.resolve({
  ok: false,
  reason: 'unreachable',
})

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

/** El estado y sus datos, **sin la credencial** — porque no hay credencial que dar. */
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
 * cerrarla, usa esto. Y la vista de ingreso recibe `signIn`, que **entrega una
 * credencial y no la devuelve**.
 */
export function useSessionControl(): Pick<AppSession, 'signOut' | 'reenter' | 'signIn'> {
  const gate = useGate()
  return { signOut: gate.signOut, reenter: gate.reenter, signIn: gate.signIn }
}

/**
 * **La falsa NO sale por acá.** El contrato de `001` la lista como superficie
 * pública y `CU-36` exige que no esté en el artefacto de producción; las dos
 * cosas se cumplen poniéndola en otra entrada: `@ope/session/fake`.
 *
 * Así el código que importa `@ope/session` no la arrastra nunca, y no
 * depende de que el sacudido de árbol la saque — que es una propiedad de la
 * configuración del empaquetador y cambia sin que nadie lo note.
 *
 * **El bearer tampoco**: vive en `@ope/session/bearer`, porque la superficie
 * principal no nombra ningún mecanismo (`tests/gate.mjs`).
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
  SignInOutcome,
} from './types'
