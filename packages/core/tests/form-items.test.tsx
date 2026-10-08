// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { type FieldConstraints, shapeErrorOf, useForm } from '../src/ui/use-form'
import { NoticesProvider } from '../src/ui/use-notices'

/**
 * **Un renglón de una lista se valida con lo que el contrato le exige a cada
 * elemento** (`CU-38`).
 *
 * Lo que llega generado de un campo `array` trae `items`; un formulario con un
 * control por renglón —`origins.0`, `origins.1`— valida cada uno con eso, como
 * si fuera el campo entero, y puede sacar un renglón sin que su error quede
 * bloqueando el envío.
 */

const strings = {
  required: 'Es obligatorio.',
  tooLong: (max: number) => `No puede pasar de ${max}.`,
  badFormat: 'Mal.',
  outOfRange: (min: number | undefined, max: number | undefined) => `Entre ${min} y ${max}.`,
}

const origins: FieldConstraints = {
  type: 'array',
  minItems: 1,
  maxItems: 20,
  items: { type: 'string', maxLength: 24 },
}

const constraints = { required: ['origins'], fields: { origins } }

const wrapper = ({ children }: { readonly children: ReactNode }) => (
  <NoticesProvider>{children}</NoticesProvider>
)

describe('un campo que es una lista', () => {
  it('cada renglón se valida con items, no con el campo', () => {
    expect(shapeErrorOf('https://una-tienda-larga.example', origins.items, true, strings)).toBe(
      'No puede pasar de 24.',
    )
    expect(shapeErrorOf('https://tienda.example', origins.items, true, strings)).toBeUndefined()
  })

  it('el formulario resuelve «origins.1» a los items de «origins», y es obligatorio', () => {
    const { result } = renderHook(
      () =>
        useForm<Record<string, string>>(
          { 'origins.0': 'https://tienda.example', 'origins.1': '' },
          constraints,
          strings,
        ),
      { wrapper },
    )

    expect(result.current.hasShapeErrors).toBe(true)

    act(() => {
      result.current.blur('origins.1')
    })
    expect(result.current.errorOf('origins.1')).toBe('Es obligatorio.')
    expect(result.current.errorOf('origins.0')).toBeUndefined()
  })

  it('sacar un renglón se lleva su error, y lo que queda se puede enviar', () => {
    const { result } = renderHook(
      () =>
        useForm<Record<string, string>>(
          {
            'origins.0': 'https://tienda.example',
            'origins.1': 'https://una-tienda-larga.example',
          },
          constraints,
          strings,
        ),
      { wrapper },
    )

    expect(result.current.attempt()).toBe(false)

    act(() => {
      result.current.unset('origins.1')
    })

    expect(Object.keys(result.current.values)).toEqual(['origins.0'])
    expect(result.current.hasShapeErrors).toBe(false)
    expect(result.current.attempt()).toBe(true)
  })
})
