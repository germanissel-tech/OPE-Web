import { durationIn, type Presentation, rateToPercent } from '@ope/core'
import { configurationStrings } from '../strings'

/**
 * **Un valor de configuración, como se lee** (`CU-6`, `GR-31`).
 *
 * Un solo lugar dice cómo se ve cada valor —en la vista del merchant, en la de
 * los defaults, en la de la plataforma—, así que el mismo dato se lee igual en
 * las tres. La forma viene de la tabla de unidades (`units.ts`); el texto, del
 * catálogo.
 */

/** Los valores cerrados del contrato, por el nombre con que el catálogo los dice. */
const CLOSED: ReadonlyMap<string, string> = new Map(
  (
    [
      'product',
      'cart',
      'fit',
      'price',
      'returns',
      'push',
      'pull',
      'subscribe',
      'from-cart',
      'from-checkout',
      'never',
      'nothing',
      'reassure-returns',
    ] as const
  ).map((value) => [value, configurationStrings[value]]),
)

/** El separador decimal que se lee: el mismo que granito muestra. */
const decimalComma = (text: string) => text.replace('.', ',')

/** Un valor suelto: un número con su unidad, una marca, un valor cerrado o un texto. */
function scalar(value: unknown, how: Presentation | undefined): string {
  if (typeof value === 'boolean') return value ? configurationStrings.yes : configurationStrings.no
  if (typeof value === 'number') {
    /* `String` da la representación más corta que vuelve al mismo número: es
       el texto que viajó, que es lo que las conversiones esperan. */
    const raw = String(value)
    if (how === undefined) return decimalComma(raw)
    if ('rate' in how) {
      const percent = rateToPercent(raw)
      return percent === undefined
        ? raw
        : `${decimalComma(percent)} ${configurationStrings.percent}`
    }
    const { base, unit } = how.duration
    const inUnit = durationIn(raw, base, unit)
    /* Si no entra exacto en su unidad, se muestra en la del contrato: nunca se
       redondea un valor que va a viajar (research §5). */
    return inUnit === undefined
      ? `${raw} ${configurationStrings.units[base]}`
      : `${decimalComma(inUnit)} ${configurationStrings.units[unit]}`
  }
  if (typeof value === 'string') return CLOSED.get(value) ?? value
  return ''
}

/** Un valor del tratamiento o de la plataforma, como se lee. Una lista se lee separada por comas. */
export function present(value: unknown, how?: Presentation): string {
  if (Array.isArray(value)) return value.map((each: unknown) => scalar(each, how)).join(', ')
  return scalar(value, how)
}

/** Lo que hay en un camino con puntos de un objeto, o nada. */
export function valueAt(source: unknown, path: string): unknown {
  let at: unknown = source
  for (const segment of path.split('.')) {
    if (typeof at !== 'object' || at === null) return undefined
    /* El descriptor y no un `as`: se lee lo que hay sin afirmar qué forma tiene. */
    at = Object.getOwnPropertyDescriptor(at, segment)?.value
  }
  return at
}
