// @vitest-environment jsdom
import { act, cleanup, render, renderHook, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TablePagination } from '../src/ui/table-pagination'
import { useTableQuery } from '../src/ui/use-table-query'

/**
 * **Lo mecánico de una grilla servida** (`CU-14`, `CU-46`).
 *
 * Se prueba porque son las tres piezas que antes se copiaban en cada pantalla,
 * y lo que se copia mal acá no se ve: una paginación que se queda en la página
 * cuatro de un resultado de una, o un vacío que dice «no hay nada» cuando hay
 * una búsqueda puesta.
 */

afterEach(() => {
  vi.useRealTimers()
  /* Sin esto el DOM de la prueba anterior sigue montado, y una consulta por
     texto encuentra de más. Pasa desapercibido mientras cada prueba busca algo
     distinto — que es cómo estaba antes de agregar la segunda paginación. */
  cleanup()
})

/**
 * **El lugar vive en la URL** (`CU-47`), así que probarlo necesita un ruteador.
 *
 * Que haga falta no es un estorbo: es la prueba de que dejó de estar en
 * memoria. Con `useState` esto corría sin nada alrededor, y volver de una ficha
 * perdía el filtro.
 */
function inRouter(entry = '/catalog') {
  let seen = ''

  function useIt() {
    seen = useLocation().search
    return useTableQuery('articles')
  }

  const wrapper = ({ children }: { children: ReactNode }) => {
    const router = createMemoryRouter([{ path: '/catalog', element: <>{children}</> }], {
      initialEntries: [entry],
    })
    return <RouterProvider router={router} />
  }

  const { result } = renderHook(useIt, { wrapper })
  return { result, url: () => seen }
}

describe('el estado de una grilla', () => {
  it('separa lo que se escribe de lo que se consulta', () => {
    /* El control no se frena: lo que se demora es la consulta. Si fueran el
       mismo valor, el operador vería su texto aparecer a cuartos de segundo. */
    vi.useFakeTimers()
    const { result } = inRouter()

    act(() => result.current.filter('amox'))

    expect(result.current.search).toBe('amox')
    expect(result.current.query).toBe('')

    act(() => vi.advanceTimersByTime(500))

    expect(result.current.query).toBe('amox')
  })

  it('cambiar el filtro vuelve a la primera página, **cuando la consulta se asienta**', () => {
    /* Quedarse en la cuatro de un resultado que ahora tiene una es una pantalla
       vacía sin explicación, y el operador no sabe que le alcanza con volver.

       **Vuelve al asentarse y no al teclear**, que es lo que cambió al mudar el
       lugar a la URL: adelantarlo mostraría la página uno del resultado
       *anterior* por un cuarto de segundo, porque la consulta todavía no salió. */
    vi.useFakeTimers()
    const { result } = inRouter()

    act(() => result.current.setPage(4))
    expect(result.current.page).toBe(4)

    act(() => result.current.filter('amox'))
    expect(result.current.page).toBe(4)

    act(() => vi.advanceTimersByTime(500))
    expect(result.current.page).toBe(1)
  })

  it('«hay filtro» se decide con lo asentado, no con lo que se está tecleando', () => {
    /* Es la sutileza que esto se lleva adentro: el vacío elige cuál de los dos
       es con `filtered`, y mirarlo antes de tiempo mostraría «ningún resultado
       coincide» mientras la consulta de verdad todavía no salió. */
    vi.useFakeTimers()
    const { result } = inRouter()

    act(() => result.current.filter('amox'))
    expect(result.current.filtered).toBe(false)

    act(() => vi.advanceTimersByTime(500))
    expect(result.current.filtered).toBe(true)
  })
})

describe('el lugar viaja en la dirección', () => {
  it('el filtro y la página se leen de la URL, así que un enlace los trae puestos', () => {
    const { result } = inRouter('/catalog?articles.q=amox&articles.p=4')

    expect(result.current.query).toBe('amox')
    expect(result.current.search).toBe('amox')
    expect(result.current.page).toBe(4)
  })

  it('y se escriben en ella, que es lo que hace que cerrar los recupere', () => {
    vi.useFakeTimers()
    const { result, url } = inRouter()

    act(() => result.current.filter('amox'))
    act(() => vi.advanceTimersByTime(500))
    act(() => result.current.setPage(4))

    expect(url()).toContain('articles.q=amox')
    expect(url()).toContain('articles.p=4')
  })

  it('la primera página y el filtro vacío no ensucian la dirección', () => {
    /* Un `?q=&p=1` pegado en un enlace dice lo mismo que nada, y se ve peor. */
    const { result, url } = inRouter('/catalog?articles.q=amox&articles.p=4')

    act(() => result.current.setPage(1))

    expect(url()).not.toContain('articles.p=')
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
      return { articles: useTableQuery('articles'), lines: useTableQuery('lines') }
    }

    const wrapper = ({ children }: { children: ReactNode }) => {
      const router = createMemoryRouter([{ path: '/catalog', element: <>{children}</> }], {
        initialEntries: [entry],
      })
      return <RouterProvider router={router} />
    }

    const { result } = renderHook(useBoth, { wrapper })
    return { result, url: () => seen }
  }

  it('cada una lee lo suyo de la misma dirección', () => {
    const { result } = two('/catalog?articles.q=ibu&articles.p=4&lines.q=caja&lines.row=9')

    expect(result.current.articles.query).toBe('ibu')
    expect(result.current.articles.page).toBe(4)
    expect(result.current.lines.query).toBe('caja')
    expect(result.current.lines.currentRow).toBe('9')
    expect(result.current.articles.currentRow).toBeNull()
  })

  it('y paginar una no toca a la otra', () => {
    const { result, url } = two('/catalog?lines.p=3')

    act(() => result.current.articles.setPage(2))

    expect(url()).toContain('articles.p=2')
    expect(url()).toContain('lines.p=3')
  })
})

describe('la fila actual', () => {
  it('viaja en la dirección, así que volver de una ficha la encuentra', () => {
    const { result } = inRouter('/catalog?articles.row=7')

    expect(result.current.currentRow).toBe('7')
  })

  it('se suelta al cambiar de página: está en otra', () => {
    const { result, url } = inRouter('/catalog?articles.row=7')

    act(() => result.current.setPage(2))

    expect(url()).not.toContain('row=')
  })

  it('y al cambiar el filtro, porque con otro filtro puede no existir', () => {
    /* Una marca que apunta a nada confunde más que ninguna. */
    vi.useFakeTimers()
    const { result, url } = inRouter('/catalog?articles.row=7')

    act(() => result.current.filter('amox'))
    act(() => vi.advanceTimersByTime(500))

    expect(url()).not.toContain('row=')
  })
})

describe('escribir en la dirección no puede borrar la pila', () => {
  /**
   * **La comprobación que faltaba** (`CU-47`).
   *
   * `setSearchParams` arma una entrada nueva y descarta el `state`, así que
   * filtrar o paginar borraba la pila del flujo. **Y no fallaba**: sin estado el
   * marco reconstruye una pila plausible, y con dos escalones se ve igual.
   *
   * Las pruebas de acá miraban la URL, que seguía bien. Ésta mira el estado.
   */
  function conFlujo() {
    let visto: unknown = null

    function useIt() {
      visto = useLocation().state
      return useTableQuery('articles')
    }

    const wrapper = ({ children }: { children: ReactNode }) => {
      const router = createMemoryRouter([{ path: '/catalog', element: <>{children}</> }], {
        initialEntries: [
          {
            pathname: '/catalog',
            state: { cuarzoFlow: { flow: 'catalog', stack: [{ screen: 'articles', params: {} }] } },
          },
        ],
      })
      return <RouterProvider router={router} />
    }

    const { result } = renderHook(useIt, { wrapper })
    return { result, state: () => visto }
  }

  it('paginar conserva el flujo', () => {
    const { result, state } = conFlujo()

    act(() => result.current.setPage(3))

    expect(state()).toMatchObject({ cuarzoFlow: { flow: 'catalog' } })
  })

  it('marcar una fila conserva el flujo', () => {
    const { result, state } = conFlujo()

    act(() => result.current.setCurrentRow('7'))

    expect(state()).toMatchObject({ cuarzoFlow: { flow: 'catalog' } })
  })

  it('y filtrar también', () => {
    vi.useFakeTimers()
    const { result, state } = conFlujo()

    act(() => result.current.filter('amox'))
    act(() => vi.advanceTimersByTime(500))

    expect(state()).toMatchObject({ cuarzoFlow: { flow: 'catalog' } })
  })
})

describe('la paginación de una grilla', () => {
  it('no se dibuja con una sola página', () => {
    /* «1 de 1» ocupa lugar para no informar nada. */
    const { container } = render(
      <TablePagination
        meta={{ requestId: 'r', page: 1, size: 20, totalItems: 3, totalPages: 1 }}
        onPageChange={() => {}}
      />,
    )

    expect(container.innerHTML).toBe('')
  })

  it('no se dibuja mientras la consulta no volvió', () => {
    const { container } = render(<TablePagination meta={undefined} onPageChange={() => {}} />)

    expect(container.innerHTML).toBe('')
  })

  it('no se dibuja con un sobre a medias, en vez de inventar los que faltan', () => {
    /* El contrato da los cuatro o ninguno. Rellenar el que falte con un valor
       por omisión **es donde se copia el tamaño de página**: un 20 de este lado
       sobrevive al día que el servidor cambie el suyo, y nadie los compara. */
    const { container } = render(
      <TablePagination meta={{ requestId: 'r', page: 2, totalPages: 3 }} onPageChange={() => {}} />,
    )

    expect(container.innerHTML).toBe('')
  })

  it('usa el tamaño que el servidor dice que usó, y no uno propio', () => {
    /* `meta.size` es obligatorio en una respuesta paginada. Que llegue un 50 y
       se dibuje un 20 sería una paginación que miente sobre lo que muestra. */
    render(
      <TablePagination
        meta={{ requestId: 'r', page: 1, size: 50, totalItems: 120, totalPages: 3 }}
        onPageChange={() => {}}
      />,
    )

    expect(screen.getByText(/50/)).toBeDefined()
  })

  it('se dibuja cuando hay más de una', () => {
    render(
      <TablePagination
        meta={{ requestId: 'r', page: 2, size: 20, totalItems: 60, totalPages: 3 }}
        onPageChange={() => {}}
      />,
    )

    expect(screen.getByText(/3/)).toBeDefined()
  })
})

describe('la página viene de la dirección, así que puede venir cualquier cosa', () => {
  /**
   * **Lo que se veía no era un error**: la grilla decía «todavía no hay
   * artículos» con el catálogo lleno, porque `NaN` viajaba al servidor y volvía
   * una lista vacía. Y sin salida: la paginación no se dibuja sin resultados, y
   * el filtro estaba vacío. Había que editar la URL a mano.
   */
  it.each([
    ['abc', 'no es un número'],
    ['0', 'no hay página cero'],
    ['-3', 'ni negativa'],
    ['', 'ni vacía'],
    ['1.5', 'ni con decimales'],
  ])('«%s» cae en la primera: %s', (raw) => {
    const { result } = inRouter(`/catalog?articles.p=${raw}`)

    expect(result.current.page).toBe(1)
  })

  it('y una página de verdad se respeta', () => {
    /* La otra mitad: una regla que arregla todo también arregla lo que estaba
       bien, y eso no se nota hasta que alguien pagina. */
    const { result } = inRouter('/catalog?articles.p=4')

    expect(result.current.page).toBe(4)
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
   *
   * Estuvo tapado mientras el menú lateral recargaba la página, porque la grilla
   * se remontaba entera y no había nada viejo que reescribir. Apareció al
   * arreglar aquello, que es la forma en que un defecto espera a otro.
   */
  function externally(from: string, to: string) {
    let seen = ''

    function useIt() {
      seen = useLocation().search
      return useTableQuery('articles')
    }

    /* **El ruteador se arma una sola vez, y afuera del dibujo.** Adentro se
       recrea en cada render, y entonces navegar mueve uno que ya no está
       montado: la prueba pasaba a medir otra cosa. Es la regla 2 de `TAN-6`,
       que también vale para un arnés. */
    let mounted: ReturnType<typeof createMemoryRouter> | undefined

    const wrapper = ({ children }: { children: ReactNode }) => {
      mounted ??= createMemoryRouter([{ path: '/catalog', element: <>{children}</> }], {
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
    const { result, url, go } = externally('/catalog?articles.q=ibu', '/catalog')

    expect(result.current.search).toBe('ibu')

    await act(async () => {
      await go()
    })
    act(() => vi.advanceTimersByTime(500))

    expect(url()).toBe('')
    expect(result.current.query).toBe('')
  })

  it('y el control queda mostrando lo que dice la dirección, no lo anterior', async () => {
    vi.useFakeTimers()
    const { result, go } = externally('/catalog?articles.q=ibu', '/catalog?articles.q=amox')

    await act(async () => {
      await go()
    })
    act(() => vi.advanceTimersByTime(500))

    expect(result.current.search).toBe('amox')
  })
})
