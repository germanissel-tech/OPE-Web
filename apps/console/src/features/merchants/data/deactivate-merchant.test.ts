import { describe, expect, it } from 'vitest'
import type { Merchant } from '../../../api/ope/client'
import { merchantsStrings } from '../strings'
import { deactivateMerchant } from './deactivate-merchant'
import { merchantLog } from './merchant-log'
import { allMerchants, oneMerchant } from './merchants'

/**
 * **La primera prueba de una funcionalidad, y el ejemplo de dónde va** (`CU-15`).
 *
 * Al lado de lo que prueba, no en una carpeta aparte: **una funcionalidad tiene
 * que poder borrarse entera**, y con las pruebas en otro lado se borra la mitad.
 * Lo verifica `ope-check`.
 *
 * Lo que se prueba acá es **la regla de la acción, no la llamada**: qué exige,
 * qué anuncia y qué invalida. Lo que la operación le manda al servidor ya lo
 * cubre el contrato.
 */

const merchant = (status: Merchant['status']): Merchant => ({
  merchantId: 'mrc_7f3k5d2q4m6x',
  status,
  origins: ['https://tienda.example'],
  createdAt: '2026-09-20T12:00:00Z',
  credentials: [{ kind: 'ingest', issuedAt: '2026-09-20T12:00:00Z' }],
})

describe('desactivar un merchant', () => {
  it('exige lo que el contrato exige a deactivateMerchant, y nada escrito acá', () => {
    /* `merchants:write` sale del módulo del contrato (`TAN-7`): si el backend
       cambiara la capacidad, esto cambia con la próxima sincronización. */
    expect(deactivateMerchant.requires).toEqual(['merchants:write'])
    expect(deactivateMerchant.operationIds).toEqual(['deactivateMerchant'])
    expect(deactivateMerchant.idempotent).toBe(false)
  })

  it('manda el identificador del merchant que recibió entero', async () => {
    const called: string[] = []
    const ops = {
      deactivate: {
        run: (merchantId: string) => {
          called.push(merchantId)
          return Promise.resolve(merchant('deactivated'))
        },
      },
    }

    await deactivateMerchant.run(merchant('active'), ops as never)

    expect(called).toEqual(['mrc_7f3k5d2q4m6x'])
  })

  it('anuncia con lo que volvió, y dice que no hay vuelta', () => {
    const announced = deactivateMerchant.announces?.(merchant('deactivated'), merchant('active'))
    if (typeof announced !== 'object') throw new Error('el aviso tiene que llevar descripción')

    expect(announced.title).toBe(merchantsStrings.merchantDeactivated)
    expect(announced.description).toContain('mrc_7f3k5d2q4m6x')
  })

  it('invalida la lista y la ficha de ese merchant', () => {
    /* La ficha cambia de estado: sin invalidarla, volver a abrirla la mostraría
       activa desde la caché (`CU-25`). */
    expect(deactivateMerchant.invalidates?.(merchant('active'), merchant('deactivated'))).toEqual([
      allMerchants,
      oneMerchant('mrc_7f3k5d2q4m6x'),
      merchantLog('mrc_7f3k5d2q4m6x'),
    ])
  })
})
