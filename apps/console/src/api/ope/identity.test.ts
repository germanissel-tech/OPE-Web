import { RequestFailed } from '@ope/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { claimsOf, fetchOperator } from './identity'

/**
 * **`identify` es `getOperator`** (`OW-7`, enmendada en la 007): los claims
 * salen de lo que el contrato devuelve, con `name` como el nombre para mostrar
 * o, sin él, el identificador — nunca inventado. Un `401` sigue siendo «la
 * credencial no sirve para entrar».
 */

afterEach(() => {
  vi.unstubAllGlobals()
})

function answering(status: number, body: unknown) {
  const calls: Request[] = []
  vi.stubGlobal('fetch', async (input: Request | string | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init)
    calls.push(request)
    return new Response(JSON.stringify(body), {
      status,
      headers: {
        'content-type': status < 400 ? 'application/json' : 'application/problem+json',
      },
    })
  })
  return calls
}

const authorize = async (request: Request) => {
  request.headers.set('authorization', 'Bearer token-de-prueba')
  return request
}

describe('fetchOperator', () => {
  it('asks GET /v1/admin/operator with what authorize put, and answers the claims of OW-7', async () => {
    const calls = answering(200, { operatorId: 'ops-1', displayName: 'Ana', scope: '*' })
    const claims = await fetchOperator('http://ope.test', authorize)
    expect(calls).toHaveLength(1)
    expect(calls[0]?.method).toBe('GET')
    expect(calls[0]?.url).toBe('http://ope.test/v1/admin/operator')
    expect(calls[0]?.headers.get('authorization')).toBe('Bearer token-de-prueba')
    expect(claims).toEqual({ sub: 'ops-1', operatorId: 'ops-1', name: 'Ana', scope: '*' })
  })

  it('without a display name the name is the identifier, and a listed scope comes as the list', async () => {
    answering(200, { operatorId: 'ops-a', scope: ['m_a', 'm_b'] })
    expect(await fetchOperator('http://ope.test', authorize)).toEqual({
      sub: 'ops-a',
      operatorId: 'ops-a',
      name: 'ops-a',
      scope: ['m_a', 'm_b'],
    })
  })

  it('an unknown credential throws RequestFailed with status 401', async () => {
    answering(401, {
      type: 'urn:ope:problem:operator-unknown',
      title: 'Operator token missing or unknown',
      status: 401,
      requestId: 'req-7',
    })
    const failure = await fetchOperator('http://ope.test', authorize).catch(
      (error: unknown) => error,
    )
    expect(failure).toBeInstanceOf(RequestFailed)
    expect((failure as RequestFailed).status).toBe(401)
    expect((failure as RequestFailed).requestId).toBe('req-7')
  })

  it('claimsOf never invents a name', () => {
    expect(claimsOf({ operatorId: 'ops-x', scope: '*' }).name).toBe('ops-x')
    expect(claimsOf({ operatorId: 'ops-x', displayName: 'X', scope: '*' }).name).toBe('X')
  })
})
