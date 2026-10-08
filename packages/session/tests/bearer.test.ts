import { describe, expect, it } from 'vitest'
import { createBearerSession } from '../src/bearer'
import { createFakeSession } from '../src/fake'
import type { Claims } from '../src/types'

/**
 * **El adaptador de credencial opaca** (`ADR-031` del backend).
 *
 * Se prueba sin backend: `identify` es lo que la aplicación escribe, así que
 * acá se le da una que contesta lo que cada caso necesita. Lo que se afirma es
 * lo del adaptador — qué hace con la credencial, cuándo la borra, y qué estado
 * deja — y no lo que el backend conteste.
 */

const toCapabilities = (claims: Claims) =>
  new Set(Array.isArray(claims.capabilities) ? (claims.capabilities as string[]) : [])

const OPERATOR: Claims = {
  sub: 'dev-operator',
  name: 'dev-operator',
  capabilities: ['merchants:read'],
}

/** Un backend de mentira: reconoce una credencial y rechaza las demás. */
function backend(accepting: string) {
  const seen: string[] = []
  const identify = async (authorize: (r: Request) => Promise<Request>) => {
    const sent = await authorize(new Request('http://ope/v1/admin/operator'))
    const header = sent.headers.get('Authorization') ?? ''
    seen.push(header)
    if (header === `Bearer ${accepting}`) return OPERATOR
    throw { status: 401 }
  }
  return { identify, seen }
}

describe('entrar con la credencial', () => {
  it('arranca sin sesión, siempre: la credencial no sobrevive a la recarga', async () => {
    const session = createBearerSession({ toCapabilities, identify: backend('ok').identify })

    await session.resolve()

    expect(session.getState().status).toBe('anonymous')
  })

  it('con una que el backend reconoce, queda activa con los claims que identify devolvió', async () => {
    const { identify, seen } = backend('ok')
    const session = createBearerSession({ toCapabilities, identify })
    await session.resolve()

    const outcome = await session.signIn?.('ok')

    expect(outcome).toEqual({ ok: true })
    expect(session.getState().status).toBe('active')
    expect(session.getState().subject).toBe('dev-operator')
    expect(session.getState().capabilities.has('merchants:read')).toBe(true)
    /* `identify` recibió `authorize` ya con la credencial puesta. */
    expect(seen).toEqual(['Bearer ok'])
  })

  it('con una que el backend rechaza, dice que la rechazó y la borra', async () => {
    const session = createBearerSession({ toCapabilities, identify: backend('ok').identify })
    await session.resolve()

    const outcome = await session.signIn?.('inventada')

    expect(outcome).toEqual({ ok: false, reason: 'rejected' })
    expect(session.getState().status).toBe('anonymous')

    /* Borrada: el próximo pedido sale sin encabezado. */
    const sent = await session.authorize(new Request('http://ope/x'))
    expect(sent.headers.get('Authorization')).toBeNull()
  })

  it('sin backend, dice que no lo alcanzó, y también la borra', async () => {
    const session = createBearerSession({
      toCapabilities,
      identify: async () => {
        throw new TypeError('Failed to fetch')
      },
    })
    await session.resolve()

    const outcome = await session.signIn?.('ok')

    expect(outcome).toEqual({ ok: false, reason: 'unreachable' })
    expect(session.getState().status).toBe('anonymous')
    const sent = await session.authorize(new Request('http://ope/x'))
    expect(sent.headers.get('Authorization')).toBeNull()
  })

  it('una credencial vacía se rechaza sin preguntarle a nadie', async () => {
    let asked = 0
    const session = createBearerSession({
      toCapabilities,
      identify: async () => {
        asked++
        return OPERATOR
      },
    })
    await session.resolve()

    expect(await session.signIn?.('   ')).toEqual({ ok: false, reason: 'rejected' })
    expect(await session.signIn?.()).toEqual({ ok: false, reason: 'rejected' })
    expect(asked).toBe(0)
  })
})

describe('autorizar un pedido', () => {
  it('pone el encabezado con el esquema, y no toca nada más del pedido', async () => {
    const session = createBearerSession({ toCapabilities, identify: backend('ok').identify })
    await session.resolve()
    await session.signIn?.('ok')

    const original = new Request('http://ope/v1/admin/merchants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const sent = await session.authorize(original)

    expect(sent.headers.get('Authorization')).toBe('Bearer ok')
    expect(sent.headers.get('Content-Type')).toBe('application/json')
    expect(sent.method).toBe('POST')
    expect(sent.url).toBe('http://ope/v1/admin/merchants')
  })

  it('y la falsa no pone ninguno: quien llama no sabe cuál de las dos tiene', async () => {
    /* Es lo que `CU-10` afirma, ejercido contra las dos implementaciones. */
    const fake = createFakeSession({ toCapabilities, claims: OPERATOR })
    await fake.resolve()

    const sent = await fake.authorize(new Request('http://ope/x'))

    expect(sent.headers.get('Authorization')).toBeNull()
  })
})

describe('un 401 en vuelo', () => {
  it('termina la sesión diciendo por qué, y borra la credencial', async () => {
    const session = createBearerSession({ toCapabilities, identify: backend('ok').identify })
    await session.resolve()
    await session.signIn?.('ok')

    session.observe?.(new Response(null, { status: 401 }))

    expect(session.getState().status).toBe('ended')
    expect(session.getState().reason).toBe('token-rejected')
    const sent = await session.authorize(new Request('http://ope/x'))
    expect(sent.headers.get('Authorization')).toBeNull()
  })

  it('cualquier otra respuesta no hace nada', async () => {
    const session = createBearerSession({ toCapabilities, identify: backend('ok').identify })
    await session.resolve()
    await session.signIn?.('ok')

    session.observe?.(new Response(null, { status: 403 }))
    session.observe?.(new Response(null, { status: 500 }))

    expect(session.getState().status).toBe('active')
  })

  it('y un 401 sin sesión tampoco: no hay nada que terminar', async () => {
    const session = createBearerSession({ toCapabilities, identify: backend('ok').identify })
    await session.resolve()

    session.observe?.(new Response(null, { status: 401 }))

    expect(session.getState().status).toBe('anonymous')
  })
})

describe('cerrar sesión', () => {
  it('termina, borra, y no se vuelve sin recargar', async () => {
    const session = createBearerSession({ toCapabilities, identify: backend('ok').identify })
    await session.resolve()
    await session.signIn?.('ok')

    await session.signOut()

    expect(session.getState().status).toBe('ended')
    expect(session.getState().reason).toBe('signed-out')

    await session.signIn?.('ok')
    expect(session.getState().status).toBe('ended')
  })

  it('volver a entrar no hace nada: no hay ventana que abrir', async () => {
    const session = createBearerSession({ toCapabilities, identify: backend('ok').identify })
    await session.resolve()
    await session.signIn?.('ok')

    await session.reenter()

    expect(session.getState().status).toBe('active')
  })
})
