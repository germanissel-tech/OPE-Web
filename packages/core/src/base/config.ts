import { Failure } from './failure'
import { baseUrl, because, mapOf, milliseconds, parse, type Shape, type ValueOf } from './schema'

/**
 * La configuración se lee **al arrancar**, no se hornea al compilar (`CU-17`).
 *
 * Eso es lo que permite promover **una sola compilación** de pruebas a
 * producción sin recompilar, que es lo único que garantiza que lo que se
 * despliega es exactamente lo que se probó.
 *
 * Y si falta un valor obligatorio, **la aplicación no arranca y dice cuál** — el
 * porqué está en `CU-17`.
 */

/**
 * Lo que el marco necesita de cualquier aplicación de Tandilia. **Es el piso**:
 * una aplicación agrega lo suyo extendiendo este esquema.
 *
 * ```ts
 * const schema = { ...baseSchema, notificationsUrl: url }
 * type Config = ValueOf<typeof schema>
 * const readConfig = () => readConfigWith(schema)
 * ```
 *
 * **El tipo sale de acá, no al revés.** Por eso no se puede declarar un dato
 * obligatorio y olvidarse de validarlo: no hay dónde escribirlo dos veces.
 */
export const baseSchema = {
  /**
   * La URL base de cada sistema que la aplicación consume — `CU-22`.
   *
   * Absoluta, o **una ruta desde la raíz** (`/api`): la consola habla con su
   * propio origen y un reenvío la lleva al backend, así que no hay CORS que
   * pedir. **Nada de ningún proveedor de identidad**: lo que un adaptador
   * necesita lo recibe el adaptador, tipado como suyo. Y un `config.json`
   * nunca lleva una credencial: el esquema no tiene dónde ponerla.
   */
  systems: because(mapOf(baseUrl), 'La aplicación no tendría a quién preguntarle'),
  /** Cuánto se espera antes de mostrar que se está resolviendo — `CU-9`. */
  waitThresholdMs: milliseconds,
} satisfies Shape

export type BaseConfig = ValueOf<typeof baseSchema>

/**
 * Lo que falta, con el detalle de por qué. Se muestra en pantalla, no sólo en
 * la consola.
 *
 * Es una `Failure` como el resto (`CU-45`), y agrega `missing` porque la
 * pantalla de arranque los enumera: el código dice qué clase de falla es, la
 * lista dice qué hay que escribir en `/config.json`.
 */
export class IncompleteConfig extends Failure {
  constructor(readonly missing: readonly string[]) {
    super(
      'startup.incompleteConfig',
      `La configuración está incompleta y la aplicación no puede arrancar:\n${missing
        .map((m) => `  · ${m}`)
        .join('\n')}`,
    )
    this.name = 'IncompleteConfig'
  }
}

const DEFAULT_PATH = '/config.json'

/** Lee `/config.json` contra el esquema que se le pase. */
export async function readConfigWith<S extends Shape>(shape: S): Promise<ValueOf<S>> {
  let response: Response
  try {
    /* `cache: 'no-store'` acompaña a la cabecera que pone el servidor (`CU-36`).
       No la reemplaza: si el servidor la cachea igual, el síntoma es que la
       aplicación apunta al emisor equivocado sin que falle nada. */
    response = await fetch(DEFAULT_PATH, { cache: 'no-store' })
  } catch (cause) {
    throw new IncompleteConfig([`${DEFAULT_PATH} no se pudo pedir (${String(cause)})`])
  }

  if (!response.ok) {
    throw new IncompleteConfig([
      `${DEFAULT_PATH} respondió ${response.status} ${response.statusText}`,
    ])
  }

  let raw: unknown
  try {
    raw = await response.json()
  } catch {
    throw new IncompleteConfig([`${DEFAULT_PATH} no es JSON válido`])
  }

  const read = parse(shape, raw, DEFAULT_PATH)
  if (!read.ok) throw new IncompleteConfig(read.missing)
  return read.value
}

/** La del piso. Una aplicación que no agrega nada usa ésta. */
export const readConfig = (): Promise<BaseConfig> => readConfigWith(baseSchema)
