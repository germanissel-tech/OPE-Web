import { describe, expect, it } from 'vitest'
import type { MerchantConfigurationDeclared } from '../../../api/ope/client'
import { merchantBodyOf, merchantConstraints, merchantFormOf, nameOf } from './merchant-body'

/**
 * **El cuerpo de una versión del merchant** (research §6 y §7).
 *
 * Es la falla más cara de la feature: una versión nueva que pierde el mapa de
 * anclajes deja al merchant sin dónde dibujar, y nada avisa. Lo que se prueba
 * es que publicar sin tocar nada manda exactamente lo que se declaraba, y que
 * lo que la pantalla no edita viaja idéntico pase lo que pase con lo demás.
 */

const declared: MerchantConfigurationDeclared = {
  holdoutShare: 0.07,
  freshness: { stockAndPriceMs: 600000 },
  surfaces: ['product'],
  locales: { supported: ['es-AR', 'en'], fallback: 'es-AR' },
  evidenceProfile: { authorizedAttributes: [] },
  commercialPolicy: {
    version: 'mine-1',
    incentiveLadderShare: [0.05, 0.1],
    returnRisk: { fact: 'dwellSeconds', block: 'policies' },
  },
  decisionPolicy: { version: 'mine-1', threshold: 0.7 },
  anchors: { price: { selectors: ['.price'] } },
  attributeLabels: [{ label: 'Algodón peinado', value: 'combed-cotton' }],
}

describe('el cuerpo de una versión del merchant', () => {
  it('sin tocar nada, es lo que se declaraba', () => {
    const { values, shown } = merchantFormOf(declared)
    expect(merchantBodyOf(values, shown, declared)).toEqual({ declared })
  })

  it('lo que no se edita viaja idéntico, aunque se herede todo lo demás', () => {
    const { shown } = merchantFormOf(declared)
    const body = merchantBodyOf({ corrective: 'false', reason: '' }, shown, declared)
    expect(body.declared.anchors).toBe(declared.anchors)
    expect(body.declared.attributeLabels).toBe(declared.attributeLabels)
    expect(body.declared.decisionPolicy).toBe(declared.decisionPolicy)
    expect(body.declared.commercialPolicy?.returnRisk).toBe(declared.commercialPolicy?.returnRisk)
  })

  it('heredar un valor lo saca del cuerpo', () => {
    const { values, shown } = merchantFormOf(declared)
    const { [nameOf('holdoutShare')]: _, ...rest } = values
    const body = merchantBodyOf(rest, shown, declared)
    expect(body.declared).not.toHaveProperty('holdoutShare')
    expect(body.declared.freshness).toEqual({ stockAndPriceMs: 600000 })
  })

  it('una lista declarada vacía viaja vacía, y no se confunde con heredada', () => {
    const { values, shown } = merchantFormOf(declared)
    expect(values[nameOf('evidenceProfile.authorizedAttributes')]).toBe('')
    const body = merchantBodyOf(values, shown, declared)
    expect(body.declared.evidenceProfile).toEqual({ authorizedAttributes: [] })
  })

  it('las tasas y las duraciones vuelven exactas desde lo que se cargó', () => {
    const { values, shown } = merchantFormOf(declared)
    expect(values[nameOf('holdoutShare')]).toBe('7')
    expect(values[nameOf('freshness.stockAndPriceMs')]).toBe('10')
    const body = merchantBodyOf(
      { ...values, [nameOf('holdoutShare')]: '37.5', [nameOf('freshness.stockAndPriceMs')]: '1.5' },
      shown,
      declared,
    )
    expect(body.declared.holdoutShare).toBe(0.375)
    expect(body.declared.freshness?.stockAndPriceMs).toBe(90000)
  })

  it('correctiva lleva su motivo; sin marcar, ninguno de los dos viaja', () => {
    const { values, shown } = merchantFormOf(declared)
    expect(merchantBodyOf(values, shown, declared)).not.toHaveProperty('corrective')
    const body = merchantBodyOf({ ...values, corrective: 'true', reason: 'Why' }, shown, declared)
    expect(body).toMatchObject({ corrective: true, reason: 'Why' })
  })
})

describe('lo que se exige, según lo que se cargó', () => {
  it('la versión de la política comercial, si la política viaja', () => {
    const { values, shown } = merchantFormOf(declared)
    expect(merchantConstraints(values, shown, declared).required).toContain(
      nameOf('commercialPolicy.version'),
    )
    /* Sin nada comercial declarado ni nada que se copie, no se exige. */
    expect(merchantConstraints({}, {}, {}).required).not.toContain(
      nameOf('commercialPolicy.version'),
    )
  })

  it('el motivo, si es correctiva', () => {
    expect(merchantConstraints({ corrective: 'true' }, {}, {}).required).toContain('reason')
    expect(merchantConstraints({ corrective: 'false' }, {}, {}).required).not.toContain('reason')
  })

  it('el rango de una tasa se juzga en porcentaje', () => {
    const { values, shown } = merchantFormOf(declared)
    const { fields } = merchantConstraints(values, shown, declared)
    expect(fields[nameOf('holdoutShare')]?.maximum).toBe(100)
  })
})
