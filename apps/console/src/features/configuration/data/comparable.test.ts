import { clashBetween, mergedOnto } from '@ope/core'
import { describe, expect, it } from 'vitest'
import type { MerchantConfigurationDeclared } from '../../../api/ope/client'
import { comparableOfContract, comparableOfForm, contractOfComparable } from './comparable'
import { kindOfLeaf, merchantFormOf, nameOf, OPERATIVE_LEAVES } from './merchant-body'

/**
 * **Lo que la puerta compara** (`CU-29`, research §3): una clave por hoja, en
 * unidades del contrato. Lo que se prueba son las tres trampas de los
 * formularios de la configuración —heredar es una clave ausente, una lista son
 * varias claves, un número es texto en una unidad— y que la comparación y la
 * fusión del núcleo, alimentadas con esto, no las pisan.
 */

const declared: MerchantConfigurationDeclared = {
  holdoutShare: 0.07,
  freshness: { catalogMs: 129600000 },
  commercialPolicy: { version: 'mine-1', incentiveLadderShare: [0.05, 0.1] },
}

const loadedForm = merchantFormOf(declared)
const reading = {
  nameOf,
  kindOf: kindOfLeaf,
  shownOf: (leaf: string) => loadedForm.shown[leaf],
}
const leaves = OPERATIVE_LEAVES
const ofForm = (values: Readonly<Record<string, string>>) =>
  comparableOfForm(values, leaves, reading)

describe('las hojas comparables de la configuración de un merchant', () => {
  it('lo cargado y lo que el contrato declara son lo mismo, hoja por hoja', () => {
    expect(ofForm(loadedForm.values)).toEqual(comparableOfContract(declared, leaves))
  })

  it('un número en horas y el mismo en milisegundos son la misma hoja', () => {
    const inHours = ofForm(loadedForm.values)['freshness.catalogMs']
    expect(inHours).toBe('129600000')
    expect(
      comparableOfContract({ freshness: { catalogMs: 129600000 } }, leaves)['freshness.catalogMs'],
    ).toBe(inHours)
  })

  it('declarar después de abrir es una diferencia, y la fusión la conserva', () => {
    const loaded = ofForm(loadedForm.values)
    const onScreen = ofForm({ ...loadedForm.values, [nameOf('syncLevel.receiptsKept')]: '12' })
    expect(loaded['syncLevel.receiptsKept']).toBeUndefined()
    expect(onScreen['syncLevel.receiptsKept']).toBe('12')
    // Otro cambió el holdout en el medio: no se cruzan, y la fusión lleva los dos.
    const fresh = comparableOfContract({ ...declared, holdoutShare: 0.09 }, leaves)
    expect(clashBetween(loaded, onScreen, fresh)).toEqual([])
    const merged = contractOfComparable(mergedOnto(fresh, loaded, onScreen), leaves)
    expect(merged).toMatchObject({ holdoutShare: 0.09, syncLevel: { receiptsKept: 12 } })
  })

  it('heredar después de abrir es una diferencia, y la fusión saca la hoja', () => {
    const loaded = ofForm(loadedForm.values)
    const { [nameOf('holdoutShare')]: _, ...inherited } = loadedForm.values
    const merged = contractOfComparable(
      mergedOnto(comparableOfContract(declared, leaves), loaded, ofForm(inherited)),
      leaves,
    )
    expect(merged).not.toHaveProperty('holdoutShare')
  })

  it('sumar un renglón cambia la lista entera, y cruza con otro que la cambió', () => {
    const ladder = nameOf('commercialPolicy.incentiveLadderShare')
    const loaded = ofForm(loadedForm.values)
    const onScreen = ofForm({ ...loadedForm.values, [`${ladder}.2`]: '15' })
    expect(onScreen['commercialPolicy.incentiveLadderShare']).toBe('[0.05,0.1,0.15]')
    const fresh = comparableOfContract(
      { ...declared, commercialPolicy: { version: 'mine-1', incentiveLadderShare: [0.05, 0.2] } },
      leaves,
    )
    expect(clashBetween(loaded, onScreen, fresh).map((each) => each.field)).toEqual([
      'commercialPolicy.incentiveLadderShare',
    ])
  })
})
