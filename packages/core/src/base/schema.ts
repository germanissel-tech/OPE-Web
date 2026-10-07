/**
 * **Cómo se declara lo que la configuración tiene que traer** (`CU-17`).
 *
 * Un campo es una función que recibe lo crudo y devuelve **el valor o el
 * motivo**. De ahí salen las dos cosas a la vez:
 *
 * - **El tipo de la configuración**, con `ValueOf<typeof esquema>`.
 * - **La lista de faltantes**, completa y de una sola pasada.
 *
 * Que sean lo mismo es el punto. Con la validación escrita a mano, el tipo
 * obliga a **producir** un valor pero no a **validarlo**: `String(algo)` da
 * `'undefined'`, que es un texto perfectamente válido, y la aplicación arranca
 * apuntando a un servidor que no existe. Acá el valor **sólo existe si pasó por
 * su campo**.
 *
 * Y agregar un dato obligatorio es **un renglón del esquema**, no tres lugares
 * de una función que hay que acordarse de tocar los tres.
 */

/** El valor, o los motivos. Nunca las dos cosas, y nunca ninguna. */
export type Read<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly missing: readonly string[] }

/**
 * Un campo del esquema.
 *
 * Recibe `path` para poder decir **cuál** falta —`systems.centinela` y no
 * «falta una URL»—, que es lo que convierte un error de despliegue en algo que
 * se arregla sin adivinar.
 */
export type Field<T> = (raw: unknown, path: string) => Read<T>

const ok = <T>(value: T): Read<T> => ({ ok: true, value })
const fail = (...missing: string[]): Read<never> => ({ ok: false, missing })

export const text: Field<string> = (raw, path) =>
  typeof raw === 'string' && raw.trim() !== '' ? ok(raw) : fail(`${path} — falta, o no es un texto`)

/**
 * Una URL absoluta `http` o `https`.
 *
 * Se exige el protocolo porque `new URL('localhost:4010')` **no falla**: lo lee
 * como un protocolo llamado `localhost`. Sin esta comprobación, el error de
 * tipeo más común de una configuración pasa entero.
 */
export const url: Field<string> = (raw, path) => {
  if (typeof raw !== 'string' || raw.trim() === '') return fail(`${path} — falta, o no es una URL`)
  try {
    const { protocol } = new URL(raw)
    if (protocol !== 'http:' && protocol !== 'https:') {
      return fail(`${path} — no es una URL http o https`)
    }
    return ok(raw)
  } catch {
    return fail(`${path} — no es una URL`)
  }
}

export const milliseconds: Field<number> = (raw, path) =>
  typeof raw === 'number' && Number.isFinite(raw) && raw > 0
    ? ok(raw)
    : fail(`${path} — falta, o no es una cantidad de milisegundos`)

/**
 * Un mapa de nombre a algo, con al menos una entrada.
 *
 * **Y las claves que se le pidan, obligatorias.** No es sólo una validación
 * más: el tipo que devuelve las declara presentes, así que `config.systems.demo`
 * es un texto y no `string | undefined`. Sin eso, quien lo usa termina
 * poniéndole un `?? ''` y la configuración faltante se descubre en una llamada
 * a una URL vacía.
 */
export function mapOf<T, K extends string = never>(
  field: Field<T>,
  required: readonly K[] = [],
): Field<Readonly<Record<K, T>> & Readonly<Record<string, T | undefined>>> {
  return (raw, path) => {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      return fail(`${path} — falta, o no es un mapa`)
    }

    const entries = Object.entries(raw)
    if (entries.length === 0) return fail(`${path} — está vacío`)

    const absent = required.filter((key) => !(key in raw))
    if (absent.length > 0) {
      return fail(...absent.map((key) => `${path}.${key} — falta, y esta aplicación lo necesita`))
    }

    const value: Record<string, T> = {}
    const missing: string[] = []
    for (const [key, item] of entries) {
      const read = field(item, `${path}.${key}`)
      if (read.ok) value[key] = read.value
      else missing.push(...read.missing)
    }

    /* Las obligatorias ya se comprobaron arriba, así que acá están. */
    return missing.length > 0
      ? { ok: false, missing }
      : ok(value as Readonly<Record<K, T>> & Readonly<Record<string, T | undefined>>)
  }
}

/**
 * El mismo campo, con la consecuencia pegada al motivo.
 *
 * «`systems` está vacío» dice qué pasa; «y la aplicación no tendría a quién
 * preguntarle» dice por qué importa. Quien lee esto está desplegando, no
 * programando, y no tiene el código a mano.
 */
export function because<T>(field: Field<T>, why: string): Field<T> {
  return (raw, path) => {
    const read = field(raw, path)
    return read.ok ? read : { ok: false, missing: read.missing.map((m) => `${m}. ${why}`) }
  }
}

export type Shape = Readonly<Record<string, Field<unknown>>>

/** El tipo que produce un esquema. Es de dónde sale `BaseConfig`. */
export type ValueOf<S extends Shape> = {
  readonly [K in keyof S]: S[K] extends Field<infer T> ? T : never
}

/**
 * Lee un objeto entero contra su esquema.
 *
 * **Informa todos los faltantes de una vez**, no el primero: descubrirlos de a
 * uno son cuatro despliegues para enterarse de cuatro cosas.
 */
export function parse<S extends Shape>(shape: S, raw: unknown, path = ''): Read<ValueOf<S>> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return fail(`${path || 'la configuración'} no contiene un objeto`)
  }

  /* Estrecha, no agrega: después del guard esto es un objeto y se lo indexa. */
  const source = raw as Record<string, unknown>

  const value: Record<string, unknown> = {}
  const missing: string[] = []
  for (const [key, field] of Object.entries(shape)) {
    const read = field(source[key], path ? `${path}.${key}` : key)
    if (read.ok) value[key] = read.value
    else missing.push(...read.missing)
  }

  if (missing.length > 0) return { ok: false, missing }

  /* La única conversión, y en el borde donde corresponde: cada clave del
     esquema se llenó con lo que devolvió **su** campo, una línea más arriba. */
  return ok(value as ValueOf<S>)
}
