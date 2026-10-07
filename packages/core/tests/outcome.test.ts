import { describe, expect, it } from 'vitest'
import { isFailure } from '../src/base/failure'
import { composeFeatures, defineFeature } from '../src/base/feature'
import { outcome } from '../src/base/outcome'
import { defineScreen } from '../src/base/registry'
import { moveFor } from '../src/data/dispatch-flow'

const Nada = () => null
const pantalla = defineScreen({ id: 'x', title: 'X', path: '/x', component: Nada })

const elegido = outcome<{ id: string }>('catalog.articleChosen')
const emitido = outcome<{ id: string }>('invoicing.issued')

/**
 * **Lo que este archivo ya no prueba, y dónde se prueba ahora.**
 *
 * `composeRouting` ataba un desenlace a un destino y fallaba al arrancar por
 * los dos lados. Eso lo hace el flujo (`CU-47`), y sus dos garantías están en
 * `verify-flows.test.ts` —comprobaciones 2 y 3— cada una con su caso roto.
 */

describe('los desenlaces de las funcionalidades', () => {
  it('se juntan de todas', () => {
    const a = defineFeature({ screens: [pantalla], root: pantalla, outcomes: { uno: elegido } })
    const b = defineFeature({ screens: [], root: pantalla, outcomes: { dos: emitido } })
    expect(composeFeatures([a, b]).outcomes).toHaveLength(2)
  })

  it('falla si dos funcionalidades declaran el mismo', () => {
    /* Misma razón que dos pantallas con la misma ruta: el ganador dependería
       del orden en que se juntaron. */
    const a = defineFeature({ screens: [pantalla], root: pantalla, outcomes: { uno: elegido } })
    const b = defineFeature({ screens: [], root: pantalla, outcomes: { otroNombre: elegido } })
    expect(() => composeFeatures([a, b])).toThrow(/declaran el desenlace/)
  })
})

describe('las fallas del marco', () => {
  it('se distinguen por su código, no por el texto del mensaje', () => {
    /* Un mensaje se reescribe cuando queda poco claro. Si una prueba depende
       de su texto, mejorarlo la rompe — y eso enseña a no mejorarlo (`CU-45`). */
    const repetido = intento(() =>
      composeFeatures([
        defineFeature({ screens: [pantalla], root: pantalla, outcomes: { uno: elegido } }),
        defineFeature({ screens: [], root: pantalla, outcomes: { otro: elegido } }),
      ]),
    )
    const sinPaso = intento(() =>
      moveFor(
        elegido({ id: '1' }),
        { flow: 'x', stack: [] },
        { flows: [], featureRootOf: {}, screens: [] },
      ),
    )

    expect(isFailure(repetido, 'declaration.duplicateOutcome')).toBe(true)
    expect(isFailure(sinPaso, 'navigation.unknownOutcome')).toBe(true)

    /* Y las dos son de la misma familia, así que quien sólo quiera saber si es
       del marco no necesita enumerarlas. */
    expect(isFailure(repetido)).toBe(true)
    expect(isFailure(new Error('cualquier otra cosa'))).toBe(false)
  })
})

function intento(run: () => unknown): unknown {
  try {
    run()
    return undefined
  } catch (error) {
    return error
  }
}
