import { describe, expect, it } from 'vitest'
import { RequestFailed } from '../src/data/envelope'
import { failureNotice, isBusinessRejection } from '../src/data/notice'

/**
 * **Un rechazo de negocio no es una falla** (`CU-25`).
 *
 * Se prueba acá porque es de lo que **se lee perfectamente bien estando mal**:
 * un rechazo mostrado como falla no rompe nada, sólo le enseña al operador que
 * el sistema se cae seguido y que hay algo que reportar cuando no lo hay.
 */

const strings = {
  actionFailed: 'No se pudo completar',
  actionRejected: 'No se puede hacer eso',
  requestIdLabel: 'Identificador del pedido',
  serverUnreachable: 'No se pudo hablar con el servidor.',
}

const failed = (status: number, code: string, message: string) =>
  new RequestFailed(status, code, 'req-1', message)

describe('lo que el servidor contesta', () => {
  it('un 409 de una regla es una respuesta, no una falla', () => {
    /* `ENTRY_NOT_REVERSIBLE` es una invariante del contrato: el sistema
       funcionó y contestó que no. */
    const rejected = failed(
      409,
      'ENTRY_NOT_REVERSIBLE',
      'Sólo se anulan los que carga el operador.',
    )

    expect(isBusinessRejection(rejected)).toBe(true)
  })

  it('pero reusar una clave de idempotencia sí es defecto nuestro', () => {
    /* También vuelve 409, y `CU-34` ya decidió que significa que la puerta ató
       mal la clave. Al operador no se le muestra como si fuera cosa suya. */
    const ours = failed(409, 'IDEMPOTENCY_KEY_REUSE', 'Esa clave ya se usó con otro cuerpo.')

    expect(isBusinessRejection(ours)).toBe(false)
  })

  it('una falla del servidor no es un rechazo', () => {
    expect(isBusinessRejection(failed(500, 'INTERNAL_ERROR', 'Algo se rompió.'))).toBe(false)
  })
})

describe('el aviso de un rechazo', () => {
  const notice = failureNotice(
    failed(409, 'ENTRY_NOT_REVERSIBLE', 'Sólo se anulan los que carga el operador.'),
    strings,
  )

  it('no lleva el identificador del pedido, porque no hay nada que reportar', () => {
    expect(notice.description).not.toContain('req-1')
    expect(notice.description).toBe('Sólo se anulan los que carga el operador.')
  })

  it('se va sola: es una respuesta, y no hay nada que anotar', () => {
    expect(notice.duration).toBeGreaterThan(0)
  })

  it('no usa el tono de error, que se reserva para lo que sí falló', () => {
    expect(notice.tone).not.toBe('error')
  })
})

describe('el aviso de una falla', () => {
  it('lleva el identificador y no se va sola', () => {
    /* El operador tiene que poder anotarlo, y uno que se desvanece mientras
       busca con qué no sirve de nada. */
    const notice = failureNotice(failed(500, 'INTERNAL_ERROR', 'Algo se rompió.'), strings)

    expect(notice.tone).toBe('error')
    expect(notice.description).toContain('req-1')
    expect(notice.duration).toBeUndefined()
  })

  it('sin servidor lo dice el marco, y nunca el error crudo', () => {
    /* No llegó a haber pedido, así que no hay mensaje ni identificador. Un
       `TypeError: Failed to fetch` en un mostrador no le dice nada a nadie. */
    const notice = failureNotice(undefined, strings)

    expect(notice.description).toBe(strings.serverUnreachable)
  })
})
