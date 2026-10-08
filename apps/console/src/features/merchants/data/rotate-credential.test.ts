import { describe, expect, it } from 'vitest'
import { oneMerchant } from './merchants'
import { rotateCredential, rotationConstraints } from './rotate-credential'

/**
 * **Rotar: una acción, tres operaciones, y nunca el valor en el aviso**
 * (`CU-37`, `OW-8`).
 */

describe('rotar una credencial', () => {
  it('exige credentials:rotate, del módulo del contrato, por las tres operaciones', () => {
    expect(rotateCredential.requires).toEqual(['credentials:rotate'])
    expect(rotateCredential.operationIds).toEqual([
      'rotateIngestKey',
      'rotatePlatformKey',
      'rotatePlatformSecret',
    ])
  })

  it('anuncia la clase y el merchant, y nunca el valor', () => {
    const announced = rotateCredential.announces?.(
      { kind: 'platform', value: 'ope_pk_secreta', issuedAt: '2026-10-08T12:00:00Z' },
      { merchantId: 'mrc_uno', kind: 'platform', graceSeconds: 0 },
    )
    if (typeof announced !== 'object') throw new Error('el aviso tiene que llevar descripción')

    expect(announced.title).toContain('plataforma')
    expect(announced.description).toBe('mrc_uno')
    expect(JSON.stringify(announced)).not.toContain('secreta')
  })

  it('invalida la ficha del merchant, y no la grilla', () => {
    expect(
      rotateCredential.invalidates?.(
        { merchantId: 'mrc_uno', kind: 'ingest', graceSeconds: 0 },
        {
          kind: 'ingest',
          value: 'x',
          issuedAt: '2026-10-08T12:00:00Z',
        },
      ),
    ).toEqual([oneMerchant('mrc_uno')])
  })

  it('la gracia viene del contrato: entera y desde cero, sin máximo escrito acá', () => {
    expect(rotationConstraints.fields.graceSeconds?.minimum).toBe(0)
    expect(rotationConstraints.fields.graceSeconds?.maximum).toBeUndefined()
  })
})
