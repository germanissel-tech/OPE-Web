import { describe, expect, it } from 'vitest'
import { type FieldConstraints, shapeErrorOf } from '../src/ui/use-form'

/**
 * **Un renglón de una lista se valida con lo que el contrato le exige a cada
 * elemento** (`CU-38`).
 *
 * Lo que llega generado de un campo `array` trae `items`; un formulario con un
 * control por renglón valida cada uno con eso, como si fuera el campo entero.
 * Cuántos renglones hay lo decide el formulario con `minItems` y `maxItems`.
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

describe('un campo que es una lista', () => {
  it('cada renglón se valida con items, no con el campo', () => {
    expect(shapeErrorOf('https://una-tienda-larga.example', origins.items, true, strings)).toBe(
      'No puede pasar de 24.',
    )
    expect(shapeErrorOf('https://tienda.example', origins.items, true, strings)).toBeUndefined()
    expect(shapeErrorOf('', origins.items, true, strings)).toBe('Es obligatorio.')
  })

  it('cuántos renglones admite lo dice el campo', () => {
    expect(origins.minItems).toBe(1)
    expect(origins.maxItems).toBe(20)
  })
})
