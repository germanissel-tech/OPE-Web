/**
 * **La forma de Keycloak**, conservada **sin entrada**.
 *
 * Es lo único del proveedor que una aplicación necesita conocer:
 * `resource_access.<client>.roles`, que existe porque **OIDC estándar no tiene
 * claim de roles**.
 *
 * **Hoy no se exporta** (`package.json` no tiene `./keycloak`): OPE entra con
 * una credencial opaca por operador (`@ope/session/bearer`) y no hay adaptador
 * OIDC. El archivo se queda, y no por nostalgia: el día que aparezca una
 * segunda aplicación con SSO, el adaptador OIDC entra por la misma puerta y
 * esto vuelve a tener entrada en una línea de `exports`. Lo específico de un
 * proveedor se pide por su nombre, y la superficie principal no nombra a
 * ninguno (`tests/gate.mjs`).
 */

import type { Capabilities, Claims } from './types'

/**
 * Los roles que el token trae **para este client**, como capacidades.
 *
 * Devuelve un conjunto vacío ante cualquier forma inesperada, y eso no es
 * indulgencia: por `001`, capacidades vacías significan `unauthorized`, que es
 * una pantalla propia y **no un rechazo silencioso**.
 *
 * **Extrae, no interpreta.** Qué significa cada rol en esta aplicación lo decide
 * el manifiesto (`CU-10`, principio III): acá no se sabe qué es `receipts:write`
 * y no hay por qué saberlo.
 */
export function rolesFromResourceAccess(clientId: string): (claims: Claims) => Capabilities {
  return (claims) => {
    const access = claims.resource_access
    if (typeof access !== 'object' || access === null) return new Set()

    const forClient = (access as Record<string, unknown>)[clientId]
    if (typeof forClient !== 'object' || forClient === null) return new Set()

    const roles = (forClient as { roles?: unknown }).roles
    if (!Array.isArray(roles)) return new Set()

    return new Set(roles.filter((role): role is string => typeof role === 'string'))
  }
}
