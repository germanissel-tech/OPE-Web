import {
  durationFrom,
  durationIn,
  exactDecimals,
  type FieldConstraints,
  type MessageConstraints,
  type Presentation,
  percentToRate,
  rateToPercent,
  scaledRange,
} from '@ope/core'
import { valueAt } from './present'

/**
 * **Los valores del contrato, como campos de un formulario, y de vuelta**
 * (research §1, §3 a §6).
 *
 * Un formulario es un mapa de textos; el contrato, un objeto anidado con
 * números, marcas y listas. Esto traduce en los dos sentidos, con tres reglas:
 *
 * - **El nombre de un campo es el camino de su valor en el cuerpo** —
 *   `declared.freshness.catalogMs`—, y así el puntero de un `422` es su nombre.
 * - **Una lista es su nombre más sus renglones.** El nombre solo, con texto
 *   vacío, dice que la lista está; los renglones (`x.0`, `x.1`) son sus
 *   elementos. Sin el nombre, una lista declarada vacía y una heredada serían
 *   lo mismo, y no lo son.
 * - **Un número se carga en la unidad en que se lee**, y esa unidad se elige al
 *   cargar el valor: la del valor si entra exacto, la del contrato si no. Se
 *   guarda aparte (`Shown`), porque volver al contrato exige saber en qué
 *   unidad se escribió.
 */

/** En qué se está mostrando cada campo numérico, por hoja: tasa, una duración en una unidad, o tal cual. */
export type Shown = Readonly<Record<string, Presentation | undefined>>

/** Qué control dibuja un valor, según lo que el contrato dice de él. */
export type Kind = 'number' | 'boolean' | 'choice' | 'text' | 'marks' | 'numbers' | 'texts'

export function kindOf(field: FieldConstraints | undefined): Kind {
  switch (field?.type) {
    case 'boolean':
      return 'boolean'
    case 'number':
    case 'integer':
      return 'number'
    case 'array':
      if (field.items?.enum !== undefined) return 'marks'
      return field.items?.type === 'number' || field.items?.type === 'integer' ? 'numbers' : 'texts'
    default:
      return field?.enum === undefined ? 'text' : 'choice'
  }
}

/** Cuántos decimales tiene un texto decimal. */
const decimalsIn = (text: string) => (text.includes('.') ? text.length - text.indexOf('.') - 1 : 0)

/**
 * **En qué unidad se carga un número**, dado el valor que tiene: la preferida
 * si entra exacta, la del contrato si no. Una tasa siempre en porcentaje.
 */
export function shownFor(value: number, preferred: Presentation | undefined) {
  if (preferred === undefined || 'rate' in preferred) return preferred
  const { base, unit } = preferred.duration
  return durationIn(String(value), base, unit) === undefined
    ? { duration: { base, unit: base } }
    : preferred
}

/** Un número del contrato como el texto que se carga. */
export function numberToText(value: number, shown: Presentation | undefined): string {
  const raw = String(value)
  if (shown === undefined) return raw
  if ('rate' in shown) return rateToPercent(raw) ?? raw
  return durationIn(raw, shown.duration.base, shown.duration.unit) ?? raw
}

/** Lo cargado como el número que viaja, o nada si no es un número. */
export function textToNumber(text: string, shown: Presentation | undefined): number | undefined {
  const trimmed = text.trim()
  if (trimmed === '') return undefined
  const raw =
    shown === undefined
      ? trimmed
      : 'rate' in shown
        ? percentToRate(trimmed)
        : durationFrom(trimmed, shown.duration.unit, shown.duration.base)
  if (raw === undefined) return undefined
  const value = Number(raw)
  return Number.isNaN(value) ? undefined : value
}

/**
 * **Cuántos decimales ofrece el campo**: los que el valor necesita, con un
 * mínimo de dos para una tasa o una duración y ninguno para un entero; y en una
 * duración, nunca más de los que la unidad garantiza exactos. Granito recorta
 * lo que pasa de ahí, así que ningún valor tecleado puede ser inexacto.
 */
export function decimalsFor(text: string, shown: Presentation | undefined, integer: boolean) {
  if (shown === undefined) return integer ? 0 : Math.max(2, decimalsIn(text))
  if ('rate' in shown) return Math.max(2, decimalsIn(text))
  const { base, unit } = shown.duration
  const exact = exactDecimals(unit, base)
  return Math.min(exact, Math.max(exact === 0 ? 0 : 2, decimalsIn(text)))
}

/** Las entradas de un valor del contrato en el formulario, bajo su nombre. */
export function entriesOf(
  name: string,
  value: unknown,
  kind: Kind,
  shown: Presentation | undefined,
): Record<string, string> {
  if (Array.isArray(value)) {
    const entries: Record<string, string> = { [name]: '' }
    value.forEach((each: unknown, at) => {
      entries[`${name}.${at}`] = typeof each === 'number' ? numberToText(each, shown) : String(each)
    })
    return entries
  }
  if (kind === 'number' && typeof value === 'number') {
    return { [name]: numberToText(value, shown) }
  }
  return { [name]: typeof value === 'boolean' ? String(value) : String(value ?? '') }
}

/** Los renglones de una lista, en orden. */
export function rowsOf(values: Readonly<Record<string, string>>, name: string): string[] {
  const rows: [number, string][] = []
  for (const key of Object.keys(values)) {
    if (!key.startsWith(`${name}.`)) continue
    const index = key.slice(name.length + 1)
    if (/^\d+$/.test(index)) rows.push([Number(index), key])
  }
  return rows.sort((a, b) => a[0] - b[0]).map(([, key]) => key)
}

/** El valor del contrato que dicen las entradas de un campo; nada si no está. */
export function valueFrom(
  values: Readonly<Record<string, string>>,
  name: string,
  kind: Kind,
  shown: Presentation | undefined,
): unknown {
  if (!(name in values)) return undefined
  const rows = rowsOf(values, name).map((key) => values[key] ?? '')
  switch (kind) {
    case 'marks':
    case 'texts':
      return rows.filter((each) => each.trim() !== '')
    case 'numbers':
      return rows
        .map((each) => textToNumber(each, shown))
        .filter((each): each is number => each !== undefined)
    case 'boolean':
      return values[name] === 'true'
    case 'number':
      return textToNumber(values[name] ?? '', shown)
    default: {
      const text = values[name] ?? ''
      return text === '' ? undefined : text
    }
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Poner un valor en un camino con puntos, creando lo que falte.
 *
 * **Sólo sobre objetos que arma quien llama.** Lo que viaja intacto —la
 * política de decisión, el mapa de anclajes— se cuelga entero después, y nunca
 * se escribe adentro: así no hay copia que hacer ni objeto ajeno que tocar.
 */
export function setAt(target: Record<string, unknown>, path: string, value: unknown) {
  const segments = path.split('.')
  const last = segments.pop()
  if (last === undefined) return
  let at = target
  for (const segment of segments) {
    const next = at[segment]
    if (isRecord(next)) {
      at = next
      continue
    }
    const created: Record<string, unknown> = {}
    at[segment] = created
    at = created
  }
  at[last] = value
}

/**
 * **Las restricciones de un campo, en la unidad en que se carga** (research §3).
 * Un rango de 0 a 1 se juzga de 0 a 100 si el campo es un porcentaje.
 */
export function constraintsIn(
  constraints: MessageConstraints,
  prefix: string,
  shown: Shown,
): MessageConstraints {
  const fields: Record<string, FieldConstraints> = { ...constraints.fields }
  for (const [leaf, how] of Object.entries(shown)) {
    if (how === undefined) continue
    const name = `${prefix}.${leaf}`
    const field = fields[name]
    if (field === undefined) continue
    fields[name] =
      field.items === undefined
        ? { ...field, ...scaledRange(field, how) }
        : { ...field, items: { ...field.items, ...scaledRange(field.items, how) } }
  }
  return { required: constraints.required, fields }
}

/** Lo que hay en un camino, para quien arma el formulario desde un objeto. */
export { valueAt }
