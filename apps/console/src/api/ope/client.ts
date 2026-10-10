import {
  createOpeClient,
  defineService,
  type SessionHooks,
  unwrap,
  unwrapWitnessed,
  type Witnessed,
} from '@ope/core'
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

/** Quién es el operador autenticado: identificador, nombre para mostrar si lo tiene, alcance (ADR-044). */
export type Operator = components['schemas']['Operator']

/** La persona de contacto del merchant: una persona identificada de la relación comercial (ADR-045). */
export type MerchantContact = components['schemas']['MerchantContact']

/** La identidad de un merchant como se escribe, entera: lo que se omite se borra (ADR-045). */
export type MerchantProfileInput = components['schemas']['MerchantProfileInput']

/* ── Los tres niveles de configuración (ADR-031, enmendada por la 036; feature 008) ── */

/** Con qué se sirve a un merchant: lo efectivo, lo que declara y las tres versiones que estampa. */
export type MerchantConfiguration = components['schemas']['MerchantConfiguration']
/** Lo que un merchant sobreescribe de los defaults; la ausencia es heredar. */
export type MerchantConfigurationDeclared = components['schemas']['MerchantConfigurationDeclared']
export type MerchantConfigurationInput = components['schemas']['MerchantConfigurationInput']
export type MerchantConfigurationVersion = components['schemas']['MerchantConfigurationVersion']
export type MerchantConfigurationVersionPage =
  components['schemas']['MerchantConfigurationVersionPage']
export type EffectiveConfiguration = components['schemas']['EffectiveConfiguration']

/** El nivel 1: lo mismo para todos los merchants. */
export type PlatformConfiguration = components['schemas']['PlatformConfiguration']
export type PlatformConfigurationContent = components['schemas']['PlatformConfigurationContent']
export type PlatformConfigurationInput = components['schemas']['PlatformConfigurationInput']
export type PlatformConfigurationVersion = components['schemas']['PlatformConfigurationVersion']
export type PlatformConfigurationVersionPage =
  components['schemas']['PlatformConfigurationVersionPage']

/** El nivel 2: lo que rige donde un merchant no declara. */
export type TreatmentDefaults = components['schemas']['TreatmentDefaults']
export type TreatmentDefaultsContent = components['schemas']['TreatmentDefaultsContent']
export type TreatmentDefaultsInput = components['schemas']['TreatmentDefaultsInput']
export type TreatmentDefaultsVersion = components['schemas']['TreatmentDefaultsVersion']
export type TreatmentDefaultsVersionPage = components['schemas']['TreatmentDefaultsVersionPage']

/** El cursor y el tamaño del tramo de un historial; el mismo en los tres niveles. */
export type VersionsQuery = NonNullable<
  operations['listConfigurationVersions']['parameters']['query']
>

export type OpeClient = {
  /** Los merchants del alcance del operador, por cursor. */
  readonly listMerchants: (query: MerchantQuery) => Promise<MerchantPage>
  /** Con su testigo: la identidad se reemplaza entera y lo pide (`CU-29`, ADR-046 del backend). */
  readonly getMerchant: (merchantId: string) => Promise<Witnessed<Merchant>>
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
  /** Reemplaza la identidad entera; no toca orígenes, estado ni credenciales (ADR-045). */
  readonly updateMerchantProfile: (
    merchantId: string,
    body: MerchantProfileInput,
    witness: string,
  ) => Promise<Merchant>
  /** El registro de administración del merchant, lo más nuevo primero, por cursor. */
  readonly listMerchantAdminLog: (
    merchantId: string,
    query: AdminLogQuery,
  ) => Promise<AdminEntryPage>

  /* La configuración: tres niveles con la misma forma —lo que rige, el
     historial, publicar— (feature 008). Publicar devuelve `201` con la versión
     nueva o `200` con la que rige si el cuerpo es igual; el cliente devuelve el
     cuerpo y quien llama compara números.

     Las tres lecturas de lo que rige traen el testigo, y las tres
     publicaciones lo devuelven en `If-Match` (feature 009): sin él, `428`;
     con uno que ya no es el de ahora, `412` y nada se escribe. */
  readonly getMerchantConfiguration: (
    merchantId: string,
  ) => Promise<Witnessed<MerchantConfiguration>>
  readonly listConfigurationVersions: (
    merchantId: string,
    query: VersionsQuery,
  ) => Promise<MerchantConfigurationVersionPage>
  readonly getMerchantConfigurationVersion: (
    merchantId: string,
    version: number,
  ) => Promise<MerchantConfigurationVersion>
  readonly publishMerchantConfiguration: (
    merchantId: string,
    body: MerchantConfigurationInput,
    witness: string,
  ) => Promise<MerchantConfigurationVersion>
  readonly getPlatformConfiguration: () => Promise<Witnessed<PlatformConfiguration>>
  readonly listPlatformConfigurationVersions: (
    query: VersionsQuery,
  ) => Promise<PlatformConfigurationVersionPage>
  readonly getPlatformConfigurationVersion: (
    version: number,
  ) => Promise<PlatformConfigurationVersion>
  readonly publishPlatformConfiguration: (
    body: PlatformConfigurationInput,
    witness: string,
  ) => Promise<PlatformConfigurationVersion>
  readonly getTreatmentDefaults: () => Promise<Witnessed<TreatmentDefaults>>
  readonly listTreatmentDefaultsVersions: (
    query: VersionsQuery,
  ) => Promise<TreatmentDefaultsVersionPage>
  readonly getTreatmentDefaultsVersion: (version: number) => Promise<TreatmentDefaultsVersion>
  readonly publishTreatmentDefaults: (
    body: TreatmentDefaultsInput,
    witness: string,
  ) => Promise<TreatmentDefaultsVersion>
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
      return unwrapWitnessed<Merchant>(
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

    async updateMerchantProfile(merchantId, body, witness) {
      return unwrap<Merchant>(
        await client.PUT('/v1/admin/merchants/{merchantId}/profile', {
          params: { path: { merchantId }, header: { 'If-Match': witness } },
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

    async getMerchantConfiguration(merchantId) {
      return unwrapWitnessed<MerchantConfiguration>(
        await client.GET('/v1/admin/merchants/{merchantId}/configuration', {
          params: { path: { merchantId } },
        }),
      )
    },

    async listConfigurationVersions(merchantId, query) {
      return unwrap<MerchantConfigurationVersionPage>(
        await client.GET('/v1/admin/merchants/{merchantId}/configuration/versions', {
          params: { path: { merchantId }, query },
        }),
      )
    },

    async getMerchantConfigurationVersion(merchantId, version) {
      return unwrap<MerchantConfigurationVersion>(
        await client.GET('/v1/admin/merchants/{merchantId}/configuration/versions/{version}', {
          params: { path: { merchantId, version } },
        }),
      )
    },

    async publishMerchantConfiguration(merchantId, body, witness) {
      return unwrap<MerchantConfigurationVersion>(
        await client.POST('/v1/admin/merchants/{merchantId}/configuration', {
          params: { path: { merchantId }, header: { 'If-Match': witness } },
          body,
        }),
      )
    },

    async getPlatformConfiguration() {
      return unwrapWitnessed<PlatformConfiguration>(
        await client.GET('/v1/admin/platform-configuration'),
      )
    },

    async listPlatformConfigurationVersions(query) {
      return unwrap<PlatformConfigurationVersionPage>(
        await client.GET('/v1/admin/platform-configuration/versions', { params: { query } }),
      )
    },

    async getPlatformConfigurationVersion(version) {
      return unwrap<PlatformConfigurationVersion>(
        await client.GET('/v1/admin/platform-configuration/versions/{version}', {
          params: { path: { version } },
        }),
      )
    },

    async publishPlatformConfiguration(body, witness) {
      return unwrap<PlatformConfigurationVersion>(
        await client.POST('/v1/admin/platform-configuration', {
          params: { header: { 'If-Match': witness } },
          body,
        }),
      )
    },

    async getTreatmentDefaults() {
      return unwrapWitnessed<TreatmentDefaults>(await client.GET('/v1/admin/treatment-defaults'))
    },

    async listTreatmentDefaultsVersions(query) {
      return unwrap<TreatmentDefaultsVersionPage>(
        await client.GET('/v1/admin/treatment-defaults/versions', { params: { query } }),
      )
    },

    async getTreatmentDefaultsVersion(version) {
      return unwrap<TreatmentDefaultsVersion>(
        await client.GET('/v1/admin/treatment-defaults/versions/{version}', {
          params: { path: { version } },
        }),
      )
    },

    async publishTreatmentDefaults(body, witness) {
      return unwrap<TreatmentDefaultsVersion>(
        await client.POST('/v1/admin/treatment-defaults', {
          params: { header: { 'If-Match': witness } },
          body,
        }),
      )
    },
  }
}
