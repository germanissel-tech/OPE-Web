import { describe, expect, it } from 'vitest'
import { RequestFailed, unwrap } from '../src/data/envelope'
import { failureNotice, isBusinessRejection } from '../src/data/notice'
import { failing, problems } from './fixtures/ope/responses'

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
  noRequestId: 'sin identificador',
  serverUnreachable: 'No se pudo hablar con el servidor.',
}

const failed = (problem: (typeof problems)[keyof typeof problems], requestId?: string) => {
  try {
    unwrap(failing(problem, requestId ? { 'X-Request-Id': requestId } : {}))
  } catch (error) {
    return error as RequestFailed
  }
  throw new Error('no tiró')
}

describe('lo que el servidor contesta', () => {
  it('un 409 de una invariante es una respuesta, no una falla', () => {
    /* `merchant-deactivated`: el sistema funcionó y contestó que no. */
    expect(isBusinessRejection(failed(problems.merchantDeactivated))).toBe(true)
  })

  it('un 422 también: el pedido era válido y una regla dijo que no', () => {
    expect(isBusinessRejection(failed(problems.originAlreadyRegistered))).toBe(true)
  })

  it('un 403 no es un rechazo: es defecto nuestro', () => {
    /* `CU-3`: lo que un permiso no habilita no se muestra. Si el servidor dijo
       que no por alcance, la pantalla ofreció lo que no correspondía. */
    expect(isBusinessRejection(failed(problems.merchantOutOfScope))).toBe(false)
  })

  it('ni un 400, ni una falla del servidor', () => {
    expect(isBusinessRejection(failed(problems.validationFailed))).toBe(false)
    expect(
      isBusinessRejection(
        new RequestFailed({ status: 500, type: 'internal-error', title: 'Internal error' }),
      ),
    ).toBe(false)
  })
})

describe('el aviso de un rechazo', () => {
  const notice = failureNotice(failed(problems.merchantDeactivated, 'req-1'), strings)

  it('no lleva el identificador del pedido, porque no hay nada que reportar', () => {
    expect(notice.description).not.toContain('req-1')
    expect(notice.description).toBe('The merchant is deactivated')
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
    const notice = failureNotice(failed(problems.merchantOutOfScope, 'req-1'), strings)

    expect(notice.tone).toBe('error')
    expect(notice.description).toContain('req-1')
    expect(notice.duration).toBeUndefined()
  })

  it('dice que no hay identificador cuando no vino, en vez de inventarlo', () => {
    /* Hoy OPE no lo manda (lo agrega su 040). Un hueco se lee como un olvido
       nuestro; un texto inventado se cita como si sirviera. */
    const notice = failureNotice(failed(problems.merchantOutOfScope), strings)

    expect(notice.description).toContain('Identificador del pedido: sin identificador')
  })

  it('sin servidor lo dice el marco, y nunca el error crudo', () => {
    /* No llegó a haber pedido, así que no hay mensaje ni identificador. Un
       `TypeError: Failed to fetch` en un mostrador no le dice nada a nadie. */
    const notice = failureNotice(undefined, strings)

    expect(notice.description).toBe(strings.serverUnreachable)
  })

  it('las violaciones que no son de ningún campo se dicen con su puntero', () => {
    /* Un cursor viejo en `/query` no tiene control donde dibujarse. Callarlo
       sería perder el rechazo entero (`CU-49`). */
    const rejected = failed(problems.validationFailed)
    const notice = failureNotice(rejected, strings, rejected.errors)

    expect(notice.description).toContain('/query/cursor: must match pattern')
  })
})
