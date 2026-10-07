// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useLoadedOnce } from '../src/data/use-loaded-once'

/**
 * **Lo que se leyó al abrir no se mueve** (`CU-29`).
 *
 * Es una prueba de dos renglones para el defecto más caro que encontró la
 * revisión de `004`: la referencia con que se compara y el testigo con que se
 * escribe salían de la consulta viva, y una consulta se mueve sola. Cuando se
 * movían, guardar después del diálogo de conflicto **le borraba el cambio al
 * otro operador con un testigo válido, sin rechazo y sin diálogo**.
 *
 * Se afirma la identidad y no la igualdad: lo que se devuelve tiene que ser
 * **el mismo objeto**, no uno que se le parezca.
 */
describe('lo que se leyó al abrir', () => {
  it('no se mueve, aunque la consulta traiga otra cosa', () => {
    const alAbrir = { price: '2450.00', version: '"1"' }

    const { result, rerender } = renderHook((value) => useLoadedOnce(value), {
      initialProps: alAbrir,
    })

    /* El otro operador guardó, la consulta se refrescó, y el registro vivo ya
       es otro. Acá no cambia nada. */
    rerender({ price: '3100.00', version: '"9"' })

    expect(result.current).toBe(alAbrir)
  })
})
