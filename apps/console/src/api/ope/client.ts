import { createOpeClient, defineService, type Page, type SessionHooks, unwrap } from '@ope/core'
import type { operations, paths } from '../../../../../contracts/ope/api'

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
 */

/** Lo que `listMerchants` acepta: el cursor opaco y el tamaño del tramo (ADR-020 del backend). */
export type MerchantQuery = NonNullable<operations['listMerchants']['parameters']['query']>

/** Un tramo de merchants, con el cursor del siguiente si lo hay. Sale del contrato. */
export type MerchantPage =
  paths['/v1/admin/merchants']['get']['responses']['200']['content']['application/json']

export type Merchant = MerchantPage['items'][number]

export type OpeClient = {
  /** Los merchants del alcance del operador, por cursor. */
  readonly listMerchants: (query: MerchantQuery) => Promise<Page<MerchantPage>>
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
    /* `unwrap` todavía espera el sobre `{ data, meta }` de las-animas; el que
       lee cuerpos pelados y Problem Details llega en el tramo 3 de la 005. Hasta
       entonces esta llamada compila y tipa, y no se ejecuta contra el backend. */
    async listMerchants(query) {
      return unwrap<MerchantPage>(await client.GET('/v1/admin/merchants', { params: { query } }))
    },
  }
}
