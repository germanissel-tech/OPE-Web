/**
 * La implementación falsa de la puerta.
 *
 * Existe por dos razones, y las dos importan:
 *
 * - Por `CU-10`: **una interfaz no demuestra nada si nunca se ejerce contra
 *   otra cosa.** Ésta es la segunda implementación, y es lo que prueba que la
 *   puerta no supone un proveedor.
 * - Por `CU-17`: **es además el modo de desarrollo**, así que se ejerce todos
 *   los días en vez de pudrirse en una carpeta de pruebas.
 *
 * Permite forzar los casos que en producción casi no ocurren: que la renovación
 * falle, que se cierre la ventana sin entrar, que venza el plazo, y que vuelva
 * otro sujeto. Y **tiene entrada** (`signIn`), para poder mirar la vista de
 * ingreso sin backend: entra con los claims configurados, sea cual sea la
 * credencial.
 *
 * **No va al artefacto de producción** (`CU-36`). Si se pudiera encender desde
 * `config.json`, el archivo de configuración sería una puerta trasera de
 * autenticación: quien pueda editarlo entra sin credenciales. Por eso no hay
 * bandera que la encienda — no hay qué encender.
 */

import { createSessionStore } from './store'
import type { Capabilities, Claims, SessionPort } from './types'

/**
 * La marca que busca `tests/artifact.mjs`.
 *
 * Es una **cadena de texto** y no un nombre de función: un nombre se renombra al
 * minificar, una cadena no.
 *
 * Y **la falsa la lleva puesta como campo** —`marker`, abajo— en vez de ser sólo
 * una constante exportada. Una constante que el módulo no usa es una exportación
 * muerta y **el empaquetador la borra**, aunque el resto del archivo viaje: la
 * comprobación aprobaría un artefacto con la sesión falsa entera adentro.
 *
 * Como campo de un objeto que se construye al ejecutar, no hay sacudido de árbol
 * que la saque sin sacar también a la falsa.
 */
export const FAKE_SESSION_MARKER = 'OPE_FAKE_SESSION_NOT_FOR_PRODUCTION'

/** Qué pasa cuando el operador vuelve a entrar. */
export type ReturnBehaviour = 'same-subject' | 'other-subject' | 'window-closed'

export type FakeSessionOptions = {
  readonly subject?: string
  readonly claims?: Claims
  readonly toCapabilities: (claims: Claims) => Capabilities
  /** Arrancar sin sesión, para ejercitar `anonymous` y la vista de ingreso. */
  readonly noSession?: boolean
  /** Por omisión vuelve el mismo. */
  readonly onReturn?: ReturnBehaviour
  /** Cuánto tarda en resolver, para poder ver el umbral de `CU-9`. */
  readonly delayMs?: number
}

/**
 * Lo que la falsa agrega al contrato: **forzar los caminos de falla**.
 *
 * Va en un objeto aparte y con nombre propio para que se vea de un vistazo que
 * es de la falsa. La puerta real no lo tiene, y nada que use `SessionPort`
 * puede llamarlo — el tipo no lo permite.
 */
export type Simulation = {
  /** Fuerza `active → expiring`: la renovación no se pudo (`CU-8`). */
  readonly renewalFailed: () => void
  /** Fuerza el vencimiento del plazo de reingreso (`CU-9`). */
  readonly reentryTimedOut: () => void
}

export type FakeSession = SessionPort & {
  readonly simulate: Simulation
  /** Lo que hace visible a la falsa en un artefacto. Ver `FAKE_SESSION_MARKER`. */
  readonly marker: typeof FAKE_SESSION_MARKER
}

const DEFAULT_CLAIMS: Claims = {
  sub: 'fake-1',
  name: 'Ana Operadora',
  preferred_username: 'aoperadora',
}

export function createFakeSession(options: FakeSessionOptions): FakeSession {
  const claims = options.claims ?? DEFAULT_CLAIMS
  const subject = options.subject ?? String(claims.sub ?? 'fake-1')

  /* Sostener el estado y avisar que cambió no es de la falsa: lo hereda igual
     el adaptador real. Acá sólo se decide **qué eventos se aplican**. */
  const { getState, subscribe, apply } = createSessionStore(options.toCapabilities)

  return {
    getState,
    subscribe,
    marker: FAKE_SESSION_MARKER,

    async resolve() {
      if (options.delayMs) {
        await new Promise((done) => setTimeout(done, options.delayMs))
      }
      if (options.noSession) {
        apply({ type: 'no-session' })
        return
      }
      apply({ type: 'resolved', subject, claims })
    },

    /**
     * Devuelve **el mismo pedido**, sin tocarlo.
     *
     * Es a propósito y vale mirarlo: la falsa no pone ningún encabezado, y la
     * aplicación funciona igual. Eso es exactamente lo que `CU-10` afirma — que
     * quien llama **no sabe** si adentro hay un encabezado, una cookie o nada.
     */
    async authorize(request: Request) {
      return request
    },

    /**
     * Entra con los claims configurados, **sea cual sea la credencial**: es lo
     * que deja mirar la vista de ingreso sin backend. Con `noSession` se arranca
     * en `anonymous` y esto es la salida.
     */
    async signIn() {
      apply({ type: 'resolved', subject, claims })
      return { ok: true }
    },

    async signOut() {
      apply({ type: 'ended', reason: 'signed-out' })
    },

    async reenter() {
      apply({ type: 'reenter' })

      const behaviour = options.onReturn ?? 'same-subject'
      if (behaviour === 'window-closed') {
        apply({ type: 'ended', reason: 'window-closed' })
        return
      }
      if (behaviour === 'other-subject') {
        apply({ type: 'returned', subject: 'other', claims: { ...claims, sub: 'other' } })
        return
      }
      apply({ type: 'returned', subject, claims })
    },

    simulate: {
      renewalFailed() {
        apply({ type: 'renewal-failed' })
      },
      reentryTimedOut() {
        apply({ type: 'ended', reason: 'reentry-timeout' })
      },
    },
  }
}
