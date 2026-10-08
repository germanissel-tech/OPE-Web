import { defineService, type Page, unwrap } from '@ope/core'
import createClient, { type Middleware } from 'openapi-fetch'
import type { paths } from './types'

/**
 * El servicio del sistema `demo`.
 *
 * **No es un sistema de Tandilia**: es el del hola mundo, y se borra al clonar
 * junto con `src/features/`. Su contrato está en `contracts/demo.yaml`.
 *
 * **Recibe `authorize`, no va a buscarla** (`CU-10`). Quien lo usa no sabe si
 * adentro hay un bearer, una cookie o mTLS: si mañana el proveedor cambia de
 * mecanismo, no se mueve una sola pantalla.
 *
 * **Y recibe su URL base**, que sale de la configuración leída al arrancar
 * (`CU-17`, `CU-22`). Cada sistema tiene la suya, y cada llamada lleva el token
 * de su destino — un token con permisos de todos ejerce más de lo que necesita.
 */

export type Authorize = (request: Request) => Promise<Request>

/** Lo que el contrato llama artículo. **El tipo sale del contrato**, no se escribe. */
export type Article = NonNullable<
  paths['/articles']['get']['responses']['200']['content']['application/json']['data']
>[number]

export type ArticleQuery = {
  readonly search?: string
  readonly page?: number
  readonly size?: number
}

/** Lo que el contrato pide para dar de alta. Sale del contrato, no se escribe. */
export type ArticleCreate = NonNullable<
  paths['/articles']['post']['requestBody']
>['content']['application/json']

export type DemoClient = {
  /** Los artículos, filtrados y paginados **por el servidor** (`CU-14`). */
  readonly listArticles: (query: ArticleQuery) => Promise<Page<Article[]>>
  readonly getArticle: (articleId: number) => Promise<Page<Article>>
  /**
   * **No lleva clave de idempotencia**, y el contraste con `createArticle` es
   * el punto: desactivar dos veces deja el mismo estado, así que un reintento
   * no puede duplicar nada (`CU-34`).
   */
  readonly deactivateArticle: (articleId: number) => Promise<Page<Article>>
  readonly activateArticle: (articleId: number) => Promise<Page<Article>>
  /**
   * **Exige la clave de idempotencia** porque el contrato la declara requerida
   * (`CU-34`). Quien la genera es la puerta de acciones.
   */
  readonly createArticle: (body: ArticleCreate, idempotencyKey: string) => Promise<Page<Article>>
  /**
   * **Exige el testigo** porque el contrato declara `If-Match` requerido
   * (`CU-29`). Sale de `meta.version` de la lectura, y por eso editar obliga a
   * haber leído: sin ese paso no hay con qué escribir.
   */
  readonly updateArticle: (
    articleId: number,
    body: ArticleCreate,
    version: string,
  ) => Promise<Page<Article>>
}

/**
 * Con qué se lo pide desde una funcionalidad.
 *
 * Vive acá y no en `app/` porque `CU-15` fija la dirección `features` → `app` y
 * nunca al revés: `api/` es lo único que las dos puntas pueden importar.
 */
export const demoService = defineService<DemoClient>('demo')

export function createDemoClient(baseUrl: string, authorize: Authorize): DemoClient {
  const client = createClient<paths>({ baseUrl })

  /* Un intermedio y no un envoltorio por llamada: **si se olvida en una, esa
     llamada sale sin autorizar y el servidor responde 401** — un error tardío
     para algo que se decide una sola vez. */
  const authorizing: Middleware = {
    async onRequest({ request }) {
      return authorize(request)
    },
  }
  client.use(authorizing)

  return {
    async listArticles(query) {
      return unwrap<Article[]>(await client.GET('/articles', { params: { query } }))
    },

    async createArticle(body, idempotencyKey) {
      return unwrap<Article>(
        await client.POST('/articles', {
          body,
          params: { header: { 'Idempotency-Key': idempotencyKey } },
        }),
      )
    },

    async updateArticle(articleId, body, version) {
      return unwrap<Article>(
        await client.PUT('/articles/{articleId}', {
          body,
          params: { path: { articleId }, header: { 'If-Match': version } },
        }),
      )
    },

    async deactivateArticle(articleId) {
      return unwrap<Article>(
        await client.POST('/articles/{articleId}/deactivation', {
          params: { path: { articleId } },
        }),
      )
    },

    async activateArticle(articleId) {
      return unwrap<Article>(
        await client.POST('/articles/{articleId}/activation', {
          params: { path: { articleId } },
        }),
      )
    },

    async getArticle(articleId) {
      return unwrap<Article>(
        await client.GET('/articles/{articleId}', { params: { path: { articleId } } }),
      )
    },
  }
}
