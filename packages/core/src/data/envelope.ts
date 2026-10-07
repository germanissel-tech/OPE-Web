/**
 * **El sobre se abre en un solo lugar** (`CU-14`).
 *
 * Todo contrato de Tandilia responde `{ data, meta }`, y `meta.requestId` es el
 * dato que un operador cita para pedir ayuda. Si cada pantalla desenvolviera lo
 * suyo, el identificador se perdería en la mayoría — y se nota recién el día que
 * alguien llama para reportar un problema.
 */

/** Un campo que el servidor rechazó, para llevarlo al campo que lo pidió. */
export type FieldError = {
  readonly field: string
  readonly code: string
  readonly message: string
}

/**
 * Lo que respondió el servidor cuando no pudo.
 *
 * **No es una `Failure`** (`CU-45`): aquéllas son defectos nuestros —una
 * declaración mal hecha, un puerto sin proveedor—. Un `409` porque el nombre
 * está repetido es una respuesta esperada del negocio, y una pantalla la
 * muestra en vez de romperse.
 */
export class RequestFailed extends Error {
  constructor(
    /** El de HTTP. Decide si tiene sentido reintentar (`CU-9`). */
    readonly status: number,
    /**
     * **Sobre esto se ramifica, nunca sobre el mensaje** (`CU-14`). Es un enum
     * cerrado del contrato; el mensaje es castellano para una persona y puede
     * cambiar sin que eso sea un cambio de contrato.
     */
    readonly code: string,
    /** Lo que el operador cita para pedir ayuda (`CU-25`). */
    readonly requestId: string,
    message: string,
    /** Presente sólo en errores de validación. Va a los campos (`CU-38`). */
    readonly fields: readonly FieldError[] = [],
  ) {
    super(message)
    this.name = 'RequestFailed'
  }
}

/** Si una falla vino del servidor, y con qué código. Para tratarla, no para leerla. */
export function failedWith(error: unknown, code: string): error is RequestFailed {
  return error instanceof RequestFailed && error.code === code
}

/** Lo que trae toda respuesta, paginada o no. */
export type Meta = {
  readonly requestId: string
  /**
   * **Qué versión del recurso es ésta** (`CU-29`).
   *
   * Sale del encabezado, igual que `requestId`, y es **opaca**: cuarzo la guarda
   * y la devuelve al escribir, no la lee ni la compara. Con ella el servidor
   * puede rechazar un guardado sobre una versión vieja, que es lo único que
   * convierte «otro editó lo mismo» en algo detectable.
   *
   * **Opcional a propósito**: una lista no la trae —es de un recurso, no de una
   * página— y un servidor que no la emite tampoco. Que falte no es un error de
   * transporte; es un error recién cuando alguien intenta escribir un recurso
   * que la exige, y eso lo dice el tipo de la operación.
   */
  readonly version?: string
  readonly page?: number
  readonly size?: number
  readonly totalItems?: number
  readonly totalPages?: number
}

/**
 * El sobre de una respuesta **paginada**.
 *
 * Los cuatro campos son opcionales en `Meta` porque una respuesta sin paginar
 * no los trae. Pero el contrato los da **todos o ninguno** —su `PageMeta` los
 * declara requeridos—, así que tratarlos de a uno obliga a inventar un valor por
 * omisión para cada uno, **y ahí es donde se copia el tamaño de página**.
 */
export type PagedMeta = Meta & {
  readonly page: number
  readonly size: number
  readonly totalItems: number
  readonly totalPages: number
}

/** Si el sobre trae paginación. Se pregunta una vez, no campo por campo. */
export function isPaged(meta: Meta | undefined): meta is PagedMeta {
  return (
    meta?.page !== undefined &&
    meta.size !== undefined &&
    meta.totalItems !== undefined &&
    meta.totalPages !== undefined
  )
}

/** Lo que una pantalla recibe: los datos, y de dónde salieron. */
export type Page<T> = {
  readonly data: T
  readonly meta: Meta
}

/**
 * Abre el sobre, o tira lo que el servidor dijo.
 *
 * Recibe lo que devuelve `openapi-fetch` —datos, error y la respuesta cruda— y
 * **no pierde el identificador por ninguno de los dos caminos**: el del éxito
 * lo lleva en `meta`, y el de la falla lo saca del cuerpo del error o, si el
 * servidor no llegó a armarlo, del encabezado.
 */
export function unwrap<T>(result: {
  data?: unknown
  error?: unknown
  response: Response
}): Page<T> {
  if (result.error !== undefined) throw asRequestFailed(result.error, result.response)

  const body = result.data
  if (typeof body !== 'object' || body === null || !('data' in body)) {
    throw new RequestFailed(
      result.response.status,
      'ENVELOPE_MISSING',
      requestIdFrom(result.response),
      'La respuesta no vino en el sobre que declara el contrato.',
    )
  }

  const meta = 'meta' in body && typeof body.meta === 'object' ? body.meta : null
  const version = versionFrom(result.response)

  return {
    data: body.data as T,
    /* **El testigo sale del encabezado o no sale**, al revés que el
       identificador: aquél admite que el cuerpo lo diga mejor, y éste no. Por
       eso el cuerpo entra ya sin él, y no sólo pisado después. */
    meta: { requestId: requestIdFrom(result.response), ...withoutVersion(meta), ...version },
  }
}

function asRequestFailed(raw: unknown, response: Response): RequestFailed {
  const body =
    typeof raw === 'object' && raw !== null && 'error' in raw
      ? (raw.error as Record<string, unknown>)
      : {}

  return new RequestFailed(
    response.status,
    typeof body.code === 'string' ? body.code : 'UNKNOWN',
    typeof body.requestId === 'string' ? body.requestId : requestIdFrom(response),
    typeof body.message === 'string' ? body.message : 'El servidor no pudo responder el pedido.',
    Array.isArray(body.fields) ? (body.fields as FieldError[]) : [],
  )
}

/**
 * **El encabezado, como respaldo.**
 *
 * El contrato manda `X-Request-Id` en toda respuesta, incluidas las que un
 * intermediario corta antes de que el servidor arme un cuerpo. Sin esto, esos
 * casos —los más difíciles de diagnosticar— son justamente los que quedan sin
 * identificador.
 */
function requestIdFrom(response: Response): string {
  return response.headers.get('X-Request-Id') ?? 'sin-identificador'
}

/**
 * **El testigo, si vino** (`CU-29`).
 *
 * Devuelve un objeto y no un valor para que **la ausencia no escriba la clave**:
 * con `version: undefined`, un `meta` de una lista diría que el testigo se
 * consultó y no está, cuando lo cierto es que no corresponde. Es la diferencia
 * entre «no hay» y «no aplica», y acá se nota en un `in`.
 */
function versionFrom(response: Response): { version?: string } {
  const etag = response.headers.get('ETag')
  return etag === null ? {} : { version: etag }
}

/**
 * El sobre del cuerpo, **sin lo que el cuerpo diga de la versión** (`CU-29`).
 *
 * Pisar con el encabezado no alcanza: **cuando el encabezado no vino no hay con
 * qué pisar**, y un `version` del cuerpo pasaba entero. La pantalla se quedaba
 * con un testigo que el transporte nunca confirmó y lo mandaba como `If-Match`.
 *
 * Se borra en vez de confiar en el orden del `...` porque el orden sólo decide
 * quién gana **cuando los dos están**.
 */
function withoutVersion(meta: object | null): Record<string, unknown> {
  const rest = { ...meta } as Record<string, unknown>
  delete rest.version
  return rest
}
