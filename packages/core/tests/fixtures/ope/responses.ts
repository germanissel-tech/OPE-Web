/**
 * **Respuestas de OPE, tal como el contrato las ejemplifica.**
 *
 * Sacadas de los ejemplos de `contracts/ope/openapi.yaml` (`listMerchants`,
 * `OperatorUnauthorized`, `MerchantForbidden`, `MerchantUnprocessable`,
 * `MerchantConflict`, `BadRequest`). Las pruebas del núcleo corren sobre esto y
 * no sobre un sobre inventado: lo que se verifica es que el núcleo lee **lo que
 * el backend responde**, y si el contrato cambia de forma, cambia acá.
 *
 * `requestId` no aparece en ningún problema **a propósito**: hoy OPE no lo
 * manda, y lo agrega su feature 040. Las pruebas de «sin identificador» son
 * las del presente.
 */

const PROBLEM = 'urn:ope:problem:'

/** La forma de `Merchant` del contrato, en lo que estas pruebas tocan. */
export type Merchant = {
  readonly merchantId: string
  readonly status: 'active' | 'off' | 'deactivated'
  readonly origins: readonly string[]
  readonly createdAt: string
  readonly credentials: readonly { readonly kind: string; readonly issuedAt: string }[]
}

/** La forma de todo `<X>Page` del contrato (`ADR-020`). */
export type MerchantPage = {
  readonly items: readonly Merchant[]
  readonly nextCursor?: string
}

export const merchant: Merchant = {
  merchantId: 'mrc_7f3k5d2q4m6x',
  status: 'active',
  origins: ['https://tienda.example'],
  createdAt: '2026-09-20T12:00:00Z',
  credentials: [
    { kind: 'ingest', issuedAt: '2026-09-20T12:00:00Z' },
    { kind: 'platform', issuedAt: '2026-09-20T12:00:00Z' },
    { kind: 'signing', issuedAt: '2026-09-20T12:00:00Z' },
  ],
}

export const anotherMerchant: Merchant = {
  ...merchant,
  merchantId: 'mrc_2a9b4c8d1e3f',
  origins: ['https://otra.example'],
}

/** Un tramo con cursor: hay más. */
export const merchantPage: MerchantPage = {
  items: [merchant],
  nextCursor: 'eyJhZnRlciI6Im1yY183ZjNrNWQycTRtNngifQ',
}

/** El último tramo: sin cursor. */
export const lastMerchantPage: MerchantPage = {
  items: [anotherMerchant],
}

export const problems = {
  originAlreadyRegistered: {
    status: 422,
    body: {
      type: `${PROBLEM}origin-already-registered`,
      title: 'An origin already belongs to another merchant',
      status: 422,
      detail: 'An origin already belongs to another merchant.',
      instance: '/v1/admin/merchants',
      errors: [
        { pointer: '/body/origins/0', message: 'An origin already belongs to another merchant.' },
      ],
    },
  },
  validationFailed: {
    status: 400,
    body: {
      type: `${PROBLEM}validation-failed`,
      title: 'The request does not satisfy the contract',
      status: 400,
      instance: '/v1/admin/merchants',
      errors: [{ pointer: '/query/cursor', message: 'must match pattern' }],
    },
  },
  merchantOutOfScope: {
    status: 403,
    body: {
      type: `${PROBLEM}merchant-out-of-scope`,
      title: "The merchant is outside the operator's scope",
      status: 403,
      instance: '/v1/admin/merchants/mrc_7f3k5d2q4m6x/kill-switch',
    },
  },
  operatorUnknown: {
    status: 401,
    body: {
      type: `${PROBLEM}operator-unknown`,
      title: 'Operator token missing or unknown',
      status: 401,
      instance: '/v1/admin/log',
    },
  },
  merchantDeactivated: {
    status: 409,
    body: {
      type: `${PROBLEM}merchant-deactivated`,
      title: 'The merchant is deactivated',
      status: 409,
      instance: '/v1/admin/merchants/mrc_7f3k5d2q4m6x/kill-switch',
    },
  },
} as const

export type ProblemFixture = (typeof problems)[keyof typeof problems]

/**
 * Lo que `openapi-fetch` le da a `unwrap` cuando el servidor respondió un
 * problema: el cuerpo ya leído en `error`, y la respuesta cruda.
 */
export function failing(problem: ProblemFixture, headers: Record<string, string> = {}) {
  return {
    error: problem.body,
    response: new Response(null, {
      status: problem.status,
      headers: { 'Content-Type': 'application/problem+json', ...headers },
    }),
  }
}

/**
 * Un intermediario que cortó antes: `502` con un cuerpo que no es un problema.
 * `openapi-fetch` entrega el texto tal cual cuando no puede leerlo como JSON.
 */
export function cutByProxy(headers: Record<string, string> = {}) {
  return {
    error: '<html><body>Bad Gateway</body></html>',
    response: new Response(null, { status: 502, headers }),
  }
}

/** Una respuesta que salió bien, con el cuerpo pelado. */
export function succeeding<T>(data: T, status = 200, headers: Record<string, string> = {}) {
  return { data, response: new Response(null, { status, headers }) }
}
