/**
 * **La respuesta se lee en un solo lugar** (`CU-14`).
 *
 * OPE responde el recurso **pelado** —un `MerchantPage` es `{ items, nextCursor? }`
 * y nada alrededor— y, cuando no puede, un **Problem Details** (RFC 9457) con
 * `application/problem+json`. Si cada pantalla leyera lo suyo, el tipo del
 * problema se compararía por su texto en alguna y el identificador del pedido se
 * perdería en la mayoría — y se nota recién el día que alguien llama para pedir
 * ayuda.
 */

/** El espacio de nombres de todo `type` del catálogo de OPE. Se recorta al leer. */
export const PROBLEM_NAMESPACE = 'urn:ope:problem:'

/** Lo que `type` vale cuando el servidor no llegó a armar un problema. */
export const UNKNOWN_PROBLEM = 'unknown'

/**
 * Una violación del contrato, tal como el servidor la señala.
 *
 * `pointer` es un JSON Pointer **relativo al pedido**: `/body/origins/0`,
 * `/query/cursor`, `/headers/x`. Sólo los del cuerpo son de un campo del
 * formulario; `fieldNameOf` es quien lo sabe.
 */
export type FieldError = {
  readonly pointer: string
  readonly message: string
}

/**
 * Lo mismo, **ya traducido a un campo del formulario**.
 *
 * Es lo que la puerta le da a `useForm`: el formulario sabe qué control
 * corresponde a cada nombre, y no tiene por qué saber la forma de un puntero.
 */
export type RejectedField = {
  readonly field: string
  readonly message: string
}

/**
 * Lo que respondió el servidor cuando no pudo.
 *
 * **No es una `Failure`** (`CU-45`): aquéllas son defectos nuestros —una
 * declaración mal hecha, un puerto sin proveedor—. Un `422` porque un origen ya
 * es de otro merchant es una respuesta esperada del negocio, y una pantalla la
 * muestra en vez de romperse.
 */
export class RequestFailed extends Error {
  /** El de HTTP. Decide si tiene sentido reintentar (`CU-9`). */
  readonly status: number
  /**
   * **Sobre esto se ramifica, nunca sobre `detail`** (`CU-14`). Es el slug del
   * catálogo de problemas, sin `urn:ope:problem:`: `merchant-out-of-scope`.
   * `detail` es texto para una persona y cambia sin que eso sea un cambio de
   * contrato.
   */
  readonly type: string
  /** Fijo por tipo de problema. */
  readonly title: string
  /** De esta ocurrencia, si el servidor lo escribió. */
  readonly detail: string | undefined
  /**
   * Lo que el operador cita para pedir ayuda (`CU-25`).
   *
   * **Opcional, y nunca inventado.** Sale del encabezado `X-Request-Id` o del
   * miembro `requestId` del problema, que OPE agrega en su feature 040. Hasta
   * entonces falta, y que falte **se muestra** (`strings.noRequestId`) en vez
   * de rellenarse con un texto que parece un identificador.
   */
  readonly requestId: string | undefined
  /** Presente sólo en `400` y `422`. Va a los campos, o al aviso (`CU-38`). */
  readonly errors: readonly FieldError[]

  constructor(problem: {
    readonly status: number
    readonly type: string
    readonly title: string
    readonly detail?: string
    readonly requestId?: string
    readonly errors?: readonly FieldError[]
  }) {
    /* El mensaje del `Error` es lo que se muestra: el detalle de esta ocurrencia,
       o el título del tipo si el servidor no escribió uno. */
    super(problem.detail ?? problem.title)
    this.name = 'RequestFailed'
    this.status = problem.status
    this.type = problem.type
    this.title = problem.title
    this.detail = problem.detail
    this.requestId = problem.requestId
    this.errors = problem.errors ?? []
  }
}

/** Si una falla vino del servidor, y de qué tipo. Para tratarla, no para leerla. */
export function failedWith(error: unknown, type: string): error is RequestFailed {
  return error instanceof RequestFailed && error.type === type
}

/**
 * **De qué campo del formulario habla un puntero**, o `undefined` si de ninguno.
 *
 * `/body/origins/0` → `origins.0`. Un puntero bajo `/query` o `/headers` no es
 * del formulario —el operador no escribió ese dato— y va al aviso, no a un
 * control que no existe. Es lo único que sabe la forma del puntero: ni la puerta
 * ni el formulario la conocen. Que el cuerpo va bajo `/body` lo fija el backend
 * (`BODY_POINTER` en su `dispatch.ts`) y lo documenta su `ProblemDetails`.
 */
export function fieldNameOf(pointer: string): string | undefined {
  const match = /^\/body\/(.+)$/.exec(pointer)
  if (!match?.[1]) return undefined
  return match[1]
    .split('/')
    .map((segment) => segment.replaceAll('~1', '/').replaceAll('~0', '~'))
    .join('.')
}

/**
 * Lee la respuesta, o tira lo que el servidor dijo.
 *
 * Recibe lo que devuelve `openapi-fetch` —datos, error y la respuesta cruda— y
 * devuelve **el recurso tal cual**: OPE no lo envuelve. Un `204` devuelve
 * `undefined`, que es lo que su tipo dice.
 */
export function unwrap<T>(result: { data?: unknown; error?: unknown; response: Response }): T {
  if (result.error !== undefined) throw asRequestFailed(result.error, result.response)

  if (result.response.status === 204) return undefined as T

  return result.data as T
}

/**
 * **El problema, leído por su forma y no por lo que se supone que trae.**
 *
 * Un intermediario que cortó antes —un `502` con HTML, un cuerpo vacío— no
 * arma un Problem Details. Se devuelve igual un `RequestFailed`, con `type`
 * `unknown` y el estado como título, porque lo que la pantalla necesita es
 * poder mostrar «no se pudo» con lo que haya: y lo que haya es, a veces, sólo
 * el identificador del encabezado.
 */
function asRequestFailed(raw: unknown, response: Response): RequestFailed {
  const body = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}
  const type = typeof body.type === 'string' ? withoutNamespace(body.type) : UNKNOWN_PROBLEM

  return new RequestFailed({
    status: response.status,
    type,
    title: typeof body.title === 'string' ? body.title : `HTTP ${response.status}`,
    detail: typeof body.detail === 'string' ? body.detail : undefined,
    requestId: typeof body.requestId === 'string' ? body.requestId : requestIdFrom(response),
    errors: Array.isArray(body.errors) ? body.errors.filter(isFieldError) : [],
  })
}

function withoutNamespace(type: string): string {
  return type.startsWith(PROBLEM_NAMESPACE) ? type.slice(PROBLEM_NAMESPACE.length) : type
}

function isFieldError(each: unknown): each is FieldError {
  if (typeof each !== 'object' || each === null) return false
  /* Se mira la forma de lo que llegó, no su contenido: es lo que hace falta
     para armar el error antes de que exista (`CU-14`). */
  const candidate = each as Partial<FieldError>
  return typeof candidate.pointer === 'string' && typeof candidate.message === 'string'
}

/**
 * **El encabezado, cuando viene.**
 *
 * Hoy OPE no manda `X-Request-Id`; lo agrega su feature 040, y entonces
 * también en las respuestas que un intermediario corta antes de que el servidor
 * arme un cuerpo — que son justamente las más difíciles de diagnosticar. Hasta
 * entonces esto devuelve `undefined`, y **`undefined` no se disfraza**.
 */
function requestIdFrom(response: Response): string | undefined {
  return response.headers.get('X-Request-Id') ?? undefined
}
