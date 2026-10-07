import { describe, expect, it } from 'vitest'
import { closes, defineFlow, finishes, group, omits, opens } from '../src/base/flow'
import { outcome } from '../src/base/outcome'
import { defineScreen } from '../src/base/registry'
import { type FlowInput, verifyFlows } from '../src/base/verify-flows'

/**
 * **Las seis comprobaciones de arranque, cada una con su caso roto** (`CU-47`).
 *
 * Que pasen no dice nada: lo que las hace valer es que **fallen cuando tienen
 * que fallar**. Por eso cada `describe` empieza por lo roto y termina con el
 * caso sano — al revés de lo cómodo.
 */

const Nada = () => null

const grid = defineScreen({ id: 'grid', title: 'Catálogo', path: '/catalog', component: Nada })
const form = defineScreen({
  id: 'form',
  title: 'Ficha',
  path: '/catalog/:id',
  component: Nada,
})

const other = defineScreen({ id: 'other', title: 'Otra', path: '/other', component: Nada })

const chose = outcome<{ id: number }>('catalog.chose')
const closed = outcome<Record<never, string>>('catalog.closed')

const sane = (): FlowInput => ({
  flows: [
    defineFlow({
      id: 'catalog',
      root: grid,
      steps: [opens(chose, form, ({ id }) => ({ id: String(id) })), closes(closed)],
    }),
  ],
  screens: [grid, form],
  featureRootOf: { grid: 'grid', form: 'grid' },
  outcomes: [chose, closed],
  outcomesOf: { grid: [chose.id, closed.id] },
})

/** Lo que dice, en una sola cadena, para poder buscar adentro. */
const said = (input: FlowInput) => verifyFlows(input).join(' · ')

describe('lo sano pasa', () => {
  it('sin problemas', () => {
    expect(verifyFlows(sane())).toEqual([])
  })
})

describe('1 · una pantalla que ningún flujo alcanza', () => {
  it('falla, y la nombra', () => {
    const orphan = defineScreen({
      id: 'huerfana',
      title: 'Huérfana',
      path: '/huerfana',
      component: Nada,
    })

    expect(said({ ...sane(), screens: [grid, form, orphan] })).toContain('"huerfana"')
  })

  it('el caso real: alguien borra el paso que la abría', () => {
    /* Sin esto, la ficha sigue teniendo ruta y entrando por URL, y nadie se
       entera de que ya no la abre nada. */
    const input = sane()
    const flows = [defineFlow({ id: 'catalog', root: grid, steps: [closes(closed)] })]

    expect(said({ ...input, flows, outcomes: [closed] })).toContain('"form"')
  })
})

describe('2 · cada flujo dice qué hace con cada desenlace de lo que toca', () => {
  const mute = outcome<Record<never, string>>('catalog.nadieEscucha')

  /** El catálogo declara un tercero, y el flujo no dice nada sobre él. */
  const withThird = () => {
    const input = sane()
    return {
      ...input,
      outcomes: [chose, closed, mute],
      outcomesOf: { grid: [chose.id, closed.id, mute.id] },
    }
  }

  it('falla si el flujo no dice nada: es un botón que informa algo que nadie escucha', () => {
    expect(said(withThird())).toContain('"catalog.nadieEscucha"')
  })

  it('y el mensaje ofrece las dos salidas, para que no haya que adivinar cuál', () => {
    /* **El mensaje es el producto acá.** Quien lo lee —muchas veces un agente—
       tiene que poder actuar sin inventar: o el paso, o la omisión. Un mensaje
       que sólo dice «falta algo» se completa con lo que parezca razonable. */
    const dicho = said(withThird())

    expect(dicho).toContain('opens')
    expect(dicho).toContain('omits')
  })

  it('omitir alcanza: decir «acá no se ofrece» es decir algo', () => {
    const input = withThird()
    const flows = [
      defineFlow({
        id: 'catalog',
        root: grid,
        steps: [opens(chose, form, ({ id }) => ({ id: String(id) })), closes(closed), omits(mute)],
      }),
    ]

    expect(verifyFlows({ ...input, flows })).toEqual([])
  })

  it('**el caso que esto existe para agarrar**: la misma pantalla en un segundo flujo mudo', () => {
    /* Con la pregunta hecha en general, `catalog.chose` cuenta como mapeado
       porque **algún** flujo lo mapea — y el segundo arranca en verde y revienta
       al hacer clic. Es justo el caso que `CU-47` existe para permitir. */
    const input = sane()
    const flows = [...input.flows, defineFlow({ id: 'venta', root: grid, steps: [] })]

    expect(said({ ...input, flows })).toContain('El flujo "venta"')
  })
})

describe('3 · un paso que apunta a un desenlace que ya nadie declara', () => {
  it('falla, y es el que CU-44 marca como el que se pudre en silencio', () => {
    /* Queda vivo después de borrar la funcionalidad que lo usaba: nada lo
       ejecuta nunca, y nada lo denuncia. */
    expect(said({ ...sane(), outcomes: [closed] })).toContain('"catalog.chose"')
  })
})

describe('4 · un paso que lleva a un flujo que no existe', () => {
  it('falla cuando el flujo destino no está declarado', () => {
    const ghost = defineFlow({ id: 'fantasma', root: other, steps: [] })
    const flows = [
      defineFlow({ id: 'catalog', root: grid, steps: [opens(chose, ghost), closes(closed)] }),
    ]

    expect(said({ ...sane(), flows })).toContain('un flujo que no existe')
  })

  it('y también cuando viene diferido y todavía no está', () => {
    /* Es el caso del ciclo de módulos: la función se puede llamar y devolver
       basura. Que la comprobación no explote es parte de lo que hace. */
    const flows = [
      defineFlow({
        id: 'catalog',
        root: grid,
        steps: [
          opens(chose, () => {
            throw new Error('todavía no')
          }),
          closes(closed),
        ],
      }),
    ]

    expect(said({ ...sane(), flows })).toContain('un flujo que no existe')
  })
})

describe('5 · toda pantalla dice de qué funcionalidad es', () => {
  it('falla si una pantalla no está en el mapa', () => {
    /* **El caso que se escapaba.** El mapa lleva una entrada por pantalla, no
       por raíz, y antes esto recorría sus valores: con `form` afuera, las seis
       aprobaban. La pantalla anda igual hasta que alguien la abre desde un
       favorito y no hay con qué armar la pila. */
    expect(said({ ...sane(), featureRootOf: { grid: 'grid' } })).toContain(
      'no declara de qué funcionalidad es',
    )
  })

  it('y falla si dice venir de una pantalla que no existe', () => {
    /* Se busca **su** mensaje y no el nombre: una raíz ajena dispara también
       la comprobación 6, y buscar «ajena» a secas daba verde con ésta sacada.
       Lo encontró mutarla. */
    expect(said({ ...sane(), featureRootOf: { grid: 'ajena', form: 'ajena' } })).toContain(
      'no está entre las pantallas registradas',
    )
  })
})

describe('6 · la raíz tiene que arrancar exactamente un flujo', () => {
  it('falla si ninguno arranca ahí: el enlace pegado no sabría en qué flujo entra', () => {
    const flows = [defineFlow({ id: 'otro', root: other, steps: [closes(closed)] })]

    expect(said({ ...sane(), flows, outcomes: [closed] })).toContain('Ningún flujo arranca')
  })

  it('falla si arrancan dos, por la misma razón', () => {
    const input = sane()
    const flows = [
      ...input.flows,
      defineFlow({ id: 'segundo', root: grid, steps: [finishes(closed)] }),
    ]

    expect(said({ ...input, flows })).toContain('2 flujos arrancan')
  })
})

describe('las devuelve todas, no la primera', () => {
  it('quien arregla una quiere saber si quedan otras', () => {
    const problems = verifyFlows({
      flows: [],
      screens: [grid, form],
      featureRootOf: { grid: 'grid', form: 'grid' },
      outcomes: [chose],
      outcomesOf: { grid: [chose.id] },
    })

    expect(problems.length).toBeGreaterThan(2)
  })
})

describe('dos grupos del menú con el mismo rótulo', () => {
  it('falla: el rótulo es la identidad del grupo', () => {
    /* De ahí sale el `id` con el que el menú decide cuál está desplegado.
       Repetido, abrir uno abre los dos — y React avisa por claves duplicadas,
       que es el aviso que nadie relaciona con esto. */
    const input = sane()
    const otro = defineFlow({ id: 'otro', root: other, steps: [] })

    expect(
      said({
        ...input,
        flows: [...input.flows, otro],
        featureRootOf: { ...input.featureRootOf, other: 'other' },
        screens: [...input.screens, other],
        menu: [group('Maestros', input.flows), group('Maestros', [otro])],
      }),
    ).toContain('Dos grupos del menú se llaman "Maestros"')
  })
})
