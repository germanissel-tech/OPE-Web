/**
 * La máquina de estados de la sesión. **Es una sola, y todo lo demás cuelga de
 * ella** (`specs/001-la-sesion/data-model.md`).
 *
 * Se escribe como una tabla de transiciones y no como `if`s repartidos por el
 * código, porque las dos prohibiciones que importan tienen que ser **imposibles
 * de saltear**, no recordables:
 *
 * - **`unauthorized` no tiene salida hacia el proveedor.** Es la única
 *   prohibición dura de la máquina, y existe porque el camino natural —«no
 *   tiene permisos, mandalo a entrar»— es un bucle infinito.
 * - **`ended` es terminal.** No se vuelve a `active` sin recargar el documento.
 *   Eso es lo que garantiza que no queda nada de la sesión anterior en memoria
 *   (`CU-9`).
 */

import type { Capabilities, Claims, EndReason, SessionState, SessionStatus } from './types'

export type SessionEvent =
  | { readonly type: 'resolved'; readonly subject: string; readonly claims: Claims }
  | { readonly type: 'no-session' }
  | { readonly type: 'renewal-failed' }
  | { readonly type: 'reenter' }
  | { readonly type: 'returned'; readonly subject: string; readonly claims: Claims }
  | { readonly type: 'ended'; readonly reason: EndReason }

/** Desde qué estados se acepta cada evento. Lo que no está acá, no pasa. */
const TRANSITIONS: Readonly<Record<SessionEvent['type'], readonly SessionStatus[]>> = {
  /* Desde `anonymous` también: es lo que un ingreso con credencial necesita y
     lo que la redirección nunca necesitó. `unauthorized` sigue sin salida. */
  resolved: ['resolving', 'anonymous'],
  'no-session': ['resolving'],
  'renewal-failed': ['active'],
  reenter: ['expiring'],
  returned: ['waiting'],
  /* Desde cualquiera menos el terminal: se puede cerrar sesión en otra
     aplicación mientras acá se está esperando, o resolviendo. */
  ended: ['resolving', 'anonymous', 'active', 'unauthorized', 'expiring', 'waiting'],
}

export const INITIAL_STATE: SessionState = {
  status: 'resolving',
  capabilities: new Set<string>(),
}

/**
 * Aplica un evento. Si el evento no corresponde al estado actual, **devuelve el
 * mismo estado**: una transición inválida no rompe la aplicación, pero tampoco
 * ocurre en silencio a medias.
 */
export function nextState(
  current: SessionState,
  event: SessionEvent,
  toCapabilities: (claims: Claims) => Capabilities,
): SessionState {
  if (!TRANSITIONS[event.type].includes(current.status)) return current

  switch (event.type) {
    case 'no-session':
      return { status: 'anonymous', capabilities: new Set<string>() }

    case 'resolved': {
      const capabilities = toCapabilities(event.claims)
      /* Entró, y no tiene ninguna capacidad acá. Pantalla propia, y NO se
         redirige: mandarlo a entrar de nuevo es el bucle infinito. */
      const status: SessionStatus = capabilities.size === 0 ? 'unauthorized' : 'active'
      return { status, subject: event.subject, claims: event.claims, capabilities }
    }

    case 'renewal-failed':
      return { ...current, status: 'expiring' }

    case 'reenter':
      return { ...current, status: 'waiting' }

    case 'returned': {
      /* Volvió OTRO sujeto: se termina. Es lo único que se compara, y es lo que
         impide que la segunda persona herede el contexto de la primera. */
      if (event.subject !== current.subject) {
        return { status: 'ended', capabilities: new Set<string>(), reason: 'other-subject' }
      }
      const capabilities = toCapabilities(event.claims)
      const status: SessionStatus = capabilities.size === 0 ? 'unauthorized' : 'active'
      return { status, subject: event.subject, claims: event.claims, capabilities }
    }

    case 'ended':
      /* No se conservan claims ni subject: `ended` es terminal justamente para
         que no quede nada de la sesión anterior en memoria. */
      return { status: 'ended', capabilities: new Set<string>(), reason: event.reason }
  }
}
