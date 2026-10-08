/**
 * **El adaptador de credencial opaca por operador** (`ADR-031` del backend).
 *
 * OPE administra con un token opaco por operador: no hay emisor, ni ventana,
 * ni renovación. Lo que hay es una credencial que el operador escribe, un
 * backend que la reconoce o no, y un `401` el día que deja de reconocerla.
 *
 * De eso salen las tres decisiones de este archivo:
 *
 * - **La credencial vive en una variable de esta clausura y en ningún
 *   almacenamiento.** No sobrevive a una recarga, y eso es el costo asumido:
 *   guardarla en `sessionStorage` la dejaría al alcance de cualquier script de
 *   la página, y la aplicación no tiene ninguno que no sea suyo — hasta que
 *   lo tenga.
 * - **Quién es el operador lo pregunta la aplicación**, no esto. `identify`
 *   recibe `authorize` y devuelve los claims; en OPE es `getOperator` (su
 *   feature 040) o, mientras tanto, una sonda. Este archivo no sabe qué
 *   operación contesta eso ni tiene por qué saberlo.
 * - **`reenter` no hace nada**: no hay ventana que abrir. Este adaptador nunca
 *   emite `renewal-failed`, así que `expiring` y `waiting` son inalcanzables
 *   con él, y la puerta no necesita saberlo.
 *
 * Es el único archivo de `@ope/session` que nombra el mecanismo (`Bearer`), y
 * `tests/gate.mjs` vigila que siga siendo el único.
 */

import { createSessionStore } from './store'
import type { Capabilities, Claims, SessionPort, SignInOutcome } from './types'

export type BearerSessionOptions = {
  readonly toCapabilities: (claims: Claims) => Capabilities
  /**
   * De quién es la credencial. **La escribe la aplicación**: es la única que
   * sabe qué operación de su backend contesta eso. Recibe `authorize` para
   * hacer el pedido ya autorizado, y devuelve los claims con los que se entra.
   *
   * Si el backend no reconoce la credencial, tira algo con `status: 401` y la
   * entrada se rechaza; si no hay backend, tira cualquier otra cosa y la
   * entrada es «inalcanzable». Los dos borran la credencial.
   */
  readonly identify: (authorize: SessionPort['authorize']) => Promise<Claims>
  /** El esquema del encabezado. `Bearer` por omisión. */
  readonly scheme?: string
}

const UNAUTHORIZED = 401

export function createBearerSession(options: BearerSessionOptions): SessionPort {
  const scheme = options.scheme ?? 'Bearer'
  const { getState, subscribe, apply } = createSessionStore(options.toCapabilities)

  /* **La credencial, y éste es el único lugar.** `undefined` en `anonymous` y
     en `ended`: no queda nada de una sesión que terminó. */
  let credential: string | undefined

  const authorize = async (request: Request): Promise<Request> => {
    if (credential === undefined) return request
    const headers = new Headers(request.headers)
    headers.set('Authorization', `${scheme} ${credential}`)
    return new Request(request, { headers })
  }

  return {
    getState,
    subscribe,
    authorize,

    /* Nunca hay sesión previa: la credencial no sobrevive a la recarga. */
    async resolve() {
      apply({ type: 'no-session' })
    },

    async signIn(given): Promise<SignInOutcome> {
      if (given === undefined || given.trim() === '') return { ok: false, reason: 'rejected' }

      credential = given.trim()

      let claims: Claims
      try {
        claims = await options.identify(authorize)
      } catch (error) {
        credential = undefined
        return { ok: false, reason: isUnauthorized(error) ? 'rejected' : 'unreachable' }
      }

      const subject = typeof claims.sub === 'string' ? claims.sub : 'operator'
      apply({ type: 'resolved', subject, claims })
      return { ok: true }
    },

    /**
     * **El `401` en vuelo es el fin.** No hay renovación posible con una
     * credencial opaca: el backend dejó de reconocerla, y lo único honesto es
     * decirlo y volver al ingreso.
     */
    observe(response) {
      if (response.status !== UNAUTHORIZED) return
      if (credential === undefined) return
      credential = undefined
      apply({ type: 'ended', reason: 'token-rejected' })
    },

    async signOut() {
      credential = undefined
      apply({ type: 'ended', reason: 'signed-out' })
    },

    /* No hay ventana que abrir. Ver el encabezado del archivo. */
    async reenter() {},
  }
}

/** Lo que `identify` tira cuando el backend no reconoce la credencial: algo con `status: 401`. */
function isUnauthorized(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { status?: unknown }).status === UNAUTHORIZED
  )
}
