import { Failure } from './failure'

/**
 * **Una tasa y una duración, como las lee una persona.**
 *
 * El contrato habla en tasas de 0 a 1 y en duraciones en su unidad —casi
 * siempre milisegundos—, y no convierte (`ADR-035` del backend: «cómo se
 * muestre un 5 % en un frontend no es problema del backend»). Una persona lee
 * «5 %» y «36 h». Esto es la presentación, y nada más: lo que viaja no cambia.
 *
 * ## Por qué todo sobre el texto, y nada sobre `number`
 *
 * `0.07 * 100` es `7.000000000000001` en punto flotante, y una tasa que el
 * reparto cuantiza tiene que ser **exactamente** la de su balde. Así que una
 * tasa se convierte **corriendo la coma** sobre su texto decimal, y una
 * duración con enteros grandes (`BigInt`) y una escala. Granito ya viaja los
 * números como texto (`NumberInput.value` es `"12.50"`): no hay un `number` en
 * el camino que pueda redondear.
 */

/** Un número decimal como texto, partido: dígitos sin coma y cuántos van detrás de ella. */
type Decimal = { readonly digits: bigint; readonly scale: number }

const DECIMAL = /^(\d+)(?:\.(\d+))?$/

function parse(text: string): Decimal | undefined {
  const match = DECIMAL.exec(text.trim())
  if (!match) return undefined
  const whole = match[1] ?? '0'
  const fraction = match[2] ?? ''
  return { digits: BigInt(whole + fraction), scale: fraction.length }
}

/** El texto más corto que dice ese número: sin ceros a la derecha de la coma, ni coma sola. */
function render({ digits, scale }: Decimal): string {
  const text = digits.toString().padStart(scale + 1, '0')
  if (scale === 0) return text
  const whole = text.slice(0, text.length - scale)
  const fraction = text.slice(text.length - scale).replace(/0+$/, '')
  return fraction === '' ? whole : `${whole}.${fraction}`
}

/** Correr la coma: `shift` positivo multiplica por una potencia de diez, negativo divide. */
function shift(text: string, places: number): string | undefined {
  const value = parse(text)
  if (!value) return undefined
  const scale = value.scale - places
  return scale >= 0
    ? render({ digits: value.digits, scale })
    : render({ digits: value.digits * 10n ** BigInt(-scale), scale: 0 })
}

/** Una tasa del contrato (`"0.07"`) como porcentaje (`"7"`). */
export const rateToPercent = (rate: string): string | undefined => shift(rate, 2)

/** Un porcentaje (`"7"`, `"7.00"`) como la tasa que viaja (`"0.07"`). */
export const percentToRate = (percent: string): string | undefined => shift(percent, -2)

/** Las unidades de tiempo que un valor puede declarar. */
export type TimeUnit = 'ms' | 's' | 'min' | 'h' | 'd'

const MILLISECONDS: Readonly<Record<TimeUnit, bigint>> = {
  ms: 1n,
  s: 1000n,
  min: 60_000n,
  h: 3_600_000n,
  d: 86_400_000n,
}

/**
 * Cuántas unidades del contrato hay en una de las que se muestran.
 *
 * Una unidad menor que la del contrato —mostrar en milisegundos lo que viaja
 * en segundos— daría fracciones del contrato, que no existen: es un error de
 * quien declaró la unidad, y se dice al usarla.
 */
function factorOf(base: TimeUnit, unit: TimeUnit): bigint {
  const big = MILLISECONDS[unit]
  const small = MILLISECONDS[base]
  if (big < small || big % small !== 0n) {
    throw new Failure(
      'declaration.badUnit',
      `Una duración en ${base} no se muestra en ${unit}: la unidad tiene que ser igual o mayor.`,
    )
  }
  return big / small
}

/**
 * **Cuántos decimales de `unit` dan siempre un entero en `base`.**
 *
 * Es la mayor potencia de diez que divide al factor: en horas sobre
 * milisegundos, `3.600.000` es divisible por `10⁵`, así que cualquier valor con
 * hasta cinco decimales de hora es un número entero de milisegundos. Con esa
 * cantidad de decimales como tope, **ningún valor tecleado puede ser inexacto**:
 * no hace falta un error para lo que no puede pasar.
 */
export function exactDecimals(unit: TimeUnit, base: TimeUnit): number {
  let factor = factorOf(base, unit)
  let places = 0
  while (factor % 10n === 0n) {
    factor /= 10n
    places += 1
  }
  return places
}

/**
 * Una duración del contrato en la unidad que se muestra, **o nada si no entra
 * exacta** con los decimales que la unidad garantiza.
 *
 * Nada no es un error: es que este valor no se lee en esta unidad sin
 * redondear, y quien muestra cae a la unidad del contrato.
 */
export function durationIn(value: string, base: TimeUnit, unit: TimeUnit): string | undefined {
  const factor = factorOf(base, unit)
  const parsed = parse(value)
  /* Sin valor, o con decimales: el contrato viaja en enteros de su unidad. */
  if (parsed?.scale !== 0) return undefined
  const places = exactDecimals(unit, base)
  const scaled = parsed.digits * 10n ** BigInt(places)
  if (scaled % factor !== 0n) return undefined
  return render({ digits: scaled / factor, scale: places })
}

/** Lo tecleado en `unit`, como entero de la unidad del contrato; nada si no da un entero. */
export function durationFrom(text: string, unit: TimeUnit, base: TimeUnit): string | undefined {
  const factor = factorOf(base, unit)
  const parsed = parse(text)
  if (!parsed) return undefined
  const total = parsed.digits * factor
  const divisor = 10n ** BigInt(parsed.scale)
  if (total % divisor !== 0n) return undefined
  return (total / divisor).toString()
}

/** Cómo se presenta un valor: como tasa en porcentaje, o como duración en una unidad. */
export type Presentation =
  | { readonly rate: true }
  | { readonly duration: { readonly base: TimeUnit; readonly unit: TimeUnit } }

/**
 * **El rango del contrato, en la unidad que se muestra.**
 *
 * La capa 1 juzga el texto que el operador ve: si el campo dice `5` con `%` y la
 * restricción dice «máximo 1», el error es falso. El rango viaja con la unidad.
 * Es un rango para avisar, no un valor que viaje: acá un `number` alcanza.
 */
export function scaledRange(
  range: { readonly minimum?: number; readonly maximum?: number },
  how: Presentation,
): { minimum?: number; maximum?: number } {
  const by =
    'rate' in how
      ? (n: number) => n * 100
      : (n: number) => n / Number(factorOf(how.duration.base, how.duration.unit))
  return {
    ...(range.minimum === undefined ? {} : { minimum: by(range.minimum) }),
    ...(range.maximum === undefined ? {} : { maximum: by(range.maximum) }),
  }
}
