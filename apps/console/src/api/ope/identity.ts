import { unwrap } from '@ope/core'
import createClient from 'openapi-fetch'
import type { components, paths } from '../../../../../contracts/ope/api'
import { CAPABILITIES } from '../../../../../contracts/ope/capabilities'

type Operator = components['schemas']['Operator']

/**
 * **Quién es el operador, preguntado al backend** (`OW-7`, `ADR-044`).
 *
 * Es lo que el adaptador bearer recibe como `identify`: la única pieza de la
 * sesión que sabe qué operación de OPE contesta «de quién es esta credencial».
 * Vive en `api/` y no en `app/` porque toca el contrato (`contracts/ope/`), y
 * sólo `api/` lo lee (`boundaries`).
 *
 * `getOperator` no exige capacidad: identificarse no es un botón. Devuelve
 * `operatorId`, `displayName` si el operador lo tiene configurado, y `scope`.
 * Los claims conservan la clave `name` que `UserBar` ya lee: el nombre para
 * mostrar, o el identificador cuando no hay nombre — **nunca inventado**.
 *
 * Arma su propio conector mínimo con `authorize` y **sin `observe`**: un `401`
 * acá es «la credencial no sirve para entrar», que `signIn` ya trata como
 * rechazo — no es un `401` en vuelo que termine una sesión que todavía no
 * empezó.
 */
export async function fetchOperator(
  baseUrl: string,
  authorize: (request: Request) => Promise<Request>,
): Promise<Readonly<Record<string, unknown>>> {
  const client = createClient<paths>({ baseUrl })
  client.use({ onRequest: ({ request }) => authorize(request) })

  /* Tira `RequestFailed` con `status: 401` si no la reconoce; cualquier otra
     cosa —red, 5xx— también tira, y el adaptador lo lee como «inalcanzable». */
  const operator = unwrap<Operator>(await client.GET('/v1/admin/operator'))

  return claimsOf(operator)
}

/** Los claims de `OW-7`, de lo que el contrato devuelve. */
export function claimsOf(operator: Operator): Readonly<Record<string, unknown>> {
  return {
    sub: operator.operatorId,
    operatorId: operator.operatorId,
    name: operator.displayName ?? operator.operatorId,
    scope: operator.scope,
  }
}

/**
 * **Todas las capacidades del consumidor `admin`**, del módulo del contrato.
 *
 * Es lo que un operador con alcance `*` puede; con un alcance acotado también,
 * porque el alcance lo aplica el backend merchant por merchant y no por
 * capacidad (`merchant-out-of-scope`). Un operador de OPE no tiene hoy un
 * subconjunto de capacidades: tiene o no tiene credencial.
 */
export const ADMIN_CAPABILITIES: ReadonlySet<string> = new Set(CAPABILITIES)

/** Las de sólo lectura, para mirar la consola con menos (`CU-3`). */
export const READ_CAPABILITIES: ReadonlySet<string> = new Set(
  CAPABILITIES.filter((each) => each.endsWith(':read')),
)

/**
 * **Alcance sobre todos los merchants, como una capacidad de la consola**
 * (feature 008, research §8).
 *
 * Publicar plataforma o defaults exige `configuration:write` **y** un operador
 * sobre todo merchant: lo que publica alcanza a todos. El contrato no tiene
 * una capacidad para eso —lo dice el alcance—, y una pantalla no lee claims:
 * lee capacidades. Así que el alcance `*` se traduce acá en una más, con un
 * nombre que no puede chocar con las del contrato (no tiene la forma
 * `recurso:verbo` de ninguna), y el botón la exige junto a la de escribir.
 */
export const ALL_MERCHANTS = 'scope:all-merchants'

/**
 * **Las capacidades que dan unos claims**: las que traen —la sesión falsa—, o
 * todas las del consumidor `admin` —el bearer—, más `ALL_MERCHANTS` si el
 * alcance es `*`.
 */
export function capabilitiesOf(claims: Readonly<Record<string, unknown>>): ReadonlySet<string> {
  const listed = claims['capabilities']
  const granted = Array.isArray(listed)
    ? listed.filter((each): each is string => typeof each === 'string')
    : 'scope' in claims
      ? [...ADMIN_CAPABILITIES]
      : []
  return new Set(claims['scope'] === '*' ? [...granted, ALL_MERCHANTS] : granted)
}
