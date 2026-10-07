// @vitest-environment jsdom
import { cleanup, screen as dom, render } from '@testing-library/react'
import { act } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { closes, defineFlow, omits, opens } from '../src/base/flow'
import { outcome } from '../src/base/outcome'
import { defineScreen } from '../src/base/registry'
import { CurrentScreenProvider } from '../src/base/routes'
import { moveFor, requiredFor, stateAt } from '../src/data/dispatch-flow'
import { FlowProvider, useFlow } from '../src/data/use-flow'

/**
 * **Que el flujo salga de la entrada del historial, y no de una copia.**
 *
 * Lo que se prueba acá es lo que las transiciones no pueden probar solas: que
 * retroceder traiga el estado de la entrada anterior **sin código nuestro**, y
 * que llegar sin estado —un enlace pegado— caiga en el flujo correcto.
 */

afterEach(cleanup)

const Nada = () => null

const grid = defineScreen({ id: 'grid', title: 'Catálogo', path: '/catalog', component: Nada })
const form = defineScreen({
  id: 'form',
  title: 'Ficha',
  path: '/catalog/:id',
  component: Nada,
})

const chose = outcome<{ id: string }>('catalog.chose')
const closed = outcome<Record<never, string>>('catalog.closed')

const wiring = {
  flows: [
    defineFlow({
      id: 'catalog',
      root: grid,
      steps: [opens(chose, form, ({ id }) => ({ id })), closes(closed)],
    }),
  ],
  featureRootOf: { grid: 'grid', form: 'grid' },
  screens: [grid, form],
}

/** Muestra el estado del flujo, y deja apretar «cerrar». */
function Probe() {
  const flow = useFlow()

  return (
    <>
      <span data-testid="flujo">{flow.state?.flow ?? '(ninguno)'}</span>
      <span data-testid="pila">{flow.state?.stack.map((each) => each.screen).join('>') ?? ''}</span>
      <button type="button" onClick={flow.close}>
        cerrar
      </button>
      <button type="button" onClick={() => flow.visit(grid)}>
        visitar
      </button>
    </>
  )
}

/**
 * El proveedor de pantalla actual tiene que envolver a `useFlow`, no colgar
 * adentro: se arma una ruta por pantalla, como hace el marco de verdad.
 */
function mount(entries: string[]) {
  const router = createMemoryRouter(
    [
      {
        path: '/catalog',
        element: (
          <CurrentScreenProvider screen="grid">
            <FlowProvider value={wiring}>
              <Probe />
            </FlowProvider>
          </CurrentScreenProvider>
        ),
      },
      {
        path: '/catalog/:id',
        element: (
          <CurrentScreenProvider screen="form">
            <FlowProvider value={wiring}>
              <Probe />
            </FlowProvider>
          </CurrentScreenProvider>
        ),
      },
    ],
    { initialEntries: entries },
  )
  render(<RouterProvider router={router} />)
  return router
}

describe('sin estado en la entrada', () => {
  it('entra al flujo que arranca en la raíz de su funcionalidad', () => {
    /* Un enlace pegado a la ficha: nadie apiló nada, y aun así hay flujo. */
    mount(['/catalog/7'])

    expect(dom.getByTestId('flujo').textContent).toBe('catalog')
  })

  it('la pila arranca con la pantalla actual, no vacía', () => {
    mount(['/catalog/7'])

    expect(dom.getByTestId('pila').textContent).toBe('form')
  })
})

describe('sobre una URL que ninguna pantalla declara', () => {
  /**
   * **El marco se dibuja igual sobre un 404**, y desde ahí su menú de usuario
   * lleva a algo suyo. Ahí no hay flujo sobre el cual apilar.
   *
   * Lo caro no es el momento: es que un identificador de flujo que no nombra a
   * ninguno **queda escrito en la entrada del historial**, sobrevive al F5, y a
   * partir de ahí cada desenlace revienta lejos de acá.
   */
  function mountLost() {
    const router = createMemoryRouter(
      [
        { path: '/catalog', element: <Probe /> },
        {
          path: '*',
          element: (
            <FlowProvider value={wiring}>
              <Probe />
            </FlowProvider>
          ),
        },
      ],
      { initialEntries: ['/una-ruta-vieja'] },
    )
    render(<RouterProvider router={router} />)
    return router
  }

  it('no hay flujo, y no se inventa uno', () => {
    mountLost()

    expect(dom.getByTestId('flujo').textContent).toBe('(ninguno)')
  })

  it('y llevar a una pantalla entra a su flujo, en vez de apilar sobre la nada', () => {
    const router = mountLost()

    act(() => {
      dom.getByText('visitar').click()
    })

    expect(router.state.location.pathname).toBe('/catalog')
    const guardado = router.state.location.state as Record<string, { flow: string } | undefined>
    expect(guardado?.cuarzoFlow?.flow).toBe('catalog')
  })
})

describe('con estado en la entrada', () => {
  it('lo lee tal cual, sin recalcularlo', async () => {
    const router = mount(['/catalog'])

    await act(async () => {
      await router.navigate('/catalog/7', {
        state: {
          cuarzoFlow: {
            flow: 'catalog',
            stack: [
              { screen: 'grid', params: {} },
              { screen: 'form', params: { id: '7' } },
            ],
          },
        },
      })
    })

    expect(dom.getByTestId('pila').textContent).toBe('grid>form')
  })

  it('retroceder trae el estado de la entrada anterior, sin código nuestro', async () => {
    const router = mount(['/catalog'])

    await act(async () => {
      await router.navigate('/catalog/7', {
        state: {
          cuarzoFlow: {
            flow: 'catalog',
            stack: [
              { screen: 'grid', params: {} },
              { screen: 'form', params: { id: '7' } },
            ],
          },
        },
      })
    })
    await act(async () => {
      await router.navigate(-1)
    })

    /* La entrada de la grilla nunca tuvo estado, así que se resuelve sola: el
       flujo de su raíz, con ella como único escalón. */
    expect(dom.getByTestId('pila').textContent).toBe('grid')
  })
})

describe('cuando no se puede decir en qué flujo está una pantalla', () => {
  /**
   * Las comprobaciones 5 y 6 del arranque lo vuelven imposible desde el
   * manifiesto, así que esto no se alcanza desde la aplicación. Se prueba
   * directo igual: **un guardia que nadie ejercita es una suposición**, y
   * devolver un flujo que no nombra a ninguno lo escribe en el historial, donde
   * sobrevive al F5 y revienta lejos de acá.
   */
  it('falla nombrando la pantalla y la raíz, en vez de devolver un flujo vacío', () => {
    const roto = { ...wiring, flows: [] }

    expect(() => stateAt('/catalog/7', null, roto)).toThrowError(/No hay flujo para "form"/)
  })
})

describe('un desenlace que el flujo no ofrece', () => {
  /**
   * **Los tres casos que antes contestaban lo mismo** (`CU-47`).
   *
   * Los tres devolvían `{ requires: [] }` —«no exige nada»—, que **dibuja el
   * control**. Así, un flujo sin declarar y un cierre legítimo se veían igual,
   * y el defecto aparecía recién al hacer clic, lejos de su causa.
   */
  const omitido = outcome<Record<never, string>>('catalog.omitido')

  const conOmision = {
    ...wiring,
    flows: [
      defineFlow({
        id: 'catalog',
        root: grid,
        steps: [opens(chose, form, ({ id }) => ({ id })), closes(closed), omits(omitido)],
      }),
    ],
  }

  const parado = { flow: 'catalog', stack: [{ screen: 'grid', params: {} }] }

  it('no se ofrece: el control no se dibuja', () => {
    expect(requiredFor(omitido.id, parado, conOmision)).toEqual({ requires: [], offered: false })
  })

  it('cerrar sigue sin exigir nada, que es otra cosa', () => {
    /* La diferencia que se perdía: no exigir permiso y no ofrecerse. */
    expect(requiredFor(closed.id, parado, conOmision)).toEqual({ requires: [] })
  })

  it('y si el flujo no dice nada, falla en vez de dibujar', () => {
    const mudo = { ...wiring, flows: [defineFlow({ id: 'catalog', root: grid, steps: [] })] }

    expect(() => requiredFor(chose.id, parado, mudo)).toThrowError(/no dice qué hace/)
  })

  it('informar algo omitido falla nombrando el flujo', () => {
    /* Llegar acá significa que alguien dibujó el control por su cuenta. Es un
       defecto, no una navegación. */
    expect(() => moveFor(omitido({}), parado, conOmision)).toThrowError(/omite/)
  })
})
