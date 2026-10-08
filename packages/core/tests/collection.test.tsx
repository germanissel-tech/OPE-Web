// @vitest-environment jsdom
import { QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { type Collection, useCollection } from '../src/data/collection'
import { RequestFailed, unwrap } from '../src/data/envelope'
import { createQueryClient } from '../src/data/query'
import {
  failing,
  lastMerchantPage,
  type Merchant,
  merchantPage,
  problems,
} from './fixtures/ope/responses'

/**
 * **Una colección por cursor acumula tramos, y se detiene sola** (`ADR-020`).
 *
 * Se prueba porque lo que se rompe acá no se ve con un solo tramo: con veinte
 * merchants todo anda, y recién con el veintiuno se nota si el segundo tramo
 * pisó al primero, si «cargar más» sigue ofrecido después del último, o si un
 * cursor viejo deja la grilla reintentando contra un `400`.
 */

afterEach(cleanup)

const wrapper = ({ children }: { readonly children: ReactNode }) => (
  <QueryClientProvider client={createQueryClient()}>{children}</QueryClientProvider>
)

/** Un servidor de dos tramos, que anota qué cursores le pidieron. */
function twoPages() {
  const asked: (string | undefined)[] = []
  const fetchPage = async (cursor: string | undefined): Promise<Collection<Merchant>> => {
    asked.push(cursor)
    return cursor === undefined ? merchantPage : lastMerchantPage
  }
  return { asked, fetchPage }
}

describe('una colección por cursor', () => {
  it('acumula los tramos en orden de llegada', async () => {
    const { fetchPage, asked } = twoPages()
    const { result } = renderHook(() => useCollection(['merchants'], fetchPage), { wrapper })

    await waitFor(() => expect(result.current.items).toHaveLength(1))
    expect(result.current.hasMore).toBe(true)

    /* TanStack avisa a sus observadores en un lote propio, después de que la
       promesa resuelve: lo que se afirma es el dibujo que sigue, no el instante. */
    await act(() => result.current.loadMore())
    await waitFor(() => expect(result.current.items).toHaveLength(2))

    expect(result.current.items.map((each) => each.merchantId)).toEqual([
      'mrc_7f3k5d2q4m6x',
      'mrc_2a9b4c8d1e3f',
    ])
    expect(asked).toEqual([undefined, merchantPage.nextCursor])
  })

  it('se detiene cuando el último tramo no trae cursor', async () => {
    const { fetchPage, asked } = twoPages()
    const { result } = renderHook(() => useCollection(['merchants'], fetchPage), { wrapper })

    await waitFor(() => expect(result.current.items).toHaveLength(1))
    await act(() => result.current.loadMore())
    await waitFor(() => expect(result.current.hasMore).toBe(false))

    /* Pedir más cuando no hay más no va al servidor. */
    await act(() => result.current.loadMore())
    expect(asked).toHaveLength(2)
  })

  it('anota en la dirección el cursor del tramo que llegó, no el del siguiente', async () => {
    /* Es lo que reproduce un enlace: el tramo que el operador está viendo
       (`CU-47`). */
    const { fetchPage } = twoPages()
    const cursors: (string | undefined)[] = []
    const { result } = renderHook(
      () => useCollection(['merchants'], fetchPage, { onCursor: (c) => cursors.push(c) }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.items).toHaveLength(1))
    await act(() => result.current.loadMore())

    expect(cursors).toEqual([merchantPage.nextCursor])
  })

  it('arranca desde el cursor de la dirección, y reproduce ese tramo', async () => {
    const { fetchPage, asked } = twoPages()
    const { result } = renderHook(
      () => useCollection(['merchants'], fetchPage, { from: merchantPage.nextCursor }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.items).toHaveLength(1))

    expect(asked).toEqual([merchantPage.nextCursor])
    expect(result.current.items[0]?.merchantId).toBe('mrc_2a9b4c8d1e3f')
    expect(result.current.hasMore).toBe(false)
  })

  it('no reintenta un 4xx: un cursor viejo es un error que el operador tiene que ver', async () => {
    let calls = 0
    const fetchPage = async (): Promise<Collection<Merchant>> => {
      calls++
      return unwrap(failing(problems.validationFailed))
    }
    const { result } = renderHook(() => useCollection(['merchants'], fetchPage), { wrapper })

    await waitFor(() => expect(result.current.error).toBeInstanceOf(RequestFailed))

    expect(calls).toBe(1)
    expect((result.current.error as RequestFailed).type).toBe('validation-failed')
    expect(result.current.items).toEqual([])
  })

  it('cargar más no cuenta como recarga: lo que está en pantalla no se atenúa', async () => {
    let release: (() => void) | undefined
    const fetchPage = async (cursor: string | undefined): Promise<Collection<Merchant>> => {
      if (cursor === undefined) return merchantPage
      await new Promise<void>((resolve) => {
        release = resolve
      })
      return lastMerchantPage
    }
    const { result } = renderHook(() => useCollection(['merchants'], fetchPage), { wrapper })

    await waitFor(() => expect(result.current.items).toHaveLength(1))

    let pending: Promise<void> | undefined
    act(() => {
      pending = result.current.loadMore()
    })

    await waitFor(() => expect(result.current.loadingMore).toBe(true))
    expect(result.current.isFetching).toBe(false)

    await act(async () => {
      release?.()
      await pending
    })

    await waitFor(() => expect(result.current.loadingMore).toBe(false))
    expect(result.current.items).toHaveLength(2)
  })
})
