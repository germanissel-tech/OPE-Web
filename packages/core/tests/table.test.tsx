// @vitest-environment jsdom
import { act, cleanup, render, renderHook, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StringsProvider } from '../src/base/use-strings'
import { LoadMoreCursor } from '../src/ui/load-more'
import { useTableQuery } from '../src/ui/use-table-query'

/**
 * **Lo mecánico de una grilla servida** (`CU-14`, `CU-46`).
 *
 * Se prueba porque son las piezas que antes se copiaban en cada pantalla, y lo
 * que se copia mal acá no se ve: un cursor que sobrevive a cambiar el filtro y
 * manda al servidor un tramo de otra colección, o un vacío que dice «no hay
 * nada» cuando hay una búsqueda puesta.
 */

afterEach(() => {
  vi.useRealTimers()
  /* Sin esto el DOM de la prueba anterior sigue montado, y una consulta por
     texto encuentra de más. */
  cleanup()
})

/**
 * **El lugar vive en la URL** (`CU-47`), así que probarlo necesita un ruteador.
 *
 * Que haga falta no es un estorbo: es la prueba de que dejó de estar en
 * memoria. Con `useState` esto corría sin nada alrededor, y volver de una ficha
 * perdía el filtro.
 */
function inRouter(entry = '/merchants') {
  let seen = ''

  function useIt() {
    seen = useLocation().search
    return useTableQuery('merchants')
  }

  const wrapper = ({ children }: { children: ReactNode }) => {
    const router = createMemoryRouter([{ path: '/merchants', element: <>{children}</> }], {
      initialEntries: [entry],
    })
    return <RouterProvider router={router} />
  }

  const { result } = renderHook(useIt, { wrapper })
  return { result, url: () => seen }
}

const CURSOR = 'eyJhZnRlciI6Im1yY183ZjNrNWQycTRtNngifQ'

describe('el estado de una grilla', () => {
  it('separa lo que se escribe de lo que se consulta', () => {
    /* El control no se frena: lo que se demora es la consulta. Si fueran el
       mismo valor, el operador vería su texto aparecer a cuartos de segundo. */
    vi.useFakeTimers()
    const { result } = inRouter()

    act(() => result.current.filter('tienda'))

    expect(result.current.search).toBe('tienda')
    expect(result.current.query).toBe('')

    act(() => vi.advanceTimersByTime(500))

    expect(result.current.query).toBe('tienda')
  })

  it('cambiar el filtro vuelve al principio, **cuando la consulta se asienta**', () => {
    /* Otro filtro es otra colección: el cursor del tramo anterior no le
       pertenece, y mandárselo al servidor es un `400` seguro.

       **Vuelve al asentarse y no al teclear**: adelantarlo mostraría el primer
       tramo del resultado *anterior* por un cuarto de segundo, porque la
       consulta todavía no salió. */
    vi.useFakeTimers()
    const { result } = inRouter()

    act(() => result.current.setCursor(CURSOR))
    expect(result.current.cursor).toBe(CURSOR)

    act(() => result.current.filter('tienda'))
    expect(result.current.cursor).toBe(CURSOR)

    act(() => vi.advanceTimersByTime(500))
    expect(result.current.cursor).toBeUndefined()
  })

  it('«hay filtro» se decide con lo asentado, no con lo que se está tecleando', () => {
    /* Es la sutileza que esto se lleva adentro: el vacío elige cuál de los dos
       es con `filtered`, y mirarlo antes de tiempo mostraría «ningún resultado
       coincide» mientras la consulta de verdad todavía no salió. */
    vi.useFakeTimers()
    const { result } = inRouter()

    act(() => result.current.filter('tienda'))
    expect(result.current.filtered).toBe(false)

    act(() => vi.advanceTimersByTime(500))
    expect(result.current.filtered).toBe(true)
  })
})

describe('el lugar viaja en la dirección', () => {
  it('el filtro y el cursor se leen de la URL, así que un enlace los trae puestos', () => {
    /* **Un enlace con cursor reproduce ese tramo**, que es lo que el servidor
       puede dar (`CU-47`, `ADR-020`). */
    const { result } = inRouter(`/merchants?merchants.q=tienda&merchants.c=${CURSOR}`)

    expect(result.current.query).toBe('tienda')
    expect(result.current.search).toBe('tienda')
    expect(result.current.cursor).toBe(CURSOR)
  })

  it('y se escriben en ella, que es lo que hace que cerrar los recupere', () => {
    vi.useFakeTimers()
    const { result, url } = inRouter()

    act(() => result.current.filter('tienda'))
    act(() => vi.advanceTimersByTime(500))
    act(() => result.current.setCursor(CURSOR))

    expect(url()).toContain('merchants.q=tienda')
    expect(url()).toContain(`merchants.c=${CURSOR}`)
  })

  it('el principio y el filtro vacío no ensucian la dirección', () => {
    /* Un `?q=&c=` pegado en un enlace dice lo mismo que nada, y se ve peor. */
    const { result, url } = inRouter(`/merchants?merchants.q=tienda&merchants.c=${CURSOR}`)

    act(() => result.current.setCursor(undefined))

    expect(url()).not.toContain('merchants.c=')
  })

  it('el cursor es opaco: viaja tal cual, sin interpretarlo', () => {
    /* Lo que venga se le da al servidor. Si es viejo, el servidor lo dice con
       un `400` y la salida es volver al principio — no hay nada que validar
       de este lado (`ADR-020`). */
    const { result } = inRouter('/merchants?merchants.c=lo-que-sea')

    expect(result.current.cursor).toBe('lo-que-sea')
  })
})

describe('dos grillas en una pantalla', () => {
  /**
   * **Es lo que el nombre obligatorio existe para impedir** (`CU-14`).
   *
   * Con nombres fijos, filtrar una filtraba la otra y el enlace compartido
   * reproducía el enredo — sin ruido, que es lo peor.
   */
  function two(entry: string) {
    let seen = ''

    function useBoth() {
      seen = useLocation().search
      return { merchants: useTableQuery('merchants'), experiments: useTableQuery('experiments') }
    }

    const wrapper = ({ children }: { children: ReactNode }) => {
      const router = createMemoryRouter([{ path: '/merchants', element: <>{children}</> }], {
        initialEntries: [entry],
      })
      return <RouterProvider router={router} />
    }

    const { result } = renderHook(useBoth, { wrapper })
    return { result, url: () => seen }
  }

  it('cada una lee lo suyo de la misma dirección', () => {
    const { result } = two(
      `/merchants?merchants.q=tienda&merchants.c=${CURSOR}&experiments.q=caja&experiments.row=9`,
    )

    expect(result.current.merchants.query).toBe('tienda')
    expect(result.current.merchants.cursor).toBe(CURSOR)
    expect(result.current.experiments.query).toBe('caja')
    expect(result.current.experiments.currentRow).toBe('9')
    expect(result.current.merchants.currentRow).toBeNull()
  })

  it('y cargar más en una no toca a la otra', () => {
    const { result, url } = two('/merchants?experiments.c=xyz')

    act(() => result.current.merchants.setCursor(CURSOR))

    expect(url()).toContain(`merchants.c=${CURSOR}`)
    expect(url()).toContain('experiments.c=xyz')
  })
})

describe('la fila actual', () => {
  it('viaja en la dirección, así que volver de una ficha la encuentra', () => {
    const { result } = inRouter('/merchants?merchants.row=7')

    expect(result.current.currentRow).toBe('7')
  })

  it('se suelta al cambiar de tramo: está en otro', () => {
    const { result, url } = inRouter('/merchants?merchants.row=7')

    act(() => result.current.setCursor(CURSOR))

    expect(url()).not.toContain('row=')
  })

  it('y al cambiar el filtro, porque con otro filtro puede no existir', () => {
    /* Una marca que apunta a nada confunde más que ninguna. */
    vi.useFakeTimers()
    const { result, url } = inRouter('/merchants?merchants.row=7')

    act(() => result.current.filter('tienda'))
    act(() => vi.advanceTimersByTime(500))

    expect(url()).not.toContain('row=')
  })
})

describe('escribir en la dirección no puede borrar la pila', () => {
  /**
   * **La comprobación que faltaba** (`CU-47`).
   *
   * `setSearchParams` arma una entrada nueva y descarta el `state`, así que
   * filtrar o cargar más borraba la pila del flujo. **Y no fallaba**: sin
   * estado el marco reconstruye una pila plausible, y con dos escalones se ve
   * igual.
   *
   * Las pruebas de acá miraban la URL, que seguía bien. Ésta mira el estado.
   */
  function conFlujo() {
    let visto: unknown = null

    function useIt() {
      visto = useLocation().state
      return useTableQuery('merchants')
    }

    const wrapper = ({ children }: { children: ReactNode }) => {
      const router = createMemoryRouter([{ path: '/merchants', element: <>{children}</> }], {
        initialEntries: [
          {
            pathname: '/merchants',
            state: {
              cuarzoFlow: { flow: 'merchants', stack: [{ screen: 'merchants', params: {} }] },
            },
          },
        ],
      })
      return <RouterProvider router={router} />
    }

    const { result } = renderHook(useIt, { wrapper })
    return { result, state: () => visto }
  }

  it('cargar más conserva el flujo', () => {
    const { result, state } = conFlujo()

    act(() => result.current.setCursor(CURSOR))

    expect(state()).toMatchObject({ cuarzoFlow: { flow: 'merchants' } })
  })

  it('marcar una fila conserva el flujo', () => {
    const { result, state } = conFlujo()

    act(() => result.current.setCurrentRow('7'))

    expect(state()).toMatchObject({ cuarzoFlow: { flow: 'merchants' } })
  })

  it('y filtrar también', () => {
    vi.useFakeTimers()
    const { result, state } = conFlujo()

    act(() => result.current.filter('tienda'))
    act(() => vi.advanceTimersByTime(500))

    expect(state()).toMatchObject({ cuarzoFlow: { flow: 'merchants' } })
  })
})

describe('«cargar más» de una colección por cursor', () => {
  /**
   * **Sin total, y por eso compuesto acá** (`GR-17`, `OW-4`): el `LoadMore` de
   * granito dice «N de M», y OPE no da M. Lo que se verifica es que diga lo que
   * puede decir, y que no ofrezca más cuando no hay.
   */
  const dibujar = (props: Parameters<typeof LoadMoreCursor>[0]) =>
    render(
      <StringsProvider>
        <LoadMoreCursor {...props} />
      </StringsProvider>,
    )

  it('dice cuántos hay, sin inventar un total', () => {
    dibujar({ loaded: 20, hasMore: true, onLoadMore: () => {} })

    expect(screen.getByText('20 cargados')).toBeDefined()
    expect(screen.queryByText(/de/)).toBeNull()
  })

  it('ofrece cargar más mientras el último tramo trajo cursor', () => {
    let pedidos = 0
    dibujar({
      loaded: 20,
      hasMore: true,
      onLoadMore: () => {
        pedidos++
      },
    })

    screen.getByRole('button', { name: 'Cargar más' }).click()
    expect(pedidos).toBe(1)
  })

  it('y cuando no hay más, lo dice en vez de dejar un botón que no hace nada', () => {
    dibujar({ loaded: 23, hasMore: false, onLoadMore: () => {} })

    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('No hay más')).toBeDefined()
  })

  it('mientras llega el tramo, el botón no se vuelve a apretar', () => {
    dibujar({ loaded: 20, hasMore: true, loading: true, onLoadMore: () => {} })

    expect(screen.getByRole('button').getAttribute('aria-disabled')).toBe('true')
  })
})

describe('cuando la dirección cambia por afuera, el filtro no vuelve solo', () => {
  /**
   * **El defecto que este `describe` fija.**
   *
   * `debounced` va atrasado por definición. Al cambiar la dirección desde
   * afuera —«atrás», un ítem del menú, un enlace pegado— el control se
   * sincroniza y el rebote **todavía trae lo que se había escrito antes**. El
   * efecto que asienta lo escribía de vuelta: el filtro reaparecía solo, y de
   * paso pisaba la entrada del historial recién creada.
   */
  function externally(from: string, to: string) {
    let seen = ''

    function useIt() {
      seen = useLocation().search
      return useTableQuery('merchants')
    }

    /* **El ruteador se arma una sola vez, y afuera del dibujo.** Adentro se
       recrea en cada render, y entonces navegar mueve uno que ya no está
       montado: la prueba pasaba a medir otra cosa. Es la regla 2 de `TAN-6`,
       que también vale para un arnés. */
    let mounted: ReturnType<typeof createMemoryRouter> | undefined

    const wrapper = ({ children }: { children: ReactNode }) => {
      mounted ??= createMemoryRouter([{ path: '/merchants', element: <>{children}</> }], {
        initialEntries: [from],
      })
      return <RouterProvider router={mounted} />
    }

    const { result } = renderHook(useIt, { wrapper })
    return {
      result,
      url: () => seen,
      go: () => mounted?.navigate(to),
    }
  }

  it('no se reescribe el filtro viejo sobre la dirección nueva', async () => {
    vi.useFakeTimers()
    const { result, url, go } = externally('/merchants?merchants.q=tienda', '/merchants')

    expect(result.current.search).toBe('tienda')

    await act(async () => {
      await go()
    })
    act(() => vi.advanceTimersByTime(500))

    expect(url()).toBe('')
    expect(result.current.query).toBe('')
  })

  it('y el control queda mostrando lo que dice la dirección, no lo anterior', async () => {
    vi.useFakeTimers()
    const { result, go } = externally(
      '/merchants?merchants.q=tienda',
      '/merchants?merchants.q=otra',
    )

    await act(async () => {
      await go()
    })
    act(() => vi.advanceTimersByTime(500))

    expect(result.current.search).toBe('otra')
  })
})
