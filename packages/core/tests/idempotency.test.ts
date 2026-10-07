import { describe, expect, it } from 'vitest'
import { defineAction, operation } from '../src/data/action'
import { defineService } from '../src/data/service'
import { attemptKey, forgetAttempt, resolveOperations } from '../src/data/use-action'

/**
 * **La clave de idempotencia se ata al cuerpo del intento** (`CU-34`).
 *
 * Lo que se prueba acá es lo que **no se ve fallar**: una clave que no viaja
 * hace que el servidor aplique dos veces, y una que se retiene de más hace que
 * un segundo cambio legítimo se pierda. Las dos salen bien en pantalla.
 */

const writes = { roles: ['catalog:write'], idempotent: true, versioned: false }
const reads = { roles: ['catalog:read'], idempotent: false, versioned: false }

/* El núcleo no conoce ningún sistema: la prueba arma el suyo. */
const fake = defineService<{ readonly ping: () => string }>('fake')
const SERVICES = new Map<string, unknown>([['fake', { ping: () => 'pong' }]])

type Body = { readonly name: string }

const create = operation('createArticle', fake, writes, async (_s, body: Body) => body.name)
const list = operation('listArticles', fake, reads, async (_s, _: Body) => 'ok')

describe('si una acción exige clave', () => {
  it('lo dice el contrato, no quien la escribe', () => {
    /* Sale de sus operaciones, igual que la capacidad: escribirla a mano sería
       una tercera fuente, y la que se olvida es siempre la de a mano. */
    const action = defineAction({
      id: 'article.create',
      operations: { create },
      run: (input: Body, ops) => ops.create.run(input),
    })

    expect(action.idempotent).toBe(true)
  })

  it('alcanza con que una sola de sus operaciones la exija', () => {
    /* Una acción que lee y después escribe es **un intento**: si la escritura
       la pide, el intento entero la lleva. */
    const action = defineAction({
      id: 'article.createAfterCheck',
      operations: { list, create },
      run: (input: Body, ops) => ops.create.run(input),
    })

    expect(action.idempotent).toBe(true)
  })

  it('no la exige si ninguna la pide', () => {
    const action = defineAction({
      id: 'article.list',
      operations: { list },
      run: (input: Body, ops) => ops.list.run(input),
    })

    expect(action.idempotent).toBe(false)
  })
})

const NONE = new Map<string, string>()

describe('la clave se ata al cuerpo', () => {
  it('el mismo cuerpo es un reintento, y reusa la clave', () => {
    /* Generar una nueva al reintentar **anula toda la protección**, que es lo
       que la clave existe para dar. */
    const first = attemptKey(NONE, { name: 'Uno' }, true)
    const again = attemptKey(first.attempts, { name: 'Uno' }, true)

    expect(again.key).toBe(first.key)
  })

  it('un cuerpo distinto es otro intento, y saca clave nueva', () => {
    /* Es el caso que se lleva gente puesta: falla, el operador corrige un
       campo y vuelve a apretar. Con la clave retenida sería `409`. */
    const first = attemptKey(NONE, { name: 'Uno' }, true)
    const corrected = attemptKey(first.attempts, { name: 'Uno corregido' }, true)

    expect(corrected.key).not.toBe(first.key)
  })

  it('recuerda cada fila por separado, y no sólo la última', () => {
    /* **El caso de una grilla**: anulo A, falla; anulo B; reintento A. Con una
       sola ranura, A ya se había olvidado y salía con clave nueva — y el
       servidor lo aplicaba dos veces sin que nada se viera en pantalla. */
    const a = attemptKey(NONE, { id: 'A' }, true)
    const b = attemptKey(a.attempts, { id: 'B' }, true)
    const retryA = attemptKey(b.attempts, { id: 'A' }, true)

    expect(retryA.key).toBe(a.key)
    expect(b.key).not.toBe(a.key)
  })

  it('al salir bien se olvida, así dos intentos idénticos son dos', () => {
    /* La trampa que `CU-34` marca: dos cobros iguales el mismo día son dos
       cobros. Salen con claves distintas porque el primero, al terminar, dejó
       de estar pendiente. */
    const one = attemptKey(NONE, { amount: 100 }, true)
    const other = attemptKey(forgetAttempt(one.attempts, { amount: 100 }), { amount: 100 }, true)

    expect(other.key).not.toBe(one.key)
  })

  it('olvidar uno no toca a los demás', () => {
    const a = attemptKey(NONE, { id: 'A' }, true)
    const b = attemptKey(a.attempts, { id: 'B' }, true)
    const afterA = forgetAttempt(b.attempts, { id: 'A' })

    expect(attemptKey(afterA, { id: 'B' }, true).key).toBe(b.key)
    expect(attemptKey(afterA, { id: 'A' }, true).key).not.toBe(a.key)
  })

  it('no hay clave si el contrato no la pide', () => {
    expect(attemptKey(NONE, { name: 'Uno' }, false).key).toBeUndefined()
  })
})

describe('la puerta liga el servicio y la clave', () => {
  it('las dos llegan a la llamada sin que la acción escriba una línea', async () => {
    /* Es lo que permite declarar una acción en el módulo: acá se nombra contra
       qué habla, y quién lo cumple lo pone la puerta (`CU-36`, `CU-34`). */
    let seenKey: string | undefined
    let seenService: unknown
    const spy = operation('createArticle', fake, writes, async (service, body: Body, key) => {
      seenService = service
      seenKey = key
      return body.name
    })

    const ops = resolveOperations({ spy }, SERVICES, 'la-clave')
    await ops.spy.run({ name: 'Uno' })

    expect(seenKey).toBe('la-clave')
    expect(seenService).toBe(SERVICES.get('fake'))
  })

  it('falla al ejecutar si nadie registró el servicio que nombra', () => {
    /* Sin esto la llamada saldría contra `undefined` y reventaría adentro del
       adaptador, lejos de la causa. */
    expect(() => resolveOperations({ create }, new Map(), undefined)).toThrow(/fake/)
  })
})
