import { describe, expect, it } from 'vitest'
import {
  durationFrom,
  durationIn,
  exactDecimals,
  percentToRate,
  rateToPercent,
  scaledRange,
} from '../src/base/units'

/**
 * **Una tasa y una duración, como las lee una persona** (feature 008).
 *
 * Lo que se prueba es lo que no se ve con los valores redondos: `0.07` en
 * punto flotante, una tasa de tres decimales, una duración que no entra exacta
 * en su unidad. Con `0.5` y `3600000` todo funciona igual de bien o de mal.
 */

describe('una tasa en porcentaje', () => {
  it('corre la coma sobre el texto, sin pasar por punto flotante', () => {
    /* `0.07 * 100` es 7.000000000000001: el caso que motiva todo. */
    expect(rateToPercent('0.07')).toBe('7')
    expect(rateToPercent('0.1')).toBe('10')
    expect(rateToPercent('0.375')).toBe('37.5')
    expect(rateToPercent('0.00125')).toBe('0.125')
    expect(rateToPercent('1')).toBe('100')
    expect(rateToPercent('0')).toBe('0')
  })

  it('vuelve a la tasa exacta, sin ceros de más', () => {
    expect(percentToRate('7')).toBe('0.07')
    expect(percentToRate('7.00')).toBe('0.07')
    expect(percentToRate('37.5')).toBe('0.375')
    expect(percentToRate('0.125')).toBe('0.00125')
    expect(percentToRate('100')).toBe('1')
    expect(percentToRate('0')).toBe('0')
  })

  it('ida y vuelta da lo mismo', () => {
    for (const rate of ['0.07', '0.1', '0.375', '0.05', '0.9999', '0', '1']) {
      expect(percentToRate(rateToPercent(rate) ?? '')).toBe(rate)
    }
  })

  it('un texto que no es un número no se convierte', () => {
    expect(rateToPercent('abc')).toBeUndefined()
    expect(percentToRate('')).toBeUndefined()
  })
})

describe('una duración en su unidad', () => {
  it('se lee en la unidad pedida cuando es exacta', () => {
    expect(durationIn('129600000', 'ms', 'h')).toBe('36')
    expect(durationIn('600000', 'ms', 'min')).toBe('10')
    expect(durationIn('5400000', 'ms', 'h')).toBe('1.5')
    expect(durationIn('604800000', 'ms', 'd')).toBe('7')
    expect(durationIn('30', 's', 's')).toBe('30')
  })

  it('no se lee en una unidad donde no es exacta: no redondea', () => {
    /* 1 ms en horas es 0,000000277… y no termina. */
    expect(durationIn('1', 'ms', 'h')).toBeUndefined()
    /* 18 ms en horas termina, pero en más decimales de los que la unidad garantiza. */
    expect(durationIn('18', 'ms', 'h')).toBeUndefined()
  })

  it('vuelve a la unidad del contrato, exacta', () => {
    expect(durationFrom('36', 'h', 'ms')).toBe('129600000')
    expect(durationFrom('1.5', 'h', 'ms')).toBe('5400000')
    expect(durationFrom('10.00', 'min', 'ms')).toBe('600000')
    expect(durationFrom('0.01', 'h', 'ms')).toBe('36000')
  })

  it('una duración que no da un entero en el contrato no se devuelve', () => {
    expect(durationFrom('0.0001', 's', 'ms')).toBeUndefined()
    expect(durationFrom('1.5', 's', 's')).toBeUndefined()
  })

  it('cuántos decimales de una unidad dan siempre un entero en el contrato', () => {
    expect(exactDecimals('h', 'ms')).toBe(5)
    expect(exactDecimals('min', 'ms')).toBe(4)
    expect(exactDecimals('s', 'ms')).toBe(3)
    expect(exactDecimals('d', 'ms')).toBe(5)
    expect(exactDecimals('s', 's')).toBe(0)
  })

  it('una unidad menor que la del contrato es un error de declaración', () => {
    expect(() => durationIn('1', 's', 'ms')).toThrow()
  })
})

describe('el rango del contrato, en la unidad que se muestra', () => {
  it('una tasa de 0 a 1 se carga de 0 a 100', () => {
    expect(scaledRange({ minimum: 0, maximum: 1 }, { rate: true })).toEqual({
      minimum: 0,
      maximum: 100,
    })
  })

  it('una duración en milisegundos se carga en horas', () => {
    expect(
      scaledRange({ minimum: 1, maximum: 31536000000 }, { duration: { base: 'ms', unit: 'h' } }),
    ).toEqual({ minimum: 1 / 3600000, maximum: 8760 })
  })

  it('sin rango, nada que escalar', () => {
    expect(scaledRange({}, { rate: true })).toEqual({})
  })
})
