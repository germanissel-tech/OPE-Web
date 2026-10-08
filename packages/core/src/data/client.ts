import createClient, { type Client, type Middleware } from 'openapi-fetch'

/**
 * Lo que un conector a OPE necesita de la sesión, **y nada más** (`CU-10`).
 *
 * `authorize` pone la credencial en cada pedido; quien lo arma no sabe
 * si adentro hay un bearer, una cookie o mTLS. `observe` mira cada respuesta
 * antes de que la lea nadie: es por donde un `401` termina la sesión sin que
 * cada llamada tenga que acordarse de avisar.
 */
export type SessionHooks = {
  readonly authorize: (request: Request) => Promise<Request>
  readonly observe?: (response: Response) => void
}

export type OpeClient<Paths extends object> = Client<Paths>

/**
 * El conector tipado contra el contrato de OPE, con la sesión cosida **una sola
 * vez**.
 *
 * Un intermedio y no un envoltorio por llamada: si `authorize` se olvidara en
 * una, esa llamada saldría sin credencial y el servidor respondería `401` — un
 * error tardío para algo que se decide al construir. Lo mismo con `observe`:
 * una respuesta que nadie mira es un `401` que no termina la sesión.
 *
 * Cada aplicación lo cierra con sus `paths` de `contracts/ope/api.d.ts` y arma
 * sus llamadas encima, desenvolviendo cada respuesta con `unwrap`.
 */
export function createOpeClient<Paths extends object>(
  baseUrl: string,
  session: SessionHooks,
): OpeClient<Paths> {
  const client = createClient<Paths>({ baseUrl })

  const sessionAware: Middleware = {
    async onRequest({ request }) {
      return session.authorize(request)
    },
    async onResponse({ response }) {
      session.observe?.(response)
      return response
    },
  }
  client.use(sessionAware)

  return client
}
