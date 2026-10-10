import { describe, expect, it } from 'vitest'
import { configurationStrings } from '../strings'
import { present, valueAt } from './present'
import { TREATMENT_PRESENTATION } from './units'

/**
 * **Un valor se lee igual en las tres vistas** (`CU-6`).
 *
 * Lo que se prueba es lo que la vista no muestra con valores redondos: una
 * tasa de tres decimales, una duración que no entra exacta en su unidad, un
 * valor cerrado del contrato.
 */

describe('present', () => {
  it('una tasa en porcentaje, con coma', () => {
    expect(present(0.05, TREATMENT_PRESENTATION.holdoutShare)).toBe('5 %')
    expect(present(0.375, TREATMENT_PRESENTATION['commercialPolicy.marginShare'])).toBe('37,5 %')
  })

  it('una escalera de tasas, escalón por escalón', () => {
    expect(
      present([0.05, 0.1], TREATMENT_PRESENTATION['commercialPolicy.incentiveLadderShare']),
    ).toBe('5 %, 10 %')
  })

  it('una duración en su unidad', () => {
    expect(present(129600000, TREATMENT_PRESENTATION['freshness.catalogMs'])).toBe('36 h')
    expect(present(600000, TREATMENT_PRESENTATION['freshness.stockAndPriceMs'])).toBe('10 min')
    expect(present(5400000, TREATMENT_PRESENTATION['freshness.catalogMs'])).toBe('1,5 h')
  })

  it('una duración que no entra exacta en su unidad se lee en la del contrato, sin redondear', () => {
    expect(present(1, TREATMENT_PRESENTATION['freshness.catalogMs'])).toBe('1 ms')
  })

  it('un valor cerrado del contrato por su nombre, y una marca como sí o no', () => {
    expect(present(['product', 'cart'])).toBe(
      `${configurationStrings.product}, ${configurationStrings.cart}`,
    )
    expect(present(true)).toBe(configurationStrings.yes)
    expect(present('es-AR')).toBe('es-AR')
  })

  it('una cantidad, tal cual', () => {
    expect(present(8)).toBe('8')
  })
})

describe('valueAt', () => {
  it('lee un camino con puntos, y nada si no está', () => {
    const source = { freshness: { catalogMs: 1 }, locales: { supported: ['es'] } }
    expect(valueAt(source, 'freshness.catalogMs')).toBe(1)
    expect(valueAt(source, 'locales.supported')).toEqual(['es'])
    expect(valueAt(source, 'freshness.stockAndPriceMs')).toBeUndefined()
    expect(valueAt(source, 'syncLevel.receiptsKept')).toBeUndefined()
  })
})
