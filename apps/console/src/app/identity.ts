import type { ApplicationManifest, BaseConfig } from '@ope/core'
import { rolesFromResourceAccess } from '@ope/session/keycloak'
import { appStrings } from './strings'

/**
 * **Quién está, y qué puede hacer**: lo que esta aplicación entiende de los
 * claims de la sesión.
 *
 * Va aparte del resto del manifiesto porque cambia por otra razón y en otro
 * momento: las pantallas se agregan de a una durante meses, y esto se toca
 * cuando cambian los roles o el proveedor.
 */
export function identity(
  config: BaseConfig,
): Pick<ApplicationManifest, 'toCapabilities' | 'userCaption'> {
  return {
    /**
     * De dónde salen las capacidades. **Cambiar de proveedor es cambiar el
     * import de arriba** (`TAN-2`, `CU-10`).
     *
     * Recibe el client porque los roles vienen por client, y cuál es el de esta
     * aplicación se lee al arrancar (`CU-17`).
     *
     * Si esta aplicación necesitara traducir los roles a otros nombres, se
     * compone encima de esto — el adaptador extrae, no interpreta.
     */
    toCapabilities: rolesFromResourceAccess(config.clientId),

    /** El rótulo de abajo en la barra. No es estándar de OIDC (`CU-27`). */
    userCaption: () => appStrings.devMode,
  }
}
