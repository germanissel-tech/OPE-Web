/**
 * @vitest-environment jsdom
 *
 * **Sólo las pruebas que dibujan piden un DOM**, y lo piden acá y no en la
 * configuración: el resto —el sobre, el esquema, la máquina de estados— corre
 * sin navegador, que es más rápido y no esconde una dependencia del DOM que no
 * debería existir.
 */

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { RequestFailed } from '../src/data/envelope'
import { type QueryLike, Result } from '../src/ui/result'

/* Sin globales no hay limpieza automática, y lo dibujado se acumula entre
   pruebas: la segunda encuentra dos veces lo mismo y no se entiende por qué. */
afterEach(cleanup)

const base = { error: undefined, isPending: false, isFetching: false, refetch: () => {} }
const conDatos = <T,>(data: T): QueryLike<T> => ({ ...base, data })

/* `filtered` va acá porque ahora es obligatorio, y el caso corriente es sin
   filtro. El que prueba el otro vacío lo pisa **después** del spread. */
const vacios = {
  empty: { title: 'Todavía no hay artículos' },
  noMatches: { title: 'Ningún filtro coincide' },
  filtered: false,
}

describe('los cuatro estados', () => {
  it('dibuja los datos cuando los hay', () => {
    render(
      <Result query={conDatos([{ id: 1 }])} {...vacios}>
        {(rows) => <p>{rows.length} artículos</p>}
      </Result>,
    )
    expect(screen.getByText('1 artículos')).toBeTruthy()
  })

  it('LOS DOS VACÍOS DICEN COSAS DISTINTAS', () => {
    /* Es el punto de control del tramo, y la razón por la que `CU-24` existe:
       la salida de «no hay nada todavía» es crear, y la de «los filtros no dan»
       es limpiar el filtro. Un solo vacío manda al operador al lugar
       equivocado la mitad de las veces. */
    const { unmount } = render(
      <Result query={conDatos([])} {...vacios}>
        {() => null}
      </Result>,
    )
    expect(screen.getByText('Todavía no hay artículos')).toBeTruthy()
    unmount()

    render(
      <Result query={conDatos([])} {...vacios} filtered>
        {() => null}
      </Result>,
    )
    expect(screen.getByText('Ningún filtro coincide')).toBeTruthy()
  })

  it('el error muestra el identificador del pedido', () => {
    /* Es lo único que convierte «no anda» en algo diagnosticable (`CU-4`). */
    const error = new RequestFailed(
      500,
      'INTERNAL_ERROR',
      '01JBQ2X8N4K3M7P9R2T5V8W1Y',
      'No se pudo',
    )
    render(
      <Result query={{ ...base, error, data: undefined }} {...vacios}>
        {() => null}
      </Result>,
    )
    expect(screen.getByText('01JBQ2X8N4K3M7P9R2T5V8W1Y')).toBeTruthy()
  })

  it('el error deja una salida', () => {
    let reintentos = 0
    const error = new RequestFailed(500, 'INTERNAL_ERROR', '01JBQ', 'No se pudo')
    render(
      <Result
        query={{
          ...base,
          error,
          data: undefined,
          refetch: () => {
            reintentos += 1
          },
        }}
        {...vacios}
      >
        {() => null}
      </Result>,
    )
    screen.getByRole('button', { name: 'Reintentar' }).click()
    expect(reintentos).toBe(1)
  })

  it('con datos viejos y una recarga en curso, NO los borra', () => {
    /* Una recarga típica es un cambio de filtro y dura menos de un segundo.
       Vaciar la pantalla en ese lapso le hace perder al operador la fila que
       estaba leyendo. */
    render(
      <Result query={{ ...base, data: [{ id: 1 }], isFetching: true }} {...vacios}>
        {(rows) => <p>{rows.length} artículos</p>}
      </Result>,
    )
    expect(screen.getByText('1 artículos')).toBeTruthy()
  })
})
