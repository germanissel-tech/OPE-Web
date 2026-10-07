// @vitest-environment jsdom
import { cleanup, screen as dom, render } from '@testing-library/react'
import { act } from 'react'
import { createMemoryRouter, RouterProvider, useLocation, useNavigate } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { closes, defineFlow, finishes, opens } from '../src/base/flow'
import { FLOW_KEY } from '../src/base/here'
import { type OutcomeEvent, outcome } from '../src/base/outcome'
import { defineScreen } from '../src/base/registry'
import {
  applyMove,
  type FlowContextData,
  type FlowNavigator,
  moveFor,
  stateAt,
} from '../src/data/dispatch-flow'

/**
 * **Los siete casos del botón «atrás»** (`CU-47`).
 *
 * El diseño entero se apoya en una sola propiedad: **el flujo y la pila son
 * estado de cada entrada del historial, no una variable de la aplicación**. Si
 * eso se cumple, «atrás» funciona sin código nuestro; si no, cada caso de acá
 * es un defecto distinto.
 *
 * **Las dos arrugas también se prueban.** No están acá porque estén bien: están
 * porque se decidieron, y una prueba es la diferencia entre un costo elegido y
 * un defecto que vuelve. Si alguien las cambia sin querer, esto falla.
 *
 * **Lo que no se puede probar acá es el F5**: ni la memoria ni jsdom recargan.
 * Va a `specs/003-la-pila-de-flujo/quickstart.md`, a mano y en un navegador.
 */

afterEach(cleanup)

const Nada = () => null

const grid = defineScreen({ id: 'grid', title: 'Catálogo', path: '/catalog', component: Nada })
const form = defineScreen({ id: 'form', title: 'Ficha', path: '/catalog/:id', component: Nada })
const receipt = defineScreen({
  id: 'receipt',
  title: 'Comprobante',
  path: '/receipt',
  component: Nada,
})
const other = defineScreen({ id: 'other', title: 'Otro', path: '/other', component: Nada })

const chose = outcome<{ id: string }>('catalog.chose')
const closed = outcome<Record<never, string>>('catalog.closed')
const saved = outcome<Record<never, string>>('catalog.saved')
const wentOther = outcome<Record<never, string>>('catalog.wentOther')

const otherFlow = defineFlow({ id: 'other', root: other, steps: [] })

const wiring: FlowContextData = {
  flows: [
    defineFlow({
      id: 'catalog',
      root: grid,
      steps: [
        opens(chose, form, ({ id }) => ({ id })),
        closes(closed),
        finishes(saved, receipt),
        opens(wentOther, otherFlow),
      ],
    }),
    otherFlow,
  ],
  featureRootOf: { grid: 'grid', form: 'grid', receipt: 'grid', other: 'other' },
  screens: [grid, form, receipt, other],
}

/** Lo mismo que hace la raíz de composición, con el ruteador de la prueba. */
function useEmit() {
  const location = useLocation()
  const navigate = useNavigate()

  const navigator: FlowNavigator = {
    back: (steps) => {
      void navigate(-steps)
    },
    visit: (url, state, replace) => {
      void navigate(url, { state, replace })
    },
  }

  return (event: OutcomeEvent) => {
    const state = stateAt(location.pathname, location.state, wiring)
    if (!state) return
    applyMove(moveFor(event, state, wiring), wiring, navigator)
  }
}

function Probe() {
  const location = useLocation()
  const state = stateAt(location.pathname, location.state, wiring)

  return (
    <>
      <span data-testid="donde">{location.pathname}</span>
      <span data-testid="flujo">{state?.flow}</span>
      <span data-testid="pila">{state?.stack.map((each) => each.screen).join('>')}</span>
    </>
  )
}

function mount(entries: string[]) {
  let emit: (event: OutcomeEvent) => void = () => undefined

  function Screen() {
    emit = useEmit()
    return <Probe />
  }

  const router = createMemoryRouter(
    wiring.screens.map((each) => ({ path: each.path, element: <Screen /> })),
    { initialEntries: entries },
  )
  render(<RouterProvider router={router} />)

  return { router, fire: (event: OutcomeEvent) => emit(event) }
}

const where = () => dom.getByTestId('donde').textContent
const stack = () => dom.getByTestId('pila').textContent

describe('1 · atrás después de abrir es exactamente cerrar', () => {
  it('vuelve a la grilla, con la pila de la entrada anterior', async () => {
    const { router, fire } = mount(['/catalog'])

    await act(async () => {
      fire(chose({ id: '7' }))
    })
    expect(where()).toBe('/catalog/7')
    expect(stack()).toBe('grid>form')

    await act(async () => {
      await router.navigate(-1)
    })

    expect(where()).toBe('/catalog')
    expect(stack()).toBe('grid')
  })
})

describe('2 · atrás cruzando un flujo abandonado', () => {
  it('vuelve el flujo anterior con su pila entera', async () => {
    const { router, fire } = mount(['/catalog'])

    await act(async () => {
      fire(chose({ id: '7' }))
    })
    await act(async () => {
      fire(wentOther({}))
    })

    expect(where()).toBe('/other')
    expect(dom.getByTestId('flujo').textContent).toBe('other')

    await act(async () => {
      await router.navigate(-1)
    })

    /* Abandonar no borra la historia: apila una entrada nueva, y la anterior
       sigue ahí con lo suyo. Atrás deshace el abandono. */
    expect(dom.getByTestId('flujo').textContent).toBe('catalog')
    expect(stack()).toBe('grid>form')
  })
})

describe('4 · llegar sin estado', () => {
  it('entra al flujo de la raíz de su funcionalidad, con la pantalla como único escalón', () => {
    mount(['/catalog/7'])

    expect(dom.getByTestId('flujo').textContent).toBe('catalog')
    expect(stack()).toBe('form')
  })
})

describe('5 · atrás y después actuar', () => {
  it('apilar trunca lo que había adelante, así que se sana solo', async () => {
    const { router, fire } = mount(['/catalog'])

    await act(async () => {
      fire(chose({ id: '7' }))
    })
    await act(async () => {
      await router.navigate(-1)
    })
    await act(async () => {
      fire(chose({ id: '9' }))
    })

    expect(where()).toBe('/catalog/9')

    /* Y adelante ya no lleva al 7: la acción lo truncó. */
    await act(async () => {
      await router.navigate(1)
    })
    expect(where()).toBe('/catalog/9')
  })
})

describe('6 · la arruga del «adelante» que queda vivo', () => {
  it('desenrollar deja la entrada de arriba alcanzable, y está aceptado', async () => {
    /* **Se prueba para fijarla, no porque esté bien.** La ventana dura hasta la
       próxima acción del flujo, y la alternativa —desenrollar y después apilar—
       está escrita en `CU-47` por si un día molesta. */
    const { router, fire } = mount(['/catalog'])

    await act(async () => {
      fire(chose({ id: '7' }))
    })
    await act(async () => {
      fire(closed({}))
    })
    expect(where()).toBe('/catalog')

    await act(async () => {
      await router.navigate(1)
    })

    expect(where()).toBe('/catalog/7')
  })
})

describe('7 · la arruga del «atrás» que no se ve', () => {
  it('después de terminar, retroceder deja la misma pantalla', async () => {
    /* Terminar reemplaza la entrada actual, así que quedan dos parecidas
       seguidas. Es la consecuencia normal de reemplazar, y va escrita. */
    const { router, fire } = mount(['/catalog'])

    await act(async () => {
      fire(chose({ id: '7' }))
    })
    await act(async () => {
      fire(saved({}))
    })
    expect(where()).toBe('/receipt')

    await act(async () => {
      await router.navigate(-1)
    })

    /* La entrada de abajo es la grilla, no la ficha: terminar se la llevó
       puesta, que es justamente lo que evita volver a un formulario enviado. */
    expect(where()).toBe('/catalog')
  })
})

describe('el estado que se guarda es serializable', () => {
  it('lo que viaja en la entrada sobrevive a ir y volver de JSON', async () => {
    /* Es lo que hace posible el F5, y lo único de eso que se puede probar acá:
       si un escalón llevara algo que no es primitivo, recargar lo perdería. */
    const { router, fire } = mount(['/catalog'])

    await act(async () => {
      fire(chose({ id: '7' }))
    })

    const stored = (router.state.location.state as Record<string, unknown>)[FLOW_KEY]

    expect(JSON.parse(JSON.stringify(stored))).toEqual(stored)
  })
})
