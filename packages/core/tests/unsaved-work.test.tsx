// @vitest-environment jsdom
import { cleanup, screen as dom, fireEvent, render } from '@testing-library/react'
import { act, useState } from 'react'
import { createMemoryRouter, Outlet, RouterProvider, useLocation, useNavigate } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { UnsavedWorkProvider, useUnsavedWork } from '../src/ui/unsaved-work'

/**
 * **El aviso antes de descartar** (`CU-47`).
 *
 * Lo que se prueba es lo que `GR-73` exige y lo que se decidió al aclarar:
 * aparece **al cerrar y en los dos abandonos**, y **no aparece al terminar** —
 * acaba de guardar, y avisar de algo que no va a pasar entrena a ignorar el
 * aviso.
 *
 * Y que **cancelar deje todo como estaba**: un aviso que igual te saca de la
 * pantalla es peor que no tenerlo.
 */

afterEach(cleanup)

/** Una pantalla con un formulario, que declara si tiene algo escrito. */
function Form() {
  const [typed, setTyped] = useState('')
  const navigate = useNavigate()

  useUnsavedWork(typed !== '')

  return (
    <>
      <input aria-label="dato" value={typed} onChange={(e) => setTyped(e.target.value)} />
      <button type="button" onClick={() => void navigate('/otra')}>
        irse
      </button>
    </>
  )
}

function Elsewhere() {
  return <span>otra pantalla</span>
}

function Where() {
  return <span data-testid="donde">{useLocation().pathname}</span>
}

/**
 * Como lo monta el marco: **un proveedor solo**, adentro del ruteador y
 * alrededor de las pantallas.
 *
 * `useBlocker` necesita el ruteador de datos, y afuera revienta al montar. Lo
 * encontró esta prueba antes de que llegara al navegador.
 */
function mount(entries: string[] = ['/form'], index?: number) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <UnsavedWorkProvider>
            <Where />
            <Outlet />
          </UnsavedWorkProvider>
        ),
        children: [
          { path: 'form', element: <Form /> },
          { path: 'otra', element: <Elsewhere /> },
        ],
      },
    ],
    { initialEntries: entries, initialIndex: index },
  )

  render(<RouterProvider router={router} />)

  return router
}

const where = () => dom.getByTestId('donde').textContent
const type = (value: string) => fireEvent.change(dom.getByLabelText('dato'), { target: { value } })
const leave = () => fireEvent.click(dom.getByText('irse'))

describe('sin nada escrito', () => {
  it('irse no pregunta', async () => {
    mount()

    await act(async () => {
      leave()
    })

    expect(where()).toBe('/otra')
  })
})

describe('con trabajo sin guardar', () => {
  it('irse pregunta, y mientras tanto no se mueve', async () => {
    mount()

    await act(async () => {
      type('algo')
    })
    await act(async () => {
      leave()
    })

    expect(where()).toBe('/form')
    expect(dom.getByText('Hay cambios sin guardar')).toBeDefined()
  })

  it('cancelar deja todo como estaba', async () => {
    /* Lo escrito sigue ahí y la pantalla no se movió: un aviso que igual te
       saca es peor que no tener aviso. */
    mount()

    await act(async () => {
      type('algo')
    })
    await act(async () => {
      leave()
    })
    await act(async () => {
      fireEvent.click(dom.getByText('Quedarme'))
    })

    expect(where()).toBe('/form')
    expect(dom.getByLabelText('dato')).toHaveProperty('value', 'algo')
  })

  it('confirmar sale y descarta', async () => {
    mount()

    await act(async () => {
      type('algo')
    })
    await act(async () => {
      leave()
    })
    await act(async () => {
      fireEvent.click(dom.getByText('Salir y descartar'))
    })

    expect(where()).toBe('/otra')
  })

  it('el botón «atrás» también pregunta, que es lo que se midió antes de decidirlo', async () => {
    /* La especificación decía que era imposible. El ruteador no cancela:
       rebota. Es la única forma que hay, y por eso está probada. */
    /* Se arranca con una entrada debajo: sin eso, «atrás» desde la primera no
       navega a ningún lado y no habría nada que bloquear. */
    const router = mount(['/otra', '/form'], 1)

    await act(async () => {
      type('algo')
    })
    await act(async () => {
      await router.navigate(-1)
    })

    expect(where()).toBe('/form')
    expect(dom.getByText('Hay cambios sin guardar')).toBeDefined()
  })

  it('no pregunta si la dirección cambia sin cambiar de pantalla', async () => {
    /* Filtrar una grilla reemplaza la entrada con la misma ruta. Preguntar ahí
       sería un aviso por teclear, y el operador aprendería a ignorarlo. */
    const router = mount()

    await act(async () => {
      type('algo')
    })
    await act(async () => {
      await router.navigate('/form?q=x', { replace: true })
    })

    expect(where()).toBe('/form')
    expect(dom.queryByText('Hay cambios sin guardar')).toBeNull()
  })
})

describe('la bandera se limpia sola', () => {
  it('irse de una pantalla sucia no deja preguntando a la siguiente', async () => {
    const router = mount()

    await act(async () => {
      type('algo')
    })
    await act(async () => {
      leave()
    })
    await act(async () => {
      fireEvent.click(dom.getByText('Salir y descartar'))
    })
    expect(where()).toBe('/otra')

    /* Ya en la otra pantalla, moverse otra vez no puede preguntar por un
       trabajo que se descartó. */
    await act(async () => {
      await router.navigate('/form')
    })

    expect(where()).toBe('/form')
    expect(dom.queryByText('Hay cambios sin guardar')).toBeNull()
  })
})
