import { describe, expect, it } from 'vitest'
import { isFailure } from '../src/base/failure'
import { constraintsOf } from '../src/ui/constraints-of'

/**
 * **Las restricciones de un formulario anidado** (feature 008).
 *
 * Se emiten por esquema, planas, y lo anidado es `{ type: 'object', ref }`. El
 * formulario nombra sus campos por el camino del valor en el cuerpo, así que
 * hay que recorrer los `ref` y prefijar. Lo que se prueba es lo que un
 * recorrido ingenuo hace mal: lo requerido de un objeto opcional.
 */

const ALL = {
  Input: {
    required: ['content'],
    fields: {
      content: { type: 'object', ref: 'Content' },
      reason: { type: 'string', maxLength: 512 },
    },
  },
  Content: {
    required: ['window'],
    fields: {
      window: { type: 'object', ref: 'Window' },
      policy: { type: 'object', ref: 'Policy' },
      share: { type: 'number', minimum: 0, maximum: 1 },
      tags: { type: 'array', maxItems: 4, items: { type: 'string', maxLength: 8 } },
    },
  },
  Window: {
    required: ['ttlMs'],
    fields: { ttlMs: { type: 'integer', minimum: 1 }, maxIds: { type: 'integer' } },
  },
  Policy: {
    required: ['version'],
    fields: { version: { type: 'string', minLength: 1 }, ceiling: { type: 'number' } },
  },
}

describe('constraintsOf', () => {
  it('aplana siguiendo ref, con el camino del valor como nombre', () => {
    const { fields } = constraintsOf(ALL, 'Input')
    expect(fields['reason']).toEqual({ type: 'string', maxLength: 512 })
    expect(fields['content.share']).toEqual({ type: 'number', minimum: 0, maximum: 1 })
    expect(fields['content.window.ttlMs']).toEqual({ type: 'integer', minimum: 1 })
    expect(fields['content.policy.ceiling']).toEqual({ type: 'number' })
    /* Un objeto no es un campo: sus hojas lo son. */
    expect(fields['content.window']).toBeUndefined()
  })

  it('una lista queda como lista, con lo que exige a cada renglón', () => {
    const { fields } = constraintsOf(ALL, 'Input')
    expect(fields['content.tags']?.items).toEqual({ type: 'string', maxLength: 8 })
  })

  it('lo requerido se arrastra sólo por una cadena de requeridos', () => {
    const { required } = constraintsOf(ALL, 'Input')
    /* `content` es requerido y `window` también: su `ttlMs` lo es. */
    expect(required).toContain('content.window.ttlMs')
    /* `policy` es opcional: su `version` es requerida sólo si la política viaja,
       y eso lo sabe quien arma el cuerpo, no las restricciones. */
    expect(required).not.toContain('content.policy.version')
  })

  it('arranca con un prefijo', () => {
    const { fields } = constraintsOf(ALL, 'Window', 'content.window')
    expect(Object.keys(fields)).toEqual(['content.window.ttlMs', 'content.window.maxIds'])
  })

  it('un ref que no existe es una falla con clase, no un campo sin reglas', () => {
    const broken = { Root: { required: [], fields: { x: { type: 'object', ref: 'Missing' } } } }
    let caught: unknown
    try {
      constraintsOf(broken, 'Root')
    } catch (error) {
      caught = error
    }
    expect(isFailure(caught, 'declaration.unknownConstraint')).toBe(true)
  })
})
