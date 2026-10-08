import { unwrap } from '@ope/core'
import createClient from 'openapi-fetch'
import type { paths } from '../../../../../contracts/ope/api'
import { CAPABILITIES } from '../../../../../contracts/ope/capabilities'

/**
 * **Quién es el operador, preguntado al backend.**
 *
 * Es lo que el adaptador bearer recibe como `identify`: la única pieza de la
 * sesión que sabe qué operación de OPE contesta «de quién es esta credencial».
 * Vive en `api/` y no en `app/` porque toca el contrato (`contracts/ope/`), y
 * sólo `api/` lo lee (`boundaries`).
 *
 * **Hoy es una sonda** (`listMerchants` con `limit=1`): un `200` dice que la
 * credencial sirve y **no dice quién es**. Los claims quedan `operator`, y la
 * barra dice eso. Se reemplaza por `getOperator` cuando OPE-Backend 040 lo
 * publique: ahí llegan `operatorId`, `displayName` y `scope`, y esto pasa a
 * ser una llamada en vez de una deducción.
 *
 * Arma su propio conector mínimo con `authorize` y **sin `observe`**: un `401`
 * acá es «la credencial no sirve para entrar», que `signIn` ya trata como
 * rechazo — no es un `401` en vuelo que termine una sesión que todavía no
 * empezó.
 */
export async function probeOperator(
  baseUrl: string,
  authorize: (request: Request) => Promise<Request>,
): Promise<Readonly<Record<string, unknown>>> {
  const client = createClient<paths>({ baseUrl })
  client.use({ onRequest: ({ request }) => authorize(request) })

  /* Tira `RequestFailed` con `status: 401` si no la reconoce; cualquier otra
     cosa —red, 5xx— también tira, y el adaptador lo lee como «inalcanzable». */
  unwrap(await client.GET('/v1/admin/merchants', { params: { query: { limit: 1 } } }))

  return { sub: 'operator', operatorId: 'operator', name: 'operator', scope: '*' }
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
