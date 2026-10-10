import { describe, expect, it } from 'vitest'
import { merchantLog } from './merchant-log'
import { allMerchants, type Merchant, oneMerchant } from './merchants'
import { updateMerchantProfile } from './update-merchant-profile'

describe('la acción de editar la identidad', () => {
  it('exige lo que el módulo del contrato dice de updateMerchantProfile', () => {
    expect(updateMerchantProfile.requires).toEqual(['merchants:write'])
  })

  it('invalida la ficha, las listas y el registro del merchant', () => {
    const body = { displayName: 'Tienda' }
    expect(
      updateMerchantProfile.invalidates?.(
        { merchantId: 'm_a', body, witness: '"w-1"' },
        {} as never,
      ),
    ).toEqual([allMerchants, oneMerchant('m_a'), merchantLog('m_a')])
  })

  it('anuncia el nombre y nunca el contacto', () => {
    const merchant: Merchant = {
      merchantId: 'm_a',
      status: 'active',
      origins: [],
      createdAt: '2026-10-09T00:00:00Z',
      credentials: [],
      displayName: 'Tienda Norte',
      contact: { name: 'Ana Secreta', email: 'ana.secreta@n.example' },
    }
    const announced = updateMerchantProfile.announces?.(merchant, {
      merchantId: 'm_a',
      body: { displayName: 'Tienda Norte' },
      witness: '"w-1"',
    })
    expect(JSON.stringify(announced)).toContain('Tienda Norte')
    expect(JSON.stringify(announced)).not.toContain('Secreta')
    expect(JSON.stringify(announced)).not.toContain('ana.secreta')
  })
})
