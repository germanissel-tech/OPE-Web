import { describe, expect, it } from 'vitest'
import { isFailure } from '../src/base/failure'
import { defineAction, isEnabled, operation } from '../src/data/action'
import { defineService } from '../src/data/service'
import { resolveOperations } from '../src/data/use-action'

/* El núcleo no conoce ningún sistema: las pruebas arman el suyo. */
const fake = defineService<{ readonly ping: () => string }>('fake')
const SERVICES = new Map<string, unknown>([['fake', { ping: () => 'pong' }]])

const create = operation(
  'createArticle',
  fake,
  { capabilities: ['catalog:write'] },
  async (_service, body: { name: string }) => ({
    id: 7,
    ...body,
  }),
)
const attach = operation(
  'attachFile',
  fake,
  { capabilities: ['files:write'] },
  async () => undefined,
)

describe('una acción', () => {
  it('junta los operationId de lo que declara, para derivar la capacidad', () => {
    /* La unión, no la principal: una que empieza y no puede terminar deja el
       sistema a medias (`CU-37`, `CU-34`). */
    const action = defineAction({
      id: 'article.create',
      operations: { create, attach },
      run: (input: { name: string }, ops) => ops.create.run(input),
    })

    expect(action.operationIds).toEqual(['createArticle', 'attachFile'])
  })

  it('sólo recibe las operaciones que declaró', async () => {
    /* Llamar a una no declarada es imposible porque no la tiene a mano: no
       hace falta una comprobación que lo vigile (`CU-37`). */
    const action = defineAction({
      id: 'article.create',
      operations: { create },
      run: (input: { name: string }, ops) => ops.create.run(input),
    })

    const ops = resolveOperations(action.operations, SERVICES, undefined)
    expect(await action.run({ name: 'Ibuprofeno' }, ops)).toEqual({
      id: 7,
      name: 'Ibuprofeno',
    })
  })

  it('no compila si usa una operación que no declaró', () => {
    /* Lo verifica `tsc` en types.test-d.ts; acá queda el porqué. */
    expect(true).toBe(true)
  })

  it('falla al declararse si no invoca ninguna operación', () => {
    /* Sin operaciones no hay de dónde sacar qué capacidad exige, y el botón se
       dibujaría para cualquiera. */
    let caught: unknown
    try {
      defineAction({ id: 'vacia', operations: {}, run: async () => undefined })
    } catch (error) {
      caught = error
    }
    expect(isFailure(caught, 'declaration.actionWithoutOperations')).toBe(true)
  })

  it('falla si declara dos veces la misma operación', () => {
    let caught: unknown
    try {
      defineAction({
        id: 'repetida',
        operations: { a: create, b: create },
        run: async () => undefined,
      })
    } catch (error) {
      caught = error
    }
    expect(isFailure(caught, 'declaration.duplicateOperation')).toBe(true)
  })

  it('declara qué queda viejo, al lado de la acción', () => {
    /* Se declara acá y no en otro archivo para que se lea junto: el riesgo
       asumido es declarar de menos, y el síntoma es sutil (`CU-25`). */
    const action = defineAction({
      id: 'article.create',
      operations: { create },
      run: (input: { name: string }, ops) => ops.create.run(input),
      invalidates: () => [['demo', 'articles']],
    })

    expect(action.invalidates?.({ name: 'x' }, { id: 7, name: 'x' })).toEqual([
      ['demo', 'articles'],
    ])
  })
})

describe('la capacidad que exige', () => {
  it('es la unión de las capacidades de sus operaciones, no la de la principal', () => {
    /* Una acción que empieza y no puede terminar deja el sistema a medias
       (`CU-37`, `CU-34`). */
    const action = defineAction({
      id: 'article.create',
      operations: { create, attach },
      run: (input: { name: string }, ops) => ops.create.run(input),
    })

    expect(action.requires).toEqual(['catalog:write', 'files:write'])
  })

  it('no se ofrece si falta una sola de las capacidades', () => {
    const action = defineAction({
      id: 'article.create',
      operations: { create, attach },
      run: (input: { name: string }, ops) => ops.create.run(input),
    })

    expect(isEnabled(action, new Set(['catalog:write', 'files:write']))).toBe(true)
    /* Con `catalog:write` podría empezar y no terminar: no se ofrece. */
    expect(isEnabled(action, new Set(['catalog:write']))).toBe(false)
    expect(isEnabled(action, new Set())).toBe(false)
  })

  it('falla al declararse si ninguna operación exige una capacidad', () => {
    /* Sin capacidades el botón se dibujaría para cualquiera, que es lo contrario de
       lo que `CU-3` garantiza. */
    const libre = operation('free', fake, { capabilities: [] }, async () => undefined)
    let caught: unknown
    try {
      defineAction({ id: 'suelta', operations: { libre }, run: async () => undefined })
    } catch (error) {
      caught = error
    }
    expect(isFailure(caught, 'declaration.actionWithoutOperations')).toBe(true)
  })
})
