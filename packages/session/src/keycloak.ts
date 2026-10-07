/**
 * **La forma de Keycloak**, en una entrada aparte.
 *
 * Es lo único del proveedor que una aplicación necesita conocer:
 * `resource_access.<client>.roles`, que existe porque **OIDC estándar no tiene
 * claim de roles**.
 *
 * Vive en `@cuarzo/session/keycloak` y no en la superficie principal por la
 * misma razón que la falsa vive en `/fake`: **lo específico de un proveedor se
 * pide por su nombre**. La superficie principal no nombra a ninguno, y `TAN-2`
 * dice que hoy usamos Keycloak y se puede cambiar — cambiarlo es cambiar este
 * import, en una línea.
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
