import { describe, expect, it } from 'vitest'
import { allMerchants, oneMerchant } from './merchants'
import { setKillSwitch } from './set-kill-switch'

/**
 * **El interruptor: qué exige, qué anuncia y qué deja viejo** (`CU-25`, `CU-37`).
 */

describe('apagar y encender OPE para un merchant', () => {
  it('exige merchants:write, del módulo del contrato', () => {
    expect(setKillSwitch.requires).toEqual(['merchants:write'])
    expect(setKillSwitch.operationIds).toEqual(['setKillSwitch'])
  })

  it('anuncia lo que volvió, no lo que se pidió', () => {
    const off = setKillSwitch.announces?.(
      { enabled: false },
      { merchantId: 'mrc_uno', enabled: false },
    )
    const on = setKillSwitch.announces?.(
      { enabled: true },
      { merchantId: 'mrc_uno', enabled: true },
    )
    if (typeof off !== 'object' || typeof on !== 'object') throw new Error('sin título')

    expect(off.title).toContain('apagado')
    expect(on.title).toContain('encendido')
    expect(off.title).toContain('mrc_uno')
  })

  it('invalida la ficha y la grilla: el estado se ve en las dos', () => {
    expect(
      setKillSwitch.invalidates?.({ merchantId: 'mrc_uno', enabled: false }, { enabled: false }),
    ).toEqual([allMerchants, oneMerchant('mrc_uno')])
  })
})
