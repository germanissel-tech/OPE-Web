import { createOpeClient, defineService, type SessionHooks, unwrap } from '@ope/core'
import type { components, operations, paths } from '../../../../../contracts/ope/api'

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

/** Lo que una rotación pide: cuánto sigue valiendo la anterior. */
export type CredentialRotation = components['schemas']['CredentialRotation']

/** Lo que una rotación devuelve: **el valor, esta única vez**, y hasta cuándo vale la anterior. */
export type CredentialIssued = components['schemas']['CredentialIssued']

export type CredentialKind = components['schemas']['CredentialKind']

/** El interruptor de apagado, pedido y respuesta (01 §14.2). */
export type KillSwitch = components['schemas']['KillSwitch']

/** Lo que `listMerchantAdminLog` acepta: el cursor opaco y el tamaño del tramo. */
export type AdminLogQuery = NonNullable<operations['listMerchantAdminLog']['parameters']['query']>

/** Una entrada del registro de administración: quién hizo qué, con qué resultado (ADR-031). */
export type AdminEntry = components['schemas']['AdminEntry']
export type AdminEntryPage = components['schemas']['AdminEntryPage']

export type OpeClient = {
  /** Los merchants del alcance del operador, por cursor. */
  readonly listMerchants: (query: MerchantQuery) => Promise<MerchantPage>
  readonly getMerchant: (merchantId: string) => Promise<Merchant>
  readonly createMerchant: (body: MerchantCreate) => Promise<MerchantCredentials>
  /** Terminal: no hay vuelta ni borrado (`ADR-031` del backend). */
  readonly deactivateMerchant: (merchantId: string) => Promise<Merchant>
  /* Las tres rotaciones, gemelas: mismo cuerpo, misma respuesta, mismos rechazos. */
  readonly rotateIngestKey: (
    merchantId: string,
    body: CredentialRotation,
  ) => Promise<CredentialIssued>
  readonly rotatePlatformKey: (
    merchantId: string,
    body: CredentialRotation,
  ) => Promise<CredentialIssued>
  readonly rotatePlatformSecret: (
    merchantId: string,
    body: CredentialRotation,
  ) => Promise<CredentialIssued>
  /** Idempotente por estado: pedir el que ya tiene es `200` otra vez. */
  readonly setKillSwitch: (merchantId: string, body: KillSwitch) => Promise<KillSwitch>
  /** El registro de administración del merchant, lo más nuevo primero, por cursor. */
  readonly listMerchantAdminLog: (
    merchantId: string,
    query: AdminLogQuery,
  ) => Promise<AdminEntryPage>
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

    async rotateIngestKey(merchantId, body) {
      return unwrap<CredentialIssued>(
        await client.POST('/v1/admin/merchants/{merchantId}/ingest-keys', {
          params: { path: { merchantId } },
          body,
        }),
      )
    },

    async rotatePlatformKey(merchantId, body) {
      return unwrap<CredentialIssued>(
        await client.POST('/v1/admin/merchants/{merchantId}/platform-keys', {
          params: { path: { merchantId } },
          body,
        }),
      )
    },

    async rotatePlatformSecret(merchantId, body) {
      return unwrap<CredentialIssued>(
        await client.POST('/v1/admin/merchants/{merchantId}/platform-secrets', {
          params: { path: { merchantId } },
          body,
        }),
      )
    },

    async setKillSwitch(merchantId, body) {
      return unwrap<KillSwitch>(
        await client.PUT('/v1/admin/merchants/{merchantId}/kill-switch', {
          params: { path: { merchantId } },
          body,
        }),
      )
    },

    async listMerchantAdminLog(merchantId, query) {
      return unwrap<AdminEntryPage>(
        await client.GET('/v1/admin/merchants/{merchantId}/log', {
          params: { path: { merchantId }, query },
        }),
      )
    },
  }
}
