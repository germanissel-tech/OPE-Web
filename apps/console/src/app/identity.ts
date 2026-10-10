import type { ApplicationManifest, BaseConfig } from '@ope/core'
import { ADMIN_CAPABILITIES, fetchOperator } from '../api/ope/identity'
import { appStrings } from './strings'

/**
 * **Quién está, y qué puede hacer**: lo que esta aplicación entiende de los
 * claims de la sesión.
 *
 * Va aparte del resto del manifiesto porque cambia por otra razón y en otro
 * momento: las pantallas se agregan de a una durante meses, y esto se toca
 * cuando cambia cómo se entra.
 *
 * Dos formas de claims, y las dos las arma esta aplicación:
 *
 * | de dónde | qué traen | capacidades |
 * |---|---|---|
 * | la falsa (`dev-session.ts`) | `capabilities: string[]` — el papel elegido | ésas |
 * | el bearer (`identify`) | `scope: '*' \| string[]` — el alcance del operador | **todas** las del consumidor `admin` |
 *
 * Con el bearer son todas porque el alcance de OPE es por merchant, no por
 * capacidad: un operador con alcance acotado ve los mismos botones y el backend
 * le rechaza los merchants ajenos (`merchant-out-of-scope`). El día que el
 * contrato tenga capacidades por operador, esto deja de ser una constante.
 */
export function identity(config: BaseConfig): Pick<
  ApplicationManifest,
  'toCapabilities' | 'userCaption'
> & {
  readonly identify: (authorize: (request: Request) => Promise<Request>) => Promise<Claims>
} {
  return {
    toCapabilities: (claims) => {
      if (Array.isArray(claims.capabilities)) {
        return new Set(
          claims.capabilities.filter((each): each is string => typeof each === 'string'),
        )
      }
      if ('scope' in claims) return ADMIN_CAPABILITIES
      return new Set()
    },

    /** El rótulo de abajo en la barra: el alcance del operador (`CU-27`). */
    userCaption: (claims) => {
      if (claims.scope === '*') return appStrings.allMerchants
      if (Array.isArray(claims.scope)) return appStrings.someMerchants(claims.scope.length)
      return appStrings.devMode
    },

    /* `getOperator`: quién es, con nombre si lo tiene (`OW-7`). Ver `api/ope/identity.ts`. */
    identify: (authorize) => fetchOperator(config.systems.ope ?? '/api', authorize),
  }
}

type Claims = Readonly<Record<string, unknown>>
