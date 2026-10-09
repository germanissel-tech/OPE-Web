import { shapeErrorOf } from '@ope/core'
import { describe, expect, it } from 'vitest'
import { merchantsStrings } from '../strings'
import { createMerchant, merchantConstraints } from './create-merchant'
import { allMerchants } from './merchants'

/**
 * **El alta: qué exige, qué anuncia, y qué forma pide del origen** (`CU-38`).
 */

describe('crear un merchant', () => {
  it('exige merchants:write, del módulo del contrato', () => {
    expect(createMerchant.requires).toEqual(['merchants:write'])
    expect(createMerchant.operationIds).toEqual(['createMerchant'])
  })

  it('anuncia el identificador, y nunca las credenciales', () => {
    /* Las credenciales viajan una sola vez en la respuesta del alta. Un aviso
       se va solo, y un secreto en un aviso es un secreto en pantalla. */
    /* La forma de `MerchantCredentials` del contrato: el merchant y, aparte,
       sus credenciales con valor. */
    const created = {
      merchant: {
        merchantId: 'mrc_nuevo',
        status: 'active',
        origins: ['https://tienda.example'],
        createdAt: '2026-10-08T12:00:00Z',
        credentials: [],
      },
      credentials: { ingestKey: 'ingest_secreta', platformKey: 'platform_secreta' },
    }
    const announced = createMerchant.announces?.(created as never, {
      origins: ['https://tienda.example'],
      signature: true,
    })
    if (typeof announced !== 'object') throw new Error('el aviso tiene que llevar descripción')

    expect(announced.description).toContain('mrc_nuevo')
    expect(JSON.stringify(announced)).not.toContain('secreta')
  })

  it('invalida todas las listas', () => {
    expect(createMerchant.invalidates?.({ origins: [], signature: true }, {} as never)).toEqual([
      allMerchants,
    ])
  })
})

describe('las restricciones del alta', () => {
  it('vienen del contrato: obligatorios y largos, no escritos acá', () => {
    /* `CU-38`, capa 1 emitida: si el backend cambia el largo, esto lo sigue en
       el próximo `contract:sync` sin tocar una línea. */
    expect(merchantConstraints.required).toEqual(['origins', 'signature'])
    expect(merchantConstraints.fields.origins?.minItems).toBe(1)
    expect(merchantConstraints.fields.origins?.maxItems).toBe(20)
    expect(merchantConstraints.fields.origins?.items?.maxLength).toBe(255)
  })
})

describe('la forma del origen, antes de mandar', () => {
  /* Cada renglón se valida con lo que el contrato le exige a un elemento de
     `origins`, más la capa 2 (`invalid-origin`) escrita a mano con su cita. */
  const origin = merchantConstraints.fields.origins?.items

  it('acepta esquema y host, con o sin puerto', () => {
    expect(
      shapeErrorOf('https://tienda.example', origin, true, merchantsStrings.shape),
    ).toBeUndefined()
    expect(
      shapeErrorOf('http://localhost:3000', origin, true, merchantsStrings.shape),
    ).toBeUndefined()
  })

  it('rechaza una ruta, un espacio o un vacío, diciendo qué corregir', () => {
    const shape = merchantsStrings.shape
    expect(shapeErrorOf('https://tienda.example/tienda', origin, true, shape)).toBe(shape.badFormat)
    expect(shapeErrorOf('tienda.example', origin, true, shape)).toBe(shape.badFormat)
    expect(shapeErrorOf('', origin, true, shape)).toBe(shape.required)
  })
})
