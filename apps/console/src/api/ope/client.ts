import { createOpeClient, defineService, type SessionHooks, unwrap } from '@ope/core'
import type { operations, paths } from '../../../../../contracts/ope/api'

/**
 * Lo que un formulario puede verificar de cada cuerpo de pedido, emitido del
 * contrato (`CU-38`, capa 1). Sale por acá porque `contracts/ope/` sólo lo lee
 * `api/`; una funcionalidad lo toma de `data/`.
 */
export { CONSTRAINTS } from '../../../../../contracts/ope/constraints'

/**
 * El servicio del sistema `ope`: el backend de OPE, por su contrato.
 *
 * Los tipos salen de `contracts/ope/api.d.ts`, que `npm run contract:sync`
 * copia del backend; **ninguno se escribe acá**. Y la sesión llega cosida en
 * `createOpeClient`: quien arma una llamada no sabe cómo se autoriza
 * ni quién mira la respuesta (`CU-10`).
 *
 * **Y recibe su URL base**, que sale de la configuración leída al arrancar
 * (`CU-17`): en desarrollo es `/api`, que Vite reenvía al backend.
 *
 * Sin clave de idempotencia en ninguna: OPE repite por cuerpo idéntico
 * (`x-idempotency`), y `deactivateMerchant` aplicada dos veces deja el mismo
 * estado (`200` otra vez).
 */

/** Lo que `listMerchants` acepta: el cursor opaco y el tamaño del tramo (ADR-020 del backend). */
export type MerchantQuery = NonNullable<operations['listMerchants']['parameters']['query']>

/** Un tramo de merchants, con el cursor del siguiente si lo hay. Sale del contrato. */
export type MerchantPage =
  paths['/v1/admin/merchants']['get']['responses']['200']['content']['application/json']

export type Merchant = MerchantPage['items'][number]

/** Lo que el contrato pide para dar de alta. Sale del contrato, no se escribe. */
export type MerchantCreate = NonNullable<
  paths['/v1/admin/merchants']['post']['requestBody']
>['content']['application/json']

/** Lo que el alta devuelve: el merchant **con sus credenciales, esta única vez**. */
export type MerchantCredentials =
  paths['/v1/admin/merchants']['post']['responses']['201']['content']['application/json']

export type OpeClient = {
  /** Los merchants del alcance del operador, por cursor. */
  readonly listMerchants: (query: MerchantQuery) => Promise<MerchantPage>
  readonly getMerchant: (merchantId: string) => Promise<Merchant>
  readonly createMerchant: (body: MerchantCreate) => Promise<MerchantCredentials>
  /** Terminal: no hay vuelta ni borrado (`ADR-031` del backend). */
  readonly deactivateMerchant: (merchantId: string) => Promise<Merchant>
}

/**
 * Con qué se lo pide desde una funcionalidad.
 *
 * Vive acá y no en `app/` porque `CU-15` fija la dirección `features` → `app` y
 * nunca al revés: `api/` es lo único que las dos puntas pueden importar.
 */
export const opeService = defineService<OpeClient>('ope')

export function createClient(baseUrl: string, session: SessionHooks): OpeClient {
  const client = createOpeClient<paths>(baseUrl, session)

  return {
    async listMerchants(query) {
      return unwrap<MerchantPage>(await client.GET('/v1/admin/merchants', { params: { query } }))
    },

    async getMerchant(merchantId) {
      return unwrap<Merchant>(
        await client.GET('/v1/admin/merchants/{merchantId}', { params: { path: { merchantId } } }),
      )
    },

    async createMerchant(body) {
      return unwrap<MerchantCredentials>(await client.POST('/v1/admin/merchants', { body }))
    },

    async deactivateMerchant(merchantId) {
      return unwrap<Merchant>(
        await client.POST('/v1/admin/merchants/{merchantId}/deactivate', {
          params: { path: { merchantId } },
        }),
      )
    },
  }
}
