import { describe, expect, it } from 'vitest'
import { failedWith, fieldNameOf, RequestFailed, unwrap } from '../src/data/envelope'
import {
  cutByProxy,
  failing,
  lastMerchantPage,
  type MerchantPage,
  merchantPage,
  problems,
  succeeding,
} from './fixtures/ope/responses'

/**
 * **El núcleo lee lo que OPE responde** (`CU-14`): cuerpos pelados y Problem
 * Details. Las respuestas son las que el contrato ejemplifica, no un sobre
 * inventado.
 */

const caught = (attempt: () => unknown): RequestFailed => {
  try {
    attempt()
  } catch (error) {
    if (error instanceof RequestFailed) return error
    throw error
  }
  throw new Error('no tiró')
}

describe('un cuerpo pelado', () => {
  it('llega entero, tal como el contrato lo responde', () => {
    /* Sin sobre: un `MerchantPage` es `{ items, nextCursor? }` y nada alrededor. */
    const page = unwrap<MerchantPage>(succeeding(merchantPage))

    expect(page).toEqual(merchantPage)
    expect(page.items[0]?.merchantId).toBe('mrc_7f3k5d2q4m6x')
    expect(page.nextCursor).toBeDefined()
  })

  it('el último tramo no trae cursor, y eso es lo que dice que no hay más', () => {
    const page = unwrap<MerchantPage>(succeeding(lastMerchantPage))

    expect('nextCursor' in page).toBe(false)
  })

  it('un 204 devuelve nada, que es lo que su tipo dice', () => {
    /* `openapi-fetch` entrega `{}` en un `204`; `{}` como «el recurso» sería un
       objeto vacío que ninguna pantalla espera. */
    expect(unwrap<undefined>(succeeding({}, 204))).toBeUndefined()
  })
})

describe('un problema del servidor', () => {
  it('se ramifica por su tipo, sin el espacio de nombres', () => {
    /* `CU-14`: nunca por `detail`, que es texto para una persona. El slug es lo
       estable, y `urn:ope:problem:` no aporta nada al ramificar. */
    const failed = caught(() => unwrap(failing(problems.originAlreadyRegistered)))

    expect(failedWith(failed, 'origin-already-registered')).toBe(true)
    expect(failed.type).toBe('origin-already-registered')
    expect(failed.status).toBe(422)
  })

  it('cada tipo del catálogo llega como tal', () => {
    for (const [name, slug, status] of [
      ['validationFailed', 'validation-failed', 400],
      ['operatorUnknown', 'operator-unknown', 401],
      ['merchantOutOfScope', 'merchant-out-of-scope', 403],
      ['merchantDeactivated', 'merchant-deactivated', 409],
    ] as const) {
      const failed = caught(() => unwrap(failing(problems[name])))
      expect(failed.type).toBe(slug)
      expect(failed.status).toBe(status)
    }
  })

  it('el mensaje es el detalle, o el título cuando no hay detalle', () => {
    const withDetail = caught(() => unwrap(failing(problems.originAlreadyRegistered)))
    const titleOnly = caught(() => unwrap(failing(problems.merchantDeactivated)))

    expect(withDetail.message).toBe('An origin already belongs to another merchant.')
    expect(titleOnly.message).toBe('The merchant is deactivated')
    expect(titleOnly.detail).toBeUndefined()
  })

  it('lleva las violaciones con su puntero, para llevarlas a donde corresponda', () => {
    const failed = caught(() => unwrap(failing(problems.originAlreadyRegistered)))

    expect(failed.errors).toEqual([
      { pointer: '/body/origins/0', message: 'An origin already belongs to another merchant.' },
    ])
  })
})

describe('el identificador del pedido', () => {
  it('falta cuando falta, y no se inventa', () => {
    /* Hoy OPE no lo manda; lo agrega su feature 040. Un texto que parezca un
       identificador se citaría como si sirviera. */
    const failed = caught(() => unwrap(failing(problems.merchantOutOfScope)))

    expect(failed.requestId).toBeUndefined()
  })

  it('sale del encabezado cuando viene', () => {
    const failed = caught(() =>
      unwrap(failing(problems.merchantOutOfScope, { 'X-Request-Id': '01JBQ' })),
    )

    expect(failed.requestId).toBe('01JBQ')
  })

  it('y del cuerpo, cuando el problema lo traiga', () => {
    /* La forma que la 040 va a agregar: el miembro `requestId` del problema
       dice más que el encabezado, porque sobrevive a que alguien copie el JSON. */
    const failed = caught(() =>
      unwrap({
        error: { ...problems.merchantOutOfScope.body, requestId: '01DEL-CUERPO' },
        response: new Response(null, { status: 403, headers: { 'X-Request-Id': '01DEL-HEADER' } }),
      }),
    )

    expect(failed.requestId).toBe('01DEL-CUERPO')
  })
})

describe('un intermediario que cortó antes', () => {
  it('sigue siendo una falla con tipo, estado y lo que haya de identificador', () => {
    /* Un `502` con HTML no es un Problem Details. La pantalla igual tiene que
       poder decir «no se pudo» con lo que haya. */
    const failed = caught(() => unwrap(cutByProxy({ 'X-Request-Id': '01DEL-PROXY' })))

    expect(failed.type).toBe('unknown')
    expect(failed.status).toBe(502)
    expect(failed.title).toBe('HTTP 502')
    expect(failed.requestId).toBe('01DEL-PROXY')
    expect(failed.errors).toEqual([])
  })

  it('y sin encabezado, sin identificador', () => {
    expect(caught(() => unwrap(cutByProxy())).requestId).toBeUndefined()
  })
})

describe('de qué campo habla un puntero', () => {
  it('traduce los del cuerpo a nombres de campo', () => {
    expect(fieldNameOf('/body/origins/0')).toBe('origins.0')
    expect(fieldNameOf('/body/signature')).toBe('signature')
    expect(fieldNameOf('/body/a/b/c')).toBe('a.b.c')
  })

  it('rechaza los que no son del cuerpo: no hay control donde dibujarlos', () => {
    /* Un cursor viejo en `/query` no lo escribió el operador en ningún campo. */
    expect(fieldNameOf('/query/cursor')).toBeUndefined()
    expect(fieldNameOf('/headers/x-ope-signature')).toBeUndefined()
    expect(fieldNameOf('/body')).toBeUndefined()
    expect(fieldNameOf('/body/')).toBeUndefined()
    expect(fieldNameOf('origins/0')).toBeUndefined()
  })

  it('deshace el escape de JSON Pointer', () => {
    expect(fieldNameOf('/body/a~1b/c~0d')).toBe('a/b.c~d')
  })
})
