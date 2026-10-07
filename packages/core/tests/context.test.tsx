// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { defineWorkContext, readContext, writeContext } from '../src/base/context'
import { isFailure } from '../src/base/failure'
import { useWorkContext, WorkContextProvider } from '../src/base/use-work-context'

/**
 * **Los contextos de trabajo, y sus dos reglas** (`CU-26`).
 *
 * Se prueban acá porque **fallan en silencio y tarde**. Que un contexto se herede
 * entre dos operadores necesita dos personas y una misma máquina; que sobreviva
 * a cerrar la pestaña, cerrarla. Nadie ensaya eso, y el día que pasa el síntoma
 * es que alguien operó sobre quien no era.
 */

const branch = defineWorkContext('branch', 'machine')
const customer = defineWorkContext('customer', 'tab')

afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
})

const withSubject =
  (subject: string | undefined) =>
  ({ children }: { readonly children: ReactNode }) => (
    <WorkContextProvider subject={subject} contexts={[branch, customer]}>
      {children}
    </WorkContextProvider>
  )

describe('se estampa con el sujeto', () => {
  it('otro operador en la misma máquina no hereda nada', () => {
    /* Es el caso de un mostrador: una persona marca un cliente, se va, y entra
       otra. La segunda no puede seguir parada sobre el de la primera. */
    writeContext(customer, 'ana', '4821')

    expect(readContext(customer, 'ana')).toBe('4821')
    expect(readContext(customer, 'bruno')).toBeUndefined()
  })

  it('sin sujeto no se lee ni se guarda', () => {
    /* Lo guardado siempre pertenece a alguien: sin saber a quién, no se puede
       decir que sea de quien está. */
    writeContext(branch, undefined, '7')

    expect(readContext(branch, undefined)).toBeUndefined()
    expect(localStorage.length).toBe(0)
  })
})

describe('cuánto vive cada uno', () => {
  it('el estable aguanta cerrar el navegador', () => {
    /* La sucursal casi nunca cambia, y volver a elegirla cada mañana es
       fricción diaria. */
    writeContext(branch, 'ana', '7')

    expect(localStorage.getItem('cuarzo.context.ana.branch')).toBe('7')
    expect(sessionStorage.length).toBe(0)
  })

  it('el efímero es de la pestaña, para que dos no se pisen', () => {
    /* Dos pestañas pueden trabajar sobre dos clientes distintos, y no se vuelve
       mañana parado sobre alguien de ayer. */
    writeContext(customer, 'ana', '4821')

    expect(sessionStorage.getItem('cuarzo.context.ana.customer')).toBe('4821')
    expect(localStorage.length).toBe(0)
  })
})

describe('lo que se guarda', () => {
  it('es un identificador, y no hay dónde poner otra cosa', () => {
    /* La regla no la sostiene nadie que se acuerde: **el valor es un `string`**.
       El nombre, el saldo y la condición no tienen dónde entrar. */
    writeContext(customer, 'ana', '4821')

    expect(sessionStorage.getItem('cuarzo.context.ana.customer')).toBe('4821')
  })

  it('se puede soltar, y entonces no queda nada', () => {
    writeContext(customer, 'ana', '4821')
    writeContext(customer, 'ana', undefined)

    expect(readContext(customer, 'ana')).toBeUndefined()
  })
})

describe('el que lo usa', () => {
  it('lee lo que había al primer dibujo, sin un cuadro sin contexto antes', () => {
    writeContext(branch, 'ana', '7')

    const { result } = renderHook(() => useWorkContext(branch), { wrapper: withSubject('ana') })

    expect(result.current[0]).toBe('7')
  })

  it('cambiarlo lo guarda, y lo ve todo el que mire el mismo', () => {
    /* Sin un lugar común, dos partes de la pantalla operarían sobre dos
       personas distintas. */
    const { result } = renderHook(
      () => [useWorkContext(customer), useWorkContext(customer)] as const,
      { wrapper: withSubject('ana') },
    )

    act(() => result.current[0][1]('4821'))

    expect(result.current[1][0]).toBe('4821')
    expect(readContext(customer, 'ana')).toBe('4821')
  })

  it('uno sin declarar falla, en vez de leer vacío para siempre', () => {
    /* Leería vacío y **nadie se enteraría**: el operador elegiría una sucursal
       que no se guarda en ningún lado. */
    const undeclared = defineWorkContext('warehouse', 'machine')

    let caught: unknown
    try {
      renderHook(() => useWorkContext(undeclared), { wrapper: withSubject('ana') })
    } catch (error) {
      caught = error
    }

    expect(isFailure(caught, 'declaration.unknownContext')).toBe(true)
  })
})
